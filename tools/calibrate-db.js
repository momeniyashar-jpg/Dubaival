#!/usr/bin/env node
/**
 * DubaiVal DB Calibrator
 * Reads DLD transaction CSV file, calculates real PSF per building/area,
 * outputs a small JSON file for DB calibration + new building discovery.
 *
 * Covers ALL property types: Residential, Commercial, Land
 * Compares against existing DB to flag NEW buildings for coverage expansion.
 *
 * Usage (NO npm install needed):
 *   node tools/calibrate-db.cjs C:\Users\momen\Downloads\transactions_2026-05-26_02-03-11_2.csv
 *
 * Output: tools/calibration-output.json
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// --- Load existing DB keys from js/data.js ---
let existingDB = {};
let existingAreas = {};
try {
  const dataPath = path.join(__dirname, '..', 'js', 'data.js');
  const dataContent = fs.readFileSync(dataPath, 'utf8');
  const dbMatch = dataContent.match(/var DB\s*=\s*(\{[\s\S]*?\});/);
  if (dbMatch) {
    existingDB = JSON.parse(dbMatch[1]);
    console.log('Loaded existing DB:', Object.keys(existingDB).length, 'buildings');
  } else {
    console.warn('WARNING: Could not parse DB from js/data.js — all buildings will show as "new"');
  }
  const areasMatch = dataContent.match(/const AREAS\s*=\s*(\{[\s\S]*?\});/);
  if (areasMatch) {
    existingAreas = JSON.parse(areasMatch[1]);
    console.log('Loaded existing AREAS:', Object.keys(existingAreas).length, 'areas');
  }
} catch (e) {
  console.warn('WARNING: Could not load js/data.js:', e.message);
  console.warn('All buildings will be marked as "new"');
}

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node tools/calibrate-db.js <path-to-excel-file>');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error('File not found:', inputFile);
  process.exit(1);
}

console.log('Reading:', inputFile);
console.log('File size:', (fs.statSync(inputFile).size / 1e9).toFixed(2), 'GB');
console.log('This may take 5-15 minutes for large files...\n');

// Separate stores per category
const data = {
  residential: { buildings: {}, areas: {} },
  commercial:  { buildings: {}, areas: {} },
  land:        { buildings: {}, areas: {} },
};

// Community/cluster discovery
const communityMap = {};  // area → { master_projects: { name → { projects: { name → { buildings: Set } } } } }
const areaTransCount = {}; // area → total transaction count

let totalRows = 0;
let salesRows = 0;
let rentRows = 0;
let skipped = 0;
const usageStats = {};  // count per usage type
const transStats = {};  // count per transaction group

let COL = {};

function classifyUsage(usage, propType, subType) {
  const u = (usage || '').toLowerCase();
  const pt = (propType || '').toLowerCase();
  const st = (subType || '').toLowerCase();

  if (u.includes('resid') || pt.includes('flat') || pt.includes('villa') ||
      st.includes('apartment') || st.includes('villa') || st.includes('townhouse') ||
      st.includes('penthouse') || st.includes('duplex'))
    return 'residential';

  if (u.includes('commerc') || u.includes('office') || u.includes('retail') ||
      pt.includes('office') || pt.includes('shop') || pt.includes('warehouse') ||
      st.includes('office') || st.includes('retail') || st.includes('shop') ||
      st.includes('warehouse') || st.includes('showroom'))
    return 'commercial';

  if (u.includes('land') || pt.includes('land') || st.includes('land') ||
      st.includes('plot'))
    return 'land';

  // If still unclear, try to infer from property type
  if (pt.includes('unit') || pt.includes('building')) return 'residential';
  if (pt.includes('land')) return 'land';

  return 'residential'; // default
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { fields.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  fields.push(current.trim());
  return fields;
}

async function run() {
  const rl = readline.createInterface({
    input: fs.createReadStream(inputFile, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let headerFound = false;

  for await (const line of rl) {
    if (!line.trim()) continue;
    totalRows++;

    if (totalRows % 100000 === 0) {
      process.stdout.write('\rProcessed: ' + totalRows.toLocaleString() + ' rows | Sales: ' + salesRows.toLocaleString() + ' | Rent: ' + rentRows.toLocaleString());
    }

    const fields = parseCSVLine(line);

    if (!headerFound) {
      fields.forEach((name, idx) => {
        const n = name.toLowerCase();
        if (n === 'trans_group_en') COL.transGroup = idx;
        if (n === 'procedure_name_en') COL.procName = idx;
        if (n === 'instance_date') COL.date = idx;
        if (n === 'property_type_en') COL.propType = idx;
        if (n === 'property_sub_type_en') COL.subType = idx;
        if (n === 'property_usage_en') COL.usage = idx;
        if (n === 'area_name_en') COL.area = idx;
        if (n === 'building_name_en') COL.building = idx;
        if (n === 'project_name_en') COL.project = idx;
        if (n === 'master_project_en') COL.masterProject = idx;
        if (n === 'rooms_en') COL.rooms = idx;
        if (n === 'procedure_area') COL.areaSqm = idx;
        if (n === 'actual_worth') COL.price = idx;
        if (n === 'meter_sale_price') COL.meterPrice = idx;
        if (n === 'rent_value') COL.rent = idx;
        if (n === 'meter_rent_price') COL.meterRent = idx;
      });
      headerFound = true;
      console.log('Columns mapped:', JSON.stringify(COL, null, 2));
      console.log('Header fields:', fields.length);
      if (COL.price === undefined || COL.areaSqm === undefined) {
        console.error('ERROR: Could not find price/area columns');
        console.error('Available columns:', fields.join(', '));
        process.exit(1);
      }
      continue;
    }

    const getVal = (idx) => {
      if (idx === undefined) return '';
      return (fields[idx] || '').trim();
    };
    const getNum = (idx) => {
      if (idx === undefined) return 0;
      const raw = (fields[idx] || '').trim();
      if (!raw) return 0;
      const v = parseFloat(raw.replace(/,/g, ''));
      return isNaN(v) ? 0 : v;
    };

    const transGroup = getVal(COL.transGroup);
    const usage = getVal(COL.usage);
    const areaName = getVal(COL.area);
    const buildingName = getVal(COL.building);
    const project = getVal(COL.project);
    const masterProject = getVal(COL.masterProject);
    const rooms = getVal(COL.rooms).toLowerCase();
    const areaSqm = getNum(COL.areaSqm);
    const price = getNum(COL.price);
    const rent = getNum(COL.rent);
    const propType = getVal(COL.propType);
    const subType = getVal(COL.subType);

      // Track stats
      const uKey = usage || 'unknown';
      usageStats[uKey] = (usageStats[uKey] || 0) + 1;
      const tKey = transGroup || 'unknown';
      transStats[tKey] = (transStats[tKey] || 0) + 1;

      // Classify property type
      const category = classifyUsage(usage, propType, subType);
      const store = data[category];

      // Effective name: building > project > master project
      const effectiveName = buildingName || project || masterProject || '';
      const aKey = areaName.trim();

      // For land: area name is enough (no building)
      if (category !== 'land' && !effectiveName) { skipped++; continue; }
      if (!aKey) { skipped++; continue; }

      const bKey = effectiveName ? effectiveName.toLowerCase().replace(/\s+/g, ' ').trim() : '';
      const roomsNorm = normalizeRooms(rooms, subType);

      // --- COMMUNITY / CLUSTER TRACKING ---
      areaTransCount[aKey] = (areaTransCount[aKey] || 0) + 1;
      if (aKey) {
        if (!communityMap[aKey]) communityMap[aKey] = {};
        const mp = masterProject.trim();
        const pj = project.trim();
        const bn = buildingName.trim();
        if (mp) {
          if (!communityMap[aKey][mp]) communityMap[aKey][mp] = {};
          if (pj) {
            if (!communityMap[aKey][mp][pj]) communityMap[aKey][mp][pj] = new Set();
            if (bn) communityMap[aKey][mp][pj].add(bn);
          } else if (bn) {
            if (!communityMap[aKey][mp]['_direct']) communityMap[aKey][mp]['_direct'] = new Set();
            communityMap[aKey][mp]['_direct'].add(bn);
          }
        } else if (pj) {
          if (!communityMap[aKey]['_no_master']) communityMap[aKey]['_no_master'] = {};
          if (!communityMap[aKey]['_no_master'][pj]) communityMap[aKey]['_no_master'][pj] = new Set();
          if (bn) communityMap[aKey]['_no_master'][pj].add(bn);
        }
      }

      // --- SALES ---
      const tg = transGroup.toLowerCase();
      if (tg.includes('sale') || tg.includes('sell')) {
        if (price <= 0 || areaSqm <= 0) { skipped++; continue; }

        const areaSqft = areaSqm * 10.764;
        const psf = price / areaSqft;

        // Skip extreme outliers (different thresholds per category)
        if (category === 'residential' && (psf < 200 || psf > 20000)) { skipped++; continue; }
        if (category === 'commercial' && (psf < 100 || psf > 25000)) { skipped++; continue; }
        if (category === 'land' && (psf < 10 || psf > 50000)) { skipped++; continue; }
        // Skip tiny units (parking/storage) — except land
        if (category !== 'land' && areaSqft < 150) { skipped++; continue; }

        salesRows++;

        // Building-level (not for land without building)
        if (bKey) {
          if (!store.buildings[bKey]) store.buildings[bKey] = {
            name: effectiveName, area: aKey, category: category,
            propType: propType, subType: subType,
            psfs: [], rooms: {}, prices: [], sizes: []
          };
          store.buildings[bKey].psfs.push(psf);
          store.buildings[bKey].prices.push(price);
          store.buildings[bKey].sizes.push(areaSqft);
          if (roomsNorm) {
            if (!store.buildings[bKey].rooms[roomsNorm]) store.buildings[bKey].rooms[roomsNorm] = [];
            store.buildings[bKey].rooms[roomsNorm].push(psf);
          }
        }

        // Area-level
        if (!store.areas[aKey]) store.areas[aKey] = { psfs: [], rents: {}, prices: [], sizes: [] };
        store.areas[aKey].psfs.push(psf);
        store.areas[aKey].prices.push(price);
        store.areas[aKey].sizes.push(areaSqft);
      }

      // --- RENTALS ---
      if (rent > 0 && areaSqm > 0) {
        if (rent < 1000 || rent > 50000000) { continue; }
        rentRows++;

        if (!store.areas[aKey]) store.areas[aKey] = { psfs: [], rents: {}, prices: [], sizes: [] };
        const rentKey = roomsNorm || 'other';
        if (!store.areas[aKey].rents[rentKey]) store.areas[aKey].rents[rentKey] = [];
        store.areas[aKey].rents[rentKey].push(rent);
      }
  }

  console.log('\n\nDone reading!');
  console.log('Total rows:', totalRows.toLocaleString());
  console.log('Sales:', salesRows.toLocaleString());
  console.log('Rent:', rentRows.toLocaleString());
  console.log('Skipped:', skipped.toLocaleString());

  console.log('\n--- Usage Types ---');
  Object.entries(usageStats).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log('  '+k+': '+v.toLocaleString()));

  console.log('\n--- Transaction Groups ---');
  Object.entries(transStats).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log('  '+k+': '+v.toLocaleString()));

  // --- Build output ---
  console.log('\n--- Building Discovery ---');
  const output = {
    generated: new Date().toISOString(),
    source: path.basename(inputFile),
    existingDBSize: Object.keys(existingDB).length,
    existingAreasSize: Object.keys(existingAreas).length,
    stats: {
      totalRows, salesRows, rentRows,
      usageTypes: usageStats,
      transGroups: transStats,
    },
    residential: processCategory(data.residential, 'residential'),
    commercial: processCategory(data.commercial, 'commercial'),
    land: processCategory(data.land, 'land'),
  };

  // Discovery summary
  let totalNew = 0, totalExisting = 0, totalNewAreas = 0;
  const newByArea = {};
  ['residential', 'commercial', 'land'].forEach(cat => {
    Object.entries(output[cat].buildings).forEach(([k, v]) => {
      if (v.isNew) {
        totalNew++;
        const area = v.a || 'Unknown';
        if (!newByArea[area]) newByArea[area] = [];
        newByArea[area].push({ key: k, name: v.name, psf: v.p, n: v.n, cat: cat });
      } else {
        totalExisting++;
      }
    });
    Object.values(output[cat].areas).forEach(v => { if (v.isNew) totalNewAreas++; });
  });

  // --- Build community hierarchy (serializable) ---
  const existingClusters = {};
  try {
    const dataPath = path.join(__dirname, '..', 'js', 'data.js');
    const dataContent = fs.readFileSync(dataPath, 'utf8');
    const clMatch = dataContent.match(/const CLUSTERS\s*=\s*(\{[\s\S]*?\n\};)/);
    if (clMatch) {
      const clStr = clMatch[1].replace(/\/\/[^\n]*/g, '');
      const clObj = eval('(' + clStr + ')');
      Object.keys(clObj).forEach(k => { existingClusters[k] = true; });
      console.log('Loaded existing CLUSTERS:', Object.keys(existingClusters).length);
    }
  } catch(e) { console.warn('Could not parse CLUSTERS:', e.message); }

  const communities = {};
  const newClusters = {};
  for (const [area, masters] of Object.entries(communityMap)) {
    communities[area] = { txnCount: areaTransCount[area] || 0, masterProjects: {} };
    for (const [mp, projects] of Object.entries(masters)) {
      if (mp === '_no_master') {
        communities[area].standaloneProjects = {};
        for (const [pj, bldgs] of Object.entries(projects)) {
          communities[area].standaloneProjects[pj] = Array.from(bldgs);
        }
        continue;
      }
      communities[area].masterProjects[mp] = {};
      for (const [pj, bldgs] of Object.entries(projects)) {
        communities[area].masterProjects[mp][pj === '_direct' ? '_buildings' : pj] = Array.from(bldgs);
      }
      if (!existingClusters[mp] && !existingClusters[area]) {
        if (!newClusters[area]) newClusters[area] = {};
        const subs = Object.keys(projects).filter(p => p !== '_direct');
        if (subs.length > 0) newClusters[area][mp] = subs;
      }
    }
  }

  output.discovery = {
    existingBuildings: totalExisting,
    newBuildings: totalNew,
    newAreas: totalNewAreas,
    newBuildingsByArea: Object.fromEntries(
      Object.entries(newByArea)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([area, bldgs]) => [area, bldgs.length])
    ),
    newClusters: newClusters,
  };

  output.communities = communities;

  const outPath = path.join(__dirname, 'calibration-output.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log('\nOutput written to:', outPath);
  console.log('File size:', (fs.statSync(outPath).size / 1024).toFixed(0), 'KB');

  // Print summaries
  console.log('\n========== DISCOVERY SUMMARY ==========');
  console.log('Existing DB buildings:', Object.keys(existingDB).length);
  console.log('DLD buildings matched to DB:', totalExisting);
  console.log('NEW buildings from DLD:', totalNew);
  console.log('NEW areas from DLD:', totalNewAreas);
  console.log('Unique DLD areas:', Object.keys(communityMap).length);
  console.log('Existing CLUSTERS:', Object.keys(existingClusters).length);
  console.log('NEW cluster parents:', Object.values(newClusters).reduce((s, v) => s + Object.keys(v).length, 0));

  // Community hierarchy summary
  console.log('\n--- Top 30 Communities (by txn volume) ---');
  Object.entries(communities)
    .sort((a, b) => b[1].txnCount - a[1].txnCount)
    .slice(0, 30)
    .forEach(([area, c]) => {
      const mpNames = Object.keys(c.masterProjects);
      const spNames = Object.keys(c.standaloneProjects || {});
      console.log('  ' + area + ' (' + c.txnCount.toLocaleString() + ' txns): ' +
        mpNames.length + ' master projects, ' + spNames.length + ' standalone projects');
      mpNames.slice(0, 5).forEach(mp => {
        const subs = Object.keys(c.masterProjects[mp]).filter(k => k !== '_buildings');
        const direct = (c.masterProjects[mp]._buildings || []).length;
        console.log('    ► ' + mp + ': ' + subs.length + ' sub-projects' + (direct ? ', ' + direct + ' direct buildings' : ''));
      });
    });

  // New clusters
  const ncEntries = Object.entries(newClusters).filter(([,v]) => Object.keys(v).length > 0);
  if (ncEntries.length > 0) {
    console.log('\n--- NEW Clusters for CLUSTERS{} (not in existing DB) ---');
    ncEntries.sort((a,b) => Object.keys(b[1]).length - Object.keys(a[1]).length).slice(0, 20).forEach(([area, masters]) => {
      console.log('  ' + area + ':');
      Object.entries(masters).slice(0, 5).forEach(([mp, subs]) => {
        console.log('    "' + mp + '": ' + JSON.stringify(subs.slice(0, 8)) + (subs.length > 8 ? ' + ' + (subs.length - 8) + ' more' : ''));
      });
    });
  }
  console.log('\nTop 30 areas by NEW building count:');
  Object.entries(newByArea)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 30)
    .forEach(([area, bldgs]) => {
      console.log('  ' + area + ': +' + bldgs.length + ' new (' + bldgs.slice(0,3).map(b => b.name).join(', ') + (bldgs.length > 3 ? '...' : '') + ')');
    });

  ['residential', 'commercial', 'land'].forEach(cat => {
    const c = output[cat];
    console.log('\n=== ' + cat.toUpperCase() + ' ===');
    console.log('Buildings:', Object.keys(c.buildings).length, '| Areas:', Object.keys(c.areas).length);

    console.log('Top 15 Buildings (by txn count):');
    Object.entries(c.buildings).sort((a,b) => b[1].n - a[1].n).slice(0,15).forEach(([k,v]) => {
      const tag = v.isNew ? ' [NEW]' : ' [drift: ' + (v.drift > 0 ? '+' : '') + v.drift + '%]';
      console.log('  ' + v.name + ' (' + v.a + '): PSF ' + v.p + ' [' + v.lo + '-' + v.hi + '] — ' + v.n + ' txns' + tag);
    });

    const newInCat = Object.entries(c.buildings).filter(([,v]) => v.isNew).sort((a,b) => b[1].n - a[1].n);
    if (newInCat.length > 0) {
      console.log('Top 15 NEW Buildings:');
      newInCat.slice(0, 15).forEach(([k, v]) => {
        console.log('  ' + v.name + ' (' + v.a + '): PSF ' + v.p + ' — ' + v.n + ' txns, avg AED ' + v.avgPrice.toLocaleString());
      });
    }

    // Biggest drift (existing buildings where DLD price differs most)
    const driftList = Object.entries(c.buildings).filter(([,v]) => !v.isNew && v.drift !== undefined).sort((a,b) => Math.abs(b[1].drift) - Math.abs(a[1].drift));
    if (driftList.length > 0) {
      console.log('Top 10 Biggest PSF Drift (need calibration):');
      driftList.slice(0, 10).forEach(([k, v]) => {
        console.log('  ' + v.name + ': DB=' + v.oldP + ' → DLD=' + v.p + ' (' + (v.drift > 0 ? '+' : '') + v.drift + '%) — ' + v.n + ' txns');
      });
    }

    console.log('Top 15 Areas:');
    Object.entries(c.areas).sort((a,b) => b[1].n - a[1].n).slice(0,15).forEach(([k,v]) => {
      const aTag = v.isNew ? ' [NEW]' : (v.drift !== undefined ? ' [drift: ' + (v.drift > 0 ? '+' : '') + v.drift + '%]' : '');
      const rentStr = Object.entries(v).filter(([rk]) => rk.startsWith('r_') && !rk.endsWith('_n')).map(([rk,rv]) => rk.replace('r_','')+':'+rv.toLocaleString()).join(', ');
      console.log('  ' + k + ': PSF ' + v.psf + ' (' + v.n + ' sales)' + aTag + ' — Rents: ' + (rentStr || 'none'));
    });
  });
}

function processCategory(store, category) {
  const buildingOutput = {};
  let existingCount = 0, newCount = 0;
  for (const [key, b] of Object.entries(store.buildings)) {
    if (b.psfs.length < 2) continue;
    const sorted = b.psfs.slice().sort((a, c) => a - c);
    const p = Math.round(median(sorted));
    const lo = Math.round(percentile(sorted, 0.25));
    const hi = Math.round(percentile(sorted, 0.75));

    const priceSorted = b.prices.slice().sort((a,c) => a-c);
    const sizeSorted = b.sizes.slice().sort((a,c) => a-c);

    const isExisting = !!existingDB[key];
    if (isExisting) existingCount++; else newCount++;

    buildingOutput[key] = {
      name: b.name,
      a: b.area,
      p: p,
      lo: lo,
      hi: hi,
      n: sorted.length,
      avgPrice: Math.round(median(priceSorted)),
      avgSize: Math.round(median(sizeSorted)),
      isNew: !isExisting,
      category: category,
      propType: b.propType || '',
      subType: b.subType || '',
    };

    if (isExisting) {
      const old = existingDB[key];
      buildingOutput[key].oldP = old.p;
      buildingOutput[key].drift = Math.round(((p - old.p) / old.p) * 100);
    }

    // Room-level PSF breakdown (residential & commercial)
    if (category !== 'land') {
      const roomBreakdown = {};
      for (const [room, psfs] of Object.entries(b.rooms)) {
        if (psfs.length < 2) continue;
        const rs = psfs.slice().sort((a,c) => a-c);
        roomBreakdown[room] = { psf: Math.round(median(rs)), n: rs.length };
      }
      if (Object.keys(roomBreakdown).length > 0) buildingOutput[key].rooms = roomBreakdown;
    }
  }

  console.log('  ' + category + ': ' + existingCount + ' existing, ' + newCount + ' NEW buildings from DLD');

  const areaOutput = {};
  let existingAreaCount = 0, newAreaCount = 0;
  for (const [key, a] of Object.entries(store.areas)) {
    if (a.psfs.length < 3) continue;
    const sorted = a.psfs.slice().sort((x, y) => x - y);
    const isExistingArea = !!existingAreas[key];
    if (isExistingArea) existingAreaCount++; else newAreaCount++;

    const entry = {
      psf: Math.round(median(sorted)),
      n: sorted.length,
      avgPrice: Math.round(median(a.prices.slice().sort((x,y) => x-y))),
      avgSize: Math.round(median(a.sizes.slice().sort((x,y) => x-y))),
      isNew: !isExistingArea,
    };

    if (isExistingArea) {
      entry.oldPsf = existingAreas[key].psf;
      entry.drift = Math.round(((entry.psf - existingAreas[key].psf) / existingAreas[key].psf) * 100);
    }

    for (const [room, rents] of Object.entries(a.rents)) {
      if (rents.length < 2) continue;
      const rs = rents.slice().sort((x, y) => x - y);
      entry['r_' + room] = Math.round(median(rs));
      entry['r_' + room + '_n'] = rs.length;
    }
    areaOutput[key] = entry;
  }

  console.log('  ' + category + ': ' + existingAreaCount + ' existing, ' + newAreaCount + ' NEW areas from DLD');

  return { buildings: buildingOutput, areas: areaOutput };
}

function normalizeRooms(rooms, subType) {
  if (!rooms && !subType) return '';
  const r = (rooms || subType || '').toLowerCase();
  if (r.includes('studio') || r === '0' || r === 'room') return 'studio';
  if (r.includes('1') || r === 'one') return '1br';
  if (r.includes('2') || r === 'two') return '2br';
  if (r.includes('3') || r === 'three') return '3br';
  if (r.includes('4') || r === 'four') return '4br';
  if (r.includes('5') || r === 'five') return '5br';
  if (r.includes('6') || r === 'six') return '6br';
  if (r.includes('7') || r === 'seven') return '7br';
  return '';
}

function median(sorted) {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)];
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
