#!/usr/bin/env node
/**
 * fix-df1.js
 *
 * Removes "df":1 from all buildings in var DB={...} in js/data-residential.js
 * UNLESS the building name matches a branded/hotel residence pattern.
 *
 * The DB object is on a SINGLE LINE. We parse it as JSON, iterate every key,
 * and remove the df property from non-branded buildings.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '..', 'js', 'data-residential.js');

// --- Branded / hotel residence patterns (case-insensitive) ---
// Each pattern is a regex tested against the building key (lowercase).
const BRANDED_PATTERNS = [
  // Address Hotels & Resorts (all)
  // Matches "address boulevard", "address residences", "the address", "beachgate by address", etc.
  // Does NOT match things like "al address" that aren't brand-related
  /\baddress\b/,

  // Armani
  /armani/,

  // Vida (word boundary to avoid "avida")
  /\bvida\b/,

  // W Residences / W Dubai
  /\bw residen/,
  /\bw dubai\b/,

  // Five Palm / Five JBR / Five Luxe / Five Jumeirah / Sensoria at Five
  /\bfive (palm|jbr|luxe|jumeirah)\b/,
  /\bsensoria\b.*\bfive\b/,

  // Tonino Lamborghini
  /tonino lamborghini/,

  // Bulgari
  /bulgari/,

  // One&Only / One and Only
  /one\s*&\s*only/,
  /one\s+and\s+only/,

  // Palace (brand) - Palace Hotels & Resorts by Emaar Hospitality
  // KEEP: palace beach, palace residences, palace by the beach, lyvia/avarra by palace,
  //       emerald palace kempinski, creek palace
  // EXCLUDE: "palace tower" / "palace towers" in DSO (generic building name),
  //          "palace estates" in JVC (generic), "cordoba palace", "barari palace"
  /^palace beach\b/,
  /^palace residences\b/,
  /^palace by the\b/,
  /^palace downtown\b/,
  /^the palace\b/,
  /\bby palace\b/,
  /\bemerald palace\b/,
  /\bcreek palace\b/,

  // Caesars
  /caesars/,

  // Atlantis
  /atlantis/,

  // SLS
  /\bsls\b/,

  // Jumeirah Living / Madinat Jumeirah Living
  /jumeirah living/,
  /madinat jumeirah living/,
  /\brahaal\b.*jumeirah/,

  // Kempinski
  /kempinski/,

  // Palazzo Versace / Versace
  /versace/,
  /palazzo versace/,

  // Raffles
  /raffles/,

  // Six Senses
  /six senses/,

  // St Regis / St. Regis
  /st\.?\s*regis/,

  // Banyan Tree
  /banyan tree/,

  // ME by Melia / ME Dubai
  /\bme by melia\b/,
  /\bme dubai\b/,

  // Mandarin Oriental
  /mandarin oriental/,

  // Dorchester Collection
  /dorchester/,

  // Anantara
  /anantara/,

  // Nikki Beach
  /nikki beach/,

  // SO/ Uptown / SO Uptown
  /\bso\/?\s*uptown\b/,

  // Baccarat
  /baccarat/,

  // Four Seasons
  /four seasons/,

  // Ritz-Carlton / Ritz Carlton
  /ritz[\s-]*carlton/,

  // Zabeel Saray
  /zabeel saray/,

  // Palme Couture
  /palme couture/,

  // Royal Amwaj Residences
  /royal amwaj/,

  // DAMAC Maison (serviced hotel residences)
  /damac maison/,

  // Paramount
  /paramount/,

  // Viceroy
  /viceroy/,

  // Rove Home (Rove Hotels branded residences)
  /\brove home\b/,
];

function isBranded(key) {
  for (const pat of BRANDED_PATTERNS) {
    if (pat.test(key)) return true;
  }
  return false;
}

// --- Main ---
console.log('Reading', DATA_FILE);
const src = fs.readFileSync(DATA_FILE, 'utf8');

// Find the line starting with "var DB={"
const lines = src.split('\n');
let dbLineIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('var DB={')) {
    dbLineIdx = i;
    break;
  }
}
if (dbLineIdx === -1) {
  console.error('ERROR: Could not find "var DB={" line');
  process.exit(1);
}

const dbLine = lines[dbLineIdx];

// Extract the JSON object (strip "var DB=" prefix and trailing ";")
const jsonStr = dbLine.replace(/^var DB=/, '').replace(/;$/, '');

let db;
try {
  db = JSON.parse(jsonStr);
} catch (e) {
  console.error('ERROR: Failed to parse DB JSON:', e.message);
  process.exit(1);
}

const totalBuildings = Object.keys(db).length;
let removedCount = 0;
let keptCount = 0;
const keptList = [];
const hadDf1Count = Object.values(db).filter(v => v.df === 1).length;

for (const [key, val] of Object.entries(db)) {
  if (val.df !== undefined) {
    if (isBranded(key)) {
      keptCount++;
      keptList.push(key);
    } else {
      delete val.df;
      removedCount++;
    }
  }
}

// Rebuild the line — "var DB=" + JSON (no spaces, matching original format) + ";"
const newJsonStr = JSON.stringify(db);
const newDbLine = 'var DB=' + newJsonStr + ';';

lines[dbLineIdx] = newDbLine;

// Write back
const newSrc = lines.join('\n');
fs.writeFileSync(DATA_FILE, newSrc, 'utf8');

// --- Report ---
console.log('\n=== RESULTS ===');
console.log(`Total buildings in DB: ${totalBuildings}`);
console.log(`Buildings that had df:1: ${hadDf1Count}`);
console.log(`df:1 REMOVED (non-branded): ${removedCount}`);
console.log(`df:1 KEPT (branded/hotel): ${keptCount}`);
console.log(`\n--- Branded buildings that KEPT df:1 (${keptCount}): ---`);
keptList.sort().forEach(b => console.log(`  ✓ ${b}`));
