#!/usr/bin/env node
/**
 * fix-rental-data.js
 *
 * Finds all AREAS entries missing r1/r2/r3 apartment rental data
 * and adds reasonable estimates based on the PSF (price per sqft) tier.
 *
 * PSF → Rent correlation tiers:
 *   Ultra premium (PSF 3000+):   r1:100000, r2:150000, r3:220000
 *   Premium      (PSF 2000-3000): r1:70000,  r2:110000, r3:160000
 *   Upper mid    (PSF 1500-2000): r1:55000,  r2:85000,  r3:130000
 *   Mid range    (PSF 1000-1500): r1:40000,  r2:65000,  r3:100000
 *   Affordable   (PSF 700-1000):  r1:30000,  r2:48000,  r3:72000
 *   Budget       (PSF under 700): r1:22000,  r2:35000,  r3:55000
 */

const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'js', 'data-residential.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find the AREAS block boundaries
const areasStart = content.indexOf('const AREAS={');
const areasEnd = content.indexOf('};', areasStart) + 2;
let areasBlock = content.substring(areasStart, areasEnd);

// Split into lines for per-area processing
const lines = areasBlock.split('\n');
let modified = 0;
let added_r1 = 0, added_r2 = 0, added_r3 = 0;
let report = [];

function getRentTier(psf) {
  if (psf >= 3000) return { r1: 100000, r2: 150000, r3: 220000, tier: 'Ultra premium' };
  if (psf >= 2000) return { r1: 70000,  r2: 110000, r3: 160000, tier: 'Premium' };
  if (psf >= 1500) return { r1: 55000,  r2: 85000,  r3: 130000, tier: 'Upper mid' };
  if (psf >= 1000) return { r1: 40000,  r2: 65000,  r3: 100000, tier: 'Mid range' };
  if (psf >= 700)  return { r1: 30000,  r2: 48000,  r3: 72000,  tier: 'Affordable' };
  return              { r1: 22000,  r2: 35000,  r3: 55000,  tier: 'Budget' };
}

const newLines = lines.map(line => {
  // Match area entry lines
  const nameMatch = line.match(/"([^"]+)":\{/);
  if (!nameMatch) return line;

  const name = nameMatch[1];
  const hasR1 = /\br1:/.test(line);
  const hasR2 = /\br2:/.test(line);
  const hasR3 = /\br3:/.test(line);

  // Skip if all three already present
  if (hasR1 && hasR2 && hasR3) return line;

  // Extract PSF value
  const psfMatch = line.match(/\bpsf:(\d+(?:\.\d+)?)/);
  if (!psfMatch) return line;
  const psf = parseFloat(psfMatch[1]);

  const tier = getRentTier(psf);
  let newLine = line;
  let fieldsAdded = [];

  // We need to insert r1, r2, r3 after the sc: field (or after psf if no sc)
  // Strategy: find the right insertion point and add missing fields

  if (!hasR1) {
    // Insert r1 after sc:NN or sc:NN.N
    // Find insertion point: after sc:value, or after psf:value if no sc
    const scPattern = /(\bsc:\d+(?:\.\d+)?)(,)/;
    const psfPattern = /(\bpsf:\d+(?:\.\d+)?)(,)/;

    if (scPattern.test(newLine)) {
      newLine = newLine.replace(scPattern, `$1,r1:${tier.r1},`);
      // The replacement adds r1 after sc, but we need to handle the comma correctly
      // Actually let's be more careful - replace sc:XX, with sc:XX,r1:NNNNN,
      newLine = line; // reset and do it properly
    }

    // Better approach: insert all missing fields at once after sc:
    break_out: {
      // Find insertion point
      let insertAfter;
      const scMatch = newLine.match(/\bsc:\d+(?:\.\d+)?/);
      if (scMatch) {
        insertAfter = scMatch.index + scMatch[0].length;
      } else {
        const pMatch = newLine.match(/\bpsf:\d+(?:\.\d+)?/);
        if (pMatch) {
          insertAfter = pMatch.index + pMatch[0].length;
        } else {
          break break_out;
        }
      }

      // Build the fields to insert
      let fields = '';
      if (!hasR1) { fields += `,r1:${tier.r1}`; fieldsAdded.push(`r1:${tier.r1}`); added_r1++; }
      if (!hasR2) { fields += `,r2:${tier.r2}`; fieldsAdded.push(`r2:${tier.r2}`); added_r2++; }
      if (!hasR3) { fields += `,r3:${tier.r3}`; fieldsAdded.push(`r3:${tier.r3}`); added_r3++; }

      newLine = newLine.substring(0, insertAfter) + fields + newLine.substring(insertAfter);
      modified++;
      report.push(`  ${name} (PSF ${psf}, ${tier.tier}): added ${fieldsAdded.join(', ')}`);
    }

    return newLine;
  }

  // If we have r1 but missing r2 or r3
  let fieldsToAdd = [];
  let insertPoint;

  if (hasR1 && !hasR2) {
    // Insert r2 after r1:value
    const r1Match = newLine.match(/\br1:\d+/);
    if (r1Match) {
      insertPoint = r1Match.index + r1Match[0].length;
      fieldsToAdd.push({ field: `r2:${tier.r2}`, label: `r2:${tier.r2}` });
      added_r2++;
    }
  }

  if (hasR1 && hasR2 && !hasR3) {
    // Insert r3 after r2:value
    const r2Match = newLine.match(/\br2:\d+/);
    if (r2Match) {
      insertPoint = r2Match.index + r2Match[0].length;
      fieldsToAdd.push({ field: `r3:${tier.r3}`, label: `r3:${tier.r3}` });
      added_r3++;
    }
  }

  if (!hasR2 && !hasR3 && hasR1) {
    // Has r1 but missing both r2 and r3
    const r1Match = newLine.match(/\br1:\d+/);
    if (r1Match) {
      insertPoint = r1Match.index + r1Match[0].length;
      if (!hasR2) { fieldsToAdd.push({ field: `r2:${tier.r2}`, label: `r2:${tier.r2}` }); added_r2++; }
      if (!hasR3) { fieldsToAdd.push({ field: `r3:${tier.r3}`, label: `r3:${tier.r3}` }); added_r3++; }
    }
  }

  if (fieldsToAdd.length > 0 && insertPoint !== undefined) {
    const insertStr = ',' + fieldsToAdd.map(f => f.field).join(',');
    newLine = newLine.substring(0, insertPoint) + insertStr + newLine.substring(insertPoint);
    modified++;
    report.push(`  ${name} (PSF ${psf}, ${tier.tier}): added ${fieldsToAdd.map(f => f.label).join(', ')}`);
  }

  return newLine;
});

// Reconstruct the content
const newAreasBlock = newLines.join('\n');
const newContent = content.substring(0, areasStart) + newAreasBlock + content.substring(areasEnd);

fs.writeFileSync(filePath, newContent, 'utf8');

console.log(`\n=== Rental Data Fix Report ===`);
console.log(`Total areas modified: ${modified}`);
console.log(`  r1 (studio) added: ${added_r1}`);
console.log(`  r2 (1BR) added:    ${added_r2}`);
console.log(`  r3 (2BR) added:    ${added_r3}`);
console.log(`\nDetails:`);
report.forEach(r => console.log(r));
console.log(`\nFile saved: ${filePath}`);
