#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const base = fs.readFileSync(path.join(__dirname, '..', 'pitch-deck.html'), 'utf8');
const deckDir = path.join(__dirname, '..', 'pitch-decks');

const files = [
  'pitch-deck-difc-proptech-hub.html',
  'pitch-deck-reach-me.html',
  'pitch-deck-in5.html',
  'pitch-deck-sandbox.html'
];

// Extract updated sections from base
function extractSection(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  if (start === -1) return null;
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (end === -1) return null;
  return html.substring(start, end);
}

// Get updated sections from base pitch-deck.html
const baseRevenue = extractSection(base, '<h3 style="color:var(--t1);">Revenue Projection</h3>', '</div>\n</div>\n\n');
const baseGTM = extractSection(base, '<!-- SLIDE 7B: GO-TO-MARKET', '<!-- SLIDE 8: MARKET SIZE');
const baseMilestones = extractSection(base, '<h3 style="color:var(--t1);">Key Milestones</h3>', '</div>\n    </div>\n  </div>\n</div>\n\n<!-- ═');
const baseTeam = extractSection(base, '<!-- SLIDE 16: TEAM', '<!-- SLIDE 17: THE ASK');

for (const filename of files) {
  const filePath = path.join(deckDir, filename);
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Replace gmail with domain email
  html = html.replace(/momeni\.yashar@gmail\.com/g, 'momeni.yashar@gmail.com');

  // 2. Replace old revenue table
  const oldRevenuePatterns = [
    { old: 'AED 180K</td><td>AED 720K</td><td>AED 2.4M', new: 'AED 600K</td><td>AED 2.4M</td><td>AED 7.2M' },
    { old: 'AED 120K</td><td>AED 480K</td><td>AED 1.8M', new: 'AED 240K</td><td>AED 1.2M</td><td>AED 4.8M' },
    { old: 'AED 60K</td><td>AED 360K</td><td>AED 1.2M', new: 'AED 180K</td><td>AED 720K</td><td>AED 2.4M' },
    { old: 'AED 360K</td>', new: 'AED 1.02M</td>' },
    { old: 'AED 1.56M</td>', new: 'AED 4.32M</td>' },
    { old: 'AED 5.4M</td>', new: 'AED 14.4M</td>' },
  ];
  for (const p of oldRevenuePatterns) {
    html = html.replace(p.old, p.new);
  }

  // 3. Replace old assumptions
  html = html.replace(
    /Assumptions: Y1:.*?UAE PropTech adoption curves\./s,
    'Assumptions: Y1: 1,000 subscribers (3% of 32K RERA brokers) avg AED 150/mo + 10 API clients + 50 agent subscriptions. Y2: 5,000 subscribers + 50 enterprise clients (banks, brokerages, developers). 4x growth (SaaS benchmark for product-led growth). Y3: 15,000 subscribers across Dubai + 3 PropLens markets + 200 enterprise clients + active deal marketplace with 2% commission.'
  );

  // 4. Replace SOM
  html = html.replace(
    /SOM — \$12M<\/strong>\s*<p[^>]*>Capturable market in Year 3[^<]*/s,
    'SOM — $4M (Year 3)</strong>\n          <p style="font-size:13px;margin-top:4px;">AED 14.4M revenue target: 15,000 subscribers + 200 enterprise clients + deal marketplace in Dubai + 3 PropLens markets'
  );

  // 5. Replace old milestones
  html = html.replace(
    /10,000 Buildings<\/span>\s*<span class="tag tag-blue"[^>]*>Q4 2026<\/span>/s,
    '10,880 Buildings</span>\n            <span class="tag tag-green" style="font-size:11px;">Done &#10003;</span>'
  );
  html = html.replace(
    /Complete Dubai building database coverage/,
    'Full Dubai building database — target 15,000 by Q4 2026'
  );
  html = html.replace(
    /1,000 Active Users<\/span>\s*<span class="tag tag-blue"[^>]*>Q1 2027<\/span>/s,
    '1,000 Registered Users</span>\n            <span class="tag tag-blue" style="font-size:11px;">Q4 2026</span>'
  );
  html = html.replace(
    /Monthly active users on platform/,
    'Early adopter agents + investors via waitlist &amp; demo'
  );

  // 6. Add DLD API milestone (replace First Enterprise Client timing)
  html = html.replace(
    /First Enterprise Client<\/span>\s*<span class="tag tag-gold"[^>]*>Q1 2027<\/span>/s,
    'DLD API Integration</span>\n            <span class="tag tag-blue" style="font-size:11px;">Q4 2026</span>'
  );
  html = html.replace(
    /Bank or brokerage API integration/,
    'Official transaction data → accuracy from ~80% to 95%+'
  );

  // 7. Update Series A target
  html = html.replace(
    /Target: \$5-15M at 20\+ country coverage/,
    'Target: $5-15M at 15,000 users + 20 countries'
  );

  // 8. Update team slide title
  html = html.replace(
    'Built by Someone Who Knows the Market',
    'One Founder. <span class="highlight">Complete Platform.</span>'
  );

  // 9. Update founder name and bio
  html = html.replace('Mohammad Akbar Momenian Momenian', 'Mohammad Akbar Momenian');
  html = html.replace('>MA<', '>YM<');
  html = html.replace(
    /Dubai-based entrepreneur with deep domain expertise in UAE real estate markets\. Combines hands-on market knowledge with technical product development capabilities\./,
    'Dubai-based entrepreneur and full-stack developer with deep hands-on experience in UAE real estate. Built the entire DubAIVal platform — from AI valuation engine to production deployment — as a solo founder.'
  );

  // 10. Insert GTM slide before Market Size slide
  if (html.indexOf('Go-to-Market Strategy') === -1 && baseGTM) {
    html = html.replace(
      '<!-- SLIDE 8: MARKET SIZE',
      baseGTM + '\n<!-- SLIDE 8: MARKET SIZE'
    );
  }

  // 11. Re-number all slides sequentially
  let slideNum = 0;
  html = html.replace(/<div class="slide-num">\d+<\/div>/g, () => {
    slideNum++;
    return `<div class="slide-num">${String(slideNum).padStart(2, '0')}</div>`;
  });

  fs.writeFileSync(filePath, html, 'utf8');
  const slides = (html.match(/class="slide"/g) || []).length;
  const gtm = html.indexOf('Go-to-Market') !== -1 ? 'yes' : 'no';
  console.log(`✓ ${filename} (${html.length} bytes, ${slides} slides, GTM: ${gtm})`);
}

console.log('\nDone! All 4 agent-created files updated.');
