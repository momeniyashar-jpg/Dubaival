#!/usr/bin/env node
/**
 * DubaiVal Market Cycle Index Builder
 *
 * Reads the SAME raw DLD transaction CSV used by tools/calibrate-db.js, but
 * — unlike that tool, which deliberately discards everything before
 * DATE_FROM (2024-01-01) for recent building-level calibration — this
 * script processes the FULL date range to build a real, year-by-year
 * residential price index for the "All" view of the Market Dashboard's
 * PSF Trend chart (js/market.js). See CLAUDE.md 2026-07-15 for the request
 * this fulfills: an "All-time" cycle chart (like a crypto exchange's "All"
 * button), built from real DLD transactions, not an invented number.
 *
 * Only a residential CITYWIDE median PSF per year is computed here — not
 * per-building, per-area — since two decades of building/area mix changes
 * so much (entire communities like JVC/Business Bay/Dubai Hills didn't
 * exist in 2005) that a single "AED/sqft" figure isn't comparable across
 * the full range on its own. The output is instead expressed as an INDEX
 * (base 100 = the earliest year with enough transactions to be reliable),
 * matching how real-world long-run property indices (Case-Shiller, UK's
 * Halifax House Price Index) are always published — a relative growth
 * curve, not a single absolute price meant to span decades of product mix
 * change.
 *
 * Usage (run locally where the CSV lives — same machine as calibrate-db.js):
 *   node tools/build-market-cycle-index.js <path-to-transactions.csv>
 *
 * Output: tools/market-cycle-index.json — small (one row per year), safe
 * to commit and paste back into a Claude session for wiring into the app.
 */

const fs = require('fs');
const readline = require('readline');

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node tools/build-market-cycle-index.js <path-to-csv>');
  process.exit(1);
}
if (!fs.existsSync(inputFile)) {
  console.error('File not found:', inputFile);
  process.exit(1);
}

const minTxArg = process.argv.find(a => a.startsWith('--minTxPerYear='));
const MIN_TX_PER_YEAR = minTxArg ? parseInt(minTxArg.split('=')[1], 10) : 30;

console.log('Reading:', inputFile);
console.log('File size:', (fs.statSync(inputFile).size / 1e9).toFixed(2), 'GB');
console.log('Minimum transactions/year to include in the index:', MIN_TX_PER_YEAR);
console.log('This may take 5-15 minutes for large files...\n');

// --- Same column-mapping / classification / CSV-line parsing as
//     calibrate-db.js, kept in lockstep so both tools agree on what counts
//     as a valid residential sale row. ---
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

  if (pt.includes('unit') || pt.includes('building')) return 'residential';
  if (pt.includes('land')) return 'land';

  return 'residential';
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

// year -> array of PSF values (residential sales only)
const yearPSFs = {};
let totalRows = 0, salesRows = 0, skipped = 0;

async function run() {
  const rl = readline.createInterface({
    input: fs.createReadStream(inputFile, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let headerFound = false;

  for await (const line of rl) {
    if (!line.trim()) continue;
    totalRows++;

    if (totalRows % 200000 === 0) {
      process.stdout.write('\rProcessed: ' + totalRows.toLocaleString() + ' rows | Residential sales kept: ' + salesRows.toLocaleString());
    }

    const fields = parseCSVLine(line);

    if (!headerFound) {
      fields.forEach((name, idx) => {
        const n = name.toLowerCase();
        if (n === 'trans_group_en') COL.transGroup = idx;
        if (n === 'instance_date') COL.date = idx;
        if (n === 'property_type_en') COL.propType = idx;
        if (n === 'property_sub_type_en') COL.subType = idx;
        if (n === 'property_usage_en') COL.usage = idx;
        if (n === 'procedure_area') COL.areaSqm = idx;
        if (n === 'actual_worth') COL.price = idx;
      });
      headerFound = true;
      console.log('Columns mapped:', JSON.stringify(COL, null, 2));
      if (COL.price === undefined || COL.areaSqm === undefined || COL.date === undefined) {
        console.error('ERROR: Could not find price/area/date columns');
        console.error('Available columns:', fields.join(', '));
        process.exit(1);
      }
      continue;
    }

    const getVal = (idx) => (idx === undefined ? '' : (fields[idx] || '').trim());
    const getNum = (idx) => {
      if (idx === undefined) return 0;
      const raw = (fields[idx] || '').trim();
      if (!raw) return 0;
      const v = parseFloat(raw.replace(/,/g, ''));
      return isNaN(v) ? 0 : v;
    };

    const transGroup = getVal(COL.transGroup);
    const usage = getVal(COL.usage);
    const propType = getVal(COL.propType);
    const subType = getVal(COL.subType);
    const dateStr = getVal(COL.date);
    const areaSqm = getNum(COL.areaSqm);
    const price = getNum(COL.price);

    const tg = transGroup.toLowerCase();
    if (!(tg.includes('sale') || tg.includes('sell'))) { skipped++; continue; }

    const category = classifyUsage(usage, propType, subType);
    if (category !== 'residential') { skipped++; continue; }

    if (price <= 0 || areaSqm <= 0) { skipped++; continue; }
    const areaSqft = areaSqm * 10.764;
    const psf = price / areaSqft;
    if (psf < 200 || psf > 20000) { skipped++; continue; }
    if (areaSqft < 150) { skipped++; continue; }

    if (!dateStr) { skipped++; continue; }
    const txDate = new Date(dateStr);
    if (isNaN(txDate.getTime())) { skipped++; continue; }
    const yr = txDate.getFullYear();
    if (yr < 1990 || yr > 2100) { skipped++; continue; }

    if (!yearPSFs[yr]) yearPSFs[yr] = [];
    yearPSFs[yr].push(psf);
    salesRows++;
  }

  console.log('\n\nDone. Total rows:', totalRows.toLocaleString(), '| Residential sales kept:', salesRows.toLocaleString(), '| Skipped:', skipped.toLocaleString());

  const years = Object.keys(yearPSFs).map(Number).sort((a, b) => a - b);
  console.log('\nYear-by-year residential sales distribution:');
  console.log('Year  | Tx Count | Median PSF | Reliable?');
  const rows = [];
  years.forEach((yr) => {
    const vals = yearPSFs[yr].slice().sort((a, b) => a - b);
    const median = vals[Math.floor(vals.length / 2)];
    const reliable = vals.length >= MIN_TX_PER_YEAR;
    console.log(String(yr).padEnd(6) + '| ' + String(vals.length).padEnd(9) + '| ' + Math.round(median).toString().padEnd(11) + '| ' + (reliable ? 'yes' : 'NO (excluded)'));
    rows.push({ year: yr, count: vals.length, medianPsf: Math.round(median), reliable });
  });

  const reliableRows = rows.filter(r => r.reliable);
  if (!reliableRows.length) {
    console.error('\nNo year had enough transactions (>= ' + MIN_TX_PER_YEAR + ') to build a reliable index. Try a lower --minTxPerYear= value.');
    process.exit(1);
  }

  const baseYear = reliableRows[0].year;
  const basePsf = reliableRows[0].medianPsf;
  const output = {
    generatedAt: new Date().toISOString(),
    sourceFile: inputFile.split(/[\\/]/).pop(),
    baseYear: baseYear,
    minTxPerYear: MIN_TX_PER_YEAR,
    years: reliableRows.map(r => r.year),
    medianPsf: reliableRows.map(r => r.medianPsf),
    txCount: reliableRows.map(r => r.count),
    // Index: 100 at baseYear, relative growth/decline every year after —
    // this is what the app's chart should actually plot on its Y-axis for
    // the "All" view, per the same convention used by Case-Shiller/Halifax
    // house-price indices (a single absolute AED/sqft figure isn't
    // meaningful across two decades of changing building/area mix).
    index: reliableRows.map(r => Math.round((r.medianPsf / basePsf) * 1000) / 10),
  };

  const outPath = require('path').join(__dirname, 'market-cycle-index.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log('\nWrote', outPath);
  console.log('Base year:', baseYear, '(index=100, median PSF=' + basePsf + ')');
  console.log('\nCopy the contents of tools/market-cycle-index.json and share it back so it can be wired into the app.');
}

run();
