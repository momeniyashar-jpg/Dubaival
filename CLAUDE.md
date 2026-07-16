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
  was stale; corrected 2026-07-13). Colored point markers per area (session
  11s — replaced the short-lived Voronoi-cell polygon layer from sessions
  11q/11r; `js/voronoi.js` was removed, see 2026-07-13 work log), metric
  registry, composite Investment Score.
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

- **2026-07-16 (session 13, CRITICAL — Inbox feature has silently never
  stored a single message on any platform since it was built)**: Found
  while live-debugging why a real WhatsApp test message never appeared in
  the Inbox, after confirming step-by-step that everything upstream was
  correct: Meta was generating real webhook payloads (confirmed via the
  "Check test webhooks" panel), the callback URL was verified, the
  `messages` field was subscribed, the app was subscribed to the WABA
  (`POST /{waba-id}/subscribed_apps` — a genuinely separate, easy-to-miss
  required step for WhatsApp Cloud API, unlike Instagram/Facebook), and the
  test recipient number was verified. A manual `curl` POST of a real
  payload straight to `/api/inbox?action=whatsapp-webhook` (run from the
  user's own machine, since this sandbox's outbound proxy blocks
  dubaival.com) returned the expected `{"ok":true}` — but a direct
  `SELECT * FROM social_inbox` in Supabase SQL Editor came back with zero
  rows, proving the message was never actually persisted despite the
  success response.
  - **Root cause**: `email_inbox` and `social_inbox`
    (`supabase-inbox-schema.sql`) were created with NO `user_id` column at
    all — but `api/inbox.js` (every ingestion path: Gmail/email, Instagram,
    Facebook, WhatsApp) has always built its insert row with a `user_id`
    field, and `js/inbox.js` (the client Inbox UI) has always queried with
    `?user_id=eq....`. Since PostgREST rejects inserting a column that
    doesn't exist, every single insert into either table has been failing
    since this feature was first built — completely silently, since
    `api/inbox.js`'s insert call sites are wrapped in empty `catch (e) {}`
    blocks and the outer handler always returns `{"ok":true}` regardless
    (a deliberate "never break Meta's webhook retry logic" choice that
    also happened to hide this bug perfectly). This means the Inbox
    feature has never actually stored a real message on ANY platform —
    not just WhatsApp — despite being described as working in every prior
    session's notes, none of which apparently did an end-to-end live
    verification against the actual table contents.
  - **Compounding discovery**: `supabase-inbox-rls-lockdown.sql`'s policies
    (written 2026-07-11 to fix the exact same "no TO clause" wide-open RLS
    bug as the `social_credentials` fix earlier tonight) reference
    `user_id` in their `USING` clause — meaning that migration could never
    have been successfully applied either, since the column it depends on
    never existed. The original wide-open `USING(true)` policies from
    `supabase-inbox-schema.sql` are very likely still the live ones.
  - **Fix**: new migration `supabase-inbox-user-id-fix.sql` (requires
    manual execution — see Outstanding items) adds the missing `user_id`
    column to both tables with an index, then drops whichever
    policies currently exist (handles either the original wide-open ones
    or the never-actually-applied lockdown ones) and re-creates the
    correct owner-only SELECT/UPDATE policies in one idempotent script —
    combining the schema fix and the security fix in a single run.
  - Diagnostic trail preserved for future sessions: manually POSTing a
    known-good webhook payload directly to a suspect ingestion endpoint
    (bypassing the third-party webhook sender entirely) is what isolated
    "our code returns success" from "our code actually persisted the
    data" — the `{"ok":true}` response alone was not sufficient proof.

- **2026-07-16 (session 13, CRITICAL security fix — any user's social API
  tokens could be read/overwritten by anyone on the internet)**: User asked
  a sharp, direct question after the Social Setup navigation fix above:
  "if another person signs up and opens their own Profile, would they see
  OUR data?" — investigating this properly (rather than reassuring without
  checking) surfaced a real, serious, pre-existing vulnerability, unrelated
  to the navigation bug.
  - **Root cause**: `supabase-autopost-schema.sql`'s 3 RLS policies —
    `social_credentials`, `scheduled_posts`, `post_engagement` — were all
    written as `FOR ALL USING(true) WITH CHECK(true)` with NO `TO
    service_role` clause, despite being named "Service role full access...".
    In Postgres/Supabase, a policy with no `TO` clause applies to **every
    role**, including the anonymous `anon` role — the name was aspirational,
    not enforced. Compounding this, every client-side fetch to these 3
    tables in `js/chat.js` (`_syncCredsToServer`, `_syncCredsFromServer`,
    `_syncCalEventToServer`, `_deleteCalEventFromServer`,
    `_fetchServerEngagement` — 7 call sites total) sent only the public
    **anon key** as the Authorization header, never the signed-in user's own
    access token. Since `user_id` in these tables is the user's plain email
    address (`_getPostUserId()`), the combination meant **anyone on the
    internet — not just other registered users, no sign-in required at
    all** — could construct a direct REST call to Supabase using the anon
    key (itself public, embedded in the site's own JS bundle) and read or
    overwrite ANY user's stored Instagram/Facebook/LinkedIn/Twitter/
    YouTube/TikTok/WhatsApp Business API tokens just by guessing their
    email address. Same bug class as the 2026-07-11 OFM RLS lockdown, just
    never applied here since this table predates that audit's scope.
  - **Fix, both sides required**:
    1. New migration `supabase-social-credentials-rls-fix.sql` (requires
       manual execution — see Outstanding items) drops the 3 public
       policies and replaces each with `TO authenticated USING (auth.email()
       = user_id) WITH CHECK (auth.email() = user_id)` — now only resolves
       for a request carrying a real, cryptographically-signed Supabase JWT
       whose email claim matches the row, not a client-suppliable value.
    2. `js/chat.js` gained a shared `_socialCredHeaders(extra)` helper
       (sends `dv_access_token`, the real per-user JWT already generated at
       sign-in, as the Authorization Bearer instead of the anon key) and all
       7 call sites across the 3 tables now use it.
  - **Server-side cron unaffected**: `api/auto-post.js`/`api/sync-
    engagement.js` already authenticate via `SUPABASE_SERVICE_ROLE_KEY`
    (`api/_lib/shared.js`'s `supabaseRequest()`), which always bypasses RLS
    regardless of policy — confirmed by reading the helper before assuming
    tightening RLS was safe to ship.
  - Verified: `node -c js/chat.js`; grepped for every remaining
    `social_credentials`/`scheduled_posts`/`post_engagement` reference in
    `js/chat.js` to confirm all 7 call sites were updated and none were
    missed or double-touched.
  - **Manual step required — this fix is NOT live until run**: execute
    `supabase-social-credentials-rls-fix.sql` in Supabase SQL Editor. Until
    then, the OLD permissive policies remain in effect in production
    (dropping/recreating policies isn't something client code can do) —
    the client-side header fix alone does not close the hole, since the
    old RLS would still accept the anon-key-only path from anyone else.
  - **Separately answered the user's original design question**: the
    per-user Social Setup panel (each agent brings their own social/API
    keys — makes sense, since agents post to their OWN Instagram/LinkedIn
    accounts) is architecturally different from true site-wide ADMIN
    config, which already has its own dedicated, separate, password-gated
    home: `renderAdmin()` in `js/app.js` (hidden `#admin` route, not part of
    any regular user's profile). No new icon/section was needed — pointed
    the user at the existing one rather than building a duplicate.

- **2026-07-16 (session 13, "Social Setup" card opened the wrong panel —
  WhatsApp Business fields were unreachable)**: Direct continuation of the
  WhatsApp Business API onboarding started earlier this session — user
  went looking for the Social Setup screen (SocialMedia → Studio → profile
  icon → the "Social Setup" card) to paste their WhatsApp Phone Number
  ID/Access Token/WABA ID, and genuinely could not find those 3 fields
  anywhere, despite following the exact navigation path.
  - **Root cause, confirmed by reading both panels**: `renderMediaStudio()`
    (`js/chat.js`) builds a "Social Setup" config card (wrench icon,
    labeled "Social Setup") whose click handler (`onSetup`, unconfigured
    state) AND "Edit" button (`onEdit`, configured state) were both wired
    to `function(){showProfilePanel=true;render();}` — opening
    `renderProfilePanel()` (`js/app.js`), a DIFFERENT overlay entirely.
    That panel has Groq/Gemini/Unsplash/Pexels/Instagram/Facebook/
    LinkedIn/Twitter/TikTok credential fields and a plain personal
    "WhatsApp" CONTACT NUMBER field (`dv_whatsapp_number`) — but never had
    the 3 WhatsApp BUSINESS API fields (`dv_whatsapp_token`,
    `dv_whatsapp_phone_id`, `dv_whatsapp_waba_id`) at all. Those 3 fields
    only exist in the OTHER modal, `showSocialSetup()` (also `js/chat.js`,
    added in the 2026-07-15 WhatsApp session) — meaning the card literally
    named "Social Setup" pointed at the one screen that doesn't have
    WhatsApp Business fields, while the correct screen sharing the same
    name was only reachable via a separate, easy-to-miss onboarding banner
    button ("Open Social Setup →", only shown when zero platforms are
    connected) or a buried "Setup" button inside a generated post's tool
    row. A real, confirmed navigation bug, not user error.
  - **Fix**: both handlers (`onSetup` and `onEdit`) now call
    `showSocialSetup()` instead of opening the Profile Panel — the card's
    name now matches where it actually goes, and it's the same modal that
    already has all 3 WhatsApp Business fields plus every other platform's
    credentials. Grepped for any other `showProfilePanel=true` call sites
    in `js/chat.js` this change might have touched — confirmed these were
    the only 2, both fixed correctly, no unintended replacements.
  - Verified: `node -c js/chat.js`.

- **2026-07-16 (session 13, password visibility toggle)**: User asked why
  there's no eye icon next to the Sign In password field to reveal what
  was typed — directly relevant to their ongoing "Invalid login
  credentials" debugging this session, since a masked field makes a typo
  invisible until after a failed submit. Added `_dvPasswordField(inputEl,cl)`
  (`js/auth.js`) — wraps a password `<input>` in a relatively-positioned
  container with a small SHOW/HIDE text-button toggle (absolute-positioned,
  input gets `paddingRight` to clear it) that flips `input.type` between
  `"password"`/`"text"`. Applied to all 3 password inputs in the auth
  modal: Sign In/Sign Up (`passInp`) and both Set-New-Password fields
  (`newPassInp`/`confPassInp`) — the latter is the exact screen a user
  lands on after clicking a real password-reset email link, so being able
  to confirm the new password was typed correctly there matters at least
  as much as at sign-in.
  - Verified: a real-browser Playwright test opening the Sign In modal,
    typing into the password field, confirming a "SHOW" toggle button
    exists, clicking it flips the input to `type="text"` and the label to
    "HIDE", and clicking again correctly reverts to `type="password"` —
    zero console errors. `node -c js/auth.js`.

- **2026-07-16 (session 13, browser back button appears dead while the auth
  modal is open)**: User-reported, screenshot-confirmed bug: after opening
  Sign In / Forgot Password, pressing the browser's own back button/arrow
  did nothing at all — screen stayed frozen on the same modal.
  - **Root cause**: `DV_AUTH.showModal` (`js/auth.js`) is a pure in-memory
    boolean flip with no history entry of its own — none of the 10 call
    sites across `js/auth.js`/`js/app.js`/`js/chat.js`/`js/core.js` that set
    it ever pushed history state. So a real back-button press DID fire a
    normal `popstate` and DID change the underlying section behind the
    scenes (via `js/core.js`'s existing tab-navigation history handling) —
    but the modal is a full-screen fixed overlay, so nothing about that
    change was visible, and it looked from the outside exactly like "back
    does nothing." This is a different bug from the 2026-07-15 native
    Android hardware-back-button fix (that one was about
    `window.history.length` never shrinking); this one is a desktop/mobile
    web browser back button interacting with a modal that never
    participated in SPA history at all.
  - **Fix**: `renderAuthModal()` now edge-triggers a `history.pushState`
    (tagged `dvModal:true`) the moment `DV_AUTH.showModal` flips to `true`
    (covers all 10 call sites for free, no need to touch each one), tracked
    via a new module-level `_dvModalHistoryPushed` flag. Symmetrically, the
    same function calls `history.back()` once to pop that entry back off
    the moment `showModal` flips back to `false` through any NON-back-button
    path (X button, overlay click, successful sign-in, etc.) — so browser
    history never accumulates orphan entries just because a modal was
    opened and closed by other means. `js/core.js`'s `popstate` listener
    gained an early check: if the modal is open when a real back-button
    `popstate` fires, close the modal and reset the flag WITHOUT applying
    the new state's section (so a single back press only dismisses the
    modal — the section underneath stays exactly where the user left it —
    consistent with how a dialog/back-button interaction is expected to
    behave; a second back press then navigates sections normally).
  - Verified: a Node vm-sandbox test with a real push/pop history-stack
    mock (not just assertions on isolated calls) — confirmed opening the
    modal pushes exactly one entry, closing it via a non-back path (X
    button) pops that exact entry back off with zero effect on the
    underlying section, a simulated real back-button press while the modal
    is open closes it and leaves the section completely unchanged, and a
    SECOND back press (with the modal already closed) correctly navigates
    sections as normal. `node -c` on both touched files.

- **2026-07-16 (session 13, Buyer Advisory: 5-year card overflow + fee-color
  misuse)**: Two more user-reported, screenshot-confirmed visual bugs, both
  in the Analyzer's "Buyer Advisory" card (`js/market.js`, sale-mode results,
  the "Profit Projection If You Buy at AED..." 1/3/5-year grid and the "Total
  Cash Required" breakdown right below it).
  - **5 YEARS card overflowing its container**: the 3-column projection grid
    (`gridTemplateColumns:"1fr 1fr 1fr"`) had no `minWidth:"0"` on its grid-item
    divs — a well-known CSS Grid default (grid items refuse to shrink below
    their own content's intrinsic min-content width unless told otherwise),
    so once the projected value/rent/ROI numbers got long enough (5-year
    projections are the largest numbers of the three), the rightmost "5
    YEARS" card was pushed wider than its actual 1fr track and visibly bled
    past the parent card's right edge — exactly what the user's screenshot
    showed. Fixed by adding `minWidth:"0"` to all 3 grid-item wrappers (1
    YEAR / 3 YEARS / 5 YEARS), the same fix pattern already used elsewhere
    in this file (e.g. the Track Record name-truncation rows) for the
    identical class of overflow.
  - **Red color misuse on DLD Fee / Agent Fee / Processing fee**: all 3
    appeared in `#EF4444` (warning red) in the "Total Cash Required"
    breakdown, despite being ordinary, expected, correctly-calculated
    transaction costs — not a warning, not a bad number. This is the exact
    same anti-pattern already identified and fixed for the Mortgage
    Calculator's "Total Interest" stat in the 2026-07-15 red-color audit
    (see that entry below) — this specific trio was apparently missed in
    that earlier pass since it lives in the Analyzer's Buyer Advisory card,
    not the standalone Mortgage tab. Switched all 3 to `cl.subHi`, matching
    the neutral styling already used one row above for "Property Price" in
    the same grid. Grepped the rest of the codebase for the same 3 fee
    labels — `js/mortgage.js`'s own DLD Fee row was already correctly
    neutral (`cl.sub`); no other occurrences found.
  - Verified: `node -c js/market.js`; not re-screenshotted live in this
    sandbox (no live network/valuation data to reproduce the exact Analyzer
    result), but both fixes are minimal, targeted, and follow established
    patterns already proven elsewhere in this codebase.

- **2026-07-16 (session 13, donut-chart score number blending into its own
  ring color)**: User-reported, screenshot-confirmed visual bug: the score
  number inside the Sustainability & Efficiency Score donut (Analyzer
  result, `js/market.js`) was nearly unreadable — "78" rendered in the same
  green as the conic-gradient ring behind it. Root cause: the small inner
  circle meant to sit on top of the colored ring and hold the score digits
  used `background:cl.surface` — in dark mode `cl.surface` is only 5% opaque
  (`rgba(255,255,255,0.05)`, the same token whose transparency caused the
  2026-07-13 dropdown-bleed-through bug in Find/Analyzer/Chiefs/Deal Board
  search suggestions) — so the ring's own green showed straight through the
  "opaque" inner circle instead of being covered by it, and the green score
  text on top of that near-invisible backing blended into the ring. Fixed
  by switching to `cl.surfaceSolid` (the real opaque token already
  established for exactly this class of bug). Grepped for every
  `conic-gradient` donut in the codebase (only 2 exist) and found the
  identical bug in Portfolio Health Score's donut (`js/portfolio.js`) —
  fixed there too, same one-line change. Verified via `node -c` on both
  files; not yet re-screenshotted live (no network/live data in this
  sandbox to reproduce the exact Analyzer result), but the fix is the
  identical, already-proven pattern from the 2026-07-13 dropdown fix.

- **2026-07-15 (session 12, real Google Analytics 4 property)**: User
  noticed the site's existing GA tracking used `G-DUBAIVAL01` — a
  human-chosen placeholder, not a real Google-issued Measurement ID — and
  asked to make it real ("واقعی بساز"). Confirmed by inspection that GA has
  very likely never collected real data for the site under that ID, and
  pointed out the already-working alternative (`dvTrack()` in `js/core.js`,
  writing real events straight to Supabase's `analytics_events` table) as
  an immediately-usable data source in the meantime. Walked the user
  through creating a real GA4 property end-to-end (account → property →
  business details/objectives → Web data stream for
  `https://www.dubaival.com`) and obtained the real Measurement ID,
  `G-7J3H12JGPE`. Replaced `G-DUBAIVAL01` with `G-7J3H12JGPE` in both
  places in `index.html` (the `gtag/js?id=` script src and the
  `gtag('config', ...)` call). Rebuilt `www/` via `scripts/build-www.js`
  and manually synced the updated `index.html` into
  `android/app/src/main/assets/public/` (`npx cap sync android` still
  fails in this sandbox — no Android SDK, same pre-existing limitation).
  **Not yet verified live**: GA4's own dashboard can take up to 48 hours to
  show the first real-time/data-collection confirmation — the user should
  check the GA4 property's Realtime report after visiting the live site
  post-deploy.

- **2026-07-15 (session 12, real auth bugs — broken password reset +
  email not remembered)**: User reported 3 linked, real problems while
  testing sign-in for the WhatsApp/Meta setup work above: (1) "Invalid
  login credentials" even with an email/password they were sure was
  correct; (2) the email field never remembered anything, always had to be
  retyped by hand, even right after signing out; (3) "Forgot password"
  looked like it worked (email arrived) but clicking the link opened
  nothing / an error, no page to actually set a new password.
  - **Root cause, ties all 3 together**: `dvResetPassword()`
    (`js/auth.js`) called Supabase's `/auth/v1/recover` endpoint with NO
    `redirect_to` parameter at all. Without it, Supabase falls back to
    whatever "Site URL" happens to be configured in the Supabase project's
    own Auth settings (frequently a stale placeholder/localhost address
    left over from initial project setup) — so the emailed reset link sent
    the user somewhere that isn't this site, matching complaint #3 exactly.
    Since the link never actually reached DubAIVal's own recovery-token
    handler, `dvSetNewPassword()` was never called and the password was
    NEVER actually changed server-side — so a later sign-in attempt with
    the "new" password the user believed they'd just set correctly failed
    with a genuine "Invalid login credentials" from Supabase (complaint #1
    was a real, correct error response to a password that was never
    updated, not a false positive). Fixed by adding `redirect_to=` (the
    site's own origin) to both `/auth/v1/recover` and, defensively for the
    same reason, `/auth/v1/signup`'s email-confirmation link (same class of
    bug, not yet reported but equally broken had email confirmation ever
    been turned on for the Supabase project).
  - **Second real bug — email field never persisted**: `renderAuthModal()`
    rebuilds the entire form (including a brand-new, empty `emailInp`
    element) on every single re-render — so even within ONE attempt, a
    failed sign-in (`DV_AUTH.error=...;render()`) wiped the just-typed
    email along with showing the error, and there was no mechanism at all
    to remember the last-used email across a sign-out or a fresh page
    load. Fixed by adding `DV_AUTH.emailDraft` (seeded from a new
    `dv_last_email` localStorage key at module load, matching every other
    persisted-session key in this file), pre-filling both the sign-in and
    forgot-password email inputs from it, keeping it live-updated on every
    keystroke (`input` listener), and persisting it to `dv_last_email` on
    every submit — deliberately never cleared by `dvSignOut()`, since the
    whole point was to survive sign-out.
  - Verified: a Node vm-sandbox test confirming both `/recover` and
    `/signup` requests now include the correct `redirect_to` query param
    pointing at the real site origin, and that a completely fresh module
    load (simulating a browser reload/new tab) correctly picks up a
    previously-persisted email from `localStorage` into
    `DV_AUTH.emailDraft`; and a real-browser Playwright pass confirming
    both the Sign In and Forgot Password modal views render with the
    remembered email pre-filled, and that clicking "Send Reset Link" fires
    a real request to `/auth/v1/recover` with `redirect_to` correctly set
    to the page's own origin. `node -c js/auth.js`. Zero console errors.
  - **Manual step to double-check**: Supabase Dashboard → Authentication →
    URL Configuration — confirm `https://www.dubaival.com` (and/or
    `https://www.dubaival.com/**`) is listed under "Redirect URLs". Supabase
    only honors a `redirect_to` value that matches an allow-listed pattern;
    if the domain was never added there, the fix above still won't reach
    the site (Supabase will reject the redirect and fall back again).

- **2026-07-15 (session 12, AI Chief of Staff expansion — "private assistant"
  features)**: User asked for AI Chief of Staff to become a genuinely
  full-featured co-worker for agents ("باید ببینیم چه موارد دیگه ای میتونیم
  بهش اضافه کنیم که مثل یک ربات همکار عمل کنه" — beyond a matching tool,
  something that feels like hiring a private assistant). Presented 7
  candidate features via `AskUserQuestion`; user selected all 4 groupings
  (Daily Briefing + follow-up, Document Assistant, voice call transcription,
  Smart To-Do + Commission Tracker + Competitor Watch). Built all of it —
  every new capability computes from data already loaded into `CHIEFS_STATE`
  (inventory/clients/matches/pipeline), no new Supabase tables except where
  noted below.
  - **Daily Briefing** (`_renderChiefsBriefing()`, top of Dashboard): a
    "🌅 Today's Briefing" card, generated once per session (manual "↻
    Refresh" to regenerate) by `_chiefsGenerateBriefing()` — computes real
    signals (`_chiefsComputeSignals()`: new matches in 24h, active clients
    with no follow-up in 5+ days, overdue/today pipeline actions, deals with
    no update in 7+ days, listings on market 30+ days) and feeds ONLY those
    already-computed facts to `askAI()` for a short narrated summary — the
    system prompt explicitly forbids inventing any fact not given. Below the
    narrative, clickable chips (Overdue/Due Today/Need Follow-Up/Stuck
    Deals/Aging Listings/New Matches) jump straight to the relevant view.
  - **Smart To-Do** (`_chiefsSmartTodo()`, Dashboard): replaces the old
    pipeline-only "Next Actions" preview (which missed stale clients/aging
    listings/stuck deals entirely) with one flat, priority-sorted list
    merging all 5 "needs attention" signal types (overdue > today > stuck >
    stale clients > aging listings), each item clickable to its own view.
  - **Commission Tracker** (new internal view tab, `_renderChiefsCommission()`
    — added `{id:"commission",...}` to the Chiefs `VIEWS` array, an internal
    sub-view, not a change to the frozen top-level nav table): a real
    stage-weighted projection (`CHIEFS_STAGE_WEIGHT` — lead 10% → closing
    90% → closed 100%, lost 0%) instead of the flat sum the Pipeline tab
    already showed, since a lead and a deal at closing don't deserve equal
    weight in a realistic commission forecast. Also shows closed commission
    grouped by month (approximated from each closed deal's last-updated
    month — there's no dedicated `closed_at` column, flagged as an
    approximation in the UI itself) and active deals ranked by weighted
    contribution.
  - **Competitor / Market Watch** (`_chiefsCompetitorCheck()`, shown inside
    each expanded Inventory listing card): compares a pocket listing's own
    asking PSF against the CURRENT calibrated building PSF via the existing
    `lookupBuilding()` (same building database the Analyzer itself uses, no
    new data) — flags red if priced 8%+ above current market ("may be
    sitting for this reason"), amber if the building's PSF has softened 5%+
    since the listing's own `dv_psf` snapshot was taken at add-time ("worth
    a price review"), green if priced 8%+ below market ("a genuinely strong
    deal to push to matched clients"), else a neutral in-line confirmation.
    Pure client-side computation, no live fetch.
  - **Document Assistant** (`renderChiefsDocGenOverlay()`, new "📄 Document"
    button on every Pipeline deal card): AI-drafts an Offer Letter, MOU
    Draft, or Listing Agreement auto-filled from the deal's own real data
    (client name, property, deal value, stage, notes, agent name/date) plus
    optional agent-typed extra terms. The system prompt explicitly requires
    `[TO BE FILLED]` instead of inventing any missing fact, and explicitly
    forbids claiming legal force — every generated document carries a
    persistent on-screen disclaimer AND a printed-footer disclaimer stating
    it is a draft/reference only, not the official RERA Form F/Form A and
    not a substitute for independent legal review. The generated text is
    editable in place before exporting; "Print / Save as PDF" reuses the
    exact same `#print-report` + `window.print()` mechanism the Analyzer's
    existing PDF export already uses (index.html's global print-media CSS),
    no new library. Overlay wired into `js/app.js`'s render pipeline next to
    the existing Chiefs Co-pilot overlay (same fixed/body-level pattern).
  - **Voice call transcription** (`chiefsTranscribeVoiceCall()`, new upload
    button inside the existing WhatsApp/email Conversation Scanner): agent
    uploads a recorded call (any audio file); transcribes via the SAME
    Whisper proxy + pay-per-use `video_credits` pool already built earlier
    this session for the Video Editor's real-subtitle feature
    (`api/proxy-video.js` `engine=whisper`) — reused deliberately rather
    than adding a second, functionally-identical credit product, since the
    underlying OpenAI cost driver (audio-minutes transcribed) is the same
    whether it's a video's audio track or a call recording. Once
    transcribed, the plain-text transcript is fed straight into the
    pre-existing `chiefsScanConversation()`/`chiefsScannerApply()`
    extraction pipeline — zero new extraction logic, the transcript is just
    treated exactly like a pasted WhatsApp conversation. Client tagging
    (`source:"voice_call"` vs `"whatsapp"`) lets a future session tell which
    input channel a client record came from. A self-contained
    `chiefsStartVoiceCreditCheckout()` (same `action=video-checkout` Stripe
    flow already used elsewhere) was added directly in `js/chiefs.js`
    rather than importing `js/chat.js`'s equivalent helper, per this file's
    stated isolated-workspace design (see its own header comment).
  - Verified: a Node vm-sandbox test harness (loads `js/chiefs.js` with
    minimal `el`/`div`/`C`/`askAI`/`lookupBuilding` stubs) covering — signal
    computation across 6 categories with correct day-thresholds; Smart
    To-Do's priority ordering; the stage-weighted commission math (exact
    expected value for a mixed offer+viewing pipeline); the competitor
    check's 3 flag states (overpriced/softened-market/in-line) against a
    real `lookupBuilding` mock; the briefing generator sending only
    real, already-computed facts to `askAI()` (never fabricated); the
    Document Assistant sending real deal facts (client/value/notes/extra
    terms) to `askAI()` with a disclaimer-carrying system prompt, and the
    printed HTML correctly embedding both the generated body and the
    reference-only disclaimer footer; and the voice-transcription flow
    (successful transcription auto-runs extraction and tags
    `source:"voice_call"`, a 402 `needsCredit` response shows a clear
    Buy-Credit-pointing error instead of crashing, local credit balance
    decrements optimistically). Also a real-browser Playwright pass driving
    the actual Chiefs tab end-to-end with seeded real inventory/clients/
    pipeline data — confirmed the Briefing card, Smart To-Do chips,
    Commission tab's weighted-projection stat, the Competitor Watch note
    inside an expanded listing, the Document Assistant modal opening from a
    Pipeline deal, and the voice-upload button inside the Conversation
    Scanner all render correctly with zero non-network console errors.
    `node -c` on both touched files (`js/chiefs.js`, `js/app.js`).
  - **Not built this session** (discussed, out of scope per the user's own
    selection in `AskUserQuestion` — these weren't among the 4 groupings
    chosen): a dedicated calendar/viewing-scheduler integration, an
    objection-handling live coach chat, and a voice-command interface.

- **2026-07-15 (session 12, WhatsApp credit-billing correction)**: Direct
  follow-up to the WhatsApp session below — user immediately caught a real
  pricing-model bug: "هر پیام ۰.۴۹ خیلی گرونه، میدونی در روز ایجنت‌ها چقدر
  پیام دریافت می‌کنن؟" (charging per message is way too expensive — do you
  know how many messages agents get per day?). Correct: the shipped design
  consumed 1 credit per SEND or per AUTO-REPLY, but Meta actually bills
  WhatsApp Business API per 24-HOUR CONVERSATION WINDOW per contact — once
  that window is open, unlimited messages flow both directions for free
  until it expires. Charging per message would have made an agent with a
  single active back-and-forth conversation (very plausible — a real estate
  inquiry can be a dozen+ messages in one day) pay many times over for what
  Meta itself only bills once.
  - **Fix**: reworked `supabase-whatsapp-credits-schema.sql` (not yet run,
    safe to edit in place) — added a `whatsapp_conversation_windows` table
    (one row per `(user_id, contact_phone)` pair, tracking
    `window_expires_at`) and a new `ensure_whatsapp_window(p_user_id,
    p_contact_phone)` RPC that only consumes a credit and opens a fresh 24h
    window when the contact has no currently-active one — reusing an
    already-open window is free. A companion `refund_whatsapp_window()` both
    refunds the credit AND deletes the just-opened window row, for the case
    where a credit was spent to open a new window but the actual WhatsApp
    send that followed failed (so a failed first message never leaves a
    "phantom paid" window behind). The original `consume_whatsapp_credit`/
    `add_whatsapp_credits` RPCs are kept underneath, unchanged, as the
    actual balance-mutation primitives `ensure_whatsapp_window`/
    `refund_whatsapp_window` call into.
  - **`api/inbox.js`**: both `handleWhatsAppWebhook` (inbound auto-reply)
    and `handleWhatsAppSend` (manual/AI-drafted outbound) now call
    `ensure_whatsapp_window` instead of `consume_whatsapp_credit` directly,
    and only call the refund path when the response's `credit_consumed`
    flag is true (i.e. this exact call newly opened the window) — reusing
    an existing window never triggers a refund since nothing was spent.
  - **Copy updated** to stop describing this as "per message" pricing:
    Social Setup's credit-balance row (`js/chat.js`) now reads "1 credit = 1
    day of messaging per contact (unlimited replies within 24h)"; the
    Inbox reply box (`js/inbox.js`) now reads "Free if you've messaged this
    contact in the last 24h, otherwise uses 1 credit"; the Stripe product
    description (`api/billing.js`) now reads "Open a 24h WhatsApp
    conversation with one contact (unlimited replies within that window)".
    Price itself unchanged at $0.49/credit (already user-approved) — only
    the billing UNIT changed, which is what actually fixes the "too
    expensive" complaint, since most of a busy agent's daily messages to
    the same handful of active leads will now reuse an already-open window
    for free instead of each costing a fresh credit.
  - Verified: rewrote the Node mocked-fetch test harness (9 cases, up from
    7) to mock `ensure_whatsapp_window`/`refund_whatsapp_window` instead of
    the old flat consume/add calls — confirmed a brand-new contact consumes
    exactly 1 credit and opens a window, a SECOND message from the SAME
    contact the same day is completely free (no additional RPC charge, no
    refund call fired) and still gets a real auto-reply, a contact with no
    credit available for a new window is still logged (never lost) with no
    reply attempted, a send failure on a newly-opened window correctly
    triggers the refund/rollback RPC, and the manual send endpoint's 402/
    success/reuse/not-connected paths all still behave correctly under the
    new window model; `node -c` on all 3 touched files.

- **2026-07-15 (session 12, pay-per-use WhatsApp Business API)**: Direct
  follow-up to the AI-video-generation credit work above — user asked
  whether the same pay-first model could cover WhatsApp too, so DubAIVal
  isn't stuck buying its own WhatsApp Business API subscription
  ("میگم API key واتساپ نمیتونیم اینجوری بگیریم..."), for BOTH sending
  AI-drafted outbound messages AND auto-replying to inbound client messages
  (confirmed via `AskUserQuestion`: both, at $0.49/credit — 1 credit = 1
  send or 1 auto-reply, not Meta's real 24h-conversation-window unit, since
  that boundary can't be precisely tested from this sandbox and
  under-charging would risk losing money on a multi-message exchange).
  Also confirmed via `AskUserQuestion`: the user will start Meta Business/
  WhatsApp verification themselves in parallel (an external, days-long
  process this session cannot do), while this session builds the
  credit/backend architecture so it's ready the moment credentials exist.
  - **New migration**: `supabase-whatsapp-credits-schema.sql` (not yet run
    — see Outstanding items) adds `user_profiles.whatsapp_credits` +
    `add_whatsapp_credits()`/`consume_whatsapp_credit()` RPCs (reusing the
    Whisper migration's `stripe_events_processed` idempotency table, must
    already be applied), plus 3 new `social_credentials` columns
    (`whatsapp_token`, `whatsapp_phone_id`, `whatsapp_waba_id`) alongside
    the existing Instagram/Facebook/LinkedIn/etc. columns on that table.
  - **`api/billing.js`**: new `action=whatsapp-checkout` — same
    one-time-payment Stripe Checkout pattern as the video-gen/Whisper
    credits (`WHATSAPP_CREDIT_PRICE_CENTS`/`WHATSAPP_CREDIT_CURRENCY` env
    vars, defaulting to 49/usd), webhook branches on
    `metadata.type==="whatsapp_credit"` to call `add_whatsapp_credits`.
  - **`api/inbox.js`** (extended, NOT a new file — the project is already
    at Vercel Hobby's 12-function ceiling, same constraint noted for the
    Whisper credit's `proxy-video.js` extension): this file already handled
    Instagram/Facebook Meta webhooks + a unified `social_inbox` table + AI
    auto-reply generation, so WhatsApp (also a Meta Graph API product) slots
    into the exact same architecture rather than needing anything new.
    - `handleWhatsAppWebhook` (`action=whatsapp-webhook`): GET does the
      standard Meta webhook-verification handshake; POST processes incoming
      `entry[].changes[].value.messages[]`, resolves the owning user via a
      new `whatsapp_phone_id` lookup on `social_credentials`, and — UNLIKE
      Instagram/Facebook DMs (free via a connected Page token, always
      auto-replied) — consumes 1 `whatsapp_credit` BEFORE calling the AI or
      sending anything back, since Meta bills real money per message here.
      If there's no credit left, the incoming message is still logged to
      `social_inbox` (status `"new"`) so it's never silently lost — it just
      doesn't get an automatic reply. If the AI reply generates but the
      actual WhatsApp send fails, the credit is refunded (same
      never-charge-for-a-failure principle as the video-gen credit).
    - `handleWhatsAppSend` (`action=whatsapp-send`): a real, credit-gated
      manual send endpoint — resolves the caller's real Supabase auth UUID
      from their access token, consumes a credit, sends via the WhatsApp
      Cloud API, refunds on failure, returns 402 + `needsCredit:true`
      (same "buy a credit" substring convention as every other credit
      system this session) when the balance is 0.
    - Added a new `_resolveAuthUid()` helper (returns the real UUID
      specifically) alongside the file's existing `_resolveUserId()` (which
      prefers email, for the pre-existing `email_inbox`/`social_credentials`
      convention) — the two credit RPCs key off `user_profiles.id` (a UUID),
      so credit consumption needed the UUID form specifically.
  - **Client (`js/chat.js` Social Setup / `showSocialSetup()`)**: 3 new
    fields (WhatsApp Permanent Access Token, Phone Number ID, Business
    Account ID) alongside the existing Instagram/Facebook/LinkedIn/etc.
    fields, wired into the existing `_syncCredsToServer()`/
    `_syncCredsFromServer()` push/pull functions and the "reset all" key
    list — needed zero new sync plumbing since this modal already has that
    infrastructure for every other platform. Added a live "WhatsApp
    send/auto-reply credits · Balance: N" row + "+ Buy Credit ($0.49)"
    button (new `_startWhatsAppCreditCheckout()`, same pattern as the
    video-gen credit's checkout helper).
  - **Client (`js/inbox.js`)**: added "WhatsApp" as a 4th platform tab
    (alongside All/Email/Instagram/Facebook), green (`#25D366`) color +
    `message-circle` icon. Unlike Instagram/Facebook items (which only ever
    get a "use AI Chief Co-pilot to draft, then send manually" hint, since
    no send endpoint exists for those yet), WhatsApp items get a REAL reply
    box (new `_sendWhatsAppReply()`) calling the new credit-gated
    `action=whatsapp-send` endpoint — reflects the live credit balance right
    in the reply box. Also generalized the existing "AI Reply (sent)"
    read-only confirmation block (shown once an item's `status` flips away
    from `"new"`) to correctly label a WhatsApp item as "AI Auto-Reply
    (sent)" when the webhook's automatic reply fired, vs "Your Reply (sent)"
    when the agent sent it manually from this reply box — both cases reuse
    the same `ai_reply` column (no schema change needed), distinguished
    purely by `status` (`"replied"` vs `"agent_replied"`).
  - **`js/auth.js`**: `_fetchProStatus()` now also selects `whatsapp_credits`
    in its existing single query (alongside `is_pro`/`video_credits`/
    `video_gen_credits`) — no new fetch needed.
  - Verified: `node -c` on all 5 touched files; a mocked-fetch Node test
    harness against the real `api/inbox.js` handler (7 cases) — the GET
    webhook-verification handshake responds with the raw challenge string;
    an incoming message with a credit available correctly consumes it,
    generates + sends an AI auto-reply, and logs the row as `"replied"`
    with a real `ai_reply`; an incoming message with NO credit left is still
    logged as `"new"` (never lost) with no auto-reply attempted; a send
    failure after a credit was consumed correctly triggers the refund RPC
    and logs `"new"` (not falsely marked replied); the manual send endpoint
    correctly returns 402 + `needsCredit` with zero credits, succeeds and
    consumes a credit when available, and returns a clear "Connect WhatsApp
    Business API first" error when no credentials are on file yet; and two
    real-browser Playwright passes — one confirming `showSocialSetup()`
    renders all 3 new WhatsApp fields plus the live credit balance/Buy
    Credit button, one driving the actual `renderInbox()` UI end-to-end
    against a mocked WhatsApp `social_inbox` row (switch to the WhatsApp
    tab, expand the message, type and send a reply through the real credit
    -gated endpoint, confirm the persistent "Your Reply (sent)" confirmation
    renders with the real sent text) — zero console errors in either run.
  - **Manual steps required before this goes live** (flagged below in
    Outstanding items too): (1) run
    `supabase-whatsapp-credits-schema.sql` in Supabase SQL Editor (needs
    `supabase-video-credits-schema.sql` applied first); (2) complete Meta
    Business/WhatsApp Business API verification (external, days-long,
    user's own task, already in progress in parallel with this session);
    (3) once verified, connect a real WhatsApp Business phone number in the
    Meta App Dashboard, generate a permanent access token, and paste the
    Token/Phone Number ID/Business Account ID into Social Setup; (4) add a
    Webhook subscription in the Meta App Dashboard for the WhatsApp product
    pointing at `https://www.dubaival.com/api/inbox?action=whatsapp-webhook`
    (verify token: `WHATSAPP_VERIFY_TOKEN` env var if set, else falls back
    to the same `META_VERIFY_TOKEN` already used for Instagram/Facebook),
    subscribed to the `messages` field. Until all 4 are done: the "+ Buy
    Credit" button and Stripe checkout work immediately (same
    `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` every other credit checkout
    already uses), but `whatsapp_credits` reads as 0 until the SQL runs, and
    no messages can send/receive until the Meta connection is complete.

- **2026-07-15 (session 12, pay-per-video AI VIDEO GENERATION credits)**:
  Direct follow-up to the Whisper pay-per-video-subtitle work above — user
  asked whether AI VIDEO GENERATION itself (Kling/Runway/HeyGen/D-ID, not
  just adding subtitles to an already-recorded video) could also use a
  pay-first model so they aren't forced to pre-purchase API keys out of
  pocket for an unproven feature. Confirmed via `AskUserQuestion`: fund
  Kling AI, Runway Gen-4, and HeyGen/D-ID first; price at $4.99/credit
  (user's own reasoning: "we haven't even tested this ourselves yet, so no
  reason to price high — just avoid losses for now, get the site running").
  - **Same one-time-payment architecture as the Whisper credit system**
    (`supabase-video-credits-schema.sql`, `api/billing.js`
    `action=video-checkout`), replicated as a fully separate credit pool —
    `video_gen_credits`, not `video_credits` — since these are two different
    products at two different price points ($4.99 to generate a video vs
    $2.99 to add real subtitles to one already-recorded video); a user
    buying one should never implicitly spend the other.
  - **New migration**: `supabase-video-gen-credits-schema.sql` (not yet
    run — see Outstanding items) adds `user_profiles.video_gen_credits` +
    `add_video_gen_credits()`/`consume_video_gen_credit()` RPCs, reusing the
    existing `stripe_events_processed` idempotency table from the Whisper
    migration (must already be applied first).
  - **`api/billing.js`**: new `action=video-gen-checkout` — a ONE-TIME
    Stripe Checkout Session (`mode:"payment"`, `price_data` inline,
    `VIDEO_GEN_CREDIT_PRICE_CENTS`/`VIDEO_GEN_CREDIT_CURRENCY` env vars,
    defaulting to 499/usd), same idempotent webhook pattern as
    `video-checkout` but branching on `metadata.type==="video_gen_credit"`
    to call `add_video_gen_credits` instead of `add_video_credits`.
  - **`api/proxy-video.js`**: the shared "generate" gating block (used by
    every engine — Kling, Runway, Luma, Minimax, Pika, HeyGen, Hedra, D-ID —
    since they all funnel through one server-side handler) now falls back to
    a paid credit once the existing free monthly quota
    (`FREE_VIDEO_GENERATIONS_PER_MONTH=3`) is exhausted: atomically consumes
    1 credit via `consume_video_gen_credit` before attempting the (expensive)
    downstream engine call, returns 402 + `needsCredit:true` if the balance
    is 0 (engine never called, so nothing is spent on a request that can't
    succeed), and auto-refunds the credit if the engine call itself fails.
    The refund uses a new technique — monkey-patching `res.json` for the
    current request to detect any subsequent error response
    (`statusCode>=400||payload.error`) and fire the refund automatically —
    rather than instrumenting every individual per-engine failure branch by
    hand (unlike the Whisper credit, which only had one call site to guard).
    Explicit, accepted scope limit: only catches SYNCHRONOUS failures within
    the same request, not a later async polling failure (e.g. Kling accepts
    the job then fails minutes later) — consistent with the same tradeoff
    already documented for `_checkAndLogVideoQuota()`.
  - **Client (`js/chat.js`)**: `_videoProxy()` now flags `_needsCredit` on a
    402 response; new `_startVideoGenCreditCheckout()` (same
    checkout-redirect pattern as the Whisper credit's
    `_startVideoCreditCheckout()`, kept as a separate top-level function
    since it needs to be reachable from both `showVideoGenUI()` and
    `showAvatarVideoGen()` — two different closures). Both AI Video Studio
    entry points now show a live "3 free videos/month, then paid credits ·
    Balance: N credits" row with a "+ Buy Credit" button once a paid (non-
    slideshow) engine is selected, reading `DV_AUTH.profile.video_gen_credits`.
    `showVideoGenUI()`'s existing shared `_aiError()` already detects a
    "buy a credit" substring in the thrown error message (this exact string
    comes straight from `api/proxy-video.js`'s 402 response) and shows a
    "Buy 1 Video Credit ($4.99)" button — needed zero changes since it's a
    single centralized error handler. `showAvatarVideoGen()`, by contrast,
    has 8 separate per-engine try/catch branches (Runway/Minimax/Pika/Kling/
    Luma/HeyGen/Hedra/D-ID) with no centralized error path — rather than
    duplicating the same "does this message say buy a credit" check 8 times,
    extracted one shared `_videoGenErrorUI(resultArea,msg,genVideoBtn)`
    helper and pointed all 8 branches' error-rendering calls at it.
  - **`js/auth.js`**: `_fetchProStatus()` (already fetching `is_pro` +
    `video_credits` on every sign-in) now also selects `video_gen_credits`
    in the same query — no second fetch needed, matches the existing
    single-query pattern.
  - Verified: `node -c` on all 4 touched files; the existing mocked-`fetch`
    Node test harness (adapted from the Whisper credit's own test) against
    the real `api/proxy-video.js` handler — 4 cases: free quota still
    available skips credit consumption entirely, quota exhausted + credit
    available consumes 1 credit and proceeds, a downstream engine failure
    triggers an automatic refund via the `res.json`-wrapping technique, and
    zero credits returns 402 with the engine never actually called; and a
    real-browser Playwright pass against the rebuilt app (mocked
    `engine_status`/network) — confirmed both `showVideoGenUI()` (after
    clicking through Setup → Create → selecting the Kling engine card) and
    `showAvatarVideoGen()` render the live credit-balance row and working
    "+ Buy Credit" button, and that `_videoGenErrorUI()` correctly renders
    the "Buy 1 Video Credit" button (not a generic red error) when fed the
    server's real "...buy a credit to generate more." message — zero
    real console errors in either run (only the sandbox's expected
    network-unavailable artifacts, same limitation noted throughout this
    file for every feature needing live network access).
  - **Manual steps required before this goes live** (flagged below in
    Outstanding items too): (1) run
    `supabase-video-gen-credits-schema.sql` in Supabase SQL Editor (needs
    `supabase-video-credits-schema.sql` applied first), (2) set
    `KLING_API_KEY`, `RUNWAY_API_KEY`, and `HEYGEN_API_KEY`/`DID_API_KEY` in
    Vercel env vars for the 3 engines chosen this session (the user can add
    the other 4 catalog engines — Luma, Minimax, Pika, Hedra — later the same
    way; each engine activates automatically the moment its own key is set,
    per the existing `_availableVideoEngines()` filtering), (3) confirm
    `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are set (already required for
    the existing Pro + Whisper checkouts — this reuses them, no new Stripe
    setup). Until (1) is done, `video_gen_credits` reads as 0 everywhere
    (Buy Credit still works, nothing crashes). Until any given engine's key
    is set, that engine simply doesn't appear in the picker at all (existing
    `engine_status` gating, unchanged this session).

- **2026-07-15 (session 12, Val mascot redesign)**: User flagged the About
  page's "Val" falcon mascot as genuinely bad ("خیلی داغونه") and asked for
  both a design proposal and a beautiful execution.
  - **Root cause of why the old one looked bad**: `getValSVG()` in
    `js/core.js` attempted a literal, detailed side-profile falcon head
    (dark "hood," malar/mustache stripe, cere, a two-part hooked beak) via
    ~140 lines of hand-typed multi-point bezier `<path>` curves, written
    blind with no visual iteration in between. That's an extremely
    unforgiving way to get proportions right — realistic curved anatomy
    reads as "off" the moment any curve or angle is even slightly wrong,
    which is exactly what shipped (mismatched head/hood/cheek proportions,
    an oddly-placed rectangular "AI" chip glued onto the chest).
  - **New direction, chosen after rendering and visually inspecting 6
    iterations** (via the same HTML→Chromium-screenshot technique used
    for the OG image earlier this session, rather than shipping
    hand-typed paths blind again): an abstract "falcon in a stoop (dive),
    seen head-on" mark — two swept, pointed wing blades forming a shallow
    gull-wing silhouette, a small tail chevron below, and one glowing cyan
    "AI eye" at the convergence point where the wings meet. Abstract
    geometric marks built from a handful of simple curves are far more
    forgiving to execute correctly without an actual illustrator than
    literal anatomical realism — confirmed by the fact that the very first
    attempt at a literal, cleaned-up head+separate-hooked-beak (still
    realism-based) also came out rough (self-intersecting paths, a
    disconnected-looking beak) before the abstract wing-sweep direction
    converged cleanly within 2 iterations.
  - Preserved the exact `getValSVG(size, badge)` function signature, the
    per-call unique-gradient/filter-ID pattern (needed since the function
    can render multiple times on one page), and the `badge!==false` "VAL"
    text pill — so all 3 existing call sites (`js/about.js`'s 180px About
    page hero, `js/chat.js`'s two 28px chat-agent avatars) needed zero
    changes. The About page's description text ("One eye sees the real
    market. The other sees what the data reveals.") was already a metaphor
    referencing the single literal eye, so it still reads correctly
    unchanged against the new design.
  - Verified: `node -c js/core.js`; a direct render of `getValSVG(56,false)`
    confirming the mark stays clean and legible at small avatar sizes (no
    illegible clutter, unlike the old detailed version which likely
    degraded badly below 180px); and a real-browser Playwright screenshot
    of the actual About page mascot card confirming the new mark renders
    correctly with its glow/hover effects intact, zero console errors.

- **2026-07-15 (session 12, name clarification)**: User clarified DubAIVal's
  full name is "Dubai AI Valuation." Added "DubAIVal — short for Dubai AI
  Valuation" as a small subtitle line right above the mission headline on
  the About page (`js/about.js` `renderAbout()`) — the name origin wasn't
  explained anywhere in the app before this.

- **2026-07-15 (session 12, BETA badge + bigger logo, prompted by the
  user's actual LinkedIn post)**: User pointed out there was no visible
  "beta" indicator anywhere on the site, asked for the Home footer logo to
  be enlarged another 2-3x, and — after sharing a real screenshot of their
  actual LinkedIn post showing the link preview card — asked for the same
  "Beta" wording to appear in that shared-link preview too.
  - **No beta indicator anywhere — confirmed via a full-repo grep for
    "beta"** (the only hits were the unrelated Gemini `v1beta` API endpoint
    URLs). Added a real "BETA" pill badge next to the section title in the
    global mobile/tablet header (`js/app.js`, visible on every tab, not
    just Home) and next to "DubAIVal" in the desktop sidebar logo — this
    directly answers "where can I see the beta message," since it's now
    present everywhere the app is used, not just on first load.
  - **Home footer logo enlarged again**: 96px → 240px (2.5x), matching the
    user's explicit "2-3x bigger" request; kept full opacity from the
    earlier fix.
  - **LinkedIn/social link-preview text now says Beta too**: added
    "(Beta)" to `index.html`'s `<title>`, `og:title`, and `twitter:title`
    tags — this is the exact text LinkedIn/Twitter/Facebook/WhatsApp read
    to build their link-preview cards, confirmed against the user's own
    real LinkedIn post screenshot showing the card's bold title line.
    Regenerated `og-image.png` itself with a matching "BETA" pill badge
    added directly below the logo in the image, so the beta framing is
    consistent whether someone reads the card's title text or looks at the
    image.
  - Verified: `node -c js/app.js`; a real-browser Playwright screenshot
    confirming the "BETA" badge renders next to "Home" in the header and
    the enlarged 240px footer logo renders cleanly with no frame/box; and
    a visual check of the regenerated OG image. Rebuilt `www/` and synced
    the Android asset copies.

- **2026-07-15 (session 12, small follow-up)**: User asked for the Home
  footer logo to be bigger/clearer (`js/app.js` `renderHome()` — was 40px at
  85% opacity, too small for the logo's own detail — Burj Khalifa
  silhouette, small compass icon — to actually be visible). Enlarged to
  96px at full opacity. Separately, user reported a "gray box" still under
  the logo; a code check found no border/background/box-shadow on any of
  the 3 `logo.png` usages (header, footer, About page) — most likely a
  stale browser-cached copy of the pre-fix checkerboard `logo.png` from
  earlier this session, since (unlike the versioned `js/*.js?v=` files)
  `logo.png` had never had a cache-busting query string. Added
  `?v=20260715` to every `logo.png` reference across `index.html`,
  `js/core.js`, `js/app.js`, `js/about.js`, `js/chat.js` (favicon,
  apple-touch-icon, sidebar/header/mobile logos, footer logo, tour welcome
  icon, About page, and both native-notification icons) so any future logo
  change is guaranteed to bypass old cached copies without asking users to
  manually clear cache.

- **2026-07-15 (session 12, PWA install prompt + onboarding tour fully
  broken since long before this session + Home page redesign)**: Follow-up
  to the back-button fix above. User asked for 3 things: (1) a mobile "Add
  to Home Screen" install prompt; (2) a check of the old onboarding tour,
  which the user suspected was now completely broken after so many
  redesigns; (3) a review of two specific Home-page elements — the "Market
  Pulse" banner (single top-growth-area card, clickable, going to Market
  Index) and the "Top Opportunities" widget — asking whether both belong on
  Home, and specifically whether Top Opportunities is a genuinely useful
  tool worth upgrading.
  - **Onboarding tour — found to be catastrophically broken, far beyond
    stale content**: investigated the user's suspicion directly and found
    TWO separate infinite-loop bugs in `js/core.js`, either one of which
    alone means NO user has ever been able to see past the tour's very
    first "needTab" step (step 2 of 8 in the Quick Tour that runs
    automatically for every first-time visitor):
    1. `checkTourOnLoad()` runs at the end of every single `render()` call
       app-wide, with no guard against a tour already being active. The
       moment a tour step navigates to a different tab (`needTab` →
       `setSection()` → `render()`), that render's own `checkTourOnLoad()`
       call sees `dv_tour_done` still unset (the tour hasn't finished) and
       schedules a fresh `startTour("quick")` — silently resetting
       `DV_TOUR.step` back to 0. Caught this by scripting the exact
       Welcome → click Next sequence and observing `DV_TOUR.step` snap back
       to 0 a couple seconds after the click, with the Welcome card
       reappearing — this exactly matches the complaint of a tour that
       "never gets anywhere." Fixed with a one-line guard:
       `if(DV_TOUR.active)return;` at the top of `checkTourOnLoad()`.
    2. Independently, `showTourStep()`'s own `needTab` handling had no
       guard against re-navigating once already on the target page —
       every re-invocation (including the one the navigation itself
       triggers) saw `s.needTab` still set and called `setSection()` again,
       forever, meaning the function could never reach the code further
       down that actually builds and shows the tour card. Fixed by checking
       whether `currentSection`/`currentSubTab` already match the step's
       mapped destination before navigating again.
    - **On top of both infinite loops, verified 5 of the Quick Tour's 8
      steps and roughly half the Full Tour's 16 steps also had dead/stale
      selectors** once the loops were fixed and steps could finally be
      reached: the "AI Smart Search" step targeted the AI search bar hidden
      earlier this session; "Fair Price Checker" hunted for a button that
      no longer exists (Quick Check was redesigned into a budget-based
      building recommender in an earlier session); the Portfolio/Deal
      Network/Workspace steps used `_findTabBtn()`, which only searches
      `<button>` elements, while the actual bottom-tab-bar nav items are
      `<div>`s — so these could never be found regardless of text content,
      and 2 of the 3 also had the wrong substring ("Deals" doesn't appear in
      the real label "Deal Board"). In the Full Tour: "Investment
      Calculator" hunted a "Scenario" button that was never actually a
      `<button>`; "Sustainability Score", "Social Share"/WhatsApp, "Export
      CSV" (already a stubbed-out placeholder acknowledging the feature
      doesn't exist), "Price Anomaly Detection", and "Arabic PDF Reports"
      all targeted RESULT-PAGE-ONLY elements that only render after a user
      submits a real valuation — something the tour never does, so these
      were structurally unreachable by design, likely since the tour was
      first built; "RERA Verification" and "Deal Media Gallery" described
      the OLD pre-OFM Deal Board flow, dead since the OFM rebuild (see the
      2026-07-12 note elsewhere in this file). Rewrote both tours end to
      end: Quick Tour (8→7 steps, dropped a redundant "AI Valuation Engine"
      repeat) now uses `needTab` consistently for every step so the
      destination page is guaranteed to actually be showing, plus a new
      generic fallback (spotlight the now-active `.dv-bottom-tab`/
      `.dv-sidebar-item` when a step has no more specific target) that
      works uniformly regardless of which section it lands on. Full Tour
      (16 steps) replaced every structurally-broken step with a real,
      always-reachable current feature never requiring a submitted
      valuation: Map, Personal Advisor, Custom Report Builder, Notification
      Bell, Saved Searches, Live Market News, Social Media Manager, Video
      Platform, AI Agents, AI Chief of Staff, Price Alerts, Deal Network
      (reworded to describe the real OFM system's actual trust/verification
      features), and About. Added 4 missing `TAB_TO_SECTION` entries
      (`QuickCheck`, `Chiefs`, `News`, `Advisor`) needed for the corrected
      steps' navigation.
  - **PWA "Add to Home Screen" prompt (new)**: `js/core.js` gained
    `DV_PWA` state + `renderPwaInstallBanner()`, wired into `js/app.js`'s
    render() pipeline. Real `beforeinstallprompt` handling for Android/
    Chrome (defers the native prompt, shows a custom branded banner after a
    4s delay, "Install" button fires the real deferred prompt). Since iOS
    Safari never fires that event at all, added a separate iOS detection
    path (`checkPwaPromptOnLoad()`) showing manual "Tap Share, then Add to
    Home Screen" instructions instead. Scoped to mobile only (desktop never
    shows it, confirmed via UA-emulated Playwright tests), skips entirely
    if already running standalone/installed, and a dismiss sets a 14-day
    cooldown (`dv_pwa_install_dismissed_at`) so it doesn't nag every visit;
    accepting the real Android install (`appinstalled` event) permanently
    silences it via `dv_pwa_install_never`.
  - **Home page — Market Pulse banner removed, Top Opportunities upgraded**:
    read through both sections and found the "Market Pulse" banner's "Top
    Performing Area" card and Top Opportunities' own "1-Year Growth Leader"
    card were computed from the exact same metric (`AREAS[].g[0]`, highest
    1-year growth) — meaning the two adjacent Home sections showed the
    same area twice. Presented this finding plus a content/design
    assessment of Top Opportunities to the user via `AskUserQuestion`
    rather than unilaterally changing Home's layout, per the user's
    explicit request to consult first. User chose: remove the Market Pulse
    banner entirely, and upgrade Top Opportunities in both content and
    design.
    - **Content**: added a genuinely new 6th real metric, "Most Active
      Market" (highest `AREAS[].txVol` — transaction volume, a materially
      different signal from the existing "Fastest-Selling Market" speed
      metric — shows where buyers are actually closing deals, not just
      where listings move fast), computed in `generateMarketMoments()`
      alongside the existing 5 (Yield Champion, 1-Year Growth Leader,
      5-Year Capital Story, Best Combined Score, Fastest-Selling Market,
      plus the personalized "For You" prepend when applicable).
    - **Design**: redesigned each card in `renderMarketMoments()` from a
      compact text row into a larger, more scannable card — colored left
      accent bar + tinted icon badge per category, prominent bold
      "hero stat" number (e.g. "+7.0%", "10.5%", "48") pulled out to the
      right in the category's own color instead of buried inside a
      sentence, category tag badge moved next to the timing label, and a
      lift/shadow hover effect — while keeping the same real underlying
      data and click-through to Market Index.
    - `renderHome()`'s section numbering/comments renumbered (③→⑥ down to
      ⑤→⑥ shifted appropriately) after removing the old §③ block; no
      functional change to the sections after Top Opportunities.
  - Verified: a Playwright test scripting the exact tour click sequence
    confirming `DV_TOUR.step` no longer resets and the overlay correctly
    persists after a `needTab` navigation; a full walkthrough of all 7
    Quick Tour and all 16 Full Tour steps confirming every non-center step
    now has a real spotlight target and correct navigation, zero console
    errors; 3 separate Playwright passes (Android UA + simulated
    `beforeinstallprompt`, iOS Safari UA, desktop UA) confirming the PWA
    banner shows/hides exactly as designed on each platform with zero
    errors; and a real-browser screenshot of the redesigned Home page
    confirming "Market Pulse"/"Top Performing Area" text is gone, all 6 Top
    Opportunities cards render with real, distinct areas and stats (incl.
    the new "Most Active Market" card), and zero console errors. `node -c`
    on all touched files. Rebuilt `www/` and synced the Android asset
    copies (`npx cap sync android` still unavailable in this sandbox, same
    pre-existing limitation).

- **2026-07-15 (session 12, back-button bug found on real device after
  deploy)**: User deployed the pre-launch audit fixes above, then tested on
  a real phone and reported a real, reproducible bug: navigating from Home
  (or any tab) to another screen leaves no way to get back — asked for it
  to be found, fixed, and verified in both the website and the native app.
  Found and fixed 2 real, independent root causes in the shared SPA
  routing code (`js/core.js` `setSection`/`popstate`) and the native
  Capacitor hardware-back-button handler (duplicated in `index.html` and
  `scripts/build-www.js`, both of which load the same `js/core.js`).
  - **Root cause 1 (the primary one, native-app-only) — the Android
    hardware back button silently stopped working after the very first
    tab switch, for the rest of the session**: the old handler was
    `if(window.history.length>1){history.back();}else if(ev.canGoBack===
    false){App.exitApp();}`. `window.history.length` only ever GROWS during
    a WebView session — `history.back()` moves the position pointer but
    never shrinks the count — so once the user changes tabs even once,
    `length` permanently exceeds 1 and stays there for the rest of the
    session. That makes the `exitApp()` branch (and, more importantly, any
    correct "there's really nothing earlier, so this back-press should do
    nothing/exit" detection) permanently unreachable: once the user
    navigates back to Home and presses the hardware back button again, the
    code still takes the `history.back()` branch even though there is
    nothing earlier left in the WebView's session history — under Android,
    calling `history.back()` with no earlier entry is a silent no-op, so
    the back button just appears completely dead from that point on. Fixed
    by asking the SPA's own logical position instead of the unreliable
    history-length counter: `if(currentSection!=='Home'){history.back();}
    else{App.exitApp();}` — this is always accurate regardless of how deep
    `history.length` has grown, and correctly restores standard Android
    back-button behavior (step back through screens, exit on the root/Home
    screen) for the rest of the session, not just the first press.
  - **Root cause 2 (defensive, same-document recovery) — the popstate
    "safety net" for landing on a history entry with no SPA state could
    itself fail instead of recovering**: `core.js`'s `popstate` listener
    used to call `history.go(1)` whenever it saw a stateless entry, on the
    assumption there was always a valid forward entry to snap back into.
    That assumption doesn't hold after an Android WebView is killed and
    restored by the OS while backgrounded (a very common, well-documented
    Android memory-management behavior) — the restored history can lose
    its JS state objects while the entry count itself survives, so
    `history.go(1)` could land on another equally-stateless entry, or on
    nothing at all, leaving the app showing a broken/blank screen with no
    way to recover except a manual relaunch. Fixed by never relying on
    "what's already in history" for recovery: the handler now directly
    `pushState`s a fresh, known-good `{section:"Home"}` entry and re-renders
    — `pushState` never navigates the document anywhere, so this path can
    no longer land on a blank/foreign page; it deterministically returns
    the user to a working Home screen instead.
  - Deliberately did NOT try to prevent the browser's own back
    button/gesture from leaving the site entirely when the user backs past
    the app's very first history entry into whatever real page they were on
    before opening dubaival.com (e.g. a Google results page) — that's
    correct, expected browser behavior for a website, not a bug, and a site
    hijacking it to trap the user would be a worse anti-pattern than the
    one being fixed here.
  - Since `js/core.js` is loaded identically by the website, the Capacitor
    native Android build, and (per the file being loaded from both
    `index.html` and `scripts/build-www.js`) the native backButton handler,
    fixing it once in `js/core.js` + the two native-only copies covers both
    "the site" and "the application" per the user's explicit request. Ran
    `node scripts/build-www.js` to rebuild `www/` from the fixed source
    (confirmed both fixes landed in `www/index.html`/`www/js/core.js`) and
    manually synced the same 2 files into
    `android/app/src/main/assets/public/` since `npx cap sync android` still
    fails in this sandbox (no Android SDK/npm executable resolution here,
    same pre-existing limitation noted elsewhere in this file) — a real
    Capacitor sync from the user's own machine will pick up the same
    already-correct files.
  - Verified: a real-browser Playwright test driving actual multi-hop
    in-app navigation (Home → Market/Analyzer → Portfolio/Health →
    Network/Chat) then pressing real browser back 3 times — each hop
    correctly restored the exact previous section/sub-tab, matching
    expected SPA history behavior; a second test dispatching a synthetic
    stateless `popstate` event while remaining on the same document (the
    exact shape of the Android-process-restart failure mode) — confirmed it
    no longer throws and deterministically recovers to a working Home
    screen; and a direct logic simulation of the fixed native backButton
    handler confirming it now correctly branches to `history.back()` when
    away from Home and to `exitApp()` when at Home, unlike the old
    `history.length` check which made the latter unreachable after the
    first tab switch.

- **2026-07-15 (session 12, final pre-launch audit)**: User explicitly framed
  this as the last check before posting the site link on LinkedIn for beta
  — asked for a full check of anything missing for a complete beta site plus
  a general correctness pass across every tab. Found and fixed 2 real,
  launch-blocking bugs plus 1 stale-text bug; confirmed everything else via
  live-browser testing.
  - **Critical — `og-image.png` referenced in meta tags didn't exist at
    all**: `index.html`'s `og:image`/`twitter:image` tags have pointed at
    `https://dubaival.com/og-image.png` since the original SEO fixes, but
    the file was never created — sharing the link on LinkedIn/Twitter/
    Facebook today would have shown a blank link-preview card, a bad first
    impression for a launch post. Generated a real, branded 1200×630 OG
    image (dark navy + gold, logo, tagline, the 3 real headline stats —
    11,500+ properties/347 areas/±3% accuracy — matching the copy already
    used in the meta description) via an HTML template rendered through
    headless Chromium, and added `og-image.png` to the repo root. Confirmed
    Vercel serves an existing static file before evaluating the SPA-fallback
    `rewrites` rule, so no `vercel.json` change was needed.
  - **Critical, visible on every single page — `logo.png` had a literal gray
    checkerboard baked into its pixels, not real transparency**: confirmed
    via PIL that the file's mode was plain `RGB` (no alpha channel at all)
    and the "checkerboard" was real opaque pixel data (two alternating
    grays, ~64 and ~100) — almost certainly a design-tool export mistake
    (flattening a transparency-preview background instead of exporting a
    real alpha channel) that had shipped since the file was first added.
    Confirmed live via Playwright screenshot: the onboarding "Welcome to
    DubAIVal!" modal (the very first thing a new visitor sees) and the
    header logo both rendered as an obviously broken gray smudge/box, not a
    clean logo. Fixed by reconstructing a real alpha channel from luminance
    (checkerboard grays → fully transparent, white logo pixels → fully
    opaque, smooth threshold in between for anti-aliased edges) — verified
    by compositing the result onto the app's real dark-navy background,
    producing a crisp, correct logo. Propagated the fix to the two other
    on-disk copies (`www/logo.png`, `android/app/src/main/assets/public/
    logo.png`) used by the Capacitor/Android build pipeline, which were
    byte-identical stale copies of the same broken file. Re-generated
    `og-image.png` afterward so it also uses the corrected logo.
  - **Stale text — `manifest.json`'s description still said "6,162
    buildings"**: a leftover from session 3 (2026-06-18), long superseded
    by the current 9,226 residential + commercial/land totals. Updated to
    match the "11,500+ properties" line already used correctly in
    `index.html`'s own meta description.
  - **Full-app correctness sweep, no other bugs found**: a Playwright pass
    navigated into all 25 top-level tab/sub-tab combinations (Home, all 10
    Market sub-tabs, all 4 Portfolio sub-tabs, all 3 Network sub-tabs, all 4
    SocialMedia sub-tabs, all 3 More sub-tabs) — every one rendered
    non-trivial content with zero real console errors (the only errors seen
    were expected artifacts of this sandbox's plain Python test server,
    which can't serve `/api/*` POST routes or reach Google Maps/RapidAPI —
    not present against the real Vercel deployment). Two apparent
    duplicate-content findings from the initial sweep were investigated and
    confirmed NOT bugs: Portfolio's Assets/Health/Projections looking
    identical was the test script's own bug (used lowercase sub-tab ids
    instead of the real `"Assets"`/`"Health"`/`"Projections"`); SocialMedia's
    Studio/Avatar looking identical is correct, intentional behavior —
    `renderMediaStudio(mode)` shows the same "Sign In Required" gate for any
    mode when `DV_AUTH.user` is unset, and only diverges by mode past that
    gate. Also drove the Analyzer's real end-to-end flow (fill form → click
    "ANALYZE THIS DEAL ->" → wait for the real `computeValuation()` call) for
    a Burj Khalifa/Downtown Dubai 2BR test case — confirmed it reaches
    `stage:2` with a real, sensible result (fair price, confidence score,
    Fair Value verdict) and zero console errors, i.e. the app's most
    important page (per the Analyzer-accuracy directive at the top of this
    file) works correctly end-to-end. Also confirmed dark-mode toggle,
    EN→AR language switch, the legal disclaimer bar, and the "Report Issue"
    FAB all work with zero errors.
  - Verified: PIL-based pixel inspection of the logo before/after; a
    real-browser Playwright pass confirming the corrected logo renders
    crisply in the header, onboarding modal, and About page; the 25-tab
    navigation sweep; the full Analyzer submit-to-result flow; and the
    cross-cutting dark-mode/language/disclaimer/report-issue checks — all
    zero non-network console errors.

- **2026-07-15 (session 12, Phase 2 of the Video Editor work — pay-per-video
  real subtitles)**: Direct follow-up to the AI Video Editor audit above.
  User confirmed they want Phase 2 (real Whisper speech-to-text) built now
  so the infrastructure is ready — they'll fund `OPENAI_API_KEY` later —
  and explicitly specified the billing model: **pay-per-video, not a
  monthly subscription** ("نه اینکه ماهانه خرید کنه، برای هر ویدئو پرداخت
  کنه" — not a monthly purchase, pay per video).
  - **New Supabase migration**: `supabase-video-credits-schema.sql` (not
    yet run — see Outstanding items) adds `user_profiles.video_credits`
    (integer balance), a `stripe_events_processed` idempotency table, and
    two SECURITY DEFINER RPCs: `consume_video_credit(user_id)` (atomic
    check-and-decrement, returns false with zero side effects if the
    balance is already 0) and `add_video_credits(user_id, amount)` (used by
    both the purchase webhook and the automatic refund-on-failure path).
  - **`api/billing.js`**: new `action=video-checkout` — a ONE-TIME Stripe
    Checkout Session (`mode:"payment"`, price ~$2.99 via `price_data`
    inline, no pre-created Stripe Product/Price needed, tunable via
    `VIDEO_CREDIT_PRICE_CENTS`/`VIDEO_CREDIT_CURRENCY` env vars) — entirely
    separate from the existing Pro subscription checkout above it, per the
    explicit pay-per-video requirement. The shared webhook handler now
    branches on `session.mode`+`metadata.type` to grant 1 credit instead of
    flipping `is_pro`. Added a real idempotency guard (insert-or-skip into
    `stripe_events_processed` keyed by Stripe's event id) since crediting a
    balance — unlike setting `is_pro=true` — is NOT naturally safe against
    Stripe's webhook retry behavior; applies to both checkout paths.
  - **`api/proxy-video.js`**: new `engine:"whisper"`/`action:"transcribe"`
    branch, added to this EXISTING file rather than a new `api/*.js` file —
    the project is already at Vercel Hobby's 12-serverless-function ceiling
    (confirmed by listing `api/*.js`, exactly 12 non-`_lib` files; a past
    session already hit real 404s across the whole `/api` surface from
    exceeding this once, see the 2026-07-09 "Alerts — Email" note below).
    Reuses this file's existing `_resolveUserId()` (real Supabase
    access-token verification, not a trusted client header) and rate-limit
    conventions. Flow: resolve real signed-in user → atomically consume 1
    credit via `consume_video_credit` (fails closed with 402 + `needsCredit`
    flag if the balance is 0, before ever calling the paid API) → forward
    the client's compact audio (base64, capped ~9MB decoded) to
    `https://api.openai.com/v1/audio/transcriptions` (`whisper-1`,
    `verbose_json` for per-segment timestamps) → **refunds the credit
    automatically via `add_video_credits`** if the OpenAI call itself fails,
    so a failed transcription never silently costs the user money. Added
    `whisper: !!process.env.OPENAI_API_KEY` to the existing `engine_status`
    action and a `maxDuration:60` entry in `vercel.json` (this file
    previously had no explicit override).
  - **Client (`js/chat.js`, Video Editor)**: `extractAudioForTranscription()`
    — captures ONLY the audio track of whichever clip(s) are already
    selected for the final export (the same multi-clip array
    `renderWithOverlays()` uses), not the full original video, so credits
    aren't wasted transcribing footage that will be cut anyway and the
    returned timestamps already match the FINAL output's timeline with no
    remapping needed. Encodes to compact Opus/WebM (~32kbps — small enough
    to stay well under serverless body-size limits even for a 10-minute
    clip selection) via `MediaRecorder`, same real-time-capture technique
    `renderWithOverlays()` already uses (so extraction takes roughly as
    long as the selected clips' own duration — a real, disclosed cost of
    staying 100% client-side without a server-side transcoding pipeline).
    New "🎙 Generate REAL Subtitles (N credits)" button next to the existing
    free (visual-guess) "✨ AI Generate Subtitles" button, showing the
    live balance from `DV_AUTH.profile.video_credits`; shows a "Buy Credit"
    button when the balance is 0, wired to a new `_startVideoCreditCheckout()`
    (same pattern as the existing Pro-upgrade `_startStripeCheckout()`, just
    hitting `action=video-checkout`). `js/auth.js`'s existing
    `_fetchProStatus()` (runs on every sign-in) now also selects
    `video_credits` in the same query, rather than adding a second fetch.
  - Verified: `node -c` on all touched files; a mocked-fetch Node harness
    against the real `api/proxy-video.js` handler (4 cases — invalid token,
    zero credits never reaches OpenAI, success returns parsed segments,
    OpenAI failure triggers the refund call) and a second harness against
    `api/billing.js` (correct one-time-payment Stripe params, webhook grants
    a credit for `video_credit` metadata without touching `is_pro`, a
    duplicate webhook event id is deduped and not double-processed, the
    existing Pro-subscription webhook path is unaffected); and a real-browser
    Playwright pass driving the actual Video Editor UI end-to-end with a
    synthetic in-browser test video — confirmed the 0-credit state shows the
    Buy Credit button, the 2-credit state's button click genuinely extracts
    real audio (confirmed non-trivial base64 payload sent), calls the mocked
    Whisper endpoint, correctly parses the returned segments into the
    subtitle textarea with real M:SS timestamps, and correctly decrements
    the local credit count — zero console errors.
  - **Manual steps required before this goes live** (flagged below in
    Outstanding items too): (1) run `supabase-video-credits-schema.sql` in
    Supabase SQL Editor, (2) set `OPENAI_API_KEY` in Vercel env vars, (3)
    confirm `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are set (needed
    already for the existing Pro checkout — video-checkout reuses them),
    (4) optionally set `VIDEO_CREDIT_PRICE_CENTS`/`VIDEO_CREDIT_CURRENCY` to
    override the ~$2.99 default. Until (1)+(2) are done, the "Generate REAL
    Subtitles" button will show a clear configuration error rather than
    silently failing or charging anyone — Stripe checkout itself
    (`action=video-checkout`) only needs (3) and already works today.

- **2026-07-15 (session 12, AI Video Editor audit)**: User asked for a full
  review of the AI Video Editor (`showVideoEditor()`, `js/chat.js`) against
  their original vision: upload up to a 10-minute walkthrough, AI picks the
  best parts and edits them together, cleans audio noise, upscales quality,
  optionally overlays images/charts on request, adds subtitles in any
  language, and produces a professional result — explicitly meant as a
  hook for agents/small brokerages who can't afford or don't have time for
  a real editor. Read the full ~750-line implementation before touching
  anything. Found the tool was far short of that vision AND had a
  100%-reproducible crash bug. Presented findings + a two-phase plan (Phase
  1: free correctness/logic fixes now; Phase 2: real paid services —
  transcription, server-side rendering, upscaling — needs the user's
  vendor/budget decision) via `AskUserQuestion`; user chose "Phase 1 now +
  review Phase 2 options."
  - **Critical pre-existing bug found and fixed — the editor has never
    actually opened**: `showVideoEditor()` called `switchTab("Auto-Pilot")`
    immediately after building the tab bar, but `renderAutoPilotTab()`
    (invoked synchronously through that call) reads `PLATFORMS` — a `var`
    declared much later in the same function. `var` only hoists the NAME,
    not the value, so `PLATFORMS` was still literally `undefined` at that
    point, and `Object.keys(undefined)` threw a TypeError before the modal
    was ever appended to `<body>`. This meant clicking to open the AI Video
    Editor has silently done nothing (or thrown a console-only error) on
    every single attempt, in every session, since this feature was built —
    not a corner case. Fixed by moving the initial `switchTab("Auto-Pilot")`
    call to the very end of the function, after every `var` it (and the
    render functions it triggers) depends on has a real value. Caught by
    building an in-browser synthetic test video and driving the actual
    `showVideoEditor()` function end-to-end via Playwright — it threw
    immediately, before the fix.
  - **Real bug — "Background Music" was a decorative lie**: the Auto-Pilot
    UI always marked "🎵 Background Music: Luxury ambience" as a completed
    step (a green checkmark), but `renderWithOverlays()` never mixed in any
    music at all — it just re-added the source video's own audio track
    unchanged. Fixed for real: reused `_createMusicBed()` (the synthesized
    ambient-pad generator already built for the separate AI Video
    Generator/`VGEN` feature, zero cost, zero licensing risk since it's
    pure Web Audio oscillators, not licensed samples) — extended it to
    accept an optional external `{ctx,dest}` so it can mix into an
    `AudioContext` graph the caller already owns (100% backward compatible;
    existing call sites that don't pass this get their own new context
    exactly as before, verified no behavior change). `renderWithOverlays()`
    now builds one shared `AudioContext`, routes the video's own audio
    through a gain node and the music bed (ducked to 45% when the video has
    its own audio, full volume if it doesn't) into one mixed destination,
    and uses THAT as the recording's audio track. Added a real music picker
    (5 presets + None) to the Edit tab, wired to `VIDEO_EDITOR_STATE.musicType`.
    Verified via a synthetic in-browser test video with a real oscillator
    tone as its "narration" — the rendered output's `captureStream()`
    reported `getAudioTracks().length === 1` (a real, present, non-silent
    mixed track), confirming actual mixing occurred, not just no-op code.
  - **Real gap — "best parts" was always exactly one continuous window**:
    matches the user's own framing almost verbatim ("انتخاب بهترین
    قسمت‌های ویدئو" — select the best PARTS, plural) — the AI
    (`aiAnalyzeVideo`) only ever returned one `trimStart`/`trimEnd` pair,
    and `renderWithOverlays()` had no way to render anything else. For a
    real 10-minute walkthrough (the user's explicit target length), this
    meant one 15-30s slice near wherever the AI happened to land, with the
    other ~9.5 minutes of footage completely ignored. Fixed:
    `aiAnalyzeVideo()` now asks Gemini for up to 3 non-overlapping segments
    picked from ACROSS THE WHOLE VIDEO (each sampled frame is labeled with
    its real timestamp in the prompt so the AI can reference specific
    moments), with defensive clamping/sorting/deduping of whatever it
    returns against the real video duration so a malformed AI response
    can't produce an invalid render. `renderWithOverlays()`'s draw loop was
    generalized from a single `s`/`e` window to iterate a `clips` array,
    seeking to each clip's start and stitching them back-to-back into one
    continuous recording (subtitle timestamps are now measured in the
    FINAL STITCHED output's own timeline, not the source video's, so they
    stay in sync across a multi-clip stitch — the AI prompt asks for
    exactly this convention directly, avoiding any extra remapping code).
    Manual single-window trimming in the Edit tab is unaffected and stays
    fully backward-compatible (a 1-item `clips` array is mathematically
    identical to the old `s`/`e` approach) — editing the trim inputs by
    hand always clears any AI-picked `clips` so a manual override wins.
    Also raised frame sampling from a flat 10-frames-total cap to scaling
    with duration (~1 frame per 8s, up to 20) — 10 fixed frames across a
    10-minute video was one frame every 60s, nowhere near enough signal to
    identify multiple distinct "best moments." Verified via the same
    synthetic-video Playwright test with 2 AI-picked clips at different
    points in the source video — the real rendered output blob's duration
    (~3.07s) closely matched the two clips' combined expected length
    (~2.93s), confirming genuine multi-segment stitching, not just the
    first clip alone.
  - **Honesty fix — "AI Subtitles" doesn't mean transcription**: the tool
    can only ever see still frames (Gemini vision) or, for the standalone
    "AI Generate Subtitles" button, no video content at all — it has never
    had any way to hear or transcribe what's actually said in a video. The
    UI never disclosed this, so "AI Subtitles: Auto-generated" reads as if
    it captures the agent's real narration, when it's actually AI-guessed
    marketing text merely synced to timestamps. Added a plain-language note
    directly above the subtitle textarea and reworded the Auto-Pilot step
    label to "Suggested, not transcribed" — real word-for-word subtitles
    still need Phase 2 (a real speech-to-text service), flagged below.
  - **Not done this session (Phase 2 — needs the user's vendor/budget
    decision, discussed but not built)**: real speech-to-text subtitles in
    any language (e.g. Whisper API, ~$0.006/min — cheapest, highest-value
    gap to close first), real server-side rendering to replace the
    client-side real-time canvas-capture approach entirely (a 10-minute
    video currently takes ~10 real minutes to render in-browser with the
    tab open — a dedicated video-editing API like Shotstack/Creatomate
    would also handle this), real audio noise reduction, and real AI
    upscaling — none of these are achievable for free/client-side, and
    upscaling specifically is slow/costly enough it would need an async
    job+webhook pattern rather than a synchronous request.
  - Verified: `node -c js/chat.js`; two full Playwright passes driving the
    actual `showVideoEditor()` UI against an in-browser-generated synthetic
    video (canvas + oscillator tone, recorded via `MediaRecorder`) — (1)
    manual Edit-tab flow: load video → set 2 clips + music → click "Render
    Video" → real MP4 output with correct stitched duration and a present
    audio track; (2) full one-click Auto-Pilot flow with a mocked
    multi-clip Gemini response → AI clips applied → color grade/caption
    applied → rendered → real output with the AI's exact clips reflected in
    state and a non-empty caption — zero non-network console errors in
    either run, and the first run is what caught the modal-crash bug (it
    threw before the fix, rendered cleanly after).

- **2026-07-15 (session 12, small follow-up)**: User noted `logo.png` was
  never shown anywhere prominent (it was already wired into the header,
  favicon, and About page, but not the Home tab) and asked for it to appear
  at the bottom of the home page — explicitly fine with the current white/
  silver version of the logo for beta (the gold version is reserved for the
  live/main site later). Added a small centered footer (`renderHome()`,
  `js/app.js`) right after the "Your Portfolio" section: the same
  `logo.png` at 40px, 85% opacity, plus a "DubAIVal · Built in Dubai"
  caption — matches the plain-text footer pattern already used on the About
  page. Confirmed via a real-browser Playwright screenshot (scrolled to the
  bottom of Home) that it renders correctly and doesn't collide with the
  separate, pre-existing global legal-disclaimer bar (`js/core.js`,
  unrelated, always shown beneath the bottom tab bar).

- **2026-07-15 (session 12, one more follow-up)**: User directly questioned
  the flat -10%/-5% developer-furnished discount added in the previous
  entry — pointed out that 10% of a 15M unit or a 30-40M penthouse is a
  huge absolute number to knock off just for "unfurnished," and asked for
  this specific part of the engine (the site's most important page, per
  this file's own Directive #2) to be checked carefully. Investigated and
  confirmed the concern was exactly right — a real, previously-undetected
  accuracy bug in `computeAdjustedPSF()` (`js/valuation.js`):
  - **The numbers, before the fix**: a flat -10% on a developer-furnished
    15M unit stripped to "Unfurnished" = **-1,500,000 AED**; on a 40M
    penthouse = **-4,000,000 AED**. Meanwhile the sibling logic for
    OWNER-furnished buildings (adding furniture to a bare unit) already
    correctly graduates the premium DOWN as price rises (1.5%/1% at ≥30M,
    up to 10%/5% under 2M) — reflecting that a real furniture package costs
    roughly a FIXED AED amount, not a fixed % of the unit's price. The
    dev-furnished branch never got this same treatment when it was added —
    a flat percentage on a nonexistent line item (furniture that costs a
    fixed amount) that grows without bound as the property gets more
    expensive is simply wrong, and produced a 6-8x mismatch against what the
    exact same table already charges for ADDING furniture at the same price
    point (e.g. at 30M: -3,000,000 AED to remove vs. only +450,000 AED to
    add — should be roughly symmetric).
  - **Fix**: the developer-furnished branch now reuses the EXACT SAME
    graduated `fRate` table already used (and already correct) for the
    owner-furnished branch, applied as a discount instead of a premium.
    Verified this produces sensible, real-world furniture-package-sized
    numbers post-fix: ~AED 213K for a 900sqft/2.2M unit down to ~AED
    595K for a 7,000sqft/42M penthouse — vs. the old 1.5M-4M range.
  - **Zero regression on owner-furnished (non-dev) buildings**: the `estVal`/
    `fRate` computation was only moved up in the function (now computed
    once, used by both branches) — a before/after diff against the pre-fix
    file across 4 owner-furnished test cases (various furnish states, with
    and without a DB building match) came back byte-identical; only the 4
    developer-furnished test cases changed, exactly as intended.
  - **UI text fixed to match**: the "FURNISHED NOTICE" card and Confidence
    Factors row (`js/market.js`) both hardcoded literal "−10% applied"/
    "−5% applied" strings for the developer-furnished case — now show the
    actual computed `val.furnP` percentage instead, so the displayed number
    always matches what was actually applied to the valuation.
  - Verified: `node -c` on both touched files; a Node harness confirming
    the graduated discount produces realistic absolute AED figures across
    5 price/size combinations; a byte-identical before/after diff test for
    every owner-furnished (non-dev) case; and a real-browser Playwright
    pass analyzing a genuine 32M penthouse (Vida Dubai Mall, Unfurnished)
    confirming the notice now reads "-2% applied" (not the old flat
    "-10%"), zero non-network console errors.

- **2026-07-15 (session 12, continued once more)**: Follow-up to the
  negotiation-feature session above — user asked for (1) the same AI
  negotiation strategy extended to rentals, (2) a check that buyer/seller
  reports actually work correctly "دقیقا فیکس و کاربردی باشه", (3) a
  reported bug where two buildings in the same area (Blvd Heights vs Vida
  Dubai Mall) showed identical distances to Dubai Mall/DIFC/airport, and
  (4) a reported bug where marking a Vida Dubai Mall unit's furnishing
  status showed "owner-furnished" in the alarm/notice, which is wrong since
  Emaar's own Address/Vida/Palace-branded residences come developer-
  furnished. Found and fixed 5 real, independent bugs while investigating:
  1. **Real crash bug — bigger than the agent-only one fixed earlier**: the
     PERSONAL (non-agent) mode "Expert Commentary" AI prompt builder (both
     villa and apartment sale branches, `js/market.js`) had the EXACT SAME
     unconditional `vv.suggestedOffer.toLocaleString()` crash already fixed
     in `getAgentAIPrompt()` — meaning ANY regular user (not just agents)
     analyzing a DISTRESS/GOOD-verdict (undervalued) property in Personal
     mode got a silent crash and never saw the AI commentary at all. Fixed
     both call sites the same way (fallback to `fairPrice` when
     `suggestedOffer` is null). Confirmed via a live Playwright run with a
     genuine DISTRESS-verdict test property (verdict:"DISTRESS",
     suggestedOffer:null) — crashed before the fix, rendered cleanly after.
  2. **Real bug — rental agent mode silently dropped the landlord report**:
     `renderRentalResult()` fetched and stored `analyzerState.aiTextSeller`
     (the landlord-facing report, generated whenever `reportFor` is
     "seller"/"both") but never once rendered it anywhere — an agent
     generating a rental "Both Reports" never saw the landlord half at all,
     silently. Also, the tenant report was always labeled generic "Rental
     Expert Commentary" even in agent mode, unlike the sale flow's
     "Agent Report — Buyer/Seller" labeling. Fixed: added the missing
     `aiTextSeller` render block ("Agent Report — Landlord"), and made the
     tenant-side label agent-aware ("Agent Report — Tenant" in agent mode).
  3. **Rental negotiation strategy added, mirroring the sale-side feature**:
     new `getRentalNegotiationStrategyPrompt()` (landlord/tenant instead of
     seller/buyer, closing a lease instead of a sale) fired as a 3rd AI call
     whenever agent mode is used for a rental (both villa/apartment
     branches), plus a new deterministic "Landlord/Tenant Deal Intelligence"
     card in `renderRentalResult()` (landlord's floor / sweet spot /
     tenant's cap, deal probability, Talking Points) — the rental
     counterpart to the sale flow's "Agent Deal Intelligence", previously
     completely absent from the rent flow. `getRentalAgentAIPrompt()` itself
     was audited and found to have no similar null-reference risk (doesn't
     reference `suggestedRent`), so no fix needed there.
  4. **Furnished-notice gate bug fixed**: the "FURNISHED NOTICE" card only
     showed when the user selected Furnished/Semi-Furnished, but
     `computeAdjustedPSF()` (`js/valuation.js`) applies a real -10% discount
     when a DEVELOPER-FURNISHED building (Vida/Address/etc., `bData.df:1`)
     is marked "Unfurnished" — a real, non-obvious price impact the old gate
     hid completely, with zero explanation to the user. Fixed by showing the
     notice whenever `val.isDevFurnished` is true (any furnished status) or
     Furnished/Semi-Furnished is selected on any building.
  5. **Root cause of the reported furnishing bug — a real, narrow data gap,
     fixed per explicit user authorization** (same one-off exception pattern
     as session 11w — this branch does not normally touch
     `js/data-residential.js`): `computeValuation()`'s `isDevFurnished` flag
     reads `bData.df` from the building database, and the canonical "vida
     dubai mall" entry already correctly had `df:1` — but cross-referencing
     every "vida"/"address"/"palace" (Emaar hospitality brand) entry in the
     DB found 7 sibling name-variants for the exact same real buildings were
     missing the flag despite an identically-named/psf sibling having it:
     `vida residences dubai mall t1`/`t2`, `vida residences downtown`,
     `vida residences creek harbour`, `vida marina dubai`,
     `address beach resort residences`, `palace residences creek blue tower
     2`. A user typing/selecting one of these variants (very plausible via
     the building search autocomplete) got `isDevFurnished:false` and the
     wrong "OWNER-FURNISHED UNIT" notice. Added `"df":1` to all 7 (644→651
     total `df:1` entries DB-wide). Deliberately did NOT touch Fairmont/
     Waldorf Astoria/Kempinski/Grosvenor House/W Residences/Bulgari/Banyan
     Tree brand entries found with the same kind of internal inconsistency
     during the same audit — these are hotel-operator brands under
     different developers, not Emaar's own Address/Vida/Palace hospitality
     brands the user specifically named, so fixing them would need separate
     verification, not assumption. Verified via a Node harness confirming
     `lookupBuilding()` now resolves `df:1` for 6 of the 7 real-world name
     variants (the 7th follows the identical pattern).
  6. **Distance-to-landmarks issue — investigated, explained, not a bug per
     se, clarified in the UI**: confirmed both "Blvd Heights" and "Vida
     Dubai Mall" are tagged `"a":"Downtown Dubai"` in the DB, and the
     "Location Intelligence" card's Metro/Mall/Business/Airport distances
     come from `computeGeoScore(f.area)` (`js/data-residential.js`) — an
     AREA-level lookup, not a per-building one, so every building sharing an
     area byte-for-byte shares these figures by design (this value also
     feeds the valuation engine's location-premium adjustment, so it
     couldn't be casually changed to per-building without a much larger data
     project — real per-building lat/lng data doesn't exist in the DB today
     — and `computeGeoScore` itself lives in the data file this branch
     doesn't own). Rather than leave this looking like an unexplained bug,
     added a clear "Area-wide baseline · {area}" subtitle and a footer note
     directly under the card explaining every building in that area shows
     the same numbers here, and pointing to the already-live,
     genuinely building-specific Nearby Amenities/Drive Times cards
     immediately below (these two already geocode the actual building name
     via Google Maps, confirmed by reading their query-building code path —
     not touched, already correct).
  - Verified: `node -c` on both touched files; a Node harness confirming
    `lookupBuilding()` correctly resolves `df:1` for the fixed building name
    variants; re-ran `tools/generate-seo-pages.js` per the standing rule
    after the data-residential.js change; and 4 real-browser Playwright
    passes — (1) personal-mode sale analysis of a genuine DISTRESS-verdict
    property confirming the AI commentary no longer crashes, (2) full
    agent-mode RENTAL flow (unlock phone → Both Reports → submit) confirming
    both Tenant and Landlord agent reports render, the new Landlord/Tenant
    Deal Intelligence card and its Negotiation Range/Talking Points render,
    and the new AI Negotiation Strategy renders with correctly-routed mocked
    content, (3) a sale-flow analysis of Vida Dubai Mall confirming the new
    "Area-wide baseline" Location Intelligence subtitle and footer note
    render correctly, zero non-network console errors in any run.

- **2026-07-15 (session 12, continued yet further)**: Beta-launch decisions +
  agent-gate relaxation + negotiation-feature review, per the site owner's
  request to prepare for beta and specifically re-check the Analyzer's
  agent-only negotiation feature against their original idea ("دقیقا این
  بخش هم چک کن که با توجه به ایده من درست اجرا بشه").
  - **Beta-launch questions answered directly (not implemented, just
    advised)**: (1) app is beta-ready as-is; (2) login — recommended open
    access with no login gate for beta (matches the existing
    `// Auth is optional — no gate` behavior already in `js/app.js`), with
    Google Sign-In as a good LATER addition once the team wants it — Google
    OAuth isn't wired into `js/auth.js` at all yet and would need the user
    to manually enable the Google provider in Supabase Dashboard
    (Authentication → Providers) plus a Google Cloud OAuth Client
    ID/Secret — an external setup step outside this session's reach; not
    built this session since the user didn't confirm they want it yet.
  - **Agent gate relaxed from RERA to phone-only** (`js/market.js`,
    `isRegisteredAgent()`): previously checked a `.rera` field on the local,
    self-reported `dv_agent_profile` object (populated only by Workspace's
    Report Builder "Your Details" section) — confirmed via grep this was
    never actually RERA-verified against anything (the real, Supabase-backed
    RERA/agent system is `dv_agents`/`supabase-referral-schema.sql` in
    `js/deals.js`, completely separate and untouched), so relaxing it
    doesn't weaken any real verification. Now checks `.phone` instead, and
    the previously-inert "locked" Agent Report button (which only showed a
    dead tooltip) now opens a real inline phone-number-entry prompt right in
    the Report Type card — entering a number saves it to `dv_agent_profile`
    and immediately unlocks Agent Report mode. No RERA required during beta,
    per the site owner's explicit instruction.
  - **Negotiation feature audit — found and fixed 3 real issues**: read the
    full Agent Report pipeline (`getAgentAIPrompt`/`getRentalAgentAIPrompt`,
    the "Agent Deal Intelligence" card in `renderAnalyzerResult`) against the
    user's stated idea — an AI report that tells the AGENT (not the client)
    what negotiation method to use with both buyer and seller to close the
    deal.
    1. **Real crash bug found**: `getAgentAIPrompt()` unconditionally called
       `val.suggestedOffer.toLocaleString()`, but `computeValuation()`
       (`js/valuation.js`) deliberately sets `suggestedOffer=null` for
       DISTRESS/GOOD verdicts (already a good deal — no lower offer to
       suggest). This meant clicking "GENERATE AGENT REPORT" threw an
       uncaught exception and silently produced nothing whenever the
       property being analyzed was a good deal — exactly the cases most
       worth showing a client. Fixed by falling back to `fairPrice` when
       `suggestedOffer` is null. Caught via a real Playwright run against a
       genuine GOOD-verdict test property, not by inspection.
    2. **Scope gap**: the existing "Agent Deal Intelligence" card (real,
       deterministic seller-floor/sweet-spot/buyer-cap numbers plus a
       templated "Talking Points" section addressing both FOR BUYER/FOR
       SELLER) already existed and was a good foundation — but it only
       rendered when the agent picked "Both Reports" specifically, even
       though none of its numbers actually depend on that choice (they're
       computed straight from the valuation, not from `reportFor`). An
       agent generating just a Buyer or Seller report never saw it. Ungated
       to show for any agent-mode sale report.
    3. **The actual gap vs. the user's idea**: `getAgentAIPrompt`'s two
       AI-generated reports are CLIENT-facing marketing copy ("writing a
       compelling buyer/seller report... Do NOT mention you are AI") — not
       what the user asked for (advice TO the agent on negotiation
       methodology). The deterministic "Talking Points" partially covered
       this but wasn't genuinely AI-authored strategy. Added a new
       `getNegotiationStrategyPrompt()` + a 3rd AI call fired whenever
       agent mode is used for a sale, producing a real AI-authored,
       step-by-step negotiation strategy (opening move with seller, opening
       move with buyer, how to bridge the gap toward the sweet spot,
       likely objection from each side and how to defuse it, closing
       technique) — explicitly instructed to address the agent directly
       ("you"), name specific real techniques (anchoring, mirroring,
       calibrated questions, the flinch, deadline pressure), and NOT be
       client-facing copy. Rendered as a new "AI Negotiation Strategy — For
       you, the agent" card appended to the existing Agent Deal
       Intelligence section, right after Talking Points — deliberately kept
       as a separate block from the deterministic numbers (never lets AI
       drift touch the real seller-floor/sweet-spot/buyer-cap figures,
       matching this file's Analyzer-accuracy directive). Scoped to the
       sale flow only this session (matches where "Agent Deal Intelligence"
       already lived); the rental agent-report flow (landlord/tenant, not
       buyer/seller) wasn't extended with an equivalent negotiation-strategy
       block — flagged as a possible follow-up, not done here since the
       user's example was framed around buyer/seller/closing a sale.
  - Verified: `node -c js/market.js`; a standalone Node test extracting
    `getNegotiationStrategyPrompt()` and confirming it embeds the exact
    real seller-floor/sweet-spot/buyer-cap/deal-probability numbers,
    addresses the agent directly, and explicitly states it is not
    client-facing copy; and 3 real-browser Playwright passes with a mocked
    `/api/proxy-groq` route distinguishing the 3 prompt types by content —
    (1) the full unlock-phone → select "Both Reports" → submit flow for an
    apartment, confirming the phone saves to `dv_agent_profile`, mode
    switches to agent, and all of Agent Deal Intelligence/Negotiation
    Range/Talking Points/AI Negotiation Strategy render with the correct
    mocked text (this run is what caught the `suggestedOffer` crash before
    the fix — first attempt threw, second attempt after the fix rendered
    cleanly); (2) the same flow for a villa with `reportFor:"buyer"` (not
    "both"), confirming the ungated Agent Deal Intelligence card and AI
    Negotiation Strategy still render correctly; zero non-network console
    errors in either passing run.

- **2026-07-15 (session 12, continued even further)**: Added an "All" view
  to the Market Dashboard's PSF Trend chart (`js/market.js`), per user
  request to show the full market cycle "like Bitcoin's All-time chart"
  with ups and downs. User initially believed real DLD data went back
  18-20 years; investigation found the app's real granular monthly PSF
  data (`PSF_CHART_DATA`) only covers 2023-06 onward (~3 years) — the "20
  years" reference elsewhere in the app was a plain text list of 7 broad
  eras with rough % ranges (`cycleRows`, e.g. "2002-08: +400%"), not exact
  month-by-month figures. Flagged this to the user rather than fabricating
  precise historical PSF numbers for years with no real data loaded.
  - **Real-data path (for later)**: wrote `tools/build-market-cycle-index.js`
    — reuses `tools/calibrate-db.js`'s exact CSV column-mapping/parsing/PSF
    logic but, unlike that tool (which discards everything before
    2024-01-01), processes the FULL raw DLD transactions CSV to compute a
    real year-by-year residential median PSF and turn it into an index
    (base 100 at the earliest reliable year, `--minTxPerYear=` guard,
    default 30). Verified against a synthetic CSV modeling a realistic
    2002-2026 boom/bust cycle — correctly reconstructed the known shape and
    produced a clean `tools/market-cycle-index.json`. Requires the user to
    run this locally against their real, unfiltered DLD CSV (same one used
    for building calibration) and share back the small output — not
    runnable in this remote session since the CSV lives only on the user's
    machine.
  - **Shipped now**: after the user clarified ("خودت... با توجه به داده
    هایی که در فضای آنلاین وجود دارد بهترین راه حل رو فیکس کن" — combine
    what we have with what's publicly known), added `MARKET_CYCLE_INDEX` —
    a real index (base 100 = 2002) reconstructed via compound growth from
    the SAME 7-era cycle narrative already trusted and displayed elsewhere
    in the app (freehold boom, 2008 GFC crash, recovery, 2014-19
    correction, COVID dip, 2021-25 post-pandemic super-cycle, 2026
    moderation) — not new/different numbers, just the existing trusted
    percentages turned into a real per-year curve instead of a static list.
    Verified the index exactly reproduces each era's stated cumulative %
    change at its boundary years (e.g. 2002→2008 is exactly +400%,
    2008→2011 exactly -50%). Explicitly labeled "Illustrative" throughout
    (header, footer, stats) — never presented as exact DLD-verified
    figures, unlike the real monthly PSF data the 6M/1Y/3Y views already
    use, per this file's Analyzer-accuracy directive extended in spirit to
    every other numeric claim in the app.
  - **Chart wiring**: added "All" as a 4th toggle button alongside
    6M/1Y/3Y. In "All" mode: the per-area dropdown is hidden (replaced with
    a "Dubai — citywide residential index" note, since the index is a
    citywide reconstruction, not per-area) and the Y-axis switches from
    "AED PSF" to a plain index number; the "Current PSF"/"Range" stat
    labels adapt to "Current Index"; X-axis labels show years instead of
    year-month; the footer note explains the illustrative methodology.
    6M/1Y/3Y views are otherwise completely unchanged (still real DLD
    monthly PSF per area).
  - **Removed the old static "Market Cycle · 20-Year History" text list**
    further down the Market Dashboard — it showed the exact same 7-era data
    the new "All" chart view now visualizes properly, so keeping both would
    have been the same duplicate-information problem this session already
    fixed elsewhere (Analyzer AI bar, Find's Screener vs Quick Check).
    Replaced with a shorter "Current Market Conditions" card keeping only
    the live geo-adjustment note (real, dynamic, uses `LIVE_GEO.adj` +
    `_currentMonthYear()`) and a pointer to the new chart.
  - Verified: a Node test regex-extracting `MARKET_CYCLE_INDEX` from the
    file and checking every era's start/end index values against its stated
    % change (all within 0.1 percentage point, confirming the compounding
    math is correct) plus structural checks (25 consecutive years,
    base-year index of exactly 100, no unreasonable values); `node -c`; and
    a real-browser Playwright pass — clicked "All", confirmed the header/
    labels/stats switch to the index view and the area dropdown is replaced
    by the citywide note, confirmed years like 2002/2008 render on the
    chart, then switched back to "1Y" and confirmed the original PSF view
    is fully intact (no regression) — zero non-network console errors.

- **2026-07-15 (session 12, continued further)**: Renamed Find's "Smart
  Property Discovery" to "Advanced Market Screener" and made it genuinely
  live, per direct user request after noticing it overlapped functionally
  with Quick Check: "دقیقا اسمش رو تغییر بده و اگر بتونی لایوش کنی... با
  توجه به وضعیت بازار پیشنهاد بده نه فقط db... ترکیبی بده که نتایج واقعی و
  حرفه‌ای‌تر باشه" (rename it, and make it live if you can — recommend
  based on market conditions, not just the static DB, blend DB + live for
  more real/professional results).
  - **Root cause confirmed**: the Screener's per-building PSF/rent/DOM/tx-
    volume/growth all came from a plain `AREAS[bData.a]` static lookup
    (`js/app.js` line 178, pre-change) — the exact static database numbers,
    with zero connection to the live daily-refreshed market data
    (`DYNAMIC_BENCHMARKS`) or the AI momentum-trend signal
    (`MARKET_MOMENTUM`) that the Analyzer itself already blends in via
    `computeAdjustedPSF()`. So results could look "undervalued" against a
    stale static number while the live market had already moved.
  - **New shared function**: extracted `getLiveAreaData(area)`
    (`js/valuation.js`) — the exact static+live blending logic
    `computeAdjustedPSF()` already used (static `AREAS[]` blended with
    `DYNAMIC_BENCHMARKS` PSF/rent/DOM/tx-volume + realized 1yr growth from
    `price_history`) — as a standalone, reusable function.
    `computeAdjustedPSF()` itself now just calls `getLiveAreaData()`
    instead of repeating the blend inline; verified via a Node harness
    diffing `computeValuation()`'s full JSON output across 5 real test
    cases (apartment/villa, matched/unmatched building) both with and
    without live `DYNAMIC_BENCHMARKS`/`MARKET_MOMENTUM` present — byte-
    identical before/after the refactor in every case, so the Analyzer's
    own numbers (governed by the accuracy directive at the top of this
    file) did not shift by even one digit.
  - **New `getLiveAreaDataWithMomentum(area)`**: a second, separate function
    that calls `getLiveAreaData()` and additionally nudges the growth figure
    by the AI-estimated recent momentum trend (`getMomentumFactor()`,
    `market_momentum` table) — kept deliberately separate from
    `getLiveAreaData()`/`computeAdjustedPSF()` so this additional signal
    only affects the Screener, never the Analyzer's validated valuation
    numbers. Verified: for a test area with mocked live data (real PSF/DOM/
    growth blend) + an "up, high-confidence" momentum row, the Screener's
    area data correctly showed a higher growth figure than the static-only
    or live-without-momentum versions.
  - **Wired into the Screener** (`js/app.js`, "DISCOVER PROPERTIES" handler):
    replaced the static `AREAS[bData.a]` lookup with a per-area cache
    (`_screenerAreaData()`, computed once per distinct area across the
    ~9,226 buildings, not once per building) calling
    `getLiveAreaDataWithMomentum()` — every filter (yield/growth/DOM) and
    every result's displayed figures now reflect blended live+static data
    instead of fixed historical numbers.
  - **Renamed** throughout: card title "◆ Smart Property Discovery" → "◆
    Advanced Market Screener", description updated to mention the live
    blend, plus the 3 code comments in `js/map.js`/`js/market.js` that
    referenced the old name as a deep-link target, and this file's
    forward-looking architecture references (Find's tab feature list, the
    render-function table) — historical dated work-log entries describing
    past sessions were left as-is (accurate for the session they describe).
  - Verified: `node -c` on both touched files; the Node harness above (5
    cases × 2 data scenarios, all byte-identical for the Analyzer); and a
    real-browser Playwright pass — confirmed "Advanced Market Screener"
    renders (old name gone), a live-vs-static comparison inside the running
    app showed the expected blended DOM/growth difference once mocked
    `DYNAMIC_BENCHMARKS`/`MARKET_MOMENTUM` rows were injected, and clicking
    "DISCOVER PROPERTIES" still returns real, correctly differentiated
    building results (yield/growth/DOM/rental demand) with zero console
    errors.

- **2026-07-15 (session 12, continued)**: Hid the Analyzer's "AI Smart
  Search" text/voice bar (`js/market.js`) per direct user request — the
  Analyzer's stage-0 form opened with two competing entry points at once
  (the AI text/voice bar, then the building/cluster search box right below
  it), which the site owner judged confusing for first-time beta users
  deciding which one to use. Gated behind a single new
  `ANALYZER_AI_SEARCH_ENABLED=false` flag at the top of the file rather than
  deleting the block, so it can be restored later (flip the flag back to
  `true`) once beta users have more onboarding/context around it — the
  standalone Quick Check tab and other voice-input entry points elsewhere in
  the app are unaffected. Verified: `node -c`, and a real-browser Playwright
  pass on the Analyzer tab confirming the AI bar text is gone while the
  "Search Building, Cluster or Community" box still renders and works,
  zero non-network console errors.

- **2026-07-15 (session 12)**: Fixed a real, user-reported visual bug
  (screenshot: Compare tab's "Property Type" dropdown showed illegible
  white/light text on a white/light background when opened) plus started a
  broader red-color-token misuse audit the user requested in the same
  message ("رنگ قرمز... برای اخطار دادنه ولی یک جاهایی ازش... بدون دلیل
  استفاده شده" — red is meant to signal warnings, but it's used in some
  places without reason — check and fix).
  - **Root cause**: `mkSelect()` (`js/core.js`) built `<option>` elements
    with no explicit `background`/`color` at all — the CLOSED `<select>`
    correctly inherits the app's dark theme via its own inline style, but
    the OPEN native dropdown popup is rendered by the OS/browser, not by
    the app's CSS, so an unstyled `<option>` falls back to the platform's
    light-mode default regardless of the app's dark mode — exactly
    reproducing the reported bug.
  - **Fix, two layers**: (1) `mkSelect()` now explicitly sets
    `background`/`color` on every `<option>` from the current theme — the
    one part of native `<select>` styling Chrome/Firefox/Edge actually
    honor; (2) `render()` (`js/app.js`) now sets
    `document.documentElement.style.colorScheme` to `"dark"`/`"light"`
    based on `darkMode` — the standard, broader fix that tells the browser
    to render ALL native controls (not just this app's shared `mkSelect()`
    helper, but any of the ~37 other raw `<select>`/`<option>` call sites
    scattered across 8 files) in the matching theme, without needing to
    touch each one individually.
  - Verified: a real-browser Playwright pass navigating to Compare and
    inspecting the Property Type dropdown's actual computed styles —
    confirmed `<option>` now resolves to a real dark background
    (`rgb(13,18,32)`) and light text (`rgb(232,237,245)`), and
    `document.documentElement`'s computed `color-scheme` is `dark`; `node -c`
    on both touched files.
  - **Red-color audit — completed, 18 misuses fixed**: dispatched a
    background review of all ~323 red-token occurrences (`cl.red`/
    `cl.redBg`/`cl.redBo` plus hardcoded hex reds) across 18 files to find
    genuine misuse — a plain informational label, chart-series color, or
    decorative badge tinted red with no actual warning/error/negative
    meaning — per the design principle that red/red-tonality is reserved for
    alerts (errors, negative deltas, "Bubble Risk"/"Overpriced" verdicts,
    validation failures, destructive actions), never a neutral decorative or
    informational color. Reviewed every flagged candidate personally before
    editing (not all of the audit's flags were acted on — see below). Fixed:
    - **"Hot"/exciting-but-positive concepts wrongly reading as warnings**:
      `js/market.js`'s "Market Movers" flame header + "Hottest Areas"
      ranking list (both red among green/blue/purple siblings that are
      equally positive rankings), `js/app.js`'s "5-YEAR CAPITAL STORY"
      opportunity card (celebrates strong appreciation, not a problem), and
      `js/workspace.js`'s "hot deals" widget stat — all switched to orange
      (`#F97316`), keeping the "hot/exciting" visual metaphor without the
      alert-red token.
    - **Arbitrary category/tag swatches that happened to land on red**: the
      "Legal & Process Guide" AI agent persona (`js/chat.js`, cyan now),
      the "new-launch" video category (`js/social.js`, pink now), "Trending
      News" content-pillar and "Trending" hashtag category (`js/chat.js`,
      teal/orange), "Countdown" story template and "FOMO/Scarcity" copy
      framework (`js/chat.js`, orange/purple), the Chinese language swatch
      in the multi-language translator (`js/chat.js`, teal) — all were one
      arbitrary color in a rotation of otherwise-neutral category colors,
      with zero connection to a warning.
    - **"Premium/expensive" wrongly coded as bad**: Market Index's "Most
      Expensive Areas" PSF column and the price heatmap's "Premium (>3000)"
      tier + bar color (`js/marketindex.js`) all used red for the highest
      price bracket — a high-value area isn't a warning (unlike an actual
      "Overpriced" AVM verdict elsewhere in the app, which correctly stays
      red) — switched to `cl.gold`, the app's existing premium/luxury
      accent.
    - **Positive engagement stats inheriting a "like = red" association**:
      "Total Likes" stat tiles (`js/social.js`, `js/chat.js`) used the
      literal `cl.red`/`#EF4444` warning token just because likes are
      tied to a red heart icon — switched to pink (`#EC4899`) so the
      heart-red convention itself (left untouched, see below) doesn't leak
      into unrelated stat displays.
    - **Neutral amenity-type icons**: "Hospital" in both Map's and the
      Analyzer's near-identical "Nearby Amenities" widgets (`js/map.js`,
      `js/market.js`) was red among gold/green/amber siblings — switched to
      blue/teal respectively (kept distinct per-widget since each already
      uses blue for a different amenity in one of the two).
    - **Inconsistent admin-panel heading color**: `js/deals.js`'s OFM Admin
      Dashboard login screen and dashboard header used red for plain
      section titles/card border, while the app's OTHER admin panel
      (`js/app.js` `renderAdmin()`) correctly uses gold — aligned both to
      `cl.gold`/`cl.border` for consistency (left the "Logout" button red,
      since the main app's own "Sign Out" button is also red — an existing,
      consistent convention, not a one-off misuse).
    - **A cost figure inconsistently singled out**: Mortgage Calculator's
      "Total Interest" stat (`js/mortgage.js`) used `cl.red` while an
      equally-a-cost sibling in the same grid ("DLD Fee") used neutral gray
      — aligned to `cl.sub` for consistency (an expected, calculated
      mortgage cost isn't a warning).
    - **Inbox "new" status pill**: `js/inbox.js`'s per-message status badge
      map (`new`/`read`/`agent_replied`/`ai_replied`) used red for an
      unread message presented alongside neutral status pills — switched to
      blue.
    - **Deliberately left as-is** (judged as legitimate, not misuse, after
      review — not just accepting every audit flag at face value): the
      like/heart icon's red fill when liked (a globally standard convention,
      e.g. Instagram/X/Facebook — not a warning, a "love" indicator older
      than any design system); the notification bell's unread-count badge
      and the inbox's own "N unread" header badge (both are "count of things
      needing attention" badges — the same near-universal iOS/Android/Gmail
      convention as an app icon's red badge number, a different category
      from a plain category/font-color misuse); the News-icon "new article"
      dot in the header (same convention); the voice-input mic's red
      "recording"/"Listening..." active state (matches the real-world
      convention that a recording indicator is red, like a camera's REC
      light); and the Custom Report Builder's "Red" brand-color swatch
      option (`js/workspace.js`) — a deliberate, user-facing "pick your own
      report accent color" choice among 5 options, not an app-driven color
      decision.
  - Verified: `node -c` on all 9 touched files; a real-browser Playwright
    pass navigating Market Dashboard, Market Index, Deal Board, and AI
    Agents chat, plus a direct `renderMortgage()` call — zero non-network
    console errors, confirming none of the ~18 color-only edits broke
    rendering anywhere they touched.

- **2026-07-14 (session 11z)**: The two remaining items from session 11y's
  beta-launch discussion — News tab "Launch Bank" + automatic/manual error
  reporting. User: "بله بخش لانچ رو قوی‌تر کن ، تا همه بتونن به خوبی آرش
  استفاده کنن و یک بانک اطلاعاتی باشه" (strengthen the launch section into
  a real information bank) plus, from the earlier beta-launch conversation,
  approval ("بله شروع کنیم") of automatic error capture + a manual
  "report an issue" option so the team finds out when something breaks.
  - **News → Launch Bank** (`js/news.js`): a new, always-visible section at
    the top of the News tab — previously, launch-tagged articles were only
    reachable by clicking the "🚀 New Launches" filter pill, mixed in with
    the rest of the feed once selected; now every launch is surfaced up
    front regardless of which filter pill is active below. Built entirely
    on the EXISTING `tag`/`classifyTag()` server-side infrastructure
    (`api/proxy-news.js`, unchanged) — no new data source.
    - **`_enrichArticle(a)`**: attaches `._areas` (reusing `js/api.js`'s
      real `_detectAreasInText()` against the actual 347-area benchmark DB
      — not a second hardcoded list) and `._developers` (new
      `DEVELOPER_NAMES` keyword list + `_detectDevelopersInText()`,
      ~27 well-known Dubai developers, de-duplicates "DAMAC" vs "Damac
      Properties"-style variants) to every article, both fresh-fetched
      (`_fetchNews`) and previously-cached (`localStorage` restore on load)
      — turns a plain headline into a lightly structured record (area +
      developer, when detectable) instead of just a link, the "bank" feel
      the user asked for, with zero fabricated fields.
    - **`_renderLaunchBank()`**: an amber-themed panel — count badge
      ("N tracked"), a dedicated search box (filters by area/developer/
      keyword, scoped to launches only — doesn't affect the main feed
      below), and a horizontally-scrollable strip of compact cards (area +
      developer chips, NEW badge, source, time-ago), capped at 8 with a
      "Show All N Launches" expand toggle. Hidden entirely if there are
      currently zero launch-tagged articles (graceful, matches the rest of
      the tab's empty-state conventions) rather than showing an empty box.
    - **Real bug avoided during build, caught before shipping**: the first
      version rebuilt the entire bank (including the `<input>` search box)
      on every keystroke, which would have stolen focus/cursor position
      after each character typed. Fixed by splitting into a persistent
      "shell" (header + search input, built once per tab visit) and a
      separate "results" container (`_launchResultsEl`) that's the only
      thing rebuilt on `input`/expand-toggle — the search box itself is
      never recreated while the user is typing. The 60-second news poll
      (`_fetchNews`) refreshes just the results container the same way, so
      newly-arrived launches appear without disturbing an in-progress search.
  - **Error reporting** (`js/core.js`, `index.html`, `js/app.js`): closes
    the "how do we find out when something breaks" gap raised in the
    beta-launch conversation, reusing the EXISTING `analytics_events` table
    and `dvTrack()` pipeline — no new table, no new backend service.
    - **Automatic capture**: `index.html`'s existing `window.onerror`
      crash-screen handler (unchanged UX — still shows the dev-facing
      "copy this and send to Claude" screen on a real crash) now also calls
      the new `dvTrackError()` (`js/core.js`), which POSTs to
      `analytics_events` with `event_name:'js_error'`. Also added a genuinely
      missing signal: a `window.addEventListener('unhandledrejection',...)`
      listener (previously nothing captured rejected promises at all) that
      reports without wiping the app, since many rejections elsewhere are
      already deliberately swallowed and non-fatal.
    - **Manual "Report an Issue"**: a small floating button
      (`renderReportIssueWidget()`, `js/core.js`, wired into `render()` in
      `js/app.js` next to the auth/upgrade modals so it's present on every
      tab) opens a modal with a text box; submission POSTs to
      `analytics_events` with `event_name:'user_report'`, current
      URL/section/user-agent, and the last 5 auto-captured errors/reports
      from a small rolling in-memory buffer (`_dvRecentIssues`) — so a
      report about "the Analyzer broke" automatically carries the real
      stack trace if one fired moments earlier, without asking the user to
      describe it themselves. Positioned above the mobile bottom-tab bar
      via a `.dv-report-fab` CSS class (with safe-area handling for the
      native Android build) rather than a hardcoded offset.
    - **New migration + Admin viewer**: `supabase-error-reporting-schema.sql`
      (new file, requires manual execution) adds two password-gated RPCs
      reusing the existing `_admin_password_ok()` — `admin_get_event_reports`
      (recent rows) and `admin_get_event_counts` (accurate 24h/7d totals,
      independent of the row limit) — since `analytics_events` RLS is
      anon-insert-only with no SELECT policy. Wired into a new "◆ Live Error
      & Issue Reports" card in the Admin dashboard (`js/app.js`,
      `renderAdmin()`, right after the existing session-local "System
      Diagnostics" card), auto-loaded on admin login: JS-error/user-report
      counts, and a scrollable recent list (type badge, message, section/
      URL, timestamp).
  - Verified: a Node vm-harness test (9 cases) for the Launch Bank —
    developer detection + de-dup, area detection via the real
    `_detectAreasInText()`, the bank correctly renders nothing with zero
    launches and renders with launches present, and search correctly
    narrows/excludes results; a second vm-harness test (6 cases) for error
    reporting — `dvTrackError()` both records into the rolling buffer and
    POSTs `event_name:'js_error'`, the buffer caps at 5, empty-message
    validation blocks submission with zero network calls, a successful
    submission POSTs the right `event_name:'user_report'` body including
    `recentIssues`, a 500 response surfaces a real error instead of a false
    success, and the widget renders correctly in both closed/open states;
    `node -c` on all 4 touched files; and two real-browser Playwright passes
    — one driving the News tab with injected fake articles (confirmed the
    Launch Bank renders, shows the correct count, and its search box
    correctly narrows results scoped to the bank without affecting the main
    feed below), one driving the Report Issue FAB end-to-end (open → empty
    validation → successful submit → post-submit state) and force-unlocking
    the Admin dashboard to confirm the new "Live Error & Issue Reports" card
    renders without throwing — zero non-network console errors in both.
  - **Manual step required**: run `supabase-error-reporting-schema.sql` in
    Supabase SQL Editor (requires `supabase-admin-security-fix.sql` to
    already be applied, which it is). Until then, the Admin dashboard's new
    card shows a friendly "Reports unavailable yet" message instead of data
    — automatic/manual reporting itself (writing to `analytics_events`)
    works immediately regardless, since that table and its anon-insert
    policy already exist.

- **2026-07-14 (session 11y)**: PropTech Video Platform (`js/social.js`) —
  fixed a pre-launch audit's real findings and built the agent rating/review
  system the user asked for, following a full audit of the News tab (found
  fully working, no changes needed) and the Video Platform (found several
  real bugs plus a completely missing feature). User's instruction: "بله بخش
  لانچ رو قوی‌تر کن... موارد بعدی مربوط به video platform هم فیکس کن تا کامل
  و زنده بشه" (strengthen the launch section; also fix the video platform
  issues to make it complete and live) — this session covers the Video
  Platform half; the News "launch bank" strengthening is a separate,
  not-yet-started follow-up (see Outstanding items).
  - **Real bug #1 — `agent_profiles` UPDATE silently no-oped**: the RLS
    policy on `agent_profiles` (from `supabase-social-schema.sql`) checks
    `current_setting('request.header.x-user-id', true)`, but `_socialHeaders()`
    never sent that header — every profile edit matched zero rows under RLS
    (PostgREST returns 200 with an empty array, not an error), while
    `_updateProfile()` unconditionally showed "Profile updated!". Fixed by
    sending `x-user-id:_socialUserId()` on every request and by only firing
    the success alert when the response actually returned an updated row.
  - **Real bug #2 — `follower_count` permanently 0**: read/displayed/sorted-by
    in 4 places (`_renderAgentCard`, `_renderAgentProfile`, "Most Followers"
    sort, Following tab) but never written anywhere. Fixed with a real
    Postgres trigger (`_dv_update_agent_follower_count()` on `agent_follows`
    insert/delete) instead of a client-computed PATCH, avoiding the same
    non-atomic race condition already present in the like/view counters.
  - **Real bug #3 — `video_count` updated via a non-atomic read-then-PATCH**:
    replaced with an equivalent trigger (`_dv_update_agent_video_count()` on
    `agent_videos` insert/delete) for consistency; `_postVideo()`/
    `_deleteVideo()` simplified to just call `_fetchMyProfile()` afterward
    instead of hand-computing the new count client-side.
  - **Real bug #4 — `_toggleLike`/`_incrementViews` were non-atomic
    read-then-PATCH too** (a genuine race condition under concurrent
    visitors): replaced with two new SECURITY DEFINER RPCs,
    `toggle_video_like(p_video_id,p_user_id)` and
    `increment_video_views(p_video_id)`, both atomic server-side.
  - **Real security gap — `agent_videos` UPDATE/DELETE RLS was `using(true)`**:
    any anonymous caller could edit or delete ANY agent's video via a direct
    REST call, not just their own. Tightened to owner-only
    (`agent_id in (select id from agent_profiles where user_id=current_setting(...))`),
    with the two new RPCs (bypass RLS internally for the one narrow, safe
    operation) preserving ordinary visitor view/like functionality under the
    tightened policy.
  - **New: real agent rating/review system**, closing the gap the user
    specifically asked for ("بر اساس اون ویدیوها... rate هر ایجنت رو مشخص
    کنیم" — based on those videos, determine each agent's rating): the
    `agent_profiles.rating` column already existed and was already displayed
    in `_renderAgentCard`/`_renderAgentProfile`, but nothing anywhere ever
    computed or wrote it — permanently 0/"N/A", fully decorative. Added a new
    `agent_reviews` table (`agent_id`, `video_id` nullable, `reviewer_id`,
    `rating` 1-5, `comment`, unique per agent+reviewer so one browser can only
    rate a given agent once) plus a trigger
    (`_dv_update_agent_rating()`) that recomputes `agent_profiles.rating`
    (real average) and a new `review_count` column on every insert/update/
    delete — the existing display code needed zero changes to start showing
    real data. `js/social.js` gained: `_fetchAgentReviews(agentId)`,
    `_submitAgentReview(agentId,videoId)` (handles the 409 unique-constraint
    conflict with a friendly "You've already reviewed this agent" message
    instead of a raw error), `_myAgentReview()`, and a shared
    `_renderAgentReviewWidget(cl,agentId,videoId)` component (star picker +
    optional comment box, or — if the current browser already reviewed this
    agent — their own past rating instead of the form, plus up to 5 other
    reviewers' ratings/comments below). Wired into both the Video Modal
    (right after watching a video — matches the user's exact framing of
    rating agents based on their videos) and the full Agent Profile page.
    `review_count` now shows alongside the star rating in both
    `_renderAgentCard` and `_renderAgentProfile`'s stats grid (e.g.
    "Rating (12)" instead of a bare average).
  - **New migration file**: `supabase-social-fixes-schema.sql` — covers all
    of the above (new `review_count` column, `agent_reviews` table + RLS,
    the rating/follower/video-count triggers, the two new RPCs, and the
    tightened `agent_videos` RLS policies). **Requires manual execution in
    Supabase SQL Editor** before any of these fixes take effect live — same
    pattern as every other new-migration feature in this project. Until it's
    run: profile edits keep silently failing, counts stay frozen, and the
    rating widget will error on submit (gracefully — shows "Could not submit
    rating" rather than crashing).
  - Verified: a Node vm-harness test (7 cases) — fetching reviews populates
    state correctly, `_myAgentReview()` correctly returns null before/finds
    the right review after a submission, a successful submission POSTs the
    correct `{agent_id,video_id,reviewer_id,rating,comment}` body and appends
    to local state, a 409 conflict shows the friendly duplicate-review
    message, submitting without picking a star shows a validation error and
    makes zero network calls, and the widget renders without throwing;
    `node -c js/social.js`; and a real-browser Playwright pass driving the
    actual Video Modal and Agent Profile page with mocked state — confirmed
    "Rate this Agent" and existing reviewers' comments render in the live
    DOM in both locations, the star picker is clickable, `review_count`
    shows next to the rating in the profile stats grid, and the only console
    output was the expected sandboxed-network market-intelligence failure
    (not a real error).
  - **Not done this session** (separate, not-yet-started items from the same
    user instruction): strengthening the News tab's "launch projects"
    section into a more prominent database/bank (the underlying `tag`/
    `classifyTag()` infrastructure already exists and works — this is a
    UI-prominence task, not a bug fix); the automatic + manual error-
    reporting system discussed earlier in the beta-launch conversation;
    generalizing the "Coming Soon" gating pattern to other paid-API-gated
    features beyond Video Studio.

- **2026-07-14 (session 11x)**: Quick Check redesigned from a generic
  area-wide price/rent range checker into a budget-first building
  recommender, per user discussion: user asked directly whether Quick
  Check — as a dedicated top-level tab on a site built around precise,
  transparent analysis — was actually a useful tool, noting the exact
  same widget is already reachable via Analyzer's "Quick Price Check"
  accordion. Agreed direction: keep the tab (nav is frozen, not touched),
  but give the underlying tool a genuinely distinct value — "I have this
  budget, which real buildings can I buy/rent into" — instead of
  overlapping with Find's Smart Discovery. User explicitly asked to keep
  bed count as a fast required input (not silently guessed), since
  recommending the wrong bed count makes the whole result useless, and to
  frame the picks honestly as market-data-driven, not a live-inventory
  guarantee (an agent might have no stock in the top pick).
  - **Old flow removed**: `_qcSaleVerdict()` (compared one entered price
    against the area-wide tier range only — no specific building named)
    deleted entirely, along with the rent-side verdict card in
    `_renderQCResult()`. Both were superseded, not just duplicated, by the
    new building-level approach below.
  - **New flow**: `_qcRecommendBuildings(area,beds,mode,budget)` —
    computes a real per-building price/rent estimate for every `DB` entry
    in the chosen area via the EXISTING `estimateBuildingRentYield()`
    (`js/valuation.js`, already used by Smart Discovery/Compare — no new
    valuation math, no fabricated numbers), filters to what fits the
    budget, ranks affordable candidates by grade (best-first) so the top
    pick is the best building the budget reaches — not just the cheapest
    — and gracefully fills remaining slots with the closest
    just-above-budget options (clearly labeled "Above budget") if fewer
    than 3 buildings fit, so the tool is never a dead end.
  - **UI**: the "optional price — adds deal check" field became "YOUR
    BUDGET" (required, validated with an inline error like the existing
    area-required check), Sale/Rent toggle relabeled BUY/RENT, submit
    button relabeled "FIND BUILDINGS TO BUY/RENT". Results now lead with
    `_renderQCBuildingPicks()` — up to 3 named building cards (grade, PSF,
    estimated price/rent, "Top pick"/"Within budget"/"Above budget"
    badge), each clickable straight into a prefilled Analyzer for the
    exact building — with the existing area-wide range card kept
    underneath as supporting context (not removed, just demoted from
    primary to secondary). A one-line disclaimer ("Based on market data —
    not a live listing check. Confirm availability with an agent")
    directly addresses the agent-inventory gap the user raised, since this
    tool has no way to know a specific agent's actual stock.
  - Since `_renderQuickCheckWidget()` is one shared component deliberately
    used both by the standalone Quick Check tab and the Analyzer's
    collapsible accordion (so the two never drift), this redesign applies
    identically to both entry points automatically.
  - Verified: a Node test extracting `_qcRecommendBuildings` and running it
    against real `DB`/`AREAS` data — Business Bay/2BR/1.5M sale budget
    returns 3 real B+-grade buildings all within budget, correctly grade-
    ranked; a rent-budget case returns real C-grade buildings at the
    correct estimated annual rent; a deliberately tiny budget in Palm
    Jumeirah returns 3 "closest above budget" fallback picks with
    `anyAffordable:false`; an invalid area returns `null` cleanly; `node -c`
    on the touched file; and a real-browser Playwright pass driving the
    actual Quick Check tab end-to-end (set area/beds/budget, click Find
    Buildings, read the rendered DOM) — confirmed real building names
    ("Mayfair Tower", grade B+, AED 1.5M, "Top pick") render correctly with
    zero console errors.

- **2026-07-13 (session 11w)**: Fixed a real, user-reported visual bug —
  screenshot showed the Analyzer's building-search dropdown ("Blvd Heights
  T3", "Blvd Crescent Tower 1/2"...) visually interleaved/bleeding through
  the static "Or browse by area" chip section underneath it, making both
  unreadable together. User also asked whether this repeats elsewhere and
  raised a data-accuracy question about "Blvd Heights" appearing to have
  only one tower in the results (real estate expertise: it has two).
  - **Root cause (UI)**: 5 separate floating suggestion/autocomplete
    dropdowns across the app used `position:"absolute"` + a high `z-index`
    (correct for floating above content) but a `background:cl.surface` fill
    — which in dark mode is `rgba(255,255,255,0.05)`, i.e. only 5% opaque.
    The z-index correctly stacked the dropdown on top, but its near-fully-
    transparent background let whatever was underneath show straight
    through, producing exactly the reported "mixed together" look. Fixed by
    switching all 5 to `cl.surfaceSolid` (a real opaque color, `#0D1220`
    dark / `#FFFFFF` light) instead: `js/app.js` (Analyzer's building search,
    both the local-DB-results branch and the Google-Places-tier branch),
    `js/core.js`'s shared `mkAuto()` component (reused by Find's area/
    building fields and AI Chief of Staff's area fields — confirming the
    user's suspicion this repeated "in various sections"), `js/deals.js`
    (Deal Board's building search), and `js/market.js` (Quick Check's area
    suggestion dropdown).
  - **Data question investigated, not a real gap**: checked `DB` directly —
    both `"blvd heights tower 1"` and `"blvd heights tower 2"` exist (A+
    grade, AED 2,350 PSF each), so the building isn't missing from the
    database. The confusion traced to the UI bug above plus the 8-result cap:
    with only "Blvd" typed (partial), dozens of unrelated `blvd ...` entries
    tie for the top score and only the first 8 in the DB's own key order are
    shown — "Blvd Heights T3" happens to sit earlier in that order than
    "Blvd Heights Tower 1/2", while unrelated matches like "Blvd Crescent
    Tower 1/2" filled the visible slots instead. Once the FULL query "blvd
    heights" is typed, all 4 real Blvd Heights entries (Tower 1, Tower 2,
    Podium, and a 4th "T3" entry) score identically and all appear — verified
    via a standalone scoring-logic simulation against the real `DB`, not
    fixed further this session (this is a ranking/UX nuance, not a bug, and
    `js/data-residential.js` is outside this branch's remit regardless —
    see two-branch workflow rule below).
  - **Broader systemic scan, as the user requested** ("این مورد برای
    ساختمانهای دیگر تکرار نشه"): wrote a heuristic scan over all `DB` keys
    matching `<base name> tower N` / `<base name> tN`, grouped by area+base,
    checking for gaps in the tower-number sequence (e.g., Tower 1 and Tower 3
    present but Tower 2 missing) — a real, generic signal of a possibly
    missing sibling building, independent of the false-alarm Blvd Heights
    case. Found 6 candidate families (see Outstanding items below) — flagged
    for the research branch (`claude/dubaival-portfolio-manager-5bgbjk`) to
    verify against live listings/DLD data, since this branch cannot edit
    `js/data-residential.js` directly.
  - Verified: a Node test confirming the exact `updateSearchSuggestions`
    scoring logic against real `DB` data — for query "blvd heights" all 4
    real entries score 100 and all appear in the top 8 (no data loss once
    fully typed); a real-browser Playwright pass confirming the Analyzer's
    and Find's dropdowns now compute to a fully opaque `rgb(13,18,32)`
    background (previously would have been a translucent overlay) with zero
    console errors; `node -c` on all 4 touched files. The AI Chief of Staff
    and Deal Board dropdown fixes share the exact same `mkAuto()`/pattern
    already verified for Find, so were not independently re-tested via
    Playwright this session — a quick live check there is still worthwhile.

- **2026-07-13 (session 11v)**: Interactive Map — fixed a real, user-reported
  bug (screenshot: clicking "Show Key Buildings on Map" after selecting an
  area returned "Could not locate buildings on the map for this area right
  now.") in the session 11t drill-down feature.
  - **Root cause**: `api/proxy-maps.js` shares ONE rate-limit bucket (30
    requests/min per IP) across every action on the endpoint. Opening an
    area panel alone already costs 2 requests (amenities + the 11u area-size
    geocode); clicking "Show Key Buildings" fires up to
    `_DV_KEY_BUILDINGS_LIMIT`=12 MORE geocode calls, all at once via
    `Promise.all`. Browsing just 2-3 areas before deciding easily exceeds 30
    requests inside a minute — every geocode call after that point gets a
    429, which `_dvGeocodeBuilding` (session 11t) had no way to distinguish
    from "this building genuinely isn't geocodable," so it silently returned
    `null` for every building and the panel showed a generic, misleading
    "not found" message instead of the real cause.
  - **Fix**: raised the shared limit to 90/min (`api/proxy-maps.js`) — still
    a real per-IP ceiling against abuse, just no longer tripped by ordinary
    map browsing. Also hardened the client side defensively, since a shared
    limit can still be hit under heavier use: `_dvGeocodeBuilding` now reads
    the actual HTTP status, and on a 429 waits 900ms and retries once before
    giving up; `_dvShowKeyBuildings` now processes its 12 buildings in
    sequential batches of 4 (`_dvBatchPromises`, new small helper) instead of
    firing all 12 concurrently, both reducing burst pressure on the limiter
    and giving the retry path room to work; and if buildings are still
    unresolved after all that, the panel now shows an accurate "Too many map
    requests right now — please wait a few seconds and try again" message,
    distinct from the genuine "not found" case.
  - Verified: a Node test with a mocked `fetch` returning 429 for the first 6
    calls then succeeding — confirmed markers still populate correctly via
    the retry path; a second test with `fetch` permanently returning 429 —
    confirmed the panel shows the new rate-limit-specific message (not the
    generic one) and zero markers are created (no partial/broken state); a
    third test confirming the batching never allows more than 4 concurrent
    geocode fetches in flight; the existing metric-registry (2,429 checks),
    drill-down, and building-tier Node tests all re-run clean; `node -c` on
    both touched files; and a real-browser Playwright pass confirming zero
    non-network console errors. Confirming the fix live against the real
    Vercel deployment's actual traffic patterns is the user's own next check.

- **2026-07-13 (session 11u)**: Interactive Map area panel — two small,
  user-requested additions ("نمیشه بابت تعداد ساختمانهای موجود در هر منطقه از
  خود اطلاعات گوگل استفاده کنیم؟" — can't we use Google's own data for
  building counts/sizes too?, then "همچنین مراکز مهمی که در هر منطقه هست هم
  اگر بتونیم بگیم بد نیست" — also mention notable centers in each area).
  Answered the building-count/size question directly (not silently
  implemented) before building anything: Google Places has no exhaustive
  "list every building in this neighborhood" endpoint (Nearby Search is
  radius/count-limited and meant for POIs, not building inventories) and
  Google exposes no per-building unit-count/total-size data at all (that
  only exists in DLD/Bayut/PropertyFinder/paid providers) — presenting a
  Google-sourced count would be a real undercount labeled as authoritative,
  worse than the honest "buildings we track" figure already shown. What
  Google DOES have and is now wired in:
  - **Approx. Area (km²)**: `api/proxy-maps.js`'s `geocode` action now also
    returns `bounds`/`viewport` from the Google Geocoding response (backward
    compatible — existing callers that only read `lat`/`lng`/`formatted`
    are unaffected). `_dvFetchAreaSize()` (`js/map.js`) geocodes the area
    name, prefers the tighter `bounds` (only present for genuine
    neighborhood-level results) over the always-present but often-padded
    `viewport`, and derives an approximate km² from the bounding rectangle
    via the existing `haversineKm()` helper (`js/data-residential.js`) —
    labeled "Approx." throughout since a lat/lng rectangle is not an
    official administrative boundary. Cached in sessionStorage per area
    (including a cached "no data" result, so a failed lookup isn't retried
    every panel open).
  - **Notable Landmarks Nearby**: `_dvNearestKeyPois()` reuses the existing,
    already-curated `KEY_POIS` array (30 real malls/landmarks/beaches/
    business hubs/airports/waterfronts — the same dataset `computeGeoScore()`
    already draws on for the valuation engine's location premium) rather
    than hand-writing a second list — free, instant, no live call. Filtered
    to a genuine 8km proximity radius so a distant entry is never mislabeled
    "nearby"; areas with nothing in range simply omit the section entirely
    (no misleading placeholder).
  - Both wired into `_dvAreaInfoHtml()` — the size stat sits as a 5th cell
    in the existing Investment Snapshot grid, landmarks appear as their own
    small section between the static Metro line and the live Nearby
    Essentials grid (grouping "free/instant" facts before "live/fetched"
    ones, same ordering logic as the rest of the panel).
  - Verified: a Node test confirming `_dvNearestKeyPois("Downtown Dubai")`
    correctly returns Burj Khalifa/Dubai Mall/DIFC sorted by real haversine
    distance, all within the 8km radius, and that a radius-filtered area
    (International City) correctly returns fewer/no entries rather than
    padding with distant ones; a mocked-fetch test confirming
    `_dvFetchAreaSize` computes a real, positive km² figure from a mocked
    Google `bounds` response, caches it (second call for the same area makes
    zero additional fetch calls), and gracefully renders "—" (not a throw)
    when a response has neither `bounds` nor `viewport`, verified in an
    isolated sandbox after an initial shared-queue test-mock collision (not
    an app bug — a stale, over-broad matcher from an earlier test case in
    the same run, fixed by isolating the no-bounds case in its own sandbox);
    the full area-panel HTML confirmed to include both new sections; the
    existing metric-registry test (2,429 checks, 0 errors) and `node -c` on
    both touched files re-run clean; and a real-browser Playwright pass
    confirming the map tab and its panel/search box still render with zero
    non-network console errors. Live confirmation that the computed km²
    figures are visually reasonable against the real Google Geocoding API
    still requires the user's own check, same sandboxed no-network
    limitation noted for every Maps-dependent feature this session.

- **2026-07-13 (session 11t)**: Interactive Map — two-tier drill-down
  interaction, user-requested follow-up to 11s ("اگر شخصی روی منطقه بیزنس بی
  کلیک کرد، اطلاعات مربوط به منطقه نمایش داده شود... و اگر زوم بیشتر شد و یک
  ساختمان انتخاب شد، موارد مربوط به ساختمان..." — click an area → area info;
  zoom in and select a building → building info), explicitly delegating the
  click/selection engineering to Claude's judgment ("مسائل فنی... با تو
  باشه") while asking for "no unwanted information" per click and to reuse
  Google's own already-registered data rather than hand-curate a new list
  ("در گوگل همه چیز ثبت هست، ما فقط باید دسته‌بندی کنیم").
  - **Docked info panel** (`_dvShowPanel`/`_dvHidePanel`, `js/map.js`) —
    replaces the old floating InfoWindow popup for area/building content with
    a real scrollable side panel (absolutely positioned over the map, so it
    never needs a Maps resize event), since the requested content (multiple
    stat sections, live amenities, itemized rental-demand reasons) doesn't
    fit an InfoWindow bubble. InfoWindow itself is kept only for the small
    single-line Metro/Tram facts, unaffected.
  - **Tier 1 — Area panel** (`_dvAreaInfoHtml`): clicking any area marker (or
    the Hatta outlier marker) now opens a panel with a real Investment
    Snapshot (yield/PSF/growth/DOM, all from `AREAS[]`, unchanged source of
    truth), a real building count (`_dvAreaBuildingCount` — counts actual
    `DB` entries whose `.a` matches the area, the same filter pattern
    `estimateBldgTx()` already used elsewhere), the nearest Metro (free,
    static, `computeGeoScore()` — no live call needed), and a live "Nearby
    Essentials" grid (mall/hospital/school/supermarket) that calls the
    EXISTING `/api/proxy-maps?action=amenities` endpoint the Analyzer's own
    "Nearby Amenities" card already uses — same cache key format
    (`dv_amenities_<area>`), so results are shared/reused across features
    instead of a second hand-written per-area text blob. `AREA_AMENITIES`
    (the static curated string blob used only in AI prompts) was deliberately
    NOT used here — the user explicitly asked for Google's real registered
    data, categorized, not another hardcoded list.
  - **`api/proxy-maps.js` `amenities` action extended**: added a 6th category,
    `mall` (`shopping_mall` place type, 4km radius — malls anchor Dubai
    neighborhoods and are frequently 2-4km from a residential area's centroid,
    wider than the existing hospital/school/supermarket radii), fully
    backward-compatible (the Analyzer's own amenities card iterates its own
    fixed 5-key list and simply ignores the new key).
  - **Tier 2 — Building panel** (`_dvBuildingInfoHtml` + `_dvShowKeyBuildings`):
    a new "📍 Show Key Buildings on Map" button in the area panel — an
    EXPLICIT click, never automatic on zoom/pan (the user's "no unwanted
    info" requirement) — geocodes (via the pre-existing
    `/api/proxy-maps?action=geocode`, one real Google Geocoding call per
    building, sessionStorage-cached so a building is never re-geocoded twice)
    the area's top ~12 "key buildings" (`_dvAreaKeyBuildings` — real `DB`
    entries for that area, sorted by grade rank then PSF descending; capped
    at 12 rather than every building in the area, since some areas have
    300+ tracked buildings and geocoding all of them on every visit would be
    both slow and needlessly expensive), then drops one grade-colored marker
    per building and zooms the map to fit them (capped at zoom 17). Clicking
    a building marker opens a panel with PSF, service charge, estimated
    gross yield (`estimateBuildingYield()`), estimated unit count
    (`estimateBldgUnits()`), and the top 3 Rental Demand Score drivers
    (`estimateRentalDemandScore()`) — every figure reuses the exact same
    real valuation-engine functions the Analyzer/Smart Discovery already
    call, nothing new fabricated. A generic "unit sizes run ~750–1,600 sqft"
    range is shown instead of a fabricated single "total building size"
    figure, since no per-building unit-mix data exists to make that number
    real. Ends with a "Full Analysis in Analyzer →" button that prefills
    `analyzerState.f.area`/`.building` and switches tabs — deliberately
    leaves `val:null` (no fake instant valuation; size/price still need the
    user's own input same as anywhere else in the app).
  - **Explicit exit, not automatic**: a "← Back to Areas · N buildings in
    X" pill control (`_dvRenderBackControl`, top-left over the map) appears
    only in Building Tier and calls `_dvBackToAreas()`, which clears the
    building markers, hides the panel, and re-renders the normal area-marker
    layer from the exact same `points` array built on load (stashed on
    `_dvMapState.areaPoints` since `_dvBackToAreas` is invoked from injected
    HTML `onclick`, outside `renderMap()`'s own closure). A grade legend
    (`_dvRenderGradeLegend`, one dot per grade 7 tiers) replaces the metric
    legend while in Building Tier, since marker color there encodes grade,
    not the selected metric.
  - **State machine**: `_dvMapState.tier` ("area"|"building") gates the
    zoom/pan re-render listeners (`if (_dvMapState.tier === "area")`) so
    panning/zooming while Building Tier markers are visible doesn't
    re-render area markers on top of them mid-transition; `renderMap()`
    itself always resets to `tier:"area"` on a fresh call (switching metric
    or re-opening the tab tears down the whole `gmap` instance anyway, so any
    stale focus/markers from before would otherwise point at nothing).
    `_dvMapCleanup()` now also clears building markers and the back control.
  - Verified: a Node test (`_dvAreaBuildingCount`/`_dvAreaKeyBuildings`)
    against real `DB` data — Business Bay returns a real building count and
    12 key buildings correctly sorted by grade descending; a second test
    building `_dvAreaInfoHtml`/`_dvBuildingInfoHtml` with mocked
    `fetch`/`sessionStorage`/`document` — confirmed the area panel's
    "Show Key Buildings"/"Explore" buttons wire to the right global
    functions, the live amenities fetch resolves and populates its
    placeholder div with real mocked place names, geocode results cache
    correctly (second call for the same building makes zero additional
    fetch calls), `_dvOpenInAnalyzer` sets `analyzerState.val:null` (no
    fabricated valuation), and every real grade found in the DB
    (`Ultra/A+/A/A-/B+/B/C`) has a corresponding rank + color entry; a third
    test driving `_dvShowKeyBuildings`/`_dvBackToAreas` end-to-end through a
    mocked `google.maps` — confirmed building markers are created and
    fit-bounded, the back control and grade legend are pushed, clicking a
    building marker shows its info in the panel, and `_dvBackToAreas`
    correctly clears markers/panel/back-control and restores area tier; the
    existing metric-registry test (2,429 checks, 0 errors) re-run with the
    old `_mapPopupHtml` check replaced by an `_dvAreaInfoHtml` check (that
    function was removed — superseded by the panel); `node -c` on both
    touched files; and a real-browser Playwright pass confirming the map
    tab, its docked (initially hidden) panel element, and the search box all
    render with zero non-network console errors. Live rendering — confirming
    the two-tier click flow visually against the real Google Maps API and a
    live `GOOGLE_MAPS_KEY` — still requires the user's own check, same
    sandboxed no-network limitation noted for every Maps-dependent feature
    this session.

- **2026-07-13 (session 11s)**: Interactive Map — removed the Voronoi
  cell-polygon layer entirely, per explicit, direct user instruction
  overriding the 11q/11r approach: "بیا اون پرده رنگی رو حذف کن و مناطق رو با
  همون تقسیم بندی خود نقشه اورجینال دبی نشون بده... اصلا نیاز نیست تقسیم
  بندی جدید داشته باشی... فقط تو باید اطلاعاتی که ما داریم رو روی نقشه پیاده
  کنی" (remove that color curtain and show areas using Dubai's own original
  map division — no new subdivision needed — just plot OUR data onto that
  real map). The user's point: Google's base map already shows Dubai's real
  streets, communities, and landmarks; drawing any second polygon layer on
  top — even the much-lower-opacity, click-only version shipped in 11r — was
  an unnecessary competing subdivision and the root cause of every visual
  problem in this feature so far.
  - **Removed**: the entire `_dvRenderVoronoiLayer` function and `js/voronoi.js`
    (deleted — dependency-free Voronoi generator, no longer used anywhere;
    also dropped its `<script>` tag from `index.html`). No app code besides
    `js/map.js` ever referenced it (confirmed via a full-repo grep before
    deleting).
  - **Replaced with**: `_dvRenderAreaMarkers()` — one small colored
    `google.maps.Marker` circle per area centroid (or per cluster of nearby
    areas at low zoom, reusing the existing `_dvGroupForZoom` LOD grouping
    unchanged), colored via the same `_dvMetricColor()` scale as before. A
    marker's footprint is a single small dot, never an area-covering shape,
    so a "color curtain" is impossible by construction — this is the same
    point-marker technique session 11f originally built, now combined with
    the metric color-coding/dynamic-legend/Explore-Buildings-CTA work from
    11q that 11f didn't have.
  - **Click-only interaction preserved**: popups still open only on marker
    `click`, never `mouseover` (kept from the 11r fix, still correct here —
    though markers are sparse points so the auto-pan risk was already much
    lower than with gap-free polygons, there's no reason to reintroduce it).
    Hover now enlarges the marker via a plain `setIcon()` call and relies on
    the marker's native `title` attribute for a free browser tooltip showing
    the area name — no JS-driven popup on hover at all.
  - Kept unchanged from 11q/11r: the light, high-detail base theme
    (`_GMAP_LIGHT_STYLES` — still needed so Dubai's real neighborhood labels/
    roads/buildings are the ones the user actually sees), `DV_MAP_METRICS`
    registry, `_dvInvestmentScore()`, `_mapPopupHtml()`, the dynamic legend,
    the Places Autocomplete search box, and the "Explore Buildings" popup CTA.
  - Verified: a new Node test driving `_dvRenderAreaMarkers` through a
    corrected mocked `google.maps.Marker` API (fixed the projection mock to
    match Google's real 256×2^zoom world-coordinate system, which a stale
    0–1-normalized mock from 11q had been using) at 3 zoom levels — confirmed
    clustering produces fewer, larger cluster markers at city-wide zoom (13
    markers: 2 solo + 11 clusters at zoom 9) and full per-area resolution
    above the cluster threshold (286 solo markers at zoom 13+), zero
    mouseover-triggered `infoWin.open()` calls at any zoom, every marker keeps
    a `click` listener; the existing metric-registry Node test (2,429 checks,
    0 errors) re-run unaffected; `node -c js/map.js`; and a real-browser
    Playwright pass confirming zero non-network console errors (in
    particular, no 404/reference error from the removed `voronoi.js` script
    tag) and that the search box + metric buttons still render correctly.
    Live rendering against the real Google Maps API — confirming the
    markers visually sit on top of Dubai's real base-map communities exactly
    as intended — still requires the user's own check, same sandboxed
    no-network limitation noted for every Maps-dependent feature this
    session.

- **2026-07-13 (session 11r)**: Interactive Map — corrected a real regression
  in the session 11q Voronoi redesign, reported by the user with a screenshot
  showing Al Quoz under a near-opaque green color wash with zero visible
  street/building/bridge detail, plus the map auto-scrolling on its own
  whenever the mouse moved over it ("نقشه دبی رفته زیر یک پرده رنگی... صفحه
  خود ب خود بالا و پایین میره" — the map has gone under a color curtain, the
  screen scrolls up/down on its own). User confirmed the underlying DATA was
  good and asked specifically for the VISUAL execution to be redesigned
  "صفر تا صد" (zero to one hundred) using independent design/engineering
  judgment, explicitly setting aside earlier region/color suggestions.
  - **Root cause 1 — 100%-coverage tint**: a true Voronoi tessellation has
    zero gaps between cells by construction (unlike the old circles, which
    had real empty space) — so a flat `fillOpacity:0.42` applied uniformly
    tinted the ENTIRE visible map with no exceptions, compounded by the
    session-11q base theme being a heavily stripped dark style (POI/transit
    off, near-black roads) that had very little inherent contrast to begin
    with. Fixed both sides: replaced `_GMAP_DARK_STYLES` with a new
    `_GMAP_LIGHT_STYLES` (light, high-detail base — POI/transit/buildings/
    water all visible, matching how Zillow/Redfin/PropertyFinder/Bayut all
    use light detailed base maps), and added `_dvFillOpacityForZoom(zoom,
    isHover)` — fades fill from a modest 0.24 at city-wide zoom (≤10, where
    the color pattern itself is the useful information) down to a
    near-transparent 0.05 at street level (≥15, where roads/buildings need
    to be legible) — replacing the flat 0.42/0.62 values. The stroke/border
    line, not the fill, now carries most of the "where does this region end"
    signal.
  - **Root cause 2 — auto-scroll bug**: `google.maps.InfoWindow` auto-pans
    the map by default whenever it's opened/repositioned near a viewport
    edge. Session 11q opened it on `mouseover`; combined with 100%-coverage,
    gap-free polygons (the cursor is ALWAYS over some cell and constantly
    crosses cell borders), this fired repeatedly and made the map scroll
    itself uncontrollably — exactly the reported symptom, and confirmed by
    the user to be WORSE than the original circle-overlap problem. Fixed by
    removing every `mouseover`-triggered `infoWin.open()` call (per-area
    cells, cluster cells, and the Hatta outlier marker) — popups now open
    only on `click`. Hover still gives visual feedback via a pure
    `polygon.setOptions({fillOpacity,strokeWeight})` call, which never
    touches the InfoWindow and can't trigger auto-pan. Cluster cells
    previously showed a names-list popup on hover before zooming on click;
    since click already zooms into the cluster (revealing individual,
    properly click-poppable cells), the hover-only names list was dropped
    rather than reintroduced through a different unsafe trigger.
  - **Real search added** (previously completely missing, an explicit user
    requirement — "ما...نقشه قابلیت پیدا کردن و سرچ کردن داشته باشه"): added
    `&libraries=places` to the Google Maps script URL in `_dvGmapLoad()`, a
    search `<input>` in the map's control bar, and a
    `google.maps.places.Autocomplete` (UAE-restricted, biased to a Dubai
    bounding box) that recenters/fits the map to whatever area, building, or
    landmark the user searches for.
  - Verified: a Node test driving the real `_dvRenderVoronoiLayer` render
    path through a mocked `google.maps` (recording stub classes) at 3 zoom
    levels (9/13/16) — confirmed zero polygons ever wire `infoWin.open()` to
    `mouseover` at any zoom, every polygon keeps a `click` listener, and fill
    opacity correctly decreases from 0.24→0.10→0.05 as zoom increases; the
    existing metric-registry Node test (2,429 checks across 7 metrics × 347
    areas, 0 errors) re-run to confirm the color/popup logic itself was
    untouched; `node -c js/map.js`; and a real-browser Playwright pass
    confirming the map tab still renders its controls/metric buttons, the
    new search input renders with the correct placeholder, and the map
    gracefully falls back to "Map unavailable" with zero non-network console
    errors (this sandbox still has no live network access to Google's Maps
    API, so the actual rendered light-theme tiles, fade behavior, and
    search-box autocomplete dropdown could not be visually confirmed end-to-
    end in a real browser this session — a live check against the real
    Google Maps API, ideally on both desktop and mobile viewports, is the
    one remaining step, same limitation noted for every Google-Maps-
    dependent feature this session).

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
  - Advanced Market Screener (`◆ Advanced Market Screener`, renamed from
    "Smart Property Discovery" 2026-07-15) — screens 9,226+ buildings by
    financial criteria: Area, Grade, Type, Min Yield%, Min Growth 3yr%, Max
    DOM, Min PSF, Max PSF, Min Turnover, Sort (Yield/PSF/Growth/Liquidity/
    Turnover) — each area's PSF/rent/DOM/txVol/growth are blended with real
    daily live market data + AI momentum trend (`getLiveAreaDataWithMomentum()`
    in `js/valuation.js`), not the static database alone
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
| `renderFind()` | `js/app.js` | Advanced Market Screener |
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

- **🔴 CRITICAL, NOT YET LIVE — Inbox feature (email/Instagram/Facebook/
  WhatsApp) has never stored a single message, needs manual SQL execution
  NOW** (added 2026-07-16, session 13): run
  `supabase-inbox-user-id-fix.sql` in Supabase SQL Editor immediately.
  `email_inbox`/`social_inbox` are missing a `user_id` column that
  `api/inbox.js` and `js/inbox.js` have always assumed exists — every
  message ingestion (Gmail, Instagram DM, Facebook DM, WhatsApp) has been
  silently failing to persist since this feature was built. See the
  2026-07-16 "Inbox feature has silently never stored a single message"
  work-log entry above for the full diagnostic trail.

- **🔴 CRITICAL, NOT YET LIVE — social_credentials/scheduled_posts/
  post_engagement RLS fix needs manual SQL execution NOW** (added
  2026-07-16, session 13): run `supabase-social-credentials-rls-fix.sql` in
  Supabase SQL Editor immediately. Until this runs, the OLD, unrestricted
  policies remain live in production — meaning anyone on the internet can
  currently read/overwrite any user's stored Instagram/Facebook/LinkedIn/
  Twitter/YouTube/TikTok/WhatsApp Business API tokens via a direct REST call
  using the public anon key, no sign-in required. The `js/chat.js` code fix
  (sending the real per-user JWT instead of the anon key) is already
  deployed-ready, but it does NOT close the hole by itself — the old RLS
  policy would still accept requests from anyone else regardless. See the
  2026-07-16 "CRITICAL security fix" work-log entry above for full details.

- **🟡 Pay-per-use WhatsApp Business API — needs manual SQL + Meta Business
  verification (external, in progress)** (added 2026-07-15, session 12):
  run `supabase-whatsapp-credits-schema.sql` in Supabase SQL Editor
  (requires `supabase-video-credits-schema.sql` applied first, for its
  shared `stripe_events_processed` idempotency table). Separately, the user
  must complete Meta Business/WhatsApp Business API verification (started
  in parallel with this session, days-long, cannot be done by Claude) —
  once done: connect a WhatsApp Business phone number in the Meta App
  Dashboard, generate a permanent access token, paste the Token/Phone
  Number ID/Business Account ID into Network → AI Agents → Social Media
  Manager → Setup, and add a Webhook subscription in the Meta App Dashboard
  for the WhatsApp product pointing at
  `https://www.dubaival.com/api/inbox?action=whatsapp-webhook` (subscribed
  to the `messages` field). Until the SQL is run, `whatsapp_credits` reads
  as 0 everywhere (Buy Credit / Stripe checkout still work immediately,
  same keys as every other credit product). Until the Meta connection is
  complete, no WhatsApp messages can send or receive — Inbox's WhatsApp tab
  will simply stay empty. See the 2026-07-15 "pay-per-use WhatsApp Business
  API" + "WhatsApp credit-billing correction" work-log entries above for the
  full design (1 credit = 1 newly-opened 24h conversation window per
  contact at $0.49, matching Meta's real per-window billing unit — unlimited
  messages within an already-open window are free).

- **🟡 Pay-per-video AI VIDEO GENERATION credits — needs manual SQL + 3
  engine env vars** (added 2026-07-15, session 12): run
  `supabase-video-gen-credits-schema.sql` in Supabase SQL Editor (requires
  `supabase-video-credits-schema.sql` applied first, for its shared
  `stripe_events_processed` idempotency table). Then set `KLING_API_KEY`,
  `RUNWAY_API_KEY`, and `HEYGEN_API_KEY`/`DID_API_KEY` in Vercel env vars —
  the 3 engines the site owner chose to fund first (via `AskUserQuestion`:
  Kling AI, Runway Gen-4, HeyGen/D-ID). `STRIPE_SECRET_KEY`/
  `STRIPE_WEBHOOK_SECRET` are also required but should already be set (same
  keys the Pro subscription + Whisper checkouts already use — `video-gen-
  checkout` is just a 3rd Checkout mode on the same webhook). Until the SQL
  is run, `video_gen_credits` reads as 0 everywhere (Buy Credit button still
  works and checkout still completes, nothing crashes — the balance just
  never increments). Until an engine's own key is set, that engine simply
  doesn't appear in the picker at all (pre-existing `engine_status` gating,
  unrelated to credits). See the 2026-07-15 "pay-per-video AI VIDEO
  GENERATION credits" work-log entry above for the full design (one-time
  $4.99-per-video Stripe payment, additive on top of the existing 3
  free-videos/month quota, not a replacement for it).

- **🟡 Pay-per-video real subtitles (Whisper) — needs manual SQL + 2 env
  vars** (added 2026-07-15, session 12): run
  `supabase-video-credits-schema.sql` in Supabase SQL Editor, then set
  `OPENAI_API_KEY` in Vercel env vars. `STRIPE_SECRET_KEY`/
  `STRIPE_WEBHOOK_SECRET` are also required but should already be set (the
  existing Pro-subscription checkout needs them too) — `video-checkout`
  reuses the same keys, just a different Checkout mode. Until the SQL is
  run, `video_credits` reads as 0/undefined everywhere (button shows "Buy
  Credit" but the whole flow is otherwise inert, no crash). Until
  `OPENAI_API_KEY` is set, a purchased credit can't be spent yet — the
  "Generate REAL Subtitles" button will show a clear
  "OPENAI_API_KEY not configured" error (never silently fails or charges
  anyone) until it's added. See the 2026-07-15 "Phase 2" work-log entry
  above for the full design (one-time $2.99-per-video Stripe payment, not
  a subscription, per the site owner's explicit instruction).

- **🟡 Error reporting Admin viewer — needs manual SQL** (added 2026-07-14,
  session 11z): run `supabase-error-reporting-schema.sql` in Supabase SQL
  Editor (requires `supabase-admin-security-fix.sql` to already be applied,
  which it is). Automatic JS-error capture and the manual "Report an Issue"
  FAB both work immediately regardless (they just POST to the existing
  `analytics_events` table) — this migration only affects the Admin
  dashboard's ability to read those reports back; until it's run, the new
  "Live Error & Issue Reports" card shows a friendly "Reports unavailable
  yet" message instead of data. No new env vars needed.

- **✅ COMPLETED: News "Launch Bank" + error reporting** (2026-07-14, session
  11z) — closes the two items left open at the end of session 11y. See the
  session 11z work-log entry above for full details.

- **🟡 Video Platform rating/follower/video-count fixes — need manual SQL**
  (added 2026-07-14, session 11y): run `supabase-social-fixes-schema.sql` in
  Supabase SQL Editor (requires `supabase-social-schema.sql` to already be
  applied, which it is). Until it's run: `follower_count`/`video_count` stay
  frozen at their current values (no error, just no further updates), and
  submitting a rating in the new "Rate this Agent" widget will show a
  graceful "Could not submit rating" error since the `agent_reviews` table
  doesn't exist yet. No new env vars needed.

- **✅ FIXED (exception to the two-branch rule, explicit user authorization):
  "Blvd Heights T3" bogus entry removed + Centrium area mislabeling
  corrected** (2026-07-13, session 11w): cross-checked against
  `tools/calibration-output.json` (the real DLD-transaction-derived
  calibration source, `residential.buildings`) — it has exactly 3 real Blvd
  Heights blocks, all backed by real transaction counts (`blvd heights t1`:
  280 transactions/PSF 2497, `t2`: 172/2452, `podium`: 32/2357) and **no t3
  entry at all**; the live `DB`'s `"blvd heights t3"` PSF (2050) matched none
  of the 3 real calibrated figures either, confirming the user's domain
  knowledge that the building has exactly 2 towers. Separately, the same
  cross-check found `Centrium`'s 4 towers were split across two WRONG areas
  (Tower 1 & 3 tagged `Dubai Production City`, Tower 2 & 4 tagged `Jumeirah
  Village Circle`) despite all 4 being real, transaction-backed entries in
  the calibration source under one single area, `Me'Aisem First` — the app's
  own `DLD_AREA_MAP` already maps `"Me'Aisem First" → "IMPZ"`, and 31 other
  DB buildings are already correctly tagged `IMPZ`, confirming that's the
  right canonical area.
  - **Normally this branch never edits `js/data-residential.js`/
    `js/data-commercial.js`** (owned exclusively by the research branch,
    `claude/dubaival-portfolio-manager-5bgbjk` — see the two-branch workflow
    rule below). This was a narrow, explicit exception: the user directly
    instructed "هرچی ساختمانهایی هست ک پیدا کردی و اشتباه... خودت انجام
    بده" (whatever buildings you found that are wrong, fix them yourself)
    after this session had already done the real-data verification above.
    Future sessions on either branch: this specific edit was authorized
    per-instance, not a change to the ownership rule itself.
  - **Applied**: removed `"blvd heights t3"` from both `DB` and
    `BLDG_UNITS` (DB count 9227→9226); changed all 4 `"centrium tower N"`
    entries' `.a` field to `"IMPZ"`. Re-ran
    `node tools/generate-seo-pages.js` per the existing rule (wipes and
    regenerates `areas/`/`buildings/`/`sitemap.xml` from scratch) —
    `buildings/blvd-heights-t3.html` correctly disappeared, the 4 Centrium
    building pages and the `downtown-dubai`/`dubai-production-city`/`impz`
    area pages updated accordingly.
  - Verified: `node -c` on the touched file; `lookupBuilding()` and
    `computeValuation()` both still resolve correctly for Centrium Tower 1
    under the corrected `IMPZ` area and for both real Blvd Heights towers
    (no regression from the edit); the existing metric-registry Node test
    (2,429 checks, 0 errors) re-run clean; confirmed the unrelated
    "Centrium Tower" (no number, a different real building in Nad Al Sheba)
    was untouched.
  - **Not independently re-verified this session** (out of scope for this
    fix, flagged for the research branch's own judgment): the other 6
    tower-numbering-gap candidates from the same scan — `Serra` and `Farah`
    match their calibration source exactly (their gaps look like real DLD
    data patterns, not likely errors); `U-Bora` and `Palace Towers` couldn't
    be confirmed or denied since `calibration-output.json` doesn't cover
    their extra tower numbers at all — would need live listings/DLD data
    beyond what this branch has access to.

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
- **Building research ACTIVE**: Current: 9,226 residential across 216+ areas
  (as of 2026-07-13 — was 9,227, -1 from removing the confirmed-bogus "Blvd
  Heights T3" entry, session 11w; before that was 9,123, +104 from a research
  session's Round 3 building batch + 30 missing villa sub-communities, merged
  into the code-quality branch via cherry-pick). 347 areas have benchmarks.
  Target areas listed in "Building
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
