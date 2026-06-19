# DubaiVal — Project Context for Claude Sessions

Read this first. It exists so a fresh session doesn't have to re-read the whole
single-file app or re-derive line numbers/history from scratch.

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
- **`js/data.js`** — All databases: `DB` (6,281 buildings), `BLDG_UNITS`,
  `AREAS` (287), `CLUSTER_DB`, `VIEW_P`, `AREA_ALIASES`, themes. **This is
  where building research goes.**
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

Other files (`dubaival.jsx`, `index-3.html`) are old/unused — do not edit.

## Database sizes (as of 2026-06-18, branch `amazing-mccarthy`)

All databases live in **`js/data.js`**.

- **`var DB={...}`**: **6,281 buildings** (single massive line). Schema:
  `{"p":psf,"lo":lowPsf,"hi":highPsf,"sc":serviceCharge,"a":"Area Name","g":"Grade","df":1(optional)}`.
  Keyed by lowercase building name.
- **`BLDG_UNITS={...}`**: **~6,454 entries** (building unit counts for turnover
  rate calculation).
- **`const AREAS={...}`**: **287 keys** (area benchmark database). Schema:
  `{psf, sc, r1/r2/r3, rv2..rv7, y:[yieldLow,yieldHigh], g:[growth0-1yr%,growth1-3yr%,growth2-5yr%], dom, txVol}`.
- **Building research ACTIVE** — user wants more buildings added, especially
  in luxury/high-transaction areas (see "Building research gaps" below).

## Code map (split file structure)

Code is now split across `js/*.js` files. To find anything, grep across `js/`:

| What | File | How to find |
|---|---|---|
| Databases (DB, BLDG_UNITS, AREAS) | `js/data.js` | `grep "var DB=" js/data.js` |
| CLUSTER_DB, VIEW_P, AREA_ALIASES | `js/data.js` | `grep "CLUSTER_DB\|VIEW_P\|AREA_ALIASES" js/data.js` |
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
- Asset tracking with building auto-lookup from 6,162-entry DB
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
  BLDG_UNITS expanded to 6,192, Liquidity data added to all 287 AREAS.
- **2026-06-17 (session 1)**: Portfolio Manager tab — asset tracking, real-time
  valuations, portfolio analytics, investment profile, AI analysis via Groq.
- **2026-06-16**: Outlier fix (trimmed mean), Case Study / Track Record,
  71 orphan area strings resolved (81→152 AREAS), Price Alert (code-complete),
  B+ grade-guess bug fix, investSignal/totalReturn/confScore features.

## Outstanding / open items

- **Price Alert deployment blocker**: `/api/*.js` return 404. Next steps:
  1. Check if local `package.json` has extra deps triggering Vercel auto-detection
  2. Try deploying via git push to `main` instead of `npx vercel --prod`
  3. Check Vercel deployment "Source" tab for uploaded files
  4. Fallback: move API functions to Supabase Edge Functions
- **Resend domain `dubaival.com`**: was "Partially Verified" as of 2026-06-17.
  May be fully verified by now — check Resend dashboard.
- **Security note**: RESEND_API_KEY and SUPABASE_SERVICE_ROLE_KEY were shared in
  chat. User was advised to regenerate both. Do NOT echo these keys.
- **PENDING: Opportunity Alerts (هشدار فرصت‌های پنهان)** — ~~deferred from
  2026-06-17~~ **COMPLETED** (both phases). All 6 alerts live in
  `js/portfolio.js` (lines ~275-430):
  **Phase 1:** DLD Fee Recovery Timer, Rent Optimization Alert, Optimal Exit
  Window, Equity Release Calculator.
  **Phase 2:** Airbnb vs Long-term Rent Comparison (STR_DATA covers all 287
  areas with nightly rates + occupancy), Renovation ROI Estimator.
- **AVM accuracy improvement**: Track Record shows median ~20% error on 18 real
  transactions. DB "p" (psf) may reflect asking prices not closed DLD prices
  for some buildings — potential lead for accuracy improvement.
- **Building research ACTIVE**: User wants more buildings, targeting 500+.
  Current: 6,281. Target areas listed in "Building research gaps" below.
  **IMPORTANT**: Buildings go in `js/data.js`, NOT in `index-6.html`.
- **Agent video analysis & upload**: not built yet, deferred to future.
- **Deploy reminder**: this branch does NOT auto-deploy. User must merge to
  `main` or run `vercel --prod` to go live.

## Building research gaps (priority areas)

When adding buildings, edit **`js/data.js`** only. Add to `var DB={...}` and
`const BLDG_UNITS={...}` on the same file.

| Area | Have | Estimated Real | Gap |
|---|---|---|---|
| DIFC | 15 | 80+ | **65+** |
| Palm Jebel Ali | 1 | 50+ | **49+** |
| Palm Jumeirah | 134 | 400+ | **266+** |
| Business Bay | 212 | 500+ | **288+** |
| Dubai Marina | 210 | 500+ | **290+** |
| MBR City | 72 | 150+ | **78+** |
| Dubai Hills Estate | 153 | 300+ | **147+** |
| Downtown Dubai | 202 | 400+ | **198+** |
| Dubai Creek Harbour | 147 | 200+ | **53+** |
| Meydan | 176 | 250+ | **74+** |
| Emaar Beachfront | 21 | 40+ | **19+** |
| Tilal Al Ghaf | 11 | 30+ | **19+** |
| District One | 12 | 30+ | **18+** |
| Sobha Hartland | 37 | 60+ | **23+** |
| Za'Abeel | 11 | 25+ | **14+** |
| JBR | 22 | 40+ | **18+** |

## Testing technique (no build/test infra)

To test valuation/DB in isolation, load `js/data.js` + `js/valuation.js` in
Node with stubs for `window`/`document`/`localStorage`/`navigator`/`fetch` as
no-ops. `computeValuation` requires `f.price` and `f.size`/`f.buaSize` set.

## User preferences

- Communication in **Persian/Farsi**
- User email: momeni.yashar@gmail.com
- Broad "upgrade everything" directives need scoping/clarification — confirm
  concrete scope before doing broad unscoped work
