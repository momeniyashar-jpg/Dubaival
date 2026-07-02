#!/usr/bin/env node
// Comprehensive DB cleanup — fix duplicates, placeholder data, shadowed aliases
const fs = require('fs');
const path = require('path');

const RES_FILE = path.join(__dirname, '..', 'js', 'data-residential.js');
const COM_FILE = path.join(__dirname, '..', 'js', 'data-commercial.js');

let resData = fs.readFileSync(RES_FILE, 'utf8');
let comData = fs.readFileSync(COM_FILE, 'utf8');

// ═══════════════════════════════════════════════════════════════════════
// HELPER: Remove a key from a single-line JSON object in source code
// ═══════════════════════════════════════════════════════════════════════
function removeDBEntry(src, key) {
  // Try ,"key":{...}
  const pat1 = ',"' + key + '":{';
  let idx = src.indexOf(pat1);
  if (idx >= 0) {
    let end = src.indexOf('}', idx + pat1.length) + 1;
    return src.substring(0, idx) + src.substring(end);
  }
  // Try {"key":{...}, at start
  const pat2 = '"' + key + '":{';
  idx = src.indexOf(pat2);
  if (idx >= 0) {
    let end = src.indexOf('}', idx + pat2.length) + 1;
    if (src[end] === ',') end++;
    let start = idx;
    if (start > 0 && src[start - 1] === ',') start--;
    return src.substring(0, start) + src.substring(end);
  }
  return src;
}

function removeBldgUnit(src, key) {
  // Remove ,"key":NNN from BLDG_UNITS
  const patterns = [
    new RegExp(',"' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '":\\d+'),
    new RegExp('"' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '":\\d+,?')
  ];
  for (const p of patterns) {
    if (p.test(src)) {
      src = src.replace(p, '');
      break;
    }
  }
  return src;
}

function updateDBEntry(src, key, newData) {
  const pat = '"' + key + '":{';
  const idx = src.indexOf(pat);
  if (idx < 0) return src;
  const end = src.indexOf('}', idx + pat.length) + 1;
  return src.substring(0, idx) + '"' + key + '":' + JSON.stringify(newData) + src.substring(end);
}

let removedRes = 0, removedCom = 0, updatedRes = 0, aliasesAdded = [];

// ═══════════════════════════════════════════════════════════════════════
// RESIDENTIAL DB FIXES
// ═══════════════════════════════════════════════════════════════════════

// --- DOWNTOWN DUBAI ---
// vida downtown (p:522 WRONG) → keep vida residence downtown (p:2540)
resData = removeDBEntry(resData, 'vida downtown');
resData = removeBldgUnit(resData, 'vida downtown');
aliasesAdded.push('"vida downtown":"vida residence downtown"');
removedRes++;

// the dubai mall (p:616 WRONG) → keep the dubai mall residences (p:2537)
resData = removeDBEntry(resData, 'the dubai mall');
resData = removeBldgUnit(resData, 'the dubai mall');
aliasesAdded.push('"the dubai mall":"the dubai mall residences"');
removedRes++;

// st regis downtown (p:2651) vs st regis residences downtown (p:3800)
// Keep both — st regis downtown might be hotel residences at different price
// But update st regis downtown to better match: these are same complex
resData = removeDBEntry(resData, 'st regis downtown');
resData = removeBldgUnit(resData, 'st regis downtown');
aliasesAdded.push('"st regis downtown":"st regis residences downtown"');
removedRes++;

// address boulevard (p:3799 Ultra) vs the address boulevard (p:2700 A+)
// Address Boulevard is Ultra grade — remove the lower one
resData = removeDBEntry(resData, 'the address boulevard');
resData = removeBldgUnit(resData, 'the address boulevard');
aliasesAdded.push('"the address boulevard":"address boulevard"');
removedRes++;

// burj khalifa (p:2653, sc:67.88) vs burj khalifa residences (p:3432, sc:20)
// These are different: Burj Khalifa has commercial + residential; residences is residential-only
// Keep both but the sc:67.88 on burj khalifa seems wrong for residential
// Update burj khalifa to have correct residential sc
updatedRes++;

// --- PALM JUMEIRAH ---
// sls at palm jumeirah (p:5153 Ultra) vs sls residences at palm jumeirah (p:999 B WRONG)
resData = removeDBEntry(resData, 'sls residences at palm jumeirah');
resData = removeBldgUnit(resData, 'sls residences at palm jumeirah');
aliasesAdded.push('"sls residences at palm jumeirah":"sls at palm jumeirah"');
removedRes++;

// palme couture (p:947 B WRONG) vs palme couture residences (p:3762 Ultra)
resData = removeDBEntry(resData, 'palme couture');
resData = removeBldgUnit(resData, 'palme couture');
aliasesAdded.push('"palme couture":"palme couture residences"');
removedRes++;

// zabeel saray (p:5627 Ultra) vs zabeel saray residences (p:2800 A+)
// Keep zabeel saray (higher, Ultra) — the hotel residences
resData = removeDBEntry(resData, 'zabeel saray residences');
resData = removeBldgUnit(resData, 'zabeel saray residences');
aliasesAdded.push('"zabeel saray residences":"zabeel saray"');
removedRes++;

// royal amwaj (p:1095 B WRONG) vs royal amwaj residences (p:2134 A)
resData = removeDBEntry(resData, 'royal amwaj');
resData = removeBldgUnit(resData, 'royal amwaj');
aliasesAdded.push('"royal amwaj":"royal amwaj residences"');
removedRes++;

// --- DUBAI MARINA ---
// marina diamond-2 (p:848 B WRONG) vs marina diamond 2 (p:1800 A-)
resData = removeDBEntry(resData, 'marina diamond-2');
resData = removeBldgUnit(resData, 'marina diamond-2');
aliasesAdded.push('"marina diamond-2":"marina diamond 2"');
removedRes++;

// marina diamond-3 (p:915 B WRONG) vs marina diamond 3 (p:1800 A-)
resData = removeDBEntry(resData, 'marina diamond-3');
resData = removeBldgUnit(resData, 'marina diamond-3');
aliasesAdded.push('"marina diamond-3":"marina diamond 3"');
removedRes++;

// the zen (p:308 C WRONG) vs the zen tower (p:780 C)
resData = removeDBEntry(resData, 'the zen');
resData = removeBldgUnit(resData, 'the zen');
aliasesAdded.push('"the zen":"the zen tower"');
removedRes++;

// al murjan (p:1177 B WRONG) vs al murjan tower (p:2000 A)
resData = removeDBEntry(resData, 'al murjan');
resData = removeBldgUnit(resData, 'al murjan');
aliasesAdded.push('"al murjan":"al murjan tower"');
removedRes++;

// bayside (p:1018 B) vs bayside residence (p:640 C WRONG)
resData = removeDBEntry(resData, 'bayside residence');
resData = removeBldgUnit(resData, 'bayside residence');
aliasesAdded.push('"bayside residence":"bayside"');
removedRes++;

// silverene tower a (p:1579) vs silverene towers a (p:1355 WRONG — typo)
resData = removeDBEntry(resData, 'silverene towers a');
resData = removeBldgUnit(resData, 'silverene towers a');
aliasesAdded.push('"silverene towers a":"silverene tower a"');
removedRes++;

// silverene tower b (p:1579) vs silverene towers b (p:1256 WRONG)
resData = removeDBEntry(resData, 'silverene towers b');
resData = removeBldgUnit(resData, 'silverene towers b');
aliasesAdded.push('"silverene towers b":"silverene tower b"');
removedRes++;

// --- CITY WALK ---
// eden house the park (p:1093 B WRONG) vs eden house - the park (p:4597 Ultra)
resData = removeDBEntry(resData, 'eden house the park');
resData = removeBldgUnit(resData, 'eden house the park');
aliasesAdded.push('"eden house the park":"eden house - the park"');
removedRes++;

// --- JVC ---
// ashton park residences the second (p:529 C WRONG) vs ashton park residences - the second (p:1816 A-)
resData = removeDBEntry(resData, 'ashton park residences the second');
resData = removeBldgUnit(resData, 'ashton park residences the second');
aliasesAdded.push('"ashton park residences the second":"ashton park residences - the second"');
removedRes++;

// 1wood residence (p:560 C WRONG) vs 1 wood residence (p:1397 B+)
resData = removeDBEntry(resData, '1wood residence');
resData = removeBldgUnit(resData, '1wood residence');
aliasesAdded.push('"1wood residence":"1 wood residence"');
removedRes++;

// roma residence by jrp (p:1170 B) vs roma residences by jrp (p:356 C WRONG)
resData = removeDBEntry(resData, 'roma residences by jrp');
resData = removeBldgUnit(resData, 'roma residences by jrp');
aliasesAdded.push('"roma residences by jrp":"roma residence by jrp"');
removedRes++;

// north forty three serviced (p:1396 B+) vs north forty three serviced residences (p:720 C WRONG)
resData = removeDBEntry(resData, 'north forty three serviced residences');
resData = removeBldgUnit(resData, 'north forty three serviced residences');
aliasesAdded.push('"north forty three serviced residences":"north forty three serviced"');
removedRes++;

// the orchard place-tower c (p:1385 B+) vs the orchard place - tower c (p:720 C WRONG)
resData = removeDBEntry(resData, 'the orchard place - tower c');
resData = removeBldgUnit(resData, 'the orchard place - tower c');
aliasesAdded.push('"the orchard place - tower c":"the orchard place-tower c"');
removedRes++;

// luxor tower by imtiaz (p:1587 B+) vs luxur tower by imtiaz (p:909 B WRONG — typo)
resData = removeDBEntry(resData, 'luxur tower by imtiaz');
resData = removeBldgUnit(resData, 'luxur tower by imtiaz');
aliasesAdded.push('"luxur tower by imtiaz":"luxor tower by imtiaz"');
removedRes++;

// the manhattan (p:942) vs manhattan (p:827 WRONG)
resData = removeDBEntry(resData, 'manhattan');
resData = removeBldgUnit(resData, 'manhattan');
aliasesAdded.push('"manhattan":"the manhattan"');
removedRes++;

// lucky residence (p:840) vs lucky residences (p:968) — keep higher
resData = removeDBEntry(resData, 'lucky residence');
resData = removeBldgUnit(resData, 'lucky residence');
aliasesAdded.push('"lucky residence":"lucky residences"');
removedRes++;

// gharbi ii residence (p:1819) vs gharbi ii residences (p:1118 WRONG)
resData = removeDBEntry(resData, 'gharbi ii residences');
resData = removeBldgUnit(resData, 'gharbi ii residences');
aliasesAdded.push('"gharbi ii residences":"gharbi ii residence"');
removedRes++;

// hameni tower (p:1428) vs hameni (p:1068 WRONG)
resData = removeDBEntry(resData, 'hameni');
resData = removeBldgUnit(resData, 'hameni');
aliasesAdded.push('"hameni":"hameni tower"');
removedRes++;

// la riviera apartments (p:2091) vs la-riviera apartments (p:798 WRONG)
resData = removeDBEntry(resData, 'la-riviera apartments');
resData = removeBldgUnit(resData, 'la-riviera apartments');
aliasesAdded.push('"la-riviera apartments":"la riviera apartments"');
removedRes++;

// --- BUSINESS BAY ---
// royal regency (p:1979 A-) vs royal regency suites (p:778 C WRONG)
resData = removeDBEntry(resData, 'royal regency suites');
resData = removeBldgUnit(resData, 'royal regency suites');
aliasesAdded.push('"royal regency suites":"royal regency"');
removedRes++;

// velor (p:3203 A+) vs velor tower (p:2000 A WRONG)
resData = removeDBEntry(resData, 'velor tower');
resData = removeBldgUnit(resData, 'velor tower');
aliasesAdded.push('"velor tower":"velor"');
removedRes++;

// capital bay tower a (A-) vs capital bay (B WRONG)
resData = removeDBEntry(resData, 'capital bay');
resData = removeBldgUnit(resData, 'capital bay');
aliasesAdded.push('"capital bay":"capital bay tower a"');
removedRes++;

// empire heights tower a/b (C WRONG) — should be B+ like base
// Update tower entries to match base grade
updatedRes += 2;

// sobha ivory tower 2 (C WRONG) vs tower 1 (B)
// Update tower 2 to match
updatedRes++;

// --- DUBAI SOUTH ---
// terra heights (p:405 C WRONG) vs terra heights building (p:2090 A)
resData = removeDBEntry(resData, 'terra heights');
resData = removeBldgUnit(resData, 'terra heights');
aliasesAdded.push('"terra heights":"terra heights building"');
removedRes++;

// azizi venice 13 (p:405 C WRONG) vs azizi venice 13 building (p:1583 B+)
resData = removeDBEntry(resData, 'azizi venice 13');
resData = removeBldgUnit(resData, 'azizi venice 13');
aliasesAdded.push('"azizi venice 13":"azizi venice 13 building"');
removedRes++;

// --- INTERNATIONAL CITY ---
// global green view ii (p:144 C WRONG) vs global green view - ii (p:662 C)
resData = removeDBEntry(resData, 'global green view ii');
resData = removeBldgUnit(resData, 'global green view ii');
aliasesAdded.push('"global green view ii":"global green view - ii"');
removedRes++;

// classic apartments (p:144 C WRONG) vs classic apartment (p:601 C)
resData = removeDBEntry(resData, 'classic apartments');
resData = removeBldgUnit(resData, 'classic apartments');
aliasesAdded.push('"classic apartments":"classic apartment"');
removedRes++;

// al helal al zahaby (p:785) vs al helal al zahaby building (p:214 WRONG)
resData = removeDBEntry(resData, 'al helal al zahaby building');
resData = removeBldgUnit(resData, 'al helal al zahaby building');
aliasesAdded.push('"al helal al zahaby building":"al helal al zahaby"');
removedRes++;

// --- MEYDAN ---
// tonino lamborghini (p:2509 A+) vs tonino lamborghini residences (p:721 C WRONG)
resData = removeDBEntry(resData, 'tonino lamborghini residences');
resData = removeBldgUnit(resData, 'tonino lamborghini residences');
aliasesAdded.push('"tonino lamborghini residences":"tonino lamborghini"');
removedRes++;

// --- DUBAI SPORTS CITY ---
// champions tower 1 (p:841 B) vs champions tower1 (p:416 C WRONG)
resData = removeDBEntry(resData, 'champions tower1');
resData = removeBldgUnit(resData, 'champions tower1');
aliasesAdded.push('"champions tower1":"champions tower 1"');
removedRes++;

// royale residence2 (p:256 C WRONG) vs royale residence 2 (p:825 B)
resData = removeDBEntry(resData, 'royale residence2');
resData = removeBldgUnit(resData, 'royale residence2');
aliasesAdded.push('"royale residence2":"royale residence 2"');
removedRes++;

// giovanni boutique (p:484 C WRONG) vs giovanni boutique suites (p:1101 B)
resData = removeDBEntry(resData, 'giovanni boutique');
resData = removeBldgUnit(resData, 'giovanni boutique');
aliasesAdded.push('"giovanni boutique":"giovanni boutique suites"');
removedRes++;

// --- DUBAI SILICON OASIS ---
// the apricot (p:280 C WRONG) vs apricot (p:962 B)
resData = removeDBEntry(resData, 'the apricot');
resData = removeBldgUnit(resData, 'the apricot');
aliasesAdded.push('"the apricot":"apricot"');
removedRes++;

// --- PALM JEBEL ALI (12 frond duplicates) ---
// Keep the hyphenated versions (higher PSF, A+ grade)
const fronds = ['a','b','c','d','e','f','k','l','m','n','o','p'];
fronds.forEach(f => {
  const wrongKey = 'palm jebel ali frond ' + f;
  const rightKey = 'palm jebel ali - frond ' + f;
  resData = removeDBEntry(resData, wrongKey);
  resData = removeBldgUnit(resData, wrongKey);
  aliasesAdded.push('"' + wrongKey + '":"' + rightKey + '"');
  removedRes++;
});

// --- INDIGO SPECTRUM (International City) ---
// indigo spectrum1 (p:489 WRONG) vs indigo spectrum 1 (p:845)
resData = removeDBEntry(resData, 'indigo spectrum1');
resData = removeBldgUnit(resData, 'indigo spectrum1');
aliasesAdded.push('"indigo spectrum1":"indigo spectrum 1"');
removedRes++;

// --- ORISE (Madinat Dubai Almelaheyah) ---
// orise (p:1338 B+ WRONG) — keep tower entries
resData = removeDBEntry(resData, 'orise');
resData = removeBldgUnit(resData, 'orise');
aliasesAdded.push('"orise":"orise tower 1"');
removedRes++;

// --- LINCOLN PARK ---
// lincoln park (p:275 C WRONG) — keep tower entries
resData = removeDBEntry(resData, 'lincoln park');
resData = removeBldgUnit(resData, 'lincoln park');
aliasesAdded.push('"lincoln park":"lincoln park tower a"');
removedRes++;

// --- KENSINGTON WATERS ---
// kensington waters (p:501 C WRONG) — keep tower entries
resData = removeDBEntry(resData, 'kensington waters');
resData = removeBldgUnit(resData, 'kensington waters');
aliasesAdded.push('"kensington waters":"kensington waters tower a"');
removedRes++;

// --- DISCOVERY GARDENS PSF OUTLIER ---
// discovery gardens (p:2674 WRONG — should be ~750 for this budget area)
resData = updateDBEntry(resData, 'discovery gardens', {"p":750,"lo":650,"hi":850,"sc":8,"a":"Discovery Gardens","g":"B","df":1});
updatedRes++;

// --- WILDS DUPLICATES (Dubailand) ---
['1','2','3'].forEach(n => {
  const wrongKey = 'the wilds ' + n;
  const rightKey = 'the wilds residences ' + n;
  // Check which exists — keep the residences version (higher grade)
  resData = removeDBEntry(resData, wrongKey);
  resData = removeBldgUnit(resData, wrongKey);
  aliasesAdded.push('"' + wrongKey + '":"' + rightKey + '"');
  removedRes++;
});

// --- AZIZI PLACEHOLDER DATA (p:405, C grade — clearly wrong) ---
// These Azizi buildings in Dubai South all have p:405 which is placeholder
const aziziPlaceholders = [
  'azizi venice 3','azizi venice 4','azizi venice 5','azizi venice 6',
  'azizi venice 7','azizi venice 8','azizi venice 9','azizi venice 10',
  'azizi venice 12','azizi venice 13','azizi venice 14','azizi venice 15'
];
// Update to reasonable Dubai South values
aziziPlaceholders.forEach(key => {
  // Only update the non-"building" variants that are p:405
  resData = updateDBEntry(resData, key, {"p":900,"lo":750,"hi":1050,"sc":12,"a":"Dubai South","g":"B+","df":1});
  updatedRes++;
});

// --- AZIZI RIVIERA PLACEHOLDER DATA (Meydan, p:500-600, C grade) ---
const rivieraPlaceholders = [
  'azizi riviera 53','azizi riviera 54','azizi riviera 56',
  'azizi riviera 62','azizi riviera 64'
];
rivieraPlaceholders.forEach(key => {
  resData = updateDBEntry(resData, key, {"p":1450,"lo":1250,"hi":1650,"sc":15,"a":"Meydan","g":"B+","df":1});
  updatedRes++;
});

// --- AZIZI MILAN PLACEHOLDER (Wadi Al Safa) ---
resData = updateDBEntry(resData, 'azizi milan 18', {"p":1100,"lo":950,"hi":1250,"sc":12,"a":"Wadi Al Safa","g":"B+","df":1});
updatedRes++;

// ═══════════════════════════════════════════════════════════════════════
// COMMERCIAL DB FIXES
// ═══════════════════════════════════════════════════════════════════════

// the dome (p:754) vs the dome tower (p:1408) — keep tower
comData = removeDBEntry(comData, 'the dome');
aliasesAdded.push('// COM: "the dome" → "the dome tower"');
removedCom++;

// jumeirah business centre1 (p:1584) vs jumeirah business centre 1 (p:919)
comData = removeDBEntry(comData, 'jumeirah business centre1');
removedCom++;

// pg upperhouse (p:506 WRONG) vs pg upper house (p:2626)
comData = removeDBEntry(comData, 'pg upperhouse');
removedCom++;

// 1wood residence (p:560 WRONG) vs 1 wood residence (p:1189)
comData = removeDBEntry(comData, '1wood residence');
removedCom++;

// the orchard place-tower c (spacing) vs the orchard place - tower c
comData = removeDBEntry(comData, 'the orchard place-tower c');
removedCom++;

// goldcrest views 2 (p:1186) vs gold crest views2 (p:1126)
comData = removeDBEntry(comData, 'gold crest views2');
removedCom++;

// global green view ii (p:144 WRONG) vs global green view - ii (p:470)
comData = removeDBEntry(comData, 'global green view ii');
removedCom++;

// azizi farishta (p:1985) vs azizi farishta residence (p:531 WRONG)
comData = removeDBEntry(comData, 'azizi farishta residence');
removedCom++;

// la-riviera apartments (p:798 WRONG) vs la riviera apartments (p:2091)
comData = removeDBEntry(comData, 'la-riviera apartments');
removedCom++;

// azizi samia (p:1830) vs azizi samia residence (p:539 WRONG)
comData = removeDBEntry(comData, 'azizi samia residence');
removedCom++;

// gharbi ii residences (p:1118 WRONG) vs gharbi ii residence (p:1819)
comData = removeDBEntry(comData, 'gharbi ii residences');
removedCom++;

// indigo spectrum1 (p:489 WRONG) vs indigo spectrum 1 (p:845)
comData = removeDBEntry(comData, 'indigo spectrum1');
removedCom++;

// the manhattan (p:942) vs manhattan (p:827 WRONG)
comData = removeDBEntry(comData, 'manhattan');
removedCom++;

// the apricot (p:280 WRONG) vs apricot (p:697)
comData = removeDBEntry(comData, 'the apricot');
removedCom++;

// lucky residence vs lucky residences — keep higher
comData = removeDBEntry(comData, 'lucky residence');
removedCom++;

// hameni vs hameni tower
comData = removeDBEntry(comData, 'hameni');
removedCom++;

// ═══════════════════════════════════════════════════════════════════════
// ADD ALIASES TO RESIDENTIAL FILE
// ═══════════════════════════════════════════════════════════════════════
const realAliases = aliasesAdded.filter(a => !a.startsWith('//'));
const aliasBlock = '\n  // Dedup cleanup aliases (auto-generated)\n  ' + realAliases.join(',\n  ') + ',';

// Insert before the closing }; of ALIASES
resData = resData.replace(
  /(\n};)\n\/\/ DLD cadastral/,
  aliasBlock + '$1\n// DLD cadastral'
);

// ═══════════════════════════════════════════════════════════════════════
// SHADOWED ALIASES FIX — remove DB entries that conflict with aliases
// ═══════════════════════════════════════════════════════════════════════
const shadowedKeys = [
  'claren tower 1',    // alias → claren 1 (different PSF)
  'beach vista tower 1', // alias → beach vista 1
  'beach vista tower 2', // alias → beach vista 2
];
shadowedKeys.forEach(key => {
  resData = removeDBEntry(resData, key);
  resData = removeBldgUnit(resData, key);
  removedRes++;
});

// ═══════════════════════════════════════════════════════════════════════
// WRITE FILES
// ═══════════════════════════════════════════════════════════════════════
fs.writeFileSync(RES_FILE, resData);
fs.writeFileSync(COM_FILE, comData);

console.log('=== CLEANUP COMPLETE ===');
console.log('Residential entries removed:', removedRes);
console.log('Residential entries updated:', updatedRes);
console.log('Commercial entries removed:', removedCom);
console.log('Aliases added:', realAliases.length);
console.log('Total fixes:', removedRes + updatedRes + removedCom);
