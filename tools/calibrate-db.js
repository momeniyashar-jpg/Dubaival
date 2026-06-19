#!/usr/bin/env node
/**
 * DubaiVal DB Calibrator
 * Reads DLD transaction Excel file, calculates real PSF per building/area,
 * outputs a small JSON file for DB calibration.
 *
 * Usage:
 *   npm install exceljs
 *   node tools/calibrate-db.js ~/Downloads/FILENAME.xlsx
 *
 * Output: tools/calibration-output.json (~100-300KB)
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

const buildings = {};   // key: building_name_en (lowercase) → {area, psfs:[], rents:[]}
const areas = {};       // key: area_name_en → {psfs:[], rents:[], counts:{studio,1br,2br,...}}
let totalRows = 0;
let salesRows = 0;
let rentRows = 0;
let skipped = 0;

// Column indices (0-based, will be set from header row)
let COL = {};

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

      // First row = headers
      if (!headerFound) {
        const vals = [];
        row.eachCell({ includeEmpty: true }, (cell, colNum) => {
          vals[colNum - 1] = String(cell.value || '').trim().toLowerCase();
        });
        // Map column names to indices
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

        console.log('Columns found:', JSON.stringify(COL, null, 2));

        if (COL.price === undefined || COL.areaSqm === undefined) {
          console.error('ERROR: Could not find price/area columns');
          process.exit(1);
        }
        continue;
      }

      // Read cell values
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

      const transGroup = getVal(COL.transGroup).toLowerCase();
      const usage = getVal(COL.usage).toLowerCase();
      const areaName = getVal(COL.area);
      const buildingName = getVal(COL.building);
      const project = getVal(COL.project);
      const rooms = getVal(COL.rooms).toLowerCase();
      const areaSqm = getNum(COL.areaSqm);
      const price = getNum(COL.price);
      const rent = getNum(COL.rent);
      const dateStr = getVal(COL.date);
      const propType = getVal(COL.propType).toLowerCase();
      const subType = getVal(COL.subType).toLowerCase();

      // Skip non-residential
      if (usage && !usage.includes('resid')) { skipped++; continue; }

      // Determine effective building name
      const effectiveName = buildingName || project || '';
      if (!effectiveName || !areaName) { skipped++; continue; }

      const bKey = effectiveName.toLowerCase().replace(/\s+/g, ' ').trim();
      const aKey = areaName.trim();

      // Parse rooms
      const roomsNorm = normalizeRooms(rooms, subType);

      // --- SALES ---
      if (transGroup.includes('sale') || transGroup.includes('sell')) {
        if (price <= 0 || areaSqm <= 0) { skipped++; continue; }

        const areaSqft = areaSqm * 10.764;
        const psf = price / areaSqft;

        // Sanity: skip extreme outliers
        if (psf < 200 || psf > 20000) { skipped++; continue; }
        // Skip tiny plots (likely parking/storage)
        if (areaSqft < 150) { skipped++; continue; }

        salesRows++;

        // Building-level
        if (!buildings[bKey]) buildings[bKey] = { name: effectiveName, area: aKey, psfs: [], rooms: {} };
        buildings[bKey].psfs.push(psf);
        if (roomsNorm) {
          if (!buildings[bKey].rooms[roomsNorm]) buildings[bKey].rooms[roomsNorm] = [];
          buildings[bKey].rooms[roomsNorm].push(psf);
        }

        // Area-level
        if (!areas[aKey]) areas[aKey] = { psfs: [], rents: {}, rooms: {} };
        areas[aKey].psfs.push(psf);
      }

      // --- RENTALS ---
      if (rent > 0 && areaSqm > 0 && roomsNorm) {
        if (rent < 5000 || rent > 5000000) { continue; } // skip outliers
        rentRows++;

        if (!areas[aKey]) areas[aKey] = { psfs: [], rents: {}, rooms: {} };
        if (!areas[aKey].rents[roomsNorm]) areas[aKey].rents[roomsNorm] = [];
        areas[aKey].rents[roomsNorm].push(rent);
      }
    }
  }

  console.log('\n\nDone reading!');
  console.log('Total rows:', totalRows.toLocaleString());
  console.log('Sales:', salesRows.toLocaleString());
  console.log('Rent:', rentRows.toLocaleString());
  console.log('Skipped:', skipped.toLocaleString());
  console.log('Buildings found:', Object.keys(buildings).length);
  console.log('Areas found:', Object.keys(areas).length);

  // --- Calculate medians ---
  const buildingOutput = {};
  for (const [key, b] of Object.entries(buildings)) {
    if (b.psfs.length < 2) continue; // need at least 2 transactions
    const sorted = b.psfs.slice().sort((a, c) => a - c);
    const p = Math.round(median(sorted));
    const lo = Math.round(percentile(sorted, 0.25));
    const hi = Math.round(percentile(sorted, 0.75));
    if (p < 300 || p > 15000) continue;
    buildingOutput[key] = {
      name: b.name,
      a: b.area,
      p: p,
      lo: lo,
      hi: hi,
      n: sorted.length,
    };
  }

  const areaOutput = {};
  for (const [key, a] of Object.entries(areas)) {
    if (a.psfs.length < 3) continue;
    const sorted = a.psfs.slice().sort((x, y) => x - y);
    const entry = {
      psf: Math.round(median(sorted)),
      n: sorted.length,
    };
    // Rent medians by room type
    for (const [room, rents] of Object.entries(a.rents)) {
      if (rents.length < 2) continue;
      const rs = rents.slice().sort((x, y) => x - y);
      entry['rent_' + room] = Math.round(median(rs));
      entry['rent_' + room + '_n'] = rs.length;
    }
    areaOutput[key] = entry;
  }

  const output = {
    generated: new Date().toISOString(),
    source: path.basename(inputFile),
    stats: { totalRows, salesRows, rentRows, buildings: Object.keys(buildingOutput).length, areas: Object.keys(areaOutput).length },
    buildings: buildingOutput,
    areas: areaOutput,
  };

  const outPath = path.join(__dirname, 'calibration-output.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log('\nOutput written to:', outPath);
  console.log('File size:', (fs.statSync(outPath).size / 1024).toFixed(0), 'KB');

  // Print top 20 buildings by transaction count
  console.log('\n--- Top 20 Buildings by Transaction Count ---');
  const topB = Object.entries(buildingOutput).sort((a, b) => b[1].n - a[1].n).slice(0, 20);
  topB.forEach(([k, v]) => {
    console.log(`  ${v.name} (${v.a}): PSF ${v.p} [${v.lo}-${v.hi}] — ${v.n} transactions`);
  });

  // Print top 20 areas
  console.log('\n--- Top 20 Areas by Transaction Count ---');
  const topA = Object.entries(areaOutput).sort((a, b) => b[1].n - a[1].n).slice(0, 20);
  topA.forEach(([k, v]) => {
    const rentStr = Object.entries(v).filter(([rk]) => rk.startsWith('rent_') && !rk.endsWith('_n')).map(([rk, rv]) => rk.replace('rent_', '') + ':' + rv.toLocaleString()).join(', ');
    console.log(`  ${k}: PSF ${v.psf} (${v.n} sales) — Rents: ${rentStr || 'none'}`);
  });
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
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(sorted, p) {
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)];
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
