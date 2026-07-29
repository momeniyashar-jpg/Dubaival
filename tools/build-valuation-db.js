#!/usr/bin/env node
/**
 * Build valuation-db.js from DLD calibration data
 *
 * Reads: tools/calibration-output.json (DLD 2024+ transactions)
 * Reads: js/data-residential.js (existing DB for structure/grade/area info)
 * Outputs: js/valuation-db.js (pure DLD-based PSF for calculations)
 *
 * Usage: node tools/build-valuation-db.js
 */

const fs = require('fs');
const path = require('path');

const cal = require(path.join(__dirname, 'calibration-output.json'));
const dataPath = path.join(__dirname, '..', 'js', 'data-residential.js');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const dbMatch = dataContent.match(/var DB\s*=\s*(\{[\s\S]*?\});/);
const existDB = JSON.parse(dbMatch[1]);

const dld = cal.residential.buildings;
const dldAreas = cal.residential.areas;

// Known-corrupted DLD building entries, excluded before any matching runs.
// "Orra The Embankment - Tower 1/2" (JLT / Al Thanyah Fifth) both show a
// physically implausible pattern in their own per-bedroom breakdown: Tower 2
// prices Studio (n:168), 1BR (n:332), and 2BR (n:100) units at the EXACT
// same 300 psf regardless of unit type, and Tower 1's 3BR/4BR/5BR buckets
// (n:52/128/20) are all pinned at exactly 299 psf too, while its own
// Studio/1BR/2BR buckets show real, differentiated prices (800-1150) --
// real different-sized units never average to one identical psf across
// unrelated bedroom counts. This points to a raw-data/transaction-labeling
// defect upstream of this file (in whatever produced calibration-output.json
// from the original DLD CSV, long before this script ever sees it) --
// confirmed 2026-07-29 while investigating why the live Analyzer showed
// this building's price at ~800/sqft against real 2026 listings of
// 2,131-2,251/sqft. No raw CSV is available in this environment to fix the
// defect at its true source, so both DLD keys are excluded here instead --
// every DB key referencing this building (base "orra the embankment" +
// both towers) now correctly falls through to the area-level fallback
// (Al Thanyah Fifth, ~1969 psf from a real 39,337-transaction sample) rather
// than propagating a demonstrably corrupted building-level figure.
delete dld['orra the embankment - tower 1'];
delete dld['orra the embankment - tower 2'];

const dldKeys = Object.keys(dld);

// ── Commercial/land: read-only, for building the VALUATION_DB_COM/LAND
// overlay below. Never write back to js/data-commercial.js — that file is
// research-branch-only per the two-branch workflow (see CLAUDE.md);
// DB_COM/DB_LAND themselves are left completely untouched, exactly like
// legacy residential DB is untouched by VALUATION_DB above.
const dataComPath = path.join(__dirname, '..', 'js', 'data-commercial.js');
const dataComContent = fs.readFileSync(dataComPath, 'utf8');
const dbComMatch = dataComContent.match(/var DB_COM\s*=\s*(\{[\s\S]*?\});/);
const dbLandMatch = dataComContent.match(/var DB_LAND\s*=\s*(\{[\s\S]*?\});/);
const existDBCom = dbComMatch ? JSON.parse(dbComMatch[1]) : {};
const existDBLand = dbLandMatch ? JSON.parse(dbLandMatch[1]) : {};
const dldCom = cal.commercial.buildings;
const dldLand = cal.land.buildings;
const dldComAreas = cal.commercial.areas;

// ── Area name mapping (DB → DLD) ──
const AREA_MAP = {
  "Al Bada":"Al Bada","Al Barari":"Wadi Al Safa 3","Al Barsha":"Al Barsha First",
  "Al Barsha South":"Al Barsha South Fourth","Al Barsha South Fifth":"Al Barsha South Fifth",
  "Al Barshaa South Second":"Al Barshaa South Second","Al Furjan":"Jabal Ali First",
  "Al Goze Fourth":"Al Goze Fourth","Al Hebiah Second":"Al Hebiah Second",
  "Al Hebiah Third":"Al Hebiah Third","Al Jaddaf":"Al Jadaf",
  "Al Khawaneej First":"Al Khawaneej First","Al Kheeran":"Al Kheeran",
  "Al Kifaf":"Al Kifaf","Al Quoz":"Al Goze Fourth",
  "Al Qusais Industrial Fifth":"Al Qusais Industrial Fifth",
  "Al Qusais Industrial Fourth":"Al Qusais Industrial Fourth",
  "Al Safouh First":"Al Safouh First","Al Safouh Second":"Al Safouh Second",
  "Al Satwa":"Al Satwa","Al Sufouh":"Al Safouh First","Al Wasl":"Al Wasl",
  "Al Yelayiss 2":"Al Yelayiss 2","Al Yufrah":"Al Yufrah 1",
  "Al Yufrah 3":"Madinat Hind 4","Arjan":"Al Barshaa South Third",
  "Barsha Heights":"Al Thanyah First","Beachgate By Address":"Marsa Dubai",
  "Bluewaters Island":"Marsa Dubai","Bukadra":"Bukadra","Bur Dubai":"Al Kifaf",
  "Business Bay":"Business Bay","City Walk":"Al Wasl","Culture Village":"Al Jadaf",
  "DAMAC Hills":"Al Hebiah Third","DAMAC Hills 2":"Al Hebiah Fourth",
  "DAMAC Islands":"Al Yelayiss 1","DAMAC Lagoons":"Al Hebiah Fifth",
  "Discovery Gardens":"Jabal Ali First","Downtown Dubai":"Burj Khalifa",
  "Dubai":"Business Bay","Dubai Creek":"Um Hurair Second",
  "Dubai Creek Harbour":"Al Khairan First","Dubai Design District":"Zaabeel Second",
  "Dubai Festival City":"Al Kheeran","Dubai Harbour":"Marsa Dubai",
  "Dubai Healthcare City":"Um Hurair Second",
  "Dubai Hills Estate":"Hadaeq Sheikh Mohammed Bin Rashid",
  "Dubai Industrial City":"Saih Shuaib 2","Dubai Internet City":"Al Safouh Second",
  "Dubai Investment Park":"Dubai Investment Park First",
  "Dubai Islands":"Palm Deira","Dubai Marina":"Marsa Dubai",
  "Dubai Maritime City":"Madinat Dubai Almelaheyah",
  "Dubai Media City":"Al Safouh Second","Dubai Production City":"Me'Aisem First",
  "Dubai Residence Complex":"Wadi Al Safa 5","Dubai Science Park":"Al Barshaa South Second",
  "Dubai Silicon Oasis":"Nadd Hessa","Dubai South":"Madinat Al Mataar",
  "Dubai Sports City":"Al Hebiah Fourth","Dubai Studio City":"Al Hebiah Second",
  "Dubailand":"Wadi Al Safa 5","Emaar Beachfront":"Marsa Dubai",
  "Emirates Living":"Al Thanayah Fourth","Expo City":"Madinat Al Mataar",
  "Ghadeer Al tair":"Ghadeer Al tair","Hessyan First":"Hessyan First",
  "IMPZ":"Me'Aisem First","International City":"Al Warsan First",
  "Island 2":"Island 2","Jabal Ali Industrial Second":"Jabal Ali Industrial Second",
  "Jebel Ali":"Jabal Ali First","Jebel Ali Industrial":"Jabal Ali Industrial Second",
  "Jumeirah":"Um Suqaim Third","Jumeirah Beach Residence (Jbr)":"Marsa Dubai",
  "Jumeirah First":"Jumeirah First","Jumeirah Golf Estates":"Me'Aisem First",
  "Jumeirah Lake Towers":"Al Thanyah Fifth","Jumeirah Second":"Jumeirah Second",
  "Jumeirah Village Circle":"Al Barsha South Fourth",
  "Jumeirah Village Triangle":"Al Barsha South Fifth",
  "Living Legends":"Wadi Al Safa 3","Liwan":"Wadi Al Safa 2",
  "Madinat Dubai Almelaheyah":"Madinat Dubai Almelaheyah",
  "Madinat Hind 4":"Madinat Hind 4","Majan":"Wadi Al Safa 3",
  "Marina Vista":"Marsa Dubai","MBR City":"Al Merkadh","Meydan":"Al Merkadh",
  "Mina Rashid":"Madinat Dubai Almelaheyah","Mirdif":"Mirdif",
  "Motor City":"Al Hebiah First","Mudon":"Al Hebiah Sixth",
  "Muhaisanah First":"Muhaisanah First","Muhaisnah":"Muhaisanah First",
  "Nad Al Hamar":"Nad Al Hamar","Nad Al Sheba":"Nad Al Shiba First",
  "Nadd Hessa":"Nadd Hessa","Palace Beach Residence":"Marsa Dubai",
  "Palm Jebel Ali":"Palm Jabal Ali","Palm Jumeirah":"Palm Jumeirah",
  "Ras Al Khor":"Ras Al Khor Industrial First",
  "Ras Al Khor Industrial First":"Ras Al Khor Industrial First",
  "Rega Al Buteen":"Rega Al Buteen","Remraam":"Al Hebiah Fifth",
  "Saih Shuaib 2":"Saih Shuaib 2","Sheikh Zayed Road":"Trade Center First",
  "Sobha Hartland":"Al Merkadh","The Greens":"Al Thanyah Third",
  "The Hills":"Al Thanyah Third","The Oasis":"Me'Aisem Second",
  "The Views":"Al Thanyah Third","Tilal Al Ghaf":"Al Hebiah Fourth",
  "Town Square":"Al Yelayiss 2","Trade Center First":"Trade Center First",
  "Trade Center Second":"Trade Center Second","Umm Suqeim":"Um Suqaim Third",
  "Wadi Al Safa":"Wadi Al Safa 2","Wadi Al Safa 6":"Wadi Al Safa 6",
  "Warsan Fourth":"Warsan Fourth","Wasl Gate":"Jabal Ali First",
  "World Islands":"World Islands","World Trade Centre":"Trade Center Second",
  "Za'Abeel":"Zaabeel First","Zaabeel First":"Zaabeel First",
  "Zaabeel Second":"Zaabeel Second",
  "Arabian Ranches":"Wadi Al Safa 6","Arabian Ranches 2":"Wadi Al Safa 7",
  "Arabian Ranches 3":"Wadi Al Safa 7","The Springs":"Al Thanyah Third",
  "The Meadows":"Al Thanyah Third","The Lakes":"Al Thanyah Third",
  "DIFC":"Trade Center First","JBR":"Marsa Dubai","JLT":"Al Thanyah Fifth",
  "District One":"Al Merkadh",
  "Al Thanayah Fourth":"Al Thanyah Third",
  "Jumeirah Islands":"Al Thanyah Third",
  "Jumeirah Heights":"Al Thanyah Third",
  "Jumeirah Park":"Al Thanyah Third",
  "Emirates Hills":"Al Thanyah Third",
  "The Meadows":"Al Thanyah Third",
  "The Lakes":"Al Thanyah Third",
  "The Springs":"Al Thanyah Third",
  "Al Nahda":"Muhaisanah First",
  "Deira":"Rega Al Buteen",
  "Al Karama":"Al Kifaf",
  "Creek Beach":"Bukadra",
  "Port Saeed":"Rega Al Buteen",
  "Al Garhoud":"Al Kheeran",
  "Executive Towers":"Business Bay",
  "Bay Square":"Business Bay",
  "Al Safa":"Al Wasl",
  "Al Mamzar":"Al Qusais Industrial Fifth",
  "Layan":"Al Hebiah Fifth",
  "Akoya Oxygen":"Wadi Al Safa 3",
  "Green Community":"Dubai Investment Park First",
  "Falcon City":"Wadi Al Safa 5",
  "Victory Heights":"Wadi Al Safa 5",
  "Mira":"Wadi Al Safa 3",
  "Mira Oasis":"Wadi Al Safa 3",
  "Villanova":"Wadi Al Safa 3",
  "The Villa":"Wadi Al Safa 3",
  "The Gardens":"Jabal Ali First",
  "Downtown Jebel Ali":"Jabal Ali First",
  "Jebel Ali Hills":"Jabal Ali First",
  "Jebel Ali Village":"Jabal Ali First",
  "Oud Metha":"Um Hurair Second",
  "Al Rigga":"Rega Al Buteen",
  "Al Rashidiya":"Mirdif",
  "Al Warqaa":"Mirdif",
  "Al Khawaneej":"Al Khawaneej First",
  "Umm Hurair":"Um Hurair Second",
  "Al Mankhool":"Al Kifaf",
  "Al Qusais":"Al Qusais Industrial Fourth",
  "Al Twar":"Al Qusais Industrial Fourth",
  "Al Mizhar":"Mirdif",
  "Naif":"Rega Al Buteen",
  "Jumeirah Third":"Um Suqaim Third",
  "Hor Al Anz":"Rega Al Buteen",
  "Abu Hail":"Rega Al Buteen",
  "Mina Seyahi":"Marsa Dubai",
  "Badrah":"Jabal Ali First",
  "Serena":"Wadi Al Safa 3",
  "Madinat Jumeirah Living":"Um Suqaim Third",
  "Rashid Yachts Marina":"Madinat Dubai Almelaheyah",
  "Sobha Hartland 2":"Bukadra",
  "Al Raffa":"Al Kifaf",
  "Al Muteena":"Rega Al Buteen",
  "Al Hudaiba":"Jumeirah First",
  "Umm Ramool":"Al Kheeran",
  "Dubai Knowledge Park":"Al Safouh Second",
  "Dubai Academic City":"Wadi Al Safa 5",
  "Rukan":"Wadi Al Safa 3",
  "Al Manara":"Jumeirah First",
  "Al Fahidi":"Al Kifaf",
  "Nad Shamma":"Mirdif",
  "Hatta":"Hessyan First",
  "Warsan":"Warsan Fourth",
  "Dubailand Oasis":"Wadi Al Safa 3",
  "Al Muraqqabat":"Rega Al Buteen",
  "Al Hamriya":"Rega Al Buteen",
  "Al Barsha First":"Al Barsha First",
  "Al Barsha Second":"Al Barsha First",
  "Al Barsha Third":"Al Barsha First",
  "Al Barsha South Third":"Al Barshaa South Third",
  "Umm Suqeim First":"Um Suqaim Third",
  "Umm Suqeim Second":"Um Suqaim Third",
  "Umm Suqeim Third":"Um Suqaim Third",
  "Al Rowaiyah First":"Nadd Hessa",
  "Al Warsan Second":"Al Warsan First",
  "Al Ttay":"Bukadra",
  "Al Yelayiss 4":"Al Yelayiss 2",
  "Al Yelayiss 5":"Al Yelayiss 2",
  "Al Yelayiss 1":"Al Yelayiss 1",
  "Al Hebiah Sixth":"Al Hebiah Fifth",
  "Saih Shuaib 1":"Saih Shuaib 2",
};

// ── Manual name overrides (DB key → DLD key) ──
const MANUAL_MAP = {
  "address fountain views tower 1": "address fountain views residences - tower 1",
  "address fountain views tower 2": "address fountain views residences - tower 2",
  "address fountain views tower 3": "address fountain views hotel",
  "claren 1": "claren tower 1",
  "claren 2": "claren tower 2",
  "act one": "act one act two tower 1",
  "act two": "act one act two tower 2",
  "standpoint tower 1": "bd standpoint a",
  "standpoint tower 2": "bd standpoint b",
  "standpoint a": "bd standpoint a",
  "standpoint b": "bd standpoint b",
  "one palm": "one at palm jumeirah",
  "palm tower": "the palm tower",
  "armani residences": null, // Armani in Burj Khalifa — no separate DLD entry, use area
};

// ── Fuzzy name normalization ──
function normalize(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(the|at|in|by|residences|residence|hotel|podium|pd)\b/g, '')
    .replace(/\btower\b/g, 't')
    .replace(/\bt(\d)/g, 't$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Build fuzzy index from DLD ──
// Keeps EVERY DLD key sharing a normalized form (not just the first seen) --
// see the 2026-07-29 comment on findDLDMatch() below for why this matters:
// the old first-wins version silently discarded real collisions like
// "Parkwood Residences" (Al Barsha) vs "Parkwood Podium" (Dubai Hills
// Estate) both normalizing to "parkwood", with zero way to tell a genuine
// one-candidate match from an unresolved multi-candidate one downstream.
const fuzzyIndexAll = {};
dldKeys.forEach(k => {
  const norm = normalize(k);
  if (!fuzzyIndexAll[norm]) fuzzyIndexAll[norm] = [];
  fuzzyIndexAll[norm].push(k);
});
// Back-compat single-key view (first candidate per norm) -- still used by
// the substring-match path below, which already has its own per-candidate
// area check and isn't affected by the collision-ambiguity problem the
// exact/trailing-number paths had (a broad substring scan already visits
// every fuzzyIndex entry, not just one).
const fuzzyIndex = {};
Object.keys(fuzzyIndexAll).forEach(norm => { fuzzyIndex[norm] = fuzzyIndexAll[norm][0]; });

// A DLD "building" record whose propType is Land or a generic Building shell
// is not a real apartment/villa building — it's almost always a data
// artifact: the raw export had no building_name_en/project_name_en, so
// calibrate-db.js's effectiveName fallback (building > project > master
// project) picked up the MASTER PROJECT name instead, which is often just
// the area's own umbrella name (e.g. a bogus "business bay" entry, actually
// 72 bulk land-parcel transfers averaging ~29,700 sqft / AED 86M — nothing
// like an apartment). Found 2026-07-12: dozens of real, unrelated Business
// Bay towers (any DB key containing "business bay", a common area-suffix
// naming convention in this DB) were fuzzy-matching to that single bogus
// entry via the substring check below, all silently inheriting its land-
// parcel-scale PSF. Genuine building==area-name coincidences (Burj Khalifa,
// Palm Jumeirah villas) keep propType Unit/Villa and are unaffected.
function isRealResidentialBuilding(dldBldg) {
  return dldBldg && dldBldg.propType !== 'Land' && dldBldg.propType !== 'Building';
}

// Resolves a normalized-name group (one or more DLD keys sharing that
// normalized form) to a single DLD key, or null if it can't be resolved
// safely. Real bug found 2026-07-29, fixed in two passes:
//   Pass 1 (wrong): required area agreement UNCONDITIONALLY on every exact/
//   trailing-number match. That broke dozens of real, previously-correct,
//   UNIQUE (non-colliding) matches -- e.g. "Downtown Views II Tower 1/2/3"
//   (DB area "Za'Abeel") vs their one real DLD match (actual DLD area
//   "Zaabeel Second") -- AREA_MAP only maps "Za'Abeel"->"Zaabeel First",
//   a genuinely different (more granular) DLD sub-area than where this
//   specific building sits. AREA_MAP is a coarse, incomplete simplification
//   of DLD's much more granular official area boundaries, confirmed via
//   several more real cases (MR C Residences Downtown: DB area "Downtown
//   Dubai" vs real DLD area "Al Wasl"; One Za'abeel: same Za'Abeel gap;
//   Sobha One vs Sobha One - Podium's own area). Requiring area agreement
//   unconditionally silently discarded these real, unambiguous matches
//   (confirmed via fuzzyIndexAll: every one of them has exactly ONE real
//   DLD candidate -- no other building name normalizes to the same string
//   -- so there was never anything to disambiguate).
//   Pass 2 (this one): only require area agreement when there's an ACTUAL
//   collision -- 2+ different real DLD buildings sharing one normalized
//   name, the exact shape of the original Parkwood bug (2 candidates,
//   genuinely different buildings in genuinely different areas). A single
//   candidate is always trusted regardless of AREA_MAP's own accuracy,
//   since there's no competing candidate a wrong area label could steer
//   the match toward.
function resolveCandidates(norm, dldAreaName) {
  const cands = (fuzzyIndexAll[norm] || []).filter(k => isRealResidentialBuilding(dld[k]));
  if (cands.length === 0) return null;
  if (cands.length === 1) return cands[0];
  // Genuine collision: 2+ real candidates. Only trust one when the area is
  // known AND exactly one candidate agrees with it -- otherwise it's not
  // safe to guess, so return null (falls through to later match stages /
  // area-level fallback, same as a building with no DLD data at all).
  if (!dldAreaName) return null;
  const sameArea = cands.filter(k => dld[k].a === dldAreaName);
  return sameArea.length === 1 ? sameArea[0] : null;
}

// ── Match DB building → DLD building ──
function findDLDMatch(dbKey, dbArea) {
  if (dld[dbKey] && isRealResidentialBuilding(dld[dbKey])) return dbKey;
  if (MANUAL_MAP.hasOwnProperty(dbKey)) return MANUAL_MAP[dbKey];

  const norm = normalize(dbKey);
  const dldAreaName = AREA_MAP[dbArea];

  const exact = resolveCandidates(norm, dldAreaName);
  if (exact) return exact;

  // Try without trailing numbers (tower variations)
  const noNum = norm.replace(/\s*\d+\s*$/, '').trim();
  const dbNum = norm.match(/(\d+)\s*$/);
  if (dbNum) {
    for (const fk of Object.keys(fuzzyIndexAll)) {
      const fkNoNum = fk.replace(/\s*\d+\s*$/, '').trim();
      const fkNum = fk.match(/(\d+)\s*$/);
      if (fkNoNum === noNum && fkNum && fkNum[1] === dbNum[1]) {
        const match = resolveCandidates(fk, dldAreaName);
        if (match) return match;
      }
    }
  }

  // Substring match — must be same area AND long enough match
  if (dldAreaName && norm.length > 8) {
    for (const fk of Object.keys(fuzzyIndex)) {
      if (fk.length > 8) {
        const dldKey = fuzzyIndex[fk];
        const dldBldg = dld[dldKey];
        if (!dldBldg) continue;
        if (!isRealResidentialBuilding(dldBldg)) continue;
        const sameArea = dldBldg.a === dldAreaName;
        if (!sameArea) continue;
        if (fk.includes(norm) || norm.includes(fk)) return dldKey;
      }
    }
  }

  return null;
}

// ── Build VALUATION_DB ──
const VALUATION_DB = {};
let exactMatch = 0, fuzzyMatch = 0, areaFallback = 0, noData = 0;

Object.entries(existDB).forEach(([dbKey, dbVal]) => {
  const dldMatch = findDLDMatch(dbKey, dbVal.a);

  if (dldMatch && dld[dldMatch]) {
    const d = dld[dldMatch];
    const matchType = (dldMatch === dbKey) ? 'exact' : 'fuzzy';
    if (matchType === 'exact') exactMatch++; else fuzzyMatch++;

    // Confidence based on transaction count
    const conf = d.n >= 50 ? 'high' : d.n >= 10 ? 'medium' : 'low';

    VALUATION_DB[dbKey] = {
      p: d.p,
      lo: d.lo,
      hi: d.hi,
      n: d.n,
      src: matchType === 'exact' ? 'dld' : 'dld-fuzzy',
    };
  } else {
    // Area-level fallback
    const dbArea = dbVal.a;
    const dldAreaName = AREA_MAP[dbArea];
    if (dldAreaName && dldAreas[dldAreaName]) {
      areaFallback++;
      const aData = dldAreas[dldAreaName];
      VALUATION_DB[dbKey] = {
        p: aData.psf,
        lo: Math.round(aData.psf * 0.85),
        hi: Math.round(aData.psf * 1.15),
        n: 0,
        src: 'area',
      };
    } else {
      noData++;
      // Keep existing DB value as last resort
      VALUATION_DB[dbKey] = {
        p: dbVal.p,
        lo: dbVal.lo,
        hi: dbVal.hi,
        n: 0,
        src: 'legacy',
      };
    }
  }
});

// ── Build VALUATION_AREAS ──
const VALUATION_AREAS = {};
Object.entries(AREA_MAP).forEach(([dbArea, dldArea]) => {
  if (dldAreas[dldArea]) {
    VALUATION_AREAS[dbArea] = {
      psf: dldAreas[dldArea].psf,
      n: dldAreas[dldArea].n,
    };
  }
});

// ── Build VALUATION_DB_COM / VALUATION_DB_LAND ──
// Real DLD-transaction-calibrated commercial/land data has been sitting
// computed in calibration-output.json (same run that built VALUATION_DB
// above) but was never applied — DB_COM/DB_LAND in js/data-commercial.js
// have drifted stale relative to it. Exact-key matching alone covers the
// overwhelming majority of both databases (no fuzzy-matching complexity
// needed here, unlike residential): 1166/1914 DB_COM buildings and a full
// 253/253 DB_LAND plots match a calibrated DLD entry directly.
const VALUATION_DB_COM = {};
let comExact = 0;
Object.keys(existDBCom).forEach((key) => {
  const d = dldCom[key];
  if (d) {
    comExact++;
    VALUATION_DB_COM[key] = { p: d.p, lo: d.lo, hi: d.hi, n: d.n };
  }
});

const VALUATION_DB_LAND = {};
let landExact = 0;
Object.keys(existDBLand).forEach((key) => {
  const d = dldLand[key];
  if (d) {
    landExact++;
    VALUATION_DB_LAND[key] = { p: d.p, lo: d.lo, hi: d.hi, n: d.n };
  }
});

// Area-level: much lower key-naming overlap between AREAS_COM and DLD's
// area names for commercial (11/54) — worth including for what it covers,
// since it costs nothing extra and computeCommercialValuation() already
// has an aData-benchmark fallback tier this slots into.
const VALUATION_AREAS_COM = {};
Object.keys(dldComAreas).forEach((key) => {
  VALUATION_AREAS_COM[key] = { psf: dldComAreas[key].psf, n: dldComAreas[key].n };
});

// ── Stats ──
console.log('=== Build Results ===');
console.log('Total DB buildings:', Object.keys(existDB).length);
console.log('Exact DLD match:', exactMatch);
console.log('Fuzzy DLD match:', fuzzyMatch);
console.log('Area-level fallback:', areaFallback);
console.log('No DLD data (legacy kept):', noData);
console.log('VALUATION_AREAS:', Object.keys(VALUATION_AREAS).length);
console.log('VALUATION_DB_COM:', Object.keys(VALUATION_DB_COM).length, '/', Object.keys(existDBCom).length, 'DB_COM buildings matched');
console.log('VALUATION_DB_LAND:', Object.keys(VALUATION_DB_LAND).length, '/', Object.keys(existDBLand).length, 'DB_LAND plots matched');
console.log('VALUATION_AREAS_COM:', Object.keys(VALUATION_AREAS_COM).length);

// Show some fuzzy matches for verification
console.log('\n--- Sample Fuzzy Matches ---');
let shown = 0;
Object.entries(existDB).forEach(([dbKey, dbVal]) => {
  if (shown >= 30) return;
  const match = findDLDMatch(dbKey);
  if (match && match !== dbKey && dld[match]) {
    console.log('  DB:', dbKey, '→ DLD:', match, '| PSF:', dld[match].p, 'n:', dld[match].n);
    shown++;
  }
});

// ── Write output file ──
let jsContent = '// Auto-generated from DLD transaction data (2024+)\n';
jsContent += '// Generated: ' + new Date().toISOString() + '\n';
jsContent += '// Source: ' + cal.source + ' | Filter: ' + cal.dateFilter + '+\n';
jsContent += '// Exact: ' + exactMatch + ' | Fuzzy: ' + fuzzyMatch + ' | Area: ' + areaFallback + ' | Legacy: ' + noData + '\n';
jsContent += '// DO NOT EDIT MANUALLY — regenerate with: node tools/build-valuation-db.js\n\n';

// Compact format: p, lo, hi, plus n (sample count) so the live valuation
// engine can weight confidence by how much real transaction data actually
// backs an entry — a building calibrated from 2 transactions (one of which
// could be a gift/partial-share transfer that slipped past the outlier
// filters) deserves materially less confidence than one backed by 50. This
// used to be dropped here "to save space" — reversed since a few bytes per
// entry is a poor tradeoff against the engine having zero visibility into
// sample size at all (src is still dropped; it's diagnostic-only, not
// consumed by the valuation engine).
const compact = {};
Object.entries(VALUATION_DB).forEach(([k, v]) => {
  compact[k] = { p: v.p, lo: v.lo, hi: v.hi, n: v.n };
});

jsContent += 'var VALUATION_DB = ' + JSON.stringify(compact) + ';\n\n';

const compactAreas = {};
Object.entries(VALUATION_AREAS).forEach(([k, v]) => {
  compactAreas[k] = { psf: v.psf };
});
jsContent += 'var VALUATION_AREAS = ' + JSON.stringify(compactAreas) + ';\n\n';

// Commercial/land overlays — see the VALUATION_DB_COM/LAND build section
// above. Same compact {p,lo,hi,n} shape as residential's VALUATION_DB.
jsContent += 'var VALUATION_DB_COM = ' + JSON.stringify(VALUATION_DB_COM) + ';\n\n';
jsContent += 'var VALUATION_DB_LAND = ' + JSON.stringify(VALUATION_DB_LAND) + ';\n\n';
jsContent += 'var VALUATION_AREAS_COM = ' + JSON.stringify(VALUATION_AREAS_COM) + ';\n';

const outPath = path.join(__dirname, '..', 'js', 'valuation-db.js');
fs.writeFileSync(outPath, jsContent);
console.log('\nWritten:', outPath);
console.log('File size:', (fs.statSync(outPath).size / 1024).toFixed(0), 'KB');

// Show legacy buildings (no DLD data at all)
if (noData > 0) {
  console.log('\n--- Buildings with NO DLD data (legacy) ---');
  let legacyCount = 0;
  Object.entries(VALUATION_DB).forEach(([k, v]) => {
    if (v.src === 'legacy' && legacyCount < 20) {
      console.log('  ', k, '→ area:', existDB[k].a);
      legacyCount++;
    }
  });
}
