#!/usr/bin/env node
/**
 * DubaiVal DB Calibrator
 * Reads DLD transaction Excel file, calculates real PSF per building/area,
 * outputs a small JSON file for DB calibration.
 *
 * Covers ALL property types: Residential, Commercial, Land
 *
 * Usage:
 *   npm install exceljs
 *   node tools/calibrate-db.js ~/Downloads/transactions_2026_05_26.xlsx
 *
 * Output: tools/calibration-output.json
 */

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

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

async function run() {
  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(inputFile, {
    sharedStrings: 'cache',
    hyperlinks: 'cache',
    worksheets: 'emit',
    entries: 'emit',
  });

  for await (const worksheet of workbook) {
    let headerFound = false;

    for await (const row of worksheet) {
      totalRows++;

      if (totalRows % 100000 === 0) {
        process.stdout.write('\rProcessed: ' + totalRows.toLocaleString() + ' rows | Sales: ' + salesRows.toLocaleString() + ' | Rent: ' + rentRows.toLocaleString());
      }

      if (!headerFound) {
        const vals = [];
        row.eachCell({ includeEmpty: true }, (cell, colNum) => {
          vals[colNum - 1] = String(cell.value || '').trim().toLowerCase();
        });
        vals.forEach((name, idx) => {
          if (name === 'trans_group_en') COL.transGroup = idx;
          if (name === 'procedure_name_en') COL.procName = idx;
          if (name === 'instance_date') COL.date = idx;
          if (name === 'property_type_en') COL.propType = idx;
          if (name === 'property_sub_type_en') COL.subType = idx;
          if (name === 'property_usage_en') COL.usage = idx;
          if (name === 'area_name_en') COL.area = idx;
          if (name === 'building_name_en') COL.building = idx;
          if (name === 'project_name_en') COL.project = idx;
          if (name === 'master_project_en') COL.masterProject = idx;
          if (name === 'rooms_en') COL.rooms = idx;
          if (name === 'procedure_area') COL.areaSqm = idx;
          if (name === 'actual_worth') COL.price = idx;
          if (name === 'meter_sale_price') COL.meterPrice = idx;
          if (name === 'rent_value') COL.rent = idx;
          if (name === 'meter_rent_price') COL.meterRent = idx;
        });
        headerFound = true;
        console.log('Columns mapped:', JSON.stringify(COL, null, 2));
        if (COL.price === undefined || COL.areaSqm === undefined) {
          console.error('ERROR: Could not find price/area columns');
          process.exit(1);
        }
        continue;
      }

      const getVal = (idx) => {
        if (idx === undefined) return '';
        const cell = row.getCell(idx + 1);
        return cell ? String(cell.value || '').trim() : '';
      };
      const getNum = (idx) => {
        if (idx === undefined) return 0;
        const cell = row.getCell(idx + 1);
        if (!cell || cell.value === null || cell.value === undefined) return 0;
        const v = typeof cell.value === 'number' ? cell.value : parseFloat(String(cell.value).replace(/,/g, ''));
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
  const output = {
    generated: new Date().toISOString(),
    source: path.basename(inputFile),
    stats: {
      totalRows, salesRows, rentRows,
      usageTypes: usageStats,
      transGroups: transStats,
    },
    residential: processCategory(data.residential, 'residential'),
    commercial: processCategory(data.commercial, 'commercial'),
    land: processCategory(data.land, 'land'),
  };

  const outPath = path.join(__dirname, 'calibration-output.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log('\nOutput written to:', outPath);
  console.log('File size:', (fs.statSync(outPath).size / 1024).toFixed(0), 'KB');

  // Print summaries
  ['residential', 'commercial', 'land'].forEach(cat => {
    const c = output[cat];
    console.log('\n=== ' + cat.toUpperCase() + ' ===');
    console.log('Buildings:', Object.keys(c.buildings).length, '| Areas:', Object.keys(c.areas).length);

    console.log('Top 15 Buildings:');
    Object.entries(c.buildings).sort((a,b) => b[1].n - a[1].n).slice(0,15).forEach(([k,v]) => {
      console.log('  ' + v.name + ' (' + v.a + '): PSF ' + v.p + ' [' + v.lo + '-' + v.hi + '] — ' + v.n + ' txns, avg price AED ' + v.avgPrice.toLocaleString());
    });

    console.log('Top 15 Areas:');
    Object.entries(c.areas).sort((a,b) => b[1].n - a[1].n).slice(0,15).forEach(([k,v]) => {
      const rentStr = Object.entries(v).filter(([rk]) => rk.startsWith('r') && !rk.endsWith('_n') && rk !== 'n').map(([rk,rv]) => rk+':'+rv.toLocaleString()).join(', ');
      console.log('  ' + k + ': PSF ' + v.psf + ' (' + v.n + ' sales) — Rents: ' + (rentStr || 'none'));
    });
  });
}

function processCategory(store, category) {
  const buildingOutput = {};
  for (const [key, b] of Object.entries(store.buildings)) {
    if (b.psfs.length < 2) continue;
    const sorted = b.psfs.slice().sort((a, c) => a - c);
    const p = Math.round(median(sorted));
    const lo = Math.round(percentile(sorted, 0.25));
    const hi = Math.round(percentile(sorted, 0.75));

    const priceSorted = b.prices.slice().sort((a,c) => a-c);
    const sizeSorted = b.sizes.slice().sort((a,c) => a-c);

    buildingOutput[key] = {
      name: b.name,
      a: b.area,
      p: p,
      lo: lo,
      hi: hi,
      n: sorted.length,
      avgPrice: Math.round(median(priceSorted)),
      avgSize: Math.round(median(sizeSorted)),
    };

    // Room-level PSF breakdown (residential only)
    if (category === 'residential') {
      const roomBreakdown = {};
      for (const [room, psfs] of Object.entries(b.rooms)) {
        if (psfs.length < 2) continue;
        const rs = psfs.slice().sort((a,c) => a-c);
        roomBreakdown[room] = { psf: Math.round(median(rs)), n: rs.length };
      }
      if (Object.keys(roomBreakdown).length > 0) buildingOutput[key].rooms = roomBreakdown;
    }
  }

  const areaOutput = {};
  for (const [key, a] of Object.entries(store.areas)) {
    if (a.psfs.length < 3) continue;
    const sorted = a.psfs.slice().sort((x, y) => x - y);
    const entry = {
      psf: Math.round(median(sorted)),
      n: sorted.length,
      avgPrice: Math.round(median(a.prices.slice().sort((x,y) => x-y))),
      avgSize: Math.round(median(a.sizes.slice().sort((x,y) => x-y))),
    };

    for (const [room, rents] of Object.entries(a.rents)) {
      if (rents.length < 2) continue;
      const rs = rents.slice().sort((x, y) => x - y);
      entry['r_' + room] = Math.round(median(rs));
      entry['r_' + room + '_n'] = rs.length;
    }
    areaOutput[key] = entry;
  }

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
