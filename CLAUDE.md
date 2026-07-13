# DubaiVal — Project Context for Claude Sessions

Read this first. It exists so a fresh session doesn't have to re-read the whole
single-file app or re-derive line numbers/history from scratch.

---

## 🔴 #0 CRITICAL — FROZEN NAVIGATION (DO NOT CHANGE WITHOUT USER APPROVAL)

The navigation structure below is **locked**. No session may add, remove, rename,
or move any tab/sub-tab without the user explicitly asking for it. Any change to
`NAV_SECTIONS` in `js/core.js` or the routing block in `js/app.js` **must** be
accompanied by an update to this table. Treat this as the single source of truth.

### Complete Tab Map (locked 2026-07-04)

| Section (id) | Sub-tab (id) | Label shown | Render function | File |
|---|---|---|---|---|
| **Home** | — | Home | `renderHome()` | `js/app.js` |
| **Market** | Dashboard | Dashboard | `renderMarket()` | `js/market.js` |
| | Analyzer | Analyzer | `renderAnalyzer()` | `js/market.js` |
| | QuickCheck | Quick Check | `renderQuickCheck()` | `js/market.js` |
| | TrackRecord | Track Record | `renderTrackRecord()` | `js/market.js` |
| | Index | Market Index | `renderMarketIndex()` | `js/marketindex.js` |
| | Compare | Compare | `renderCompare()` | `js/portfolio.js` |
| | Find | Find | `renderFind()` | `js/app.js` |
| | Map | Map | `renderMap()` | `js/map.js` |
| | Advisor | Advisor | `renderPersonal()` | `js/portfolio.js` |
| | News | News | `renderNews()` | `js/market.js` |
| **Portfolio** | Assets | My Assets | `renderPortfolio("assets")` | `js/portfolio.js` |
| | Health | Health | `renderPortfolio("health")` | `js/portfolio.js` |
| | Projections | Projections | `renderPortfolio("projections")` | `js/portfolio.js` |
| | Alerts | Alerts | `renderAlerts()` | `js/app.js` |
| **Network** | Deals | Deal Board | `renderDeals()` | `js/deals.js` |
| | Chat | AI Agents | `renderChat()` | `js/chat.js` |
| | Chiefs | AI Chief of Staff | `renderChiefs()` | `js/chiefs.js` |
| **SocialMedia** | Studio | Media Studio | `renderMediaStudio("studio")` | `js/chat.js` |
| | Avatar | Avatar Studio | `renderMediaStudio("avatar")` | `js/chat.js` |
| | VideoPlatform | Video Platform | `renderSocial()` | `js/social.js` |
| | SocialChat | AI Assistant | `renderChat()` | `js/chat.js` |
| **More** | Workspace | Workspace | `renderWorkspace()` | `js/workspace.js` |
| | Reports | Reports | `renderReportBuilder()` | `js/workspace.js` |
| | About | About | `renderAbout()` | `js/about.js` |

### Hidden routes (not in nav, accessible via hash only)
- `#admin` → `renderAdmin()` in `js/app.js` (password protected)

### Rules for future sessions
1. **DO NOT** add a new top-level section without user approval.
2. **DO NOT** move a sub-tab from one section to another without user approval.
3. **DO NOT** rename a sub-tab label without user approval.
4. **DO NOT** change the render function a sub-tab calls without user approval.
5. When adding a **new** sub-tab (user-approved), add it to: (a) this table, (b) `NAV_SECTIONS` in `js/core.js`, (c) routing in `js/app.js`. All three must stay in sync.
6. **Agent Hub** lives inside Deal Board (OFM nav, `DEAL_STATE.mode="agents"`), NOT as a top-level Network sub-tab.
7. **Inbox** lives inside AI Chief of Staff (internal `CHIEFS_STATE.view="inbox"`), NOT as a top-level Network sub-tab.
8. **Mortgage Calculator** is a collapsible panel inside Analyzer — NOT a separate tab.

---

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
- **`js/map.js`** — Interactive Map tab (Google Maps — not Leaflet, this note
  was stale; corrected 2026-07-13). Voronoi-cell region rendering, metric
  registry, composite Investment Score.
- **`js/voronoi.js`** — Dependency-free 2D Voronoi cell generator (half-plane
  intersection method) used only by `js/map.js`.
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
- **`tools/generate-seo-pages.js`** — Generates the static SEO pages (see
  "Programmatic SEO" in the 2026-07-12 work log below): `/areas/<slug>.html`,
  `/buildings/<slug>.html`, `/areas.html` hub, `/sitemap.xml`, `/robots.txt`,
  `/seo.css`. Re-run after any meaningful `js/data-residential.js` change.
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
| `ofm_reports` | `supabase-ofm-trust-safety.sql` | In-chat abuse/scam reports on OFM matches — admin-reviewed via `admin_pending_reports`/`admin_resolve_report` RPCs (requires manual execution, see Outstanding items) |
| `market_config` | (pre-existing) | Macro yield/growth adjustment knobs |
| `knowledge_base` | `supabase-knowledge-base-schema.sql` + `supabase-knowledge-base-recency-fix.sql` + `supabase-forecast-accuracy-schema.sql` | RAG vector store — 768-dim embeddings (Jina or Gemini) of live news, daily market snapshots, and weekly forecast-accuracy audits (see below). Recency-weighted retrieval. Live since 2026-07-11 (see Outstanding items). |
| `area_benchmarks` | (inside `api/refresh-market-data.js` workflow, already deployed) | Live PSF + rent data per area, refreshed daily by cron; also carries `rent_active_count`/`rent_avg_days_listed` (session 11n, requires manual execution — see Outstanding items) |
| `price_history` | (inside `api/refresh-market-data.js` workflow, already deployed) | Historical PSF per area per day — also the ground truth for the forecast-accuracy audit below |
| `rental_listings_seen` | `supabase-rental-liquidity-schema.sql` | Service-role-only tracking of individual for-rent listing first/last-seen dates — derivation input for the weekly rental-velocity job, never read by the client (requires manual execution, see Outstanding items) |

**SQL migration files executed in Supabase** (confirmed 2026-06-18): the original 5 above. `supabase-knowledge-base-schema.sql` (the RAG table) requires manual execution — see Outstanding items.

**Note (found 2026-07-12)**: `deal_board`/`deal_inquiries`/`deal_media` above describe the
OLD Deal Network (pre-OFM). Current `js/deals.js` has zero references to any of the
three — `renderDeals()` today is 100% the OFM (`ofm_*` tables) blind-matching system,
and `DEAL_STATE` is explicitly a "backward-compat shell" that routes into `OFM_STATE`
(see `js/deals.js` line 6). The "Title Deed Verification" and "Privacy-First Media
Gallery" subsections under "Deal Network features" below describe this same dead
`deal_board` flow and are stale for the same reason. The "Agent Referral Program"
subsection is NOT stale — `dv_agents`/`dv_referrals` are still real and live, wired
into the current Admin Dashboard. Not rewritten this session (out of scope for the
trust/safety task that found this) — flagging so a future session doesn't debug dead
code or assume Title Deed verification already works (it didn't — see the
`supabase-ofm-trust-safety.sql` fix in the work log below, which adds real admin
document verification to the OFM system instead).

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

## RAG Knowledge Base feature (code-complete, 2026-06-30)

Architecture: pgvector (Supabase) + Google Gemini `text-embedding-004` (768-dim).
Continuously-growing AI memory that makes DubAIVal smarter over time.

**Files**:
- `supabase-knowledge-base-schema.sql` — pgvector extension, `knowledge_base` table,
  `match_knowledge()` RPC, HNSW cosine-similarity index, RLS public-read policy.
- `api/lib/embeddings.js` — Gemini `text-embedding-004` batch-embedding helper.
- `api/knowledge-query.js` — Public semantic-search retrieval endpoint (POST).
- `api/proxy-news.js` (modified) — Embeds + upserts newly-seen articles after
  serving the news response (non-blocking background ingestion).
- `api/refresh-market-data.js` (modified) — After the daily area loop, synthesizes
  natural-language market facts per area and batch-embeds them into the knowledge base.
- `js/api.js` (modified) — `askAI()` extended with optional 3rd `groundQuery` param;
  new `fetchKnowledgeContext(query,area)` helper.
- Grounding wired into 5 AI call sites: Chat AI Agents (`js/chat.js:6505`),
  Area Comparison in Market Index (`js/marketindex.js:305`), Area Compare
  (`js/portfolio.js:19`), Personal Advisor (`js/portfolio.js:~89`),
  Portfolio AI Analysis (`js/portfolio.js:910`).

**Knowledge sources (auto-ingested)**:
- **Live news** (every ~2.5 min on cache-miss): Google News RSS articles via
  `api/proxy-news.js`. Embeds title+description. Stored with source_type='news',
  tag='launch'/'general'.
- **Daily market snapshots** (every day at 06:00 UTC via cron): Per-area PSF +
  rent facts synthesized in `api/refresh-market-data.js`. Stored with
  source_type='market_snapshot'. Synthetic source_url key is
  `area-snapshot:{area}:{date}` — since the date is part of the key, each day
  writes a NEW row per area (does NOT overwrite the prior day's entry, despite
  what earlier notes here said). Rows older than 90 days are pruned by the
  same cron via `pruneOldMarketSnapshots()` (2026-07-12 fix) so the table
  doesn't grow unbounded.

**Required embedding provider env var in Vercel** (either one — `embedTexts()`
prefers Jina first if both are set):
  - `JINA_API_KEY` — recommended for production (jina-embeddings-v3, 768-dim
    via Matryoshka truncation, permanent key, no expiry). Get at jina.ai.
  - `GEMINI_API_KEY` — text-embedding-004, 768-dim. Free tier at
    https://aistudio.google.com/apikey. OAuth-style keys (`AQ.`/`ya29.`
    prefix) expire in ~1h — use a plain `AIzaSy...` API key for production.
  - Add in: Vercel Dashboard → Project → Settings → Environment Variables
  - All 4 call sites (`api/knowledge-query.js`, `api/proxy-news.js`,
    `api/refresh-market-data.js`, `api/chiefs-embed.js`) gate on
    `embeddings.hasProvider()`, not a hardcoded key name — this was a real
    bug fixed 2026-07-12 (they used to check `GEMINI_API_KEY` only, so a
    Jina-only setup would have silently disabled the entire RAG pipeline).

**Required new Supabase SQL migration**:
  - Run `supabase-knowledge-base-schema.sql` in Supabase Dashboard → SQL Editor

**Graceful degradation**: Both steps are required before the feature becomes live.
Until they're done: ingestion calls fail silently, `knowledge-query.js` returns
`{results:[]}`, and `askAI()` grounding falls through to a no-op — all existing
features continue working exactly as before. Zero breakage.

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

- **2026-07-13 (session 11q)**: Interactive Map — replaced real-world-radius
  Circle overlays with true Voronoi-cell region polygons, plus a broader
  professional redesign, per explicit user request ("ارتقاء بده تا به یک
  نقشه حرفه‌ای املاک در دبی برسیم" — upgrade this to a professional Dubai
  real-estate map). Session 11f had already patched the underlying overlap
  bug with a separate pixel-based marker/cluster layer on top of decorative
  circles; this redesign removes circles entirely.
  - **New `js/voronoi.js`**: dependency-free 2D Voronoi generator (half-plane
    intersection / Sutherland-Hodgman clipping) — no external geometry
    library, ~350 points computed in ~30ms. Real bug caught before shipping:
    the first version of the lat/lng→local-meters projection only offset by
    origin LATITUDE, not longitude, putting every real area's projected x
    coordinate around 5.5 million meters (Dubai's absolute distance from the
    Prime Meridian) while the bounding box was centered at 0 — this collapsed
    286 of 287 cells to degenerate empty polygons. Caught by testing against
    the REAL `AREA_COORDS` data (not just synthetic test points) before
    wiring into map.js; fixed by projecting relative to both origin lat AND
    lng. Verified via a full geometry test suite: cells contain their own
    site, total cell area matches the bounding box area to within 0.03%
    (proper partition, no gaps/overlaps), 500 random-point overlap samples
    all land in exactly one cell, coincident-point inputs don't throw.
  - **`js/map.js` rewrite**: Voronoi cells are now both the visual AND the
    interactive layer (proper non-overlapping polygons, unlike the old
    circles, so the separate pixel-marker workaround is no longer needed).
    Genuine geographic outliers (Hatta, ~97km from Dubai's center — the next
    farthest tracked area is ~32km) get a plain marker instead of being
    included in the Voronoi diagram, which would otherwise stretch one
    shared bounding box out to accommodate a single distant exclave and
    distort every other cell. Same zoom-based level-of-detail clustering
    technique session 11f built for markers is reused here to group nearby
    areas into merged, averaged cells at low zoom (≤ zoom 12) and split into
    full per-area resolution above that.
  - **New composite "Investment Score" metric** (now the map's default):
    a real, documented 0-100 blend — Yield 30% (3–10% range) + Growth-3yr 30%
    (0–30% range) + Liquidity 20% (inverse DOM, 90d–15d range) + Turnover 20%
    (log-scaled tx volume, 1–3,000) — same spirit as `computeValuation()`'s
    Margin-of-Safety index, adapted to area-level inputs, giving one
    "where should I look first" signal instead of 6 separate single-factor
    maps a user would have to mentally combine themselves.
  - **One consistent color scale for every metric**: replaced the previous
    inconsistent mix (a manual RGB-blend formula for growth/yield/turnover/
    liquidity, but 3 hardcoded discrete tiers for price/location) with one
    continuous HSL interpolation, red→green for metrics where higher-is-
    better (or inverted for Days-on-Market, where lower-is-better), and a
    neutral blue→gold scale for Price specifically (an expensive area isn't
    inherently a "worse" investment, so red/green quality framing doesn't
    apply there).
  - **Dynamic legend**: shows the REAL min/max of the metric currently being
    displayed (via `cfg.fmt()`) plus a live gradient bar, replacing the old
    legend's generic hardcoded tier labels that weren't actually tied to the
    data on screen.
  - **"Explore Buildings" CTA**: every popup now has a button that deep-links
    into Find → Smart Property Discovery pre-filtered to that area (sets
    `FIND_STATE.sf.area` after `setSection("Market","Find")`, which renders
    synchronously so `FIND_STATE` is guaranteed initialized first) — turns
    the map from a pure visualization into an actual discovery entry point,
    matching how Zillow/Redfin/PropertyFinder region-click UX works.
  - **Popup consolidated to one consistent template** (metric headline value
    + PSF + 2 metric-specific detail facts, e.g. 1yr/5yr growth for the
    Growth metric or rent benchmarks for Yield) instead of 6 fully bespoke
    ~70-line HTML blocks per metric — same information depth, less code,
    more visually consistent across metric switches.
  - Verified: the Voronoi geometry test suite above; a metric-registry test
    running all 7 metrics' `getVal`/`fmt`/`detail` functions across all 347
    real areas (2,429 checks, 0 errors); a color-scale polarity test
    confirming correct red/green/blue-gold direction per metric type; a
    mocked-`google.maps` pipeline test exercising the full group→Voronoi→
    polygon path end-to-end at both low zoom (confirmed clustering merges
    areas into fewer cells) and high zoom (confirmed full 286-cell
    resolution); `node -c` on both new/touched files; the full valuation/
    asset regression harness (0 errors); and a live-browser Playwright pass
    confirming the metric toggle buttons render, all map-related global
    functions are correctly exposed and callable, and the map gracefully
    falls back to "Map unavailable" with zero non-network console errors
    (this sandbox has no live network access to Google's Maps API, so the
    actual rendered polygons/click-through navigation could not be visually
    verified end-to-end in a real browser this session — the underlying
    geometry, data pipeline, and DOM structure are all verified correct; a
    live check against the real Google Maps API is the one remaining step,
    same limitation noted for every Google-Maps-dependent feature this
    session).

- **2026-07-13 (session 11p)**: Wired Rental Demand Score into the Analyzer
  report itself (`js/market.js` `renderAnalyzerResult()`), plus an
  architecture/correctness pass over the whole Analyzer result pipeline —
  direct follow-up to session 11o: user pointed out a buyer needs this
  exact signal at the moment of evaluating a specific unit/villa to buy, not
  only in a separate Smart Discovery list, and asked for a careful review of
  section ordering and output correctness while adding it ("مهمترین بخش ما
  است" — this is our most important section).
  - **Architecture fix, not just a bolt-on**: `estimateRentalDemandScore()`
    is now computed ONCE inside `computeValuation()` itself (`js/valuation.js`)
    and carried on `val.demandScore` — the same pattern every other
    Analyzer metric already follows (`turnoverRate`, `mosScore`, `liqScore`,
    etc. are all precomputed on `val`, never recomputed ad-hoc in the render
    layer). Uses the building's own calibrated PSF (`bData.p`) — a
    structural attribute of the BUILDING — not this listing's one-off asking
    price (`askPSF`), which the existing verdict/vsPct fields already judge
    separately; falls back to `askPSF` only when no building match exists.
    Works identically for villas (confirmed `f.cluster` is a display-only
    sub-community label, not a separate lookup path — villas resolve through
    the exact same `bData`/`aData`/`isVilla` machinery as apartments).
  - **Placement**: inserted right after "Rental Intelligence Engine" (the
    rent/yield numbers) and before "Market Liquidity" — groups the two
    RENTAL-focused sections together, ahead of the SALE-liquidity sections
    (Market Liquidity, Building Turnover) and the composite Margin of Safety
    score, a cleaner narrative than the previous ordering. Same "▲/▼ +
    itemized reason" card style as the Find tab version.
  - **Full-file architecture/correctness pass** (per the user's explicit
    ask): read through the complete ~1,800-line `renderAnalyzerResult()` —
    Property Location, Price Anomaly Detection, Sustainability Score,
    Confidence Breakdown, Smart Guidance, Market Sentiment, Price History
    Chart, Rental Intelligence, Market Liquidity, Building Turnover, Margin
    of Safety, Location Intelligence, Nearby Amenities, Drive Times,
    Personalized Advisory System — confirmed every section reads real
    `val.*`/`AREAS`/`bData` fields (no hardcoded/fake data), found no
    duplicate or conflicting metrics, and confirmed the new addition doesn't
    overlap with the existing `grossYield`/`netYield`/`investSignal` fields
    (those already use the full hedonic-adjusted rent for the exact unit;
    demandScore deliberately uses the building's baseline PSF instead, since
    it answers a different question — "is this BUILDING structurally easy to
    rent," not "is THIS listing's price fair"). No other correctness issues
    found — consistent with this engine's long, already-heavily-audited
    history (see the many prior calibration/accuracy sessions above).
  - Verified: a Node test (via the existing `load_engine.js` regression
    harness) confirming `val.demandScore` is present, well-formed, and
    correctly computed across 4 cases — apartment with building match,
    apartment with no building match (area-only fallback), villa with
    building/cluster match, and a completely unknown area (generic fallback)
    — zero throws in any case; `node -c` on both touched files; the full
    valuation/asset regression harness (0 errors, confirming this change
    doesn't affect any existing Analyzer output); and a real-browser
    Playwright test driving the actual Analyzer flow end-to-end for both an
    apartment (Burj Khalifa) and a villa (Elie Saab II, Arabian Ranches) —
    confirmed the "Rental Demand Score" card renders with real, correct,
    differentiated content in the live DOM in both cases, zero non-network
    console errors.

- **2026-07-13 (session 11o)**: Rental Demand Score — real, itemized,
  BUILDING-specific reasons why a building would/wouldn't rent fast (Find →
  Smart Property Discovery), direct follow-up to session 11n: user pointed
  out that the area-level rental-velocity signal still can't answer "why does
  THIS building rent fast" with reasons — the exact buyer question ("advise
  me a more demandable building, easier to rent... with reasons why").
  - **Why not just fabricate per-building days-to-rent**: there isn't enough
    real listing volume per individual building to measure it statistically
    (most buildings have 1-2 active rental listings at once — not enough for
    a meaningful average) — only the AREA has enough volume (session 11n).
    Presenting a fake per-building number would violate the accuracy
    principle this whole session has been enforcing. Solution instead: build
    a transparent, explainable score from REAL structural factors real estate
    professionals actually use to judge rentability — the reasons matter more
    than a single number, so every contribution is itemized and visible.
  - **`estimateRentalDemandScore(bData,aData,psf,bldgUnits,rentVel,areaName)`**
    (`js/valuation.js`) — 0-100 score (50=neutral), additive drivers, each
    backed by a real field:
    1. Price competitiveness (building PSF vs its own area average — cheaper
       per sqft for similar rent attracts faster interest).
    2. Grade/tenant-pool breadth (Ultra/A+ = narrower HNW/corporate pool;
       A/A- = widest professional+family pool, usually fastest; B/B+ =
       affordability-driven; C = narrowest appeal) — NOT just "premium is
       better," since an overly narrow luxury pool can be slower to fill
       despite paying more per unit once filled.
    3. Service charge burden as % of the unit's OWN price (a well-known
       Dubai rental friction point) — correctly scales with the building's
       actual price tier, not a flat SC number.
    4. Building scale/liquidity (`estimateBldgUnits()`, already used for the
       existing sales-turnover metric) — larger buildings have a bigger,
       more active rental ecosystem.
    5. The REAL area rental-velocity signal from session 11n
       (`getRentalVelocity()`) when ready — lifts/drags every building in
       that area; shows "still building up" (not a fabricated value) when
       not yet ready.
  - **Wired into Smart Discovery**: new "Best Rental Demand" sort option, and
    a "Rental Demand: <tier> (<score>) · Why?" pill on every result — clicking
    it (with `stopPropagation` so it doesn't trigger the row's own
    navigate-to-Analyzer click) expands a real itemized breakdown (▲/▼ per
    driver, full reason text), giving the buyer the actual reasoning, not
    just a number.
  - Verified: a standalone Node test with 3 synthetic scenarios (cheap/broad-
    grade/large-building/fast-area → 100 Very High; expensive/Ultra/small/
    slow-area → 30 Below Average; neutral/area-data-not-ready → 61 High with
    the graceful "still building up" driver, no fabricated value) — correct
    monotonic ordering and real, differentiated reasoning in every case; a
    full-database simulation across all 9,227 real buildings (0 errors, 43
    distinct scores, range 30-92); `node -c` on both touched files; the full
    valuation/asset regression harness (0 errors); and a real-browser
    Playwright test driving the actual Smart Discovery UI — sorted correctly
    by demand score descending, clicking a "Why?" pill correctly expanded the
    real driver text in the live DOM, zero non-network console errors.

- **2026-07-13 (session 11n)**: Real area-level rental-VELOCITY signal — "how
  fast does this area actually rent" (Find → Smart Property Discovery), direct
  follow-up to session 11m: user pointed out that yield alone doesn't answer
  "advise me a more demandable building, easier to rent than this one" — the
  platform had ZERO rental-demand signal at all (`AREAS[].dom`/`txVol` are
  SALES-side only). User explicitly chose the "area-level, from real data"
  path over a live-per-click option or a weak sales-turnover proxy.
  - **New data pipeline** (`supabase-rental-liquidity-schema.sql`, new
    migration — requires manual execution): api/refresh-market-data.js's daily
    cron already fetches real for-rent listings per area (for the existing
    rent_1br/2br/3br benchmarks) — this adds `trackRentalListingSightings()`,
    which records each individual listing's first/last-seen date into a new
    `rental_listings_seen` table (service-role-only, zero anon access — pure
    derivation input, never read by the client). Careful to never clobber
    `first_seen` on repeat sightings: existing listing_ids get ONE batched
    PATCH bumping just `last_seen`; only genuinely new ones get inserted.
  - **New weekly job** (`?action=rental-velocity`, Sundays 07:45 UTC —
    `vercel.json`): a listing whose `last_seen` has gone stale (not
    re-observed in 3 days of daily crons) is presumed rented/delisted — the
    same standard caveat every real "days on market" metric in the industry
    carries — and `last_seen − first_seen` is a real time-to-rent sample.
    Averaged per area into `area_benchmarks.rent_avg_days_listed` +
    `rent_velocity_sample_size`, exactly the same accumulate-then-derive
    pattern already proven for `growth_1yr_realized`
    (`supabase-area-growth-schema.sql`) — and needs the same few weeks of
    accumulation before it's meaningful; gracefully returns "not ready yet"
    until then, never a fabricated number. Also added `rent_active_count`
    (current live rental supply, available same-day, no accumulation needed)
    and a prune step for sightings older than 400 days.
  - **Client wiring**: `getRentalVelocity(area)` in `js/valuation.js` reads the
    new fields off `DYNAMIC_BENCHMARKS` (populated by the existing
    `fetchDynamicBenchmarks()`); Smart Discovery gained a "Fastest to Rent
    (Area)" sort option and an "Area rents in ~Xd" pill on each result —
    deliberately labeled "Area" (not per-building) since no per-building
    rental-speed data exists or is claimed, avoiding the exact same
    building-vs-area conflation session 11m's yield fix had just corrected.
  - Verified: a mocked-fetch Node test driving the real HTTP handler surface
    of `?action=rental-velocity` across all 39 tracked areas (correct
    per-area PATCH values, 401 on bad auth); a second test proving the
    new/existing listing split never clobbers `first_seen`; `node -c` on both
    touched files; the full valuation/asset regression harness (0 errors); and
    a real-browser Playwright pass exercising the new sort option live (zero
    non-network console errors, correct graceful "not ready yet" `null`
    handling with no live Supabase connection in this sandbox).
  - **Manual step required**: run `supabase-rental-liquidity-schema.sql` in
    Supabase SQL Editor. Until then and until ~2-3 weeks of daily-cron
    accumulation pass, `rent_avg_days_listed` stays null everywhere and the
    "Fastest to Rent" sort/pill simply don't show a value — zero breakage to
    anything else in the interim.

- **2026-07-13 (session 11m)**: Real building-level rental yield — "which
  specific building is best to buy for rental income" (Find → Smart Property
  Discovery + Find's DB search), user-requested after asking whether the
  platform could answer this question at all.
  - **Real bug found**: Smart Property Discovery's "Min Yield %" filter and
    "Sort by Highest Yield" (`js/app.js` `renderFind()`) computed yield as
    `(AREAS[area].y[0]+AREAS[area].y[1])/2` — the AREA's yield band, stamped
    identically onto every building in that area regardless of the building's
    own PSF. Two buildings in the same area at AED 900/sqft and AED 2,400/sqft
    showed the exact same "yield," so the sort/filter could rank AREAS against
    each other but could not tell buildings within one area apart — unable to
    actually answer "which building here is the better buy for rent." Find's
    plain DB search (`doDBSearch()`) had a second, related bug: it derived
    `estRent` backwards as `estPrice × flatAreaYield`, a number with no
    connection to any real rent benchmark at all (never touched `AREAS[].r1/
    r2/r3`), just the same area yield re-multiplied by whatever price the
    building's own PSF produced.
  - **Fix** (`js/valuation.js`): extracted `GRADE_RENT_PREMIUM` (previously an
    inline ternary duplicated dead-reckoning inside `computeRentalValuation`)
    and `_baseAreaRent()` (the bed-count → area rent ladder, same extraction)
    as shared single-source-of-truth pieces — `computeRentalValuation` itself
    is now a pure refactor with byte-identical ternary bodies, verified via
    diff and a direct before/after Node run, zero output change. Added two new
    bulk-scan estimators on top of these shared pieces: `estimateBuildingYield
    (bData,aData,psf)` — for PSF-only contexts (no bed count available) — scales
    the area's yield band by `areaPSF/buildingPSF × gradeRentPremium`, i.e. a
    cheaper-than-average building gets a real yield boost and a
    grade-premium/branded building gets a real yield discount, matching the
    well-known real-world pattern that luxury Dubai buildings usually yield
    LESS despite renting for more (price premium outpaces rent premium).
    `estimateBuildingRentYield(bData,aData,beds,isVilla,psf)` — for contexts
    that DO have a bed count (`doDBSearch`) — computes a real AED rent from the
    actual area rent benchmark (grade-adjusted) over a real building-PSF-derived
    price, replacing the circular estPrice×flatYield calc entirely.
  - **Wired into 3 call sites**: Smart Discovery's yield filter/sort and card
    display (`js/app.js`), `doDBSearch()`'s per-building rent/yield (`js/app.js`,
    same file/tab), and Compare's building-vs-area/community yield row
    (`js/portfolio.js` `_cmpItemData`) — Compare's building case previously had
    this exact same bug (any specific building compared showed the flat area
    yield band, not its own).
  - Verified 3 ways before shipping: (1) a standalone Node test confirming
    cheap/average/luxury synthetic buildings in the same area now show
    monotonically decreasing yield as PSF/grade rises (8.71% → 6.15% → 5.03% in
    a real Business Bay test), plus `computeRentalValuation` sanity-checked
    post-refactor; (2) a full-database simulation running the new estimators
    against all 9,227 real buildings — 0 errors, yields now span 1.67%–20.00%
    with 1,073 distinct values (was ~216, one per area, pre-fix); (3) a
    real-browser Playwright test driving the actual Find UI (set area to
    Business Bay, sort by Highest Yield, click Discover) — 50 results, 36
    distinct yields in that one area alone, correctly ranking a B-grade AED
    859/sqft building above an A+-grade AED 1,578/sqft building, zero
    non-network console errors.

- **2026-07-13 (session 11l)**: AI Video Studio engineering audit (`js/chat.js`,
  Network → Social Media Manager → AI Video Studio + Avatar Studio's video
  generator), user-requested review of tool selection and layout/precedence.
  - **Two separate, diverging engine pickers for the same job**: the main
    Studio (`showVideoGenUI`) had its own hardcoded 7-engine list (no Hedra),
    and Avatar Studio's video generator (`showAvatarVideoGen`) had a second,
    independently hardcoded 8-engine list (including Hedra) — different order,
    different colors for the SAME engine (e.g. Pika was `#F59E0B` in one list,
    a totally different engine's color in the other), and no shared source of
    truth. Concretely dangerous: Hedra was selectable in the Avatar flow even
    when `HEDRA_API_KEY` isn't funded (confirmed via `api/proxy-video.js`'s
    `engine_status` action, which already reports per-engine booleans) — a
    user could pick it and hit a raw "not configured" error, exactly the
    failure mode the session-11e "coming soon" gate was built to prevent.
  - **Fix**: added one shared `VIDEO_ENGINE_CATALOG` (label, icon, color,
    description, quality, `needsPhoto`/`photoRequired`) plus `_videoEngineInfo()`
    and `_availableVideoEngines()` helpers, right next to the existing
    `_anyVideoEngineConfigured()` check. `_videoEnginesCache` (previously a
    positional array, easy to mis-index) is now a keyed object. Both
    `showVideoGenUI` and `showAvatarVideoGen` now render exactly
    `_availableVideoEngines()` — every engine shown is guaranteed actually
    configured, an engine starts appearing the moment its key is funded with
    zero code change, and both entry points always agree on label/color/order.
    Also wired Hedra into the main Studio's own generate/status switch
    (`_hedraGenVideo`/`_hedraCheckStatus` already existed for the avatar flow)
    so it now works from either entry point, not just one.
  - **Second bug found in the same audit**: Avatar Studio's picker carried a
    blanket, false claim — "All video engines are server-powered — no API key
    needed. Just click Generate." — directly contradicting the whole point of
    the engine_status gate (several engines very much do need a funded key).
    Replaced with an accurate line now that the list is filtered to
    configured-only engines.
  - **Also fixed**: `needsPhoto` was a hardcoded `engine==="runway"||"heygen"||"did"`
    check that treated D-ID as strictly required, when its backend already has
    a fallback default photo (`api/proxy-video.js` hedra/did branches) — added
    a `photoRequired` flag so only Runway/HeyGen (which actually throw without
    one) show the red "required" state; Hedra/D-ID now correctly show as
    optional. Default `VG_STATE.engine` and Avatar's `selectedMethod` no
    longer hardcode a specific engine that might not be funded — both now
    default to the first engine `_availableVideoEngines()` actually returns.
  - **Placement/precedence reviewed, left as-is**: Social Media Manager's
    CREATE section already puts Video Studio + Edit Video first (highest
    effort/value content type), before Design Post/Story/Preview — a sound
    hierarchy; no reordering made.
  - Verified via a standalone Node test (same vm harness used throughout this
    session): 3 `_videoEnginesCache` scenarios (partial/Fal.ai-only, all
    funded, none funded) all filter correctly, Hedra is excluded/included
    exactly per its funded state, `_videoEngineInfo()` returns correct
    `photoRequired` flags for hedra vs runway, and the catalog has no
    duplicate keys and every key matches a real `engine_status` flag.
    `node -c js/chat.js`, the full valuation/asset regression harness (19
    cases, 0 errors), and a Playwright pass all came back clean.

- **2026-07-13 (session 11k)**: AI Agents prompt-strength upgrade (`js/chat.js`),
  user-requested follow-up to session 11j — done proactively, BEFORE the user's
  own live testing of the grounding fix, per an explicit ask: agents should not
  just be correct, they should make users feel a real AI agent is elevating
  their work so they come back and use it more.
  - **Discovered an unused rendering capability**: `formatAIResponse()`
    (`js/api.js`, pre-existing) already parses `"Label: Value"` lines (e.g.
    `"Fair Value: AED 2,650,000"`) into a highlighted "Key Metrics" card, and
    already color-highlights specific signal words (BUY, HOLD, AVOID,
    UNDERVALUED, OVERVALUED, FAIR VALUE, DISTRESS, GOOD PRICE, OVERPRICED) —
    but no agent's system prompt had ever been written to deliberately target
    either mechanism, so every agent reply rendered as plain paragraph text
    even though the app could visually elevate it.
  - **Fix**: added one shared `_agentClosingStyle(opts)` helper (placed just
    before `var AI_AGENTS=[`) appended to the end of each agent's system
    prompt, generating: (1) an "OUTPUT FORMAT" instruction telling the agent to
    format figures as `"Label: Value"` lines and use the exact signal words
    above (skippable via `opts.metricsCard:false` for agents whose output
    isn't metric-shaped), (2) an always-on "ENGAGEMENT" instruction — never end
    on a flat statement, always close with one concrete next step (a sharp
    question, a specific action like running the Analyzer/setting a price
    alert/talking to a verified agent, or an offer to go deeper), and (3) an
    optional "WHEN VERIFIED DATA IS MISSING" instruction (`opts.precisionAsk`)
    that turns the session-11j honesty disclosure into a re-engagement hook:
    give a clearly-labeled general estimate now, then ask for the ONE specific
    detail that would unlock a real DLD-calibrated number.
  - **Applied per-agent** with judgment on the right `precisionAsk`, not a
    blanket copy-paste: general (building name/area), valuation (building name
    + size + price), negotiation (building name + asking price), investor
    (budget + primary goal), leadcapture (budget + buy purpose). Marketing got
    `metricsCard:false` (its output is ad copy, not a data card) plus, newly,
    `getBrandPrompt()` wired in for the first time (previously only "outreach"
    used the agent's saved brand profile — marketing had the same access to
    branding data but was never using it). Legal got the plain `{}` variant
    (no precisionAsk — legal/RERA facts are evergreen, not something more user
    input would sharpen).
  - **Outreach (Social Media Manager) deliberately excluded from the ENGAGEMENT
    instruction**: this agent has a strict, parser-critical contract —
    `extractPostJSON()` requires the reply to end in a specific JSON block —
    and "always end with a question" would directly conflict with "always end
    with this exact JSON." Instead added a narrower, compatible instruction: a
    "CAPTION QUALITY BAR" telling the agent the caption TEXT INSIDE the JSON
    (not the chat reply itself) must end on a specific action-driving CTA
    (question / urgency line / direct instruction like "DM 'YIELD' for the
    full breakdown") rather than a flat factual close — same underlying goal
    (never let output go flat) achieved without touching the fragile JSON
    contract.
  - Verified via a standalone Node test (same vm.createContext harness used
    throughout this session) that builds all 8 agents' full system prompts:
    confirmed no double-newline artifacts, no malformed concatenation, every
    agent except outreach contains the ENGAGEMENT block, and outreach's tail
    correctly shows the new caption-quality instruction instead. Also
    reconfirmed `extractPostJSON()` itself was untouched. `node -c js/chat.js`,
    the full valuation/asset regression harness (19 cases, 0 errors), and a
    Playwright pass against the rebuilt app all came back clean (zero
    non-network console errors).

- **2026-07-13 (session 11j)**: AI Agents (Network → AI Agents, `js/chat.js`)
  audit — same input-to-output rigor as the Reports/Portfolio/Quick Check
  passes above, user-requested.
  - **Real bug found**: 4 of the 8 agents ("general", "valuation",
    "negotiation", "marketing") explicitly promise precise, database-backed
    numbers in their system prompts (an 8-step valuation methodology, "ALWAYS
    include specific numbers from our database"), but were never actually
    given any building-level data to work from — only a thin AREA-level
    summary table (or, for "marketing", nothing at all). A user asking the
    Valuation Agent's own suggested example, "Analyze Marina Gate 1, 2BR,
    1400 sqft, asking AED 2.8M," got an LLM inventing plausible-sounding PSF
    and a verdict while the system prompt made it sound like a rigorous
    calculation against the real 9,227-building database — confidently
    wrong, not just uncertain, and a real trust risk if an agent relayed
    that "verdict" to a client.
  - **Fix**: added `_agentVerifiedContext()` — extracts a building/area match
    from the user's own message via the same `lookupBuilding()`/
    `computeValuation()` the rest of the app uses, and injects the REAL
    result as a "VERIFIED DATA" block appended to the system prompt for that
    turn, for these 4 agents only (`sendChat()`). Each of the 4 prompts was
    also rewritten to explicitly check for that block and, when it's absent,
    say so plainly instead of presenting a guess as a database figure.
  - **A second, more dangerous bug found while building this**: a naive
    version that fuzzy-matched the user's full raw message against the
    building DB directly was actively unsafe — tested with "Is Emaar
    Beachfront worth AED 3,200 PSF?" and it matched a real DB entry in a
    completely unrelated area ("Rega Al Buteen") purely from substring
    overlap in `lookupBuilding()`'s fuzzy logic. That's worse than no match
    at all: confidently wrong data labeled "verified." Fixed by requiring
    the matched building's own area to agree with whatever area (if any) was
    independently detected via `_detectAreasInText()` (already used for RAG
    grounding) — the Emaar Beachfront case is now correctly rejected and
    falls back to the (correct) area-level benchmark instead.
  - **Investment Advisor** ("investor" agent) told the LLM to "ALWAYS
    provide... specific buildings" but only ever had area-level data —
    same class of overclaim, fixed by rewording it to recommend areas/grade
    tiers and point the user to the real Analyzer for a building-specific
    figure, rather than asking the LLM to name a building it has no data on.
  - Reviewed "legal" (static RERA/DLD/fee facts — correctly has no market
    data injected, no issue), "leadcapture" and "outreach" (both already had
    reasonable area-level grounding for their area/budget-level missions) —
    no changes needed there. Also confirmed each of the 8 agents keeps a
    fully separate message history (`getAgentMsgs()`), so there's no
    context bleed between agents.
  - Verified the new extraction+matching logic against the agents' own
    suggested example questions in a standalone Node test: real building
    matches surfaced correctly for named buildings, the dangerous
    cross-area false match was correctly rejected, a full valuation
    computed correctly when size+price were both present, and generic
    questions correctly returned no verified block (forcing the new
    honesty instruction to apply). `node -c` + the full valuation/asset
    regression harness (19 cases) + a Playwright pass all came back clean.

- **2026-07-12 (session 11i)**: Cleaned up the remaining hardcoded
  "June 2026"/"July 2026" instances flagged (but not fixed) at the end of the
  Portfolio/Quick Check audit above.
  - Added one shared `_currentMonthYear()` in `js/core.js` (loads before every
    other module) and removed the duplicate copy that had been added directly
    to `js/portfolio.js` in the previous pass — now a single source of truth.
  - Fixed live-claim call sites: `getDubaiRealEstateBrain()`'s "Date:"/
    "DUBAI MARKET KNOWLEDGE"/"Interest rates" labels and the AI Agents chat
    welcome message (`js/core.js`), the AI Live Search Groq fallback prompt +
    summary text (`js/app.js`), the Area Comparison AI system prompt
    (`js/marketindex.js`), the Market Cycle widget's commentary line
    (`js/market.js`), and the Mortgage Calculator's rate-freshness labels
    (`js/mortgage.js`, both the header badge and the disclaimer line).
  - Dropped the date entirely from two branding taglines that didn't need one
    at all: the `footer_tag` translation string (EN + AR, `js/core.js`) and
    the About page's "Built in Dubai · DubAIVal" footer (`js/about.js`).
  - **Deliberately left alone**: `fetchLiveMarket()`'s embedded Jan-June 2026
    timeline (`js/core.js`) and the Market Cycle widget's "2020: COVID Dip"
    style rows (`js/market.js`) — these describe fixed HISTORICAL events as
    ground-truth context for the AI/as a historical chart, not "today's
    date," so making them dynamic would be wrong, not a fix. Same reasoning
    for one testimonial's fixed posting date in `js/portfolio.js`
    ("Family Buyer · Relocated from London · June 2026").
  - Verified: `node -c` on all 7 touched files, full valuation/asset
    regression harness (19 cases, 0 errors), and a headless-Chromium
    Playwright pass against the rebuilt app (zero non-network console
    errors).

- **2026-07-12 (session 11h)**: Portfolio + Quick Check audit (user-requested,
  same rigor as the Report Builder review above).
  - **Quick Check — real bug found and fixed**: the optional "deal check" on
    the sale side (`_renderQuickCheckWidget` in `js/market.js`) reverse-derived
    a fake unit size from the entered price (`estSize = price / areaPSF`) and
    fed it into the full per-unit `computeValuation()`. That forces
    `askPSF = price/estSize` back to `areaPSF` by construction — verified with
    a standalone test across a 4x price range (AED 1.5M-6M) for the same area,
    which returned the exact same verdict ("FAIR", -5.1%) regardless of price.
    The deal-check verdict was checking almost nothing about what the user
    actually typed in. Fixed with a new `_qcSaleVerdict()` that compares the
    entered price directly against the tier range `computeAreaPriceRange()`
    already computes and displays (grade-sensitive, varies with area/beds) —
    verified the fix now produces a real GOOD→FAIR→OVER progression as price
    increases. The rent-side deal check was checked too and found NOT to have
    this bug (its verdict is driven by beds→benchmark rent, not by the
    synthetic size), so it was left unchanged.
  - **Portfolio — found and fixed 3 hardcoded stale dates in AI prompts**
    (`js/portfolio.js`, Compare/Area Comparison, Personal Advisor, and
    Portfolio AI Analysis): each said "June 2026" or "July 2026" literally,
    accurate only in the month they were written and wrong every month after
    — the same bug class already fixed once for `fetchMarketIntelligence()`
    in `js/core.js` (2026-07-11), just never caught in these 3 other call
    sites. Added `_currentMonthYear()` and wired all 3 in. Also removed a
    hardcoded "Post-geo correction, supply pressure H2 2026" market-narrative
    sentence from the Portfolio AI Analysis prompt — same stale-narrative
    anti-pattern already fixed elsewhere, and redundant since this call site
    already receives live RAG grounding.
  - **Portfolio — no other issues found**: `computeAssetMetrics()` and
    `computePortfolioHealth()` were already fixed for correctness in earlier
    sessions (shares the Analyzer's exact hedonic stack; composite health
    score has real, non-circular weighting) and the What-If Swap Simulator
    computes real cash-flow/growth deltas from live area data — no
    placeholder content or broken math found in either.
  - **Flagged, not fixed (out of scope for this request)**: the same
    hardcoded-date pattern also exists in `js/chat.js` (via
    `getDubaiRealEstateBrain()`/`getChatSys()` — AI Agents chat),
    `js/about.js`, `js/app.js` (AI Live Search fallback), `js/market.js`
    (Market Cycle widget), `js/marketindex.js` (Area Comparison), and
    `js/mortgage.js` (rate labels). None of these are in Portfolio or Quick
    Check, so left untouched this session — worth a dedicated pass later.

- **2026-07-12 (session 11g)**: Custom Report Builder (`js/workspace.js`,
  Reports tab) — upgraded from a mostly-placeholder feature to a real,
  client-ready deal-closing tool, per the user's original intent ("agents
  should be able to pull a professional report with one simple command").
  - **Audit finding**: 4 of the 9 report sections (Opportunity Alerts,
    Investment Scenarios, Mortgage Analysis, Sustainability Score) rendered
    nothing but `"Section data available in the live app at dubaival.com"` —
    an agent who checked one of these boxes and sent the PDF to a client got
    a sentence telling the client to go look elsewhere, worse than not
    offering the section at all. "Market Comparison" and "Neighborhood
    Comparison" were two different checkboxes producing the exact same
    link-out placeholder. "Area Statistics" showed the first 30 areas in
    raw object-key insertion order — unrelated to whatever property the
    report was actually about. "Portfolio Overview"/"Opportunity Alerts"
    only ever pulled the AGENT's own personal `PORTFOLIO_STATE`, which has
    no place in a report meant to be handed to a client about a specific
    deal (and silently broke for the many agents with no personal portfolio
    tracked at all). There was also no way to bind a report to a specific
    property, client, or the agent's own name/company/phone/RERA — every
    report was generic and DubAIVal-branded rather than looking like
    something the agent prepared themselves.
  - **Fix**: trimmed to 6 sections, every one now backed by real computed
    data: Property Valuation Summary (unchanged, uses the loaded Analyzer
    result), Area Statistics (now leads with the bound Report Subject area
    plus its 5 closest comparables by PSF instead of an arbitrary slice),
    Area & Neighborhood Comparison (merged the two duplicate placeholders
    into one real side-by-side table), Investment Scenario (real 1/3/5yr
    projected value using the area's own `AREAS[].g` growth data), Mortgage
    Estimate (real EMI calc using the same rate/LTV/fee constants as
    `js/mortgage.js`), Sustainability Score (wired to the existing
    `computeSustainabilityScore()` in `js/core.js`, previously never called
    from here). Removed Portfolio Overview/Opportunity Alerts entirely.
  - Added a "Report Subject" block (area picker, client name, property price)
    so every data-driven section binds to an actual deal instead of showing
    generic market-wide data, plus a persisted "Your Details" block (agent
    name/phone/company/RERA, saved to `dv_agent_profile` in localStorage)
    so the report header reads as prepared BY the agent — DubAIVal is now a
    small footer credit only, not the dominant brand. Sections needing data
    that isn't available yet (no area selected, no price entered, no
    valuation loaded) show a specific, actionable prompt instead of either a
    placeholder sentence or wrong data.
  - Verified the computational logic (mortgage EMI math, 1/3/5yr investment
    projection, comparable-area selection) via a standalone Node test
    against the real `AREAS` data — confirmed correct numbers for a sample
    Dubai Marina / AED 2.5M scenario before shipping.

- **2026-07-12 (session 11e)**: AI Video Studio graceful degradation. Until at
  least one of the 8 paid video engines (Kling/Luma/HeyGen/Hedra/Runway/
  Minimax/Pika/D-ID) has a funded API key in Vercel, opening Video Studio or
  Avatar Video Gen and clicking Generate showed a raw, developer-facing error
  ("KLING_API_KEY not configured in Vercel env vars") — a bad first impression
  for early beta users the site owner is bringing on personally (see launch
  strategy discussion). Added `api/proxy-video.js`'s `engine_status` action
  (booleans only, no secrets) and wired `showVideoGenUI()`/
  `showAvatarVideoGen()` in `js/chat.js` to check it once before opening —
  if no engine is configured, shows a clean "Launching Soon" message instead
  of the full Studio UI. Both AI Video menu entries route through one of
  these two functions, so every entry point is covered without touching the
  engine-selection/generation logic itself. Cheapest path forward for the
  actual API cost (raised by the site owner, deferred): route the remaining
  direct-key engines (Kling/Luma/Runway) through the same Fal.ai pay-per-use
  gateway already used for Pika/HeyGen/Minimax instead of buying separate
  monthly API keys, or fund this from the first wave of Pro subscription
  revenue rather than before it.

- **2026-07-12 (session 11f)**: Interactive Map — fixed permanently-overlapping
  area circles (real bug, user-reported: many areas were unclickable at every
  zoom level, not just low zoom).
  - **Root cause**: `js/map.js` drew one `google.maps.Circle` per area with a
    radius in real-world METERS (250-750m based on `txVol`). Two such circles
    that overlap in real-world space overlap by the exact same proportion at
    EVERY zoom level — the gap between their centers and each radius both
    scale by the identical pixels-per-meter factor as you zoom, so zooming in
    never separates them (unlike fixed-pixel-size markers, which do). With
    ~250 area centroids in `AREA_COORDS`, many of them adjacent sub-communities
    only a few hundred meters apart (Al Barsha First/Second/Third, Warsan
    First-Fourth, the Al Quoz/Jebel Ali industrial splits, etc. — several
    literally share near-identical coordinates), this made large parts of the
    map permanently unclickable at any zoom.
  - **Fix**: circles are now a purely decorative background heat-visualization
    layer (`clickable:false`, lower opacity) — they still convey the metric's
    geographic pattern, but are no longer the interactive hit target. Added a
    proper marker/clustering layer on top: `_dvRenderAreaClusters()` groups
    areas within 46 screen PIXELS of each other (recomputed via
    `gmap.getProjection()` on every `zoom_changed`/`idle` event) into either a
    single clickable pin (unique area) or a numbered gold cluster bubble
    (multiple areas) that zooms in (`fitBounds`) when clicked — same
    marker-clustering technique every map product with dense point data uses
    (Bayut, Property Finder, Zillow, Google Maps' own places clusters).
    Verified the clustering math against real coordinates from
    `js/data-residential.js` in a standalone Node test (simulated Web Mercator
    projection, since this sandboxed session can't reach Google's live Maps
    API): at the default zoom (11) all 8 Al Barsha sub-areas correctly merge
    into one cluster bubble; by zoom 16 they're fully separated into 9
    independently clickable pins. `_dvMapState` gained a separate
    `clusterMarkers` array with its own lightweight teardown
    (`_dvClearClusterMarkers()`) so re-clustering on every zoom/pan tick
    doesn't touch the circles or rebuild the whole map (would defeat the
    session-10 leak fix). Not verified against the live Google Maps API in
    this session (no network access to Google's servers in this sandboxed
    environment) — a future session or the user should confirm live.

- **2026-07-12 (session 11d)**: Launch-readiness item 8 — Deal Network (OFM) trust
  & safety.
  - **Real document verification, closing a false claim in production**: found that
    `ofm_listings.doc_verified` (added when OFM shipped) was never read or written
    anywhere in `js/deals.js` — no admin review workflow existed — while the listing
    submission UI told every seller "Admin-verified badge confirms authenticity."
    Sellers upload Title Deed + Emirates ID and are told they'll get a verified
    badge; nobody ever actually checked the documents or showed a badge based on
    real review. Fixed with `supabase-ofm-trust-safety.sql` (new migration, requires
    manual execution): `admin_pending_doc_listings()`/`admin_review_listing_doc()`
    RPCs (reusing the existing `_admin_password_ok()` pattern from
    `supabase-admin-security-fix.sql` — no new auth mechanism), a new "Pending
    Document Verification" queue in the Admin Dashboard (view uploaded docs,
    Verify/Reject), a real `doc_verified` badge on the lister's own listing cards
    (`_ofmMyListings`), and `doc_verified` exposed on the public `ofm_listings_scan`
    view so buyers get a real signal. Rejecting a listing deactivates it and records
    why (`rejection_reason`). Softened the submission-flow copy to describe what
    actually happens (matching starts immediately; the badge appears once reviewed,
    usually within 24h) instead of the false blanket claim.
  - **No abuse/scam reporting existed at all**: the anonymous chat/match pipeline
    (9 stages, `_ofmMatchView`) had no safety net beyond two parties silently
    abandoning a conversation. Added a "⚑ Report this match" button (visible from
    `chat_active` onward) with reason picker (scam/fake listing, payment-before-
    viewing request, ghosting, abuse, other), backed by a new `ofm_reports` table
    (anon INSERT gated by an ownership check against `ofm_matches` — same pattern
    as `ofm_messages` — so only the two real parties on a match can file a report
    against it) and an Admin Dashboard "Abuse / Scam Reports" queue (dismiss, or
    deactivate the reported listing in one click via `admin_resolve_report()`).
  - Deliberately did NOT gate matching itself on `doc_verified` (i.e. unverified
    listings still get matched to buyers immediately) — with no dedicated review
    team yet, blocking the core matching loop on manual admin review would likely
    stall the product entirely; the badge is an added trust signal, not a gate.
  - **Manual step required**: run `supabase-ofm-trust-safety.sql` in Supabase SQL
    Editor (requires `supabase-admin-security-fix.sql` and
    `supabase-ofm-rls-lockdown.sql` to already be applied, which they are).

- **2026-07-12 (session 11c)**: Launch-readiness items 6-7 — script `defer`
  performance fix + programmatic SEO pages.
  - **Faster first load**: added `defer` to all 21 `js/*.js` module `<script>`
    tags in `index.html` (they sat right after `<body>` and were blocking HTML
    parsing on ~2.1MB of data+app JS). Wrapped the trailing bootstrap's
    `try{render()}` in `DOMContentLoaded` since deferred scripts only run after
    parsing finishes. Found and fixed 2 unrelated, pre-existing bugs in
    `scripts/build-www.js` (the Capacitor/Android build script) while testing
    this against that pipeline: (1) its script-replacement regex matched from
    the first bare `<script>` tag in the whole document through to the last
    `</script>\n</body>`, silently deleting `<div id="app">` and all module
    `<script>` tags from every Android build; (2) its `window.open()` override
    had a URL-matching regex written inside a JS template literal as `\/\/ `,
    which isn't a recognized escape there and silently drops the backslashes —
    corrupting the regex into one followed by an unescaped `//` that JS reads
    as a line comment, crashing the entire bootstrap script with a syntax
    error on every native app load. Both bugs meant the Android app has likely
    never rendered correctly; neither was previously catchable since building
    the APK needs an Android SDK unavailable in any session so far. Also found
    `dvTrack()` (new this session, added for analytics) was silently shadowing
    `index.html`'s original GA-based `dvTrack` (same name, loads later) —
    fixed so it now calls both `gtag()` and the Supabase insert instead of
    replacing GA tracking. Verified via headless-Chromium Playwright against
    both the root `index.html` and the regenerated `www/` build: full render,
    working nav, zero non-network console errors.
  - **Programmatic SEO**: `tools/generate-seo-pages.js` — a static generator
    (no build step at deploy time, so its output is committed like any other
    file) that reads the existing public `AREAS`/`DB` data and produces
    `/areas/<slug>` (347 pages) and `/buildings/<slug>` (9,227 pages), plus an
    `/areas` A-Z hub, `/sitemap.xml` (9,576 URLs) and `/robots.txt`. Each page
    is real static HTML (title, meta description, canonical, OG/Twitter tags,
    schema.org JSON-LD) with a CTA back into the SPA's Analyzer — meant to
    give the site an organic-search footprint it has zero of today, since the
    live app is a pure hash-routed SPA with no server-rendered content. Uses
    one shared `/seo.css` instead of inline `<style>` per page to avoid
    duplicating CSS across ~9,600 files. `vercel.json`'s SPA fallback rewrite
    now excludes `areas`/`buildings`/`sitemap.xml`/`robots.txt`/`seo.css` so
    they're served as real static files. **Re-run
    `node tools/generate-seo-pages.js` and commit the output whenever
    `js/data-residential.js` changes meaningfully** (new buildings/areas,
    updated benchmarks) — it wipes and regenerates `areas/`/`buildings/` from
    scratch each run so stale/renamed entries don't leave orphan pages behind.

- **2026-07-12 (session 11b)**: RAG follow-through — wired grounding into the 11
  remaining `askAI()` call sites, corrected stale building-count stats app-wide,
  and built a forecast-accuracy feedback loop.
  - **Remaining grounding**: Video Studio auto-prompt + AI Prompt Writer (property/
    free-text context + area), Social Media Manager content generation, video script
    writer, Content Pillar Planner, 30-day Bulk Generator, AI Chief of Staff's WhatsApp
    drafter (grounded on the listing's area), and `runMarketIntelligence()` (grounded
    across its 20 tracked areas — feeds `market_momentum`, shown to every user, so
    freshness matters most here). Deliberately left ungrounded: the cinematic-video-
    prompt writer (no area/property context, pure style task) and the two NL
    field-extraction parsers (Analyzer AI Smart Search, reusable Smart Bar) — both
    are structured extraction, not knowledge questions, on a latency-sensitive
    as-you-type path.
  - **Stale stats**: "8,522 buildings" / "10,800+ properties" / a "348 areas" typo
    were hardcoded across AI system prompts, onboarding tour text, Market Index stat
    cards, and meta tags — all predating the DB merge to 9,227. Updated everywhere to
    9,227 residential + 1,914 commercial (also corrected from a stale 1,930) + 428
    land = 11,500+, 347 areas.
  - **Forecast-accuracy feedback loop** (`supabase-forecast-accuracy-schema.sql`, new
    migration — requires manual execution): since fine-tuning Llama-on-Groq isn't
    practical, this is the "gets smarter over time" mechanism instead.
    `runMarketIntelligence()` (`js/core.js`) has the LLM *estimate* each area's
    trailing 6-month price change from training knowledge alone, stored in
    `market_momentum`, with nothing ever checking it against reality. Added
    `api/refresh-market-data.js?action=forecast-audit` (new weekly cron, Sundays
    06:30 UTC — kept off the already-tight daily-refresh budget rather than adding a
    13th Vercel function) that compares each area's stored estimate against the
    REALIZED 6-month change computed from real `price_history` data, and writes the
    discrepancy into `knowledge_base` as a new `forecast_accuracy` fact (retrieved
    through the same recency-ranked, area-filtered `match_knowledge()` RPC as
    everything else). Degrades gracefully — areas without ~180 days of price_history
    yet are skipped and simply get audited automatically once enough time passes.

- **2026-07-12 (session 11)**: RAG knowledge-base architecture audit + hardening, plus
  merging the research branch's building data (see "TWO-BRANCH WORKFLOW" above).
  - **Provider-gating bug (real, silent)**: `api/knowledge-query.js`, `api/proxy-news.js`,
    `api/refresh-market-data.js`, `api/chiefs-embed.js` all gated embedding calls on
    `process.env.GEMINI_API_KEY` specifically, even though `api/_lib/embeddings.js` had
    since been upgraded to try Jina first (documented as "recommended for production"
    since Gemini OAuth-style keys expire in ~1h). A Jina-only setup would have silently
    disabled the entire RAG pipeline — ingestion and query both. Added
    `embeddings.hasProvider()` and switched all 4 call sites to use it.
  - **No recency weighting** (`supabase-knowledge-base-recency-fix.sql`, new migration —
    requires manual execution): `match_knowledge()` ranked purely by cosine similarity,
    so a months-old snapshot could outrank today's data on pure semantic closeness.
    Rewrote the ORDER BY to blend similarity (85%) with a recency score that linearly
    decays to 0 over 180 days (15%) — same signature/output columns, no caller changes.
  - **No area filtering used anywhere**: the `filter_area` RPC param existed but no
    caller ever passed it — all 5 grounded `askAI()` call sites relied purely on
    semantic luck across free-text queries. Extended `fetchKnowledgeContext()`
    (`js/api.js`) to accept a single area or an array of areas (fetched in parallel,
    deduped), and `askAI()` gained a 4th `groundAreas` param. Wired real area lists
    through the 3 structured call sites (`js/marketindex.js` Area Comparison,
    `js/portfolio.js` Compare + Portfolio AI Analysis), and added
    `_detectAreasInText()` — a substring scan against the 347 `AREAS` keys — as an
    automatic fallback for the one free-text call site (Chat Agents), with "Dubai"
    itself excluded from the scan since it's a real catch-all AREAS key that would
    otherwise false-positive-match nearly every query.
  - **Unbounded snapshot growth**: `refresh-market-data.js` writes one new
    `market_snapshot` row per area per day forever (the date is baked into the row's
    unique key, so nothing was ever overwritten — a stale claim in this file said
    otherwise, now corrected). Added `pruneOldMarketSnapshots()`, called at the end
    of the same daily cron, deleting snapshot rows older than 90 days.
  - All changes verified via real-browser Playwright tests (mocked fetch, checked
    request payloads/dedup/fallback logic) plus Node-level tests before committing —
    zero console errors, existing grounded features unaffected.

- **2026-07-11 (session 10)**: Code-quality/security pass — 4-agent audit (core/app/auth,
  valuation/market/api, portfolio/deals/social/chiefs, backend api/) then 14 approved
  fixes, each its own commit on branch `claude/dubaival-code-quality-k29ojs`:
  - Commercial valuation gross yield formula (`js/valuation.js`) always collapsed to
    the 4% floor for every realistic PSF — now area/subtype-sensitive (5.5–9%).
  - `api/proxy-video.js` had no auth/rate-limit despite fanning out to paid video-gen
    APIs — added rate limiting + origin lockdown.
  - Admin auth bypass: the 3 `admin_*` RPCs and the Market Risk Controls panel both
    checked a SHA-256 hash that was also shipped in client JS (i.e. public) — RPCs
    now hash a caller-supplied plaintext password server-side via pgcrypto
    (`supabase-admin-security-fix.sql`, new `admin_verify()`/`admin_update_market_config()`).
  - Deal Network admin dashboard had zero real auth gate (leftover dead-code check)
    and its 4 data functions still did raw REST calls that RLS silently no-ops since
    the earlier hardening migration — added a real login gate + rewired to the RPCs.
  - OFM (Off-Market Exchange) RLS lockdown (`supabase-ofm-rls-lockdown.sql`): every
    `ofm_*` table allowed unrestricted anon SELECT/UPDATE/DELETE despite the feature's
    "hidden, never publicly browsable" design — reads/mutations now go through
    SECURITY DEFINER RPCs or narrow public views; chat/media inserts gained a
    WITH CHECK verifying sender identity. Also fixed a pre-existing, unrelated bug
    found along the way: neither `ofm_listings` nor `ofm_requests` actually had the
    `purpose` column the client always sent, so listing/request submission had likely
    been failing outright — added via additive `ALTER TABLE`.
  - `auto-post.js`/`price-alerts.js`/`refresh-market-data.js` cron timeouts: added
    missing `maxDuration` entries, time-budget bail-outs, stuck-post recovery, and
    batched `refresh-market-data.js`'s area loop 5-at-a-time (~5x faster).
  - Map tab (`js/map.js`) leaked a full Google Maps instance + up to 347 overlays on
    every re-render (including plain metric toggles) — added teardown before rebuild.
  - PropertyFinder listings were always area-wide (building name never passed to
    `fetchPFSales`) and failed silently — fixed the pass-through, added diagnostics,
    broadened response-shape parsing per this data source's public API docs.
  - Demo Mode (`js/auth.js`) silently and permanently overwrote a guest's real
    portfolio with no warning/backup — added a confirm + backup/restore.
  - `fetchMarketIntelligence()` (`js/core.js`) hardcoded "June 14, 2026" + a frozen
    "VERIFIED DLD DATA" narrative into every AI market-intelligence call — now
    computes the date dynamically like its sibling `fetchLiveMarket()`.
  - `proxy-maps.js`'s origin check used `startsWith()` (bypassable via
    `dubaival.com.attacker.com`) — now parses Origin/Referer as a URL and compares
    exact scheme+host; added a dedicated stricter rate-limit bucket for this action.
  - `proxy-video.js`'s direct HeyGen branch never validated the generate response —
    client polled forever on any HeyGen error. Now checked like sibling engines.
  - Mortgage calculator gave UAE nationals a flat 80% LTV cap at every price tier —
    added the missing >AED 5M tier (70%), matching the expat path's existing pattern.
  - Android/Capacitor: `window.open()` (used for WhatsApp/Telegram/mailto/external
    links in ~20 places) silently did nothing inside the native WebView — wired the
    already-installed `@capacitor/browser` plugin in `scripts/build-www.js`'s native
    bootstrap. Also found `android/app/dubaival.keystore` + its plaintext password
    committed directly in `build.gradle` — rotated to a new keystore, moved
    credentials to a gitignored `keystore.properties` (see `keystore.properties.example`
    for the local setup format); old keystore removed from the working tree (still in
    prior commit history — history itself was not rewritten).
  - **Manual steps completed by user**: both new SQL migrations
    (`supabase-admin-security-fix.sql`, `supabase-ofm-rls-lockdown.sql`) executed in
    Supabase SQL Editor.

- **2026-07-02 (session 9)**: AI Chief of Staff — fully isolated agent workspace module.
  - `js/chiefs.js` — New standalone module (~900 lines). 5 views: Dashboard, Inventory,
    Clients, Matches, Pipeline. Zero dependency on any other module except shared globals.
  - `supabase-chiefs-schema.sql` — 4 Supabase tables: `chiefs_inventory` (pocket listings),
    `chiefs_clients` (client requirements), `chiefs_matches` (auto-matched pairs),
    `chiefs_pipeline` (deal stages). All with RLS enabled.
  - **Features**: Agent Inventory Bank (pocket listings with DubAIVal auto-valuation),
    Client Memory Bank (store unfulfilled client requirements), WhatsApp Conversation
    Scanner (AI extracts client requirements from pasted chat), Auto-Matching Engine
    (pure JS scoring: area match, beds, budget, type), AI Message Drafter (Groq LLM
    drafts personalized WhatsApp messages per match), Human-in-the-loop approval
    (copy to clipboard or open WhatsApp directly), Deal Pipeline (8 stages: Lead→Closing),
    Dashboard with stats + quick actions + upcoming pipeline actions.
  - **Navigation**: Added `{id:"Chiefs",label:"AI Chief of Staff"}` sub-tab to Network section.
  - **Isolation**: `CHIEFS_STATE` object, `_chiefsId()` for agent ID, `_chiefsH()` for
    Supabase headers. No cross-dependencies. Safe against all future changes.
  - **Manual setup required**: Run `supabase-chiefs-schema.sql` in Supabase SQL Editor.

- **2026-06-30 (session 8)**: World-class RAG knowledge-base system ("AI brain").
  - `supabase-knowledge-base-schema.sql` — pgvector `knowledge_base` table, 768-dim
    Gemini embeddings, HNSW cosine-similarity index, `match_knowledge()` Postgres RPC.
  - `api/lib/embeddings.js` — Gemini `text-embedding-004` batch-embedding helper.
  - `api/knowledge-query.js` — Public semantic-search endpoint (POST /api/knowledge-query).
  - `api/proxy-news.js` — Ingests newly-seen news articles as embeddings after every
    fresh RSS fetch (non-blocking, fire-and-continue, never delays news response).
  - `api/refresh-market-data.js` — Synthesizes per-area market facts and batch-embeds
    them daily via the existing 06:00 UTC cron. New `maxDuration: 60` in vercel.json.
  - `js/api.js` — `askAI()` extended with optional `groundQuery` 3rd param (100%
    backward-compatible). New `fetchKnowledgeContext()` helper retrieves RAG context.
  - Grounding activated on 5 AI features: Chat Agents, Area Comparison, Compare,
    Personal Advisor, Portfolio AI Analysis. 11 other call sites unchanged.
  - Also: live Dubai real estate News tab from session 7 (commit 9a9a40d).
  - **Manual setup required**: (1) Run `supabase-knowledge-base-schema.sql`, (2) Add
    `GEMINI_API_KEY` to Vercel env vars. Feature is inert until both are done.
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

- **🟡 Rental velocity ("Fastest to Rent") — needs manual SQL + a few weeks of
  accumulation** (added 2026-07-13, session 11n): run
  `supabase-rental-liquidity-schema.sql` in Supabase SQL Editor (adds
  `rental_listings_seen` table + `rent_active_count`/`rent_avg_days_listed`/
  `rent_velocity_sample_size`/`rent_velocity_updated_at` columns on
  `area_benchmarks`). No new env vars needed — reuses the existing
  `RAPIDAPI_KEY` the daily cron already has. After the SQL runs, `rent_active_count`
  appears same-day, but `rent_avg_days_listed` (the actual "how fast does this
  area rent" number, and the one the "Fastest to Rent" sort/pill in Smart
  Discovery depends on) needs ~2-3 weeks of daily-cron accumulation before
  enough tracked listings have gone stale for the weekly `?action=rental-velocity`
  job (Sundays 07:45 UTC) to average — exactly the same wait
  `growth_1yr_realized` needed. Everything degrades gracefully in the
  meantime (no value shown, not a fabricated one).

- **✅ COMPLETED: RAG Knowledge Base** (confirmed by user, 2026-07-11): both manual
  setup steps done — `supabase-knowledge-base-schema.sql` executed in Supabase, and
  `GEMINI_API_KEY` set both in Vercel env vars and client-side (Network → AI Agents →
  Setup). RAG grounding is now live: news articles auto-embed every ~2.5min (on
  proxy-news cache-miss), area market snapshots embed daily at 06:00 UTC, and all 5
  grounded AI features (Chat Agents, Area Comparison, Compare, Personal Advisor,
  Portfolio Analysis) retrieve relevant context before answering.

- **🟡 Analyzer floor/view premium precision — DEFERRED, needs new data**
  (2026-07-12): Controlled validation (Marina Diamond-2, Bahar 1/JBR) found the
  engine's combined floor+view hedonic spread (~44-45%) may understate real
  within-building dispersion (~60-62% after correcting for listing-price
  inflation bias — raw listing data suggested an even bigger ~81-119% gap,
  but that's inflated since sellers list premium/view units more
  aggressively above fair value than basic units, per user's domain
  insight). Not acted on: the ~60% figure is itself an estimate derived from
  aggregate web data, not exact per-unit transaction records, and the core
  hedonic formula (`VIEW_P`, floor premium, `hedonicCap` in
  `js/valuation.js`) has been tuned over ~20 iterations — too sensitive
  (affects every valuation site-wide) to adjust on approximate evidence.
  **Needs**: real per-unit DLD transaction data with floor + view + price
  (not just building-level aggregates) to precisely recalibrate — i.e., a
  fresh/re-run of the `tools/calibrate-db.js` pipeline with per-unit
  granularity retained through to this specific premium calc, once more
  DLD data is available.
- **🟡 Commercial (`VALUATION_DB_COM`) calibration coverage — 61% (1166/1914)**
  (2026-07-12): Unlike residential, `tools/build-valuation-db.js` only does
  **exact key matching** for commercial buildings (no fuzzy-matching layer
  like `findDLDMatch()` has for residential — see comment in the file, "no
  fuzzy-matching complexity needed here" was true structurally but leaves
  real coverage on the table). Two independent ways to improve, only one
  needs new data:
  1. **Doesn't need new data** — add a fuzzy-matching layer for commercial
     (same technique as residential: normalize name, try trailing-number
     variants, same-area substring match) against the *existing*
     `tools/calibration-output.json` already on hand. Straightforward,
     not yet done.
  2. **Needs new data** — land coverage is already 100% (253/253) from the
     same file, so commercial's gap is really about exact-name overlap
     between `js/data-commercial.js`'s DB_COM keys and however DLD names
     commercial units in the export — a fresher/differently-structured
     commercial extract could also close some of this gap on its own.
- **🟡 Email sending (Resend) — likely already fixed, needs live confirmation**
  (re-checked 2026-07-12): this entry's root cause (serverless functions
  404ing on Vercel) was attributed to exceeding the Hobby-plan 12-function
  limit — but the 2026-07-09 fix log below ("✅ Alerts — Email") already says
  this was resolved by consolidating 3 alert files into `api/price-alerts.js`
  and moving shared helpers into `api/_lib/` (excluded from the function
  count). Verified 2026-07-12: exactly 12 non-`_lib` files under `api/`
  today, matching the limit exactly — consistent with that fix holding.
  `api/_lib/shared.js`'s `sendEmail()` is fully implemented (Resend API,
  correct auth header, `ALERTS_FROM_EMAIL` fallback). **Not verified live**
  — needs `RESEND_API_KEY` confirmed set in Vercel env vars and one real
  subscribe → cron-trigger → inbox check. If still failing, check the
  Resend domain verification status for `dubaival.com` (was "Partially
  Verified" as of 2026-06-17) before re-diagnosing the function-count theory.
- **🟡 Live Market Finder — likely already fixed, needs live confirmation**
  (re-checked 2026-07-12): this entry described 3 issues below, but a code
  review found all 3 already addressed — likely in session 10 (2026-07-11,
  see task "Fix PropertyFinder listing parser" in the changelog above),
  after which this entry was never updated. Current code has: `fetchPFSales()`
  + `getPFLocationId()` in `js/api.js` fully implemented and wired into
  `fetchLiveData()`; photo extraction with multiple field-name fallbacks for
  both Bayut and PropertyFinder in both `js/api.js` and `js/app.js`'s
  `doSearch()`; `hitsPerPage` raised to 24-50 with real pagination
  (`loadMore`), no hardcoded 12-item cap found anywhere; `api/proxy-rapidapi.js`
  correctly routes `source=pf` to the PropertyFinder host. **Not yet verified
  live** — this session had no RapidAPI key and couldn't reach
  `dubaival.com` (sandboxed network policy blocks it), so this is a static
  code review finding, not an end-to-end test. If a future session (or the
  user, testing live) still sees any of the 3 issues below, re-open this
  with specifics (screenshot / exact symptom) rather than re-deriving from
  scratch:
  1. Only Bayut listings show — Property Finder listings missing.
  2. No listing photos.
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
- **Building research ACTIVE**: Current: 9,227 residential across 216+ areas
  (as of 2026-07-12 — was 9,123, +104 from a research session's Round 3 building
  batch + 30 missing villa sub-communities, merged into the code-quality branch
  via cherry-pick). 347 areas have benchmarks. Target areas listed in "Building
  research gaps" below. **IMPORTANT**: Buildings go in `js/data-residential.js`,
  NOT in `index-6.html`.

- **🔴 TWO-BRANCH WORKFLOW (established 2026-07-12)** — going forward, exactly
  two sessions carry the project forward in parallel, with a strict file-ownership
  split so they never conflict:

  | Branch | Owns | Touches |
  |---|---|---|
  | `claude/dubaival-code-quality-k29ojs` | Design/UX, bug fixes, code quality, all non-data work | Everything **except** `js/data-residential.js` / `js/data-commercial.js` |
  | `claude/dubaival-portfolio-manager-5bgbjk` ("research branch") | Building/area database growth | **ONLY** `js/data-residential.js` / `js/data-commercial.js` |

  **`claude/dubaival-code-quality-k29ojs` is now the integration/deploy branch**
  (see updated Deploy method below) — it accumulates both the design/quality work
  and the research branch's data commits.

  **Rules for the research branch** (give these to that session if it asks, or
  if you are that session):
  1. Sync first: `git fetch origin && git reset --hard origin/claude/dubaival-portfolio-manager-5bgbjk`.
  2. Edit **only** `js/data-residential.js` (and `js/data-commercial.js` for
     commercial/land) — no UI files, no `index.html`, no redesign work, no cache
     version bumps. A stray "Home tab redesign" / "Market Dashboard redesign" /
     "premium tab headers" set of commits landed on this branch on 2026-07-12
     before this rule existed and directly conflicts with design work already
     done on the code-quality branch — do not repeat that; if you are not doing
     pure data-file additions, you are on the wrong branch.
  3. Commit with the existing good pattern: clear message with area names,
     building counts before → after, and a total DB count. One commit per
     research batch is fine; no need to squash.
  4. Push directly: `git push origin claude/dubaival-portfolio-manager-5bgbjk`.
  5. Do **not** merge the code-quality branch into this one, and do not open
     a PR — the code-quality session pulls data commits from here on its own
     schedule (via `git cherry-pick`, since the two branches' histories diverge
     on non-data files and a full merge would drag in irrelevant unrelated
     commits, as happened 2026-07-12).

  **Rules for the code-quality branch** (this session):
  1. Never edit `js/data-residential.js` / `js/data-commercial.js` directly —
     unchanged from the pre-existing rule.
  2. Periodically (start of session, or when the user reports new research
     branch numbers): `git fetch origin`, then check
     `git log --oneline HEAD..origin/claude/dubaival-portfolio-manager-5bgbjk -- js/data-residential.js js/data-commercial.js`
     and `git cherry-pick` exactly those commits (only ones touching the two
     data files) onto this branch. Verify after: `node -c js/data-residential.js`
     and a quick `DB`/`BLDG_UNITS` key-count sanity check before pushing.

- **Agent video analysis & upload**: not built yet, deferred to future.
- **Deploy method**: User deploys from local folder `C:\Users\momen\dubaival\dubaival-deploy`
  using the Vercel CLI. The deploy folder is a git repo. After each Claude session,
  user runs these exact commands in that folder to deploy:

  ```
  git fetch origin
  git reset --hard origin/claude/dubaival-code-quality-k29ojs
  vercel --prod --archive=tgz
  ```

  **`--archive=tgz` is REQUIRED, not optional, since 2026-07-12** (the
  programmatic SEO pages added ~9,576 files): Vercel's per-deploy upload on
  the Hobby plan rejects deploys above ~5,000 individual file requests
  (`Error: Too many requests - try again in 24 hours (more than 5000, code:
  "api-upload-free")`). `--archive=tgz` bundles the whole deploy into one
  tarball upload instead of one request per file, avoiding that cap
  entirely. Always include this flag in the deploy command from now on —
  do not give the user the plain `vercel --prod` form.

  If a previous merge left conflicts (`unmerged files` error), run this first:
  ```
  git merge --abort
  ```

  **NEVER tell the user to `git merge origin/...` without `git reset --hard` first.**
  `git reset --hard` is the correct and safe method — it avoids merge conflicts entirely.

  **Always give the user BOTH commands at end of each task:**
  1. The git reset + vercel command block above (now targeting
     `claude/dubaival-code-quality-k29ojs`, not the old `dubaival-portfolio-manager-5bgbjk`
     — that branch is now research-only and is never deployed directly)
  2. Nothing else — no git checkout main, no git push origin main
- **🟡 Analyzer enhancements (deferred to after redesign)**:
  1. **Price History Chart** — 1-5 year price trend graph per area/building
     (need DLD transaction history data or Bayut historical).
     Benchmark: Zillow, Property Finder, Bayut.
  2. **Comparable Sales (Comps)** — Show 3-5 similar recently sold units
     nearby with price, size, date. Benchmark: Zillow, CoreLogic.
  3. **Walk Score / Accessibility Score** — Distance to metro, school, mall,
     hospital, beach. Benchmark: Zillow, Redfin.
  4. **Future Price Prediction** — 1-3 year forecast with confidence band
     chart. Already have growth data in AREAS[].g — need visualization.
     Benchmark: Zillow Zestimate forecast, PropTrack.
  5. **Neighborhood Heatmap** — Mini heatmap next to result showing
     surrounding area prices. Benchmark: Redfin, Domain.
  6. **Nearby Amenities Score** — Schools, hospitals, parks rating.
     Benchmark: Zillow, Redfin.

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

## 💡 Product Roadmap Ideas (deferred — discussed 2026-07-02)

### CRM Integration (B2B SaaS direction)
User wants to let **real estate companies** connect their CRM to DubaiVal,
turning the platform into a B2B tool that helps companies manage their agents
and clients with AI-powered market intelligence.

**Value proposition for companies:**
- AI valuation on every lead/deal (auto-enrichment)
- Market intelligence and news auto-fed into CRM
- Social media content generation for their agents
- Deal Network for agent-to-agent collaboration
- Portfolio tracking for their clients

**Technical requirements:**
- Multi-tenant architecture: Company account → Agent sub-accounts
- CRM OAuth connectors: HubSpot (start here), Zoho, Salesforce
- Data sync: valuations + leads → CRM deals/contacts
- Company Admin Panel: team management, API keys, usage reports
- Pricing tiers: Free / Pro / Enterprise

**Suggested starting point:** HubSpot connector first (most common, good API,
has free tier so companies can test easily).

**Status:** Deferred — to be revisited when core platform is stable.

### Auth & User Flow (implemented 2026-07-02)
- Social accounts moved to Profile panel (name, phone, WhatsApp + social credentials)
- Social Media Manager gated to logged-in users
- Profile completion prompt (phone + WhatsApp) required before using SMM
- Forgot Password flow added
- Browser autofill bug fixed (readonly trick on email/password inputs)
- Settings sub-tab removed from More menu

---

## 🔍 UX Flow Audit — بررسی فرایند تب‌ها (2026-07-05)

بررسی کامل از input تا output برای همه تب‌ها. هدف: آیا چیدمان هر تب با نتیجه‌ای که از آن انتظار داریم مطابقت دارد؟

**⚠️ یادداشت مهم (2026-07-12)**: یک بررسی مجدد سیستماتیک روی تمام موارد 🔴/⚠️ باقی‌مانده در این فایل نشون داد که چند مورد (Email/Resend، پارسر Property Finder، یادداشت RAG غیرفعال، یادداشت رمز Admin سمت کلاینت) در سشن‌های بعدی حل شده بودن ولی این بخش هیچ‌وقت به‌روزرسانی نشده بود — یعنی مستندات از کد واقعی عقب افتاده بود. جزئیات هر مورد در جای خودش تصحیح شد. **درس برای سشن‌های بعدی**: قبل از شروع کار روی هر آیتم قدیمی‌تر از این لیست، اول کد واقعی رو چک کن، نه فقط این یادداشت رو باور کن.

### نتایج کلی (به‌روز شده 2026-07-09)

| تب | وضعیت | اولویت |
|---|---|---|
| Home | ✅ Complete | Low |
| Market Dashboard | ✅ Complete | Low |
| Analyzer | ✅ Complete | — |
| QuickCheck | ✅ Complete | Low |
| TrackRecord | ✅ Complete | Low |
| Market Index | ⚠️ Partial | Low |
| Compare | ✅ Complete | — |
| Find | 🟡 Likely fixed, needs live confirm (see note below) | **High** |
| Map | ✅ Complete | Low |
| Advisor | ✅ Complete | Medium |
| News | ✅ Complete | Low |
| Portfolio — Assets | ✅ Complete | Medium |
| Portfolio — Health | ✅ Complete | Low |
| Portfolio — Projections | ✅ Complete | Low |
| Alerts | ✅ Complete | — |
| Deals | 🟡 No documented remaining issue since 2026-07-11 fixes (tasks #5, #16) — unverified live | Medium |
| AI Agents / Chat | ✅ Complete | Medium |
| Chiefs | ✅ Complete | — |
| Studio / Avatar | ✅ Complete | — |
| Video Platform | ✅ Complete | — |
| AI Assistant (SocialChat) | ✅ Complete | Low |
| Workspace | ✅ Complete | Low |
| Reports | ⚠️ Partial (only documented gap is LOW-severity: voice input on Firefox/mobile) | Medium |
| About | ✅ Complete | Low |

---

### 🔴 باقی‌مانده HIGH

**1. Find — PropertyFinder Parser شکسته**
- فقط Bayut listings نمایش می‌دهد (PropertyFinder parser `pfP()` با ساختار واقعی API تطابق ندارد)
- عکس‌های listing نمایش نمی‌یابند
- Smart Discovery سقف ۵۰ نتیجه دارد بدون pagination
- **فایل**: `js/api.js` → `fetchLiveData()`, `js/market.js` → rendering

---

### ✅ موارد حل‌شده (2026-07-09)

**Analyzer — validation** ✅ هر دو submit button (آپارتمان + ویلا) چک می‌کنند area/size/price — inline error نشان می‌دهد.

**Alerts — Email** ✅ `api/price-alerts.js` جایگزین سه فایل جداگانه شد. POST=subscribe, GET?action=unsubscribe, GET?action=check. Vercel 12-function limit حل شد با `api/_lib/` rename.

**Chiefs — SQL migration** ✅ `supabase-chiefs-schema.sql` قبلاً اجرا شده بود.

**Compare — validation** ✅ از قبل inline error داشت (`portfolio.js` line 107).

**Advisor — Try Again** ✅ از قبل پیاده شده بود (`portfolio.js` lines 502-503).

**Video Platform default tab** ✅ از قبل `"explore"` بود (`social.js` line 6).

**Portfolio data loss warning** ✅ از قبل warning banner + Export + Dismiss داشت (`portfolio.js` lines 755-770).

**Studio OAuth onboarding** ✅ از قبل پیاده شده بود (`chat.js`).

**Market Dashboard AI hang** ✅ 12s timeout + fallback momentum + Retry button اضافه شد (`js/core.js`, `js/market.js`).

**Map blank on proxy fail** ✅ از قبل error handler با پیام "Map unavailable" داشت (`map.js` lines 449-455).

**News empty state** ✅ از قبل error message + Retry button داشت (`news.js` lines 219-273).

**QuickCheck alert()** ✅ در QuickCheck خود alert() native وجود ندارد.

**Workspace widget reset** ✅ از قبل در localStorage ذخیره می‌شد (`saveWS()`).

---

### ℹ️ مشکلات LOW — باقی‌مانده

- ~~Market Index: CSV Export button در کد وجود دارد اما `display:none`~~ — **حل شد
  (2026-07-12)**: این یادداشت هم قدیمی بود — دکمه در واقع دیگه `display:none`
  نبود و کاملاً فعال بود (محافظت اصلی ۲۴ ژوئن ۲۰۲۶ یه‌جایی حین ادغام برنچ‌ها
  گم شده بود). دکمه bulk export («Download Full Market Data») کاملاً از DOM
  حذف شد (نه فقط مخفی) تا سشن بعدی اشتباهی «تمیزش» نکنه؛ سه export دیگه
  (Analyzer, Portfolio, Area Comparison) که scoped به کار خود کاربرن دست‌نخورده موندن.
- **TrackRecord**: case studies hardcoded، لینک‌های Bayut/PropertyFinder ممکن است stale شوند
- **Reports**: Voice input در Firefox و برخی mobile browsers کار نمی‌کند بدون fallback

---

### نکات کلی معماری

1. ~~RAG grounding در ۵ جای app غیرفعال است~~ — **قدیمی شد (تأیید شده 2026-07-11)**: RAG کاملاً فعال و live است (هم Supabase SQL هم Gemini/Jina key تنظیم شده) — به بخش "✅ COMPLETED: RAG Knowledge Base" در Outstanding items مراجعه کن.
2. **localStorage** برای Portfolio و Reports بدون cloud sync — ریسک data loss (هنوز واقعی به نظر می‌رسه — warning banner + Export دستی وجود داره ولی cloud sync خودکار نه)
3. ~~Admin password در `deals.js` client-side چک می‌شود~~ — **قدیمی شد (تأیید شده 2026-07-12)**: کد فعلی هیچ‌جا رمز رو client-side مقایسه نمی‌کنه؛ همه‌جا (`js/app.js`, `js/deals.js`, `js/core.js`) از طریق `p_admin_password` به یک RPC سمت سرور فرستاده می‌شه (فیکس سشن ۱۱-۷-۲۰۲۶، `supabase-admin-security-fix.sql`).
