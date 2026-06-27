# DubaiVal — Project Context for Claude Sessions

Read this first. It exists so a fresh session doesn't have to re-read the whole
single-file app or re-derive line numbers/history from scratch.

## 🔴 #1 CRITICAL DIRECTIVE — Full Automation, Zero User Intervention

**This is the HIGHEST PRIORITY directive — execute BEFORE all others.**

Every task, feature, fix, or change MUST be:
- **Fully automated** — no manual steps required from the user
- **Best version first** — implement the best, most complete solution on the
  first attempt. Do NOT ship half-working code that needs multiple rounds of fixes.
- **Self-contained** — all dependencies, configs, tokens, API calls, env vars,
  cache busting, vercel.json changes, index.html version bumps — handle EVERYTHING
  in one go. The user should NEVER have to debug, paste tokens in console, or
  manually configure anything.
- **Latest technology** — use the most current APIs, best practices, and optimal
  architecture available.
- **Test before shipping** — verify the solution works end-to-end before declaring
  it done. Anticipate errors (CORS, 404, token expiry, cache) and handle them
  proactively.

If a feature needs env vars, tokens, or credentials — build a UI for it.
If a file changes, bump the cache version in index.html automatically.
If an API might fail, add retry logic and clear error messages.
**The user's only job is to say what they want. Everything else is on Claude.**

## 🔴 #2 CRITICAL DIRECTIVE — Analyzer Page Accuracy

The Analyzer page is the heart of DubaiVal — the business depends on it.
**ALL numbers on this page MUST be accurate with a MAXIMUM 3% deviation.**
Every statistic must be correct and based on live/current data. This applies to:
- Price per sqft estimates (sale & rental)
- Rent estimates (annual & monthly)
- Yield calculations (gross & net)
- Confidence scores
- Investment signals (Undervalued / Fair Value / Elevated / Bubble Risk)
- Total return projections
- Area benchmarks and comparisons
- Grade-based adjustments

**Every change to the valuation engine, rental engine, or analyzer UI must be
validated against real market data before deployment.** When in doubt, cross-check
with Property Finder / Bayut live listings. A 20% error (like the AFV Tower 3
incident: 198k vs 400k+ actual) is unacceptable and must never happen again.

## What this is

DubaiVal is a Dubai real-estate valuation web app: user enters a building +
unit details, app returns an AVM-style estimate (price/sqft, rent range, net
yield, confidence score, investment signal, total return) using a hard-coded
building/area benchmark database plus optional live-market API enrichment.

Live site: **https://www.dubaival.com** (and apex `dubaival.com`, 308→www).
Hosted on Vercel, Hobby plan, team "Dubaival's projects", project name
`dubaival`. Domain is fully configured (Vercel nameservers, both domains show
"Valid Configuration" in Settings → Domains as of 2026-06-16).

## Repo / deploy mechanics

- GitHub: `momeniyashar-jpg/dubaival`.
- Working branches for Claude sessions:
  - **`claude/amazing-mccarthy-kl83jb`** — current active branch with split
    file structure (see below). All new work goes here.
  - `claude/dubaival-portfolio-manager-5bgbjk` — older branch, monolithic
    `index-6.html`. Superseded by `amazing-mccarthy`.
  - `claude/happy-cray-6q6eid` — building research branch (119 buildings).
    Already merged into `amazing-mccarthy` via `data.js`. Do NOT use.
  - Pushes to these branches do NOT auto-deploy to Production; Vercel's
    Production Deployment is tied to the `main` branch / manual `vercel --prod`
    from the user's machine.
- `vercel.json`: static build of `index-6.html` (served for all non-`/api`
  routes) **plus** a `@vercel/node` build of `api/*.js` (added 2026-06-16 for
  the Price Alert feature — see below) and a daily `crons` entry. There is
  still no build step for the HTML itself (`package.json` build script is a
  no-op echo) — the `/api` functions are plain Node, no bundler/deps needed
  (native `fetch` only).

### File structure (split architecture — since branch `amazing-mccarthy`)

The app was split from a single 1.1MB `index-6.html` into modular files:

- **`index-6.html`** — ~5KB shell: `<head>`, meta tags, styles, `<body>`,
  and `<script src="js/...">` tags. NO inline JS anymore.
- **`js/data-residential.js`** — All residential databases: `DB` (8,522 buildings),
  `BLDG_UNITS`, `AREAS` (347), `CLUSTER_DB`, `VIEW_P`, `AREA_ALIASES`, themes.
  **This is where building research goes.**
- **`js/valuation.js`** — `lookupBuilding()`, `computeValuation()`,
  `computeRentalValuation()`, valuation engine.
- **`js/api.js`** — `getUAELocationId()`, `fetchLiveData()`, `askAI()`, API
  helpers.
- **`js/core.js`** — `hexAlpha()`, `el()`/`div()`/`span()`, shared UI
  utilities, `fetchLiveMarket()`.
- **`js/auth.js`** — User account system with Supabase Auth.
- **`js/app.js`** — App state, tab routing, render entry point, onboarding,
  notifications, smart bars, workspace.
- **`js/market.js`** — `renderMarket()`, `renderRentalResult()`, Live Dashboard,
  Track Record, Quick Check (sale/rent modes).
- **`js/marketindex.js`** — Market Index tab, area rankings, heatmap.
- **`js/mortgage.js`** — `renderMortgage()`.
- **`js/portfolio.js`** — `renderPortfolio()`, `computeAssetMetrics()`,
  `computePortfolioHealth()`, projections, what-if.
- **`js/map.js`** — Interactive Map tab (Leaflet).
- **`js/deals.js`** — Deal Network, `renderDeals()`, `renderDealForm()`,
  `renderAgentHub()`, `renderAdminDashboard()`, media, inquiries, referrals.
- **`js/chat.js`** — `renderChat()`.
- **`js/about.js`** — About/Mission tab.
- **`js/workspace.js`** — My Workspace tab, custom report builder.
- **`api/proxy-groq.js`** — Vercel serverless proxy for Groq API.
- **`api/proxy-rapidapi.js`** — Vercel serverless proxy for RapidAPI.
- **`sw.js`** — Service worker for PWA.
- **`manifest.json`** — PWA manifest.

- **`capacitor.config.json`** — Capacitor project config (appId, plugins, server).
- **`scripts/build-www.js`** — Builds `www/` from source: copies index-6.html,
  applies Capacitor modifications (viewport-fit, native bootstrap), copies JS.
- **`scripts/generate-icons.js`** — Generates Android icons + splash screens
  from `logo.png` using sharp.
- **`android/`** — Capacitor Android project. DO NOT edit generated files.
  Key files: `app/build.gradle`, `app/src/main/AndroidManifest.xml`,
  `app/src/main/res/values/styles.xml`, `app/src/main/res/values/colors.xml`.

Other files (`dubaival.jsx`, `index-3.html`) are old/unused — do not edit.

## Database sizes (as of 2026-06-20)

All databases live in **`js/data-residential.js`** (residential) and **`js/data-commercial.js`** (commercial + land).

- **`var DB={...}`**: **8,522 buildings** (single massive line). Schema:
  `{"p":psf,"lo":lowPsf,"hi":highPsf,"sc":serviceCharge,"a":"Area Name","g":"Grade","df":1(optional)}`.
  Keyed by lowercase building name. Across **216 unique areas**.
- **`BLDG_UNITS={...}`**: **8,662 entries** (building unit counts for turnover
  rate calculation).
- **`const AREAS={...}`**: **347 keys** (area benchmark database). Schema:
  `{psf, sc, r1/r2/r3, rv2..rv7, y:[yieldLow,yieldHigh], g:[growth0-1yr%,growth1-3yr%,growth2-5yr%], dom, txVol}`.
- **`var DB_COM={...}`**: **1,930 commercial properties** (in `data-commercial.js`).
- **`var DB_LAND={...}`**: **428 land plots** (in `data-commercial.js`).
- **Total: 10,880 properties** across 347 areas.

## Code map (split file structure)

Code is now split across `js/*.js` files. To find anything, grep across `js/`:

| What | File | How to find |
|---|---|---|
| Databases (DB, BLDG_UNITS, AREAS) | `js/data-residential.js` | `grep "var DB=" js/data-residential.js` |
| CLUSTER_DB, VIEW_P, AREA_ALIASES | `js/data-residential.js` | `grep "CLUSTER_DB\|VIEW_P\|AREA_ALIASES" js/data-residential.js` |
| `lookupBuilding()`, `computeValuation()`, `computeRentalValuation()` | `js/valuation.js` | |
| API helpers (fetchLiveData, askAI) | `js/api.js` | |
| `hexAlpha()`, `el()`/`div()`/`span()` | `js/core.js` | |
| App state, tabs, render, onboarding | `js/app.js` | |
| User auth (Supabase) | `js/auth.js` | |
| Market tab, Live Dashboard, Rental Result | `js/market.js` | |
| Market Index, rankings, heatmap | `js/marketindex.js` | |
| Mortgage calculator | `js/mortgage.js` | |
| Portfolio Manager, projections | `js/portfolio.js` | |
| Interactive Map (Leaflet) | `js/map.js` | |
| Deal Network, agents, referrals | `js/deals.js` | |
| Chat tab | `js/chat.js` | |
| About/Mission | `js/about.js` | |
| Workspace, report builder | `js/workspace.js` | |

## Supabase tables (all created, all SQL files executed as of 2026-06-18)

| Table | SQL file | Purpose |
|---|---|---|
| `deal_board` | `supabase-deal-board-schema.sql` | Agent-to-agent deal board (I Have / I Need) |
| `deal_inquiries` | `supabase-deal-inquiries-schema.sql` | Buyer interest messages + status (pending/approved/rejected) |
| `deal_media` | `supabase-deal-media-schema.sql` | Property photos (base64) + video URLs |
| `dv_agents` | `supabase-referral-schema.sql` | Registered agents in referral pool |
| `dv_referrals` | `supabase-referral-schema.sql` | Referral tracking (buyer → agent → deal) |
| `price_watches` | `supabase-price-alerts-schema.sql` | Price alert subscriptions |
| `market_config` | (pre-existing) | Macro yield/growth adjustment knobs |

**All 5 SQL migration files have been executed in Supabase** (confirmed 2026-06-18).

## The valuation engine (`computeValuation`)

```
bData = lookupBuilding(buildingVal||f.building||"", f.area)
aData = AREAS[f.area] || {psf:1800, sc:15, y:[5,7], g:[10,18,28]}
askPSF = price/size (rounded); returns null if !askPSF || !f.area
baseConf = [0,95,85,72,58][dataLayer] || 58
inputPenalty = (-4 if no floor & not villa) + (-2 if view unspecified) + (-1 if no service charge)
relSpread = (psfHi - psfLo) / adjPSF                    // CoreLogic FSD-style
spreadAdj = relSpread<=0.15 ? +5 : <=0.25 ? 0 : <=0.40 ? -5 : -10
confScore = clamp(baseConf + inputPenalty + spreadAdj, 40, 97)
confTier  = Very High(>=90) / High(>=80) / Medium(>=68) / Low(>=55) / Indicative(else)
prRatio = 100 / grossYield
investSignal = prRatio<15 Undervalued / <20 Fair Value / <25 Elevated / else Bubble Risk
totalReturnAnnual = netYield + gr[1]/3
```

## Rental Valuation Engine (`computeRentalValuation`) — added 2026-06-19

Full rental analysis mode across the platform. Purple theme (#8B5CF6).

### Engine (`js/valuation.js`)
```
baseRent = AREAS[area].r1/r2/r3 (apt) or rv3..rv7 (villa) by beds
furnMult = Furnished +17%, Semi +9%, Unfurnished 0%
viewAdj  = Sea +12%, Canal/Partial +7%, Golf/Lagoon +5%, Pool/Garden +3%
floorAdj = 40+ = +5%, 25+ = +3%, 15+ = +2%
estRent  = baseRent × furnMult × (1 + viewAdj + floorAdj)
rentRange = estRent ± 12%
vsPct    = (askRent - estRent) / estRent × 100
verdict  = BELOW_MARKET(<=-12%) / COMPETITIVE(<=-3%) / MARKET_RATE(<=5%)
           / ABOVE_MARKET(<=15%) / OVERPRICED(else)
confBase = 82 (rental data exists) or 60, +3 beds, +2 view, +1 furnished, +5 bldg match
```

### UI touchpoints
- **Analyzer**: Sale/Rent toggle before form; dynamic labels; purple submit button
- **renderRentalResult()** (`js/market.js`): verdict card, monthly breakdown,
  rent range bar, negotiation target, landlord net analysis, area benchmarks,
  RERA/DEWA/chiller tips, share/WhatsApp
- **Quick Check**: Sale/Rent mode toggle; rent handler uses computeRentalValuation
- **AI Smart Search**: rental example chip; auto-routes to rental engine
- **Live Dashboard Row 4**: Rental Market Snapshot (areas w/ data, avg 1BR/2BR)
- **Market Index** (`js/marketindex.js`): Top 10 Highest Rent, Top 10 Best
  Rental Value tables
- **Deal Network** (`js/deals.js`): title deed skipped for rentals, "/yr" price
  display, purple purpose badge, auto-valuation skipped for rent listings

### State
- `analyzerState.f.txnType` — `"sale"` (default) or `"rent"`
- `analyzerState.rentalVal` — rental valuation result object
- `_qcState.mode` — Quick Check sale/rent mode

## Deal Network features (added 2026-06-18)

### Title Deed Verification
- Required Title Deed number for "I Have" listings
- Optional Title Deed photo upload (base64)
- Gold verified badge on deal cards
- `deal_board.title_deed_no` (required for type=have), `deal_board.title_deed_img`
- `title_deed_img` is **excluded from `fetchDeals` query** to avoid loading
  heavy base64 data — uses explicit `select=` with all columns except this one

### Privacy-First Media Gallery
- Owners upload photos (compressed to 800px/65% quality via canvas) + video URLs
- Photos stored as base64 in `deal_media` table
- Buyers send interest via `deal_inquiries` — owner sees requests
- Owner approves/rejects each inquiry (`deal_inquiries.status`)
- Only approved buyers can view media (client-side access control)
- `DEAL_STATE.mediaPhotos`, `DEAL_STATE.videoUrl`, `DEAL_STATE.dealMediaCache`
- `DEAL_STATE.sentInquiries` tracked in localStorage (`dv_sent_inquiries`)

### Agent Referral Program
- Agent registration form (`registerAgent`) — name, phone, RERA, areas, specialties
- 3 subscription tiers: Free, Gold, Platinum (`dv_agents.subscription`)
- Agent directory in Agent Hub tab (`renderAgentHub`)
- Buyer referral requests created from "I Need" deal posts when `requestReferral=true`
- Admin dashboard (`renderAdminDashboard`) — accessible via admin token
  - Stats: total agents, gold/platinum count, pending referrals, closed deals
  - Assign pending referrals to Gold/Platinum agents
  - Update referral status (connected → negotiating → closed)
  - Commission tracking: `deal_value × 0.02` on close
  - Agent subscription management
- Admin token stored in localStorage (`dv_admin_token`)

## Portfolio Manager (`renderPortfolio`)

AI-powered asset management tab. All data in `localStorage`.

**Core features:**
- Asset tracking with building auto-lookup from 8,522-entry DB
- Real-time valuations via `computeAssetMetrics()`
- Portfolio overview: total value, ROI, yield, P&L, area allocation chart
- **Portfolio Health Score**: composite 1-100 (`computePortfolioHealth()`)
- **Future Projection Simulator**: growth/rate sliders, 1/3/5yr horizons
- **What-If Swap Simulator**: sell asset A → buy in area B analysis
- Investment profile (risk/horizon/target) saved to localStorage
- Per-asset expandable analytics cards
- AI Portfolio Analysis via Groq (`askAI`)

**State**: `window.PORTFOLIO_STATE`. Persisted: `dubaival_portfolio`,
`dubaival_portfolio_goals`.

## Price Alert feature (code-complete, NOT yet live)

Architecture: Resend (email) + Vercel Serverless Functions + Vercel Cron.

**Files**: `api/watch-subscribe.js`, `api/unsubscribe.js`,
`api/check-price-alerts.js`, `api/lib/shared.js`.

**Deployment blocker**: Vercel `/api/*.js` serverless functions return 404.
The `@vercel/node` build entry in `vercel.json` may be ignored due to
project-level settings overriding it. See "Outstanding items" for next steps.

**Required env vars in Vercel**: `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`RAPIDAPI_KEY`, optionally `CRON_SECRET` + `ALERTS_FROM_EMAIL`.

## Bug fix log (commit `1fe67df`, 2026-06-18)

16 bugs fixed in comprehensive review:

**Critical (7):**
1. Corrupted `<meta charset>` tag (contained JS fragments)
2. Broken rgba badge colors — `hexAlpha(color, alpha)` helper replaces 6 broken
   `.replace("rgb","rgba")` patterns that were no-ops on hex colors
3. `uploadDealMedia` — added response check (was silently losing photos)
4. `updateInquiryStatus` — added response check
5. `deleteDealMedia` — added response check
6. `assignReferral` — added response check
7. `postDeal` — added non-2xx error alert + `title_deed_img` excluded from fetchDeals

**Medium (9):**
8. Double-submit guard in `postDeal` (`if(DEAL_STATE.posting)return`)
9. `waParser` state reset after successful post
10. Phone/name `.trim()` validation in `sendInquiry`
11. `fetchMyInquiries` batched into single `in()` query (was N sequential)
12. Admin dashboard stats/commission appended to `card` (was incorrectly on `wrap`)
13. `timeAgo` null/NaN guard — returns "—" instead of "NaN m ago"
14. Referral close prompt cancel handling (no longer closes with zero value)
15. Default "Update…" placeholder option in referral status select
16. Duplicate preconnect for fonts.googleapis.com removed

**SEO (3):**
- Canonical URL: `https://www.dubaival.com/` (was `dubaival.com/app`)
- `og:url` fixed to match
- `theme-color` meta tag added (`#070B14`)

## Recent work log (most recent first)

- **2026-06-28 (session 7)**: AI Video Studio server-side proxy + API keys.
  - `api/proxy-video.js` — Central server-side proxy for 8 video engines
  - All video engine API keys moved to Vercel env vars (no client-side keys)
  - Pika Labs routed through Fal.ai gateway (free access)
  - HeyGen routed through Fal.ai gateway (free, was $24/mo)
  - Video upload limit increased from 100MB to 500MB
  - Engines: Kling AI, Luma, D-ID, Runway Gen-4, Minimax Hailuo, Pika, HeyGen
  - Hedra deferred (paid API only)
  - Supabase auto-post tables: scheduled_posts, social_credentials, post_engagement
  - `api/auto-post.js` + `api/sync-engagement.js` Vercel Cron endpoints
  - Vercel env vars configured: KLING_API_KEY, LUMA_API_KEY, DID_API_KEY,
    RUNWAY_API_KEY, MINIMAX_API_KEY, PIKA_API_KEY (also powers HeyGen via Fal.ai)
- **2026-06-20 (session 5-6)**: View premium scientific calibration.
  - Full VIEW_P recalibration (22 values, 0-38%) with hedonic pricing research
  - Differential GRADE_BASE_VIEW system with asymmetric clamp (-15%/+25%)
  - Palm View & Creek Harbour View added; Road View & Backing Open Land removed
  - Security hardening (edit_token, agent_phone, admin password)
  - Full AVM calibration (10,880 properties, 100% coverage)
  - Capacitor Android app setup
- **2026-06-19 (session 4)**: Comprehensive rental analysis feature.
  - `a09e893` — Rental valuation engine, analyzer rent mode, rental result page,
    Live Dashboard rental snapshot, Market Index rental tables, Deal Network
    rental enhancements
  - `694eb82` — Quick Check rent mode, rental example chip, polish
- **2026-06-18 (session 3)**: `1fe67df` — Comprehensive 16-bug fix (see above).
  Also in this session:
  - `84c962d` — Added 154 new buildings across 29 areas (6,008→6,162 DB, 6,192→6,345 BLDG_UNITS)
  - `d6d7fe3` — Title Deed verification requirement for "I Have" deal listings
  - `39616fb` — Privacy-first media gallery with buyer approval workflow
  - `1f56bc3` — Agent Referral Program with marketplace, matching, admin dashboard
  - All 5 Supabase SQL migrations confirmed executed by user
- **2026-06-17 (session 2)**: Portfolio Health Score, Future Projection Simulator,
  What-If Swap Simulator, Building Turnover Rate, Margin of Safety Index,
  BLDG_UNITS expanded to 6,192, Liquidity data added to all 347 AREAS.
- **2026-06-17 (session 1)**: Portfolio Manager tab — asset tracking, real-time
  valuations, portfolio analytics, investment profile, AI analysis via Groq.
- **2026-06-16**: Outlier fix (trimmed mean), Case Study / Track Record,
  71 orphan area strings resolved (81→152 AREAS), Price Alert (code-complete),
  B+ grade-guess bug fix, investSignal/totalReturn/confScore features.

## 🎨 UI/UX Redesign Plan — Tab Structure & Priority Map

### Current problem
13 top-level tabs in a horizontal scroll bar — overwhelming, unorganized,
related features scattered across different tabs. No visual hierarchy.

### Proposed navigation architecture (5 primary sections)

#### 1. 🏠 HOME (Landing / Dashboard)
Default view when app loads. Shows personalized summary.
- **Market Pulse**: key stats (avg PSF, top movers, index change)
- **Your Portfolio Summary** (if assets exist): total value, ROI, health score
- **Active Alerts count** + latest matches
- **Quick Actions**: Analyze, Search, Compare buttons
- Priority: ★★★★★

#### 2. 📊 MARKET (Market Intelligence)
All market research and analysis tools grouped together.
- **Live Dashboard** (default view) — 5 stat cards (Buildings, Areas, Avg PSF,
  Avg Yield, Avg Growth), PSF distribution histogram, yield vs growth scatter,
  top movers table, rental market snapshot, AI Smart Search
- **Analyzer** (sub-tab) — `renderAnalyzer()` + `renderAnalyzerResult()` in
  `js/market.js`. Property valuation (sale + rent modes), PDF export (`generatePDF()`),
  confidence score, investment signal, comparable analysis.
  Three result renderers: `renderAnalyzerResult()` (residential),
  `renderCommercialResult()` (commercial), `renderLandResult()` (land plots)
- **Quick Check** (sub-tab) — Rapid sale/rent valuation (area + beds only)
- **Track Record** (sub-tab) — Estimate vs actual sale price case studies
- **Market Index** (sub-tab) — Area rankings: Most Expensive, Highest Yield,
  Fastest Growing, Best Value, Highest Rent, Best Rental Value, Top Commercial,
  Top Land, Advanced Area Comparison with AI
- **Compare** (sub-tab) — Side-by-side area comparison (2-3 areas)
- **Find / Property Search** (sub-tab) — `renderFind()` in `js/app.js`:
  - Natural Language Search bar (AI parses "2BR under 2M in JVC with 7%+ yield")
  - Quick Filters (Area autocomplete, Building autocomplete, Bedrooms, Max Price,
    Type, Sort By — Best Deal Score/Lowest PSF/Lowest Price/Highest PSF/Newest)
  - Smart Property Discovery (`◆ Smart Property Discovery`) — searches 8,522+
    buildings by financial criteria: Area, Grade, Type, Min Yield%, Min Growth 3yr%,
    Max DOM, Min PSF, Max PSF, Min Turnover, Sort (Yield/PSF/Growth/Liquidity/Turnover)
  - Discovery Results: statistics cards (Avg Yield, Growth, PSF, DOM), building cards
    with name, grade, PSF, yield, growth, signal, turnover, area badge
  - Live Bayut/PropertyFinder results with deal scoring
- **Map** (sub-tab) — Interactive Leaflet map with 6 metric toggles (Growth,
  Yield, Price, Liquidity, Turnover, Location), metro/tram overlay
- **Personal Advisor** (sub-tab) — AI questionnaire (budget, role, family,
  timeline, work location) → 3 area recommendations
- **Mortgage Calculator** (collapsible panel inside Analyzer, not a separate tab)
  — rate types, down payment slider, tenure, buyer type, DLD/agency fees
- Priority: ★★★★★

#### 3. 💼 PORTFOLIO (Investment Management)
Everything related to owned assets and investment tracking.
- **My Assets** (sub-tab) — Add/edit/view properties
- **Health Dashboard** (sub-tab) — Portfolio health, diversification, risk
- **Projections** (sub-tab) — Future projection simulator, what-if swap
- **Alerts** (sub-tab) — Deal alerts, price watches
- **STR Calculator** (collapsible panel)
- Priority: ★★★★☆

#### 4. 🤝 NETWORK (Professional Tools)
All agent/professional features in one place.
- **Deal Board** (sub-tab) — Browse & post deals (I Have / I Need)
- **Agent Hub** (sub-tab) — Agent directory, referral program
- **AI Agents** (sub-tab) — 8 specialized AI agents (General, Valuation,
  Negotiation, Marketing, Investment, Legal, Lead Capture, Social Media Manager)
- **Social Media Manager** (sub-tab) — ALL content creation tools in `js/chat.js`:
  - **Content Creation Tools** (Row 1):
    - Post/Story/Reel/Carousel generator (Instagram, Facebook, LinkedIn, Twitter, TikTok, YouTube)
    - `showVideoGenUI()` — AI Video Studio (8 engines: Runway, Kling, Minimax, Pika, Luma, HeyGen, Hedra, D-ID)
    - `showVideoEditor()` — AI Video Editor (upload → AI trim → subtitles → music, max 500MB)
    - `showPostDesigner()` — Visual Post Designer (canvas-based, templates, text overlay)
    - `showStoryTemplates()` — Story/Reel Templates
    - `showPostPreview()` — Post Preview with smart image
  - **AI Intelligence Tools** (Row 2):
    - `showHookStoryOffer()` — Neuro Hook-Story-Offer framework
    - `showMultiLanguage()` — Multi-language translator
    - `showABTest()` — A/B Test variants
    - `showHashtagIntelligence()` — Hashtag Intelligence
    - `showCaptionRewriter()` — Caption Rewriter
    - `showEmojiIntelligence()` — Emoji Intelligence
    - `showCaptionOptimizer()` — Caption Optimizer (length, readability)
    - `showCompetitorSpy()` — Competitor Spy
  - **Planning Tools** (Row 3):
    - `showContentCalendar()` — Content Calendar (monthly view)
    - `showAddCalendarEvent()` — Schedule post to calendar
    - `showBulkGenerator()` — Bulk 30-day content generator
    - `showContentRecycler()` — Content Recycler (repurpose old posts)
    - `showPillarPlanner()` — Content Pillar Planner
    - `showBestTimeModal()` — Best Posting Time per platform
    - `showPostAnalytics()` — Post Analytics dashboard
    - `showLinkInBio()` — Link-in-Bio builder
    - `showWatermarkSetup()` — Watermark/branding overlay
  - **Config Tools** (Row 4):
    - `showBrandingSetup()` — Brand profile (agency name, logo, phone, tagline, colors)
    - `showSocialSetup()` — Social accounts setup (API keys, platform connections)
    - `showAutoPostLog()` — Auto-Post Engine log (history, retry failed, sync to cloud)
    - `showEngagementDashboard()` — Engagement Analytics dashboard
    - Behavioral Profiling (AI analysis of Instagram posts)
  - **Avatar Studio** (Row 5):
    - `showAvatarStudio()` — Avatar gallery/management
    - `showAvatarBuilder()` — Create/edit AI avatar character
    - `showAvatarContentGen()` — Generate content as avatar
    - `showAvatarVideoGen()` — Generate video as avatar (uses all 8 engines)
    - `showAvatarAutoPilot()` — Avatar auto-pilot (automated content)
    - `showAvatarBatchGen()` — Batch generate avatar content
- **PropTech Video Platform** (sub-tab) — `js/social.js`:
  - Explore feed (agent video listings, filters by area/category)
  - Agent Profiles (directory, search, follow)
  - My Profile (agent registration, video uploads, edit)
  - Following (followed areas & agents feed)
  - Video modal (full-screen player, likes, comments)
- Priority: ★★★★☆

#### 5. ⚙️ MORE (Settings & Info)
Low-frequency items in a drawer/menu.
- **Workspace** — Custom dashboard builder (14+ tools), preset templates
  (Investor/Agent/Buyer), reorderable widgets, mini previews
- **Report Builder** — Section selector, language (EN/AR), brand customization,
  PDF export
- **About** — Mission, technology, partnerships, DubAIVal Flywheel, API docs
- **Settings** — Language (EN/AR/FA), dark mode, profile, notifications
- **Admin** — `renderAdmin()` in `js/app.js` (password protected):
  - Market Risk Controls — Apartment/Villa adjustment sliders (-8% to +8%)
  - Save to localStorage + Supabase `market_config`
  - Current Effect Preview (sample property PSF impact)
  - System Diagnostics — Error Log (No Area Match, Building Fallback, Area-Only counts)
  - Recent error log entries (last 20)
  - Also: `renderAdminDashboard()` in `js/deals.js` for deal/agent management
- Priority: ★★☆☆☆

#### 6. 🔧 CROSS-CUTTING COMPONENTS (shared across all sections)
These are NOT tabs — they appear everywhere. Do NOT lose them in redesign:
- **Auth Modal** (`js/auth.js`) — `renderAuthModal()`, `renderAuthButton()`.
  Sign In / Sign Up overlay, email+password, cloud sync, header auth button
- **Notification System** (`js/core.js` + `js/app.js`) — `renderNotifBell()`.
  Bell icon in header, unread count badge, notification dropdown, mark all read
- **Tour System** (`js/core.js`) — `showTourStep()`. Quick Tour (8 steps) +
  Full Tour (16 steps), spotlight overlay, pulsing highlight, progress bar
- **Smart Bar / AI Smart Fill** (`js/core.js`) — `renderSmartBar()`,
  `showSuggestions()`. AI-powered form fill, gradient border, example chips,
  recent history, voice input
- **Voice Input** (`js/core.js`) — Microphone button, speech recognition,
  wave animation bars, "Listening..." state
- **Share Buttons** (`js/core.js`) — WhatsApp, X/Twitter, LinkedIn, Telegram,
  Copy Link — used in analyzer result, market index, deals
- **PDF Report Generator** (`js/market.js`) — `generatePDF()` exports valuation
  results to printable PDF with logo, metrics grid, price ladder, AI commentary
- **Sustainability Score** (`js/core.js`) — `computeSustainabilityScore()`, badge
  with tier (Excellent/Good/Average/Below/Poor), component breakdown
- **Language Switcher** (`js/app.js`) — EN/AR/FA toggle in header
- **Dark Mode** (`js/app.js`) — Theme toggle
- **Pill/Badge Component** (`js/core.js`) — Reusable colored badge

#### 7. 📍 NOTES ON FEATURE LOCATIONS
Some features live in unexpected files (must preserve during redesign):
- `renderCompare()` is in **`js/portfolio.js`** (NOT market.js)
- `renderFind()` and `renderAlerts()` are in **`js/app.js`** (NOT market.js)
- `renderPersonal()` (Personal Advisor) is in **`js/portfolio.js`**
- `renderApiDocs()` is inside **`js/about.js`** (launched from About page)
- `generatePDF()` is in **`js/market.js`** (called from analyzer result)
- Social Media Manager tools are in **`js/chat.js`** (NOT social.js)
- PropTech Video Platform is in **`js/social.js`** (separate from chat.js)

#### 8. 📋 COMPLETE TAB-LEVEL RENDER FUNCTIONS
Every top-level render function and its file (for routing/navigation):

| Function | File | Tab/Section |
|---|---|---|
| `render()` | `js/app.js` | Main entry point, builds header + routes tabs |
| `renderMarket()` | `js/market.js` | Live Dashboard |
| `renderAnalyzer()` | `js/market.js` | Property Analyzer |
| `renderAnalyzerResult()` | `js/market.js` | Analyzer results (sale) |
| `renderRentalResult()` | `js/market.js` | Analyzer results (rent) |
| `renderCommercialResult()` | `js/market.js` | Commercial result |
| `renderLandResult()` | `js/market.js` | Land result |
| `renderMarketIndex()` | `js/marketindex.js` | Market Index tables |
| `renderMap()` | `js/map.js` | Interactive Map (Leaflet) |
| `renderMortgage()` | `js/mortgage.js` | Mortgage calculator |
| `renderMortgageStandalone()` | `js/mortgage.js` | Standalone mortgage page |
| `renderPortfolio()` | `js/portfolio.js` | Portfolio Manager |
| `renderCompare()` | `js/portfolio.js` | Area Compare tool |
| `renderPersonal()` | `js/portfolio.js` | Personal Advisor |
| `renderFind()` | `js/app.js` | Smart Property Discovery |
| `renderAlerts()` | `js/app.js` | Price Alerts |
| `renderAdmin()` | `js/app.js` | Admin panel |
| `renderDeals()` | `js/deals.js` | Deal Board |
| `renderDealForm()` | `js/deals.js` | Post Deal form |
| `renderAgentHub()` | `js/deals.js` | Agent directory |
| `renderAdminDashboard()` | `js/deals.js` | Deal admin dashboard |
| `renderChat()` | `js/chat.js` | AI Agents + Social Media Manager |
| `renderSocial()` | `js/social.js` | PropTech Video Platform |
| `renderAbout()` | `js/about.js` | About/Mission |
| `renderWorkspace()` | `js/workspace.js` | My Workspace |
| `renderReportBuilder()` | `js/workspace.js` | Custom Report Builder |

#### 9. 📋 SOCIAL.JS INTERNAL FUNCTIONS (PropTech Video Platform)
These are internal sub-renderers inside `renderSocial()`:
- `_renderExplore()` — Video explore feed
- `_renderAgents()` — Agent profiles directory
- `_renderMyProfile()` — User's own profile
- `_renderFollowing()` — Following feed (areas + agents)
- `_renderVideoCard()` — Individual video card component
- `_renderVideoModal()` — Video playback modal
- `_renderAgentCard()` — Agent profile card
- `_renderAgentProfile()` — Full agent profile page

### Navigation style
- **Desktop**: Left sidebar with 5 icons + labels, collapsible
- **Mobile**: Bottom tab bar with 5 icons, sub-tabs as horizontal pills
- Active tab highlighted with brand color accent
- Smooth transitions between sections

### Design system tokens
- **Background**: #070B14 (current dark), #0D1220 (surface), #1A1F2E (card)
- **Text**: #FFFFFF (primary), #8899AA (secondary), #556677 (muted)
- **Brand gold**: #D4AF37 (primary accent)
- **Success**: #10B981, **Warning**: #F59E0B, **Error**: #EF4444
- **Purple (rental)**: #8B5CF6
- **Font**: Space Grotesk (headings), Inter (body)
- **Border radius**: 12px (cards), 8px (buttons), 20px (pills)
- **Spacing scale**: 4px base (4, 8, 12, 16, 20, 24, 32, 48)

### Files that the redesign session MUST NOT modify
These files contain critical business logic and data:
- `js/data-residential.js` — 8,522 building database (DO NOT TOUCH)
- `js/data-commercial.js` — 1,930 commercial + 428 land database (DO NOT TOUCH)
- `js/valuation.js` — Valuation engine (DO NOT TOUCH)
- `js/valuation-db.js` — Valuation DB helpers (DO NOT TOUCH)
- `api/proxy-groq.js` — Groq AI proxy (DO NOT TOUCH)
- `api/proxy-video.js` — Video engine proxy (DO NOT TOUCH)
- `api/proxy-rapidapi.js` — RapidAPI proxy (DO NOT TOUCH)
- `api/auto-post.js` — Auto-post cron (DO NOT TOUCH)
- `api/sync-engagement.js` — Engagement sync cron (DO NOT TOUCH)
- `supabase-*.sql` — Database schemas (DO NOT TOUCH)

### Files the redesign session CAN modify (UI only)
- `js/app.js` — Tab routing, navigation, header, render()
- `js/core.js` — Shared UI utilities, theme colors, el()/div()/span()
- `js/market.js` — Market tab UI layout (NOT valuation logic)
- `js/marketindex.js` — Market Index tab UI
- `js/portfolio.js` — Portfolio tab UI (NOT computeAssetMetrics/computePortfolioHealth)
- `js/deals.js` — Deals tab UI (NOT Supabase queries)
- `js/chat.js` — Chat/Social tab UI (NOT API proxy functions)
- `js/map.js` — Map tab UI
- `js/mortgage.js` — Mortgage tab UI
- `js/workspace.js` — Workspace tab UI
- `js/about.js` — About tab UI
- `js/auth.js` — Auth UI (NOT auth logic)
- `js/social.js` — PropTech Video Platform UI (NOT Supabase queries)
- `index.html` — Shell, meta tags, script loading

## Outstanding / open items

- **🔴 Email sending (Resend) — NOT WORKING**: Price Alert emails cannot send.
  `/api/*.js` serverless functions return 404 on Vercel. Next steps:
  1. Check if local `package.json` has extra deps triggering Vercel auto-detection
  2. Try deploying via git push to `main` instead of `npx vercel --prod`
  3. Check Vercel deployment "Source" tab for uploaded files
  4. Fallback: move API functions to Supabase Edge Functions
  - **Resend domain `dubaival.com`**: was "Partially Verified" as of 2026-06-17.
    May be fully verified by now — check Resend dashboard.
- **🔴 Live Market Finder — broken**: Multiple issues:
  1. **Only Bayut listings show** — Property Finder listings are missing.
     Likely the RapidAPI endpoint or parser only handles Bayut responses.
  2. **No listing photos** — Bayut listings appear without property images.
     The API response may include image URLs but they're not being rendered.
  3. **Hard limit of 12 listings** — Even when more results exist, only 12
     are shown. Need pagination or "load more" or increase the API limit param.
  - Files to investigate: `js/api.js` (fetchLiveData), `js/market.js`
    (Live Dashboard / listing rendering), `api/proxy-rapidapi.js`
- **Security note**: RESEND_API_KEY and SUPABASE_SERVICE_ROLE_KEY were shared in
  chat. User was advised to regenerate both. Do NOT echo these keys.
- **✅ COMPLETED: Security hardening** (2026-06-20): 3 critical vulnerabilities
  fixed (edit_token exposure, agent_phone leak, hardcoded admin password).
  Supabase RLS hardening SQL executed. Client-side fixes deployed.
- **✅ COMPLETED: Full calibration** (2026-06-20): All 10,880 properties
  (8,522 res + 1,930 com + 428 land) calibrated with 100% coverage.
  data.js split into data-residential.js + data-commercial.js for performance.
- **✅ COMPLETED: Opportunity Alerts** (both phases). All 6 alerts live in
  `js/portfolio.js`.
- **✅ COMPLETED: Capacitor Android App** (2026-06-20): Full native Android
  wrapper via Capacitor 8.x. Includes 6 plugins (browser, haptics, keyboard,
  share, splash-screen, status-bar), custom icons (5 densities), splash screens
  (11 sizes), dark theme, deep links, portrait lock, ProGuard minification.
  Build: `npm run cap:build:android` then open in Android Studio.
  APK not yet built — requires Android SDK (not available in cloud env).
- **✅ COMPLETED: AVM full calibration** (2026-06-20): All 10,880 properties
  calibrated with 100% coverage. Error reduced from ~20% to under 5%.
- **Building research ACTIVE**: Current: 8,522 residential across 216 areas.
  347 areas have benchmarks. Target areas listed in "Building research gaps" below.
  **IMPORTANT**: Buildings go in `js/data-residential.js`, NOT in `index-6.html`.
- **Agent video analysis & upload**: not built yet, deferred to future.
- **Deploy method**: User deploys manually by copying files to dubaival folder
  and deploying via Node.js/Vercel CLI. NOT via git merge to main.

## Building research gaps (priority areas)

When adding buildings, edit **`js/data-residential.js`** only. Add to `var DB={...}` and
`const BLDG_UNITS={...}` on the same file.

| Area | Have | Estimated Real | Gap |
|---|---|---|---|
| Downtown Dubai | 377 | 400+ | **23+** |
| Dubai Marina | 354 | 500+ | **146+** |
| Business Bay | 335 | 500+ | **165+** |
| Meydan | 249 | 250+ | **~1** |
| Dubai Hills Estate | 238 | 300+ | **62+** |
| Palm Jumeirah | 230 | 400+ | **170+** |
| Dubai Creek Harbour | 157 | 200+ | **43+** |
| MBR City | 93 | 150+ | **57+** |
| Palm Jebel Ali | 61 | 80+ | **19+** |
| JBR | 58 | 80+ | **22+** |
| DIFC | 55 | 80+ | **25+** |
| Sobha Hartland | 62 | 80+ | **18+** |
| Emaar Beachfront | 33 | 40+ | **7+** |
| Tilal Al Ghaf | 31 | 40+ | **9+** |
| District One | 22 | 30+ | **8+** |
| Za'Abeel | 23 | 30+ | **7+** |

## Testing technique (no build/test infra)

To test valuation/DB in isolation, load `js/data-residential.js` + `js/valuation.js` in
Node with stubs for `window`/`document`/`localStorage`/`navigator`/`fetch` as
no-ops. `computeValuation` requires `f.price` and `f.size`/`f.buaSize` set.

## User preferences

- Communication in **Persian/Farsi**
- User email: momeni.yashar@gmail.com
- Broad "upgrade everything" directives need scoping/clarification — confirm
  concrete scope before doing broad unscoped work
