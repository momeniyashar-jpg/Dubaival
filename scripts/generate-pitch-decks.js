#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const base = fs.readFileSync(path.join(__dirname, '..', 'pitch-deck.html'), 'utf8');
const outDir = path.join(__dirname, '..', 'pitch-decks');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const targets = {
  'pitch-deck-mbrif.html': {
    preparedFor: 'Prepared for Mohammed Bin Rashid Innovation Fund (MBRIF)',
    alignTitle: 'DubAIVal: Technology Innovation for<br/><span class="gold">UAE\'s National Strategy</span>',
    alignSubtitle: 'MBRIF supports 7 national innovation priorities. DubAIVal falls directly under "Technology" — solving critical market inefficiency with AI.',
    alignCards: [
      { icon: '&#129504;', color: 'var(--gold)', title: 'Technology Sector — National Priority', desc: 'MBRIF supports 7 priority sectors. DubAIVal falls directly under "Technology" — we use AI, machine learning, hedonic regression, NLP, and voice recognition to solve a critical market inefficiency in the AED 761B Dubai real estate market.' },
      { icon: '&#9889;', color: 'var(--acc)', title: 'Post-Ideation, Working Product', desc: 'MBRIF requires a working prototype beyond ideation. DubAIVal is a live production platform with 10,880 DLD-verified properties, 347 area benchmarks, and 12 AI-powered modules operational at dubaival.com — not a concept.' },
      { icon: '&#128200;', color: 'var(--acc2)', title: 'Market Transparency = Economic Growth', desc: 'By providing independent, AI-powered valuations, DubAIVal removes information asymmetry that deters foreign investment. 110,000 new investors entered Dubai in 2024 — our platform ensures they invest with confidence.' },
      { icon: '&#128176;', color: 'var(--green)', title: 'Revenue-Ready Business Model', desc: 'Three scalable revenue streams: B2C subscriptions (AED 99-249/mo), B2B API licensing (AED 2,000+/mo), and Deal Network marketplace fees. MBRIF funding accelerates time-to-revenue, not just development.' }
    ],
    alignBottom: '<span class="gold">Key Fit:</span> MBRIF seeks post-ideation technology innovation with national economic impact. DubAIVal is a <strong style="color:var(--acc);">live, working AI platform</strong> that protects investors, attracts global capital, and modernizes the AED 761B Dubai real estate market.',
    askTitle: 'MBRIF Funding Proposal',
    askCards: [
      { icon: '&#128176;', color: 'var(--acc)', title: 'Interest-Free Funding', desc: 'Up to AED 2,000,000 to cover: professional UI/UX design, team hiring (data engineer + growth marketer), DLD API integration, server infrastructure scaling.' },
      { icon: '&#128421;', color: 'var(--gold)', title: 'Server Infrastructure', desc: 'Scale from Vercel Hobby to enterprise: dedicated servers, CDN, real-time data processing for 10,880+ properties and growing.' },
      { icon: '&#128640;', color: 'var(--acc2)', title: 'Market Launch', desc: 'Agent acquisition campaign (32,000+ RERA-registered brokers), investor marketing, B2B enterprise sales team, strategic partnerships.' },
      { icon: '&#127758;', color: 'var(--green)', title: 'Global Expansion Prep', desc: 'PropLens.ai brand development, CASAFARI API integration for European markets (Spain, Portugal, France — Phase 2A), localized AVM models.' }
    ],
    askBox: '<p style="font-size:13px;color:var(--gold);font-weight:600;">MBRIF Funding Target: AED 1,500,000</p><p style="font-size:12px;color:var(--t2);margin-top:4px;">Comparable: Prop-AI ($1.5M pre-seed), Prypco ($10M seed) — Dubai PropTech benchmarks</p><p style="font-size:12px;color:var(--t2);margin-top:2px;">Runway: 18 months to profitability</p>',
    askQuote: 'MBRIF funding doesn\'t create a product — it accelerates a <strong style="color:var(--acc);">proven AI platform</strong> to market. The technology works. The data is verified. Now we need the runway to monetize.'
  },
  'pitch-deck-dubainext.html': {
    preparedFor: 'Prepared for Dubai Next — Community Crowdfunding Platform',
    alignTitle: 'Democratizing Real Estate Intelligence<br/><span class="gold">For Everyone in Dubai</span>',
    alignSubtitle: 'DubAIVal protects everyday buyers from misinformation, fake listings, and price manipulation — and crowdfunding keeps us independent.',
    alignCards: [
      { icon: '&#127968;', color: 'var(--gold)', title: 'Protecting Everyday Buyers', desc: 'Every day, families in Dubai make the biggest financial decision of their lives — buying a home. Without independent data, they overpay by 15-30%. DubAIVal gives every buyer professional-grade property valuation — for free.' },
      { icon: '&#128683;', color: 'var(--red)', title: 'Fighting Fake Listings', desc: 'Current platforms are flooded with misleading listings. Agents post fake low prices to attract calls, then redirect buyers. DubAIVal\'s Title Deed verification makes fake listings physically impossible.' },
      { icon: '&#128274;', color: 'var(--acc)', title: 'Owner Privacy Protection', desc: 'When you list your property on current platforms, hundreds of agents bombard you with calls. DubAIVal\'s approval-based system means you — the owner — decide who contacts you. Your privacy is protected.' },
      { icon: '&#129309;', color: 'var(--acc2)', title: 'Community-Built, Independent', desc: 'Built by a single Dubai-based entrepreneur who saw these problems firsthand. Crowdfunding keeps the platform independent — not beholden to agents, developers, or listing fees. Your support funds a platform that serves buyers, not brokers.' }
    ],
    alignBottom: '<span class="gold">Your Contribution Matters:</span> Every dirham funds a tool that protects Dubai\'s property buyers from misinformation and price manipulation. This is a <strong style="color:var(--acc);">community investment</strong> in market transparency.',
    askTitle: 'Crowdfunding Campaign',
    askCards: [
      { icon: '&#127912;', color: 'var(--acc)', title: 'Professional Design', desc: 'Fund professional UI/UX redesign to make the platform beautiful and accessible for non-tech-savvy users — from prototype to polished product.' },
      { icon: '&#128241;', color: 'var(--gold)', title: 'Mobile App Launch', desc: 'Fund Android/iOS app store publication and marketing — take DubAIVal from web to pocket for every Dubai resident.' },
      { icon: '&#128202;', color: 'var(--acc2)', title: 'DLD Data Integration', desc: 'Connect to official Dubai Land Department data to increase valuation accuracy from ~80% to 95%+ with real transaction pricing.' },
      { icon: '&#10084;&#65039;', color: 'var(--green)', title: 'Free Forever Promise', desc: 'Crowdfunding ensures core valuation features remain free for all Dubai residents — no hidden fees, no paywalls on basic property checks.' }
    ],
    askBox: '<p style="font-size:13px;color:var(--gold);font-weight:600;">Campaign Goal: AED 150,000</p><p style="font-size:12px;color:var(--t2);margin-top:4px;">100% ownership stays with the founder — zero equity, zero corporate influence</p><p style="font-size:12px;color:var(--t2);margin-top:2px;">5% service fee only on fully-funded campaign (Dubai Next terms)</p>',
    askQuote: 'This isn\'t a corporate fundraise — it\'s a community investing in <strong style="color:var(--acc);">market transparency</strong>. Every property buyer in Dubai deserves independent, data-backed valuation — regardless of their budget.'
  },
  'pitch-deck-hub71.html': {
    preparedFor: 'Prepared for Hub71 — Access Programme + Hub71+ AI',
    alignTitle: 'AI Infrastructure Meets<br/><span class="highlight2">PropTech Innovation</span>',
    alignSubtitle: 'DubAIVal is an AI-native platform. Hub71+ AI\'s compute credits and infrastructure directly power our valuation engine at scale.',
    alignCards: [
      { icon: '&#129504;', color: 'var(--acc2)', title: 'AI-First Architecture — Hub71+ AI Ready', desc: 'DubAIVal is AI-native: Groq LPU for real-time intelligence, hedonic regression for pricing, NLP for natural language search. Hub71+ AI\'s AED 250,000 in AI71/AWS compute credits would directly power our AVM at scale.' },
      { icon: '&#9889;', color: 'var(--acc)', title: 'Proven Product, Pre-Revenue Stage', desc: 'Hub71 Access targets pre-seed to Series A. DubAIVal is live at dubaival.com with 10,880 properties, 12 AI modules, PWA + Android app — built entirely by a solo founder. Technology proven; Hub71 accelerates the business.' },
      { icon: '&#128200;', color: 'var(--gold)', title: 'AED 761B Market — No Incumbent AVM', desc: 'Dubai\'s real estate market: AED 761B in 2024, 226,000+ deals. No Zillow, no CoreLogic, no dominant AVM. DubAIVal is positioned to be the Zillow of the Middle East — starting from UAE and scaling globally.' },
      { icon: '&#127970;', color: 'var(--green)', title: 'ADGM + GCC Expansion', desc: 'Hub71\'s ADGM domicile provides the perfect legal framework for financial-data products. Our AVM serves banks, insurers, and government — all regulated by ADGM/DFSA standards.' }
    ],
    alignBottom: '<span class="highlight2">Perfect Match:</span> Hub71 provides capital + compute + infrastructure. DubAIVal provides <strong style="color:var(--acc);">proven AI technology + massive addressable market</strong>. Together: the UAE\'s first venture-scale PropTech AI company.',
    askTitle: 'Hub71 Partnership Proposal',
    askCards: [
      { icon: '&#128176;', color: 'var(--acc)', title: 'Access Programme Incentives', desc: 'AED 250,000 in-kind support (housing, office, health insurance) + AED 250,000 cash via founder-friendly SAFE note in ADGM.' },
      { icon: '&#129504;', color: 'var(--acc2)', title: 'Hub71+ AI Compute Credits', desc: 'AED 250,000 in AI71/AWS compute power to scale the Cascade AVM engine, train ML models on DLD transaction data, and power real-time intelligence.' },
      { icon: '&#127942;', color: 'var(--gold)', title: 'Performance Top-Up', desc: 'Opportunity for additional AED 250,000 cash investment based on program milestones and traction metrics during the 12-month program.' },
      { icon: '&#128640;', color: 'var(--green)', title: 'Techstars Accelerator Track', desc: '3-month intensive mentorship via Techstars-powered guided track: go-to-market, investor readiness, enterprise sales strategy.' }
    ],
    askBox: '<p style="font-size:13px;color:var(--gold);font-weight:600;">Total Hub71 Package: Up to AED 750,000 + AED 250,000 AI Compute</p><p style="font-size:12px;color:var(--t2);margin-top:4px;">Founder relocates to Abu Dhabi | ADGM entity formation</p><p style="font-size:12px;color:var(--t2);margin-top:2px;">12-month program including 3-month Techstars intensive</p>',
    askQuote: 'Hub71 gives us capital, compute, and credibility. We bring a <strong style="color:var(--acc);">live AI platform serving a $207B market with zero competition</strong>. This is the partnership that builds the Zillow of the Middle East.'
  },
  'pitch-deck-dfdf.html': {
    preparedFor: 'Prepared for Dubai Future District Fund (DFDF)',
    alignTitle: 'A Venture-Scale<br/><span class="gold">PropTech Investment Opportunity</span>',
    alignSubtitle: 'DFDF actively invests in PropTech and ConstructionTech. DubAIVal is a pure PropTech AI platform solving the market\'s most fundamental problem.',
    alignCards: [
      { icon: '&#128200;', color: 'var(--gold)', title: 'PropTech is DFDF\'s Active Thesis', desc: 'DFDF explicitly invests in PropTech and ConstructionTech. DubAIVal is a pure PropTech AI platform solving the most fundamental market problem: independent property valuation in an AED 761B market.' },
      { icon: '&#127919;', color: 'var(--acc)', title: 'Massive Market, Zero Competition', desc: 'Global AVM market: $2.5B (11.2% CAGR). Dubai has no independent AVM — no Zillow, no CoreLogic. DubAIVal\'s PropLens.ai targets 20+ countries. A TAM that justifies venture-scale investment.' },
      { icon: '&#128176;', color: 'var(--acc2)', title: '3 Scalable Revenue Streams', desc: 'B2C subscriptions (AED 99-249/mo), B2B API for banks (AED 2,000+/mo), Deal Network marketplace fees. Year 3: AED 5.4M revenue. SaaS model, 80%+ gross margin, recurring revenue.' },
      { icon: '&#127963;&#65039;', color: 'var(--green)', title: 'DLD Ecosystem Alignment', desc: 'DFDF is a DLD ecosystem partner. DubAIVal is built on DLD-verified data. A DFDF investment signals government confidence, accelerating enterprise adoption and DLD partnership.' }
    ],
    alignBottom: '<span class="gold">Investment Thesis:</span> DFDF invests in PropTech. DubAIVal is the <strong style="color:var(--acc);">only independent AI valuation platform</strong> in the world\'s fastest-growing real estate market. First-mover advantage + DLD alignment + global expansion = venture-scale opportunity.',
    askTitle: 'Investment Proposal',
    askCards: [
      { icon: '&#128176;', color: 'var(--acc)', title: 'Seed Investment', desc: '$1-2M seed round: professional design, team hiring (data engineer, growth marketer, mobile developer), enterprise sales infrastructure.' },
      { icon: '&#128202;', color: 'var(--gold)', title: 'DLD Data Pipeline', desc: 'DFDF\'s DLD connections to accelerate official API access for real-time transaction data — evolving our AVM from rule-based to ML-powered.' },
      { icon: '&#127970;', color: 'var(--acc2)', title: 'Enterprise Introductions', desc: 'Introductions to UAE banks (mortgage valuations), insurance companies (property risk), and government entities (market monitoring).' },
      { icon: '&#127758;', color: 'var(--green)', title: 'PropLens Global Expansion', desc: 'Investment in CASAFARI API integration for European markets — Spain, Portugal, France (Phase 2A). 20+ country expansion roadmap.' }
    ],
    askBox: '<p style="font-size:13px;color:var(--gold);font-weight:600;">Seed Target: $1.5M</p><p style="font-size:12px;color:var(--t2);margin-top:4px;">Comparable: Prop-AI ($1.5M pre-seed), Prypco ($10M seed), Huspy ($59M Series B)</p><p style="font-size:12px;color:var(--t2);margin-top:2px;">Pre-money valuation: Discuss | 18-24 month runway to Series A metrics</p>',
    askQuote: 'DFDF doesn\'t just write a check — it opens the DLD ecosystem. With DFDF backing, DubAIVal becomes the <strong style="color:var(--acc);">government-endorsed AI valuation standard</strong> for Dubai real estate.'
  },
  'pitch-deck-moonshot.html': {
    preparedFor: 'Prepared for Moonshot Pilot Grant — MBRCGI',
    alignTitle: 'AI-Powered Market Transparency<br/><span class="highlight2">A 6-Month Government Pilot</span>',
    alignSubtitle: 'A concrete, completable pilot that demonstrates how AI can transform real estate regulation and market monitoring for Dubai.',
    alignCards: [
      { icon: '&#128640;', color: 'var(--acc2)', title: '6-Month Pilot Proposal', desc: 'Deploy DubAIVal\'s AVM engine with a government entity (DLD, RERA, or Dubai Municipality) to provide real-time property valuation intelligence for regulatory decision-making and market monitoring.' },
      { icon: '&#9889;', color: 'var(--acc)', title: 'Impactful & Disruptive', desc: 'Replace expensive manual valuations (AED 2,500-15,000, 3-7 days) with instant AI estimates (<5 seconds, free). Direct cost reduction for government, banks, and consumers.' },
      { icon: '&#128197;', color: 'var(--gold)', title: 'Practical & Completable', desc: 'Month 1-2: DLD data integration via Dubai Pulse. Month 3-4: AVM calibration with official data (95%+ accuracy). Month 5-6: Government monitoring dashboard + investor protection alerts.' },
      { icon: '&#127758;', color: 'var(--green)', title: 'Globally Relevant, UAE-Built', desc: 'AI-powered property valuation with confidence scoring is applicable worldwide. A successful Dubai pilot becomes the template for PropLens.ai global expansion. UAE leads PropTech innovation.' }
    ],
    alignBottom: '<span class="highlight2">Moonshot Criteria Met:</span> Impactful (AED 761B market transparency). Disruptive (replaces 3-7 day manual process). Practical (6-month deliverable). <strong style="color:var(--acc);">UAE-implemented, globally exportable.</strong>',
    askTitle: 'Pilot Grant Proposal',
    askCards: [
      { icon: '&#128176;', color: 'var(--acc)', title: 'Pilot Grant: $100,000', desc: 'Fund DLD data integration, AVM ML model training, and government monitoring dashboard development over 6 months.' },
      { icon: '&#127963;&#65039;', color: 'var(--gold)', title: 'Government Entity Partner', desc: 'Paired with DLD, RERA, or Dubai Municipality to co-develop and test a real-time market monitoring prototype.' },
      { icon: '&#128202;', color: 'var(--acc2)', title: '6-Month Deliverable', desc: 'Working government dashboard: real-time market health, price anomaly detection, investor protection signals, area trend analysis for all 347 areas.' },
      { icon: '&#128640;', color: 'var(--green)', title: 'Post-Pilot Scalability', desc: 'Successful pilot becomes a permanent DLD market monitoring tool and opens enterprise B2G revenue stream. Template for 20+ country expansion.' }
    ],
    askBox: '<p style="font-size:13px;color:var(--gold);font-weight:600;">Pilot Budget: $100,000 | Duration: 6 Months</p><p style="font-size:12px;color:var(--t2);margin-top:4px;">Deliverable: Government real-time market intelligence dashboard</p><p style="font-size:12px;color:var(--t2);margin-top:2px;">Partnership: DLD or RERA | Zero ongoing cost to government after pilot</p>',
    askQuote: 'This pilot costs $100,000 and takes 6 months. The result: a real-time AI market monitoring tool for the world\'s fastest-growing property market. <strong style="color:var(--acc);">That\'s the definition of a moonshot ROI.</strong>'
  },
  'pitch-deck-market-access.html': {
    preparedFor: 'Prepared for Dubai Startup Hub — Market Access Programme',
    alignTitle: 'Ready for Corporate &<br/><span class="highlight">Developer Partnerships</span>',
    alignSubtitle: 'DubAIVal\'s AVM API is enterprise-ready. Market Access connects us with the developers, banks, and brokerages that need our technology.',
    alignCards: [
      { icon: '&#128187;', color: 'var(--acc)', title: 'Enterprise-Ready Product', desc: 'DubAIVal\'s AVM API integrates with any real estate business — brokerages need instant valuations, developers need market intelligence, banks need mortgage risk assessment. 10,880 properties with confidence scoring.' },
      { icon: '&#127959;&#65039;', color: 'var(--gold)', title: 'Developer Pilot Opportunity', desc: 'Dubai\'s largest developers (Emaar, DAMAC, Nakheel, Sobha, Binghatti) can validate pricing strategy against our independent AVM. One developer pilot proves the concept for the industry.' },
      { icon: '&#128101;', color: 'var(--acc2)', title: 'Brokerage Efficiency Tool', desc: '32,000+ RERA-registered brokers use no standardized valuation methodology. DubAIVal\'s white-label API gives brokerages instant, data-backed assessments — elevating professional standards.' },
      { icon: '&#128176;', color: 'var(--green)', title: 'B2B Revenue Model', desc: 'Enterprise tier: AED 2,000+/month per client for bulk API valuations, white-label reports, portfolio monitoring. Market Access connects us with the first 5-10 corporate clients.' }
    ],
    alignBottom: '<span class="highlight">Market Access Value:</span> We have the technology. Dubai\'s developers, banks, and brokerages have the demand. Market Access is the <strong style="color:var(--acc);">bridge that connects them</strong> — accelerating our path to enterprise revenue.',
    askTitle: 'Market Access Partnership',
    askCards: [
      { icon: '&#129309;', color: 'var(--acc)', title: 'Corporate Partnerships', desc: 'Introductions to leading UAE real estate developers, brokerages, and property management companies for structured pilot programs.' },
      { icon: '&#127970;', color: 'var(--gold)', title: 'Bank & Mortgage Integration', desc: 'Connect with Emirates NBD, FAB, Mashreq, ADCB for mortgage valuation API integration — replacing slow, expensive manual valuations.' },
      { icon: '&#128640;', color: 'var(--acc2)', title: 'Scale Up Dubai Track', desc: 'Structured support for enterprise sales, corporate negotiation, and partnership management as we scale from pilot to production clients.' },
      { icon: '&#128200;', color: 'var(--green)', title: 'Industry Validation', desc: 'Corporate pilot results become our strongest marketing asset — proven enterprise value drives premium subscriptions and API adoption across the market.' }
    ],
    askBox: '<p style="font-size:13px;color:var(--gold);font-weight:600;">Goal: 5 Corporate Pilot Partners in Year 1</p><p style="font-size:12px;color:var(--t2);margin-top:4px;">Each enterprise client = AED 24,000+/yr revenue</p><p style="font-size:12px;color:var(--t2);margin-top:2px;">Path to AED 1.8M B2B revenue by Year 3</p>',
    askQuote: 'Market Access gives us what no marketing budget can buy: <strong style="color:var(--acc);">warm introductions to decision-makers</strong> at Dubai\'s biggest real estate companies. We bring proven technology. They bring market validation.'
  },
  'pitch-deck-dubai-pulse.html': {
    preparedFor: 'Prepared for Dubai Pulse — Digital Dubai Authority',
    alignTitle: 'Turning Open Data into<br/><span class="highlight2">Market Intelligence</span>',
    alignSubtitle: 'DubAIVal is the AI layer that transforms Dubai Pulse\'s raw DLD data into actionable real estate intelligence for every buyer, seller, and investor.',
    alignCards: [
      { icon: '&#129504;', color: 'var(--acc2)', title: 'From Raw Data to Intelligence', desc: 'Dubai Pulse provides 1.5M+ DLD transaction records. DubAIVal transforms this into actionable intelligence — fair value estimates, investment signals, confidence scores, growth forecasts. We\'re the AI layer that makes Dubai Pulse data useful.' },
      { icon: '&#128268;', color: 'var(--acc)', title: 'Technical Integration Ready', desc: 'Our AVM is designed for Dubai Pulse OAuth2 API (client_credential flow). Architecture: Building DB (10,880) → Area Benchmarks (347) → Cluster → Live Market. Adding Dubai Pulse as Layer 5 increases accuracy to 95%+.' },
      { icon: '&#127942;', color: 'var(--gold)', title: 'Showcase for Open Data Impact', desc: 'DubAIVal becomes a high-visibility showcase of what Dubai Pulse data enables. Every valuation report credits "Powered by Dubai Pulse / DLD Official Data" — demonstrating real-world impact of government open data.' },
      { icon: '&#128176;', color: 'var(--green)', title: 'Commercial API Partnership', desc: 'Beyond free open data, DubAIVal is an ideal candidate for commercial API partnership — real-time streaming, extended history, premium fields. Our platform generates demand that justifies commercial data tiers.' }
    ],
    alignBottom: '<span class="highlight2">Win-Win Partnership:</span> Dubai Pulse provides the data. DubAIVal provides the AI. The result: <strong style="color:var(--acc);">every Dubai resident can access professional-grade property valuation</strong> — powered by government open data.',
    askTitle: 'Data Partnership Proposal',
    askCards: [
      { icon: '&#128273;', color: 'var(--acc)', title: 'Open Data Access', desc: 'Registration for DLD Transactions open dataset (free tier) — API Key + Secret for OAuth2 integration into our Cascade AVM engine.' },
      { icon: '&#9889;', color: 'var(--gold)', title: 'Commercial API Package', desc: 'Premium data access: real-time transaction streaming, extended historical data, property-level detail for ML model training and accuracy improvement.' },
      { icon: '&#127942;', color: 'var(--acc2)', title: 'Featured Partner Showcase', desc: 'Position DubAIVal as an official Dubai Pulse success story — demonstrating the transformative value of UAE open data to the PropTech ecosystem.' },
      { icon: '&#128260;', color: 'var(--green)', title: 'Data Quality Feedback Loop', desc: 'DubAIVal\'s validation engine identifies data anomalies and provides quality feedback to improve the DLD dataset — a mutually beneficial partnership.' }
    ],
    askBox: '<p style="font-size:13px;color:var(--gold);font-weight:600;">Integration Timeline: 4 weeks → 8 weeks → 12 weeks</p><p style="font-size:12px;color:var(--t2);margin-top:4px;">Week 4: Ingest open data | Week 8: Calibrate AVM | Week 12: 95%+ accuracy</p><p style="font-size:12px;color:var(--t2);margin-top:2px;">Zero cost to Dubai Pulse — we bring the AI, you provide the data</p>',
    askQuote: 'Dubai Pulse was built to empower innovation through open data. DubAIVal is the <strong style="color:var(--acc);">living proof that it works</strong> — an AI platform that turns government data into market transparency for millions.'
  }
};

function buildAlignSlide(t) {
  let cards = t.alignCards.map((c, i) => {
    const borders = ['var(--gold)', 'var(--acc)', 'var(--acc2)', 'var(--green)'];
    return `    <div class="card" style="border-top:3px solid ${c.color};">
      <div class="card-icon">${c.icon}</div>
      <h3 style="color:${c.color};font-size:18px;">${c.title}</h3>
      <p style="margin-top:12px;">${c.desc}</p>
    </div>`;
  }).join('\n');

  return `
<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- SLIDE: STRATEGIC ALIGNMENT -->
<!-- ═══════════════════════════════════════════════════════════════════ -->
<div class="slide" id="s1b">
  <div class="slide-num">02</div>
  <p style="color:var(--gold);font-weight:600;font-size:14px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Strategic Alignment</p>
  <h2>${t.alignTitle}</h2>
  <p style="margin-top:8px;max-width:860px;">${t.alignSubtitle}</p>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px;">
${cards}
  </div>

  <div style="margin-top:32px;padding:20px 28px;background:linear-gradient(135deg,rgba(255,215,0,.08),rgba(0,212,170,.08));border:1px solid rgba(255,215,0,.2);border-radius:16px;max-width:860px;">
    <p style="font-size:16px;color:var(--t1);font-weight:500;line-height:1.8;">
      ${t.alignBottom}
    </p>
  </div>
</div>

`;
}

function buildAskSlide(t) {
  let cards = t.askCards.map(c => `    <div class="card" style="border-top:3px solid ${c.color};">
      <div class="card-icon">${c.icon}</div>
      <h3 style="color:var(--t1);font-size:18px;">${c.title}</h3>
      <p style="margin-top:12px;">${c.desc}</p>
    </div>`).join('\n');

  return `<div class="slide" id="s15" style="text-align:center;align-items:center;">
  <div class="slide-num">17</div>
  <p style="color:var(--acc);font-weight:600;font-size:14px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">The Ask</p>
  <h2>${t.askTitle}</h2>

  <div style="margin-top:24px;padding:20px 28px;background:linear-gradient(135deg,rgba(0,180,255,.08),rgba(0,212,170,.06));border:1px solid rgba(0,180,255,.25);border-radius:14px;max-width:860px;text-align:left;">
    <p style="font-size:15px;color:var(--t1);font-weight:500;line-height:1.8;">
      <span class="highlight2">About the current platform:</span> What you see at dubaival.com today is a <strong>functional prototype</strong> — a working preview of the full vision.
      The core AI engine, all 12 modules, and the 10,880-property database are fully operational, but the UI/UX design has not yet been professionally developed.
      This is intentionally a <strong>technology-first approach</strong>: we built the intelligence engine and proved it works, so that partners and supporters
      can evaluate the <strong style="color:var(--acc);">real capabilities</strong>, not just a polished mockup.
    </p>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:36px;max-width:900px;text-align:left;">
${cards}
  </div>

  <div style="margin-top:24px;max-width:900px;">
    <div style="padding:12px 16px;background:rgba(255,215,0,.08);border:1px solid rgba(255,215,0,.15);border-radius:10px;">
      ${t.askBox}
    </div>
  </div>

  <div style="margin-top:32px;padding:20px 28px;background:linear-gradient(135deg,rgba(0,212,170,.08),rgba(255,215,0,.08));border:1px solid rgba(0,212,170,.2);border-radius:16px;max-width:860px;text-align:left;">
    <p style="font-size:16px;color:var(--t1);font-weight:500;line-height:1.8;text-align:center;">
      <em>${t.askQuote}</em>
    </p>
  </div>

  <div style="margin-top:48px;">
    <div class="logo" style="font-size:40px;margin-bottom:8px;">Dub<span>AI</span>Val</div>
    <p style="color:var(--t3);font-size:16px;">An AI intelligence platform. Built. Proven. Ready to scale globally.</p>
    <div style="margin-top:32px;display:flex;gap:24px;justify-content:center;flex-wrap:wrap;">
      <div style="padding:12px 24px;background:var(--card);border:1px solid var(--border);border-radius:8px;">
        <span style="color:var(--t3);font-size:13px;">Website</span><br/>
        <span style="color:var(--acc);font-weight:600;">dubaival.com</span>
      </div>
      <div style="padding:12px 24px;background:var(--card);border:1px solid var(--border);border-radius:8px;">
        <span style="color:var(--t3);font-size:13px;">Phone</span><br/>
        <span style="color:var(--acc);font-weight:600;">+971 54 454 1221</span>
      </div>
      <div style="padding:12px 24px;background:var(--card);border:1px solid var(--border);border-radius:8px;">
        <span style="color:var(--t3);font-size:13px;">Email</span><br/>
        <span style="color:var(--acc);font-weight:600;">momeni.yashar@gmail.com</span>
      </div>
      <div style="padding:12px 24px;background:var(--card);border:1px solid var(--border);border-radius:8px;">
        <span style="color:var(--t3);font-size:13px;">Vision</span><br/>
        <span style="color:var(--gold);font-weight:600;">PropLens.ai — 20+ Countries</span>
      </div>
    </div>
  </div>
</div>`;
}

for (const [filename, target] of Object.entries(targets)) {
  let html = base;

  // 1. Add "Prepared for" on cover
  html = html.replace(
    '<p style="font-size:14px;color:var(--t3);">+971 54 454 1221 &middot; momeni.yashar@gmail.com</p>\n</div>',
    `<p style="font-size:14px;color:var(--t3);">+971 54 454 1221 &middot; momeni.yashar@gmail.com</p>
  <div style="margin-top:24px;padding:12px 28px;background:linear-gradient(135deg,rgba(0,212,170,.08),rgba(0,180,255,.06));border:1px solid rgba(0,212,170,.25);border-radius:10px;">
    <p style="font-size:15px;color:var(--acc);font-weight:600;">${target.preparedFor}</p>
  </div>
</div>`
  );

  // 2. Insert alignment slide after cover
  const alignSlide = buildAlignSlide(target);
  html = html.replace(
    '<!-- SLIDE 2: PROBLEM -->',
    `<!-- SLIDE: STRATEGIC ALIGNMENT -->\n${alignSlide}\n<!-- SLIDE 2: PROBLEM -->`
  );

  // 3. Replace Ask slide — match from comment block to closing </div> before <script>
  const askSlide = buildAskSlide(target);
  const askStart = html.indexOf('<!-- SLIDE 16: THE ASK -->');
  const askEnd = html.indexOf('\n\n<!-- ═', askStart);
  if (askStart !== -1 && askEnd !== -1) {
    const beforeAsk = html.slice(0, askStart);
    const afterAsk = html.slice(askEnd);
    html = beforeAsk + '<!-- SLIDE 16: THE ASK -->\n<!-- ═══════════════════════════════════════════════════════════════════ -->\n' + askSlide + afterAsk;
  } else {
    console.warn(`  ⚠ Could not find Ask slide boundaries in ${filename}`);
  }

  // 4. Update slide numbers (shift +1 after slide 1)
  html = html.replace(/<div class="slide-num">02<\/div>/g, (m, offset) => {
    if (offset < html.indexOf('SLIDE 2: PROBLEM')) return m;
    return '<div class="slide-num">03</div>';
  });
  // Simpler: just re-number all slides after the alignment slide
  let slideNum = 1;
  html = html.replace(/<div class="slide-num">\d+<\/div>/g, () => {
    slideNum++;
    return `<div class="slide-num">${String(slideNum - 1).padStart(2, '0')}</div>`;
  });

  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`✓ ${filename} (${html.length} bytes)`);
}

console.log('\nDone! All 7 files generated.');
