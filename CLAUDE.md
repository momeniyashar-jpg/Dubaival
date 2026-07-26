# DubaiVal — Project Context for Claude Sessions

Read this first. It exists so a fresh session doesn't have to re-read the whole
single-file app or re-derive line numbers/history from scratch.

---

## 🔴 #0 CRITICAL — FROZEN NAVIGATION (DO NOT CHANGE WITHOUT USER APPROVAL)

The navigation structure below is **locked**. No session may add, remove, rename,
or move any tab/sub-tab without the user explicitly asking for it. Any change to
`NAV_SECTIONS` in `js/core.js` or the routing block in `js/app.js` **must** be
accompanied by an update to this table. Treat this as the single source of truth.

### Complete Tab Map (locked 2026-07-04, TrackRecord removed 2026-07-18,
SocialChat/"AI Assistant" removed 2026-07-18 — see the dated notes
directly below the table)

| Section (id) | Sub-tab (id) | Label shown | Render function | File |
|---|---|---|---|---|
| **Home** | — | Home | `renderHome()` | `js/app.js` |
| **Market** | Dashboard | Dashboard | `renderMarket()` | `js/market.js` |
| | Analyzer | Analyzer | `renderAnalyzer()` | `js/market.js` |
| | QuickCheck | Quick Check | `renderQuickCheck()` | `js/market.js` |
| | Index | Market Index | `renderMarketIndex()` | `js/marketindex.js` |
| | Compare | Compare | `renderCompare()` | `js/portfolio.js` |
| | Find | Find | `renderFind()` | `js/app.js` |
| | OffPlan | Off-Plan | `renderOffPlan()` | `js/offplan.js` |
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
| **More** | Workspace | Workspace | `renderWorkspace()` | `js/workspace.js` |
| | Reports | Reports | `renderReportBuilder()` | `js/workspace.js` |
| | About | About | `renderAbout()` | `js/about.js` |

### Hidden routes (not in nav, accessible via hash only)
- `#admin` → `renderAdmin()` in `js/app.js` (password protected)

### Removed sub-tabs (kept here so a future session doesn't re-add them
blindly, matching the spirit of rule 5 below for removals too)
- **Market → TrackRecord** (removed 2026-07-18, user-approved, after a
  direct product discussion) — `renderTrackRecord()` (`js/market.js`) still
  exists (unreferenced by any route) since its scoring logic is meant to be
  reused later, but is not currently reachable anywhere. Full reasoning and
  the plan for what replaces it are in the 2026-07-18 work-log entry and in
  a comment directly above `renderTrackRecord()` in `js/market.js` — in
  short: the feature is fundamentally a one-time trust/credibility backtest
  ("our model checked against N real sales"), not a task tool, and its
  current sample (18 case studies) is static and hand-picked, which
  undercuts the very credibility it's meant to build. User's explicit
  instruction: do not show this anywhere (tab or elsewhere) again until it's
  rebuilt on a real, automated, continuously-growing, unbiased sample of
  actual closed transactions — see Outstanding items below for what that
  requires. Once that exists, it belongs inside the Analyzer result, not as
  its own tab.
- **SocialMedia → SocialChat ("AI Assistant")** (removed 2026-07-18,
  user-approved, found while starting the AI Agents audit) — the user
  flagged before that audit even began that this tab looked identical to
  Network → AI Agents and asked for a real check first: "پس از بررسی...در
  صورت مشابه بودن این دو تب، AI assistant را از تب social حذف کن". Confirmed
  with code, not a guess: `js/app.js`'s routing called
  `content.appendChild(renderChat())` for BOTH `currentSubTab==="Chat"`
  (Network) and `currentSubTab==="SocialChat"` (SocialMedia) — same
  function, zero arguments, zero differentiation of any kind (no
  `{inlineAgent:...}`, no different default agent, nothing) — a 100%
  byte-identical duplicate, not merely similar. Removed the sub-tab from
  `NAV_SECTIONS` (`js/core.js`) and its routing branch in `js/app.js`;
  `TAB_TO_SECTION["SocialChat"]` (an old deep-link key) now redirects to
  `["Network","Chat"]` instead of the removed destination, so a stale
  bookmark/link still lands on the real, surviving AI Agents tab rather
  than erroring or silently doing nothing. `renderChat()` itself
  (`js/chat.js`) is untouched — still the single, correct implementation,
  now reachable only via Network → AI Agents as originally intended.

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

## 🔴 #3 CRITICAL DIRECTIVE — AI Chief of Staff: Automation-First, Per-Process Auto/Approval Toggle

Standing product requirement from the user (2026-07-17, session 14).
**Implemented later the same session** — see the "AI Chief of Staff —
Automation Settings shipped" work-log entry below for exactly what was built
(the `CHIEFS_AUTOMATION` toggle system, wired into auto-matching/drafting/
sending/client-extraction) and what was deliberately left as an explicit
per-action trigger (Document Assistant, and the inherently-manual Inventory/
Client/Pipeline data-entry forms, which have no external source to automate
from). Keep this directive's text below as the source-of-truth VISION for
any future capability this tab grows — a new feature should be built
automation-first from day one, matching the pattern already shipped, not
re-litigated per feature.

**The vision**: an agent/user using AI Chief of Staff should feel like they hired
a real personal assistant — one 100x smarter and faster than a human — not a
tool they have to babysit with manual steps. Every capability in this tab should
default to fully autonomous operation.

**Concretely**:
- **No manual/paste-based steps should exist as the primary flow for anything**
  this tab can plausibly automate — this applies broadly, not just replying to
  messages: note-taking/extraction while an agent is on a phone call with a
  client, note-taking/extraction from an in-progress chat with a client,
  drafting/sending replies, and any other current or future AI Chief of Staff
  capability.
- **For every such automatable process, there must be one simple toggle**:
  should THIS process run **fully automatic** (AI does it and acts on its own —
  sends the reply, saves the extracted note, etc., no human in the loop), or
  **require approval first** (AI prepares the result — drafts the reply,
  extracts the note — but a human/agent must review and click one button to
  approve before it's actually sent/saved/executed)?
  - "Manual" in this feature's vocabulary means ONLY this second case (AI does
    the work, human approves with one click) — it does NOT mean the user types
    or copy-pastes anything by hand as the normal flow.
- **Default state should lean toward automatic** — the tab's whole character
  should read as vigilant and automation-first; a user has to deliberately flip
  a process to "requires approval" if they want a human checkpoint, not the
  other way around.
- Applies to (at minimum, likely more as the tab grows): the WhatsApp/DM
  auto-reply pipeline (already built, already defaults to automatic per
  existing session-13/14 work — confirm it matches this toggle model exactly
  when revisited), the Conversation Scanner (chat note extraction), and the
  voice-call-transcription-into-Client-Memory-Bank feature (phone call note
  extraction) — both of the latter two currently require the agent to
  manually paste text or upload a recording as their ENTRY point, which is
  fine (that's how the raw data gets in), but what happens to the EXTRACTED
  result afterward (auto-saved to Client Memory Bank vs. shown for one-click
  approval first) should follow this same per-process toggle, not be
  hardcoded either way.

**Not yet scoped or built**: the exact UI for this toggle (likely a settings
panel inside AI Chief of Staff, one switch per process), which processes need
their own Supabase-persisted setting vs. a shared one, and how it interacts
with the existing credit-gated WhatsApp window logic. Flagged here so the next
session that touches AI Chief of Staff addresses this deliberately rather than
guessing at automation defaults per-feature ad hoc.

## 🔴 #4 CRITICAL DIRECTIVE — Zero-Touch Onboarding: OTP-Only Verification, No User-Facing Tokens/API Keys

Standing product requirement from the user (2026-07-17, session 14). Read this
before touching ANY onboarding step, Social Setup field, credential form, or
subscription-activation flow, for any user type (individual agent, company,
plain consumer).

**The vision**: agents, companies, and every other user of this platform must
NEVER perform manual technical setup to connect anything to DubaiVal. A user's
entire job, for connecting any channel/account/subscription, is limited to
exactly these inputs and nothing more:
1. Their phone number.
2. Their email.
3. Their social media account — connected by clicking "Connect Instagram" /
   "Connect Facebook" / etc. and approving on that platform's OWN consent
   screen, never by pasting a raw credential into our UI.

Everything else — API keys, access tokens, webhook subscriptions, Phone
Number IDs, WABA IDs, Ads Pixel IDs, Conversions API tokens, or any other
platform-side credential — must be provisioned AUTOMATICALLY by DubaiVal
itself, the instant the user's ownership of that phone/email/account is
verified. A user must never be sent into a 3rd-party developer dashboard
(Meta Business Settings, a Graph API Explorer, a "generate a permanent
token" wizard, etc.) to fetch a value and paste it back into DubaiVal.

**The only verification mechanism allowed is OTP** (a one-time code) —
delivered via email or via a WhatsApp message. Nothing else. No "go copy
your access token," no "go find your Phone Number ID," no manual multi-step
external-dashboard walkthrough ever shown to an end user.

**Paid features/subscriptions**: activation must be fully automatic,
triggered by a real payment-confirmation webhook (Stripe), the moment
payment is confirmed — never a manual admin action performed per customer.

**The ONE exception — us**: the platform operator (this project's own Meta
App, Vercel project, Supabase project, Stripe account) is the only party
ever allowed to do manual setup — e.g., completing Meta Business/App
verification, configuring a Meta App's Embedded Signup product, setting
Vercel environment variables, running a Supabase SQL migration. This is
infrastructure-level, one-time work done by us — never per-user, never
per-agent, never per-company. If a task can plausibly be automated but
currently requires the OPERATOR to do a one-time platform-level setup step,
that's fine and expected; if it requires an individual END USER to do
anything beyond the 3 inputs above, that's a violation of this directive.

**Concrete implication — much of the current onboarding violates this
directive today, and migrating it is a standing priority**: several existing
Social Setup fields (`js/chat.js` `showSocialSetup()`) currently ask a user
to manually paste a raw credential — WhatsApp Permanent Access
Token/Phone Number ID/WABA ID; Meta Ads Pixel ID/Conversions API Access
Token (added this same session, see the "Meta Ads conversion feedback loop"
work-log entry below — already a known, disclosed exception to this
directive, not yet migrated); and every other platform's raw API key
(Instagram/Facebook/LinkedIn/Twitter/TikTok/YouTube). Per this directive,
every one of these should eventually be replaced with a real OAuth/
embedded-consent flow instead:
- **WhatsApp** → Meta's own "WhatsApp Embedded Signup" (part of Facebook
  Login for Business) — the user clicks "Connect WhatsApp," logs into their
  own Meta Business Manager inside an embedded flow, and Meta itself both
  verifies their phone number AND returns the Phone Number ID/WABA ID/token
  to our backend automatically via a server-side token exchange. The user
  never sees or types any of these values.
- **Instagram / Facebook** → standard Facebook Login for Business OAuth
  (user clicks "Connect," grants permissions on Meta's own consent screen,
  our backend receives a long-lived access token server-side, no copy-paste).
- **Meta Ads Pixel** → once a business's ad account is connected via the same
  Facebook Login flow (with `ads_management`/`business_management` scope),
  the Pixel ID should be auto-discovered via the Marketing API instead of
  typed in by the user.
- **LinkedIn / Twitter / TikTok / YouTube** → same principle, each
  platform's own OAuth "Connect" flow.

**Hard external dependency — disclosed, not hidden**: every OAuth-based flow
above requires OUR OWN Meta App (and the equivalent LinkedIn/Twitter/TikTok/
Google apps) to complete that platform's App Review / Business Verification
process first — a real, external, days-to-weeks process that only the
platform operator can initiate (the same category of external process as
the WhatsApp Business API verification already documented in the 2026-07-15
work-log entries below). This is "our" manual setup (allowed under this
directive), never the end user's — but it means this migration cannot ship
instantly; it needs the operator to start/complete each platform's review
before the corresponding "Connect X" button can go live for real users.
**Any session picking up this work must disclose this dependency plainly and
confirm current Meta/LinkedIn/Twitter/TikTok App Review status with the user
before assuming a "Connect X" button can go fully live** — do not silently
promise instant automation that a pending external review actually blocks.

**Not yet built** (as of 2026-07-17): the OTP verification system itself
(phone via WhatsApp message + email), and any of the OAuth "Connect X" flows
described above — every current social/WhatsApp/ad connection still uses
manual credential paste-in. Every future session that touches onboarding,
Social Setup, or any per-user credential field should treat this directive
as the target architecture and actively push toward it — never add a new
"paste your API key/token here" field without logging it here as a
deliberate, explicit, temporary exception (the way the Meta Pixel/CAPI token
fields added this session are logged above).

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
- **`js/offplan.js`** — Off-Plan Projects tab (added 2026-07-17, schema
  revised same day — see work log), `renderOffPlan()`,
  `computeOffPlanForecast(area,launchDate,expectedHandover,launchPSF,
  devRecord)` (launch→handover→+5yr price forecast per unit type, blends
  `AREAS[].g` real growth data with each developer's own track record when
  one exists), `_offplanProjectForecasts()` (computes one forecast per unit
  type on a project), `_parseUnitPricing()` (parses the
  "UnitType:PSF:SizeMin-SizeMax" comma-separated shorthand used by both the
  public submit form and the Admin Quick Add form). Data lives in Supabase
  (`offplan_projects`/`offplan_unit_types`/`developer_track_record` —
  `supabase-offplan-schema.sql`, requires manual execution), not a static
  JS file. Admin review queue (pending submissions, quick-add, developer
  track record editor) lives in `renderAdmin()` in `js/app.js`, not in this
  file — matches the OFM document-verification precedent of keeping
  admin-only review UI inside the Admin Dashboard.
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
| `user_portfolios` | `supabase-user-profiles-schema.sql` (+ `supabase-portfolio-digest-schema.sql` for `last_digest_sent_at`) | Cloud-synced portfolio (`portfolio_data`/`goals_data` jsonb) per signed-in user — owner-only RLS via `auth.uid()=user_id`; synced by `syncPortfolioToCloud()`/`syncPortfolioFromCloud()` (`js/auth.js`) |
| `portfolio_value_snapshots` | `supabase-portfolio-history-schema.sql` | One portfolio-value snapshot per signed-in user per day (`unique(user_id,snapshot_date)`), captured by `_capturePortfolioSnapshot()` (`js/portfolio.js`); powers the Health tab's value-history chart and the weekly digest email (requires manual execution, see Outstanding items) |
| `offplan_projects` | `supabase-offplan-schema.sql` | Off-Plan Projects tab — tracked launches (name/developer/area/`project_stage` prelaunch-launched-under_construction-handed_over/`eoi_open_date`/launch+handover dates/`payment_plan`), `review_status` pending/published/rejected, admin-reviewed via `admin_pending_offplan_projects`/`admin_review_offplan_project`/`admin_add_offplan_project` RPCs (requires manual execution, see Outstanding items) |
| `offplan_unit_types` | `supabase-offplan-schema.sql` | Per-unit-type pricing for an Off-Plan project (unit_type/launch_psf/size_min/size_max) — one row per unit type since a studio and a villa in the same masterplan price completely differently; FK to `offplan_projects`, RLS gated on parent's `review_status='published'` |
| `developer_track_record` | `supabase-offplan-schema.sql` | Per-developer historical price-growth performance, feeds `computeOffPlanForecast()` in `js/offplan.js`; admin-only write via `admin_upsert_developer_track_record` RPC |
| `knowledge_base` | `supabase-knowledge-base-schema.sql` + `supabase-knowledge-base-recency-fix.sql` + `supabase-forecast-accuracy-schema.sql` + `supabase-knowledge-research-notes-schema.sql` | RAG vector store — 768-dim embeddings (Jina or Gemini) of live news, daily market snapshots, weekly forecast-accuracy audits, and hand-curated `research_note` facts (durable domain/process knowledge from research — see below). Recency-weighted retrieval. Live since 2026-07-11 (see Outstanding items). |
| `area_benchmarks` | (inside `api/refresh-market-data.js` workflow, already deployed) | Live PSF + rent data per area, refreshed daily by cron; also carries `rent_active_count`/`rent_avg_days_listed` (session 11n, requires manual execution — see Outstanding items) |
| `price_history` | (inside `api/refresh-market-data.js` workflow, already deployed) | Historical PSF per area per day — also the ground truth for the forecast-accuracy audit below |
| `rental_listings_seen` | `supabase-rental-liquidity-schema.sql` | Service-role-only tracking of individual for-rent listing first/last-seen dates — derivation input for the weekly rental-velocity job, never read by the client (requires manual execution, see Outstanding items) |
| (new columns on `social_inbox`/`chiefs_clients`/`social_credentials`) | `supabase-meta-conversion-schema.sql` | AI Chief of Staff → Meta Ads conversion feedback loop: `ad_referral` jsonb (Click-to-WhatsApp `ctwa_clid` attribution, captured at webhook-receive time and carried through to a saved client) plus per-agent `meta_pixel_id`/`meta_capi_token` credentials (requires manual execution, see Outstanding items) |

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

## AI Chief of Staff — Complete Feature List (`renderChiefs()`, `js/chiefs.js`)

Living reference — the single source of truth for exactly what this tab does.
Update this list whenever a capability is added, removed, or materially
changed, rather than leaving it to drift like a stale changelog. See CLAUDE.md
Directive #3 (top of this file) for the standing product vision this tab is
built against: an automation-first "hired assistant," not a tool the agent
babysits.

**Isolated module** — its own state (`CHIEFS_STATE`), its own Supabase tables
(`chiefs_inventory`/`chiefs_clients`/`chiefs_matches`/`chiefs_pipeline`,
`supabase-chiefs-schema.sql`), no dependency on any other tab's code. RLS on
those 4 tables was originally `anon, authenticated USING(true)` (an agent
could use the whole tab with zero sign-in via a per-browser fingerprint,
`_chiefsId()`) — **hardened 2026-07-19 to real per-agent ownership**
(`auth.uid()::text = agent_id`, a real signed-in account now required) after
the public AI Concierge link below made the old blanket-access design a
materially worse exposure. See "Security & real per-agent ownership" further
down for the full fix.

### Dashboard (`_renderChiefsDashboard()`)
- **Daily Briefing** — AI-narrated summary generated once per session from
  real, already-computed signals only (never invents a fact) — new matches,
  new AI Concierge leads, pipeline actions due/overdue, stale clients, stuck
  deals, aging listings (`_chiefsGenerateBriefing()`/`_chiefsComputeSignals()`).
- **⚡ Automation Settings** (`_renderChiefsAutomationSettings()`) — 4 toggles,
  all default ON: Auto-draft messages for new matches, Auto-send matched
  messages, Auto-save extracted client info, Report ad conversions to Meta.
  Persisted per-browser in `localStorage.dv_chiefs_automation`.
- **🔗 Your AI Concierge Link** (`_renderChiefsConciergeCard()`, added
  2026-07-19) — the agent's own shareable public chat link, a live count of
  leads captured via it, one-click copy.
- Stats row (Listings / Active Clients / Pending Matches / Active Deals),
  Quick Actions (+Add Listing, +Add Client, Scan Chat/Call, Run Auto-Match),
  Pending Matches preview, and **Smart To-Do** — one priority-sorted list
  merging overdue/today pipeline actions, new AI Concierge leads, stuck deals,
  stale clients, and aging listings (`_chiefsSmartTodo()`).

### Inventory — Property Inventory Bank (`_renderChiefsInventory()`)
- Add/Edit/Delete pocket listings; every submission gets a real DubAIVal AVM
  auto-valuation (`computeValuation()` — same engine as the Analyzer).
- **📋 Paste & Extract** (`chiefsScanListing()`) — AI-extracts building/area/
  price/etc. from a pasted WhatsApp message or listing-site export, pre-fills
  the form for one manual review before saving (never auto-saves a listing —
  a wrong price here would directly undermine the valuation-accuracy claim
  once matched and quoted to a client).
- **Competitor / Market Watch** (`_chiefsCompetitorCheck()`) — flags whether
  a pocket listing's asking PSF is above/below the building's current
  calibrated market PSF, with the real reasons why.

### Clients — Client Memory Bank (`_renderChiefsClients()`)
- Add/Edit/Delete client requirements (area/beds/budget/purpose/timeline).
- **Conversation Scanner** (`chiefsScanConversation()`) — paste a WhatsApp/
  email conversation, AI extracts structured requirements.
- **Voice Call Transcription** (`chiefsTranscribeVoiceCall()`) — upload a
  recorded call; real Whisper transcription (pay-per-use credit, shared pool
  with the Video Editor's subtitle feature) auto-feeds the same scanner.
- Both scanner paths respect the `autoSaveExtracted` toggle: auto-save
  straight to Client Memory Bank, or open the form for one-click review.
- Source badges on each client card: "WhatsApp" (from the scanner) and
  "🔗 AI Concierge" (from the public livechat widget, added 2026-07-19).

### Matches — Auto-Matching Engine (`_chiefsAutoMatch()`, `_scoreMatch()`)
- Hybrid scoring: server-side semantic cosine similarity (Gemini/Jina
  embeddings, `match_chiefs_inventory`/`auto_match_chiefs_semantic` RPCs) blended
  65/35 with deterministic rule-based scoring (area/beds/budget/type).
- **AI Message Drafter** (`chiefsDraftMessage()`) — auto-fires the instant a
  fresh match is created, unless `autoDraft` is off.
- **Real send** (`chiefsSendMatchMessage()`/`chiefsApproveMatch()`) — posts
  directly to the connected WhatsApp Business API; auto-fires on draft unless
  `autoSend` is off. Falls back to clipboard + a manual wa.me link ONLY when
  the API isn't connected/out of credit/the token expired — and (fixed
  2026-07-19) ALWAYS surfaces a toast either way, since a silent auto-send
  failure with zero feedback directly undermines the "hired assistant, not a
  tool you babysit" promise this whole tab is built on.

### Pipeline — Deal Pipeline (`_renderChiefsPipeline()`)
- 8 real stages (Lead → ... → Closing → Closed/Lost, including "Docs").
  Add/Edit deals, track `next_action`/`next_action_date`.
- **📄 Document Assistant** (`renderChiefsDocGenOverlay()`) — AI-drafts an
  Offer Letter / MOU / Listing Agreement from the deal's real data, always
  review-first (never auto-sent), with a persistent "draft/reference only,
  not the official RERA form, not legal advice" disclaimer.

### Commission Tracker (`_renderChiefsCommission()`)
- Real stage-weighted commission projection (`CHIEFS_STAGE_WEIGHT`, e.g. lead
  10% → closing 90% → closed 100%) instead of a flat sum across the whole
  pipeline. Closed commission grouped by month; active deals ranked by
  weighted contribution.

### 📣 Broadcast — Segment Messaging (`_renderChiefsBroadcast()`, added 2026-07-19)
Closes the "Auto-Matching only ever handles ONE listing ↔ ONE client at a
time" gap — the direct answer to "tell everyone looking for a villa in JVC
about this new listing" in one action, inspired by respond.io's broadcast-
to-segment pattern.
- Filter by area (substring)/purpose/property type against ALL active
  clients (`_chiefsBroadcastSegment()`).
- **AI Draft** (`chiefsBroadcastDraft()`) — optionally references a specific
  pocket listing, writes a `{name}`-templated broadcast message.
- **Real send** (`chiefsBroadcastSend()`) — sequential (350ms-paced, never
  hammers the send API) real WhatsApp Business API sends to every client in
  the segment who has a phone on file, with a live progress bar, a final
  sent/failed/skipped-no-phone summary (toast + persisted
  `localStorage.dv_chiefs_broadcast_last` so the last run's outcome survives
  a tab switch). Deliberately does NOT offer the clipboard+wa.me fallback
  used elsewhere in this file — popping open one browser tab per recipient
  would be blocked by every modern browser at this scale, so the UI states
  plainly that WhatsApp Business API must be connected first rather than
  silently attempting something that can't work.

### 🔗 AI Concierge — public, no-sign-in live chat (added 2026-07-19)
The other half of the same respond.io-inspired pair: captures COLD leads
(people who've never opened DubAIVal) straight into an agent's own Client
Memory Bank, matching "your best sales agent doesn't sleep."
- **Entry point**: a standalone, shareable link —
  `https://www.dubaival.com/#concierge=<agentId>` — routed in `js/app.js`'s
  `render()` as a full-page takeover with NO app shell (no sidebar/tabs/
  header), since it's meant for prospects, not app users. The agent's own
  copyable link lives in the Dashboard card above.
- `_conciergeInit(agentId)` fetches that agent's own available inventory
  (`chiefs_inventory?agent_id=eq.<id>&status=in.(available,pocket)`) so the
  chat is grounded in real listings, never invented ones.
- `conciergeSend()` — a real Groq `askAI()` conversation; after every
  exchange, `_conciergeTryExtractAndSave()` runs a lightweight AI extraction
  pass and, once a name plus a phone or email is present, saves a real
  `chiefs_clients` row (`source:"livechat"`) for the TARGET agent and scores
  it against that agent's already-fetched inventory via the same
  `_scoreMatch()` the real Auto-Matching Engine uses, creating real
  `chiefs_matches` rows.
- Feeds into the Dashboard: new AI Concierge leads (last 24h) appear in both
  the Daily Briefing's facts and the Smart To-Do list.
- **Deliberately NOT built on `_chiefsAutoMatch()`/`chiefsSaveClient()`/
  `CHIEFS_STATE`** — those all resolve the CURRENT BROWSER's own agent via
  `_chiefsId()`, which on a stranger's phone would be a meaningless new
  fingerprint, not the real agent whose link they opened. Every Concierge
  function takes the target `agentId` explicitly.
- **Security — FIXED 2026-07-19** (see "Security & real per-agent ownership"
  below): the visitor's own client-save no longer touches Supabase directly
  at all — it goes through a validated, rate-limited, service-role server
  endpoint (`api/chiefs-embed.js`, `action=concierge-save`), which is now the
  only thing on the whole platform still allowed to write into another
  agent's Client Memory Bank on their behalf.

### 📞 AI Voice Concierge — a live, real-time phone agent (added 2026-07-19)
The voice counterpart to the AI Concierge above: a real phone number,
answered in real time by an ElevenLabs Conversational AI agent grounded in
the target agent's own listings, that qualifies the caller and saves real
leads straight to Client Memory Bank. Built after the user shared an
ElevenLabs "Voice Agents With Emotional Intelligence" ad and asked whether
the idea fits DubaiVal — see the dated work-log entry below for the full
research trail (real pricing, telephony feasibility, ElevenLabs' actual
webhook-tool/conversation-initiation API).
- **Architecture — reuse, not a parallel system**: ElevenLabs' own
  Conversational AI platform handles the entire real-time speech pipeline
  (speech-to-text/LLM/text-to-speech) — this project does NOT build a
  custom audio-streaming pipeline. ONE shared ElevenLabs Agent definition
  (`VOICE_AGENT_SYSTEM_PROMPT`, `api/inbox.js`) serves every real estate
  agent's own phone number; a "conversation initiation" webhook
  (`action=voice-init`) tells ElevenLabs, per call, WHICH agent's number was
  dialed (via `{{agentId}}`/`{{agentName}}`/`{{creditsAvailable}}`/
  `{{callerPhone}}` dynamic variables) so one agent definition can
  personalize itself instead of needing N separate configs.
- **The 2 in-call tools are the EXISTING, already-hardened endpoints, not
  new code**: `lookup_market_knowledge` points directly at
  `api/knowledge-query.js` (the same RAG retrieval endpoint already grounding
  Chat Agents/Compare/Personal Advisor) and `save_lead` points directly at
  `api/chiefs-embed.js?action=concierge-save` (the exact same validated,
  server-side, rate-limited write path the text AI Concierge already uses,
  extended with a `source` param — `"voice_call"` vs the pre-existing
  default `"livechat"` — so both channels' leads land in `chiefs_clients`
  identically). No parallel lead-saving logic was built.
- **Telephony**: real UAE (or other) Twilio numbers, bought and linked to
  the shared ElevenLabs Agent by the OPERATOR only (Admin Dashboard → "AI
  Voice Concierge — Number Pool") — never per-agent, matching Directive #4's
  zero-touch principle. An agent "activates" a number from this pool with
  one click (`chiefsActivateVoice()` → `claim_voice_number` RPC) — they never
  touch Twilio or ElevenLabs directly. Confirmed via live research: Twilio
  DOES sell UAE geographic numbers, but INBOUND-ONLY (a good fit for this
  MVP's "answer when the agent is unavailable" use case), gated behind a
  Regulatory Bundle (KYC documents) — the same class of external, operator-
  only setup step as Meta Business Verification.
- **Billing — pay-per-minute, post-paid**: an agent buys a bundle of voice
  minutes (`api/billing.js` `action=voice-checkout`, same one-time Stripe
  Checkout pattern as the WhatsApp/video credits above — default $9.99/60
  minutes, tunable via env vars, NOT a confirmed final price — the exact
  Twilio UAE per-minute telephony rate could not be verified live in this
  sandbox). Minutes are deducted AFTER each call from the real ElevenLabs
  post-call webhook's own reported duration (`action=voice-webhook`,
  `consume_voice_credits` RPC) — never estimated in advance, matching how a
  real telephony/AI usage bill only reconciles after the fact. Zero credits
  doesn't hang up an in-progress call; it's checked at `voice-init` time and
  the agent politely ends any NEW call with a "temporarily unavailable"
  message instead.
- **Fallback lead extraction**: if the caller hangs up before the mid-call
  `save_lead` tool ever fires, the post-call webhook runs the SAME
  lightweight Groq extraction the text AI Concierge/Conversation Scanner
  already use on the full transcript, gated by a new per-agent
  `social_credentials.voice_auto_save_extracted` toggle (default `true`,
  mirrors the `auto_reply_*` toggles' exact "only an explicit `false`
  disables it" convention from the same day's Inbox-automation work).
- **New internal Chiefs view**: "Voice" tab (`_renderChiefsVoiceView()`) —
  activate/deactivate, live credit balance + Buy Minutes button, and real
  call history (caller, duration, credits charged, whether a lead was
  saved). A compact Dashboard summary card
  (`_renderChiefsVoiceCard()`) deep-links into it, mirroring the AI
  Concierge link card's exact visual pattern.
- **Admin setup** (`renderAdmin()`, `js/app.js`): a "🎙️ AI Voice Concierge —
  Number Pool" card to add Twilio numbers to the pool, and a "Create/Update
  Shared Agent" button (`action=voice-admin-setup-agent`) that calls
  ElevenLabs' real Agent-create/update API directly — but returns the exact
  URLs to paste into ElevenLabs' OWN dashboard for the 2 webhook tools + the
  conversation-initiation/post-call webhooks, rather than guessing at an
  unverifiable nested tool-attachment JSON schema (disclosed explicitly,
  same "give the exact value, disclose the manual step" pattern already
  used for WhatsApp/Meta setup elsewhere in this project).

### Security & real per-agent ownership (hardened 2026-07-19)
`chiefs_inventory`/`chiefs_clients`/`chiefs_matches`/`chiefs_pipeline` were
originally built with `FOR ALL TO anon, authenticated USING (true)` so an
agent could use the whole tab with zero sign-in (a per-browser localStorage
fingerprint, `_chiefsId()`, stood in for a real identity). Building the
public AI Concierge link above — which embeds an `agent_id` in a shareable
URL — made that pre-existing gap materially worse: any caller who already
knew or guessed an `agent_id` could read/write that agent's ENTIRE
workspace (real client PII, pocket-listing prices, deal-pipeline/commission
data) via a direct Supabase REST call using the public anon key. Closed
properly, not just documented:
- **`supabase-chiefs-security-lockdown.sql`** (requires manual execution,
  see Outstanding items) replaces the blanket anon policy with real
  per-row ownership (`auth.uid()::text = agent_id`, `authenticated` role
  only) on all 4 tables — a signed-out visitor now gets zero access to any
  of this data via direct REST, full stop. One narrow, deliberate
  exception: a public `SELECT`-only policy on `chiefs_inventory`, scoped to
  rows the agent has marked `available`/`pocket` (the same info a prospect
  would see on any public listing anyway) — so the Concierge's read of a
  target agent's live inventory still works instantly client-side, with no
  server round-trip, while `chiefs_clients`/`chiefs_matches` get zero anon
  access of any kind.
- **AI Chief of Staff now requires a real signed-in account**
  (`_renderChiefsSignInGate()`, same "Sign In Required" pattern already
  used by Social Media Manager) — an anonymous fingerprint identity can no
  longer write anything under the new RLS, so the whole tab is gated
  before it even tries, rather than silently showing empty data. Existing
  fingerprint-owned data is not orphaned: `claim_chiefs_workspace()` (same
  SQL file, `SECURITY DEFINER`) lets a real account re-point its own past
  anonymous data onto itself in one click, surfaced automatically via
  `_renderChiefsClaimBanner()`/`_chiefsClaimWorkspace()` the first time a
  local `dv_chiefs_fp` fingerprint is found with no prior claim recorded.
- **Scope boundary, deliberately not expanded**: `_chiefsH()` (the header
  helper behind every ordinary Chiefs read/write once signed in) still
  reads `localStorage.dv_access_token` directly rather than routing through
  `_chiefsValidToken()`'s refresh check — left as-is on purpose, since its
  RLS now always resolves correctly either way (a stale token there simply
  produces a real Supabase auth error, never a wrong-owner read/write), and
  converting every one of its many call sites to `await` a refreshed token
  is a separate, broader hardening task with real regression risk of its
  own, out of scope for closing this specific vulnerability.

### Inbox — unified messaging (`CHIEFS_STATE.view==="inbox"` → `renderInbox()`, `js/inbox.js`)
- Unified Email/Instagram/Facebook/WhatsApp inbox.
- **AI Chief Co-pilot** (`chiefsCopilotAnalyze()`/`renderChiefsCopilotOverlay()`)
  — "Analyze with Co-pilot" on any inbound message: extracts needs, matches
  against pocket listings, drafts a reply, auto-sends for a real WhatsApp
  phone contact (`autoSend` toggle), and a "Save to Client Memory" action.
- **Meta Ads conversion feedback loop** (`_chiefsReportConversion()`, added
  2026-07-17, audited/fixed 2026-07-19) — when a new Client Memory Bank
  record traces back to a Click-to-WhatsApp ad (`ad_referral.ctwa_clid`
  captured at webhook-receive time), reports a real `Lead` conversion event
  to Meta's Conversions API (`api/inbox.js` `handleMetaConversion()`), so ad
  targeting learns from actual outcomes, not just clicks. Gated by the
  `autoReportConversions` toggle; requires the agent's own Meta Ads Pixel
  ID + Conversions API token (Profile → Meta Ads Pixel).

### Cross-cutting
- **Toast notifications** (`_chiefsToast()`) — the tab's one shared feedback
  mechanism for anything that happens automatically in the background (auto-
  drafted/auto-sent messages, auto-saved clients, new matches, broadcast
  results). Safe-area aware (`.dv-toast-safe-bottom`, fixed 2026-07-19 —
  see the design/parity work-log entry below) so it never renders behind the
  bottom tab bar on a real device.
- **Semantic search** (`_chiefsEmbedText()`/`_chiefsSemanticRPC()`,
  `/api/chiefs-embed`) — Gemini/Jina embeddings power the hybrid
  Auto-Matching Engine and the Client Memory Bank's search.
- **`_chiefsValidToken()`** (added 2026-07-19) — every server call that needs
  a genuinely valid (non-expired) Supabase session (`whatsapp-send`,
  `meta-conversion`, the Whisper transcription proxy) goes through this
  instead of reading `localStorage.dv_access_token` raw — a real, previously
  silent bug for exactly the always-on-in-the-background actions this tab is
  built around (Supabase access tokens last ~1h; auto-send/auto-report fire
  minutes-to-hours after the agent last actively touched the page).

## Recent work log (most recent first)

- **2026-07-26 (session continuing, follow-up — multi-view support, Stage 1
  of the view-system expansion plan: up to 3 simultaneous views combined
  correctly, never a naive average)**: Direct continuation of the
  distance-dampening work above — user pointed out that real units often
  have 2-3 simultaneous views (e.g. a Boulevard Heights unit with both a
  distant Sea View AND a Sheikh Zayed Road View on the same facade) and
  asked whether the engine could support selecting multiple views and
  combining them into one correct coefficient, explicitly flagging that
  giving each view full weight would overstate the number. Also asked
  about area-specific Canal View quality tiers, and requested several new
  view types (Dubai Opera, City Walk/Coca-Cola Arena, Creek Harbour
  specifics, Skyline View for villas at night, Burj Al Arab, Atlantis) plus
  distance-weighting for the new landmark views — all deliberately scoped
  into a single numbered, prioritized multi-stage plan at the user's
  request, worked one stage at a time. This entry covers **Stage 1 only**
  (multi-view combination); Stages 2-4 (new view types, their distance
  weighting, and area-tiered Canal View) are tracked in Outstanding items
  below, not yet started.
  - **Why not a flat average, confirmed with real numbers before writing
    any formula**: averaging a 28% Burj Khalifa premium with a 4% Pool View
    premium produces 16% — LOWER than having just the Burj Khalifa view
    alone, which is directionally wrong (an additional view should never
    decrease value). Using the real Boulevard Heights scenario the user
    raised (Sea View dampened to ~18.5% by real distance + Sheikh Zayed
    Road View's flat 6%): a naive average gives 12.2% (wrong — lower than
    the sea view alone), while a dominant-view-plus-weighted-secondary
    formula gives ~20.6% (correctly higher than either view alone).
  - **`js/valuation.js`** — new `VIEW_WEIGHT_LADDER=[1.0,0.35,0.15]` and
    `_dvCombineViewPremiums(views,area,bkDistKmOverride,seaDistKmOverride,
    getRawPremium)`: dedupes identical view selections (picking the same
    view twice in different slots counts once, not twice), computes each
    selected view's own raw premium AND its own real distance-dampened
    multiplier (via the existing `getViewDistanceInfo()` from the previous
    entry — so a secondary Sea View gets its own real distance treatment,
    not just the primary one), sorts by effective premium descending, then
    applies the weight ladder — the highest-value view always gets full
    weight, a genuine second view adds a real but reduced 35% marginal
    bonus, a third adds 15%. New `_dvRentalViewPremium(view)` — a
    stand-alone version of the rental engine's premium ladder (previously
    an inline if/else chain only reachable for a single view), reused by
    the same combiner function via dependency injection (`getRawPremium`)
    so the sale-side (additive `VIEW_P` percentages) and rental-side
    (multiplicative `viewAdj`) engines share one combination/ranking/
    weighting implementation instead of two independently-drifting copies.
    `computeAdjustedPSF()`'s view-premium block, `computeValuation()`, and
    `computeRentalValuation()` all rewired to read `f.view`/`f.view2`/
    `f.view3` through this combiner — every one of the 3 functions gained a
    `viewBreakdown` field (the real per-view contribution array: view name,
    raw premium, distance info, effective premium, weight) on their return
    object, alongside the existing single-dominant-view `viewDistInfo`
    (now always the highest-effective-premium view's own distance info,
    correctly labeled "Dominant View Distance" in the UI once 2+ views are
    selected). Backward compatibility confirmed byte-identical: a single
    selected view (the overwhelmingly common case) produces the exact same
    `vP`/`viewAdj` as before this change, since a 1-item breakdown at full
    weight is mathematically identical to the old single-view formula.
  - **`js/market.js`** — new `_dvRenderViewFields(container,cl,f,
    viewOptions,onChange)`: a progressive-disclosure UI shared by both the
    villa and apartment Analyzer forms — View 1 is always shown; a
    "+ Add Another View" link (only once View 1 has a real selection)
    reveals View 2; a "+ Add a Third View" link (only once View 2 has a
    real selection) reveals View 3 — keeps the common single-view case
    exactly as uncluttered as before, while genuinely supporting up to 3.
    Both forms' existing view-option lists were kept completely separate
    and untouched (villa's 14 options vs. apartment's 22, including
    Sheikh Zayed Road View/Burj Khalifa + Fountain which only make sense
    for apartments) — the shared helper takes whichever list each form
    already had, so neither form's options changed. `_dvRefineViewDistance()`
    (the Tier-2 live-geocode refinement) now fires if ANY of the up to 3
    selected views is landmark/sea-tied (not just the primary one), and its
    patched-field list on both the rental and sale paths now includes
    `viewBreakdown` alongside the existing `viewDistInfo`, so a live-
    geocoded building-level distance correctly updates the FULL multi-view
    combination, not just the dominant view's own figure. The Confidence
    Factors panel's "View Specified" row now joins every selected view
    ("Burj Khalifa View + Sheikh Zayed Road View") instead of showing only
    the primary one. New "View Premium Breakdown" card (shown only when
    2-3 views are selected — a single view already has full information in
    the existing Confidence Factors row, so this card doesn't clutter the
    common case) lists each view's own tier (Dominant/Secondary/Tertiary),
    its applied weight, its own resolved distance where relevant, and its
    effective premium contribution, plus a combined-total line explicitly
    labeled "not a flat average" — full disclosure of how the combination
    was reached, matching this project's standing "never a silent change to
    the numbers" principle.
  - Verified: `node -c` on both touched files; a Node vm-sandbox test
    confirming a real 3-view apartment case (Burj Khalifa View + Golf View
    + Sheikh Zayed Road View) correctly ranks and weights all 3 (28%/100%,
    13%/35%, 6%/15%), confirms `vP` correctly increases monotonically as
    each additional view is added (3%→5%→8% for the 1/2/3-view case on the
    same real building), and confirms a duplicate view selected in both the
    primary and secondary slot correctly collapses to a single-item
    breakdown; a second Node test confirming the identical monotonic-
    increase behavior on the rental engine (`computeRentalValuation`,
    estRent correctly rising from a 1-view to a 2-view case, never falling);
    and 3 real-browser Playwright passes — one driving the apartment form
    end-to-end (select Burj Khalifa View → confirm "+ Add Another View"
    appears → click it → select Sheikh Zayed Road View → confirm
    "+ Add a Third View" appears → submit → confirm the real 2-item
    `viewBreakdown` reaches the computed valuation, the new "View Premium
    Breakdown" card renders, and the Confidence Factors row correctly joins
    both view names), one confirming full backward compatibility for the
    ordinary single-view case (exactly 1 view-shaped `<select>` present, no
    breakdown card, the pre-existing "View Distance Adjustment" label
    unchanged — not the new "Dominant View Distance" label, which only
    appears once 2+ views are selected), and one confirming the villa
    form's identical progressive-disclosure behavior (Full Sea View →
    "+ Add Another View" → Golf View, both views correctly persisted) —
    zero non-network console errors across all 3 passes (the sandbox's
    known no-live-API-access market-intelligence 501 is the only console
    output, unrelated to this feature).
  - Cache versions bumped: `js/valuation.js`/`js/market.js` to
    `?v=20260726c` in both `index.html` and `sw.js`'s `PRECACHE` array
    (`js/data-residential.js`/`js/api.js`/`js/core.js` stay at their
    existing `20260726b`/`20260726a` versions from the prior entry — not
    touched this pass); `sw.js`'s `CACHE_NAME` bumped `dubaival-v70`→
    `dubaival-v71`. Rebuilt `www/` and manually synced both touched files
    + `index.html` into `android/app/src/main/assets/public/` (confirmed
    byte-identical; `npx cap sync android` failed as always in this
    sandbox — no Android SDK).

- **2026-07-26 (session continuing, follow-up — view-premium distance
  dampening: "Burj Khalifa View"/"Full Sea View" claims now scale with real
  distance, two-tier area-centroid + live Google-geocoded building
  precision)**: User flagged a real accuracy gap: `VIEW_P["Burj Khalifa
  View"]` (and the rental engine's separate `viewAdj` ladder) applied the
  identical flat premium regardless of how far the building actually is
  from Burj Khalifa — a Business Bay unit (~1.7km, a real, prominent view)
  and a Dubai Marina unit (~19km, essentially not a real "Burj Khalifa
  view") got the same boost. User asked for this fixed using the site's
  existing Google Maps connection, in two tiers if needed (area-to-area,
  then building-to-building), and separately flagged the identical problem
  for distant "Full Sea View" claims (e.g. Boulevard Heights/Burj Khalifa
  itself/Address Sky View/Barsha Heights/JVC vs. a genuinely beachfront
  building in Emaar Beachfront).
  - **Real distances confirmed before building anything** — computed via
    the already-existing `AREA_COORDS`/`haversineKm()`/`KEY_POIS` data (no
    live call needed): Downtown Dubai 0.0km/Business Bay 1.7km/DIFC 1.5km
    from Burj Khalifa vs. Dubai Creek Harbour 6.6km/Dubai Marina 18.8km/JVC
    16.1km; Emaar Beachfront 0.7km/Dubai Marina 0.8km/JBR 0.2km from the
    nearest real coastline (`KEY_POIS` "beach" category) vs. Barsha Heights
    4.2km/Business Bay 4.0km/JVC 8.0km/Dubai Silicon Oasis 17.3km —
    confirming the user's exact scenario in both directions with real
    numbers before writing any formula.
  - **Tier 1 (always-on, zero network dependency)**: new
    `getViewDistanceInfo(view,area,bkDistKmOverride,seaDistKmOverride)` in
    `js/valuation.js` — classifies a view as `"landmark"` (Burj Khalifa +
    Fountain/Fountain View/Burj Khalifa View/Partial Burj View) or `"sea"`
    (Full Sea View/Partial Sea View/Beach Access View) via
    `_dvIsDistanceSensitiveView()`, or leaves every other view (Marina/Golf/
    Canal/Lagoon/Creek Harbour/Lake/Palm/Skyline/Community/etc.) completely
    untouched — those reference a feature that exists at many different
    points across Dubai, so a single-point distance calculation doesn't
    apply. Computes the real distance from the area's own `AREA_COORDS`
    centroid to Burj Khalifa (`_dvBurjKhalifaKm()`, new helper in
    `js/data-residential.js`) or the nearest real coastline point
    (`_dvNearestBeachKm()`, same file) when no more-precise override is
    given, then applies a piecewise-linear decay curve
    (`_dvViewDistCurve()`): full premium ≤2km (landmark)/≤1.5km (sea),
    tapering to ~10%/~8% floor by 20km+. Wired into `computeAdjustedPSF()`'s
    `rawVP` (sale side, before the existing grade-baseline subtraction) and
    `computeRentalValuation()`'s `viewAdj` ladder (rental side — dampens
    only the premium PORTION, i.e. `viewAdj-1.0`, never the neutral 1.0
    baseline). Verified against the real distances above: Business Bay gets
    the full 28% Burj Khalifa premium, Dubai Creek Harbour ~13% (about
    half), Dubai Marina ~3% (mostly stripped); Emaar Beachfront gets the
    full 25% sea-view premium, JVC ~8% (about a third) — exactly the
    differentiation the user asked for, while a non-distance-sensitive view
    (Marina View, Golf View, etc.) is confirmed byte-for-byte unaffected.
  - **Tier 2 (optional refinement, real Google-geocoded building
    coordinate)**: new `resolveViewDistance(building,area)` in `js/api.js`
    — only ever called when the selected view is actually landmark/sea-type
    (skips entirely otherwise, no wasted API call); reuses the SAME
    `window._dvGeoCache`/`/api/proxy-maps?action=geocode` call the
    Analyzer's own Drive Times/Nearby Amenities cards already make for this
    exact building, so whichever resolves first saves the other a duplicate
    geocode; degrades to `null` (never throws) on any failure, always
    falling back to the already-correct Tier-1 area-level result. New
    `_dvRefineViewDistance()` in `js/market.js` — mirrors the EXISTING
    "instant static result, then live-refine in place"
    pattern already used for `fetchLiveData()`/`fetchLiveRentals()`; wired
    into all 4 Analyzer submit handlers (villa/apartment × sale/rent).
  - **Real composability bug found and fixed before shipping**: a naive
    version of the Tier-2 refinement would silently REVERT whatever the
    sibling `fetchLiveData()` refinement had already improved (real Bayut/
    PropertyFinder transaction data blended into the PSF) if it resolved
    AFTER that one, since both patch the same `adjPSF`/`fairPrice`/etc.
    fields via a fresh `computeValuation()` call. Fixed by storing the
    resolved `liveData` on `analyzerState._liveData` the moment
    `fetchLiveData()` succeeds (reset to `null` on every new submission)
    and having `_dvRefineViewDistance()` always reuse it in its own
    recompute — confirmed via a dedicated composability test that BOTH
    improvements now stack correctly regardless of which async refinement
    resolves first, neither ever clobbering the other.
  - **UI disclosure**: new "View Distance Adjustment" row in the Analyzer
    result's existing "Confidence Factors" panel (sale side only — the
    rental result page has no equivalent detailed panel to hook into
    without a larger restructuring, left for a future pass) — shows
    "Area-level"/"Building-level" precision, the real distance in km, and
    the applied multiplier, so this is a disclosed adjustment, not a silent
    change to the numbers.
  - Verified: `node -c` on all 4 touched files; a Node vm-sandbox test
    confirming the real curve values match the pre-computed area distances
    above (Business Bay mult=1.000, Creek Harbour mult=0.453, Marina
    mult=0.118 for the landmark view; Emaar Beachfront mult=1.000, JVC
    mult=0.319, Silicon Oasis mult=0.112 for sea view), confirming every
    non-distance-sensitive view returns mult=1.0 unchanged, and confirming
    a full `computeValuation()`/`computeRentalValuation()` run shows the
    expected differentiated premium (Business Bay 28% vs. Creek Harbour
    13% vs. Marina 3% for the exact same Burj Khalifa View input) with zero
    regression to a Marina-View-in-Dubai-Marina control case; a second Node
    test confirming `resolveViewDistance()` correctly geocodes, caches
    (second call for the same building makes zero additional fetch calls),
    and degrades gracefully to `null` on a bad/empty geocode response; a
    third dedicated composability test proving a live-transaction signal
    and a building-level view-distance override correctly stack together
    regardless of resolution order; and a real-browser Playwright pass
    driving the actual Analyzer end-to-end (Business Bay/2BR/Burj Khalifa
    View) confirming `computeValuation()` runs cleanly, the result renders,
    and the new "View Distance Adjustment" row appears in the live DOM —
    zero non-network console errors (same sandboxed no-live-API-access
    limitation as every other test this session).
  - Cache versions bumped: `js/data-residential.js` to `?v=20260726b`,
    `js/valuation.js`/`js/api.js`/`js/market.js` to `?v=20260726a` in both
    `index.html` and `sw.js`'s `PRECACHE` array (also corrected 2 stale,
    already-out-of-sync entries found in `sw.js` — `js/api.js` was still
    pinned at `?v=20260706a` there despite `index.html` already having moved
    to `?v=20260719a` before this session's edit); `sw.js`'s `CACHE_NAME`
    bumped `dubaival-v69`→`dubaival-v70`. Rebuilt `www/` and manually synced
    every touched file into `android/app/src/main/assets/public/`, confirmed
    byte-identical (`npx cap sync android` failed as always in this
    sandbox — no Android SDK).

- **2026-07-26 (session continuing, follow-up — Discovery Gardens
  corrective research: 9 genuinely per-building-sourced buildings merged,
  in stark contrast to the previous round's rejected 92-uniform-value
  batch)**: Direct response to the corrective instruction sent at the end
  of the previous round — the research session came back with commit
  `c291954` ("Add 9 verified DG buildings with individual PSF"), reached
  after an intermediate self-correction (`d8f3853` tried patching the
  rejected 92 with differentiated values, then `53efd4f` reverted that
  entirely and started over with a much smaller, properly-sourced batch).
  - **Independently verified, not taken on faith**: diffed the research
    branch's new HEAD against this branch's own last-merged state and
    found exactly 9 new real `DB` keys — 5 Zen cluster buildings (`zen 5/
    10/20/30/34`) and 4 Mesoamerican cluster buildings (`meso 238/248/
    256/260`) — plus, separately, a stale `blvd heights t3` key that
    reappeared in the diff purely because the research branch's diverged
    history never picked up this branch's own 2026-07-13 removal of that
    confirmed-bogus entry; excluded it from this merge again (not a new
    problem, just the same historical drift resurfacing in the diff).
  - **This round's data quality genuinely holds up, unlike the rejected
    one — verified, not assumed**: the 5 Zen buildings do share one
    identical PSF (850) and the same unit count (169) — on the surface the
    same red flag as the rejected 92-building batch — but this time the
    commit message gives a real, checkable justification instead of none
    at all: "All 37 Zen buildings (1-37) are confirmed identical Nakheel
    G+9 structures with same floor plate, unit mix and era (2009). Per-
    building PSF variance below DLD resolution threshold," backed by 3
    independently cited sources (DLD 1BR average, a whole-compound
    Provident listing, PropertyDigger's median) that converge on the same
    ~850 figure, plus real per-building Bayut URLs for each of the 5 towers
    added. The 4 Mesoamerican buildings show real, non-uniform variance
    (3 at 1,100, one — `meso 256` — at 1,120, specifically because
    PropertyFinder cited a higher range for that one building) rather than
    a flat copy. The research session also explicitly SKIPPED the third
    requested cluster (Cactus) rather than guess, citing "building number
    range unresolvable (portal conflict between PropertyFinder and Bayut/
    wasl.ae)" — exactly the "skip rather than fabricate" discipline the
    corrective instruction asked for. Ran the instruction's own mandated
    self-check independently rather than trusting the commit message's
    claim of having passed it: confirmed 3 truly distinct PSF values
    (850/1,100/1,120) across the full 9-building batch.
  - **Merge**: same safe JS-object-splice technique, this time diffing
    from this branch's own last-merged state (post round-8) to the
    research branch's new HEAD (`c291954`), explicitly excluding the stale
    `blvd heights t3` key. Picked up exactly 9 new `DB` keys + 9 new
    `BLDG_UNITS` keys (no separate BLDG_UNITS-only patches this round).
    Final counts: `DB` 9,434→9,443, `BLDG_UNITS` 9,480→9,489.
  - **Full independent verification of the merged result**: `node -c`; a
    fresh vm-sandbox load confirming the new totals exactly; confirmed
    `blvd heights t3` is still absent (the historical fix holds); 0
    buildings missing `BLDG_UNITS` in Discovery Gardens; 0 orphan area
    names anywhere in the full `DB`; Discovery Gardens' own total now
    correctly at 38 (29 pre-existing + 9 new, matching the commit's own
    claimed total exactly); all 9 new entries have valid grade tiers, sane
    PSF, and consistent `lo≤p≤hi` ranges.
  - Swept the precise "9,434"→"9,443" residential count across the same 5
    live-reference locations as every prior round (`js/core.js`,
    `js/portfolio.js` ×5, `js/marketindex.js`, `tools/generate-seo-pages.js`
    comment, and the `js/data-residential.js` top-of-file comment) — grand
    total 11,785, still rounds to the same "11,700+" marketing figure.
  - Verified: `node -c` on all 4 touched JS files; re-ran `node
    tools/generate-seo-pages.js` (347 area pages, 9,443 building pages,
    9,792-URL sitemap); rebuilt `www/` and manually synced every touched
    file into `android/app/src/main/assets/public/`, confirmed
    byte-identical (`npx cap sync android` failed as always in this
    sandbox — no Android SDK).
  - Cache versions bumped: `js/data-residential.js`, `js/core.js`,
    `js/portfolio.js`, `js/marketindex.js` all to `?v=20260726a` in both
    `index.html` and `sw.js`'s `PRECACHE` array; `sw.js`'s `CACHE_NAME`
    bumped `dubaival-v68`→`dubaival-v69`.

- **2026-07-25 (session continuing, follow-up — round-8 research merge:
  a real, serious data-quality problem found and correctly excluded rather
  than merged, only the genuinely-researched buildings kept)**: Continuing
  the same-day pattern of picking under-covered areas via the txVol-vs-
  building-count method, this round targeted 5 more areas: Jumeirah Village
  Circle (JVC), Town Square, Discovery Gardens, Emaar Beachfront, and
  Arabian Ranches 3, plus a bonus request to backfill the 2 pre-existing
  Arabian Ranches 3 buildings still missing `BLDG_UNITS` from an earlier
  round. The research branch's commit (`fa62d73`, "Add 113 buildings across
  5 areas + Majan") reported 113 new buildings + 115 new/patched
  `BLDG_UNITS` entries.
  - **Independent verification caught a real problem before merging, not
    after**: diffing the research branch's claimed new keys against this
    branch's own last-merged baseline (`5d86e25`) confirmed the raw counts
    (113 DB / 115 BLDG_UNITS) were accurate — but inspecting the actual
    VALUES, not just the counts, found that **92 of the 113 new buildings —
    every single one tagged Discovery Gardens — shared byte-for-byte
    identical PSF (780) and grade (C)**, with only 4 distinct unit-count
    values spread across all 92 supposedly-independent buildings. This
    directly violates this project's own no-fabrication standard (Directive
    #2): 92 genuinely different, real buildings in Discovery Gardens do not
    plausibly all carry the exact same PSF to the dollar — this pattern is
    a strong signal of one area-average value copy-pasted across many
    building-name keys, not real per-building research, unlike the
    project's established legitimate pattern of true sister towers sharing
    a PSF (e.g. two genuinely identical twin blocks in the same
    development). The other 21 new buildings (JVC: Maison Elysee 1/2/3,
    Tresora, 311 Boulevard; Town Square: Una Apartments A, Savannah Town
    Square, Rawda Apartments 3/4; Emaar Beachfront: Marina Vista 1/2,
    Palace Beach Residence 1/2, Seapoint; Arabian Ranches 3: June/June 2/
    Anya/Anya 2/May/Raya; plus a bonus Majan entry, Samana Barari Twin
    Towers) showed real, plausible per-building variance — sister towers
    sharing a PSF where that's genuinely expected (Marina Vista 1/2, Palace
    Beach Residence 1/2), but clearly different figures across differently-
    named buildings elsewhere (Maison Elysee 1/2 at 1490 vs. Maison Elysee
    3 at 1400; Tresora at 1450; 311 Boulevard at 1300) — passed every
    structural check (valid grades, sane PSF, correct `lo≤p≤hi`) and were
    judged genuine.
  - **Merge, done with a modified version of the same safe JS-object-splice
    technique used all session**: filtered the diff to explicitly EXCLUDE
    every key tagged `Discovery Gardens`, keeping only the 21 legitimate
    buildings + their 21 matching `BLDG_UNITS` entries + 2 more
    `BLDG_UNITS`-only entries (`arabian ranches lll - afia`/`- caya
    exclusive`) confirmed to be real, already-existing `DB` buildings that
    were genuinely missing `BLDG_UNITS` — the exact 2-entry patch the
    commit described, verified present in this branch's DB before merging
    and absent from `BLDG_UNITS` before the patch. Final counts: `DB`
    9,413→9,434 (+21, not +113), `BLDG_UNITS` 9,457→9,480 (+23, not +115).
  - **Full independent verification of the merged result**: `node -c`; a
    fresh vm-sandbox load confirming the new totals exactly; 0 buildings
    still missing `BLDG_UNITS` across all 5 target areas; 0 orphan area
    names anywhere in the full `DB`; all 21 kept buildings have valid grade
    tiers, sane PSF (≤15,000, >0), and consistent `lo≤p≤hi` ranges; and
    Discovery Gardens' own building count confirmed unchanged from before
    this round (still 29 — none of the 92 suspect entries were added).
  - Swept the precise "9,413"→"9,434" residential count across the same 5
    live-reference locations as every prior round (`js/core.js`,
    `js/portfolio.js` ×5, `js/marketindex.js`, `tools/generate-seo-pages.js`
    comment, and the `js/data-residential.js` top-of-file comment) — the
    rounded "11,700+" marketing figure elsewhere is unaffected (new grand
    total 11,776, still rounds the same).
  - Verified: `node -c` on all 4 touched JS files; re-ran `node
    tools/generate-seo-pages.js` (347 area pages, 9,434 building pages,
    9,783-URL sitemap); rebuilt `www/` and manually synced every touched
    file into `android/app/src/main/assets/public/`, confirmed
    byte-identical (`npx cap sync android` failed as always in this
    sandbox — no Android SDK).
  - Cache versions bumped: `js/data-residential.js`, `js/core.js`,
    `js/portfolio.js`, `js/marketindex.js` all to `?v=20260725d` in both
    `index.html` and `sw.js`'s `PRECACHE` array; `sw.js`'s `CACHE_NAME`
    bumped `dubaival-v67`→`dubaival-v68`.
  - **Follow-up — corrective instruction sent same day**: wrote and
    delivered a Discovery Gardens-specific research instruction requiring
    genuine per-BUILDING research (not a per-cluster average copied across
    many tower names) — grounded in the real existing per-building data
    already in `DB` (Mediterranean `med *`: 14 real buildings, real avg PSF
    774, real range 650–1183; Mogul `mog *`: 6 real buildings, avg 699;
    Contemporary `con *`: 3 real buildings, avg 807), so the next research
    round has a concrete, already-verified baseline to match rather than
    guessing. The user separately supplied a 6-cluster PSF table (with
    plausible per-cluster reasoning — pool/gym amenities, unit size, metro
    proximity, transaction volume) for 3 known clusters plus 3 entirely new
    ones (Zen, Cactus, Mesoamerican, none yet in `DB`) — cross-checked
    against the real existing per-building averages above and found
    genuinely consistent (Mediterranean 760 vs. real 774; Mogul 700 vs.
    real 699 — near-exact matches), a strong signal this new table is
    itself real research, not another fabrication. Folded these figures in
    as the new instruction's starting-point estimates for Zen/Cactus/
    Mesoamerican specifically, but explicitly labeled them "verify per
    building, don't copy flat" — same warning applied to the 3 known
    clusters' real averages, since even within Mediterranean the real
    per-building spread is wide (650–1183), so no single cluster-wide
    number should ever be stamped onto multiple new tower entries. The
    instruction also mandates the same cluster-prefix + real tower-number
    naming convention already used (`med NNN`/`mog NNN`/`con NNN` →
    `zen NNN`/`cactus NNN`/`meso NNN`) and a mandatory pre-commit self-check
    script counting distinct PSF values in the new batch, rejecting a
    commit if 5+ new buildings in one cluster show fewer than 3 distinct
    PSF values.

- **2026-07-25 (session continuing, follow-up — user-requested coverage
  audit of 5 named areas surfaced 2 real gaps, closed via a 3-part
  research+backfill instruction, independently re-verified before
  merging)**: User asked directly whether Jumeirah Bay Island, Dubai
  Maritime City, Dubai Creek Harbour, Meydan, and City Walk have good data
  coverage. Checked each against real `DB`/`AREAS`/`BLDG_UNITS` state:
  Maritime City (21 buildings, txVol 200), Creek Harbour (198, txVol
  3500), Meydan (249, txVol 1200), and City Walk (66, txVol 600) were all
  reasonably covered relative to their transaction volume — left alone.
  **Jumeirah Bay Island was genuinely thin**: only 2 buildings (Bulgari
  Villas, Bulgari Mansions), both missing `BLDG_UNITS`. A related, separate
  `AREAS` key, plain "Jumeirah Bay" (no "Island"), had zero buildings at
  all — a real ambiguity (duplicate naming vs. a genuinely different area)
  worth resolving, not guessing at. Separately, the user asked to also
  check Dubai Hills Estate — its building COUNT was fine (310, a healthy
  ratio for its 4800 txVol), but **14 of those 310 were missing
  `BLDG_UNITS`**, a real, concrete gap. Combined all of this with 2 fresh
  areas found via the same txVol-vs-building-count method (after excluding
  every area already assigned across all prior rounds): **IMPZ** (Dubai
  Production City, only 35 buildings for txVol 5000) and **DAMAC Hills 2**
  (56 buildings, txVol 2400) — into one 3-part combined research
  instruction (Part A: DHE backfill via a self-computing script, Part B:
  more Jumeirah Bay Island buildings + resolve the Jumeirah Bay ambiguity
  via real research not a guess, Part C: new IMPZ/DAMAC Hills 2 coverage),
  each gated behind a mandatory "0 missing" verification script before
  the next part could start.
  - **Research session's findings, independently re-verified rather than
    trusted at face value** (same discipline as every prior round): Part A
    — all 14 Dubai Hills Estate buildings backfilled with real researched
    unit counts (Sidra Villas I/II/III, Greenside Residence, Mulberry Park
    Heights, The Highbury, Socio Hub 7-10, etc.), confirmed 0 missing
    across the full 310. Part B — added 2 new real buildings (Bulgari
    Residences, 173 units, Ultra; Bulgari Marina Lofts, 188 units, A+) plus
    backfilled the original 2 (Bulgari Villas 20 units, Bulgari Mansions 15
    units); **confirmed the "Jumeirah Bay" vs "Jumeirah Bay Island"
    ambiguity resolves to the SAME physical location** (all Bulgari/Meraas
    properties on the seahorse-shaped island off Jumeirah 2) — no separate
    area exists, no buildings were added under the plain "Jumeirah Bay"
    key, a real, useful finding closing a genuine data-model question
    rather than silently padding a duplicate area. Part C — 3 new IMPZ
    buildings (Mesk 3/4, Sema by Deyaar) and 3 new DAMAC Hills 2 buildings
    (Hawthorn, Just Cavalli, Paloverde — all correctly keyed with the
    "damac hills (2) - " prefix already used by every other building in
    that area, confirmed by cross-checking the area's existing 60+ keys,
    not assumed from the commit message's shorthand names).
  - **Full independent verification before merging**: `node -c` on the
    fetched research-branch file; a fresh vm-sandbox load confirming
    `DB=9,414`/`BLDG_UNITS=9,458` (both match the commit's own claimed
    totals); confirmed 0 buildings still missing `BLDG_UNITS` across all 5
    target areas (411 buildings checked); confirmed 0 orphan area names
    anywhere in the entire `DB`; confirmed all 8 new buildings (2
    Jumeirah Bay Island + 6 Part C) have valid grade tiers, sane PSF values,
    and consistent `lo≤p≤hi` ranges — including double-checking a
    suspiciously small 2-unit "Paloverde" entry, which turned out to be a
    real key-prefix mismatch in this session's own first lookup attempt
    (the true key is `"damac hills (2) - paloverde"`, not bare
    `"paloverde"`) rather than a data problem once looked up correctly.
  - **Merge**: same safe JS-object-splice technique, diffing from the
    LAST merge point (`ea88af8`) to the new HEAD (`5d86e25`) — picked up 8
    new `DB` keys and 24 new/backfilled `BLDG_UNITS` keys (14 DHE + 4
    Jumeirah Bay Island + 6 Part C — math checks out exactly). Final
    counts on this branch: `DB=9,413`, `BLDG_UNITS=9,457` (both 1 lower
    than the research branch's own totals, the same standing, already-
    documented 1-off from this branch's earlier Blvd Heights T3 removal).
    Grand total across residential+commercial+land: **11,755 properties**
    — still rounds to the same "11,700+" marketing figure used since the
    last round, so only the precise "9,413" residential count needed
    sweeping across live references (`js/core.js`, `js/marketindex.js`,
    `js/portfolio.js` — 5 locations, `tools/generate-seo-pages.js` comment,
    and the `js/data-residential.js` top-of-file comment); the rounded
    total in `index.html`/`manifest.json`/`js/about.js`/`js/market.js`/
    `api/price-alerts.js` needed no change this round.
  - Verified: `node -c` on all 4 touched JS files + `sw.js`; re-ran `node
    tools/generate-seo-pages.js` (347 area pages, 9,413 building pages,
    9,762-URL sitemap); rebuilt `www/` and manually synced every touched
    file into `android/app/src/main/assets/public/`, confirmed
    byte-identical (`npx cap sync android` failed as always in this
    sandbox — no Android SDK).
  - Cache versions bumped: `js/data-residential.js`, `js/core.js`,
    `js/portfolio.js`, `js/marketindex.js` all to `?v=20260725c` in both
    `index.html` and `sw.js`'s `PRECACHE` array; `sw.js`'s `CACHE_NAME`
    bumped `dubaival-v66`→`dubaival-v67`.

- **2026-07-25 (session continuing, follow-up — "Top Opportunities"
  removed from Home; underlying feature's future left open)**: Direct
  follow-up to the Analyzer redesign below — user pointed out this section
  is still just wired to our own static/model-estimated data (not
  meaningfully live day to day) and every card's only action is routing to
  Market Index, which has no real function of its own on a page now
  centered on the Analyzer CTA. Discussed directly (not implemented until
  confirmed, per the exploratory-question norm): agreed the deeper issue
  isn't "is the data live enough" — even fully live, this widget is a
  shallower duplicate of ranking tables Market Index already does better
  and with more depth, and the site's actual core strength (per Directive
  #2) is precise per-unit analysis, not area-trend browsing. User's final
  call: remove it from Home now; leave the question of whether the feature
  should exist AT ALL for later, once the real live-momentum data pipeline
  is actually populated.
  - **Fix, `js/app.js`**: removed the "③ TOP OPPORTUNITIES" block
    (`momWrap`/`renderMarketMoments(cl)` call) from `renderHome()` entirely.
    `generateMarketMoments()`/`renderMarketMoments()` themselves were left
    fully intact and still defined — just unreferenced from Home — since
    whether they have standing value is the explicitly-deferred question
    above, not something to resolve by deleting the code. Renumbered the
    remaining Home sections to keep the file's own comments accurate:
    Personal Advisor CTA ④→③ (and its `dv-fu-4`→`dv-fu-3` fade-in class),
    Market Cycle ⑤→④ (`dv-fu-5`→`dv-fu-4`), Portfolio ⑥→⑤, Recent Activity
    ⑦→⑥ (neither of the last two use a numbered fade class).
  - Verified: `node -c js/app.js`; a real-browser Playwright pass (tour
    overlay force-skipped) confirming "Top Opportunities" no longer appears
    anywhere in the rendered Home page, with a clean, gap-free transition
    straight from the AI Property Search section into the Personal Advisor
    CTA, and that every other Home section (Market Cycle, Portfolio, stats
    bar) still renders correctly with its real data (e.g. "9,405 Buildings"
    picked up live from the just-merged database) — zero non-network
    console errors.
  - Cache version bumped: `js/app.js` to `?v=20260725b` in both
    `index.html` and `sw.js`'s `PRECACHE` array; `sw.js`'s `CACHE_NAME`
    bumped `dubaival-v65`→`dubaival-v66`. Rebuilt `www/` and manually
    synced `js/app.js` + `index.html` into
    `android/app/src/main/assets/public/` (confirmed byte-identical).

- **2026-07-25 (session continuing, follow-up — Analyzer redesign: removed
  the AVM-methodology badge and a confusing area-browsing shortcut, plus
  gave the Home page's Analyze CTA sole visual weight)**: User shared a
  screenshot of the Analyzer form (stage 0) and flagged 3 things.
  1. **"● AVM" badge removed** — a small pulsing-dot pill in the top-right
     of the Analyzer header read "AVM" (Automated Valuation Model) in sale
     mode / "RENT" in rent mode. User's explicit reasoning: don't reveal the
     underlying methodology to visitors. Removed the badge entirely
     (`_azBadge`/`_azDot` and their container) for both modes — the header
     now shows only the plain title ("DubAI Valuator"/"Rent Analyzer");
     kept the "Property Valuation Engine"/"Rental Analysis Engine" eyebrow
     label above it, which is generic branding, not a methodology reveal.
  2. **"Or browse by area" quick-select chips removed** — a real, confirmed
     UX bug, not just a preference: clicking one of these 10 area chips
     (Downtown Dubai, Dubai Marina, etc.) set
     `analyzerState.f.building=area` — literally treating the AREA NAME as
     if it were a specific BUILDING name, feeding a per-unit valuation
     engine an area-wide aggregate instead of a real building. Since this
     tool analyzes one specific unit (not a whole area — that's what
     Market Index/Map already do), the chips added a confusing second path
     that didn't actually serve the tool's purpose. Removed the whole
     chip block outright rather than fixing the underlying behavior, since
     the real building/cluster/community search box directly above it
     already covers legitimate building-name entry. The Quick Check
     accordion immediately below (a genuinely different, budget-based
     building-recommender tool) was left completely untouched — same
     `if(!f.building||!f.propCategory)` wrapper, just the chip section
     spliced out.
  3. **Home page Analyze CTA given sole visual weight** — user asked for
     my opinion on making the "Analyze" card bigger on Home, framing it as
     the site's main product/branding focus (matches this file's own
     Directive #2, "the Analyzer page is the heart of DubaiVal"). Previously
     it was one of two equal-size buttons side by side ("Analyze Property" +
     "Market Index"). Redesigned: "Analyze a Property" is now a full-width,
     larger (18px vertical padding, 16px font vs the old 13px/13px),
     more prominent primary button with no competing element beside it;
     "Market Index" demoted to a small, quiet text link centered directly
     underneath (no border/background, hover-tints purple) — still one
     click away, just no longer competing for the visitor's attention.
  - Verified via a real-browser Playwright pass (local static server, tour
    overlay force-skipped via `localStorage.dv_tour_done`): Home renders the
    new full-width "Analyze a Property" button + the small "Or browse Market
    Index" link beneath it, and both correctly navigate (`Market/Analyzer`
    and `Market/Index` respectively) on click; Analyzer's header no longer
    shows the "AVM" pill (confirmed via screenshot — only the plain title
    remains) and the "Or browse by area" chip row is completely gone (the
    "Quick Price Check" accordion now sits directly under the search box);
    the building/cluster/community search box itself renders and is fully
    intact. Zero non-network console errors. `node -c` on both touched
    files (`js/app.js`, `js/market.js`).
  - Cache versions bumped: `js/app.js`/`js/market.js` to `?v=20260725a` in
    both `index.html` and `sw.js`'s `PRECACHE` array; `sw.js`'s
    `CACHE_NAME` bumped `dubaival-v64`→`dubaival-v65`. Rebuilt `www/` and
    manually synced both files + `index.html` into
    `android/app/src/main/assets/public/` (confirmed byte-identical;
    `npx cap sync android` failed as always in this sandbox — no Android
    SDK).

- **2026-07-25 (session continuing, follow-up — a real cross-object data
  corruption bug found and independently verified in the research branch's
  own work, then 96 more buildings + a 178-entry BLDG_UNITS backfill merged
  cleanly)**: Direct continuation of the round-5 merge below. User asked for
  5 more under-covered high-transaction-volume areas; picked (via a live
  txVol-vs-building-count query against the real database, same rigor as
  before): Jumeirah Lake Towers (txVol 4500, only 157 buildings — dozens of
  real towers across ~26 named clusters), Dubai Silicon Oasis (3200/52),
  Arjan (2800/84), Jumeirah Village Triangle (2600/63), Al Furjan (2200/47).
  Since the persistent BLDG_UNITS gap from the last 2 rounds was STILL
  unresolved (flagged twice already), wrote a combined 2-part instruction:
  Part A a mandatory backfill (a script the research session runs itself to
  compute the exact list of buildings still missing BLDG_UNITS across the 6
  previously-researched areas, then research a real unit count for each),
  Part B the 5 new areas — both gated behind a verification script that
  must print "0 missing" before the research session is allowed to commit.
  - **The research session's own investigation surfaced a genuine, separate
    root-cause bug, independently confirmed here rather than trusted at
    face value**: its Part A commit (`e6d5bb2`) reported that ALL 83 of the
    round-4/5 BLDG_UNITS entries had never actually been missing due to
    being "skipped" (this file's own prior two work-log entries' working
    theory) — they had been silently written into the WRONG JS object
    entirely. The insertion script used across rounds 4-5 located its
    insertion point via `lastIndexOf('};')` in the region between `const
    BLDG_UNITS` and `const AREAS`, which actually targeted the closing
    brace of a DIFFERENT, pre-existing object, `AREA_GRADE_PSF` (an
    area+grade→PSF fallback lookup, keyed like `"Downtown Dubai|Ultra"` —
    confirmed to already exist, unrelated to this research effort, on both
    branches beforehand) — so all 83 entries were embedded inside that
    object instead, fully invisible to any `BLDG_UNITS` lookup. The fix
    relocated all 83 (identified via brace-counting) into the real
    `BLDG_UNITS` object.
  - **Verified this claim directly rather than accepting it, and found the
    fix's own cleanup script had a small side effect worth flagging** (not
    a regression, a genuine bonus correction): diffing `AREA_GRADE_PSF`
    between this branch (532 entries, untouched) and the research branch's
    post-fix state (530) surfaced exactly 2 removed keys —
    `"hartland greens villas":60` and `"gardenia villas sobha hartland":75`
    — which are themselves building-name-keyed (not `"Area|Grade"`-shaped)
    entries that had ALSO been misplaced inside `AREA_GRADE_PSF`, but from
    an EARLIER, unrelated commit (`2494a80`, "add 30 missing villa
    sub-communities", 2026-07-18) — predating rounds 4/5 by weeks. Cross-
    checked: both buildings have real, identical `DB` entries on both
    branches (Sobha Hartland, grade A); on this branch they still have NO
    `BLDG_UNITS` entry at all (same pre-existing gap); on the research
    branch, both now correctly resolve real unit counts (60, 75) via
    `BLDG_UNITS`. The fix's brace-counting cleanup incidentally also
    corrected this second, older, previously-undetected instance of the
    exact same misplacement bug — a genuine improvement, not data loss.
  - **Full independent verification before merging, not just trusting the
    commit messages**: `node -c` on the fetched research-branch file; a
    fresh vm-sandbox load confirming `DB=9,406`/`BLDG_UNITS=9,434` (both
    match the commit's own claimed totals exactly); confirmed all 5 Part B
    areas use the exact canonical `AREAS` key spelling with zero orphan
    area names anywhere in the whole `DB` (0 mismatched area strings across
    9,406 entries); confirmed 0 buildings still missing `BLDG_UNITS` across
    all 11 target areas (903 buildings checked); confirmed all 499 Part-B
    buildings (spanning the 5 new areas) have valid grade tiers, sane PSF
    values (all ≤15,000, none ≤0), and internally consistent `lo≤p≤hi`
    ranges; confirmed the 130 BLDG_UNITS entries with no matching DB key
    are pre-existing historical drift (this branch already independently
    has 131 of the same class), not something newly introduced.
  - **Merge**: same safe JS-object-splice technique as round 5, this time
    diffing from the LAST merge point (`5f9a0b6`) to the new HEAD
    (`ea88af8`) for both `DB` and `BLDG_UNITS` — picked up 96 new `DB` keys
    (Part B) and 178 new/relocated `BLDG_UNITS` keys (95 genuinely new from
    Part B + 83 relocated by the Part A fix — the math checks out exactly).
    Final counts on this branch: `DB=9,405`, `BLDG_UNITS=9,433` (both
    exactly 1 lower than the research branch's own totals, consistent with
    this branch's still-standing, already-documented 1-building gap from
    the earlier Blvd Heights T3 removal the research branch never picked
    up). Grand total across residential+commercial+land: **11,747
    properties**, shown in marketing copy as "11,700+".
  - **Re-swept every live stat reference updated in the round-5 entry
    below** (9,405/11,700+, replacing that round's 9,309/11,600+):
    `js/core.js`, `js/portfolio.js` (7 locations), `js/about.js`,
    `js/market.js`, `js/marketindex.js` (2 locations), `index.html` (3 meta
    tags), `manifest.json`, `api/price-alerts.js`,
    `tools/generate-seo-pages.js` (comment), and the stale top-of-file
    comment in `js/data-residential.js` itself. Same historical/dated
    comments as before (`js/valuation.js` lines 537/986, `js/chat.js` line
    13, `tools/calibration-output.json`) deliberately left untouched.
  - Verified: `node -c` on all 6 touched JS files + `sw.js`; `manifest.json`
    re-validated as parseable JSON; re-ran `node
    tools/generate-seo-pages.js` (347 area pages, 9,405 building pages, 1
    hub page, 9,754-URL sitemap); rebuilt `www/` and manually synced every
    touched file into `android/app/src/main/assets/public/`, confirmed
    byte-identical (`npx cap sync android` failed as always in this
    sandbox — no Android SDK).
  - Cache versions bumped: all 6 touched files to `?v=20260724c` in both
    `index.html` and `sw.js`'s `PRECACHE` array; `sw.js`'s `CACHE_NAME`
    bumped `dubaival-v63`→`dubaival-v64`.

- **2026-07-24 (session continuing, follow-up — merged 83 newly-researched
  buildings from the research branch, plus an app-wide sweep of stale
  building/property-count references)**: Direct continuation of this
  session's momentum-engine work — the user asked the research branch
  (`claude/dubaival-portfolio-manager-5bgbjk`) to add coverage for DIFC,
  Sobha Hartland, Jumeirah Beach Residence (Jbr), and DAMAC Islands (later
  broadened to also include DAMAC Lagoons and Emirates Living), across 2
  rounds of research instructions written this session. After both rounds
  landed, the user asked (1) whether the totals were correct given the
  research session's own self-reported counts, and (2) to bring every
  building/property-count number written across the live site in line with
  the real, current total.
  1. **Self-reported counts independently verified against real git history
     both times, not trusted at face value** — round 1: the research
     session claimed "25 buildings added"; a direct
     `Object.keys(DB).length` diff (before=9227, after=9250) showed the real
     number was 23, reported to the user plainly as a discrepancy. Round 2:
     the user said "83 more... with the previous 23" — a diff between the
     pre-round-4 baseline commit (`9dda9ef`, 9227) and the latest research
     commit (`5f9a0b6`, 9310) confirmed exactly 60 net-new keys landed in
     round 2, which combined with round 1's 23 correctly totals 83
     cumulative — confirming the user's phrasing was a correct cumulative
     total, not a fresh overstatement.
  2. **Safe cross-branch merge, not a `git cherry-pick`** — this branch has
     diverged from the research branch's own history (an earlier Blvd
     Heights T3 removal + Centrium area fix that the research branch never
     picked up), and `var DB={...}`/`const BLDG_UNITS={...}` are each a
     single giant line in `js/data-residential.js`, so a line-level git
     merge would conflict. Instead, wrote a one-off Node script
     (`vm.createContext`, loading both branches' files via `git show
     <ref>:path`) that diffs the research branch's latest state against its
     own pre-round-4 baseline to isolate exactly the NEW keys (83 in `DB`,
     0 in `BLDG_UNITS`), then merges only those new keys into THIS branch's
     in-memory `DB`/`BLDG_UNITS` objects (checked for zero key collisions —
     none found), then splices the two specific lines back into the real
     file via line-index replacement, leaving every other line (including
     this branch's own Blvd Heights T3/Centrium fixes) completely
     untouched. Verified: `node -c js/data-residential.js` clean; final
     counts confirmed via a fresh vm-load: `DB=9309` (was 9226 on this
     branch — one lower than the research branch's own 9310, exactly
     accounting for this branch's prior Blvd Heights T3 removal),
     `BLDG_UNITS=9255` (unchanged — see the persistent gap noted below),
     `AREAS=347` (unchanged). Combined with the untouched commercial (1,914)
     and land (428) databases, the real platform total is now **11,651
     properties** (9,309 + 1,914 + 428), shown in marketing copy as
     "11,600+".
  3. **Persistent, twice-unaddressed data-completeness gap, flagged again**:
     despite BOTH research instructions this session explicitly asking the
     research session to also add a real `BLDG_UNITS` entry for every new
     building (round 2's instruction added an explicit "do not skip this
     step this time" after round 1 skipped it too), the research branch
     added **zero** `BLDG_UNITS` entries across both rounds — confirmed via
     the merge script's own diff (`New BLDG_UNITS keys found... 0`). All 83
     newly-added buildings fall back to `estimateBldgUnits()`'s grade-based
     generic estimate rather than a real unit count. Not fixed this
     session — flagged to the user as still open, with an offer to write a
     3rd, more emphatic instruction if they want it closed.
  4. **App-wide stat-reference sweep** — grepped for every hardcoded
     building/property-count reference (`9,226`/`9,227`/`9226`/`9227`/
     `9,250`/`11,500+`) and classified each as either a live, user-facing
     claim (updated) or a historical, dated work-log-style comment
     describing a specific past fact (left unchanged, matching this
     project's own established convention — see the "Bug fix log"/dated
     work-log entries throughout this file for precedent). Updated to
     9,309/11,600+ (occasionally rounding to a clean marketing figure):
     `js/marketindex.js` (stat card + AI comparison prompt), `js/core.js`
     (AI system-prompt database-summary line + 2 onboarding-tour text
     strings), `js/portfolio.js` (7 locations — 2 Compare/AI-comparison
     prompts, Personal Advisor's AI prompt, Personal Advisor's on-screen
     benefit list, the PDF export footer disclaimer, the Portfolio AI
     Analysis prompt, and the on-screen Portfolio disclaimer),
     `js/about.js` (stat card + API-docs feature description), `js/market.js`
     (a LinkedIn share caption), `index.html` (3 meta tags — description/
     og:description/twitter:description), `manifest.json` (description),
     `api/price-alerts.js` (the price-alert confirmation email body), and
     `tools/generate-seo-pages.js` (a code comment, regenerated by the tool
     itself anyway). **Deliberately left unchanged** (historical, dated
     comments describing a specific past session's finding, not a live
     claim): `js/valuation.js` lines 537 ("VALUATION_DB found this affects
     3,500 of 9,227 entries") and 986 ("against the real 9,226-building
     database before this one was chosen"), `js/chat.js` line 13 ("rigorous
     8-step calculation against the real 9,227-building database"), and
     `tools/calibration-output.json`'s static `existingDBSize:9227` field (a
     historical calibration-tool output artifact, not live site text). Also
     confirmed via direct inspection that a couple of other "9226"/"9227"-
     looking grep hits (`js/market.js`'s PSF-trend chart data array,
     `js/data-commercial.js`'s land-area PSF/avgP/avgSz data) were pure
     numeric coincidences within unrelated data arrays, not real
     building-count text — left untouched.
  5. Verified: `node -c` on all 6 touched JS files (`js/data-residential.js`,
     `js/core.js`, `js/portfolio.js`, `js/about.js`, `js/market.js`,
     `js/marketindex.js`); `node -c sw.js`; `manifest.json` re-validated as
     parseable JSON; a fresh vm-sandbox load confirming the final counts
     above; re-ran `node tools/generate-seo-pages.js` per this file's
     standing rule (347 area pages, 9,309 building pages, 1 hub page,
     9,658-URL sitemap); rebuilt `www/` via `node scripts/build-www.js`
     (`npx cap sync android` failed as always in this sandbox — no Android
     SDK, same pre-existing limitation) and manually diffed every touched
     file between `www/` and `android/app/src/main/assets/public/` to
     confirm byte-identical sync.
  - Cache versions bumped: `js/data-residential.js`, `js/core.js`,
    `js/market.js`, `js/portfolio.js`, `js/about.js`, `js/marketindex.js` all
    to `?v=20260724b` in both `index.html` and `sw.js`'s `PRECACHE` array;
    `sw.js`'s `CACHE_NAME` bumped `dubaival-v62`→`dubaival-v63`.

- **2026-07-24 (session continuing, follow-up — real user-confirmed case
  proves the AI-estimated momentum guess wrong; disabled it from pricing as
  the agreed interim safety measure)**: Direct continuation of the momentum-
  engine work below. User shared 2 screenshots: an Analyzer result for
  Address Fountain Views Tower 3, 2BR, floor 39, asking AED 7,000,000 —
  verdict "GOOD PRICE," Market PSF AED 5,115, -13.4% vs market — and a real
  dxbinteract.com transaction record showing the tower's actual last 4 real
  2BR sales in 2026: floor 33 (AED 7,000,000, 4,370 psf, 24 Feb), floor 34
  (AED 6,995,000, 4,427 psf, 9 Jan), floor 42 (AED 6,900,000, 4,367 psf, 13
  Jan), and floor 59 — the highest floor and most recent — at AED 7,250,000,
  4,526 psf, 1 Jul 2026. User asked directly whether the Analyzer's output
  was correct given this real data, and if not, why.
  - **Reproduced exactly, not guessed**: built a Node vm-sandbox loading the
    real `js/valuation.js`/`data-residential.js` and ran `computeValuation()`
    with the same inputs (2BR, floor 39, Furnished, best view, size backed
    out from the shown Asking PSF). Result: a "before-momentum" base Market
    PSF of **4,872** — itself already 7.6-11.6% above the real comps
    (4,367-4,526) — multiplied by the AI-estimated momentum factor active
    for Downtown Dubai at the time (+5%, i.e. `getMomentumFactor()` had
    fallen back to `runMarketIntelligence()`'s LLM guess since no real
    per-area momentum data exists yet): 4,872 × 1.05 = **5,115.6** — matching
    the screenshot's figure almost exactly, confirming precisely how that
    number was produced.
  - **Directly confirms and closes an open question from the 2026-07-22 work
    log below**, which had flagged (but couldn't independently verify) that
    `runMarketIntelligence()`'s AI-estimated "AI Trend" for Downtown Dubai
    showed +5.0% (appreciating) — "directly opposite the user's own
    real-world observation of an ongoing decline." The user's real
    transaction data now proves this conclusively: 4 real 2026 sales
    spanning a 26-floor range (33 to 59) cluster within a ~3.6% PSF band
    (4,367-4,526) — essentially flat, not the kind of momentum that would
    justify an independent +5% city-wide adjustment layered on top of
    floor/view premiums that already account for the real floor spread.
  - **Fix, user-approved via direct discussion (not unilateral) — surgical,
    reversible, exactly scoped**: added `MOMENTUM_AI_FALLBACK_ENABLED=false`
    (`js/core.js`) gating the ONLY place `MARKET_MOMENTUM` (the AI/RAG-
    grounded but still ultimately LLM-judgment-based estimate) is allowed to
    become an actual PRICING adjustment — `getMomentumFactor()`'s fallback
    branch, reached only when the real, zero-AI per-area momentum engine
    (`getRealMomentumFactor()`, still first-priority and completely
    unchanged) has no data yet for that area (true for every area today,
    since `supabase-real-momentum-schema.sql` needs to be run and then
    weeks of `price_history` accumulated). With the flag off, an uncovered
    area now correctly returns neutral (1.0, no adjustment) instead of
    trusting an unverified directional guess — the exact same "no real data
    = no adjustment, never a fabricated number" principle
    `getRealMomentumFactor()` itself already uses, just extended to the
    interim bridge period. The original fallback logic is left fully intact
    under the flag (not deleted) so it can be restored later if a more
    validated grounding approach is built. **Deliberately does NOT touch**
    `MARKET_MOMENTUM`/`runMarketIntelligence()` themselves (still populate
    and refresh normally) or their 2 purely-informational, non-pricing
    display consumers — the Market Dashboard's "Market Movers" panel
    (`js/market.js`) and the Admin Dashboard's "AI Market Intelligence"
    card (`js/deals.js`) — both read `MARKET_MOMENTUM` directly, not through
    `getMomentumFactor()`, and keep showing the AI's trend read exactly as
    before; only the ANALYZER'S actual computed valuation number stops
    trusting it.
  - Verified: `node -c js/core.js`; a dedicated Node vm-sandbox test (9
    checks, correct file load order matching the real app's script
    sequence) — confirmed `MOMENTUM_AI_FALLBACK_ENABLED` defaults to
    `false`; confirmed a freshly-seeded, high-confidence AI-estimated +5%
    entry for Downtown Dubai no longer moves `getMomentumFactor()`'s output
    (returns neutral 1.0); re-ran the exact real Fountain Views Tower 3
    case end-to-end and confirmed the Market PSF now lands at ~4,872 (not
    the inflated 5,115), with `momFactor===1.0` and no false "AI Trend"
    label appended to `dataSource`; confirmed real per-area momentum
    (`getRealMomentumFactor()`) is completely unaffected and still
    overrides the disabled AI fallback the instant real data exists for an
    area; confirmed a totally untracked area still safely returns neutral
    with zero crash; and a 3-case regression sweep (apartment, villa, a
    2nd apartment with a real building match) confirmed `computeValuation()`
    still computes cleanly everywhere else with the fallback disabled.
  - **What this means concretely, right now**: every Analyzer valuation
    today is computed with momentum-neutral pricing (no AI guess of any
    kind baked in) unless the real per-area momentum engine already has
    live data for that specific area — which, as of this fix, is zero areas
    (pending the SQL migration + weeks of accumulation). This is a genuine,
    disclosed, city-wide change in the interim: any area where the AI
    estimate WAS previously nudging prices up or down (not just Downtown
    Dubai) now computes with that nudge removed, until the real engine
    takes over naturally per area. No other part of the valuation formula
    was touched.

- **2026-07-23 (session continuing, follow-up — Home page "Top Opportunities"
  had a real, user-flagged misleading "LIVE" badge; now genuinely wired to
  live data)**: User asked directly whether Top Opportunities was actually
  live, pointing at the pulsing green "LIVE" dot in its header. Confirmed by
  reading the code: `generateMarketMoments()` (`js/app.js`) computed every
  ranking (Yield Champion, 1-Year Growth Leader, 5-Year Capital Story, Best
  Combined Score, Fastest-Selling Market, Most Active Market, personalized
  "For You") purely from the plain static `AREAS` database
  (`js/data-residential.js`) — a number that only changes when the codebase
  itself is recalibrated and redeployed, never in real time — while the
  "LIVE" badge was shown unconditionally. The function's own top-of-file
  comment even said so plainly: "TODO: When DLD live API is integrated...
  upgrade to use real-time transaction data instead of static AREAS
  database." Confirmed via `AskUserQuestion` the user wanted this wired to
  real live data (not just a relabel).
  - **Fix**: `generateMarketMoments()` now builds its area universe via
    `getLiveAreaData(area)` (`js/valuation.js`) — the same real-data blend
    already powering the Analyzer/Advanced Market Screener, which merges the
    static benchmark with the daily-refreshed `area_benchmarks` Supabase
    table (real PSF/DOM/tx-volume from Bayut/PropertyFinder + real weekly
    momentum/growth) whenever a fresh (≤7 day, via the existing
    `getDynamicBenchmark()` gate) row exists for that area, and gracefully
    falls back to the untouched static figure otherwise — no area silently
    loses data, areas without live coverage yet behave exactly as before.
    Every one of the 7 moment-push sites (plus the personalized "For You"
    card, previously reading `AREAS[personalArea]` directly) now carries a
    real `live:true/false` flag from `getDynamicBenchmark(area)`.
  - **UI made honest, not just the data**: the header's "LIVE" dot now only
    pulses when at least one of the 6 displayed cards is genuinely
    live-backed (`moments.some(m=>m.live)`) — otherwise it shows a neutral
    "UPDATED DAILY" label instead, true either way. Each individual card
    additionally shows its own small "● LIVE DATA" (green) or "MODEL EST."
    (neutral gray) tag next to its category badge, since only some areas
    have live coverage today — matching this codebase's established
    "Live Trend"/"AI Trend", "DLD Verified"/"Estimated" honesty-labeling
    convention used elsewhere rather than a single blanket claim covering
    cards with genuinely different data provenance.
  - Verified: `node -c js/app.js`; a Node vm-sandbox test (11 checks)
    extracting the real `generateMarketMoments()` alongside the real
    `getLiveAreaData()`/`getDynamicBenchmark()` from `js/valuation.js` — with
    zero `DYNAMIC_BENCHMARKS` rows, every moment is correctly `live:false`
    and uses the untouched static figures; seeding one area with fresh,
    clearly-different live data (PSF ×1.5, artificially high tx-volume, low
    DOM) confirmed that area wins a ranking category, is correctly flagged
    `live:true`, and its blended PSF/DOM/tx-volume genuinely differ from the
    raw static entry (not a no-op wiring); all other, non-seeded areas
    correctly stayed `live:false`; and a stale (10-day-old) seeded row was
    correctly rejected by `getDynamicBenchmark()`'s existing 7-day freshness
    gate and never produced a `live:true` moment — confirming the fix
    doesn't accidentally weaken that gate's accuracy guarantee.

- **2026-07-22 (session continuing, follow-up — side-effect verification of
  the momentum-engine change, real per-building distance-to-landmarks fix,
  and a full Analyzer-report quality/RAG/duplication pass, all per direct
  user follow-up on the same conversation)**: Direct continuation of the
  momentum-engine entry immediately below — after that fix shipped, the user
  asked 5 more things in one message: (1) whether removing the flat
  `MACRO_VARS.aptAdj`/`villaAdj` defaults corrupts pricing/analysis — asked
  to verify carefully and fix if needed; (2) the long-standing "every
  building in an area shows identical distances to Dubai Mall/Burj Khalifa/
  DIFC/airport" bug, previously only disclosed (2026-07-18) not fixed, now
  that the app is genuinely connected to Google Maps — asked for it to be
  COMPLETELY resolved; (3)/(4) a full one-by-one review of everything the
  Analyzer report shows, fixing/improving each item and eliminating any
  content repeated under different headings; (5) the two AI advisories shown
  in Agent Mode (buyer/seller reports) must be genuinely professional,
  real-estate/sales/marketing-expert-grade and specific to each unit's own
  situation, not generic boilerplate; and (6) that the RAG knowledge system
  must genuinely ground every report/advisory (agent, buyer, and seller
  alike) in real-estate-commerce knowledge, not just be flagged as a future
  TODO.
  1. **Side-effect verification (1) — confirmed safe, quantified with real
     numbers, not just asserted.** Grepped every `MACRO_VARS.aptAdj`/
     `villaAdj` reference app-wide: there is exactly ONE place either value
     is ever READ — `computeAdjustedPSF()`'s `typeAdj` term
     (`js/valuation.js`) — so the change's blast radius is fully understood,
     not a guess. Built a Node vm-sandbox harness that loads the REAL
     `js/valuation.js`/`data-residential.js`/`data-commercial.js`/
     `valuation-db.js` twice — once with the OLD defaults (-0.03/+0.02),
     once with the NEW (0/0) — and diffs `computeValuation()`'s full output
     for 5 real cases (2 real previously-discussed buildings — Fountain
     Views Tower 3, DAMAC Maison Majestine — plus 3 more spanning apartment/
     villa). Confirmed: (a) zero crashes, zero invalid/NaN output in any
     case — the formula itself is completely sound, nothing is "broken"; (b)
     the shift is exactly the disclosed, expected magnitude — apartments
     +3.09-3.12%, villas -1.91% to -2.01% (matches
     `1/(1-0.03)-1`/`1/(1+0.02)-1` precisely); (c) 4 of 5 verdicts were
     completely unchanged; ONE (a villa, Elie Saab AR3 in Arabian Ranches
     III) flipped from FAIR→OVER — a real, correct consequence of removing
     an unjustified flat +2% villa bonus that had been artificially
     inflating its computed value into the FAIR tier, not a bug — a
     threshold-based system moving a borderline case across its own
     boundary when the underlying number shifts a couple of percent is
     expected, correct behavior, not corruption. **One real, separate risk
     surfaced and disclosed rather than silently left**: `fetchSupabaseConfig()`
     (`js/core.js`) unconditionally overwrites `MACRO_VARS.aptAdj`/
     `villaAdj` on every page load from the `market_config` Supabase table
     (`id=1`) if a row exists there — meaning if the Admin Dashboard's
     Market Risk Controls sliders were EVER saved in this project's history
     (a real, pre-existing manual escape hatch, `js/app.js` `renderAdmin()`),
     that stored value silently overrides today's code-level 0/0 default for
     every visitor, not just the admin's own browser. This is not a new bug
     introduced by today's change — it's how that panel has always worked —
     but it means the fix is not guaranteed "live" purely by virtue of the
     code default changing; flagged directly to the user to check the
     sliders read 0%/0% (or deliberately re-save at 0%/0% to clear any old
     stored value) if they want the new automatic system to be the sole
     driver.
  2. **Distance-to-landmarks bug (2) — fixed for real this time, not just
     disclosed.** Root cause, confirmed by reading the code: the Analyzer's
     "Location Intelligence" card showed a Metro/Mall/Business/Airport
     sub-grid sourced from `computeGeoScore(f.area)` — a purely AREA-LEVEL
     static lookup (`js/data-residential.js`) with no per-building
     awareness at all, so Address Fountain Views Tower 3 and Blvd Heights
     (both tagged Downtown Dubai) showed byte-identical "0.53 km to Dubai
     Mall" figures regardless of their real, different locations within
     that area — exactly the duplication the user described, and exactly
     the same static mechanism a 2026-07-18 session had only disclosed via
     an "Area-wide baseline" caveat, not fixed, despite this app's own real
     Google Maps Distance Matrix integration (the "Drive Times" card)
     already existing lower on the same page. **Fix**: removed the entire
     Metro/Mall/Business/Airport sub-grid from Location Intelligence
     outright (kept only the Location Score gauge + Valuation Impact block,
     which genuinely are area-level structural inputs the valuation engine
     itself uses, same category as a school-district rating — not a claim
     about this specific building's exact distance to anything), and
     expanded/renamed the real, already-live, per-building Google Distance
     Matrix hub list (`api/proxy-maps.js`, `action=distances`) from the
     previous "Downtown Dubai"/"Mall of Emirates" pair to the 5 specific,
     high-value landmarks the user actually named and a Dubai buyer
     actually cares about: **Burj Khalifa, Dubai Mall, DIFC, DXB Airport,
     JBR Beach** — every coordinate here is a real, fixed point; only the
     ORIGIN (each building's own live-geocoded lat/lng) varies, so two
     different buildings now always get two different, real driving
     distances/times unless Google's own geocoder genuinely resolves them
     to the same point. Location Intelligence's own trailing disclaimer now
     explicitly points to "Nearby Amenities & Drive Times below" for this
     building's real distances, naming the exact landmarks, instead of the
     old vague area-wide language.
  3. **Full Analyzer report pass (3)/(4) — 16 AI-advisory call sites
     rewritten for real RAG grounding + situation-aware quality, plus a
     section-by-section duplication sweep.** Read every card in
     `renderAnalyzerResult()` end to end (Verdict, Market Integrity Check,
     Sustainability Score, Confidence Factors, Market Sentiment, Price
     History, Rental Intelligence, Rental Demand Score, Market Liquidity,
     Building Turnover, Margin of Safety, Location Intelligence, Nearby
     Amenities, Drive Times, Agent Deal Intelligence/Negotiation, and the
     personal-mode AI commentary) and cross-checked every section header
     app-wide for a literal repeat. Found the SINGLE real duplication (the
     distance grid above, now fixed) and 2 near-misses that were checked and
     confirmed NOT bugs: the Sustainability Score's "Market Liquidity
     Health" sub-component (`sus.liq`, a coarse 4-tier bucket of area DOM,
     25%-weighted into the composite score) is a genuinely different
     granularity/purpose from the full, dedicated "Market Liquidity" card
     (`val.liqScore`/`domEst`/`txVol`/exit-risk advice) further down — both
     legitimately derive from the same underlying DOM figure but serve
     different analytical roles, same as how "growth" legitimately feeds
     more than one composite calculation elsewhere in this engine; and the
     "Market Sentiment" label appearing twice is a loading-skeleton→real-
     content swap of ONE card, not two simultaneous cards.
     - **The real, root-level gap found**: all 6 AI-advisory prompt-builder
       functions (`getAgentAIPrompt`/`getRentalAgentAIPrompt` — the buyer/
       seller reports; `getNegotiationStrategyPrompt`/
       `getRentalNegotiationStrategyPrompt` — the agent-facing negotiation
       strategy; plus the 2 personal-mode prompts, previously inlined ad-hoc
       at each of their 4 call sites) fed a single flat instruction string
       straight into the un-grounded `callGroqRaw()` — ZERO RAG grounding
       (unlike every other `askAI()` call site in this app), and a fixed,
       one-size-fits-all persuasion-technique list regardless of whether
       this exact unit's own numbers actually supported it (e.g. the prompt
       always offered to cite "rising prices" even when this specific
       area's real growth figure was flat or negative — exactly the kind of
       generic, not-unit-specific advice the user explicitly said an agent
       already knows and doesn't need repeated). **Fixed at the root**: all
       6 functions (`js/market.js`) now return `{system,user,groundQuery}`
       instead of a bare string — `askAI()` (not `callGroqRaw()`) appends
       real retrieved RAG context (via the existing `fetchKnowledgeContext()`
       pipeline — live news + daily market snapshots + forecast-accuracy +
       curated research notes, the same knowledge base already grounding
       Chat Agents/Compare/Personal Advisor/Portfolio Analysis) to the
       system prompt before calling Groq, scoped to the property's own real
       area. Each builder now computes real SITUATION FLAGS from the unit's
       own actual numbers — 3yr growth direction (positive vs flat/
       negative), Golden Visa eligibility (fair value >= AED 2M), confidence
       tier (high vs moderate/low), and the area's real DOM pace (fast/
       moderate/slow, driving which closing technique — deadline pressure
       vs. patience — the negotiation-strategy prompt is told to use) — and
       explicitly instructs the model to use ONLY the technique(s) the data
       actually supports, never one it contradicts. The 2 new personal-mode
       functions (`getPersonalSaleAIPrompt`/`getPersonalRentalAIPrompt`)
       consolidate 4 previously-duplicated inline prompt strings and
       explicitly tailor the read to the investor's own stated priority
       (rental-income vs capital-growth vs flip vs end-use), rather than one
       generic script regardless of who's asking. One new shared
       `_dvRunAgentAI(promptObj,area,stateKey)` helper (async, calls the
       real `askAI()`, writes the result into the given `analyzerState` key,
       degrades to the prior value — never throws — on any failure)
       replaced all 16 near-identical `callGroqRaw().then().then().catch()`
       blocks previously duplicated across the villa/apartment ×
       sale/rental × buyer/seller/negotiation/personal-mode call sites — one
       shared, tested code path instead of 16 hand-copied ones that could
       silently drift apart.
  4. **RAG specialization (5)/(6) — confirmed genuinely wired, not just
     flagged.** `askAI()`'s existing grounding mechanism (`js/api.js`)
     appends "Relevant up-to-date Dubai real estate knowledge (from live
     news and daily market data)" retrieved from the SAME real-estate-
     commerce-focused `knowledge_base` table every other grounded feature in
     this app already uses — verified directly in code, not assumed — so
     every one of the 6 rewritten prompts (agent buyer report, agent seller
     report, agent negotiation strategy — both sale and rental — and the 2
     personal-mode reports) now genuinely retrieves and weaves in real,
     current Dubai real-estate knowledge before answering, exactly as the
     user asked, for all 3 audiences (agent, buyer, seller) at once.
  - Verified: `node -c js/market.js`; a dedicated Node vm-sandbox test (32
    checks) extracting the real, rewritten prompt-builder functions +
    `_dvRunAgentAI` and running them against realistic mocked data —
    confirmed every builder returns the correct `{system,user,groundQuery}`
    shape, embeds the real numbers passed in (fair price, suggested offer
    correctly falling back to fair price when null, seller/buyer/landlord/
    tenant negotiation figures), correctly computes each SITUATION FLAG
    (positive vs flat/negative growth, Golden Visa eligible vs not, high vs
    moderate/low confidence, fast vs slow market pace) from the input data,
    correctly differentiates buyer-vs-seller and sale-vs-rental system
    prompts, correctly tailors the personal-mode prompt by investor type,
    and that `_dvRunAgentAI` correctly calls `askAI` with the right
    system/groundQuery, passes `groundAreas` as `[area]` (or `null` when no
    area is given — never `[null]`), writes the real returned text into the
    given state key, and never throws (preserves the prior value) when
    `askAI` itself rejects; the separate before/after MACRO_VARS side-effect
    test described above (5 real cases, 0 crashes, exact expected magnitude,
    1 legitimate verdict flip); and a full grep-based section-header sweep
    of the entire Analyzer result renderer confirming no further exact
    content duplication beyond the one now-fixed distance grid.
  - **Manual step, disclosed above, not yet independently confirmed live**:
    check Admin Dashboard → Market Risk Controls — if the Apartment/Villa
    Adjustment sliders read anything other than 0%/0%, that's a value
    previously saved to the `market_config` Supabase table that will
    silently override today's 0/0 code default for every visitor; reset
    both to 0% and click Save if the automatic per-area momentum system
    (see the entry directly below) should be the sole driver going forward.

- **2026-07-22 (session continuing, follow-up — real, automatic, per-area/
  per-property-type momentum engine built to replace flat AI-guessed/manual
  market adjustments, per explicit user direction)**: Direct continuation of
  the two entries below — after the VALUATION_DB fix resolved the DAMAC
  Maison Majestine case, the user gave a clear, final instruction on the
  remaining open question (how the geo/momentum mechanism should work): no
  manual intervention where avoidable, and — critically — different areas
  and different property types (apartment/villa/townhouse) did NOT decline
  equally after the conflict started, and the market itself moved up then
  down again within the same 6 months, so a single flat percentage applied
  to "all apartments" or "all villas" city-wide can never be accurate
  methodology. Asked for a real engineering fix, not another manual lever.
  - **Found a 3rd, previously-uninvestigated unreliable mechanism while
    tracing exactly what feeds `MACRO_VARS.aptAdj`/`villaAdj`** (the ONLY
    two fields that actually reach `computeAdjustedPSF()`'s `typeAdj` and
    thus every apartment/villa valuation city-wide) — NOT
    `fetchLiveMarket()` as an earlier entry this session slightly
    overstated (that one only ever feeds `getAreaGeoAdj()`/`LIVE_GEO.adj`,
    confirmed via grep to be read ONLY inside a cosmetic Market Dashboard
    commentary sentence, never inside the valuation engine at all — a real,
    separate, lower-priority "stale claim" bug, but it has never actually
    moved a single price). The real culprit was `fetchMarketIntelligence()`
    (`js/core.js`, distinct from the similarly-named, RAG-grounded
    `runMarketIntelligence()`) — auto-fired ~500ms after every page load via
    `fetchSupabaseConfig()`, it asks a completely ungrounded `callGroqRaw()`
    call (no RAG, no news retrieval, literally "from your own knowledge") to
    guess `apt_adj`/`villa_adj`, then writes that guess DIRECTLY into
    `MACRO_VARS.aptAdj`/`villaAdj` — one flat number for every apartment
    area and one flat number for every villa area, nationwide, from an LLM
    with zero live grounding. This is the exact mechanism the user was
    describing and rejecting, more precisely identified than in the entry
    below.
  - **New real, zero-AI signal**: `supabase-real-momentum-schema.sql` (new
    migration, requires manual execution) adds `momentum_recent_pct`/
    `momentum_confidence`/`momentum_sample_recent`/`momentum_sample_prior`/
    `momentum_updated_at` to `area_benchmarks`. New
    `computeRecentMomentumForArea()`/`handleMomentumRefresh()`
    (`api/refresh-market-data.js`, new weekly `?action=momentum-refresh`
    cron, Sundays 07:20 UTC — added to `vercel.json`) compute a rolling
    comparison of the real, already-accumulating `price_history`: the last
    14 real days of an area's live-listing PSF vs. the 14 days before that.
    Zero LLM involvement anywhere in this computation — purely arithmetic
    over real Bayut/PropertyFinder listing data the daily cron already
    fetches. Gated on a minimum sample size per window (4, confidence tiers
    at 6/10) so a data-thin area returns `null` (not a fabricated number)
    rather than a noisy guess, exactly matching this project's established
    `growth_1yr_realized` precedent.
  - **Why this satisfies every part of the user's ask, precisely**: (1)
    fully automatic — no admin action, recomputed every week from data the
    system already collects on its own; (2) genuinely per-AREA — Downtown
    Dubai and JVC get their own independently-computed real trend, never one
    number applied to both; (3) inherently responsive to a real reversal
    within the same 6-month window — since it's a ROLLING recent-vs-prior
    comparison recomputed weekly, a market that went up and then came back
    down shows up as exactly that over successive weekly runs, not frozen at
    a single point-in-time guess; (4) property-type awareness is inherited
    from each area's own already-established villa/apartment classification
    (`VILLA_AREAS`) rather than a new, unverifiable per-listing text
    classifier — the ~30 single-type areas (Dubai Marina, Arabian Ranches,
    etc.) get a fully correct, type-specific real trend for free; the
    dozen already-documented genuinely-mixed areas (Palm Jumeirah, Dubai
    Hills Estate, etc. — see the 2026-07-18 per-building villa/apartment
    refinement entry) share the same known, disclosed limitation as
    everywhere else in this codebase, not a new gap this change introduces.
  - **Wired in, `js/valuation.js`**: `fetchDynamicBenchmarks()` maps the 5
    new `area_benchmarks` fields into `DYNAMIC_BENCHMARKS` (already fetches
    `select=*`, so no query change needed). New `getRealMomentumFactor(area)`
    — reads the real momentum, confidence-weights it (0.35/0.65/1.0 for
    low/medium/high), clamps to ±20%, and returns `null` (not a fabricated
    neutral 1.0) when no real momentum has been computed yet or it's gone
    stale (>10 days, i.e. the weekly cron should have refreshed it by then).
  - **Wired in, `js/core.js`**: `getMomentumFactor(area)` — the function
    `computeAdjustedPSF()` already called for its RAG-grounded AI-estimated
    momentum — now calls `getRealMomentumFactor()` FIRST and only falls back
    to the existing AI-estimated `MARKET_MOMENTUM` path when real data isn't
    available yet for that area (a brand-new area, or one of the ~300 areas
    outside the 41-area daily-refresh cron's coverage) — real data always
    wins when it exists, the AI estimate is now purely a bridge, never
    silently discarded. `computeAdjustedPSF()`/`computeValuation()`
    (`js/valuation.js`) gained a new `momSource` field (`"real"`|`"ai"`)
    threaded through the same return-object chain as `momFactor`, purely so
    the UI can label accurately; `hasMomentum` simplified to
    `momFactor!==1.0` (previously gated only on the AI-specific
    `MARKET_MOMENTUM` object existing, which would have hidden the new
    real-momentum info line entirely — a real bug caught and fixed before
    shipping, not after). `js/market.js`'s two "AI Trend" labels (the
    Analyzer result's momentum pill and its Confidence Factors row) now
    correctly read "Live Trend" when `momSource==="real"`.
  - **`MACRO_VARS.aptAdj`/`villaAdj` defaults changed from -0.03/+0.02 to
    0/0** — these were themselves a flat, unexplained, one-time hand-picked
    guess applied identically to literally every apartment/every villa
    valuation regardless of area, i.e. exactly the "one flat percentage for
    all areas" methodology the user explicitly rejected. `fetchMarketIntelligence()`'s
    auto-fire (the ungrounded-LLM-guess mechanism found above) was removed
    from `fetchSupabaseConfig()`'s call chain entirely — the function itself
    is left defined but unreferenced (dead code, not deleted, same pattern
    as this file's other intentionally-dormant functions) in case a
    genuinely RAG-grounded version is worth building later. The Admin →
    Market Risk Controls slider (`js/app.js`) is UNCHANGED and still works
    exactly as before — kept deliberately as a manual escape hatch for a
    genuine emergency the automatic system hasn't caught up to yet, matching
    the user's "as much as possible" (not "literally zero ever") framing.
  - **Disclosed, real, city-wide side effect of the aptAdj/villaAdj default
    change**: every apartment valuation across the entire app will now show
    a Market PSF a few percent HIGHER than before this change (the previous
    blanket -3% "geo pressure" penalty is gone), and every villa valuation a
    few percent LOWER (the previous blanket +2% bonus is gone), until either
    the new automatic per-area momentum system supplies a real, area-specific
    correction or an admin sets one manually — confirmed directly via a
    regression test (Address Fountain Views Tower 3, no momentum data
    seeded): Market PSF shifted from 3,917 to 4,038 purely from this default
    change (+3.1%, matching the removed flat penalty almost exactly).
    Flagging this plainly rather than treating it as incidental, per
    Directive #2 — it's a deliberate, city-wide, real numeric change.
  - Verified: `node -c` on all 4 touched/added files (`js/core.js`,
    `js/valuation.js`, `js/market.js`, `api/refresh-market-data.js`) plus
    `vercel.json` JSON validity; a Node `vm`-sandbox test (8 cases) — no
    momentum data anywhere correctly returns neutral 1.0; real, fresh,
    high-confidence momentum data is correctly preferred over the AI
    fallback and produces the exact expected factor; real momentum older
    than 10 days is correctly treated as stale and falls back; low-
    confidence data is correctly dampened; an extreme real reading is
    correctly clamped to ±20%; `MACRO_VARS.aptAdj`/`villaAdj` confirmed at
    0/0 by default; a full end-to-end `computeValuation()` run for Address
    Fountain Views Tower 3 with a seeded real -8.2% momentum reading
    correctly reduced the Market PSF and correctly labeled the result
    "Live Trend" (not "AI Trend") in both `dataSource` and the new
    `momSource` field; and a regression case confirming the AI-estimated
    `MARKET_MOMENTUM` fallback path still works correctly when no real
    momentum data exists for an area. A broader sweep re-ran
    `computeValuation()` across 24 sampled real buildings/areas (mixed
    apartment/villa) with zero throws and zero invalid results.
  - **Manual step required before this is live**: run
    `supabase-real-momentum-schema.sql` in Supabase SQL Editor. Until then,
    `getRealMomentumFactor()` always returns `null` (graceful — the existing
    AI-estimated `getMomentumFactor()` fallback path handles every area
    exactly as it already did before this change, zero breakage) and the
    weekly `?action=momentum-refresh` cron simply has no real data yet to
    compute against.

- **2026-07-22 (session continuing, follow-up — CRITICAL root-cause bug found
  and fixed: ~38% of VALUATION_DB was a fabricated "DLD Verified" placeholder,
  not real per-building calibration)**: Direct continuation of the entry
  immediately below — after reporting the market-staleness findings, the user
  gave the exact building from their "distress deal" screenshot: **DAMAC
  Maison Majestine, Downtown Dubai, floor 10, Studio, 440 sqft, pool view,
  furnished, asking AED 700,000**. Investigating this specific building (not
  a guess — read `VALUATION_DB["damac maison majestine"]` directly) found the
  real root cause, and it was NOT primarily the market-staleness theory:
  `VALUATION_DB["damac maison majestine"]` = `{p:2882, lo:2450, hi:3314,
  n:0}` — **`n:0` means zero real DLD transactions back this figure**, and
  its PSF (2882) is EXACTLY `VALUATION_AREAS["Downtown Dubai"].psf` (2882) —
  i.e., `tools/calibrate-db.js` had literally stamped the plain area-wide
  average onto this building as a placeholder when it found no real sales for
  it specifically, yet `computeAdjustedPSF()` (`js/valuation.js`) treated
  ANY existing `VALUATION_DB` key as trustworthy "DLD Verified" per-building
  data regardless of `n`, unconditionally overriding the more realistic
  Legacy DB figure (`DB["damac maison majestine"].p=1720`, grade B+ — a
  modest, budget-branded-residence PSF, nothing like an area-wide Downtown
  average dominated by Ultra/A+ towers).
  - **Confirmed this is systemic, not a one-off**: a direct scan of the live
    `VALUATION_DB` found **3,500 of 9,227 entries (38%) have `n:0`**, and
    99.5% of those have a PSF that matches their area's `VALUATION_AREAS`
    average to within AED 1 — i.e., essentially the entire `n:0` set is this
    same placeholder pattern, not real calibration. The single worst example
    found in the scan: `"baccarat hotel and residences"` — a real Ultra-grade
    tower with a Legacy DB PSF of 8,000 — had its `VALUATION_DB` entry
    silently replaced by the plain Downtown Dubai average (2,882, `n:0`), a
    ~64% understatement that would have gone completely undetected for
    anyone actually analyzing that building, since it was labeled "DLD
    Verified" exactly like a real, well-calibrated entry.
  - **Fix, `js/valuation.js`**: both `computeAdjustedPSF()`'s `vdbEntry`
    resolution and `findComparables()`'s internal `_ve`/`targetPSF`
    resolution (used to score/select comparable buildings for the comps
    blend) now only trust a `VALUATION_DB` entry when it has a real sample
    size (`n>=3` — the same confidence floor this file already uses
    elsewhere, see `getCalibrationFactor()`'s `sample_count>=3` gate) —
    anything thinner falls back to the Legacy DB figure instead, and
    `dataSource` correctly reads "Legacy DB" rather than the false "DLD
    Verified" label in that case. `findComparables()` needed the identical
    fix independently — without it, comps would still be scored/picked as
    "similar" to the fabricated area-average anchor even after the primary
    `basePSF` was corrected, partially undoing the fix through the comps
    blend's 30% weight.
  - Verified via a Node `vm`-sandbox harness loading the real `js/data-
    residential.js`/`js/valuation-db.js`/`js/valuation.js` (plus `js/core.js`
    for `MACRO_VARS`/`getAreaGeoAdj`/`getMomentumFactor`, stubbed DOM/
    storage/fetch): the user's EXACT reported case (DAMAC Maison Majestine,
    studio, 440 sqft, floor 10, pool view, furnished, AED 700,000) improved
    from the originally-reported **Market PSF 3,143 / -51.6% / "DISTRESS
    DEAL"** to a corrected **Market PSF 1,770 / -10.1% / "GOOD PRICE"** — a
    completely ordinary, plausible result, no longer a wild anomaly; the
    Baccarat Hotel case corrected from a fabricated 2,882 anchor to a real,
    Legacy-DB-backed ~7,520 Market PSF (FAIR/+6.4%, consistent with its
    actual Ultra-grade tier); and a regression check against Address
    Fountain Views Tower 3 (a REAL, 228-transaction-backed `VALUATION_DB`
    entry, `n>=3`) confirmed byte-identical output before and after — the
    fix only changes behavior for the ~38% of buildings that were never
    actually calibrated, never for a genuinely verified one. `node -c
    js/valuation.js` clean.
  - **What this means for the two originally-reported complaints**: the
    DAMAC Maison Majestine "distress deal" is now understood to be primarily
    THIS bug, not primarily market staleness — fixed, verified, high
    confidence. The separate Fountain Views Tower 3 "Good Price" case is
    unaffected by this specific fix (it already had `n=228`, real
    calibration) — the market-staleness/momentum-factor findings from the
    entry below still apply there and still need the user's input on how
    (or whether) to adjust `MACRO_VARS`/`getMomentumFactor()`'s weighting;
    this fix does not supersede that open question, it resolves a
    completely separate, larger, and more clear-cut bug found while chasing
    down the first one.
  - **Not done this session, flagged as a natural follow-up**: whether the
    3,500 `n:0` buildings should eventually get real calibration (i.e.,
    whether more/different DLD transaction data exists that would give them
    actual per-building samples) is a data-sourcing question for the
    research branch (`claude/dubaival-portfolio-manager-5bgbjk`), not a code
    fix — this session's fix makes the ENGINE stop pretending a placeholder
    is real data, it doesn't create real data where none was collected.

- **2026-07-22 (session continuing, real user-reported bad-analysis complaints
  — beta paywall disabled, verdict-badge overconfidence fixed, and a serious
  market-staleness finding reported to the user, not yet acted on pending
  their real-world input)**: User shared 5 screenshots of 3 real Analyzer
  results and asked for all of it to be investigated: (1) a unit priced AED
  700,000 in a "DAMAC Maison"-type building showing "DISTRESS DEAL" at -51.6%
  vs market (Asking PSF 1,522 vs Market PSF 3,143), which the user doubted
  given current market conditions; (2) Address Fountain Views Tower 3 (2BR,
  Downtown Dubai) at AED 7,000,000 showing "GOOD PRICE" at -13.4% (Asking PSF
  4,430 vs Market PSF 5,115), which the user also doubted; (3) attempting a
  3rd analysis hit a dead "DubaiVal Pro — Free limit reached... Billing isn't
  configured yet, contact support@dubaival.com" paywall, which the user asked
  removed outright since the platform is still in beta and not selling
  subscriptions; and (4) a standing theory: the DLD transaction data the
  valuation engine was calibrated from reflects the region BEFORE the real
  Iran/Israel/US conflict, when the market was "normal," and the several
  months of real market decline since then aren't being captured.
  1. **Beta paywall — fixed outright, no judgment call needed.** `isProUser()`
     (`js/core.js`) now short-circuits to `true` behind a single new
     `DV_BETA_NO_PAYWALL` flag (default `true`) — this one flag transparently
     unlocks every Pro-gated feature across the whole app at once (the
     Analyzer's 5-valuations/month counter, PDF/Arabic report export, Price
     Alerts, Portfolio tracking/projections/PDF export), not just the
     Analyzer limit specifically, since the user's stated policy ("no
     subscription selling during beta") is general, not scoped to one
     feature. Every other piece of the paywall (usage tracking, the modal,
     the real Stripe checkout wiring) is left completely intact underneath
     this flag — flipping it back to `false` once a real Pro tier is ready
     to sell re-enables the whole gate exactly as it was, with zero other
     code changes needed.
  2. **Verdict-badge overconfidence — fixed.** `renderAnalyzerResult()`
     (`js/market.js`) already had a separate, well-built "Market Integrity
     Check" card (fires at ≥30% deviation, correctly lists distress-sale /
     data-entry-error / property-condition-issue as EQUALLY possible
     explanations — i.e., the app itself does not conclude a large gap is a
     safe, real discount) — but it renders BELOW the main verdict card, which
     showed a bold, unqualified "DISTRESS DEAL"/"GOOD PRICE" headline plus
     specific gross/net yield figures with no visual indication the app was
     itself uncertain about the underlying number. A user could reasonably
     read the DAMAC-Maison-type -51.6% case as a screaming, actionable buy
     opportunity, when the app's own anomaly detector was already flagging it
     as likely a data problem or a single distressed listing, not a market-
     wide signal. Fixed with a small inline caveat line under the verdict
     label whenever the same ≥30% threshold used by the anomaly card fires
     ("⚠ N% deviation flagged — see Market Integrity Check below before
     acting on this") — a pure UI/honesty fix, the verdict computation itself
     (`computeValuation()`) was not touched.
  3. **Market-staleness theory — investigated thoroughly, confirmed
     well-founded with concrete evidence, NOT yet acted on (reported to the
     user, a decision on the actual macro-adjustment magnitude needs their
     real, current, on-the-ground market knowledge, not a unilateral guess)**:
     - `tools/calibrate-db.js`'s own header comment names the exact CSV this
       calibration was run against — `transactions_2026-05-26_02-03-11_2.csv`
       — meaning the static DLD-calibrated anchor (`VALUATION_DB`/
       `VALUATION_AREAS`) is a real, ~8-week-stale snapshot as of today
       (2026-07-22), with nothing captured since May 26.
     - The one mechanism whose whole job is tracking exactly this kind of
       ongoing macro/geopolitical shift — `fetchLiveMarket()`'s "Live
       Geopolitical Adjustment" (`js/core.js`) — turned out to NOT be live at
       all: its prompt hardcodes a frozen, hand-written "OFFICIAL DLD
       CONTEXT" narrative ending at "June 2026: Cautious stabilization,"
       fed to a plain, ungrounded `callGroqRaw()` call (no RAG, no real news
       retrieval) — the LLM has no way to know anything that happened after
       whatever date a past session last hand-edited that text block, and the
       narrative itself becomes a false, un-updatable claim the longer it
       goes untouched (the same "hardcoded-date-becomes-a-past-claim" bug
       class already fixed multiple times elsewhere in this app — e.g. the
       "Coming Q3 2026" badge, the Analyzer/Portfolio hardcoded "June 2026"
       AI-prompt dates fixed 2026-07-12). Not fixed yet this session, since
       rewriting a macro-risk prompt that indirectly affects every
       valuation's PSF (via `MACRO_VARS.aptAdj`/`villaAdj`) needs the same
       "report findings, get explicit approval before touching the engine"
       treatment already established for every other core-formula change in
       this file's history.
     - By contrast, `runMarketIntelligence()` (also `js/core.js`, feeds
       `MARKET_MOMENTUM`/`getMomentumFactor()`, which DOES directly multiply
       into `computeAdjustedPSF()`'s `basePSF`) IS properly RAG-grounded
       (`askAI(..., groundQuery, groundAreas)` — real, recently-ingested news
       content, not a frozen narrative) — but for the exact Fountain Views
       Tower 3 / Downtown Dubai case the user flagged, it had computed a
       **+5.0% "AI Trend" adjustment (i.e., believes the area is currently
       APPRECIATING)**, directly opposite the user's own real-world
       observation of an ongoing decline — confirmed by reading the second
       Fountain Views screenshot's own "AI Trend: +5.0% market adjustment"
       line. This is plausibly explained by the RAG knowledge base's
       ingested news simply not containing enough real, specific coverage of
       the regional conflict's market impact for the LLM's estimate to
       reflect it, rather than a code bug in the grounding mechanism itself.
     - Cross-checked the two flagged buildings directly against real DB
       entries: Address Fountain Views Tower 3 is a genuine `Ultra`-grade,
       developer-furnished Downtown Dubai tower (`VALUATION_DB` PSF 4,050
       from 228 real DLD transactions, `DB` legacy PSF 3,700) — its Market
       PSF of 5,115 in the screenshot is the calibrated anchor further
       pushed up by comps-blending, area-drift-indexing, and the +5% AI
       Trend momentum factor above — a small (-13.4%), plausible-either-way
       deviation, consistent with the user's staleness theory but not
       provable as such from this sandbox alone (no live web/Bayut access to
       independently confirm today's real comparable pricing).
     - The DAMAC-Maison-type case's -51.6% gap, by contrast, is far too
       extreme to be explained by ANY plausible market-wide correction (even
       a severe regional shock) — this is almost certainly either a single
       anomalous/distressed listing or a data-entry issue (matching what the
       app's own Market Integrity Check already suspects), not evidence the
       area-wide benchmark itself is off by half. The exact building name
       wasn't legible in the screenshots provided (header cropped/scrolled
       out of frame in both shots of this case) — flagged to the user as
       something a future session can check specifically if they give the
       exact building/area typed into the form.
     - **Not changed this session**: `MACRO_VARS.aptAdj`/`villaAdj` defaults,
       the `fetchLiveMarket()` prompt content, and `getMomentumFactor()`'s
       weighting/cap — all directly affect every valuation site-wide, and
       only the user has real, current knowledge of how large an actual
       regional market correction has been; a unilateral guess here would
       violate this file's own Directive #2 (max 3% deviation, cross-check
       real data before any valuation-engine change). Flagged as the next
       decision point for the user: whether to (a) set a real, manual
       correction via the existing Admin → Market Risk Controls panel
       (instant, reversible, already wired into every valuation via
       `typeAdj` — see `js/app.js` `renderAdmin()`), (b) have a future
       session zero out/disable the AI-guessed momentum factor until real
       conditions can be independently confirmed, since it is currently
       pointing the WRONG direction for at least the Downtown Dubai case
       checked here, or (c) both.
  - Verified: `node -c` on both touched files (`js/core.js`, `js/market.js`);
    confirmed via direct reads of `VALUATION_DB`/`DB`/`AREAS` that the
    Fountain Views Tower 3 figures used above are real, not approximated.
    Not independently re-verified live in a browser this session (no network
    access to a live Analyzer run from this sandbox) — the paywall bypass and
    verdict-caveat changes are small, low-risk, and follow patterns already
    proven elsewhere in this codebase, but a quick live click-through by the
    user after deploy (try analyzing 6+ properties in one browser session,
    and re-check a large-deviation case for the new caveat line) is still
    worth doing.

- **2026-07-22 (new session, real user-reported bug — white-on-white text in
  light mode across Personal Advisor/Compare/Portfolio, plus a Groq-key
  diagnosis)**: User shared a real screenshot of Personal Advisor's final
  wizard step showing "Unable to generate report: AI error: API 401", and
  separately reported that on that same last step ("Where do you work?")
  they couldn't read or select the area they typed — the font was
  completely white and invisible.
  - **Root cause, confirmed by reading the code, not guessed**: the
    screenshot showed the app in LIGHT MODE (a real, working, previously-
    shipped theme — `T.light` in `js/data-residential.js`, where the
    correct text-color token `cl.white` resolves to `#1A2040`, a dark
    navy — vs. dark mode's `#E8EDF5`). But `renderPersonal()` (Personal
    Advisor), `renderCompare()`, and `renderPortfolio()` in `js/portfolio.js`
    had **17 separate places** — every step heading, both real `<input>`
    fields (budget amount, work location), the loading-screen label, and
    several result labels — hardcoded literally as `color:"#FFFFFF"`
    instead of the theme-aware `cl.white` token, even though `cl` was
    already in scope in every one of these functions. In dark mode this
    looked fine (pure white ≈ the dark-mode token's near-white value); in
    light mode, pure white text on the light page background (and the
    barely-tinted input backgrounds sitting on it) was effectively
    invisible — exactly the "couldn't select/type, font was completely
    white" symptom reported, and directly visible in the user's own
    screenshot (the "Personal Advisor" header title is a barely-visible
    ghost of itself right under the fully-legible "AI INVESTMENT ADVISOR"
    label one line above it, which uses a real fixed mid-gray that reads
    fine in either theme).
  - **Fix**: all 17 occurrences in `js/portfolio.js` replaced with
    `cl.white` via a scoped find-and-replace (verified `cl` was already
    defined via `C()` at the top of all 3 affected functions before
    changing anything) — one mechanical, low-risk fix closes every
    instance at once rather than patching only the one input field the
    user happened to hit.
  - **Separately diagnosed, NOT a code bug — the "API 401" error**: traced
    `askAI()`'s error path (`js/api.js` line 255: `if(!r.ok)throw new
    Error("API "+r.status)`) through to `api/proxy-groq.js`, which
    faithfully forwards whatever HTTP status Groq's own API returns
    (`res.status(upstream.status).json(data)`) rather than ever
    manufacturing a 401 itself (a missing `GROQ_API_KEY` env var there
    correctly returns 500 instead, a different, confirmed-not-this-case
    code path). A 401 specifically means Groq itself rejected the
    configured `GROQ_API_KEY` as invalid/expired/revoked — a real
    upstream authentication failure, not a bug in this app's code. Told
    the user directly: this needs a fresh key generated at
    console.groq.com and re-set as `GROQ_API_KEY` in Vercel → Settings →
    Environment Variables, then a redeploy — not something fixable by
    editing the repo.
  - Verified: `node -c js/portfolio.js`; a real-browser Playwright test
    switching the live app into light mode and driving Personal Advisor to
    the exact reported step — confirmed the "Where do you work?" heading
    and the input's own typed text both now compute to `rgb(26,32,64)`
    (the correct light-mode dark-navy token, previously would have been
    pure white/invisible), and confirmed dark mode is completely
    unaffected (`rgb(232,237,245)`, unchanged) — zero regression to the
    default theme; a visual screenshot of the fixed light-mode step
    confirming the heading, description, and input placeholder are all
    now clearly legible; and the existing 10-tab regression sweep — zero
    collateral console errors.

- **2026-07-21 (same session, follow-up — real zero-touch OAuth "Connect"
  flows for LinkedIn + X/Twitter built, and a real, silent bug fixed in the
  ALREADY-EXISTING Instagram/Facebook one)**: Direct continuation of the
  earlier WhatsApp-login-code confusion — user asked whether Social Media
  Manager was built per Directive #4's zero-touch vision (admin adds ONE
  token, users just enter their own social handles and connect
  automatically). Investigating turned up a genuine surprise: a full,
  correctly-structured OAuth "Connect" flow for **Instagram + Facebook and
  Gmail already exists** (`handleOauthMeta`/`handleOauthGoogle` in
  `api/inbox.js`, `callback.html`, the `oauthBtn()` helper in
  `renderProfilePanel()`, `js/app.js`) — built in an earlier session not
  fully reflected in this file's own "not yet built" framing under
  Directive #4, which was accordingly stale. `showSocialSetup()`
  (`js/chat.js`) — the OLDER, still-manual-paste modal I'd checked first
  when answering the earlier WhatsApp-login question — is a second, legacy
  UI that coexists with the real one; the Profile Panel is what's actually
  live and current.
  1. **Critical, silent bug found in the EXISTING Meta OAuth flow**: its
     scope list (`js/app.js`) requested only messaging/read permissions
     (`pages_show_list, pages_messaging, instagram_manage_messages,
     instagram_basic, pages_read_engagement, read_page_mailboxes`) —
     **missing `instagram_content_publish` and `pages_manage_posts`, the
     actual PUBLISH permissions.** Even once Meta App Review passes, the
     resulting token could read messages/engagement but could never
     actually POST — silently defeating the entire stated purpose ("so
     people can share the posts they create on their own Instagram").
     Fixed by adding both, plus `ads_management`/`business_management` (see
     item 3 below).
  2. **Multi-Page handling fixed** (`handleOauthMeta`, `api/inbox.js`): an
     agent managing more than one Facebook Page had `pages[0]` chosen
     blindly, which could silently connect the wrong one. Now checks every
     page's linked Instagram Business Account and prefers the first one
     that has one (this app's primary posting target); the response
     includes `other_pages` (name + has_instagram) so the callback page can
     at least disclose "you manage N pages — this one was chosen
     automatically" rather than silently guessing with zero visibility.
  3. **Ads Pixel auto-discovery added to the same connection** — the added
     `ads_management`/`business_management` scopes let the same OAuth grant
     also auto-populate the Meta Ads Pixel ID (via `/me/adaccounts` →
     `/act_.../adspixels`), closing another manual-paste field (Profile →
     Meta Ads Pixel) for free. The Conversions API access token itself
     stays a deliberate, disclosed manual field — Meta's API has no
     discovery endpoint for it.
  4. **LinkedIn — built from scratch, completes an already-working posting
     pipeline**: `api/auto-post.js`'s `publishLI()` already correctly posts
     using `linkedin_token`/`linkedin_urn` — the only missing piece was a
     real OAuth grant. New `handleOauthLinkedin` (`api/inbox.js`, OAuth 2.0,
     standard authorization-code flow): exchanges the code, reads the
     member's own URN via LinkedIn's OpenID Connect `/v2/userinfo` endpoint
     (posts as the member themselves — `urn:li:person:<sub>` — not a
     company Page, which needs a separate, higher-friction admin-verified
     scope this session deliberately didn't add), and upserts into the
     exact same `linkedin_token`/`linkedin_urn` columns the manual-paste
     flow already used. New `linkedin_client_id` field on `?action=config`;
     a real "Connect LinkedIn" button replaces the old 2 manual-paste
     fields in the Profile Panel (`oauthBtn(...,"linkedin")`); `callback.html`
     gained a real LinkedIn branch (previously just displayed the raw OAuth
     code for the user to copy-paste — a "legacy" placeholder that never
     actually called anything).
  5. **X / Twitter — built from scratch, also completes an already-working
     posting pipeline**: `api/auto-post.js`'s `publishTW()` already posts
     via classic OAuth 1.0a signing — but requires the FULL 3-legged OAuth
     1.0a flow (a temporary request token obtained server-side BEFORE the
     user is redirected, genuinely different in shape from every other flow
     in this file — no `client_id` the browser can build a URL with
     directly, and the callback comes back as `oauth_token`+`oauth_verifier`,
     not `code`+`state`). New `handleOauthTwitterInit`
     (`POST /api/inbox?action=oauth-twitter-init` — requests a temporary
     token from `api.twitter.com/oauth/request_token`, signed with our own
     app-level `TWITTER_CONSUMER_KEY`/`TWITTER_CONSUMER_SECRET`) and
     `handleOauthTwitterExchange` (`action=oauth-twitter-exchange` —
     completes the exchange once the user approves, upserts
     `twitter_access_token`/`twitter_access_secret`). Client stashes the
     request token's own secret in `sessionStorage` (keyed by the token
     itself, so two concurrent connect attempts in different tabs can't
     collide) before redirecting to `api.twitter.com/oauth/authorize`;
     `callback.html` detects the `oauth_token`+`oauth_verifier` shape
     (distinct from every other platform's `code`+`state`) and completes
     the exchange. **A necessary consequence**: `publishTW()` in
     `api/auto-post.js` now signs with our OWN shared
     `TWITTER_CONSUMER_KEY`/`TWITTER_CONSUMER_SECRET` (env vars) instead of
     a per-agent pasted consumer key/secret — matching the whole point of
     this migration (one admin-level app, not one Twitter Developer App
     per agent). A pre-migration row that only has an old manually-pasted
     PERSONAL consumer key/secret now correctly fails closed ("Not
     configured") rather than silently mis-signing with a mismatched
     app/token pair — the agent needs to reconnect via the new button once
     it's live. The Profile Panel's 4 old raw Twitter fields (Consumer
     Key/Secret, Access Token/Secret) are gone entirely, replaced by one
     "Connect X / Twitter" button + a status line.
  6. **A real, separate credential-clobbering bug found and fixed while
     wiring all this in**: `_syncCredsToServer()` (`js/chat.js`) built its
     PATCH payload by reading every raw credential field straight from
     `localStorage.getItem(key)||null` — meaning if an OAuth flow (correctly,
     deliberately) never mirrors a sensitive value like `linkedin_token`
     back into localStorage, the very next time the agent clicked "Save
     Profile" for something unrelated (their phone number, say), this would
     PATCH an explicit `null` over the real, just-connected token stored
     server-side moments earlier — silently undoing a successful connection.
     Confirmed this wasn't hypothetical for Twitter specifically: an early
     version of this session's own code stored the connected account's
     screen name into `dv_twitter_access_token` (as a "connected" UI flag)
     — which would have then been faithfully PATCHed back as the literal
     access token, overwriting the real one with a garbage string. Fixed at
     the root: `_syncCredsToServer()` now only ever ADDS a field to the
     payload when a real localStorage value exists (never sends an explicit
     null for an absent one) via a new `_SOCIAL_CRED_FIELD_MAP`, and the
     Twitter "connected" indicator now lives under its own dedicated key
     (`dv_twitter_connected`), never colliding with the real sync-relevant
     `dv_twitter_access_token`/`dv_twitter_access_secret` keys. This closes
     the risk for ALL platforms this function touches, not just the 2 new
     ones — a real, general hardening, not a narrow patch.
  7. **Deliberately NOT built this session, and why**: YouTube and TikTok
     OAuth connections were considered but explicitly skipped — a full grep
     of `api/auto-post.js` confirmed NEITHER platform has any actual
     posting/upload implementation at all yet (their credential columns/UI
     fields exist, but nothing server-side does anything with them) —
     building just the OAuth connection with no real posting pipeline behind
     it would be a hollow, misleading "Connected!" state. This is real,
     separate follow-up work (YouTube needs the Data API's resumable
     video-upload flow; TikTok needs its own Developer App + Content Posting
     API integration) that should be done together with, not instead of,
     an OAuth "Connect" button. WhatsApp Embedded Signup (a specialized
     JS-SDK-embed flow, not a plain redirect) remains blocked on the same
     Meta Business Verification dependency already documented elsewhere in
     this file, unrelated to this session's LinkedIn/Twitter work.
  - Verified: `node -c` on all 4 touched server/client files; a mocked-fetch
    Node test harness against the real `api/inbox.js` handlers (12 cases)
    — `?action=config` returns the 3 new fields correctly; `oauth-meta`
    correctly prefers the IG-linked page among 2 real candidate pages and
    discovers a real pixel ID, correctly reports zero IG/pixel for a
    single plain page, and correctly 400s on missing code/userId with zero
    network calls; `oauth-linkedin` performs a real token exchange +
    OpenID `userinfo` call and upserts the correct `linkedin_token`/
    `linkedin_urn`, and correctly surfaces a real LinkedIn error on a bad
    code; `oauth-twitter-init` correctly signs and parses a real (mocked)
    Twitter request-token response and correctly rejects an unconfirmed
    callback; `oauth-twitter-exchange` performs a real (mocked)
    access-token exchange and upserts the correct access token/secret, and
    correctly 500s with zero network calls when the app-level env vars
    aren't set; a companion test against the real (newly-exported, test-
    only) `api/auto-post.js` `publishTW()` confirming it now signs with the
    shared env-level consumer key (not `creds.twitter_consumer_key`) while
    still using the agent's own per-row access token/secret, and correctly
    fails closed ("Not configured") for a pre-migration row that only has
    an old personal consumer key/secret with no app-level env vars set; a
    dedicated Node vm test (4 cases) against the real `_syncCredsToServer()`
    confirming a LinkedIn-OAuth-only state sends `linkedin_urn` but never
    sends (nulls) `linkedin_token`, confirming a fully-disconnected state
    sends zero raw credential keys at all, confirming a fully-populated
    Instagram state still sends its real values correctly (no regression),
    and confirming the automation toggles/user_id/updated_at are always
    present regardless; an isolated vm test (4 cases) of the exact X/Twitter
    click-handler logic (sidesteps a real-browser limitation where
    assigning `window.location.href` destroys the JS execution context
    before Playwright can read back `sessionStorage` — confirmed via 2
    separate failed real-browser attempts before settling on this
    approach) confirming the request-token secret is correctly stashed
    under the right key BEFORE the redirect fires, and confirming graceful
    handling of "not configured," a failed init call, and a network error;
    a real-browser Playwright pass confirming the Meta OAuth URL now
    genuinely includes all 4 new scopes and the LinkedIn OAuth URL is
    built correctly (both captured via request interception before the
    real, unreachable-from-this-sandbox external navigation occurs), plus
    graceful degradation (a real alert, zero navigation) when Meta isn't
    configured; a second real-browser pass driving the real, static
    `callback.html` end-to-end for all 4 branches — a real X/Twitter
    exchange call with the correct stashed secret retrieved and cleaned up
    after use, a missing/expired secret correctly short-circuiting with a
    clear message and zero exchange call, a real LinkedIn exchange
    correctly mirroring `linkedin_urn` to localStorage, a real Meta
    exchange correctly surfacing the multi-page transparency note and
    auto-filled pixel ID, and an unrecognized platform value now showing a
    clean error instead of the old dead "copy this code" fallback; a full
    Profile Panel render test with a realistic MIXED state (Instagram/
    LinkedIn OAuth-connected, Twitter not yet connected, TikTok still on
    the untouched legacy manual-paste path) confirming everything renders
    correctly together with the old Twitter key fields genuinely gone; and
    the existing 10-tab regression sweep — zero collateral console errors
    anywhere.
  - **Manual steps required before LinkedIn/Twitter go live** (Meta's
    Instagram/Facebook connection was already live-eligible before this
    session, pending only Meta's own App Review — see the existing
    Directive #4 entry below): set `LINKEDIN_CLIENT_ID`/
    `LINKEDIN_CLIENT_SECRET` (a LinkedIn Developer App with "Sign In with
    LinkedIn using OpenID Connect" + "Share on LinkedIn" products added —
    LinkedIn's own review process, generally lighter-weight than Meta's)
    and `TWITTER_CONSUMER_KEY`/`TWITTER_CONSUMER_SECRET` (a Twitter/X
    Developer App with OAuth 1.0a explicitly enabled in its User
    authentication settings, plus the correct callback URL —
    `https://www.dubaival.com/callback` — registered there) in Vercel env
    vars. Until either is set, that platform's Connect button shows a
    clear "not set up yet" message rather than a broken redirect — nothing
    else in the app is affected either way. **Also note**: the Meta App's
    already-submitted permission set now needs `instagram_content_publish`/
    `pages_manage_posts`/`ads_management`/`business_management` added and
    re-submitted for App Review if not already requested — check the
    current review status before assuming these new scopes are already
    approved.

- **2026-07-21 (same session, follow-up — real revenue events were never
  tracked at all, plus a new ad-blocker-immune Admin traffic/funnel card)**:
  User found the site's real GA4 property (`G-7J3H12JGPE`, live since
  2026-07-15) and asked for help correctly setting up GA4 "Key Events"
  (conversions) plus a more precise way to analyze visit stats overall.
  Investigating what real funnel events already flow to GA4 via `dvTrack()`
  (`js/core.js`, calls `gtag()` + writes to `analytics_events` — 12 real
  call sites: `signup_completed`, `analyze_property`/`analyze_rental`,
  `pdf_generated`/`pdf_arabic_generated`, `price_alert_subscribed`,
  `deal_listing_posted`/`deal_request_posted`, `tab_view`, `js_error`)
  surfaced a real, more important gap first: **not one of the 5 real Stripe
  Checkout success redirects was ever tracked, and the paying user never
  saw any confirmation at all.** `api/billing.js`'s 5 checkout flows (Pro
  subscription + video/video-gen/WhatsApp/voice credits) all correctly
  redirect back to `/?<flag>=1` on a genuinely completed payment — but a
  full grep confirmed no client code anywhere ever read `location.search`
  for these flags. A user who just paid real money landed back on Home with
  zero acknowledgment their payment succeeded, and — for GA4's purposes —
  the single most valuable business event (an actual paying customer) was
  completely invisible, making it impossible to ever mark a real "purchase"
  Key Event in GA4 at all.
  - **Fix, `js/core.js`**: a small IIFE (runs once, at parse time, right
    after `dvTrack()`'s own definition) checks all 5 flags
    (`upgraded`/`video_credit`/`video_gen_credit`/`whatsapp_credit`/
    `voice_credit`), fires the correct new `dvTrack()` event
    (`pro_upgrade_completed`/`video_credit_purchased`/
    `video_gen_credit_purchased`/`whatsapp_credit_purchased`/
    `voice_credit_purchased`) the moment a real flag is found, stores a
    time-boxed (8s) success message, and cleans the query string via
    `history.replaceState` so a refresh can't re-fire it. New
    `renderPurchaseSuccessBanner()` (wired into `render()`'s existing
    overlay-append block in `js/app.js`, right alongside the Report Issue
    widget/PWA banner) shows a real dismissible green confirmation banner
    while inside that time window. Deliberately used a TIME WINDOW rather
    than a one-shot "clear the flag on first render" flag — `render()` gets
    called repeatedly right after load for unrelated reasons (background
    momentum fetches, etc.), and since `render()` rebuilds `#app` from
    scratch every time, a one-shot flag would have made the banner flicker
    away almost immediately instead of staying visible for a meaningful
    duration.
  - **New — Admin Dashboard "◆ Traffic & Funnel Stats" card** (real,
    ad-blocker-immune second view alongside GA4, directly answering the
    user's "دقیق‌تر تحلیل کنیم" ask): new `supabase-visitor-stats-schema.sql`
    (requires manual execution) adds 2 admin-only, password-gated,
    `security definer` RPCs reusing the existing `_admin_password_ok()` —
    same pattern as the error-reporting RPCs — since `analytics_events` RLS
    is anon-insert-only with no SELECT policy: `admin_get_traffic_stats`
    (real distinct-`session_id` counts for today/7d/30d/all-time, plus a
    30-day total-event count for engagement depth) and
    `admin_get_funnel_breakdown` (per-event-name counts over a caller-chosen
    window, default 30 days). `js/app.js` gained `ADMIN_TRAFFIC_STATE` +
    `_fetchAdminTrafficStats()` (auto-fetches on admin login, alongside the
    other `_fetchAdmin*` calls) and a new card rendering 4 unique-visitor
    stat tiles plus a friendly-labeled funnel breakdown (a `FUNNEL_LABELS`
    map translates raw event names like `analyze_property` into
    "Valuations Run (Sale)"; money-generating events get a 💰 prefix and
    green highlight; an unrecognized future event still shows correctly via
    the raw-name fallback, so a new `dvTrack()` call site never needs a
    matching edit here to remain visible) — inserted right above the
    existing "Live Error & Issue Reports" card, same visual/structural
    pattern (load-once + refresh button, clear SQL-not-run error message on
    a failed RPC call rather than a silent failure).
  - Verified: `node -c` on both touched files; an isolated Node vm test (8
    cases) confirming the purchase-tracking IIFE correctly fires the right
    event + cleans the URL for each of the 5 real flags, is a complete
    no-op for an unrelated query param or an empty query string (zero
    `dvTrack`/`history.replaceState` calls), and that
    `renderPurchaseSuccessBanner()` correctly renders while inside the
    8-second window, correctly returns `null` once expired or when no
    message was ever set, and correctly permanently dismisses on a close
    click; a second isolated Node test (4 cases) against the real
    `_fetchAdminTrafficStats()` — no admin password set is a complete
    no-op, a successful pair of RPC calls populates real stats/funnel state
    correctly, a not-yet-migrated RPC (404) shows the exact
    `supabase-visitor-stats-schema.sql` guidance instead of a silent
    failure, and a thrown network error degrades gracefully with no throw;
    and a real-browser Playwright pass (3 test groups) — landing on
    `?upgraded=1` shows the real banner, correctly tracks
    `pro_upgrade_completed` to `analytics_events`, cleans the URL to a bare
    `#Home` hash, and closing it removes it permanently even across a
    forced re-render; a normal load with no query param shows no banner and
    no bogus tracking; and the Admin Dashboard's new card (mocked RPC
    responses) renders the real 30-day unique-visitor count, the
    human-readable funnel label, the correct event count, and the 💰-tagged
    money event — zero console errors across every pass.
  - **Manual step required before the Admin card is usable**: run
    `supabase-visitor-stats-schema.sql` in Supabase SQL Editor (requires
    `supabase-analytics-events-schema.sql` and
    `supabase-admin-security-fix.sql` already applied, which they are).
    Until then, the card shows a clear "run supabase-visitor-stats-schema.sql"
    message instead of data — purchase tracking/the success banner both work
    immediately regardless, since they only depend on the already-existing
    `analytics_events` table's anon-INSERT policy, not these new RPCs.
  - **Next, not yet done — a manual step in GA4's own UI, cannot be done
    from this session**: once this ships and a real purchase happens, the
    user should mark `pro_upgrade_completed` (and, if desired,
    `signup_completed`/`analyze_property`/`analyze_rental`) as Key Events in
    GA4 Admin → Events → find the event name → toggle "Mark as key event" —
    GA4 has no API this session can drive without OAuth credentials the user
    would need to set up separately, so this is walked-through guidance, not
    something built into the app.

- **2026-07-21 (new session, real production crash found via Live Error &
  Issue Reports and fixed — "DB_LOADED is not defined")**: User asked to
  check the Admin Dashboard's "Live Error & Issue Reports" card (built
  2026-07-14, session 11z) for real captured errors — first, a full audit
  confirming this feature's own coding (automatic `window.onerror`/
  `unhandledrejection` capture, the manual "Report an Issue" FAB, the
  anon-insert-only `analytics_events` table, and the two password-gated
  `security definer` admin RPCs) was built correctly end-to-end with no
  bugs, and both `supabase-analytics-events-schema.sql`/
  `supabase-error-reporting-schema.sql` were re-delivered since their
  execution status had never been confirmed. The user then pasted a real
  captured error from that card: `DB_LOADED is not defined` at
  `https://www.dubaival.com/#Home`.
  - **Root cause, confirmed by reading the code, not guessed**:
    `render()` (`js/app.js`, the app's single entry point, called once
    from `index.html`'s `DOMContentLoaded` handler) opens with
    `if(!DB_LOADED){...show a loading spinner...}` — a guard clearly
    *intended* to handle "the 1.2MB+ `js/data-residential.js` hasn't
    finished loading yet" gracefully. But a bare `!DB_LOADED` reference
    throws a `ReferenceError` (not a falsy-check) if that script fails to
    download AT ALL (a dropped/slow mobile connection, not just "hasn't
    parsed yet") — since `var DB_LOADED=true;` inside that file is never
    reached, the global is never declared, and referencing an undeclared
    bare identifier throws before the very safety net meant to catch this
    exact situation can even run. Confirmed via a real-browser Playwright
    test that blocked `js/data-residential.js` from loading at all — before
    the fix this reproduces the exact reported crash; the built-in
    `window.onerror` handler then shows the raw "JS Crash — Copy this and
    send to Claude" screen instead of anything graceful.
  - **A second, related latent bug found while fixing this**: even in the
    scenario the original guard WAS designed for (DB still loading, not
    failed), nothing anywhere ever called `render()` again once
    `DB_LOADED` did flip to `true` a moment later — so a genuinely slow
    (not failed) load would leave the app stuck on the spinner forever with
    no self-recovery.
  - **Fix**: the guard is now `typeof DB_LOADED==="undefined"||!DB_LOADED`
    (crash-safe regardless of whether the script ever loaded at all), self-
    polls via `setTimeout(render,800)` while waiting (fixing the second bug
    above — a late-but-successful load now resumes automatically with zero
    extra intervention), and after 6 seconds with no success shows a clear
    "Couldn't load property data — check your connection" message with a
    real "↻ RETRY" button (`location.reload()`) — matching this app's own
    established pattern for this class of failure (Map's "Map unavailable,"
    News's error+Retry, Market Dashboard's AI-timeout+Retry, all cited
    elsewhere in this file) rather than a silent, unrecoverable hang.
  - Verified: a 5-case isolated Node unit test (DB_LOADED undeclared →
    no throw, shows loading UI; DB_LOADED=false → same; waited >6s → shows
    the Retry button; DB_LOADED=true → correctly proceeds past the guard
    into the real render, not the early-return path; still-waiting state
    correctly schedules the 800ms self-poll) — all 5 passed; and a real-
    browser Playwright pass — one page with `js/data-residential.js`
    entirely blocked (reproducing the real crash scenario) confirming zero
    uncaught page errors and the graceful loading UI instead of the "JS
    Crash" screen, one normal unblocked page confirming `DB_LOADED===true`,
    the real app renders exactly as before, and zero console/page errors —
    both passed, confirming the fix is fully backward-compatible with the
    ordinary successful-load path. `node -c js/app.js` clean.

- **2026-07-19/20 (session continuing 14, AI Voice Concierge — a real,
  production-ready live phone agent, built end to end after the user shared
  a competitor ad)**: User shared an ElevenLabs "Voice Agents With Emotional
  Intelligence" Instagram ad and asked whether the idea fits DubaiVal.
  Researched (live web search, since accurate current pricing/API shape
  matters more here than a guess) before proposing anything: real
  ElevenLabs Conversational AI pricing (Free 15min up to Business 12,375min/
  month, $0.08/min overage), confirmed their platform supports webhook
  "tools" mid-conversation (the exact mechanism needed to ground answers in
  real DubaiVal data and save real leads), and confirmed Twilio sells UAE
  geographic numbers (inbound-only, gated behind a Regulatory Bundle KYC
  step). Presented a phased build recommendation; user's response was
  direct: build it now, full production-ready (not a mockup), pricing isn't
  a blocker since agents pay for their own usage, company-document/trade-
  license work (needed for Meta too) comes later, and — explicitly — use
  this project's own audit-then-fix methodology to verify it afterward.
  1. **Architecture, chosen to reuse rather than duplicate**: ElevenLabs'
     own Conversational AI platform owns the entire real-time speech
     pipeline (STT/LLM/TTS) — no custom audio-streaming code was written.
     ONE shared ElevenLabs Agent serves every real estate agent's own phone
     number; a new conversation-initiation webhook
     (`api/inbox.js action=voice-init`) resolves WHICH agent's number was
     dialed and returns `dynamic_variables`
     (`agentId`/`agentName`/`callerPhone`/`creditsAvailable`) plus a
     personalized greeting via `conversation_config_override.agent
     .first_message` — confirmed this exact request/response shape and the
     `t={ts},v0={hmac}` webhook-signature format (30-min window, same
     general scheme as Stripe's, just a different field name) against
     ElevenLabs' own documentation before writing the verification code.
  2. **The 2 in-call tools are the EXISTING endpoints, not new ones**:
     `lookup_market_knowledge` is registered directly at the already-public
     `api/knowledge-query.js` (zero new code); `save_lead` is registered at
     `api/chiefs-embed.js?action=concierge-save`, extended with one new
     `source` param (`"voice_call"`, allowlisted against the pre-existing
     default `"livechat"` so an unrecognized value can never be injected
     raw) — the exact same validated, rate-limited, service-role write path
     the text AI Concierge already uses, so a voice lead and a text-chat
     lead land in `chiefs_clients` through one single hardened mechanism,
     not two.
  3. **A real architectural constraint solved, not worked around**:
     verifying ElevenLabs' post-call webhook signature needs the EXACT raw
     request bytes (HMAC over `{timestamp}.{rawBody}`), but `api/inbox.js`
     already has ~15 other actions that all assume Vercel's automatic JSON
     body-parsing. Rather than leave the new webhook unverifiable or risk
     rewriting every existing handler, the whole file's body-parser is now
     disabled once, with a single raw-body read at the top of the exported
     router that re-parses into `req.body` before dispatching — behaviorally
     identical to Vercel's own parser for every pre-existing action (all 15+
     of which needed zero changes), while giving the 2 new voice webhooks
     access to the untouched raw bytes their signature check needs.
  4. **Billing — pay-per-minute, post-paid, agent pays their own way** (per
     the user's explicit framing): `api/billing.js action=voice-checkout` —
     a one-time Stripe payment for a minute bundle (default $9.99/60min,
     same tunable-via-env-var pattern as the WhatsApp/video credit products,
     not a confirmed final price — this session could not verify Twilio's
     exact UAE per-minute telephony rate live, flagged rather than guessed
     at with false confidence). Minutes are deducted AFTER each call from
     the real ElevenLabs post-call webhook's own reported duration
     (`consume_voice_credits` RPC) — never pre-estimated, matching how a
     real usage-based telephony bill actually reconciles. A `voice_credits
     <= 0` check happens at call-START time (`voice-init`), never mid-call
     (which the webhook response can't preempt anyway) — the agent politely
     explains the line is "temporarily unavailable" for any NEW call instead.
  5. **Fallback lead-extraction safety net**: if a caller hangs up before
     the mid-call `save_lead` tool ever fires, the post-call webhook runs
     the identical lightweight Groq JSON-extraction the text AI Concierge/
     Conversation Scanner already use on the full transcript — gated by a
     new per-agent `social_credentials.voice_auto_save_extracted` toggle
     (default `true`, same "only an explicit `false` disables it" contract
     already established for the `auto_reply_*` toggles built earlier this
     session).
  6. **Client UI**: a new internal "Voice" tab inside AI Chief of Staff
     (`_renderChiefsVoiceView()` — activate/deactivate, live credit balance +
     Buy Minutes button, real call history with caller/duration/credits/
     lead-saved status) plus a compact Dashboard summary card
     (`_renderChiefsVoiceCard()`), mirroring the AI Concierge link card's
     exact visual language. Admin gets a "🎙️ AI Voice Concierge — Number
     Pool" card (add Twilio numbers bought by the operator) plus a "Create/
     Update Shared Agent" button that calls ElevenLabs' real Agent API
     directly — but rather than guess at ElevenLabs' unverifiable nested
     tool-attachment JSON schema (their exact shape for embedding webhook
     tools inside the agent-create body couldn't be confirmed live), the
     response returns the EXACT URLs to paste into ElevenLabs' own dashboard
     for the 2 tools + the 2 webhooks — the same "give the exact value,
     disclose the manual step" pattern already proven for WhatsApp/Meta
     setup in this project, rather than shipping a plausible-looking API
     call that could silently fail to attach anything.
  - **Verified per this project's own audit-then-fix methodology, as the
    user explicitly asked**: `node -c` on all 6 touched server/client files;
    a 35-check mocked-fetch Node test harness against the real
    `api/inbox.js`/`api/billing.js`/`api/chiefs-embed.js` handlers —
    confirmed voice-activate/deactivate/status all require and correctly use
    a real signed-in UUID (401 without one), an exhausted number pool
    returns a clear 409 rather than a false success, voice-init correctly
    resolves a real assigned agent + personalizes the greeting, correctly
    flags `creditsAvailable:false` with a graceful message at zero balance,
    correctly falls back to a generic persona for an unassigned number,
    correctly rejects a bad HMAC signature and accepts a real one (with a
    webhook secret configured) and degrades open (not the same as accepting
    a forged one — this only applies before the operator has set up a
    secret at all) when none is configured yet; voice-webhook correctly
    rounds 95 seconds up to 2 billed minutes, logs the real call, runs the
    fallback extraction only when no mid-call save happened AND the toggle
    is on, correctly skips extraction when the toggle is off, deduplicates a
    redelivered event without double-charging, and never processes a call
    with no resolvable agentId; both voice-admin actions correctly reject a
    wrong admin password before ever calling Supabase or ElevenLabs, and the
    agent-setup call correctly branches CREATE vs UPDATE (POST vs PATCH)
    based on whether an agent id is already stored; billing's voice-checkout
    creates a real one-time (not subscription) Stripe session and its
    webhook credits the EXACT bundle-size metadata from the purchase, not
    whatever the live env-var default happens to be later; and
    concierge-save's new `source` param is correctly persisted for
    `"voice_call"`, defaults to `"livechat"` when omitted (zero regression
    for the existing text Concierge), and falls back to `"livechat"` for any
    unrecognized value rather than passing it through raw. Re-ran the
    pre-existing OTP (9 cases) and Meta-conversion (5 cases) mocked-fetch
    suites after the body-parser refactor — both needed their mock request
    objects upgraded to real Node stream emitters (a mechanical, expected
    consequence of the refactor, not a regression) and then passed
    unchanged. A 6-check real-browser Playwright pass confirmed the
    Dashboard card renders and auto-fetches status, clicking it opens the
    real "Voice" tab with a working Activate button, activation calls the
    real endpoint and updates the UI to show the claimed number + a
    Deactivate button, the Buy Minutes button fires a real Stripe checkout
    call for the correct signed-in user, real call history renders
    correctly including the "Lead saved" badge, and the Admin Number Pool
    card renders real pool data from the server — zero console errors. A
    10-tab regression sweep (Home, Market Dashboard/Analyzer, Portfolio
    Assets, Deal Board, AI Agents, AI Chief of Staff, Social Media Studio,
    Workspace, About) confirmed zero collateral console errors from the
    body-parser refactor or any of this feature's other changes.
  - **Not built, deliberately, and disclosed rather than guessed at**: the
    exact nested JSON schema ElevenLabs' Agent-create API expects for
    attaching webhook tools inline (left as a one-time manual dashboard step
    for the operator, with the exact URLs provided); the exact Twilio UAE
    per-minute telephony rate (the $9.99/60min bundle price is a starting
    estimate, not confirmed); any outbound-calling capability (Twilio's UAE
    numbers are confirmed inbound-only, which matches this MVP's actual use
    case — an agent's line answered when they're unavailable — so this
    wasn't a gap, just a documented constraint).

- **2026-07-19 (session continuing 14, Inbox auto-reply pipeline — RAG
  grounding, a real per-channel manual/automatic toggle, and Instagram
  comment handling, all closing gaps the user surfaced by asking a direct
  question)**: User asked, specifically and pointedly, whether the existing
  email/WhatsApp/Instagram-DM-and-comment/Facebook-comment-and-message
  reply pipeline — which the user believed was already split into manual
  and automatic modes — actually auto-replies using the REAL RAG-grounded,
  real-estate-specialist AI (not plain Groq, not "an answer just to give an
  answer" like Meta's own generic auto-reply bots). Investigated
  `api/inbox.js` end to end rather than assuming, and reported 3 real,
  confirmed gaps before touching any code; user approved all 3 with
  "بله حتما با دقت و تمرکز بالا مواردی که گفتی رو درست کن" (fix them with
  high precision and focus).
  1. **No RAG grounding at all in this pipeline — confirmed, not assumed.**
     `generateAIEmailReply()`/`generateAISocialReply()` (`api/inbox.js`)
     called Groq directly with a generic hardcoded system prompt — zero
     connection to the `knowledge_base` RAG system already grounding Chat
     Agents/Compare/Personal Advisor/Portfolio Analysis/Market Index Area
     Comparison. **Fix**: new `api/_lib/rag.js` —
     `fetchKnowledgeContextServer(query, areas)`, a server-side port of
     `js/api.js`'s `fetchKnowledgeContext()` (same embed → `match_knowledge`
     RPC → `"- title: content"` formatting convention, capped at 8 results,
     degrades to `""` on any failure so grounding is always best-effort,
     never blocking). Both reply generators now build a query from the
     inbound subject/message text, fetch real grounding context, and — when
     found — append it to the system prompt using the exact same
     "Relevant up-to-date Dubai real estate knowledge... ignore if
     irrelevant" framing `askAI()` already uses client-side, plus a new
     shared `REPLY_BASE_PERSONA` string explicitly instructing the model to
     answer with "the tone, precision, and confidence of an experienced
     Dubai property consultant — never a flat, generic customer-service
     reply," directly addressing the user's own framing of the problem.
  2. **No real manual/automatic toggle existed anywhere in this specific
     pipeline — confirmed via a full read, not assumed either way.** The
     ONLY automation toggle that existed anywhere in the app
     (`CHIEFS_AUTOMATION`, `js/chiefs.js`) governs a completely different
     system — the AI Chief of Staff Co-pilot's match-drafting flow — and
     has no connection to this raw webhook-driven auto-reply pipeline at
     all. **Fix**: 4 new boolean columns on `social_credentials`
     (`auto_reply_email`/`auto_reply_whatsapp`/`auto_reply_instagram`/
     `auto_reply_facebook`, new migration
     `supabase-reply-automation-toggle-schema.sql`, all default `true` —
     matches this project's established automation-first convention,
     Directive #3), stored server-side (not `localStorage`) since these
     have to be checked inside serverless webhook handlers with no browser
     access. A new shared `_autoReplyOn(val)` helper (`api/inbox.js`) treats
     any value other than an explicit `false` as enabled — a pre-migration
     row (`null`/absent) defaults to on, matching every other automation
     default in this app. Wired into all 3 real send paths:
     `handleSocialEvent()` (Instagram/Facebook DM+comment — skips AI
     generation entirely when off, but still logs the message to
     `social_inbox` with `status:"new"` so it's never lost, exactly
     matching this file's existing "manual" convention elsewhere — AI does
     nothing, a human replies from the Inbox UI), `handleWhatsAppWebhook()`
     (checked BEFORE the 24h-conversation-window/credit-consumption gate,
     so a disabled channel never spends a real credit generating a reply
     that would just be discarded), and — the most severe, independently
     discovered gap while investigating this — `handleSendReplies()` (the
     EMAIL cron), which previously had **zero per-user scoping of any kind**:
     it queried every pending email across the ENTIRE platform and
     auto-replied to all of them unconditionally, with no concept of
     per-agent control at all, worse than the social/WhatsApp pipelines
     which at least had per-user credential lookups. Fixed to select
     `user_id` (confirmed this column already exists on `email_inbox` since
     the 2026-07-16 `supabase-inbox-user-id-fix.sql` migration — not a new
     schema gap), batch-look-up each distinct user's `auto_reply_email`
     setting, and skip (leaving the row as `status:"new"` for manual reply)
     for any user who explicitly disabled it — a legacy row with no
     `user_id` at all (pre-2026-07-16 data) still processes automatically
     by default, since it can't be attributed to any specific agent's
     toggle either way.
  3. **Instagram comments were never processed at all — confirmed via a
     full read of `handleMetaWebhook()`, not assumed.** The Instagram
     branch only ever read `entry.messaging` (DMs) — unlike the Facebook
     branch immediately below it in the same function, which already
     correctly handles both `entry.messaging` (DM) AND
     `entry.changes`/`field:"feed"` (comment). A comment left on an agent's
     Instagram post had no code path processing it at all. **Fix**: the
     Instagram branch now also iterates `entry.changes`, and for
     `field==="comments"` (Instagram's own webhook shape for comment
     events, genuinely different from Facebook's `field:"feed"`) creates a
     real `handleSocialEvent(..., "instagram", "comment", ...)` call. Added
     a new `replyInstagramComment(commentId, message, token)` — Instagram's
     Graph API replies to a comment via `POST /{ig-comment-id}/replies`, a
     genuinely different endpoint shape from Facebook's
     `POST /{comment-id}/comments`, so the existing `replyFacebookComment()`
     could not be reused — wired into `handleSocialEvent()`'s existing
     send-back if/else chain alongside the other 3 platform+eventType
     combinations. A real, narrower bug caught and fixed while building
     this: the comment lookup initially tried to resolve credentials via
     the comment's own `media.id` (the post the comment was left on, not
     the connected IG account) — corrected to reuse `entry.id` (the
     IG-scoped account id, the same value the existing DM branch already
     relies on for its own lookup), since `media.id` would never match the
     `ig_id`/`fb_id` columns `findUserByPage()` actually queries against.
  - **New client-side UI**: a "Reply Automation" section added to
    `renderProfilePanel()` (`js/app.js`) — 4 toggle switches (reusing
    `js/chiefs.js`'s existing `_chToggleRow()` component for visual
    consistency with the Chiefs automation settings card), one per channel,
    each syncing immediately to `social_credentials` via the existing
    `_syncCredsToServer()`/`_syncCredsFromServer()` push/pull functions
    (`js/chat.js`, extended with the 4 new boolean fields — booleans needed
    dedicated handling distinct from the generic token-field loop, since a
    real `false` value must be distinguished from "field not set," unlike
    every other credential field in that same function which is a plain
    opaque string).
  - Verified: `node -c` on all 4 touched files; a mocked-fetch Node test
    harness against the real `api/inbox.js` handler (14 cases) — confirmed
    an Instagram DM reply now genuinely calls Jina embed + `match_knowledge`
    before Groq and the resulting system prompt contains both the real
    grounded knowledge-base content and the new specialist-persona
    instruction; confirmed a real Instagram COMMENT event is now processed
    end-to-end and correctly calls `POST .../comment_555/replies` (previously
    unreachable code); confirmed toggling Instagram off makes zero Groq
    calls, still logs the message as `status:"new"`, and never sends a
    reply; confirmed Facebook DM auto-reply is completely unaffected by the
    Instagram changes; confirmed WhatsApp toggle off skips the
    `ensure_whatsapp_window` RPC entirely (never spends a credit on a
    disabled channel); and confirmed the email cron now correctly skips an
    agent with the toggle off, still auto-replies for one with it on, and
    still processes a legacy null-`user_id` row by default — all 14 checks
    passed. A real-browser Playwright test confirmed the new "Reply
    Automation" section renders in Profile Panel with all 4 channels,
    clicking the WhatsApp toggle correctly sets `localStorage.dv_auto_
    reply_whatsapp="0"` and immediately fires a real sync call to
    `social_credentials` with `auto_reply_whatsapp:false`. A 10-tab
    regression sweep (Home, Market Dashboard/Analyzer, Portfolio Assets,
    Deal Board, AI Agents, AI Chief of Staff, Social Media Studio,
    Workspace, About) confirmed zero collateral console errors from any of
    these changes.

- **2026-07-19 (session continuing 14, AI Chief of Staff — real per-agent
  RLS lockdown closing the anonymous-fingerprint security gap flagged
  earlier the same session, plus sign-in requirement + claim-your-data
  migration flow)**: Direct follow-up to the "Security gap investigated and
  explicitly flagged, not silently patched" finding from the Concierge/
  Broadcast build earlier today — user asked for the gap to be FULLY closed,
  with complete engineering oversight of every knock-on effect needed to
  keep the tab working correctly, across every discipline relevant to
  getting this right (security architecture, backend, RLS design, UX for
  the sign-in requirement, and re-verifying every existing Chiefs feature
  still functions).
  1. **Root cause, restated precisely**: `chiefs_inventory`/`chiefs_clients`/
     `chiefs_matches`/`chiefs_pipeline` RLS was `FOR ALL TO anon,
     authenticated USING (true)` by original design — an agent could use the
     whole tab with zero sign-in via a per-browser localStorage fingerprint
     (`_chiefsId()`). This meant ANY caller who already knew or guessed an
     `agent_id` could read/write that agent's ENTIRE workspace (real client
     names/phones/emails/budgets, pocket-listing prices, deal-pipeline/
     commission data) via a direct Supabase REST call using the public anon
     key — and publishing a shareable public AI Concierge link
     (`#concierge=<agentId>`) that embeds this id in a URL meant to be
     posted publicly (Instagram bio, WhatsApp status) made that id
     materially more discoverable than before.
  2. **Real fix, not a workaround**: `supabase-chiefs-security-lockdown.sql`
     (new migration, requires manual execution — see Outstanding items)
     drops the blanket anon policies and replaces them with real per-row
     ownership (`auth.uid()::text = agent_id`, `authenticated` role only)
     on all 4 tables. One narrow, deliberate public exception: a `SELECT`-
     only policy on `chiefs_inventory` restricted to `status in
     ('available','pocket')` rows — the exact same information an agent
     would show any prospect directly, not confidential data — so the
     Concierge's read of a target agent's live inventory keeps working
     instantly client-side with zero server round-trip, while
     `chiefs_clients`/`chiefs_matches` (real PII/deal data) get zero anon
     access of any kind, not even a narrow read.
  3. **AI Chief of Staff now requires a real signed-in account** — a genuine
     architectural consequence of fixing this correctly, not a cosmetic
     change: an anonymous fingerprint identity can no longer write anything
     under the new RLS, so continuing to let the whole tab render for a
     signed-out visitor would just mean every save silently failing with no
     explanation. `_renderChiefsSignInGate()` (`js/chiefs.js`) gates
     `renderChiefs()` before any data-loading is even attempted, reusing the
     exact same "Sign In Required" pattern and copy style already
     established for Social Media Manager (`js/chat.js`
     `renderMediaStudio()`) — deliberate consistency, not a new UX pattern
     invented for this one tab.
  4. **Existing anonymous-fingerprint data is not orphaned** — the whole
     point of doing this carefully rather than just flipping a switch:
     `claim_chiefs_workspace(p_fingerprint)` (same SQL file, `SECURITY
     DEFINER`, validates the fingerprint format and requires a real
     `auth.uid()`) re-points every row owned by that fingerprint onto the
     newly-signed-in real account in one atomic call. `_chiefsClaimBannerState()`/
     `_renderChiefsClaimBanner()`/`_chiefsClaimWorkspace()` surface this
     automatically — a real signed-in agent who has a local
     `dv_chiefs_fp` value with no prior recorded claim sees a "We found data
     from a previous session on this device" banner with a one-click
     "Claim it" button (and an equally real "Dismiss" that persists the
     choice so it never nags again).
  5. **The Concierge's own write path rearchitected, not just gated** — this
     was the actual PUBLIC attack surface, and it needed a real fix, not
     just a permission check: `_conciergeTryExtractAndSave()` no longer
     touches `chiefs_clients`/`chiefs_matches` directly with the anon key at
     all (that would now correctly fail under the new RLS regardless). It
     now calls a single new server endpoint, `api/chiefs-embed.js`
     `action=concierge-save` (extended into this existing file, not a new
     one — the project is already at Vercel Hobby's 12-function ceiling) —
     rate-limited (10/min/IP), validates every field server-side (agentId/
     clientName required, at least a phone or email, all string lengths
     capped), writes via the service-role key (the same privileged-write
     pattern every other admin/system RPC in this project already uses),
     computes real matches server-side against the TARGET agent's own
     freshly-fetched inventory (a Node port of `_scoreMatch()` — never
     trusts client-supplied listing data for scoring, since a malicious
     visitor could otherwise fabricate a high-score "match" against an
     invented listing), and embeds the new client for the agent's own later
     semantic auto-match runs. This is now the ONLY thing on the entire
     platform still allowed to write into another agent's Client Memory
     Bank on their behalf — and unlike the old direct insert, every write
     through it is validated first.
  6. **Deliberate scope boundary, disclosed rather than silently expanded**:
     `_chiefsH()` (the header helper behind every ordinary Chiefs read/write
     once signed in) still reads `localStorage.dv_access_token` directly
     instead of routing through the `_chiefsValidToken()` refresh check
     built earlier this session for the 3 fire-and-forget/background call
     sites — left as-is on purpose here, since the NEW RLS resolves
     correctly either way (a stale token just produces a real Supabase auth
     error, never a wrong-owner operation), and converting every one of its
     many call sites (`chiefsLoadInventory`/`chiefsLoadClients`/
     `chiefsLoadMatches`/`chiefsLoadPipeline`/every save/delete function) to
     `await` a refreshed token is a separate, broader hardening task with
     its own real regression risk — out of scope for closing this specific
     vulnerability, flagged here rather than silently bundled in.
  - Verified: `node -c` on both touched JS files; a mocked-`fetch` Node test
    harness (9 cases) against the real `api/chiefs-embed.js` handler —
    confirmed the pre-existing `embed` action is completely unaffected by
    the new `action=` dispatcher (backward compatibility for every existing
    caller that never sends this param), `concierge-save` correctly rejects
    missing `agentId`/`clientName`/phone-and-email-both-absent with zero
    Supabase calls made, a valid submission correctly inserts the client row
    with the TARGET `agentId` (not any other identity) and phone digits
    correctly normalized, computes real matches server-side against real
    mocked inventory (a villa/JVC listing matches, an apartment/Marina
    listing correctly does not — confirming the ported `_scoreMatch` logic
    is faithful), and a failed Supabase insert surfaces a real error instead
    of a false success; a real-browser Playwright test (5 checks) confirming
    a signed-out visitor sees the real Sign-In-Required gate with ZERO
    Chiefs data-load attempted, the gate's own "SIGN IN" button opens the
    real auth modal, a signed-in session renders the full real tab
    (including the Concierge Link card) with the gate gone, a genuine
    pre-existing fingerprint correctly shows the claim banner and "Dismiss"
    correctly hides it permanently, and clicking "Claim it" fires the real
    `claim_chiefs_workspace` RPC and shows a success toast; a second
    real-browser test confirming the Concierge's actual chat flow now calls
    the new server endpoint with the correct payload (target agentId, real
    AI-extracted name/phone) instead of any direct Supabase write, and the
    UI correctly reflects the server's real response; a third confirming
    Broadcast (audited/built earlier the same session) is still fully
    functional once signed in — segment filtering, AI draft, and a real send
    run all work identically to before this hardening pass; and a 20-view
    regression sweep (12 top-level app sections + all 8 Chiefs internal
    views) run BOTH signed-out (confirming only Chiefs shows a gate, nothing
    else in the app was affected) and signed-in (confirming every Chiefs
    view still renders correctly) — zero console errors throughout.
  - **Manual step required before this is actually secure in production**:
    run `supabase-chiefs-security-lockdown.sql` in Supabase SQL Editor. Until
    it's run, the OLD permissive RLS remains live regardless of any
    client-side fix shipped here — flagged prominently in Outstanding items.

- **2026-07-19 (session continuing 14, AI Chief of Staff — Meta Ads
  conversion audit, 2 new features (Broadcast + AI Concierge) built AND
  audited to production-ready, full feature list documented)**: Direct
  follow-up to a respond.io product screenshot the user shared ("your best
  sales agent doesn't sleep") — asked to build both ideas discussed (a
  public live-chat lead-capture widget, and segment-wide broadcast
  messaging) directly into AI Chief of Staff, first auditing the Meta Ads
  conversion feedback loop built the day before with the same methodology
  used on every other tab this week, then building both new features to be
  genuinely usable tools (not mockups), auditing/testing THOSE immediately
  after, wiring every Chiefs tool together wherever relevant, and finally
  writing a complete, accurate feature list into CLAUDE.md (see the new
  "AI Chief of Staff — Complete Feature List" reference section above the
  work log) so the tab's real capabilities are documented in one place
  going forward.
  1. **Meta Ads conversion audit — 2 real bugs found and fixed**: (a) 3
     fire-and-forget/background call sites (`_chiefsRawWhatsAppSend`,
     `_chiefsReportConversion`, `chiefsTranscribeVoiceCall`) read
     `localStorage.dv_access_token` raw instead of going through the
     already-established `getValidToken()` (`js/auth.js`) refresh check —
     harmless for the plain Supabase REST calls elsewhere in this file
     (`_chiefsH()`'s RLS tolerates anon), but these 3 specifically call
     server endpoints (`whatsapp-send`, `meta-conversion`, the Whisper
     proxy) that reject an expired JWT outright. Supabase access tokens last
     ~1h; this tab's whole pitch is a background assistant that auto-drafts/
     auto-sends/auto-reports minutes-to-hours after the agent last actively
     touched the page — meaning the ad-conversion report (and the auto-send
     pipeline sharing the same bug) could silently fail after a normal
     idle period, with the agent having no way to know their session had
     quietly gone stale. New shared `_chiefsValidToken()` helper, wired into
     all 3. (b) `chiefsSendMatchMessage()` — the function BOTH the fully
     automatic auto-send path (`chiefsDraftMessage`, zero user gesture at
     all) and the manual Approve click funnel through — only ever toasted
     on SUCCESS (`if(sent)_chiefsToast(...)`); on failure (WhatsApp not
     connected, credit exhausted, or the stale-token bug above), the
     automatic path showed literally nothing, and the immediate
     `window.open(wa.me/...)` fallback attempt — fired from an async
     callback chain with no real user gesture in the automatic case — would
     be silently blocked by any modern browser, leaving the agent with zero
     indication anything needed their attention short of manually opening
     Matches and noticing a stuck "approved" (not "sent") status. Rewrote
     it to be the single source of truth for feedback either way: a real
     "✅ Sent" toast on success, or a "⚠️ Not sent automatically" toast with
     a click-driven "Open WhatsApp →" action (a genuine gesture, so it can
     reliably re-open the link even if the earlier automatic attempt was
     blocked) on failure — removed the now-redundant duplicate toast/alert
     from `chiefsDraftMessage`'s automatic branch and `chiefsApproveMatch`.
     Also fixed a smaller, related bug found while touching this: the
     shared `_chiefsToast()` helper hardcoded its action button's label as
     "View Matches →" even on the 2 client-auto-save toasts that actually
     navigate to Clients, not Matches — added an optional 5th
     `viewLabel` param (backward-compatible default), corrected both.
  2. **📣 Broadcast built** (`_renderChiefsBroadcast()`, new "Broadcast" tab)
     — the 2nd idea: filter ALL active clients by area (substring)/purpose/
     property type, optionally reference a specific pocket listing, AI-draft
     a `{name}`-templated message (`chiefsBroadcastDraft()`), then send it to
     every matching client with a phone on file via the REAL, already-
     connected WhatsApp Business API (`chiefsBroadcastSend()`) — sequential
     with a 350ms pace (never hammers the send endpoint), live progress bar,
     and a final sent/failed/skipped-no-phone summary persisted to
     `localStorage` so the last run's outcome survives navigating away.
     Deliberately does NOT offer the clipboard+wa.me fallback this file uses
     elsewhere for 1:1 sends — popping open one browser tab per broadcast
     recipient would be blocked by every modern browser at that scale, so
     the UI states plainly that WhatsApp Business API must be connected
     first (with a link to where) instead of silently attempting something
     structurally incapable of working.
  3. **🔗 AI Concierge built** — the 1st idea, a public, no-sign-in-required
     live chat widget matching respond.io's own "best sales agent doesn't
     sleep" pitch: a shareable per-agent link
     (`https://www.dubaival.com/#concierge=<agentId>`, routed in `js/app.js`'s
     `render()` as a full-page takeover with zero app shell — sidebar/tabs/
     header — since it's meant for cold prospects, not existing app users),
     grounded in that specific agent's own real, currently-available
     inventory (never invents a listing). Every exchange runs a lightweight
     AI extraction pass; once a name plus a phone or email is present, it
     saves a real `chiefs_clients` row (`source:"livechat"`) for the TARGET
     agent and immediately scores it against that agent's own inventory via
     the exact same `_scoreMatch()` the real Auto-Matching Engine uses,
     creating real match rows too. **Deliberately NOT built on
     `_chiefsAutoMatch()`/`chiefsSaveClient()`/`CHIEFS_STATE`** — all of
     those resolve the CURRENT BROWSER's own agent via `_chiefsId()`, which
     on a random visitor's phone would be a brand-new, meaningless
     fingerprint, not the real agent whose link they opened; every
     Concierge function takes the target `agentId` explicitly instead,
     keeping the whole feature unable to clobber the wrong agent's real
     workspace. A new "🔗 Your AI Concierge Link" card on the Dashboard
     (`_renderChiefsConciergeCard()`) is the agent's own discovery/copy
     mechanism — one-click copy, plus a live count of leads captured via it.
  4. **Security gap investigated and explicitly flagged, not silently
     patched**: building a PUBLIC entry point into `chiefs_clients`/
     `chiefs_inventory` surfaced that these tables' RLS is, by original
     design, `FOR ALL TO anon, authenticated USING (true)` — "allow all via
     anon key, app filters by agent_id client-side" (`supabase-chiefs-
     schema.sql`'s own comment) — so an agent can use the ENTIRE Chiefs
     workspace with zero sign-in via a per-browser fingerprint
     (`_chiefsId()`'s `localStorage` fallback). That means ANY caller who
     already knows or guesses an `agent_id` could ALREADY read/write that
     agent's entire workspace via a direct Supabase REST call — a real,
     PRE-EXISTING gap, not introduced by this session's work. Publishing a
     shareable public link that embeds an `agentId` makes that id somewhat
     more discoverable than before, which is worth the user's explicit
     attention — but tightening this to real per-agent `auth.uid()`-based
     RLS would require rethinking the anonymous-fingerprint-agent model
     this entire file is built on (an agent can currently use every Chiefs
     feature with zero sign-in at all), a bigger, separate decision than
     this task's scope. Documented in both the new feature-list section
     above and here rather than changed unilaterally mid-feature.
  5. **Wired into the rest of the tab** (the explicit "connect wherever
     relevant, verify nothing is broken/missing" ask): a client's Clients-
     tab card now shows a "🔗 AI Concierge" source badge (matching the
     existing "WhatsApp" badge convention for scanner-sourced clients) so an
     agent can immediately see where a lead came from; new AI Concierge
     leads from the last 24h now feed into BOTH the Daily Briefing's facts
     (`_chiefsComputeSignals()`'s new `newLivechatLeads`) and the Smart
     To-Do list ("New lead via AI Concierge — reach out today") — a cold
     lead reaching out overnight now proactively surfaces the next morning
     instead of requiring the agent to remember to go check Clients.
  - Verified: `node -c js/chiefs.js` and `js/app.js`; 3 dedicated real-
    browser Playwright test files covering the AI Concierge end-to-end
    (mocked Supabase/Groq — confirmed the standalone page renders with no
    app shell, a real conversation correctly auto-saves a new client for the
    TARGET agent and scores a real match against mocked inventory, and a
    genuinely fresh page load with an empty `#concierge=` hash shows the
    honest "This chat link isn't valid" state — caught and fixed a same-
    document-hash-navigation test artifact along the way, not a real app
    bug), the Broadcast tool end-to-end (mocked `whatsapp-send` returning a
    mix of success/failure — confirmed the segment filter correctly
    includes/excludes clients by status/purpose/type/area, the rendered UI's
    segment count and "Send to N Clients" button correctly count only
    clients with a phone on file, and a real send run correctly tracks 1
    sent/1 failed/1 skipped-no-phone and persists the summary), and the
    Dashboard's new Concierge card + AI Draft button (confirmed the card
    renders, correctly counts only `source:"livechat"` clients — not a
    manually-added one in the same seed data — the copy button puts the
    real link on the clipboard, and `chiefsBroadcastDraft()` returns a real
    AI-drafted message with a genuine `{name}` placeholder); a 20-view
    regression sweep (12 top-level app sections + all 8 Chiefs internal
    views, including the new Broadcast tab) confirming zero collateral
    console errors from any of this session's changes.

- **2026-07-19 (session continuing 14, design/parity audit — site vs. native
  Android app confirmed byte-for-byte in sync, plus a real toast
  safe-area bug and a real dual-source native-CSS drift, both fixed)**:
  User asked for the same review treatment on the site's/app's DESIGN, and
  separately asked to confirm every update from "yesterday until now" has
  actually landed in the native Android app too, with the site and the app
  at an equal level — a direct check on whether this project's own shipping
  pipeline (`scripts/build-www.js` → manual `cp` into
  `android/app/src/main/assets/public/`) has actually been followed
  consistently, not just trusted.
  1. **Parity confirmed with real evidence, not assumption**: diffed every
     `js/*.js` file between the source tree, `www/js/`, and
     `android/app/src/main/assets/public/js/` — byte-identical across all
     3 locations in both directions (no missing/extra files either way);
     diffed `www/index.html` against the Android copy — exact match;
     compared every `js/*.js?v=...` cache-busting version string between
     the root `index.html` and `www/index.html` — all matched exactly; and
     confirmed `android/app/version.properties`'s `VERSION_CODE` has been
     incrementing on every single recent commit (traced via
     `git log --oneline -5 -- android/app/version.properties` against
     commits 59c8e3a/05044c0/a093b40/341380f/d29c93e) — concrete,
     verifiable proof the app has genuinely been kept at the same level as
     the site on every change this week, not just today's.
  2. **Real bug found — 2 toast notifications could render partially/fully
     hidden behind the bottom tab bar on any real device**: AI Chief of
     Staff's automation-notification toast (`_chiefsToast()`, `js/chiefs.js`
     — now firing constantly given today's automation toggles default to
     on) and Social Media Manager's "Brand profile saved" toast
     (`js/chat.js`) both used a hardcoded `bottom:80px` with zero
     safe-area awareness — unlike the sibling Report Issue floating button
     (`.dv-report-fab`), already correctly fixed in an earlier session to
     respect `env(safe-area-inset-bottom)`. Confirmed with direct math
     before fixing: the bottom tab bar's own top edge sits at
     `8px + safe-area-inset-bottom + 64px` from the viewport bottom, while
     the toast's bottom edge sat at a fixed 80px — on any device where the
     real inset exceeds ~8px (the norm for modern Android gesture-nav
     phones, and non-zero on iPhone Safari too, meaning this could affect
     mobile website visitors, not just the native app), the toast would
     render behind the tab bar. **Fix**: new shared `.dv-toast-safe-bottom`
     class (mirrors the existing `.dv-report-fab` pattern exactly) applied
     to both toast elements, with `bottom:calc(80px + env(safe-area-inset-
     bottom))!important` added to the native CSS.
  3. **Real architectural fragility found and partially remediated while
     fixing #2**: the native-app-only CSS overrides exist in TWO
     independently hand-maintained locations — a static injection block in
     `scripts/build-www.js` (baked into every build) and a separate
     runtime-detection IIFE embedded directly in `index.html` itself (only
     activates when `window.Capacitor.isNativePlatform()` is true). These
     had ALREADY drifted apart before this session touched them: the
     `.dv-report-fab` safe-area rule and an entire
     `@media(min-width:769px){...}` tablet-lockout block (forces mobile
     layout even on a tablet-sized native WebView) existed ONLY in the
     `index.html` runtime copy, missing entirely from the
     `scripts/build-www.js` static copy — meaning every Android build
     produced by that script was silently missing both rules. Added both
     missing rules to `scripts/build-www.js` (bringing it back in sync with
     `index.html`), then added the new `.dv-toast-safe-bottom` rule to BOTH
     copies together so they don't drift further apart from this fix
     itself, with an explanatory comment flagging the dual-maintenance
     fragility for whichever future session next touches native-only CSS.
  - **Screenshot review**: captured and reviewed 5 real-browser-rendered
    views of the native (`www/`) build at a 393×852 mobile viewport (Home,
    About, AI Chief of Staff Dashboard, AI Chief of Staff Inventory, Deal
    Board Post Listing) — all 5 showed the onboarding tour's Welcome
    overlay (expected first-visit behavior in a fresh browser profile with
    no `dv_tour_done` flag set, confirmed consistent across every single
    view rather than specific to one tab) and otherwise clean, consistent
    layout with no further visible design defects; the Report Issue FAB
    appearing mid-page in these captures is a known Playwright
    full-page-screenshot artifact for `position:fixed` elements (the
    button is genuinely fixed to the viewport bottom in real browsing —
    full-page capture mode expands the viewport to the page's full height
    before shooting, so a fixed-bottom element renders at its computed
    position against that expanded height instead of the visible viewport),
    not a real layout bug.
  - Verified: `node -c` on `scripts/build-www.js`; a Playwright test against
    the rebuilt `www/` confirming `_chiefsToast()` creates its container
    with the new `dv-toast-safe-bottom` class, and that the actual shipped
    `<style id="cap-native-css">` stylesheet (the literal CSS the Android
    app ships with) contains both the class and the correct
    `calc(80px + env(safe-area-inset-bottom))` rule; a direct `grep` diff
    confirming all 3 previously-drifted rules (`.dv-report-fab`'s safe-area
    rule, the tablet-lockout media query, and the new toast rule) now
    appear identically in both `scripts/build-www.js` and `index.html`; and
    a full `node scripts/build-www.js` rebuild + `diff -rq` sweep across
    `js/` → `www/js/` → `android/.../public/js/` confirming zero drift
    after shipping. **Not independently verified on a real physical device**
    — this sandboxed Chromium environment cannot simulate a nonzero
    `env(safe-area-inset-bottom)` value, so the fix was confirmed
    structurally (the correct CSS rule reaches the correct element in the
    correct shipped stylesheet) rather than visually on-device; a live
    check on a real notched/gesture-nav Android phone is the one remaining
    step.

- **2026-07-19 (session continuing 14, RAG Knowledge Base audit — a
  confirmed-by-documented-PostgREST-behavior upsert bug undermining the
  "gets smarter over time" promise, plus a real 5x redundant-embedding
  inefficiency)**: User asked for the same review treatment on the RAG
  system (`api/knowledge-query.js`, `api/proxy-news.js`,
  `api/refresh-market-data.js`, `api/_lib/embeddings.js`, `js/api.js`'s
  `askAI()`/`fetchKnowledgeContext()`, plus the SQL schema files and every
  grounded call site). Cross-checked all ~19 real (non-comment) `askAI()`
  call sites across the whole app — confirmed 16 are correctly grounded and
  the remaining 3 (the reusable Smart Bar, Analyzer's AI Smart Search, and
  Off-Plan's paste-and-extract parser) are legitimately ungrounded
  structured-extraction tasks, not knowledge questions — matching what
  earlier sessions already documented, no drift found there. Found and
  fixed 2 real issues in the backend pipeline itself:
  1. **A confirmed, high-confidence upsert bug undermining the whole
     "re-injecting the same fact updates it in place" promise.** All 4
     `knowledge_base` INSERT call sites (`proxy-news.js`'s news ingestion,
     `refresh-market-data.js`'s market-snapshot AND forecast-accuracy
     ingestion, `knowledge-query.js`'s admin research-note injection) send
     `Prefer: resolution=merge-duplicates` but never include an
     `on_conflict=` query parameter. Per PostgREST's documented upsert
     behavior, without that parameter the ON CONFLICT target defaults to
     the table's PRIMARY KEY — here, `id` (an auto-generated identity
     column that's always fresh on insert and therefore never actually
     conflicts) — while the table's REAL dedup key is a separate
     `unique(source_type, source_url)` constraint
     (`supabase-knowledge-base-schema.sql`) that was never being targeted
     at all. This means a genuine duplicate (source_type, source_url) pair
     — the exact scenario the Research Injection feature's own code comment
     explicitly promises to handle ("re-injecting the same research note
     updates it in place instead of accumulating duplicates") — would hit
     that untargeted unique constraint as a real, unhandled 23505 violation
     and fail the WHOLE batch insert, not just the duplicate row. For
     `proxy-news.js` specifically this is worse than a one-off: its
     in-memory duplicate-guard (`_ingestedLinks`) only survives within one
     warm serverless instance, so a cold start re-processing even a single
     previously-seen article would silently fail to ingest that entire
     batch of otherwise-brand-new articles too (caught by the function's
     own `catch(e){}`, so it would never surface as a visible error — just
     a knowledge base quietly falling behind). **Fix**: added
     `?on_conflict=source_type,source_url` to all 4 insert URLs — a
     no-regret change either way (if PostgREST's default already handled
     this correctly, explicitly naming the same columns changes nothing).
  2. **A real, quantifiable inefficiency**: `fetchKnowledgeContext()`
     (`js/api.js`), when grounding against multiple areas at once (the
     Compare tab, Personal Advisor, Portfolio AI Analysis, and Area
     Comparison in Market Index all do this routinely, passing up to 5
     areas), made one FULL round-trip per area — including a completely
     redundant fresh embedding call for the exact same query text each
     time, since the embedding never actually depends on which area is
     being filtered. A single grounded AI call across 5 areas was
     therefore paying for 5x the embedding-API cost (Jina/Gemini) it
     needed to. **Fix**: `api/knowledge-query.js` now accepts an optional
     `areas` array (alongside the existing single `area` string, kept
     unchanged for backward compatibility) — embeds the query ONCE
     server-side, then fans that same vector out across one
     `match_knowledge()` RPC call per area in parallel, merging and
     deduping by row id before returning. `fetchKnowledgeContext()` was
     simplified to a single request (removing the now-unnecessary
     `_fetchKnowledgeContextOne` helper entirely) — down from up to 5
     round-trips to exactly 1 for every multi-area grounded call.
  - **Also checked and confirmed correct, no changes needed**: the
    recency-weighted `match_knowledge()` RPC math (85% similarity / 15%
    linear decay over 180 days) computes correctly; both `?action=
    forecast-audit` and `?action=portfolio-digest` crons are correctly
    registered in `vercel.json` and their ingestion/pruning functions are
    genuinely wired into the reachable code path (not dead code, unlike
    the "docs" pipeline-stage bug found in the prior AI Chief of Staff
    audit); all 4 backend files correctly use `embeddings.hasProvider()`
    rather than checking a specific env var, so a Jina-only setup isn't
    silently treated as unconfigured (the exact bug already fixed once in
    an earlier session — confirmed it hasn't regressed).
  - **Investigated, deliberately not changed — genuinely inconsequential**:
    the recency formula's `greatest(0, 1 - ...)` clamps the LOW end
    (a very old row can't go negative) but has no matching `least(1, ...)`
    on the high end, so a row whose `published_at` is somehow in the
    future (server clock skew on an upstream RSS/GDELT feed, the only
    plausible source — every other insert path uses the server's own
    `new Date()`) would get a recency score slightly above 1. Not worth a
    defensive clamp: this is purely a ranking WEIGHT with no crash/security
    implication, the scenario is already extremely rare, and every other
    insert path in this codebase can never trigger it.
  - Verified: `node -c` on all 3 touched backend files; a mocked-fetch Node
    test harness against the real `api/knowledge-query.js` handler
    (7 checks) — single-area querying is completely unaffected (1 embed
    call, 1 RPC call), multi-area querying now correctly makes exactly 1
    embed call and fans out N RPC calls with correct id-based dedup
    (verified with a shared row appearing across all areas plus one
    area-specific row per area), and the research-note ingest path's real
    INSERT request URL now includes `on_conflict=source_type,source_url`;
    a source-scan confirming both `refresh-market-data.js` insert sites and
    `proxy-news.js`'s insert site all carry the same fix; and a real-browser
    Playwright test confirming `fetchKnowledgeContext()` now makes exactly
    1 network request for a 3-area grounded call (previously would have
    been 3), correctly falls back to the existing single-`area`/no-area
    request shapes for backward compatibility, and correctly builds context
    text from the merged response — plus a 12-tab regression sweep
    confirming zero collateral console errors.

- **2026-07-19 (session continuing 14, AI Chief of Staff audit — a critical
  silent data-corruption bug, a genuine crash bug, an unreachable pipeline
  stage, and a false "import from a URL" promise replaced with a real
  working feature)**: User asked for the identical review treatment on AI
  Chief of Staff, explicitly restating the product vision: this tab should
  be "یک دستیار فراتر از هوش مصنوعی... با ضریب هوشی و دقت چندبرابر یک
  انسان" — an assistant beyond AI, an automatic human-like robot with
  multiples of human accuracy. Read the full 2,435-line `js/chiefs.js`
  end to end. Found and fixed 6 real issues, several severe:
  1. **CRITICAL — silent data corruption in Property Inventory's Add
     Listing form.** The form-building loop for Area/Building/Purpose/Type/
     Bedrooms/Status attached ONE shared `"input"` listener to every field
     assuming it was always the raw Building `<input>` (`f.building=this.
     value`) — but native `<select>` elements (Purpose/Type/Bedrooms/
     Status) also fire `input` events per the HTML spec, so picking ANY of
     those 4 dropdowns silently overwrote `f.building` with THAT dropdown's
     own value (e.g. selecting "villa" in Type set `f.building="villa"`)
     while the visible Building text box kept showing the correct name —
     the agent would see "Marina Gate 1" on screen but the app would
     actually save "villa" as the building name, with zero visible error.
     Confirmed live via a Playwright test: seeded "Marina Gate 1," changed
     Type/Status/Purpose, and watched the real state variable corrupt to
     whatever was last selected. **Fix**: the Building input now gets its
     own dedicated element + listener (matching the `inp()` pattern already
     used correctly everywhere else in this same file, e.g. Contact Name/
     Phone), and the loop no longer attaches anything to the other fields
     (their own `mkSelect()`/`mkAuto()` construction already wires their
     own correct `onChange` internally — the blanket listener was 100%
     redundant for them and actively harmful).
  2. **A genuine crash, confirmed live** in the AI Chief Co-pilot's "Save to
     Client Memory" button: `chiefsCopilotSaveClient()` built
     `areas_wanted` via `(n.areas||[]).join(", ")` — a plain STRING — but
     every other consumer of `cliForm.areas_wanted` (the tag-chip UI,
     `chiefsSaveClient()`'s `.length` check, `chiefsEditClient()`) expects a
     real ARRAY. The moment the AI successfully extracted at least one area
     from an inbound message (a completely ordinary, common case, not an
     edge case) and the agent clicked Save, the Client form's own render
     threw `"f.areas_wanted.forEach is not a function"` and broke — one of
     this tab's most core, frequently-used actions (saving a lead from an
     inbound Instagram/Facebook/email/WhatsApp message) crashed exactly
     when the AI had done its job well. **Fix**: built as a real array,
     matching `chiefsScannerApply()`'s already-correct shape. Found and
     fixed a second, related vocabulary-drift bug in the same flow while
     verifying it: the Co-pilot's OWN AI-extraction system prompt asked for
     bare digit beds ("1","2","3"...) while the Conversation Scanner's
     separate extraction prompt (feeding the SAME client form) correctly
     asks for the "N BR" format the form's own dropdown actually uses — so
     a Co-pilot-extracted "2" silently mismatched every option and the
     pre-filled Beds Wanted dropdown showed the wrong default instead of
     what the AI actually found. Fixed at the root by aligning the Co-
     pilot's prompt to the same "Studio/1 BR/2 BR/.../5+ BR" format (safe
     for the existing `parseInt()`-based rule-scoring fallback either way),
     plus the one downstream display line that assumed the old bare-digit
     format.
  3. **An unreachable pipeline stage**: "Docs" is a real, defined deal
     stage (its own color in `_stageColor()`, its own grouped Kanban
     section in the board) — but the "Move Stage" button row inside an
     expanded deal card used a hand-duplicated, drifted copy of the stage
     list that silently OMITTED "docs" — so once shipped, no deal could
     ever be moved into (or out of) the Docs stage via the UI at all,
     confirmed via a live test. **Fix**: that button row now reuses the
     single real `STAGES` array directly instead of a second, driftable
     copy.
  4. **A confirmed vocabulary-drift bug**: the Client requirement form's
     "Type" dropdown only offered apartment/villa/townhouse — missing
     "penthouse," which the Inventory form's own Type dropdown DOES offer
     — so a client wanting a penthouse specifically could never express
     that preference, and could never earn `_scoreMatch()`'s type-match
     bonus against a real penthouse listing. Fixed to match.
  5. **Wired a real automation inconsistency into the standing per-process
     toggle model this file itself documents as its own architecture
     rule**: the Co-pilot's "Save to Client Memory" button ALWAYS required
     opening the form for a second manual submit, regardless of the
     `autoSaveExtracted` toggle — even though the Conversation Scanner's
     own equivalent action already respects that exact toggle for the
     identical "extracted → Client Memory Bank" step. Now genuinely
     automation-first per the toggle: auto-saves straight to the Client
     Memory Bank (with a toast) when the agent hasn't turned this off, only
     falling back to the manual-review form when they have.
  6. **A false, dead promise replaced with a real, working feature**: the
     Property Inventory empty state said "Add your first pocket listing or
     import from a URL" — no URL-import feature existed anywhere in this
     file (confirmed via a full grep). Rather than just soften the wording,
     built the missing capability using the same proven "Paste & Extract"
     technique already shipped for client requirements: a new
     "📋 Paste & Extract" button + `chiefsScanListing()` (Groq JSON
     extraction of building/area/purpose/type/beds/price/size/floor/view/
     furnished/contact from a pasted WhatsApp message, listing-site export,
     or agent notes) + `chiefsListingScannerApply()` (pre-fills the real
     Add Listing form for one manual review before saving — deliberately
     review-first, not auto-save, since a wrong price/building silently
     committed here would directly undermine this app's own valuation-
     accuracy claims once matched and quoted to a client).
  - Verified: `node -c js/chiefs.js`; a real-browser Playwright test suite
    (7 cases) confirming the Building field survives Purpose/Type/Status
    dropdown changes (previously corrupted to whatever was last selected),
    the "Docs" Move Stage button is now present and clickable, the Client
    Type dropdown now includes penthouse, `chiefsCopilotSaveClient()` no
    longer throws and produces a real array for extracted areas plus the
    correctly-formatted beds value in manual-review mode, the auto-save
    path (mocked `chiefs_clients` POST) completes and closes the overlay
    without opening the form, the false "import from a URL" text is gone
    and the real "Paste & Extract" button renders in its place, and a
    mocked-Groq end-to-end run of the new listing scanner correctly
    extracts and pre-fills a real building/area/price into the actual
    Inventory form; plus a 7-Chiefs-view + 10-other-tab regression sweep —
    zero console errors throughout.

- **2026-07-19 (session continuing 14, About page audit — 7 real stale-stat/
  false-claim bugs found and fixed, same review methodology as every prior
  tab audit this week)**: User asked for the identical treatment on About:
  "همین مدل بررسی رو و طبق روش بررسی هایی که تا اینجا انجام دادیم برای about
  انجام بده". Read the full `renderAbout()`/`renderApiDocs()` (`js/about.js`,
  592 lines) and cross-checked every numeric claim against the REAL live
  data (`DB`/`AREAS`/`AREAS_COM`/`AREAS_LAND`/`METRO_STATIONS`/
  `TRAM_STATIONS`/`KEY_POIS`, loaded via a Node vm harness, not eyeballed)
  rather than trusting the page's own copy. Found and fixed 7 real issues:
  1. **"348 Areas Covered" / "348 area benchmarks" (2 places) — stale,
     really 347.** Confirmed via `Object.keys(AREAS).length===347` — this is
     the exact same "348 areas" stale-stat bug already found and fixed once
     in the Workspace audit (2026-07-18, that session's own note explicitly
     said it was "the last place in the entire codebase still saying '348
     areas'" — that grep evidently missed this page). A 3rd, lower-severity
     instance was found inside the API Docs' own fictional
     `/api/market-index` example JSON response (`"total_areas": 348`) — also
     corrected for consistency, since this same page now correctly says 347
     everywhere else.
  2. **"11,400+ Properties Tracked" — stale/understated, real total is
     11,500+.** Confirmed via `9,226 residential + 1,914 commercial + 428
     land = 11,568`, which is exactly the "11,500+" figure this project's
     own `index.html` meta tags and `manifest.json` already use consistently
     everywhere else — the About page was the one place still showing a
     different, lower number.
  3. **"49 commercial area benchmarks" — wrong, real count is 54.** Confirmed
     via `Object.keys(AREAS_COM).length===54` (the actual object
     `computeCommercialValuation()` reads from, `js/valuation.js`).
  4. **"111 land area benchmarks" / "Live — Full Land Coverage, 111 Areas" —
     off by one, real count is 112.** Confirmed via
     `Object.keys(AREAS_LAND).length===112`.
  5. **A false "Live" claim in the Platform Roadmap**: Phase 2 ("Commercial
     Property Valuation") is marked `status:"Live"` with all 7 of its bullet
     items presented as already-shipped — but one of them, "Commercial deal
     network for brokers," is not real. Confirmed via a full grep of
     `js/deals.js` (the OFM Deal Board system) for any
     Office/Retail/Warehouse/Shop/commercial category — zero matches; the
     Bedrooms/Property-Type vocabulary there only ever distinguishes
     apartment vs. villa, never commercial. A broker reading this page would
     reasonably believe they can already post/browse commercial deals on the
     Deal Board — they cannot. Removed the false bullet from Phase 2's item
     list rather than fabricating a new "Planned" promise elsewhere; the
     other 6 items in that same phase were individually re-verified against
     `computeCommercialValuation()` and are all real (sub-type-specific PSF
     adjustment, tiered confidence scoring by data layer, area
     transaction/avg-price fields) — so only this one bullet needed removing,
     not the whole phase.
  6. **A real, confirmed one-way-toggle bug**: `window._showApiDocs` is set
     to `true` by the "API Documentation →" button (`apiBtn`'s click
     handler) but was NEVER set back to `false` anywhere in the codebase
     (confirmed via a full grep — only 2 references existed in the entire
     app, both in this file, neither resetting it) — once a user clicked
     through to the API docs, the entire lengthy section (endpoints,
     pricing, request form) stayed permanently appended on every re-render
     of the About page for the rest of the session, with literally no way
     to collapse it short of a full page reload. Added a real "✕ Close"
     button to the API docs header that flips the flag back and re-renders.
  7. **A stale, about-to-be-embarrassing hardcoded date**: every API
     endpoint card showed a "Coming Q3 2026" badge — but today's date is
     2026-07-19, already inside Q3 2026, so "coming" no longer reads as a
     future promise, it reads as a broken one. Same class of hardcoded-
     future-date-becomes-past bug this project has fixed multiple times
     elsewhere (AI prompt dates, market-narrative text) — changed to a
     plain, non-date-specific "Coming Soon" badge across all 4 endpoints
     (one shared string, one edit).
  - **Also fixed, lower severity**: the "Interactive Map" feature card in
    "What We Do" only described 5 of the map's real 7 metrics (growth,
    yield, price, liquidity, location) — omitting "Investment Score" (the
    map's actual DEFAULT metric since the 2026-07-13 redesign, confirmed via
    `DV_MAP_METRICS` in `js/map.js`) and "Turnover" entirely. Updated the
    description to lead with Investment Score and include all 7.
  - **Checked and confirmed NOT stale** (verified with real numbers before
    leaving alone): "56 metro stations, 11 tram stops, 30+ key POIs" (exact
    matches: `METRO_STATIONS.length===56`, `TRAM_STATIONS.length===11`,
    `KEY_POIS.length===30`); "Geographic premium from -3% to +8%" (exact
    match against `computeGeoScore()`'s real `locationPremium` range,
     `js/data-residential.js`).
  - Verified: `node -c js/about.js`; a Node vm harness independently loading
    `js/data-residential.js`/`js/data-commercial.js` and computing every
    real count used above (not trusting the page's own copy for any of
    them); a real-browser Playwright test confirming every corrected figure
    now renders in the live DOM and every stale one is fully gone (348/
    11,400+/49/111/"Q3 2026"/the false commercial-deal-network bullet all
    absent), confirming the API Docs "✕ Close" button genuinely collapses
    the section on click (previously stuck open permanently — the exact bug
    being fixed) and correctly resets `window._showApiDocs` to `false`; and
    a 10-tab regression sweep (Home, Market Dashboard/Analyzer, Portfolio
    Assets, Deal Board, AI Agents, Social Media Studio, Workspace, Reports,
    About) confirming zero collateral console errors.

- **2026-07-18 (session continuing 14, Deal Board — villa bed-count
  granularity fixed, with backward compatibility for live matching data)**:
  Direct follow-up, same conversation — right after the Deal Board audit
  below flagged (but deliberately did not fix) the villa/townhouse
  bed-count gap, the user asked for it to be fixed properly, explicitly
  requiring that matching itself must not break as a result: "مورد مربوط
  به ویلا را فیکس کن و اگر مچینگ شکست، شکست مچینگ را هم فیکس کن... تا
  اصول و رویه این بخش درست عمل کند".
  1. **Real bed counts for villas/townhouses**: the single flat "Villa"
     option in both Post Listing (Step 3) and Post Request (Step 2)'s
     shared Bedrooms dropdown was replaced with 5 granular options —
     "3/4/5/6/7+ BR Villa/TH" — matching the exact bed-count range the
     Analyzer's own villa dropdown already uses (`js/market.js`). Both
     forms now build this list from one new shared `OFM_BEDS_OPTIONS`
     array so they can never drift apart on this vocabulary again.
  2. **Matching made backward-compatible, not just "fixed forward"**: a
     naive strict-equality change would have silently stopped ALL existing
     "Villa"-labeled listings/requests already live in Supabase from ever
     matching anything newly submitted with the new vocabulary — the exact
     "matching breaks" risk the user explicitly asked to guard against.
     New `_ofmBedsCompatible(a,b)` treats the legacy bare "Villa" value as
     a wildcard matching ANY of the new granular villa bed counts (and vice
     versa), while two DIFFERENT specific villa bed counts (e.g. "3 BR
     Villa" vs "5 BR Villa") now correctly do NOT match — closing the real
     bug (a 7-bedroom mansion no longer scores a meaningless "exact bed
     match" against a search for a compact 3-bedroom townhouse) without
     discarding a single existing match. `_ofmScoreMatch()` now calls this
     helper instead of the old bare `===` check.
  3. **A second, related bug found and fixed while wiring this in**: OFM
     listings' AVM auto-valuation (`_ofmSubmitListing()`) has ALWAYS
     computed every listing — including real villas — as an apartment,
     since its `propCategory` check read `f.propType`, a field NO control
     anywhere in this form ever actually sets (it only ever initializes to
     `"apartment"` and is never touched again). This directly violates this
     file's own Directive #2 (max 3% deviation) for every villa listing's
     auto-valuation, understating its true value the same way the
     already-fixed Quick Check villa-sizing bug did. **Fix**: villa
     detection now derives from the real Bedrooms selection instead
     (`_ofmIsVillaBeds(f.beds)`) for both the stored `prop_type` and the
     `computeValuation()` call's `propCategory`. Since `computeValuation()`
     expects a plain "N BR" string (`js/valuation.js`'s own `_BEDS_NUM_MAP`
     has no "Villa"-suffixed keys), the suffix is stripped before that call
     only (e.g. "4 BR Villa" → "4 BR" for the valuation engine, while the
     full "4 BR Villa" string is still what's stored/matched on) — a legacy
     bare "Villa" (no bed count) falls back to "4 BR", this app's own
     established mid-range villa default. `js/valuation.js` itself was
     deliberately NOT touched, keeping this fix entirely inside
     `js/deals.js`.
  - Verified: `node -c js/deals.js`; a Node/Playwright test (8 cases)
    confirming `_ofmBedsCompatible()`'s exact/legacy-wildcard/real-mismatch
    behavior for both apartments and villas; a direct `_ofmScoreMatch()`
    test confirming a legacy "Villa" listing correctly matches a new
    "4 BR Villa" request at full score (100), confirming two different
    specific villa bed counts (3BR vs 5BR) correctly produce NO match
    (`null` — the exact bug being fixed), confirming a villa still never
    matches a plain apartment request, and confirming ordinary apartment-
    to-apartment matching is completely unaffected; a mocked-
    `computeValuation`/`fetch` test confirming `_ofmSubmitListing()` now
    correctly passes `propCategory:"villa"`/`beds:"4 BR"` for both a new
    granular villa selection and a legacy bare "Villa" value (previously
    always `"apartment"` regardless), while a plain "3 BR" apartment
    listing is completely unaffected; a real-browser Playwright test
    confirming both the Post Listing and Post Request forms render all 5
    new villa options correctly; and a re-run of the network-error-
    recovery tests from the audit below (all still passing, zero
    regressions) plus a 13-tab regression sweep — zero console errors
    throughout.

- **2026-07-18 (session continuing 14, Deal Board / OFM audit — buttons
  could freeze permanently on a network hiccup, plus a flagged-not-fixed
  villa bed-count granularity gap)**: Direct continuation, same
  conversation — right after the Off-Plan pass above, the user asked for
  the same treatment on Deal Board: "بعد از off plan همین بررسی رو برای
  deal board هم انجام بده". Read `js/deals.js` (2,491 lines — the full
  OFM blind-matching system: matching engine, Post Listing/Post Request
  forms, My Listings/My Requests, the 9-stage Match View pipeline with
  chat/media, Agent Hub, and the Admin Dashboard's referral/video/document/
  report-review sections) end to end, cross-checking every RPC against
  `supabase-ofm-rls-lockdown.sql`/`supabase-ofm-trust-safety.sql`. Found and
  fixed the most impactful bug of this whole string of same-day audits:
  1. **Every core match-pipeline action — Accept/Decline a match, advance
     the pipeline stage, send a chat message — could freeze its own button
     PERMANENTLY on a genuine network error, with no way to recover short
     of a full page reload.** `_ofmApproveMatch()`/`_ofmRejectMatch()`/
     `_ofmAdvanceStage()`/`_ofmSendMsg()` had NO try/catch at all — unlike
     `reviewListingDoc()`/`resolveReport()`/`updateVideoStatus()` further
     down this exact same file, which already correctly wrap their fetch
     calls and alert on failure. Every UI call site (My Listings' inline
     Accept/Decline, the Match View's Accept/Decline/stage-advance/Send
     buttons) follows the same pattern: disable the button, show "Approving…"/
     "Updating…"/etc., await the action, then re-enable on completion — but
     if the underlying `fetch()` itself REJECTED (a real network failure,
     very plausible on mobile, not just a bad HTTP response) rather than
     resolving, the `await` threw an uncaught exception and the
     re-enable-the-button code after it simply never ran, leaving the
     button stuck in its disabled "Approving…" state forever. Confirmed via
     a real Playwright test that aborted the network request mid-click on
     a real "Accept Match" button — before the fix, the button stayed
     disabled/stuck; after, it correctly recovers to its normal clickable
     state. A plain non-2xx response (not a network abort) also produced
     zero visible feedback in every one of these 4 functions — a seller
     clicking Accept on a bad request saw nothing happen at all, with no
     indication why. **Fix**: wrapped all 4 functions in try/catch
     (matching the established pattern from `_ofmUploadMedia`, which
     already had this right) and added a real, visible `alert()` on both
     failure paths (bad response AND thrown network error) — since every
     call site across the file funnels through these 4 shared functions,
     this one fix closes the gap everywhere it appears, not just in one
     screen.
  2. **The photo-upload loop discarded every individual upload's success/
     failure entirely** — `_ofmUploadMedia()` itself already correctly
     returns `false` on failure (network error or bad response), but the
     multi-file upload loop in the Match View never checked it:
     `for(...){await _ofmUploadMedia(...);}` — if photo 2 of 3 failed to
     upload, the loop just moved on to photo 3 with zero indication
     anything went wrong; the seller would believe all 3 photos were
     shared with the buyer when one was genuinely missing, discoverable
     only by manually counting thumbnails in the viewer afterward. **Fix**:
     the loop now tracks failures and shows a real "N of M photo(s) failed
     to upload — please try uploading them again" alert when any occur.
  - **Investigated, deliberately NOT fixed — flagged for the user's own
    product judgment**: both the Post Listing and Post Request forms use
    one shared "Bedrooms" dropdown (`Studio/1BR/2BR/3BR/4BR/5BR+/Villa`)
    where "Villa" is a single flat bucket with no actual bed-count
    captured — unlike the Analyzer's own villa bedroom dropdown elsewhere
    in this app (`js/market.js`, real `3BR/4BR/5BR/6BR/7+BR` options for
    villas). Since `_ofmScoreMatch()`'s 25-point bed-match component
    requires an EXACT string match (`listing.beds===req.beds`), every
    villa/townhouse listing scores a full, meaningless "exact bed match"
    against every villa/townhouse REQUEST regardless of actual bedroom
    count — a 7-bedroom mansion and a search for a compact 3-bedroom
    townhouse both just read "Villa" and match at full score. This is a
    real matching-quality gap specifically affecting Dubai's villa/
    townhouse segment (this app's own established `VILLA_AREAS` concept),
    but deliberately NOT changed here: `beds` is a free-text field already
    holding live production data (existing "Villa"-labeled listings/
    requests), and introducing new granular villa options would silently
    stop matching those existing rows against anything newly submitted
    with the new vocabulary — a real, live-data compatibility risk that
    needs the user's own call on migration approach (e.g. whether to
    backfill/relabel existing rows), not a unilateral schema-adjacent
    change to a system with real matches already in flight.
  - Verified: `node -c js/deals.js`; a mocked-fetch Playwright test (5
    cases) confirming all 4 match-action functions now correctly return
    `false` and show a real alert (never throw) for both a bad HTTP
    response and a genuine aborted network request, and confirming the
    media-upload loop correctly counts 3 simulated failures out of 3
    attempts; a second, real-UI Playwright test driving an actual
    rendered "Accept Match" button through a network-abort scenario,
    confirming the button correctly recovers to its normal clickable
    state afterward instead of freezing (the exact bug this fix
    addresses); and a 13-tab regression sweep confirming zero collateral
    console errors.

- **2026-07-18 (session continuing 14, Off-Plan Projects audit — a silent
  admin-action failure and a missing Notes field, plus a flagged-not-fixed
  growth-formula ambiguity)**: Direct continuation, same conversation —
  right after the Market Index pass above, the user asked for the same
  treatment on Off-Plan: "همین بررسی را در مورد off plan انجام بده". Read
  `js/offplan.js` (public tab + prediction engine) and the Admin review/
  Quick Add/Bayut-import/Developer Track Record machinery in `js/app.js`
  end to end, plus cross-checked every RPC signature against
  `supabase-offplan-schema.sql` (all matched correctly — no
  parameter-naming drift found there). Found and fixed 2 real bugs:
  1. **The single most consequential action in this whole admin section —
     Approve/Reject a pending submission — silently did nothing on
     failure, with zero indication to the admin.** `_adminReviewOffplanProject()`
     never checked the RPC's response at all (`await fetch(...)` with the
     result discarded), unlike every sibling function in this exact file
     (`_adminQuickAddOffplan`, `_adminSaveDeveloperTrackRecord`,
     `_fetchAdminOffplanPending`), which all correctly check `r.ok` and
     surface an error. A wrong admin password or a failed RPC call meant
     clicking Approve/Reject just re-fetched the (unchanged) pending list
     with no error shown — the admin would have no way to tell the
     project hadn't actually been reviewed. **Fix**: added the missing
     `r.ok` check and a real error message — but a naive version that
     unconditionally called `_fetchAdminOffplanPending()` afterward turned
     out to immediately wipe the new error message before the admin could
     ever see it, since that function resets `.error=null` the instant it
     starts; caught this via a real Playwright test asserting the error
     text actually appears in the rendered DOM (not just that the state
     variable was set for an instant) before shipping — the pending list
     now only re-fetches on a CONFIRMED success, leaving a failure's error
     message visible until the next action.
  2. **The Admin Quick Add form was missing a Notes field entirely, despite
     `ADMIN_OFFPLAN_STATE.quickAdd.notes` being a real state field already
     sent to the publish RPC, and — more importantly — a field the
     "Paste & Extract with AI" button can silently POPULATE from pasted
     text with zero UI to review it.** The reassurance shown directly above
     Quick Add ("always review before publishing, the AI only extracts
     what's explicitly in the pasted text") was untrue for this one field
     specifically — an admin had no way to see, edit, or clear whatever
     note text the AI extraction had just written in before hitting
     "Add & Publish." **Fix**: added the missing "Notes (optional)" input,
     matching the public Submit form (`js/offplan.js`), which already had
     one correctly.
  - **Investigated, deliberately NOT fixed — flagged for the user's own
    domain judgment, not silently changed**: `computeOffPlanForecast()`'s
    growth math treats `AREAS[].g[1]` as an INCREMENTAL years-1-to-3 growth
    window (divides by 2 to "annualize" it) and `g[2]` as a flat "5 years
    post-handover" rate applied on top of whatever growth already occurred
    reaching handover — but a cross-check of how this exact `g[]` array is
    used elsewhere in the app found genuinely inconsistent conventions
    across different files: `js/chat.js`'s own area-growth chart labels
    `g[0]/g[1]/g[2]` directly as "1Y"/"3Y"/"5Y" (implying CUMULATIVE growth
    from TODAY over 3 horizons), while `js/workspace.js`'s own Area
    Comparison section (fixed just yesterday in this same session) labels
    them "Growth (0-1yr)"/"Growth (1-3yr)" (implying INCREMENTAL windows) —
    a genuine, pre-existing ambiguity spanning multiple past sessions'
    work, not something unique to Off-Plan. Resolving this correctly needs
    the user's own domain judgment about what this field was originally
    intended to mean (the same "extreme caution, confirm before touching
    core growth math" posture already established for the Analyzer engine
    itself, per this file's Directive #2) — not a unilateral guess in an
    Off-Plan-scoped audit that could silently regress other, already-
    shipped features relying on the same field. Flagging here explicitly
    rather than either fixing blindly or ignoring it.
  - Verified: `node -c` on both touched files; a real-browser Playwright
    test confirming the public Off-Plan tab still renders its graceful
    pre-migration message correctly; a mocked-RPC test confirming a FAILED
    Approve now shows a real, visible "Could not approve — check the admin
    password and try again." message in the rendered DOM (previously
    silently swallowed), confirming a SUBSEQUENT successful Approve
    correctly clears that error and refreshes the pending list to empty,
    and confirming the Admin Quick Add form now has a real Notes input; and
    a 13-tab regression sweep confirming zero collateral console errors.

- **2026-07-18 (session continuing 14, Market Index audit — the tab's own
  central promise, "click any area for valuation," silently failed on an
  ordinary leftover state, plus a mislabeled comparison metric)**: Direct
  continuation, same conversation — right after the Workspace Dashboard
  pass above, the user asked for the identical treatment on Market Index:
  "همین بررسی رو برای Market index هم انجام بده". Read `renderMarketIndex()`
  end to end (`js/marketindex.js`). Found and fixed the most impactful bug
  yet in this string of same-day audits, plus 2 smaller correctness issues:
  1. **Every single "click an area for its valuation" link in this tab
     silently failed to deliver whenever `analyzerState.stage` wasn't
     already 0 — a completely ordinary, common condition, not an edge
     case.** This tab's own copy explicitly promises this ("All 347 areas
     sorted by PSF — click any area for valuation" / "Click any area for
     full valuation"), and 3 separate click paths all did the exact same
     incomplete thing: the ranking-table row click, the Favorite Areas card
     click, and the Price Heatmap row click all set
     `analyzerState.f.area=name` and navigated to Market/Analyzer — but
     never touched `analyzerState.stage`. `renderAnalyzer()` (`js/market.js`)
     only shows the FORM at `stage===0`; at `stage===2` (left over from
     ANY earlier valuation run this session, on any building, anywhere —
     not a rare state) it instead shows the STORED OLD RESULT
     (`if(analyzerState.stage===2&&analyzerState.val)return
     renderAnalyzerResult(wrap);`), completely ignoring the area that was
     just set. Confirmed via a real Playwright test that seeded a stale
     `stage=2`+fake old result, clicked each of the 3 link types, and
     observed the OLD result would have kept showing with zero visible
     indication the click did anything — before the fix. **Fix**: new
     shared `_idxGoToArea(name)` helper — sets the area AND resets
     `analyzerState.stage=0` before navigating, used by all 3 click sites
     (previously 3 separate, incomplete inline handlers). The one
     deliberately-NOT-touched link — each ranking table's generic "Get
     detailed valuation →" button at the bottom — doesn't claim to be
     area-specific in its own copy (unlike every row above it, which
     explicitly is), so it was left as a plain, unscoped navigation.
  2. **The "Sustainability" row in Advanced Area Comparison showed only
     ONE input (25% weight) of the real Sustainability Score used
     everywhere else in the app, mislabeled as the whole thing.** It read
     `GREEN_AREAS[n]` directly — but `GREEN_AREAS` is just the
     green/community component INSIDE `computeSustainabilityScore()`
     (`js/core.js`), which is actually a weighted composite of building
     grade/age (30%) + service charge efficiency (25%) + green/community
     (25%) + liquidity/DOM (20%). A user comparing areas here saw a
     "Sustainability: 90/100" figure that would disagree with the real
     Sustainability Score they'd see moments later running an actual
     valuation in that same area (e.g. Business Bay: 50 raw green score
     here vs. 65 real composite) — and the exact same raw, partial figure
     was also fed into the AI comparison prompt as "sustainability," so the
     AI's own narrative inherited the same mislabeling. **Fix**: both the
     table row and the AI-prompt summary now call the real
     `computeSustainabilityScore(null,areaName,null,AREAS[areaName],null)`
     — no specific building being compared here, so building-grade/SC
     inputs fall back to the function's own neutral defaults, but green
     score and liquidity are real, giving a genuinely comparable,
     consistent figure instead of one isolated component standing in for
     the whole thing.
  3. **Minor staleness/hygiene, fixed alongside the above**: the AI
     comparison system prompt still said "9,227 buildings" — stale by
     exactly 1 since the 2026-07-13 session removed a confirmed-bogus
     duplicate building entry elsewhere, bringing the real count to 9,226;
     corrected to match. Also swapped a stray, undocumented magic number
     (500 sqft) in the "Best Rental Value Areas" internal sort key
     (`rentPsfRatio`, never displayed to the user) for this app's one real,
     established canonical 1BR unit size (750 sqft,
     `TYPICAL_UNIT_SIZE[1]`, `js/valuation.js`) — a uniform scalar swap
     like this doesn't change today's ranking (every area scales by the
     same factor), but closes the same class of duplicated-constant drift
     risk this project has caught and fixed several times before.
  - Verified: `node -c js/marketindex.js`; a real-browser Playwright test
    seeding a stale `analyzerState.stage=2` with a fake old result, then
    clicking a real ranking-table row, a real Favorite Areas card, and a
    real Price Heatmap row — confirmed all 3 now correctly reset stage to
    0 and land on the real Analyzer FORM with the clicked area set (all 3
    would have silently shown the stale old result before the fix); a
    direct call confirming `computeSustainabilityScore(null,...)` no
    longer throws and returns a genuinely different, real composite score
    (65) vs. the old raw green-only figure (50) for Business Bay; and a
    mocked-`askAI` Playwright pass confirming the AI Verdict system prompt
    now correctly reads "9,226 buildings" and the request body embeds the
    real composite sustainability figure — zero non-network console errors,
    and a 13-tab regression sweep confirming zero collateral damage
    elsewhere.

- **2026-07-18 (session continuing 14, Workspace Dashboard audit — 6 real
  gaps found and fixed, same depth as the Reports pass)**: Direct
  continuation, same conversation — right after the deeper Reports pass
  above, the user asked for the identical treatment on "My Workspace"'s own
  dashboard mode: "همین بررسی رو برای workspace انجام بده". Read
  `renderWorkspace()`/`getMiniWidget()`/`WS_TOOLS`/`WS_PRESETS` end to end
  (`js/workspace.js`). Found and fixed 6 real issues, all in the tool
  picker/mini-widget-dashboard machinery — the earlier Reports-pass fix
  that removed the crash-prone "deals" mini-widget branch was already
  verified clean here, so this pass focused on completeness/architecture
  gaps rather than re-litigating that fix:
  1. **Stale "348 areas" stat** — `WS_TOOLS`'s "Market Index" tool
     description was the last place in the entire codebase still saying
     "348 areas" (confirmed via a full-repo grep — every other reference,
     including this exact area count elsewhere in this same file's own
     history, already reads 347, corrected in an earlier session). Fixed to
     347, and rewrote the description to describe what Market Index
     actually shows (see finding 2) rather than a generic PSF/yield blurb.
  2. **"Market Index" and "Live Dashboard" — two genuinely different
     tools — rendered byte-identical mini-widget preview content.** Both
     `wid==="market"` and `wid==="dashboard"` shared one `else if` branch
     computing the exact same avg-PSF/avg-yield/area-count aggregate, so a
     user who added BOTH tools to their custom dashboard saw two visually
     indistinguishable cards. Live Dashboard's own tab (`renderMarket()`,
     `js/market.js`) genuinely IS a plain-aggregate view (Buildings/Areas/
     Avg PSF/Avg Yield/Growth stat cards), so its mini-widget keeping that
     content is correct — but Market Index's own real value (confirmed by
     reading `renderMarketIndex()`, `js/marketindex.js`) is its RANKING
     tables (Highest Yield/Fastest Growing/Most Expensive Areas), a
     fundamentally different framing that was never reflected here. **Fix**:
     split into two real, distinct branches — `dashboard` keeps the
     aggregate; `market` now computes and shows the actual #1 area by
     yield (a genuine "top mover" teaser matching what the real tab
     displays), computed directly from `AREAS` with no new dependency.
  3. **"Opportunity Alerts" tool had zero real preview** — fell through to
     the generic "Click to open →" catch-all despite real, already-
     persisted alert criteria (`dv_alerts` in `localStorage`, the exact
     data the Alerts tab itself reads) being trivially available. Added a
     real "N alerts set" preview, same one-line-of-localStorage-reading
     effort already used for the sibling `favareas`/`saved` widgets below.
  4. **"Favorite Areas" and "Saved Searches" — real, working features with
     real, already-persisted data and already-WRITTEN preview code in
     `getMiniWidget()` (`DV_SAVED.favAreas`/`DV_SAVED.searches`,
     `js/core.js`) — were never actually offered as pickable tools at
     all.** `WS_TOOLS` (the array driving both the "Available Tools"
     picker and which widgets can ever appear on the dashboard) never
     listed `favareas`/`saved` as entries, making 2 fully-built,
     fully-working `getMiniWidget()` branches permanently dead/unreachable
     — confirmed via a full-repo grep that no other code path could ever
     add these ids to `WS_STATE.widgets` either. This is exactly the
     "are the inputs actually complete" gap the user's question was aimed
     at: the plumbing existed, the tool to reach it simply didn't. **Fix**:
     added both as real, selectable `WS_TOOLS` entries (with real icons —
     star/history — and real navigation targets: Favorite Areas → Market
     Index, where they're actually managed and starred; Saved Searches →
     Analyzer, where they're actually loaded and reused).
  5. **"Notifications" was the only mini-widget card with a real, live
     stat (unread count) that did absolutely nothing when clicked** — every
     other card either navigates somewhere real or (for anything not
     special-cased) at least honestly shows "Click to open →"; this one
     looked exactly as interactive as its neighbors but had
     `tabMap.notifications=null`, so no click listener was ever attached at
     all — a card that visually promises interactivity via a live stat but
     silently does nothing on click is a real, if subtle, broken-affordance
     bug. **Fix**: wired its click handler to `DV_NOTIF.showPanel=true;
     render();` — the exact same toggle the header bell itself uses
     (`renderNotifBell()`, `js/core.js`) — so clicking this card now
     genuinely opens the real notification dropdown instead of doing
     nothing.
  6. **A real, found-while-fixing-#4 correctness bug**: the new "Saved
     Searches" shortcut navigates to Market → Analyzer, but the "Recent &
     Saved Searches" list there only renders `if(analyzerState.stage===0)`
     (`js/market.js`) — a completely ordinary, common state for
     `analyzerState` to NOT be in, since it's a persistent global that
     stays at whatever stage (0=form/1=loading/2=result) the user last left
     it in, possibly from a much earlier, unrelated Analyzer session. A
     user who'd previously run any valuation and then came to Workspace
     would click "Saved Searches" and silently land on a stale old result
     screen instead of the searches list the card explicitly promised —
     confirmed via a real Playwright test that set `analyzerState.stage=2`
     before clicking the card and observed the list never appearing (bug
     reproduced), then confirmed fixed. **Fix**: the "saved" card's click
     handler now resets `analyzerState.stage=0` before navigating — scoped
     ONLY to this one shortcut (the general "Valuation Analyzer" tool
     deliberately still resumes whatever state was there, which is the
     correct, existing, expected behavior everywhere else this tab is
     reached — e.g. clicking a saved-search chip elsewhere intentionally
     sets `stage=2` to show its result immediately).
  - **Investigated, confirmed NOT a bug**: whether `window.PORTFOLIO_STATE`
    (read by the "Portfolio Manager" mini-widget) suffers the same
    "only populated after visiting that tab this session" gap already found
    and fixed for Personal Advisor earlier this week — confirmed it does
    NOT: `js/portfolio.js` initializes `window.PORTFOLIO_STATE` from real
    `localStorage` data in a top-level `if(!window.PORTFOLIO_STATE){...}`
    block that runs unconditionally the moment the script loads (not inside
    a render function), so it's always populated with the user's real
    portfolio from the very first page load regardless of navigation order.
  - Verified: `node -c js/workspace.js`; a real-browser Playwright test
    seeding real favorite areas/saved searches/alerts/an unread notification
    and all 10 tools onto the dashboard — confirmed `WS_TOOLS` now has 10
    entries with the "348"→"347" fix applied, confirmed the Market Index and
    Live Dashboard mini-widgets now render genuinely different content
    ("avg PSF" vs "#1 area" text both present, not just one repeated twice),
    confirmed the Alerts/Favorite Areas/Saved Searches cards all show their
    real counts, confirmed clicking the Notifications card actually flips
    `DV_NOTIF.showPanel` to `true` (previously a no-op), and confirmed
    clicking Saved Searches with a deliberately stale `analyzerState.stage=2`
    correctly resets it to `0` and navigates to Market/Analyzer (previously
    would have silently shown the stale old result instead); a second test
    clicking through all 3 real presets (Investor/Agent/Buyer — Agent
    includes "deals," the exact widget that crashed before the earlier
    Reports-pass fix) confirmed all 3 render with zero errors; and a 13-tab
    regression sweep confirming zero collateral console errors — zero
    non-network errors throughout.

- **2026-07-18 (session continuing 14, Reports — second, deeper pass:
  security/completeness/architecture audit per explicit user follow-up
  question)**: Direct continuation, same conversation — after the first
  4-bug Reports pass below, the user asked a sharper, more specific
  question: "بخش reports هم مطابق با تمام بررسی های امروز بررسی کن و ببین
  واقعا ورودی ها تمام و کمال و کامل هستند... آیا درست و واقعی کار می‌کنند
  ویا نیاز به دستورات جدید برای کار کردن طبق نام، معماری و مهندسی این تب
  دارند" — not just "find more bugs," but specifically: are the INPUTS
  genuinely complete, and does the tool actually work according to its own
  NAME/architecture/engineering. Found and fixed 4 more real issues:
  1. **Real, exploitable XSS in every generated report — the most serious
     finding**: `generateReport()` builds an HTML string and writes it
     directly via `w.document.write(h)` into a freshly-opened print window
     — but every free-text field an agent or their client can influence
     (the report's own custom Title, the agent's own Name/Company/Phone/
     RERA number, the Client Name, and the `<title>` HTML tag itself) was
     interpolated completely unescaped. Any of these fields containing a
     real HTML/script payload — plausible for Company name, RERA number, or
     a custom report Title, all free-typed with zero sanitization anywhere
     upstream — would execute as live HTML/JS the moment the report window
     opens, not just render as inert text. Confirmed via a real-browser test
     seeding `<script>`/`<img onerror>`/`<svg onload>` payloads into these
     exact fields and capturing the real HTML `generateReport()` produced
     (via a `window.open` stub) — the payloads appeared as literal, live
     tags in the captured HTML before the fix. **Fix**: added a shared
     `_wsEsc(s)` helper (standard `&`/`<`/`>`/`"`/`'` entity escaping) and
     applied it everywhere a user-controlled string is interpolated into the
     report's HTML: the `<title>` tag, the on-page `<h1>` title, the
     agent's name/company/phone/RERA line, the Client Name line, the
     Property line's building name (both the existing
     `analyzerState.f.building` value and the new Building Name field
     below), and the new Property line added in this same pass. A dedicated
     Playwright test seeding all 4 payload types into all 4 vulnerable
     fields, capturing the real generated HTML, and asserting the raw tags
     never appear unescaped (only their `&lt;`/`&gt;`-escaped forms do)
     caught a 2nd instance of the same bug mid-fix — the `<title>` tag in
     `<head>` used a separate, still-unescaped `title` variable reference
     that the first pass had missed (only the `<h1>` copy had been fixed) —
     found and corrected before shipping, not left in.
  2. **No Building Name input existed anywhere in Report Subject** — the
     ONLY way a generated report could ever reference a specific building
     (for the Sustainability Score section's `lookupBuilding()` call, or
     just naming the property in the header) was if the user happened to
     have already run a full Analyzer valuation THIS SESSION on another
     tab first — a "Custom Report Builder" that can't independently name a
     building isn't living up to its own name/architecture. **Fix**: added
     a real "Building Name (optional)" input to Report Subject (new
     `WS_STATE.reportBuilding`), using the same non-mutating
     analyzerState-fallback pattern already established for area/price;
     wired into the Sustainability section's `bData`/
     `computeSustainabilityScore()` call (previously hardcoded to
     `analyzerState.f.building` only) and displayed in the report's own
     header as a new "Property: Building Name, Area" line.
  3. **"Investment Scenario" — the section's own name promises a real
     Dubai real-estate INVESTMENT case, but only ever showed capital
     appreciation, never yield** — a glaring architecture/name mismatch for
     a market where rental yield is usually the larger, more decision-
     relevant component of total return, especially since the exact area
     yield band (`aData.y`) this section needed was ALREADY loaded in scope
     one section earlier ("marketcmp"'s own "Gross Yield" row uses the
     identical field) — the data was sitting right there, unused. **Fix**:
     added real "Cumulative Rental Income" and "Est. Total Return" columns
     to the 1/3/5-year table, computed from the area's own real yield band
     compounded over the actual holding period — no new inputs needed, uses
     data the function already had.
  4. **Repeatable-workflow gap**: an agent generating reports for MULTIPLE
     different clients/properties in one sitting had no way to clear the
     per-report subject fields (area/client/price/building/nationality)
     between reports without manually re-touching each one, while
     genuinely-persistent settings (agent's own details, section selection,
     language/color/title/logo) correctly carried over. Added a "↺ New
     Report" button next to the Report Subject header that resets only the
     5 subject fields, leaving every persistent setting untouched.
  - Verified: `node -c js/workspace.js`; a real-browser Playwright test (via
    a `window.open` stub capturing the real generated HTML) confirming all
    4 XSS payload types are correctly escaped in all vulnerable fields with
    zero raw tags surviving and zero script execution (`window.__xss*`
    flags never fired), confirming the Investment Scenario table now
    includes real, correctly-computed Cumulative Rental Income/Est. Total
    Return columns, confirming the Building Name input correctly falls back
    to a loaded Analyzer valuation's building when empty, and confirming
    "↺ New Report" clears exactly the 5 subject fields while leaving the
    agent's saved details and section selection untouched; and a 13-tab
    regression sweep (Home, Market Dashboard/Analyzer/QuickCheck, Portfolio
    ×3, Deal Board, AI Agents, AI Chief of Staff, Workspace, Reports, About)
    confirming zero collateral console errors from any of these 4 fixes.

- **2026-07-18 (session continuing 14, Reports (Custom Report Builder)
  audit — 4 real bugs found and fixed, including a report generator that
  could silently double up a section and a hard crash in a related
  Workspace Dashboard widget)**: Direct follow-up, same conversation — user
  asked for the same audit-then-fix treatment on Reports. Read the full
  `js/workspace.js` file end to end (`renderWorkspace()`/`getMiniWidget()`,
  the "My Workspace" dashboard mode this file also owns, plus
  `renderReportBuilder()`/`generateReport()`, the actual Reports tab). Found
  and fixed 4 real issues:
  1. **The Smart Text/Voice parser could silently render the same report
     section TWICE.** Four different synonym keywords ("market"/
     "comparison"/"neighborhood"/"neighbourhood") all map to the same
     `"marketcmp"` section id, and the parser pushed a match for every
     keyword found with no dedup — so a completely natural phrase like
     "market comparison report" (matching this very field's own placeholder
     text style, "valuation + market + portfolio") matched both "market"
     and "comparison" and pushed `"marketcmp"` onto the sections array
     twice. `generateReport()`'s section loop has no dedup either, so the
     generated report rendered the whole "Area & Neighborhood Comparison"
     section twice in a row — a real, easily-reproducible defect in a
     feature meant to produce a polished, client-ready document. **Fix**:
     the keyword-matching loop now checks `secs.indexOf(kwMap[kw])===-1`
     before pushing, so each section id can only be added once regardless
     of how many synonym keywords matched it.
  2. **The Report Subject "area" never auto-synced with an already-loaded
     Analyzer valuation, unlike price, which did** — `priceInp`'s displayed
     value already fell back to `analyzerState.f.price` when
     `WS_STATE.reportPrice` was empty (and `generateReport()`'s own
     `reportPrice` computation independently re-checked the same fallback),
     but the area `<select>` had no equivalent fallback anywhere, and
     `generateReport()`'s `var area=WS_STATE.reportArea;` read the raw
     field with no fallback either. So a user who'd just run the Analyzer
     for a specific building and came straight to Reports saw their price
     pre-filled but NOT their area — meaning Area Statistics/Comparison/
     Investment/Sustainability either fell back to generic market-wide top-
     movers or a stale area left over from an unrelated previous report,
     while the Valuation Summary section right above them correctly showed
     the real property — an internally inconsistent report about "your
     property" that didn't actually reflect its own area. **Fix**: mirrored
     the exact same non-mutating fallback pattern price already uses — both
     the area `<select>`'s displayed default and `generateReport()`'s own
     `area` variable now fall back to `analyzerState.f.area` whenever
     `WS_STATE.reportArea` is empty, without ever silently overwriting the
     user's own explicit choice if they've made one.
  3. **The Mortgage Estimate section's own duplicated LTV/down-payment
     formula always assumed an expat buyer, regardless of who the buyer
     actually is** — `js/mortgage.js`'s real, dedicated Mortgage Calculator
     already correctly differentiates UAE nationals (70%/80% max LTV by
     price tier) from expats (65%/75%), fixed in an earlier session — but
     this Report Builder's own separate reimplementation of the same
     formula hardcoded the expat-only tiers (`reportPrice>=5000000?65:75`)
     unconditionally, with no nationality input anywhere in the Report
     Subject fields. For a real UAE national buyer at or above AED 5M, this
     understated their true 70% borrowing power and overstated their
     required down payment by 5 percentage points (confirmed with real
     numbers: a 6M property showed a 35%/AED 2.1M down payment instead of
     the correct 30%/AED 1.8M) — the same class of duplicated-formula-drift
     risk already found and fixed once this session in the Analyzer's rent
     ladder. **Fix**: added a "Buyer: Expat / UAE National" toggle to the
     Report Subject fields (new `WS_STATE.reportNationality`, default
     `"expat"`, matching `js/mortgage.js`'s own default), and corrected the
     duplicated formula to match `js/mortgage.js`'s exactly, keyed off this
     new field — the disclaimer footer text now also correctly says "UAE
     national buyer" instead of always saying "expat buyer".
  4. **A real, separate, easily-reachable crash found while reading the
     adjacent Workspace Dashboard code this same file also owns**:
     `getMiniWidget()`'s `"deals"` (Deal Network) mini-widget branch read
     `DEAL_STATE.deals.length` completely unguarded — but `DEAL_STATE` is a
     documented backward-compat shell now that Deal Board is the OFM
     blind-matching system, and `.deals` was never actually declared on
     it. Confirmed via a real-browser test: adding "Deal Network" to a
     custom Workspace Dashboard (a completely ordinary action, right there
     in the tool picker) threw an uncaught `TypeError` and broke the app's
     entire render, not just that one widget. Since OFM listings are
     deliberately not publicly countable at all (privacy-by-design blind
     matching — there's no honest "N active deals" figure to show anymore,
     unlike the old pre-OFM Deal Board this widget was originally built
     for), the fix removes the crash-prone branch entirely rather than
     patching in a fabricated/misleading number — it now falls through to
     the same generic "Click to open →" catch-all every other
     not-specially-handled widget already uses, with a comment explaining
     why for a future session.
  - Also, defensively: `generateReport()`'s `window.open("","_blank")` had
    no null-check — if a browser/extension ever blocks this popup, `w` would
    be `null` and the very next line (`w.document.write(...)`) would throw
    instead of failing gracefully. Added a check that shows a clear "please
    allow pop-ups" alert and returns instead of crashing.
  - Verified: `node -c js/workspace.js`; a real-browser Playwright test
    confirming the exact reproduction case ("market comparison and
    investment projection please") now yields `["marketcmp","investment"]`
    with zero duplicates; confirming the area select correctly auto-selects
    a loaded Analyzer's real area (Business Bay) and the generated report's
    Area Statistics table correctly leads with that starred area instead of
    the generic top-movers fallback, even though `WS_STATE.reportArea`
    itself was never touched; confirming a UAE national buyer at AED 6M
    gets the correct AED 1,800,000 (30%) down payment in the generated
    report while an expat buyer at the same price still correctly gets AED
    2,100,000 (35%); confirming `window.open()` returning `null` shows the
    new alert instead of throwing; and a second test confirming adding
    "Deal Network" to a custom Workspace Dashboard no longer crashes and
    correctly falls through to the generic fallback text — zero console
    errors throughout. A 14-tab regression sweep (Home, Market Dashboard/
    Analyzer/QuickCheck, Portfolio, Deal Board, AI Agents, AI Chief of
    Staff, all 3 SocialMedia sub-tabs, Workspace, Reports, About) confirmed
    zero collateral regressions from any of these 4 fixes.

- **2026-07-18 (session continuing 14, AI Agents audit — one real input-loss
  bug found and fixed, extensive prompt/grounding logic confirmed already
  correct from prior sessions)**: Direct follow-up, same conversation, after
  removing the duplicate "AI Assistant" tab (see the entry directly below)
  — user asked for the same audit-then-fix treatment on Network → AI Agents
  itself. Read the full `AI_AGENTS` array (all 8 agents' system prompts:
  general/valuation/negotiation/marketing/investor/legal/leadcapture/
  outreach), `_agentVerifiedContext()`/`_agentClosingStyle()`/
  `getDubaiRealEstateBrain()`/`getBrandPrompt()`, `renderChat()`, `sendChat()`,
  `getAgentMsgs()`, `extractPostJSON()`, and `formatAIResponse()`
  (`js/api.js`) end to end. Most of what a fresh read would flag here
  (grounding real building/area data into the 4 agents that promise
  precise numbers, the honesty/precision-ask framing, the ENGAGEMENT closing
  style, the dynamic `_currentMonthYear()` date) was already built and fixed
  in prior sessions (2026-07-13/2026-07-12, documented further down this
  log) — confirmed still correct and unregressed rather than re-doing that
  work. Found one new, real, confirmed bug, plus a second one initially
  filed as "not worth fixing" that the user pushed back on and was right to
  — see item 2 below:
  1. **A suggestion-chip click could silently wipe out a real question the
     user had already started typing.** `sendChat(text,forceAgentId)`
     unconditionally ran `chatState.input="";` regardless of whether `text`
     was actually the box's own contents — a suggestion chip's `onclick`
     passes its OWN fixed string as `text` (`sendChat(s,effAgentId)`), never
     touching the input box at all. So if a user started typing their own
     custom question (suggestions are only shown right after the greeting,
     `msgs.length<=1` — exactly when a first-time user is most likely to be
     composing their real question) and then clicked a suggestion chip
     instead of finishing/sending their own draft, the draft vanished with
     no trace. Confirmed via a real-browser test before fixing: typing a
     custom message, clicking an unrelated suggestion, and reading
     `chatState.input` back afterward — the draft was gone even though it
     was never sent or referenced anywhere. **Fix**: `chatState.input=""`
     now only runs `if(!text)` — i.e. only when we actually just consumed
     what was in the box, matching intended behavior exactly; a suggestion
     click no longer touches the box's contents at all.
  2. **A reply in flight for one agent silently blocked sending to every
     OTHER agent too, not just that one.** `chatState.loading` was a single
     global boolean rather than tracked per-agent, and `sendChat()`'s guard
     (`if(!t||chatState.loading)return;`) read it directly — so waiting on,
     say, the Valuation Agent's reply meant the Negotiation Coach's own send
     button silently no-op'd if clicked in the meantime, even though nothing
     about that agent's own conversation was actually busy. Initially flagged
     this as "real but not worth the change" (correctness was never at risk —
     `sendChat()` already captures its own `aid`/`msgs` reference before the
     `await`, so a reply always lands in the right agent's history regardless
     of what the user does elsewhere meanwhile) — but on reflection, for a
     product whose whole pitch is 8 *simultaneously usable* specialists, a
     user being unable to even START a message to a second agent while a
     first one is still thinking is a real, avoidable limitation, not
     negligible friction. **Fix**: `chatState.loading` (boolean) replaced with
     `chatState.loadingAgentId` (the specific agent id currently generating a
     reply, or `null`) — `sendChat()`'s guard now only blocks a second send to
     THAT SAME agent (`chatState.loadingAgentId===aid`), and the "thinking"
     bounce-dots indicator in `renderChat()` now only shows when the
     currently-VIEWED agent (`effAgentId`) is the one actually loading, not
     whichever agent happens to be mid-request elsewhere.
  - **Investigated, confirmed genuinely inert, left alone**:
    `AI_AGENTS[].nameAr` (an Arabic name on every agent) is never read
    anywhere in `renderChat()` — but this is consistent with, not separate
    from, the already-documented 2026-07-18 decision to hide the Arabic
    language toggle entirely rather than ship a half-translated UI (see that
    entry further down this log); not a fresh bug, just inert data left over
    from the same shelved translation effort.
  - Verified: `node -c` on both touched files; a real-browser Playwright
    test confirming a real half-typed draft survives an unrelated
    suggestion-chip click (previously wiped), that the suggestion itself
    still sends correctly, and that a normal typed-and-sent message still
    clears the box exactly as before (no regression to the common path); a
    second, slow-resolving-mock test proving the per-agent loading fix
    directly — while the General agent's reply is deliberately held pending,
    switching to the Negotiation Coach and sending a NEW message succeeds
    immediately (previously would have silently no-op'd), a SECOND message
    to that same Negotiation Coach while ITS OWN reply is still pending IS
    correctly blocked, and once both pending replies are released each lands
    in its own correct agent's history with `loadingAgentId` cleared back to
    `null`; and a third sweep confirming all 8 agents switch and render
    correctly, and that Media Studio's embedded outreach chat (which shares
    this exact `sendChat()`/`effAgentId` code path, fixed earlier this same
    conversation) still sends and stores messages correctly — zero real
    console errors across all passes (one filtered artifact: an earlier
    test's over-broad Groq mock also intercepted the unrelated
    market-intelligence background fetch, which expects a different JSON
    shape — a test-harness limitation already documented elsewhere in this
    file, not a product bug).

- **2026-07-18 (session continuing 14, "AI Assistant" removed from Social —
  confirmed 100% duplicate of Network → AI Agents, before starting the AI
  Agents audit)**: Direct follow-up, same conversation — before asking for
  the AI Agents audit, the user flagged that SocialMedia → SocialChat ("AI
  Assistant") looked like the same thing as Network → Chat ("AI Agents"),
  and asked for a real check first, removing it only if confirmed:
  "پس از بررسی... در صورت مشابه بودن این دو تب، AI assistant را از تب social
  حذف کن". Confirmed with code, not a guess: `js/app.js`'s section routing
  called the exact same `content.appendChild(renderChat())` — no arguments,
  no `{inlineAgent:...}`, nothing — for both `currentSubTab==="Chat"`
  (Network) and `currentSubTab==="SocialChat"` (SocialMedia). Since
  `renderChat()` with no opts always resolves the active agent from the
  single global `chatState.agentId` regardless of which nav path got you
  there, the two tabs were byte-for-byte identical, not merely similar in
  spirit — a genuine, 100% duplicate.
  - **Fix, matching the frozen-nav removal protocol** (same 3 places kept in
    sync as the 2026-07-18 TrackRecord removal above): removed
    `{id:"SocialChat",label:"AI Assistant"}` from `NAV_SECTIONS`'s
    SocialMedia `subs` (`js/core.js`); removed the
    `else if(currentSubTab==="SocialChat")content.appendChild(renderChat());`
    routing branch in `js/app.js` (a stale/forced `currentSubTab==="SocialChat"`
    now gracefully falls through to the section's existing default-tab
    fallback, Studio — same graceful-fallback pattern already proven for the
    TrackRecord removal, verified via a direct test rather than assumed);
    and `TAB_TO_SECTION["SocialChat"]` (an old deep-link key used by
    `currentTab`-style legacy navigation) now redirects to
    `["Network","Chat"]` instead of the removed destination, so any stale
    bookmark/link lands on the real, surviving AI Agents tab rather than
    erroring or silently doing nothing. `renderChat()` itself
    (`js/chat.js`) needed zero changes — it was always the single correct
    implementation, now reachable only via its originally-intended home,
    Network → AI Agents.
  - Verified: `node -c` on both touched files; a real-browser Playwright
    test confirming `NAV_SECTIONS`'s SocialMedia subs no longer include
    `SocialChat`, the Social tab bar no longer renders an "AI Assistant"
    pill anywhere, `TAB_TO_SECTION["SocialChat"]` correctly resolves to
    `["Network","Chat"]`, forcibly setting the old
    `currentSubTab="SocialChat"` and re-rendering does NOT throw and
    correctly falls through to a real rendered page (Studio) instead, and
    Network → AI Agents (Chat) itself still renders fully and correctly
    (agent selector bar, input box, all working) — zero console errors.

- **2026-07-18 (session continuing 14, PropTech Video Platform audit — a
  real infinite fetch loop hammering Supabase, plus a half-built Edit Video
  feature and a Following-tab data gap, all found and fixed)**: Direct
  follow-up, same conversation — user asked for the same audit-then-fix
  treatment on the Video Platform: "همین بررسی رو برای video platform انجام
  بده". Read the complete file (`js/social.js`, 1547 lines) end to end —
  state, all API functions, the shared agent-review widget, video card/
  modal, and all 4 sub-tabs (Explore/Agents/My Profile/Following). Found and
  fixed 3 real issues, the first far more serious than initially apparent:
  1. **A genuine infinite fetch loop on the "My Profile" tab — confirmed
     via a real-browser test firing 140 GET requests to
     `agent_videos`/`agent_profiles` in under 2 seconds with zero user
     interaction.** `renderSocial()`'s bottom "Auto-fetch on first render"
     block had `if(SOCIAL_STATE.tab==="profile"&&...&&!SOCIAL_STATE
     .profileLoading){setTimeout(function(){_fetchMyProfile();
     _fetchMyVideos();},0);}` — but both of those functions flip
     `profileLoading`/`myVideosLoading` back to `false` at the end of their
     own cycle AND call `render()` themselves, so the very re-render they
     trigger hits this exact same check again, sees the flag is false once
     more, and reschedules another fetch cycle. Every OTHER auto-fetch guard
     in this same block correctly uses "have I already fetched this once"
     semantics (`videosFetched`, `agentReviewsFetchedFor`, the new
     `followedAgentProfilesMap` below) — this was the only one using an
     in-flight-only check, which is structurally insufficient once the
     thing you're guarding also re-triggers the render that re-evaluates the
     guard. In production against the real Supabase backend, this meant any
     signed-in agent sitting on their own My Profile tab would have silently
     hammered the database with unbounded concurrent requests for as long as
     the tab stayed open — a real cost/quota/rate-limit risk, and a likely
     source of visible UI flicker (`myVideosLoading` toggling true/false
     continuously). **Fix**: new `SOCIAL_STATE.myProfileAutoFetchedFor` (an
     id, mirroring the exact "fetched-for-id" idiom `agentReviewsFetchedFor`
     already uses elsewhere in this same file) — the auto-fetch now only
     fires once per profile id, matching every sibling guard in the block.
     The tab bar's own explicit "profile" click handler (unconditional,
     fires once per click — already correct, bounded by how often a human
     can click) is unaffected.
  2. **A half-built "Edit Video" feature — real, but findable only by
     tracing state, since nothing crashed and no error ever surfaced**:
     `SOCIAL_STATE.editingVideoId` existed, the video-post form's own title
     already conditionally read "Edit Video" vs "Post New Video" based on
     it, and both the Cancel button and a successful post reset it to
     `null` — but nothing ANYWHERE in the file ever SET it to a real video
     id (confirmed via a full-file grep), and the "My Videos" list had only
     a "Delete" button, no "Edit" at all. Worse, even if something had set
     it, `_postVideo()` always POSTed a brand-new row regardless — a user
     with a typo in a title/description/tag had no way to fix it short of
     deleting the video outright (losing its real views/likes/history) and
     re-posting from scratch. **Fix**: added a real "Edit" button next to
     "Delete" on each My Videos row — pre-fills `videoForm` from the video's
     own real fields (including re-joining its `tags` array back into the
     comma-separated string the form expects) and opens the form with
     `editingVideoId` set; `_postVideo()` now branches on `editingVideoId`
     to PATCH the existing row (`?id=eq.<id>`, no `agent_id` in the body —
     ownership never changes on an edit) instead of inserting a duplicate;
     the submit button's label now correctly reads "Save Changes"/"Saving..."
     when editing vs. "Post Video"/"Posting..." when creating new.
  3. **Following tab's "Agents I Follow" cards silently degraded to bare
     "Agent #&lt;id&gt;" placeholders** whenever a user went straight to
     Following without ever having visited the separate Agent Profiles tab
     first (which is the ONLY thing that ever populated `SOCIAL_STATE
     .agentList`, the sole source `knownAgents` was built from) — real,
     already-followed agent data (name/photo/video count) that was simply
     never fetched, not missing. Even after visiting Agent Profiles, a
     followed agent outside that tab's current sort's top-100 would still
     show the placeholder. **Fix**: new `_fetchFollowedAgentProfiles()` —
     fetches exactly the followed ids directly (`agent_profiles?id=in.(...)`),
     stored in a new `SOCIAL_STATE.followedAgentProfilesMap` (id-keyed,
     `null` until first fetched — the correct one-time-per-tab-visit guard,
     unlike the loop above), merged into `knownAgents` alongside whatever
     `agentList` already has. A small loading spinner shows while this
     resolves so a followed agent's card never flashes the placeholder text
     first.
  - Verified: `node -c js/social.js`; a real-browser Playwright test with a
    request-counting mock confirming the fix brings the request count for
    a My Profile visit down from the pre-fix 140 GETs/2s to a stable,
    bounded 2-3 total (re-run 10 times over 2 seconds post-fix, count never
    grows — genuinely fixed, not just slowed down); a second test driving
    the real Edit flow end-to-end (click Edit on a mocked video → confirmed
    the form pre-fills the exact original title/area/tags → change the
    title → click the now-correctly-labeled "Save Changes" → confirmed a
    real `PATCH .../agent_videos?id=eq.501` fires with no `agent_id` in the
    body and zero duplicate POSTs, and `editingVideoId` resets to null
    after); a third test seeding a followed agent with an empty `agentList`
    (simulating "never visited Agent Profiles") confirming the real agent
    name renders after the dedicated fetch resolves, never the "Agent #42"
    placeholder; and a 13-tab regression sweep (Home, Market Dashboard/
    Analyzer/QuickCheck, Portfolio, Deal Board, AI Agents, all 4 Social
    Media Manager sub-tabs, Workspace, About) confirming zero collateral
    console errors from any of these 3 fixes — zero errors throughout.

- **2026-07-18 (session continuing 14, Media Studio audit — inline
  outreach chat was silently sending to the wrong AI agent)**: Direct
  follow-up, same conversation — user asked for the same audit-then-fix
  treatment on Media Studio: "این بررسی رو برای Media Studio هم انجام
  بده". Read `renderMediaStudio(mode)` (`js/chat.js`, the shared entry point
  for both Network → SocialMedia → Studio and → Avatar) end to end,
  including its 3 UI helpers (`makeToolGrid`/`makeSectionHeader`/
  `makeCollapsible`), the Setup/Branding+Social config cards, the CREATE
  tool grid, the embedded "OR CHAT WITH YOUR AGENT" chat block, Analytics,
  and the collapsible Advanced AI Tools grid — confirmed all ~25 tool-grid
  entries route to real, existing functions (no dead/miswired links), and
  confirmed `getBrandProfile()`/`getSocialCreds()` read the exact same
  localStorage keys their own "Remove"/"Disconnect" buttons clear (no
  clear/read key mismatch, unlike a bug class already fixed elsewhere this
  session). Found one real, load-bearing bug in the embedded chat:
  1. **Every message sent through Media Studio's inline "chat with your
     agent" box was silently attributed to the WRONG AI agent** — a bug
     that could misroute both the client-facing persona/system-prompt AND
     the "outreach"-only JSON post-extraction/Publish-bar rendering to
     whatever agent the user last had selected on the separate, main
     Network → AI Agents tab (or the default "general" agent, if they'd
     never visited that tab this session), instead of the intended
     "outreach" (Social Media Manager) specialist. Root cause:
     `renderMediaStudio()` rendered the embed via a temporary
     set-then-restore of the GLOBAL `chatState.agentId`
     (`chatState.agentId="outreach"; ...renderChat({inlineAgent:"outreach"})
     ...; chatState.agentId=prevAgentId;`) — but `sendChat()` (the function
     the embed's own Send button/Enter key actually calls) reads
     `chatState.agentId` at CALL time, i.e. whenever the user actually
     finishes typing and hits send, which is always AFTER the restore line
     above had already run. So `getAgentMsgs(chatState.agentId)` pushed
     the message into the WRONG agent's history entirely, `AI_AGENTS.find
     (...===chatState.agentId)` picked the WRONG agent's system prompt for
     the AI call, and the reply — since `renderChat()`'s own message-list
     rendering ALSO keyed off the (still-wrong) global `chatState.agentId`
     for its `==="outreach"` checks — would never trigger the JSON post-
     extraction/"Publish" bar, and would never even appear in the embedded
     chat on the next re-render (since that re-render's own temporary
     "outreach" override reads `getAgentMsgs("outreach")`, which never
     received the message). This is exactly the class of "global mutable
     state read at a later, real user-triggered time" bug this session
     found once already in the Map tab (`window.METRO_STATIONS`) — same
     root cause shape (indirection through shared state instead of an
     explicit, threaded parameter), different manifestation.
  - **Fix, `js/chat.js`**: `renderChat(opts)` now derives a local
    `effAgentId = _inline||chatState.agentId` once, and every internal read
    that used to check the bare global directly (`activeAgent` lookup, the
    "New" button's message-clear, the outreach-only brand button/JSON-
    extraction checks, `getAgentMsgs()`) now uses `effAgentId` instead —
    `_inline` is `opts.inlineAgent` ("outreach" for the Media Studio embed,
    falsy for the normal, non-inline main-tab call), so this is
    automatically correct for both callers with zero behavior change for
    the main tab (`effAgentId` degrades to plain `chatState.agentId` when
    `_inline` is falsy — the exact same value it always read). `sendChat()`
    gained a 2nd optional `forceAgentId` parameter (`aid=forceAgentId||
    chatState.agentId`, used everywhere inside the function instead of the
    bare global) — the embed's own Send button/Enter-key/suggestion-chip
    handlers (the only 3 call sites inside `renderChat()`) now pass
    `sendChat(text, effAgentId)` explicitly, so the correct agent travels
    with the actual user action instead of being inferred from
    whatever the shared global happens to hold at that later moment.
    `renderMediaStudio()`'s embed itself simplified to a single
    `smmChatWrap.appendChild(renderChat({inlineAgent:"outreach"}));` call —
    the temporary global mutate/restore dance is no longer needed at all,
    removing the root cause rather than patching around it.
  - Verified: `node -c js/chat.js`; a real-browser Playwright test that
    signs in, sets the main tab's `chatState.agentId` to `"general"`
    (simulating a user who'd previously used a different agent elsewhere),
    renders Media Studio, and drives the embedded chat's real input+send
    button exactly like a user click (mocked `/api/proxy-groq` returning a
    reply with an embedded JSON post block) — confirmed the global
    `chatState.agentId` is left completely untouched (`"general"`,
    unmodified) by the embed, the sent message and its reply are correctly
    stored under `"outreach"`'s own history (not leaked into `"general"`'s,
    which is exactly what the bug would have done), the message and reply
    are correctly visible on the next re-render of the embedded chat
    (previously would have vanished, since the wrong history was being
    read), and the outreach-only JSON-extraction "Publish" bar correctly
    renders (previously would never have fired, since that check also
    keyed off the same clobbered global) — zero console errors. A second
    Playwright pass swept Studio/Avatar/SocialChat (AI Assistant) plus the
    main Network → AI Agents tab (switching its own agent selection)
    confirming zero regressions anywhere else this session's other fixes
    touch — zero console errors throughout.

- **2026-07-18 (session continuing 14, Avatar Studio audit — 3 real gaps
  found and fixed, one of them a whole engine unusable)**: Direct follow-up,
  same conversation — user asked for the same audit-then-fix treatment on
  Avatar Studio: "این بررسی رو برای Avatar Studio انجام بده". Read
  `showAvatarStudio()`/`showAvatarBuilder()`/`showAvatarContentGen()`/
  `showAvatarVideoGen()`/`showAvatarAutoPilot()`/`showAvatarBatchGen()`
  (`js/chat.js`) end to end. Found:
  1. **HeyGen video generation was completely unusable — the input needed
     to use it was never shown to the user.** `showAvatarVideoGen()`
     creates `heygenAvatarSection` (the "HeyGen Avatar ID" input + "Load My
     HeyGen Avatars" button) with `display:"none"`, and nothing anywhere in
     the function ever set it back to visible — not on initial render, not
     when the user clicked the HeyGen engine card. So even after correctly
     selecting HeyGen as the video engine, a user had no way to see or use
     the exact input the "Generate" button's own error message told them to
     use ("Select a HeyGen avatar first (click Load Avatars)" — pointing at
     a button that was never rendered visible). **Fix**: the method-card
     click handler now toggles `heygenAvatarSection.style.display` based on
     whether HeyGen is the selected engine, and the section's initial
     display state is set correctly too (matching whatever engine is
     actually selected by default, not hardcoded `"none"`).
  2. **Two "success" cards showed a blank gap instead of a celebratory
     emoji** — both `showAvatarAutoPilot()`'s "Auto-Pilot Complete!" card and
     `showAvatarBatchGen()`'s "30 Days Scheduled!" card built a 36-48px
     emoji-sized `<div>` with an empty string (`""`) as its only content —
     a visible blank rectangle where an emoji clearly belonged (matching
     the font-size convention this codebase's other completion states use).
     Filled both with "🎉", the same emoji this exact file already uses for
     an equivalent "generation complete" moment elsewhere (Video Editor's
     own "Done! 🎉" status text).
  3. **Auto-Pilot's "Generate for how many days?" field had no upper
     bound** — a free-text input defaulting to "7" with zero validation; a
     mistyped or oversized value (e.g. "9999") would silently queue
     thousands of sequential `askAI()` calls with no confirmation, far
     beyond what any part of this feature or the app's own dedicated
     30-day Batch Generator ever intends. Clamped to 1-30 (matching the
     app's own established 30-day bulk-generation ceiling), with the input
     field itself corrected to show the clamped value.
  - Verified via a real-browser Playwright test (5 checks): clicking the
    HeyGen engine card now correctly makes the "HeyGen Avatar ID" section
    visible (previously always `display:none` regardless of selection); a
    days value of "9999" is immediately clamped to "30" the moment Launch
    is clicked (confirmed by reading the input's own value right after the
    click, before the generation loop even starts); and a full mocked
    Auto-Pilot run completes and shows the 🎉 emoji in its success card
    (previously blank) — zero console errors. Re-ran the full existing test
    suite from this session (Quick Check, Analyzer, Map, 25-tab navigation
    sweep) — zero regressions.

- **2026-07-18 (session continuing 14, Map audit — 2 real gaps found and
  fixed, one of them a whole silently-dead feature)**: Direct follow-up,
  same conversation — user asked for the same audit-then-fix treatment on
  the Map tab: "همین بررسی رو برای Map انجام بده". Read the full file
  (`js/map.js`, ~930 lines) end to end. Found the most significant "silently
  dead since it was built" bug in this whole string of sessions this week:
  1. **Metro/tram station markers have NEVER actually been plotted on the
     map, ever, for the Location metric — since this feature was first
     built.** `renderMap()`'s Location-metric block checks
     `if (window.METRO_STATIONS) { METRO_STATIONS.forEach(...) }` (and the
     identical pattern for `TRAM_STATIONS`) before creating any markers —
     but `METRO_STATIONS`/`TRAM_STATIONS` are declared with `const`, not
     `var`, at the top level of `js/data-residential.js`. A top-level
     `const`/`let` in a classic (non-module) `<script>` tag never becomes a
     property of `window` — only `var` does. So `window.METRO_STATIONS` has
     always evaluated to `undefined`, and the real metro/tram marker-
     plotting code inside that `if` block has never once executed, in any
     session, on any deploy — a fully dead feature masquerading as working
     code, only discoverable by actually checking `typeof
     window.METRO_STATIONS` at runtime (confirmed live: `"undefined"`, vs.
     the bare identifier `METRO_STATIONS` which is a real, populated
     object). The exact same broken check also gated the legend's own
     "Metro / Tram" row (`_dvRenderLegend`) — so the legend and the (absent)
     markers were at least CONSISTENTLY both missing, not contradicting each
     other, but the whole "see metro/tram stations on the Location map"
     promise has silently never worked. **Fix**: all 3 occurrences now check
     the bare `typeof METRO_STATIONS!=="undefined"` / `typeof
     TRAM_STATIONS!=="undefined"` directly instead of the `window.`-
     prefixed form — matching how every other top-level `const` in this
     codebase (`AREAS`, `DB`, `VILLA_AREAS`) is already referenced elsewhere
     in this exact file. The legend's Metro/Tram row check was also given an
     explicit `_dvMapState.metric === "location"` guard at the same time,
     since that's the only metric these markers are ever plotted for.
  2. **Building panel hardcoded `isVilla=false` for every building clicked
     on the map, regardless of area** — `_dvBuildingInfoHtml()` called
     `estimateBldgUnits(name, bData, false)` unconditionally, so a genuine
     villa/townhouse cluster clicked in a pure-villa area (e.g. The Springs)
     got an apartment-scale fallback unit-count estimate whenever it lacked
     a real `BLDG_UNITS` entry (confirmed the two fallback branches
     genuinely differ — 250 vs. 350 for the same building on a real test
     case). The panel's "Typical unit sizes" disclaimer text was also always
     apartment-phrased ("~750–1,600 sqft (1BR–3BR) in most Dubai towers"),
     nonsensical for a real villa/townhouse. **Fix**: `_dvBuildingInfoHtml()`
     now computes the real per-building type via the same `isVillaBuilding()`
     refinement already wired into every other bulk building-scan consumer
     this session (Quick Check/Smart Discovery/Alerts/Compare/Personal
     Advisor), passes it into `estimateBldgUnits()`, and shows a
     villa-specific size disclaimer ("~1,900–4,800+ sqft (2BR–5BR)") when
     the clicked building is genuinely a villa/townhouse.
  - Verified via a real-browser Playwright test (5 checks) plus a direct
    diagnostic confirming the exact root cause (`typeof
    window.METRO_STATIONS` → `"undefined"` vs. bare `METRO_STATIONS` →
    `"object"`, live in the actual app): a villa building panel now shows
    villa-scale unit-size text, an apartment building panel still shows the
    original apartment-scale text; a real villa-area building lacking
    `BLDG_UNITS` coverage now gets a genuinely different (correct) fallback
    unit estimate than before; the metric legend's Metro/Tram row correctly
    disappears for non-Location metrics and correctly still appears for
    Location — zero console errors. Re-ran the full existing test suite
    from this session (Quick Check, Analyzer end-to-end, 25-tab navigation
    sweep) — zero regressions. **Not independently verified**: actually
    seeing the metro/tram markers render on a live Google Maps canvas — this
    sandbox has no outbound network access to Google's Maps API (same
    documented limitation as every other Map-tab session this week); the
    underlying JS logic bug (the `window.X` vs. bare `X` mismatch) is
    conclusively proven and fixed regardless, and this is the exact
    mechanism that would make the real markers finally appear once deployed.

- **2026-07-18 (session continuing 14, Analyzer core-formula audit — 3 real
  root-level issues found and fixed, extreme caution per Directive #2)**:
  Direct follow-up, same conversation — user asked for the same
  audit-then-fix treatment on the Analyzer itself ("بخش Analyze مهمترین بخش
  سایت است... اما امکان دارد حتی همین فرمول هم در ریشه ایرادهایی داشته
  باشد"), explicitly asking for an investigation-only pass FIRST given how
  much calibration work this engine represents, before approving any fix.
  Read `computeAdjustedPSF()`/`computeValuation()`/`computeSmartRent()`/
  `computeRentalValuation()` (`js/valuation.js`) end to end without changing
  anything, reported 3 findings, then — after explicit user approval
  ("هر سه را به ترتیب فیکس کن") — fixed all 3, each verified with a
  before/after numeric diff (via `load_engine.js`, the existing sandboxed
  Node harness that loads the real data+valuation files) rather than just
  `node -c`, given the stakes:
  1. **"Overpriced" price shown to the user contradicted the verdict that
     triggers it** — the FAIR/OVER verdict split was a flat `askPSF<=
     adjPSF*1.07` for every area, while the "Overpriced" price displayed in
     the Price Ladder (`overpricedAt`, js/market.js line ~2250) used the
     area-sensitivity-aware `overCeil` (1.08–1.14 depending on area risk
     tier) — clearly meant to drive this same split when that
     area-sensitivity system was added, but never wired in. Confirmed with
     real numbers across a 50-case sample: 7 cases showed a genuine
     contradiction (e.g. Business Bay, price AED 3,047,640, verdict="OVER",
     but the ladder's own "Overpriced" row showed AED 3,131,520 — a HIGHER
     number than what the user was told they overpaid). **Fix**: the FAIR/
     OVER split now uses `overCeil` directly instead of the flat 1.07, so
     OVER starts exactly at the same price shown as "Overpriced" — zero
     possible contradiction going forward.
  2. **Villa/townhouse rental comparison table always omitted the 2BR row**
     — `computeRentalValuation()`'s `estRent` correctly prices a 2BR villa/
     townhouse off `aData.rv2` (via `_baseAreaRent`'s bn≤2 bucket), but the
     "Area rental benchmarks" comparison table shown to the user started at
     "3 BR" (`if(aData.rv3)...`), never including the one benchmark row that
     actually matches a 2BR search. Fixed by adding the missing
     `if(aData.rv2)areaRents.push({beds:"2 BR",rent:aData.rv2});` row.
  3. **The area-rent ladder formula (Studio→7BR, apartment vs villa bands)
     was duplicated in 3 separate places** — the single correct shared
     helper `_baseAreaRent()`, plus a hand-copied inline duplicate inside
     `computeValuation()`, plus a THIRD hand-copied duplicate inside
     `computeSmartRent()`. All 3 happened to be byte-identical at the time
     of this audit (verified via a 96-case Studio→5+BR × apartment/villa ×
     8-area before/after diff — zero differences), so this wasn't a live
     bug today — but it's exactly the kind of latent drift risk already
     proven real this same session (`computeAreaPriceRange`'s own
     partially-villa-aware rent table, found and fixed in the Quick Check
     audit above): any future rent-band correction applied to only one or
     two of the three copies would silently pull Analyzer's own sale
     valuation and rent-deal-checker out of sync with the rest of the app.
     **Fix**: consolidated both duplicates onto the single `_baseAreaRent()`
     call. This surfaced a real, separate, previously-hidden bug as a side
     effect: `computeSmartRent()`'s own local bed-count map stopped at
     `"5+ BR":5` (no 6BR/7BR keys) — even though the Analyzer's own villa
     bedroom dropdown (`js/market.js`) genuinely offers "6 BR"/"7+ BR" as
     selectable options — so a real 6-7BR villa's "Smart Rent Check" was
     silently falling back to the much smaller 2BR (`rv2`) rent band,
     understating a large villa's true achievable rent by a wide margin.
     Confirmed fixed: a 6BR Al Barari villa now correctly returns the real
     `rv6` band (520,000) instead of silently defaulting to `rv2`.
  - **Reassurance also reported to the user**: the Analyzer's own villa-vs-
    apartment determination (`f.propCategory==="villa"`) is driven entirely
    by the user's own explicit form selection, never an automatic
    area-level guess — so the "mixed villa area" limitation found and
    partially closed in the Quick Check/Compare/Alerts audits above (this
    same session) does not affect the core Analyzer valuation formula at
    all.
  - Verified: `node -c`; a 50-case before/after diff for fix 1 (7 previously-
    contradictory cases correctly flipped verdict from OVER→FAIR with
    `suggestedOffer` recalculated to match, zero contradictions remaining,
    every OTHER field — fairPrice/distressPrice/confScore/adjPSF — byte-
    identical across all 50 cases, confirming the fix is fully surgical); a
    direct check confirming a 2BR villa's `areaRents` now includes the
    matching `rv2` row; a 192-case (96 sale + 96 rent) before/after diff for
    fix 3 showing zero differences for every bed count already reachable
    before the fix, plus an explicit 6BR/7BR check confirming the newly-
    fixed large-villa rent band; a real-browser Playwright test driving the
    actual Analyzer UI end-to-end for both an apartment (sale, Price Ladder
    rendering with no contradiction) and a villa (rent, 2BR comparison row
    present) — zero console errors; and a re-run of every test suite built
    this session (Quick Check, Compare, Alerts, per-building villa
    refinement, 25-tab navigation sweep) — zero regressions anywhere.

- **2026-07-18 (session continuing 14, per-building villa/apartment
  refinement — closes the "mixed villa area" limitation flagged in the
  Quick Check audit below)**: Direct follow-up, same conversation — the
  Quick Check audit below flagged, but deliberately did NOT fix, that
  `VILLA_AREAS` is area-level only and ~12 major "villa" areas are
  genuinely mixed with real apartment towers. User's explicit instruction:
  "اول محدودیت واقعی و عمیق تری که پیدا کردی و عمدا فیکس نکردی رو فیکس کن...
  خودت فیکس کن" (fix that real, deeper limitation yourself first). Rather
  than ship a guess because it was asked for, actually tested 2 candidate
  per-building classifiers against the real 9,226-building database first —
  both failed and were rejected on real evidence, not assumption:
  1. **Generic apartment-tower keywords** ("tower"/"residences"/"views"/
     "heights") — rejected because real villa/townhouse clusters
     legitimately use these words too: "Golf Views" (Jumeirah Golf Estates)
     and "Hills View" (Dubai Hills Estate) are real villa/townhouse
     communities, and the villa cluster "Golf Place III" has DB entries
     literally named "Golf Place III - Tower 1/2".
  2. **A BLDG_UNITS (unit count) threshold** — rejected because real villa
     clusters ("Sidra 1", "Golf Grove", "Palm Hills", "Majestic Vistas")
     show BLDG_UNITS of 380-500, statistically indistinguishable from real
     apartment towers in the same mixed area ("Executive Residences",
     "Golf Suites" — also 300-500).
  **The one signal that held up**: a full cross-check of all 2,195
  buildings across the 12 known-mixed areas found ZERO buildings whose name
  contains both "villa"/"townhouse" AND "apartment" — meaning a building's
  own name literally stating "Apartment(s)" (with no "Villa"/"Townhouse"
  word alongside it) is real, unambiguous, non-fabricated evidence, unlike
  either rejected heuristic. This reclassifies exactly 43 buildings (e.g.
  "Shoreline Apartments 1-16", "Marina Apartments 1-6", "Palm Jumeirah
  Apartments" in Palm Jumeirah) from the area's villa default to apartment.
  Deliberately narrow — it does NOT try to catch every apartment building in
  a mixed area (most, like "Park Heights"/"Executive Residences", carry no
  explicit type word) — closing that remaining gap needs a real per-building
  type field verified through actual research, a `js/data-residential.js`
  change owned by the research branch, not something safe to guess at from
  this branch.
  - **New shared function**: `isVillaBuilding(key,area)` (`js/valuation.js`)
    — false immediately if the area isn't in `VILLA_AREAS`; inside a villa
    area, false only if the key contains "apartment" with no "villa"/
    "townhouse" word; true otherwise (the existing area-level default).
  - **Wired into every call site that has a real building key available**
    (9 sites across 3 files) — replacing a bare `VILLA_AREAS.has(area)`
    check computed once per area/loop with a per-building check computed
    per building: Smart Discovery's Property Type filter and Alerts' Deal
    Alerts scanner (`js/app.js`), Find's `doDBSearch()` rent/yield calc
    (`js/app.js`), the AI Smart Search suggestion picker's type-detection
    (`js/app.js`, refines its existing `isVA` alongside the pre-existing,
    untouched `VILLA_KEYWORDS`-based `isVK` signal), Quick Check's
    `_qcRecommendBuildings()` core loop and both navigation handlers
    (`js/market.js` — the isVilla computation moved from once-per-area to
    once-per-building inside the loop), Compare's building-search Property
    Type filter (`js/portfolio.js`), and Personal Advisor's
    `_paPickRealBuilding()` (`js/portfolio.js` — previously matched every
    building in an area to the same area-level flag, so a real apartment
    building could have been picked as the "real building tip" for a villa
    recommendation). Left unchanged, correctly, at 2 sites with no specific
    building available: `computeAreaPriceRange()` (area-only aggregate
    range) and the Analyzer's "Or browse by area" quick-select chips (a
    whole-area chip, not one building).
  - Verified via a real-browser Playwright test (5 checks): the 4 known
    "Apartments"-named buildings in Palm Jumeirah now correctly resolve
    `isVillaBuilding()`→false (previously true, area-level default); real
    villa fronds/clusters in the same mixed area are unaffected (still
    true); a pure-apartment area (Dubai Marina) and a pure-villa area (The
    Springs, all 16 buildings) are both completely unaffected — no
    regression; and Quick Check's own estimator now correctly gives
    "Shoreline Apartments 1" an apartment-scale unit size (1,100 sqft)
    instead of the villa-scale size it would have gotten from the area-level
    flag alone. Re-ran the full Quick Check, Compare, and Alerts Playwright
    suites plus the 25-tab navigation sweep — zero regressions, zero console
    errors.

- **2026-07-18 (session continuing 14, Quick Check audit — 4 real gaps
  found and fixed)**: Direct follow-up to the Compare audit below, same
  conversation — user asked for the identical audit-then-fix treatment on
  Quick Check: "quick check رو به همین ترتیب بررسی کن". Read
  `_qcRecommendBuildings()`/`_renderQuickCheckWidget()`/`_renderQCResult()`/
  `computeAreaPriceRange()` in `js/market.js` plus the shared bulk-scan
  estimators (`estimateBuildingRentYield()`/`_baseAreaRent()`,
  `js/valuation.js`) this tool depends on. Central theme: Quick Check's
  entire promise since its 2026-07-14 redesign is "given my budget, which
  REAL buildings can I buy/rent into" for apartment, villa, AND townhouse —
  but the underlying bulk-scan math silently used apartment-only size/rent
  assumptions even when the user was searching a genuine villa area, and 2
  navigation handlers hardcoded the wrong property type outright. Found and
  fixed 4 real gaps:
  1. **Villa building-recommendation prices/rents used apartment-scale unit
     sizes** — `estimateBuildingRentYield()` (the exact function powering
     Quick Check's headline "Buildings you can buy/rent" cards) picked a
     unit size from the flat `TYPICAL_UNIT_SIZE` ladder (Studio 500 sqft up
     to 5+BR 3,000 sqft) for EVERY building regardless of `isVilla` — but a
     real Dubai villa/townhouse runs materially larger than an apartment at
     the same bed count (a 3BR townhouse commonly runs 2,000-2,800 sqft vs
     ~1,600 sqft for a 3BR apartment; a 4-5BR villa often runs
     3,000-5,500+ sqft). Since `estPrice = psf × size`, this systematically
     UNDERSTATED real villa building prices/rents — a villa building could be
     shown as "within budget" or "Top pick" when its real market price for
     that bed count would actually exceed the user's stated budget, directly
     undermining the tool's "100% correct, real market result" promise for
     villa/townhouse searches specifically. **Fix**: new
     `TYPICAL_VILLA_UNIT_SIZE` ladder (2:1900/3:2400/4:3400/5:4800/6:6500/
     7:8500 sqft — reasonable, widely-known Dubai villa/townhouse size
     conventions, the same class of established domain fact this engine
     already relies on elsewhere, e.g. floor/view premiums, DLD fee %, LTV
     brackets — not fabricated precision), used whenever `isVilla` is true
     and a size is defined for that bed count; falls back to the apartment
     ladder for Studio/1BR (a "villa" hit at that bed count in a
     mixed-area — see item 4 below — is almost always a misclassified
     apartment building, so guessing a villa size there would likely be
     wrong instead of right). This is a shared estimator also used by Smart
     Discovery and Alerts, so the fix improves those consumers too for any
     genuinely villa-only area, not just Quick Check.
  2. **`computeAreaPriceRange()`'s RENT-mode range card only used villa rent
     bands for 4BR/5+BR, silently apartment-banded for everything smaller**
     — its local `rentByBeds` table switched to `aData.rv4`/`aData.rv5`
     (villa rent bands) only at 4BR and 5+BR, but used `aData.r1/r2/r3`
     (apartment rent bands) for Studio/1BR/2BR/3BR regardless of area type —
     inconsistent with the already-correct, already-established
     `_baseAreaRent()` helper elsewhere in this same codebase, which
     branches by `isVilla` across the FULL bed range. Verified the real-world
     scale of this bug directly against live `AREAS` data: "The Springs"
     (a genuine, 100%-villa area) has `rv2:130000` vs `r2:65000` — a 2x
     understatement for anyone Quick-Checking a 2BR villa/townhouse rent
     there. **Fix**: `computeAreaPriceRange()`'s rent branch now calls the
     shared `_baseAreaRent(aData,beds,isVilla)` directly instead of
     maintaining a second, partially-villa-aware, drifting copy of the same
     ladder — single source of truth, and it also gains that helper's
     already-correct Studio-specific downscale for free. This function is
     also called by Personal Advisor's `bestEntry` calculation
     (`js/portfolio.js`), so the fix benefits that flow too.
  3. **Sale-mode range card's SQFT sizing table had the same apartment-only
     gap** — the entry/mid/premium sqft brackets used to size a building's
     PSF into a price range were apartment-scale for every bed count,
     regardless of area type. Added a parallel `SQFT_VILLA` bracket table
     (same reasoning/sourcing as item 1), selected whenever `isVilla` is
     true and the bed count has a defined bracket (2BR+; Studio/1BR fall
     back to the apartment table for the same mixed-area reason as item 1).
  4. **Two navigation handlers hardcoded `propCategory="apartment"`
     unconditionally** — both the per-building "pick" cards' click handler
     and the "Full Analyzer — exact valuation for your unit →" CTA button
     always forced `analyzerState.f.propCategory="apartment"` before
     navigating into the full Analyzer, regardless of whether the actual
     area/building searched was a villa. A user Quick-Checking a villa area,
     then clicking through to the "exact valuation" Analyzer for their
     specific unit, silently landed on the APARTMENT form (wrong fields, no
     private-pool/single-row/corner-villa premiums available) — undermining
     the exact CTA promising "your unit"'s real valuation. Fixed using the
     identical `VILLA_AREAS`-derivation convention already established
     elsewhere in this same file (the Analyzer's own "Or browse by area"
     quick-select chips) — both handlers now correctly set `propCategory`
     to `"villa"` or `"apartment"` based on the searched area.
  - **Investigated, NOT fixed in this pass — see the follow-up entry
    directly above this one, same session, for the real per-building
    refinement subsequently built at the user's explicit request**:
    `VILLA_AREAS` (`js/data-residential.js`) is an area-level
    classification, but at least 12 major "villa" areas in that set are
    genuinely MIXED — e.g. Palm Jumeirah (381 buildings, many are pure
    apartment towers like "Shoreline Apartments"/"Oceana"), Dubai Hills
    Estate (310 buildings, many are apartment towers like "Park Heights
    III"/"Executive Residences"), Meydan, MBR City, Sobha Hartland, Town
    Square, Al Furjan, Motor City, Dubai South, Nad Al Sheba, Palm Jebel
    Ali, Dubai Islands — confirmed via a direct DB scan (samples like
    "azizi riviera 13"/"ellington house 3"/"sobha orbis tower a" are clearly
    apartment towers, all tagged `isVilla:true` purely from area membership).
    This means every bulk building scan across the WHOLE app (Quick Check,
    Smart Discovery, Alerts, Compare) still misapplies villa rent/size
    assumptions to real apartment buildings within these specific mixed
    areas. Considered a name-pattern heuristic (tower/residences/apartments
    keyword matching) to reclassify per-building, but rejected it —
    per the same anti-fabrication principle already established this
    session (Compare audit's `_cmpResolveCluster()`, Personal Advisor's
    `_paPickRealBuilding()`): a wrong-but-plausible per-building guess would
    be a worse failure mode than the current, disclosed, area-level
    approximation. A real fix needs actual per-building type data, which is
    a `js/data-residential.js` change outside this branch's remit (owned by
    the research branch) — flagged here explicitly as a known, cross-
    cutting limitation for a future session/the research branch to close,
    not something Quick Check's own code can safely patch around alone.
  - Verified via a real-browser Playwright test (7 checks, 2 files): The
    Springs 2BR rent range now correctly anchors to the real villa `rv2`
    band (130,000) instead of the old apartment `r2` band (65,000) — a
    confirmed 2x fix; Dubai Marina (apartment area) rent range unaffected,
    still anchors to `r2` — no regression; a villa-flagged building
    estimate now uses a real, bigger villa-scale unit size (2,400 sqft) than
    the apartment assumption (1,600 sqft) for the same 3BR bed count;
    clicking a villa-area building-pick card now correctly navigates to the
    Analyzer with `propCategory:"villa"` (was always "apartment" before);
    an apartment-area building-pick card still correctly sets
    `propCategory:"apartment"` — no regression; the sale-mode range card
    computes correctly for a villa area with real entry/mid/premium
    brackets; and the "Full Analyzer" CTA button (the 2nd hardcoded site)
    also now correctly sets `propCategory:"villa"` for a villa area — zero
    console errors. Re-ran the existing Alerts and Compare Playwright test
    suites (both call the same shared `estimateBuildingRentYield()`/
    `computeAreaPriceRange()` functions) plus a 25-tab navigation regression
    sweep — zero collateral regressions from these shared-function changes.

- **2026-07-18 (session continuing 14, Compare tab audit — 5 real gaps
  found and fixed)**: Direct follow-up to the Alerts audit below, same
  conversation — user asked for the identical audit-then-fix treatment on
  Compare (Market → Compare, `renderCompare()`/`_cmpItemData()`/
  `_cmpBuildingSearch()` in `js/portfolio.js`): are the inputs sufficient to
  compare multiple properties across different buildings/areas — apartment,
  villa, AND townhouse — and is the result complete/flawless as the tool's
  name promises? Found the most serious data-accuracy bug in this whole
  string of Portfolio audits:
  1. **Silent, unlabeled zero-data bug affecting 53 of 124 Community options
     — the single biggest finding**: the "Community" dropdown is populated
     from `Object.keys(CLUSTERS)` (`js/data-residential.js`, 124 villa/
     townhouse master-community names), but `_cmpItemData()`'s cluster branch
     did a bare `AREAS[v]||{}` lookup with no fallback at all. A direct
     cross-check found 53 of those 124 names (~43%) have no EXACT-cased match
     in `AREAS` — casing/formatting drift between the two data files (e.g.
     `CLUSTERS` has `"DAMAC Hills 2"` while `AREAS` uses different casing, or
     the two disagree in punctuation/spacing) — so picking any of these 53
     communities silently produced an all-zero `{}` object: PSF 0, yield 0,
     growth 0, DOM 0. That empty object was then handed straight to the AI as
     if it were real data for a side-by-side investment comparison — a direct
     violation of this file's own Directive #2 (max 3% deviation, every
     Analyzer/comparison number must be accurate), and arguably worse than a
     visible error since the user would see confident-looking AI commentary
     built on literal zeros with no indication anything was wrong.
     **Fix**: new `_cmpResolveCluster(v)` helper — tries the exact key first,
     then a case-insensitive match against real `AREAS` keys, then falls back
     to the existing `resolveDLDArea()` alias table (already used elsewhere
     in the app for DLD sub-community name normalization) — resolving 11 of
     the 53 previously-broken names to real data (8 via case-insensitive
     match, 3 via the alias table). The remaining ~42 genuinely have no
     tracked benchmark at all; for these, `_cmpItemData()` now returns `null`
     (an honest "no data" signal) instead of a fabricated `{}` — consistent
     with the same anti-fabrication principle already established this
     session for Personal Advisor's `_paPickRealBuilding()`. Deliberately did
     NOT attempt fuzzy/substring matching for these remaining 42, since a
     wrong-but-plausible area match would be a worse failure mode than an
     honest gap. (Editing `CLUSTERS`/`AREAS` themselves to close the
     remaining gap is out of scope for this branch — those files are owned
     exclusively by the research branch per the two-branch workflow rule.)
  2. **Building comparison used exact-match lookup, not the app's own fuzzy
     matcher**: the building branch of `_cmpItemData()` did `DB[v.toLowerCase()]`
     directly — the same class of bug already fixed elsewhere in this
     project (`scoreDealQuality()`, session 2026-07-18 Find audit) — meaning
     a building typed with slightly different spacing/punctuation than its
     exact DB key silently produced the same all-zero result as case (1).
     Fixed by routing through the existing, already-hardened
     `lookupBuilding(name,areaHint)` (fuzzy substring/word matching) instead.
  3. **Property Type selector was decorative only**: the "Property Type"
     field (All/Apartment/Villa/Townhouse/Penthouse) was captured into
     `compareState.propType` and passed to the AI as plain text context, but
     never actually filtered anything — selecting "Villa" still let the
     building-search autocomplete suggest apartment towers with zero
     narrowing, so a user trying to compare "villas across different areas"
     (the user's own stated use case) had no real way to keep results to
     villas only. Fixed: `_cmpBuildingSearch()`'s suggestion filter now
     checks `VILLA_AREAS.has(d.a)` (the same convention this whole app
     already uses to infer a DB entry's type, since entries carry no direct
     type field) — Villa narrows to villa-area buildings only, Apartment
     excludes them, All/Townhouse/Penthouse stay unfiltered since
     `VILLA_AREAS` only cleanly distinguishes villa-vs-not and a Townhouse/
     Penthouse can genuinely exist in either kind of area.
  4. **No duplicate-item guard**: comparing the exact same area/community/
     building against itself twice (e.g. two "Dubai Marina" rows) produced a
     real, paid AI call for a comparison with no actual second side — no
     warning shown at all. Fixed with a real pairwise dedup check
     (type+value, case-insensitive) before the AI call fires, showing a clear
     inline error instead.
  5. **Map/Drive-Times section silently dropped every building-type
     comparison item** — arguably the most relevant gap given the user's own
     framing ("مقایسه چندین ملک در ساختمانها و مناطق مختلف" — comparing
     properties across different BUILDINGS and areas): the section's
     `mappableItems` filter was `it.type!=="building"` — i.e. it explicitly
     EXCLUDED every building selection from ever appearing on the map/
     drive-times comparison, only ever plotting area/community items. A user
     comparing two specific buildings got zero map/commute context at all,
     the one comparison dimension most useful for a real buy-decision.
     Fixed: `mappableItems` is now derived by resolving each filled item to
     its real map-coordinate key first — `it.value` for area, the new
     `_cmpResolveCluster(it.value)` for cluster, `lookupBuilding(it.value,
     null).a` (the matched building's own area) for building — then keeping
     only items whose resolved key actually exists in `AREA_COORDS`. All 3
     downstream consumers (the drive-time stat boxes, the async fetch, and
     the Google Maps marker placement) updated to use the resolved
     coordinate key instead of the raw item value.
  - Verified via a real-browser Playwright test (12 checks): the
    case-mismatched "DAMAC HILLS 2" cluster now resolves to real, non-zero
    PSF data (was previously silently zero); a genuinely untracked community
    ("The World") correctly returns `null`, not fake zeros; building lookup
    resolves a real DB key; the duplicate-item guard correctly blocks two
    identical selections with a clear inline message; the Villa Property Type
    filter correctly narrows building-search suggestions to villa-area
    buildings only, and Apartment correctly excludes them (18 suggestions
    each, verified against `VILLA_AREAS` membership); a building-type item
    now resolves a real map coordinate key (previously always excluded); a
    full mocked-AI end-to-end run confirmed the prompt sent to the API
    includes the literal "NO VERIFIED DATA" label for an unresolvable item
    plus an explicit "do NOT invent"/"never invent" instruction, and the
    comparison result renders correctly in the UI — zero console errors. A
    25-tab navigation regression sweep (every Market/Portfolio/Network/
    SocialMedia/More sub-tab plus Home) confirmed zero collateral console
    errors from these changes elsewhere in the app.

- **2026-07-18 (session continuing 14, Portfolio Alerts audit — 5 real
  gaps found and fixed)**: Direct follow-up to the Health/Projections audit
  below, same conversation — user asked to review `renderAlerts()`
  (`js/app.js`, the Portfolio → Alerts sub-tab: client-side "Deal Alerts" DB
  scanner + server-backed "Email Price Watch") with the same audit-then-fix
  treatment: "Alerts رو به همین ترتیب بررسی کن". Found the most serious bug
  yet in this string of Portfolio audits:
  1. **Yield filter was dimensionally broken** — `var yld=aData&&aData.r2?
     (aData.r2/(d.p*1000)*100):null;` divided an annual rent estimate by
     `PSF × 1000`, treating a per-sqft price as if it were a total price
     (PSF isn't a price — multiplying it by an arbitrary constant doesn't
     produce one). It also always used the 2BR rent figure (`r2`)
     regardless of what the alert's own criteria implied, and the form had
     no bed-count input at all to make that meaningful. Fixed by adding a
     "Beds (for yield calc)" selector to the alert form and reusing
     `estimateBuildingRentYield()` (`js/valuation.js`, the same real,
     bed/type-aware building-level yield estimator already built in
     session 11m for Find/Smart Discovery) — fed each DB entry directly as
     its own `bData` (it already has the `{p,sc,g,a}` shape that function
     expects, no new lookup needed).
  2. **The "Type" (Apartment/Villa) filter was captured in the alert object
     but never once checked in the matching logic** — picking "Villa"
     silently returned apartment buildings too. Fixed via the same
     `VILLA_AREAS`-membership convention already used everywhere else in
     this app to infer a building's type (DB entries carry no direct type
     field, only through area classification).
  3. **A single global 12-match cap could zero out a second alert's
     results entirely** — `Array.some()` short-circuits per building on
     whichever alert matches first, so if alert #1 alone already had 12+
     matches, alert #2 would never get to show any. Rewrote the scan to
     run per-alert with its own cap (8), merging/deduping by building key
     up to a combined display cap (24) — verified two alerts (one broad,
     one narrow) both get real, non-zero representation.
  4. **Email Price Watch's "Building" field accepted anything with zero
     validation** — confirmed in `api/price-alerts.js`: a mistyped building
     name saves fine, gets a confirmation email promising "we'll email you
     when pricing moves," and the daily cron then has nothing real to
     compare against forever — a silent, invisible dead end with no
     feedback anywhere. Added a live recognition badge (green "✓ Recognized
     in {area}" via `lookupBuilding()`, or an amber "not in our database —
     double-check spelling" warning) that updates on every keystroke via a
     small dedicated DOM node updated directly (not a full `render()`, to
     avoid re-running the 9,227-entry Deal Alerts DB scan on every
     character typed) — matches the same "✓ Verified" badge pattern
     already established in the Assets tab's Add Property form.
  5. **Considered, not fixed**: a background "new match" notification for
     Deal Alerts (mirroring Health's rent-optimization notification
     pattern) was considered and rejected — Deal Alerts scans a static,
     session-local `DB` object that doesn't change between visits, so the
     set of matches for saved criteria is already fully known and shown the
     instant an alert is added; a "notify on new match" mechanism would add
     real complexity for a signal that has no actual variability to
     surface, unlike Email Price Watch's genuinely time-varying live-market
     cron. Flagged here rather than silently building something with no
     real value.
  - Verified: `node -c`; a real-browser Playwright test confirming the new
    Beds selector renders, `estimateBuildingRentYield()` produces a sane
    2-15% yield range for a real Dubai Marina building (vs. the old
    formula's arbitrary output), a Villa-type alert's simulated matches are
    ALL genuinely villa-area buildings (0 apartment leakage), two
    simultaneously-active alerts (one narrow Villa/3BR, one broad Any/
    Apartment) both receive non-zero match counts confirming the fairness
    fix, the live building-recognition badge correctly shows green for a
    real building ("Marina Gate 1") and amber for a fabricated one, and
    Remove/empty-state/Any-type-with-yield-only edge cases all render
    without throwing; a 7-tab smoke sweep confirming zero regressions
    elsewhere — zero console errors throughout.

- **2026-07-18 (session continuing 14, Portfolio Health + Projections
  audit — 8 real gaps found and fixed)**: Direct follow-up to the Assets
  tab audit below, in the same conversation — user asked for the same
  audit-then-fix treatment on Health and Projections: "حالا health و
  projection رو بررسی کن، دقیقا با همین روش، بطور کامل جهت فیکس و ارتقاء
  دادن". Read `computePortfolioHealth()`, the Opportunity Alerts loop, the
  Future Projection Simulator, and the What-If Swap Simulator in full.
  Central theme: the previous session's audit added real financial fields
  (mortgage, occupancy, actual rent) to assets, but Health/Projections were
  never updated to actually USE any of them — same "added the input, never
  wired the downstream consumer" pattern as before. Fixed in `js/portfolio.js`:
  1. **Adjacent bug found while reading the surrounding code**: the
     Assets tab's "Export Portfolio (CSV)" button called
     `computeSustainabilityScore(a.building,a.area,null,...)` — a hardcoded
     `null` for `bData`, meaning the EXPORTED sustainability column was
     always the area-wide average, worse even than the exact-match bug
     already fixed elsewhere in this file (which at least attempted a
     lookup). Fixed to use `lookupBuilding()`, same as everywhere else.
  2. **`computePortfolioHealth()` rewritten to value-weight every
     component** — previously a plain `reduce/length` average, so one
     AED 20M asset and nine AED 200K ones counted equally toward the
     portfolio's yield/ROI/liquidity/turnover/margin-of-safety scores, even
     though ~95%+ of real capital sits in the large one. New `wAvg()`
     helper weights each asset's contribution by its own
     `currentValue/totalValue` share. Verified with a synthetic portfolio
     (one huge low-yield asset + 5 tiny high-yield ones) — the weighted
     yield (4.5%) came out far below the old-style plain average (13.7%),
     correctly reflecting where the capital actually is.
  3. **Leverage risk folded into the Risk-Return score** — the composite
     Health Score had zero awareness of debt even after mortgage became a
     real field; a 100%-leveraged and an all-cash portfolio at the same
     nominal yield scored identically, understating the leveraged one's
     real risk (rate exposure, refinancing risk, margin calls). New
     portfolio-wide `avgLTV` (`totalMortgage/totalValue`) subtracts a
     penalty (0/5/10/18 at 50/65/80%+ LTV) from the Risk-Return score, and
     the health `insight` text calls out high leverage by name when it's
     the binding constraint. `health.avgLTV` is now also part of the
     returned object. Verified: two otherwise-identical single-asset
     portfolios (one with a mortgage, one without) — the leveraged one
     scored a lower Risk-Return (61) than the all-cash one (71).
  4. **Type diversification changed from a binary flag to real HHI
     concentration math** — previously just `hasBoth` (Apartment present
     AND Villa/Townhouse present → flat 88, else flat 55), completely blind
     to a 95/5 lopsided split scoring the same as a genuine 50/50 one, and
     unable to reward 3+ distinct types at all. Now uses the exact same
     Herfindahl-Hirschman concentration formula already used for AREA
     diversification, applied across every distinct `type` actually present.
  5. **"Vacant Property" alert added** — the `occupancy` field added last
     session had no downstream consumer at all; a property marked Vacant
     produced zero signal anywhere. New Opportunity Alert flags it with the
     area's estimated lost rent.
  6. **"Lease Expiring Soon" alert added** — the lease-end date was only
     ever a passive pill on the collapsed Assets card; Opportunity Alerts
     (the tab whose whole purpose is actionable "something needs attention"
     signals) had nothing. New alert fires within 60 days of `leaseEnd`.
  7. **Future Projection Simulator now shows Projected Net Equity, not just
     gross value** — a leveraged investor's actual wealth grows faster in
     percentage terms than the underlying asset (the entire point of using
     a mortgage), but the simulator only ever projected gross asset value.
     Added a disclosed "Net Equity" line per year (projected value minus
     today's outstanding mortgage — conservatively assumes the balance
     stays flat, since no amortization schedule is collected from the user;
     a footnote says so explicitly), shown only when leverage exists.
  8. **What-If Swap Simulator now deducts the seller's real outstanding
     mortgage from Sale Proceeds (Net)** — previously subtracted only the
     4% DLD + 2% agent transaction fees, never the loan balance the seller
     must actually pay off at closing, materially overstating "Buy Power"
     for any leveraged asset being swapped. Floored at 0 (an underwater
     sale correctly can't yield negative reinvestable cash) and the "Sale
     Proceeds (Net)" card now discloses the mortgage-payoff deduction by
     name when it applies.
  - Verified: `node -c`; a real-browser Playwright test seeding a mixed
    portfolio (one large ~68%-LTV leveraged asset, several small unleveraged
    ones, one Vacant, one Rented with a lease ending in 30 days) confirming
    both new alerts render, `computePortfolioHealth()`'s `avgLTV` field
    computes correctly, and the leverage penalty measurably lowers the
    Risk-Return score vs. an identical all-cash comparison; a dedicated
    value-weighting test proving the yield score is dominated by the large
    asset's real share of capital, not asset count; a full What-If Swap
    simulation selling the leveraged asset confirming the exact expected
    net-proceeds figure (transaction fees + mortgage payoff both deducted,
    floored at 0 for the underwater case) appears correctly in the rendered
    UI; a backward-compatibility test feeding OLD-SCHEMA assets (no
    mortgage/occupancy fields at all, simulating pre-existing user data)
    confirming `computePortfolioHealth()` still computes cleanly with
    `avgLTV:0`; a single-asset edge-case test (both area and type
    concentration degenerate to n=1) confirming no crash; and a 7-tab smoke
    test confirming zero regressions elsewhere — zero console errors
    throughout.

- **2026-07-18 (session continuing 14, Portfolio Manager audit — 9 real
  gaps found and fixed)**: Direct follow-up to the Personal Advisor rebuild
  below — user asked for a full review of Portfolio → My Assets: "آیا ورودی
  های این بخش کافیه و... یک پورتفولیو منیجر واقعی است؟" (are this section's
  inputs sufficient, and is it a genuine portfolio manager?). Answered
  directly: no — it was a very good VALUATION TRACKER (every asset
  re-valued live via the same engine as the Analyzer) but not a real
  portfolio MANAGER, because it never captured the user's actual financial
  position — only model estimates. Found and reported 9 concrete gaps;
  user's explicit instruction: "همرو به ترتیب اصلاح کن" (fix all of them,
  in order). All 9 fixed in `js/portfolio.js` (+ 1 in `js/app.js`):
  1. **Mortgage field added, closing a real dead-reference bug**: the
     "Equity Release" opportunity alert has referenced `a.mortgage` since it
     was first built, but no form field ever set it — releasable equity was
     always computed as if every property had zero debt. Added an
     "Outstanding Mortgage (AED) — optional" field; `computeAssetMetrics()`
     now returns real `mortgage`/`netEquity`, and both the per-asset panel
     and the Portfolio Overview show a Net Equity / Outstanding Mortgage row
     (only when leverage exists, so an all-cash portfolio stays uncluttered).
  2. **Actual rent field added**: previously every yield/return figure used
     a pure area-model rent estimate with no way to enter what the owner
     actually collects — the "Annual Rent (Est.)" label was honest, but
     there was no path to make it real. Added "Actual Annual Rent (AED) —
     optional"; `computeAssetMetrics()` now uses it for gross/net yield when
     present (`rentIsActual`), exposes the model estimate separately
     (`estRent`) for comparison, and the per-asset label switches to
     "Annual Rent (Actual)". The "Rent Optimization" alert was rewritten to
     match — it previously recomputed the exact same benchmark locally and
     compared it against itself (so it could never actually flag
     under-renting); now it compares the real actual rent against the area
     benchmark, or — if no actual rent is on file — shows a neutral
     call-to-action to add one instead of a misleading always-100% result.
  3. **Sold/Exit tracking added**: "Remove Asset" was previously the only
     option, meaning a real sale had no way to be recorded — just deleted.
     New "Mark as Sold" action (asset `status`/`salePrice`/`saleDate`) keeps
     the record as history instead of erasing it. Active vs. sold assets
     are now split at the top of `renderPortfolio()` (`activeAssets`/
     `soldAssets`) — Portfolio Overview/Health/Projections/AI Analysis/the
     Home-page summary all compute from `activeAssets` only, so a sold
     property no longer inflates "Total Value" or yield figures for
     something no longer held. A new "◆ Sold Properties — Realized Gains"
     section lists each sale with its realized P&L (sale price − cost
     basis) and a permanent-delete option for purging old records.
  4. **Edit capability added**: previously Add/Remove only — a typo in
     floor or size meant deleting and re-adding the whole property. New
     "Edit" button pre-fills the Add Property form from the real stored
     asset (`ps._editingId`) and the submit button becomes "SAVE CHANGES,"
     updating the existing record in place instead of pushing a duplicate.
  5. **Real, independent bug fixed — Home page portfolio summary was always
     wrong**: `renderHome()` (`js/app.js`) read `a.price`/`a.rent` to build
     the "Your Portfolio" card, but a stored asset has neither field (the
     real field is `purchasePrice`, and rent was never persisted anywhere)
     — so this card showed **AED 0.00M** for every user regardless of their
     real portfolio. Fixed to call the same `computeAssetMetrics()` the
     Assets tab itself uses (cross-file call, safe since it only runs after
     every module script has loaded), summed over active (non-sold) assets.
  6. **Sustainability Score exact-match bug fixed** (3 call sites): the
     Portfolio Overview average, the per-asset expanded panel, and the
     Renovation ROI grade lookup all used `DB[(a.building||"").toLowerCase()]`
     — an EXACT key match against free-typed building names, so almost any
     real building name (this form has no dropdown) silently fell back to
     the area-wide average — the same bug class already fixed for Find/Deal
     Scoring in session 11m, just never caught here. All 3 now use
     `lookupBuilding()`, the same fuzzy matcher `computeAssetMetrics()`
     itself already uses via `computeAdjustedPSF()` — so the Sustainability
     Score now agrees with the rest of the asset's own numbers.
  7. **Parking + Bathrooms inputs added**: `parking` already fed
     `computeAdjustedPSF()`'s parking-space premium but had no manual input
     (only ever set via the AI Smart Bar); added a real Parking Spaces
     select + a Bathrooms number field (bathrooms is informational only,
     doesn't affect valuation — added for completeness since the AI
     field-mapper already expected it).
  8. **Real acquisition costs added**: new "Other Costs Paid (AED) —
     optional" field (agency fee, DLD fee, renovation, etc. actually paid)
     now feeds a real `costBasis` (purchase price + extra costs) used for
     both unrealized P&L and ROI — previously ROI/P&L used the raw purchase
     price only, understating true cash invested for anyone who entered
     real acquisition costs.
  9. **Occupancy status + lease-end date added**: new Occupancy select
     (Not Specified / Owner-Occupied / Rented / Vacant) shown as a pill on
     the expanded panel; picking "Rented" reveals an optional Lease End
     Date field, which shows a "Lease ends in Nd" warning (amber) once
     within 60 days — closes the "when does this need renewing" gap that
     had no representation anywhere before.
  - Verified: `node -c` on both touched files; a real-browser Playwright
    test driving the actual Add Property form end-to-end (leveraged, rented
    asset with all 9 new fields) confirming every field round-trips
    correctly through `computeAssetMetrics()` (mortgage/netEquity,
    rentIsActual/rent picking the real value over the estimate, costBasis
    = purchasePrice + extraCosts) and renders correctly in the live DOM
    (Net Equity row, "Annual Rent (Actual)" label, lease-end warning); a
    full Edit-flow test (click Edit → form pre-fills real stored values →
    change floor → Save Changes → confirms exactly 1 asset still exists,
    updated in place, not duplicated); a full Mark-as-Sold test (mocked
    `window.prompt` for price/date → asset flips to `status:"Sold"` → the
    Sold Properties section renders the realized gain → Portfolio Overview
    correctly disappears since 0 active assets remain); a real bug caught
    by this same test run before shipping — removing the old, mislabeled
    `actualRent` local variable broke the separate "Airbnb vs Long-term"
    alert section, which still referenced it, throwing a live
    `ReferenceError` — fixed by pointing that section at `a.m.rent`
    directly; a 500-building sweep through `computeAssetMetrics()` with a
    real building per iteration confirming zero crashes; and a
    backward-compatibility test feeding an OLD-SCHEMA asset (missing every
    new field entirely, simulating a real user's pre-existing localStorage
    data) confirming it still computes cleanly with sensible defaults
    (mortgage 0, rentIsActual false, costBasis = purchasePrice) — zero
    console errors throughout.

- **2026-07-18 (session continuing 14, Personal Advisor rebuilt into a
  genuinely grounded, data-accurate advisory tool + Home page placement)**:
  Direct follow-up to the Track Record removal below, in the same
  conversation — user asked to discuss Personal Advisor's own architecture
  ("Advisor چطور ابزاری هست؟ معماری و مهندسی حضورش به چه شکل؟"). Investigation
  found a real accuracy gap: `_paAdvise()` (`js/portfolio.js`) computed a
  real, deterministic top-10 area shortlist (yield/growth/PSF-fit scoring,
  weighted by goal+priority), but then let the AI **freely invent** the
  `bestEntry` price range, the `buildingTip` (a specific building
  recommendation), and the 3-year `scenario` percentages in its JSON reply —
  exactly the AI Agents accuracy bug already fixed once before (session 11j,
  `js/chat.js`), just never applied here. A `buildingTip` naming a
  nonexistent or wrong-area building on the very first screen an undecided
  visitor sees was a real, live risk to the platform's core credibility
  promise (Directive #2). User's explicit final instruction: fix it into "a
  smart tool and real Advisor" for people who don't know what they want,
  add whatever extra inputs a real property manager would ask for, put it on
  the Home page, and connect RAG (which turned out to already be wired in
  via `askAI(..., groundQuery, groundAreas)` — confirmed, no work needed
  there).
  - **`js/portfolio.js` — `_paAdvise()` rewritten**: the AI's JSON contract
    now explicitly forbids `bestEntry`/`buildingTip`/`scenario` ("those are
    computed separately from verified data, not written by you"). After
    parsing, a post-processing pass splices in the real values for every
    returned area: `bestEntry` via the existing `computeAreaPriceRange()`
    (`js/market.js`, the same grade-weighted hedonic range engine the
    Analyzer itself uses); `scenario` via the same netYield+growth/3
    total-return formula `computeValuation()` already uses, summed over a
    real 3-year window from the area's own `y`/`g` bands (conservative =
    yield only, base = yield + 3yr growth, optimistic = yield + the better
    of 3yr/5yr-scaled growth); `buildingTip` is only kept if the AI's
    suggested name resolves via the real `lookupBuilding()` AND the matched
    building's own area equals the recommended area — otherwise it's
    silently replaced by `_paPickRealBuilding()` (new helper — picks the
    real, actually-in-DB, highest-grade building for that area, or `null`
    if none exists, never a fabricated name). Verified via a Playwright test
    that fed a deliberately fake building name ("Completely Made Up Tower
    That Does Not Exist") through a mocked AI response — confirmed it never
    reaches the rendered page, and a real building is substituted whenever
    one exists for that area (confirmed `null` — not a fake fallback — when
    an area genuinely has zero tracked buildings, e.g. some of the ultra-
    granular DLD sub-community names).
  - **3 new optional Step-3 inputs** (Timeline, Financing, Nationality —
    `mkPillRow()` helper) — feed real UAE mortgage LTV rules (same
    constants as `js/mortgage.js`: 70/80% max LTV expat/national under 5M,
    65/75% at ≥5M) into a new `_paCashRequired()` helper, so when a user
    picks "Need Mortgage," each recommended area now shows a real "Cash
    Needed To Close" figure (down payment + 4% DLD fee + 2% agency + 0.25%
    mortgage registration), not just an asking-price range. Timeline and
    Nationality are passed to the AI as narrative context only (never
    compute a hard number from them) so the profile/DNA/tagline prose can
    reference them without inventing figures.
  - **Existing portfolio integrated into scoring**: reads
    `localStorage.getItem("dubaival_portfolio")` directly (not
    `window.PORTFOLIO_STATE`, which is only populated once the user has
    visited the Portfolio tab this session) — areas the user already owns
    get a small diversification bonus for wealth-building goals (steered
    toward NEW exposure, not away from an area they explicitly asked about),
    and the AI prompt is told what's already owned so the profile narrative
    can reference it.
  - **Home page CTA added** (`renderHome()`, `js/app.js`): new "④ PERSONAL
    ADVISOR CTA" section ("Not sure what you're looking for?") between Top
    Opportunities and the Market Cycle widget — the one Home section aimed
    at visitors who don't yet have a specific building/area in mind, unlike
    every other Home section which assumes they do. Clicking it navigates
    straight to Market → Advisor. Trailing sections renumbered (Market Cycle
    ④→⑤, Portfolio ⑤→⑥, Recent Activity ⑥→⑦) to keep the code comments
    accurate; `dv-fu-5` fade-up animation class (already defined in this
    file's CSS, previously unused past `dv-fu-4`) now used for Market Cycle.
  - Verified: `node -c` on all 3 touched files; a Playwright test driving
    the complete wizard end-to-end (goal → priority → budget/beds → the 3
    new pill rows, clicked as real buttons, not just state mutation →
    mocked AI response) confirming `bestEntry`/`scenario`/`cashRequired` are
    always the app's own computed values and never AI text, and the fake
    AI-authored building name never appears anywhere in the rendered DOM; a
    second Playwright test confirming the Home CTA renders, is clickable,
    and navigates to Market/Advisor; a 9-tab smoke test (Dashboard/
    Analyzer/QuickCheck/Index/Find/Advisor/News/Portfolio/Deals/Home)
    confirming zero regressions from the renumbering edit — zero console
    errors throughout.

- **2026-07-18 (session continuing 14, Track Record tab removed pending
  real automation)**: User asked, bluntly, what the Track Record tab
  ("a tab with a few lines of numbers") actually does. Explained honestly:
  it backtests the valuation model against 18 hand-picked real 2025 DLD
  sales (median error / % within ±10%/±20%), a legitimate trust-building
  concept — but weak in its CURRENT form (static, never refreshed, and
  hand-picked rather than a random/unbiased sample, which undercuts the
  very credibility it's meant to build) and poorly placed (an isolated tab
  most users never find, when the moment it actually matters is while
  someone's deciding whether to trust a specific Analyzer result). User
  asked what full automation would require, and — sharper — whether even a
  perfectly automated version would be a genuinely useful TOOL or just
  "proof we show to others." Answered directly: even automated, this
  remains fundamentally a one-time credibility instrument (like a fund's
  published track record) — nobody returns to it repeatedly the way they
  do Analyzer/Portfolio, so automating it makes the credibility claim more
  honest, not more "useful" in the task sense. User's decision: bring it
  into the Analyzer eventually, but show NOTHING (neither the tab nor
  anything inside Analyzer) until it's genuinely automated on a real,
  unbiased, continuously-growing transaction sample.
  - **Fix, this session**: removed `{id:"TrackRecord",...}` from
    `NAV_SECTIONS` (`js/core.js`) and its routing branch in `js/app.js`'s
    `render()`. `renderTrackRecord()` itself (`js/market.js`) is left in
    place, unreferenced, with a new comment explaining exactly why it's
    dormant and what replaces it later (see the new "Removed sub-tabs"
    note directly under the frozen nav table above) — its CASE_STUDIES-
    scoring logic (`computeValuation()` vs. real sold price) is exactly
    what a future automated version should reuse against a real
    accumulating sample, not something to rewrite from scratch.
  - Verified: `node -c` on all 3 touched files; a Playwright test
    confirming `NAV_SECTIONS` no longer lists `TrackRecord`, no "Track
    Record" pill renders in the Market sub-tab bar, and the neighboring
    Analyzer/Quick Check tabs still route and render correctly (no
    collateral routing regression) — zero console errors. Re-ran every
    other test built this session (hero photos, Arabic-toggle removal,
    News header/banner change, Find live-listings merge) — zero
    regressions.

- **2026-07-18 (session continuing 14, small follow-up — Live Listings now
  checks PropertyFinder too, not just Bayut)**: User asked directly why the
  new "Live Listings in Top Matches" section (see entry below) only
  searched Bayut when the main live-search elsewhere in Find already
  queries both Bayut and PropertyFinder in parallel. Fair catch — it was a
  scope/time tradeoff during the initial build, not a technical limitation.
  Extended `_fetchLiveListingsForBuilding()` (`js/app.js`) to fetch both
  providers in parallel per building (same `Promise.allSettled` pattern
  `doSearch()` already uses), reusing PropertyFinder's existing defensive
  multi-shape response parsing (`getPFLocationId()`, the same
  several-possible-field-names handling already established for the main
  search). Each source's listing is independently confirmed against the
  building's own name before being kept, and both are scored via the same
  `_dealScoreBand()` using the building's already-known metrics. Total
  bounded to 4 combined results per building; live-search calls bounded to
  5 buildings × 2 providers = 10 per Discover click (still small, rate-
  limit-safe).
  - Verified: `node -c`; extended the Playwright test to mock BOTH
    `properties/list` (Bayut) and `search-sale` (PropertyFinder) — confirmed
    a real, confirmed listing from EACH source now renders (with correct
    source badges), the empty-building note still works for buildings with
    neither, and the overpricing score-cap fix from the entry below applies
    correctly to both sources — zero regressions on the rest of the
    session's test suite (hero photos, Arabic-toggle removal, News change).

- **2026-07-18 (session continuing 14, Find — connected the Advanced
  Market Screener to real, purchasable inventory)**: User raised a sharp,
  correct product critique after being asked to spot-check "Live Market
  Finder" (a flagged-but-unverified item): Find's live listing search (Ask
  in Natural Language + Quick Filters) is trivially redundant with just
  visiting Bayut/PropertyFinder directly, and the Advanced Market Screener
  — while genuinely differentiated (screens the internal 9,226-building
  calibrated database by real investment metrics no listing site
  publishes) — returns a disconnected list of BUILDINGS with no link to
  whether anything is actually for sale in them, which is useless to
  someone using Find to locate an actual unit to buy, not do abstract
  research (a job Market Index/Compare/Personal Advisor already cover).
  Discussed the logic at length before writing code; user approved merging
  the two mechanisms, and explicitly asked whether to go further — agreed
  the merge alone is the right scope, resisting extra bells (inline
  mortgage calc, competitor comparisons) as clutter without matching value.
  - **Real, independent bug found and fixed along the way**: `scoreDealQuality()`
    (the "Deal Score" already shown on every live listing card) tried a
    building match via `DB[(r.title||"").toLowerCase()]` — an EXACT-match
    lookup against a raw listing title like "Luxury 2BR Apartment For Sale
    in Marina Gate 1" that can essentially never hit a DB key, so every
    listing's PSF was silently being compared against the AREA-WIDE average
    instead of its own building's calibrated PSF — the identical class of
    bug already fixed for building-level yield elsewhere in this app
    (2026-07-13, session 11m). Fixed by reusing the already-safety-hardened
    `lookupBuilding(name,areaHint)` (fuzzy substring/word matching,
    area-hinted to avoid false cross-area matches) instead — a full listing
    title now correctly resolves to its real building. Extracted the
    repeated score-band thresholds into a new shared `_dealScoreBand(psfRatio,
    avgYield,growth1yr,dom,sc,grade)` helper used by both `scoreDealQuality()`
    and the new per-building live-fetch below, so the two paths can't drift
    apart on the same magic numbers.
  - **Second bug found by the session's OWN test, before shipping**: an
    initial version let a listing priced 105% above its own building's
    calibrated PSF still sum to "99/100 Excellent," since the additive
    yield/growth/dom/sc/grade bonuses (up to +62, describing the BUILDING)
    easily outweighed the -10 PSF-ratio penalty (describing THIS unit's own
    price). Fixed by capping the score ceiling when badly overpriced
    (`psfRatio>1.30` → capped at 35, `>1.15` → capped at 55) — price quality
    now gates the ceiling instead of being purely additive, so an
    overpriced listing can never misleadingly read as a good deal no matter
    how strong the underlying building/area is.
  - **The merge itself**: on "DISCOVER PROPERTIES," after the Screener
    computes and sorts qualifying buildings exactly as before (unchanged),
    the top 5 results now get a SEQUENTIAL (rate-limit-safe, bounded — not
    a batch fetch across all 50) live Bayut search scoped to each specific
    building (`_fetchLiveListingsForBuilding()`, new). A raw hit is only
    kept if its own title/location text actually mentions the building name
    (a location-ID match can be community-wide, not building-specific) —
    each confirmed listing's Deal Score is computed directly from that
    building's OWN already-known metrics (psf/yield/growth3/dom/sc/grade —
    the exact numbers the Screener already resolved and displayed), not a
    second fuzzy re-derivation. Results render in a new "Live Listings in
    Top Matches" section (`js/app.js` `renderFind()`) using the exact same
    polished card component as the main search (photo, Deal Score, agent
    contact/WhatsApp, "View on Bayut," "Analyze Deal →") — factored the
    previously-inline card-building code into a shared `_renderListingCard(r)`
    function so both call sites stay identical, not two drifting copies.
    Every card also now shows a plain-language transparency line ("12%
    below this building's calibrated PSF (AED 1,850)" / "+8% above the
    Dubai Marina average PSF (AED 1,650)") so the Deal Score is never just
    an unexplained number.
  - **Honest empty-state, no fabricated notification promise**: a
    qualifying building with zero live listings shows one compact line
    ("No live listings currently in: Building A, Building B") rather than
    either hiding the gap or promising a "get notified" hook — deliberately
    NOT wired to the project's pre-existing Price Alert/`watch-subscribe`
    infrastructure, since a repo-wide grep found zero client-side references
    to it anywhere (`js/portfolio.js`'s own "Alerts" tab is a different,
    in-app-computed "Opportunity Alerts" feature, not the same system) —
    building a new promise on top of infrastructure that may not actually be
    wired up live would risk shipping a broken-looking feature.
  - Verified: `node -c`; a mocked-fetch Playwright pass driving the ACTUAL
    Discover flow end-to-end (real DB data, mocked Bayut/auto-complete
    responses) — confirmed the building list computes correctly, exactly 5
    sequential live-search calls fire (bounded, not one per building in the
    full 50-row list), a confirmed listing for the top building renders with
    its Deal Score/PSF/transparency line, buildings with zero live listings
    correctly join the one compact empty-state line, and — the test's own
    real catch — before the scoring-cap fix, a deliberately 105%-overpriced
    mocked listing scored "99/100 Excellent"; after the fix it no longer
    does. Re-ran every other test built earlier this session (hero photos,
    Arabic-toggle removal, News header/banner change) — zero regressions.
  - **Not done this session, deliberately, per the user's own "don't add
    more" call**: no inline mortgage/financing estimate on live-listing
    cards, no "compare to similar alternatives" widget, no automated
    price-alert subscription for empty-building cases — flagged as
    plausible future additions if real usage shows a need, not built
    speculatively now.


- **2026-07-18 (session continuing 14, News header shortcut removed +
  News page got a hero photo)**: User asked to remove the "News" icon
  button from the top global header (a `newspaper` icon with a red
  new-article dot, `js/app.js`, distinct from the actual Market → News
  sub-tab per the frozen-nav table — this only removed the header
  shortcut, not the tab itself), framing News as a low-update-frequency
  tab that doesn't need a dedicated always-visible header icon. Asked, in
  the same message, to first add a photo inside the News page itself so
  it doesn't look bare/plain for anyone who still visits it via Market →
  News.
  - **`js/news.js`**: added a hero banner (query "Dubai skyline
    construction cranes development cinematic") at the top of
    `renderNews()`, same `_dvGetStockPhoto()`-cached, dark-overlay-with-
    text-shadow pattern already established for Home/About/Market Index —
    the title row and description paragraph now sit inside the new
    `newsBannerWrap` on top of the photo+overlay layers.
  - **`js/app.js`**: removed the header's `newsBtn` (the `newspaper`-icon
    shortcut + its new-article red dot) entirely — `renderNotifBell()`
    (unrelated, unaffected) is now the only icon in that header slot.
    Confirmed via grep that the dot's underlying `dv_news_last_visit`
    tracking is still used independently inside `js/news.js` itself
    (unread-article bookkeeping for the page's own filter counts), so
    nothing was left dangling.
  - Verified: `node -c` on both touched files; a real-browser Playwright
    pass with a mocked Unsplash response — confirmed the header icon
    button is gone, the News page's banner photo resolves and fades in
    correctly, and Market → News is still fully reachable via the normal
    sub-tab bar with its title/content rendering correctly on top of the
    photo — zero console errors.

- **2026-07-18 (session continuing 14, Arabic toggle hidden — real, honest
  bug)**: User reported switching to Arabic doesn't actually translate the
  site — text stays English, only the reading direction flips. Investigated
  and confirmed: `LANG` (`js/core.js`) only has ~60 translated keys (tab
  labels, a handful of form labels), routed through `t()`; the vast majority
  of the app's actual UI text across every tab is hardcoded English string
  literals that never go through `t()` at all. So toggling to Arabic only
  flipped `document.documentElement.dir` to RTL and translated a tiny
  fraction of labels, leaving ~95% of real text in English — a confusing
  half-translated state, exactly what the user saw. Asked directly whether a
  full site-wide translation is worth doing now; user agreed it's not needed
  yet (the target audience — investors/agents in Dubai real estate — works
  in English day-to-day regardless) and asked to hide the toggle rather than
  leave it half-broken.
  - **Fix**: removed the sidebar "Arabic"/"English" toggle item entirely
    (`js/app.js`, was the only UI trigger for `setLang()` anywhere in the
    app — confirmed via a full-repo grep). `js/core.js`'s `dvLang` init now
    always starts as `"en"` (previously read a possibly-stale `dv_lang` value
    from `localStorage`) — so a returning user who had already switched to
    Arabic in an earlier session is no longer stuck seeing the broken RTL
    layout; they're returned to the normal LTR English layout. `LANG`/`t()`/
    `setLang()` themselves are left completely in place, unused for now —
    this is the reusable foundation for a real, complete Arabic translation
    pass later (every hardcoded string routed through `t()` + a real `ar`
    dictionary entry for each), not something removed or lost.
  - Verified: `node -c` on both touched files; a real-browser Playwright
    test seeding `localStorage.dv_lang="ar"` (simulating a returning user
    stuck in the old broken state) before load — confirmed the page stays
    LTR, `dvLang` resolves to `"en"`, and the Arabic/English toggle no
    longer renders anywhere in the sidebar — zero console errors.


- **2026-07-18 (session continuing 14, further follow-up — Palm Jumeirah
  query sharpened to Atlantis The Palm)**: The top-down query still
  resolved to a plain-water/generic aerial shot rather than a recognizable
  Palm Jumeirah shot. User asked specifically for Atlantis The Palm to be
  in frame — the single most recognizable landmark on the island, more
  identifiable in a photo than the palm-tree shape alone. Bumped
  `about_hero_v4`→`v5`, query now "Palm Jumeirah Atlantis The Palm hotel
  aerial drone view".

- **2026-07-18 (session continuing 14, small follow-up — About hero photo
  swapped to Palm Jumeirah)**: User asked for the About page hero photo
  specifically to be Palm Jumeirah rather than the Dubai Marina query it
  started with. `js/about.js` — bumped `_dvGetStockPhoto` cache key
  `about_hero_v2`→`v3` and changed the query to "Palm Jumeirah aerial view
  Dubai cinematic golden hour" (keeps the same landscape-orientation,
  most-liked-result selection logic from the earlier quality fix). Home
  hero and Market Index banner queries unchanged.
  - **Same-session follow-up**: user reviewed the deployed result and noted
    the resolved photo was a low, oblique aerial angle (only the "trunk"/
    spine visible) rather than the iconic full top-down shot where the
    whole palm-tree island shape (trunk + fronds + surrounding crescent) is
    recognizable — a fair, correct call for a mascot/mission-page hero.
    Bumped the cache key again (`v3`→`v4`) and sharpened the query to
    "Palm Jumeirah top down drone view full island shape aerial" to bias
    the search toward that iconic bird's-eye composition.

- **2026-07-18 (session continuing 14, follow-up — hero photos existed but
  were invisible, real overlay bug)**: Direct follow-up to the two entries
  below, same session. User shared a phone-camera photo of the live
  deployed site showing the Home hero still just plain dark, no visible
  photo at all — investigated instead of assuming the deploy hadn't landed.
  A second screenshot (DevTools Console) confirmed `core.js?v=20260718b`
  (the latest pushed version) WAS loaded and no error mentioned Unsplash/
  Pexels/proxy-groq anywhere — ruling out both "not deployed" and "API key
  missing." Root cause: the dark overlay drawn on top of each hero photo
  (`js/app.js`/`js/about.js`/`js/marketindex.js`, added so text would stay
  readable) was 90–94% opaque — heavy enough to make almost any photo
  underneath indistinguishable from a plain dark gradient. The faint warm/
  brownish tint visible in the user's screenshot (vs. the pure navy-black of
  the very first, pre-photo version) was actually the real photo, just
  crushed almost to invisibility.
  - **Fix**: reduced all 3 overlays from ~0.80–0.94 opacity down to
    ~0.42–0.58, so the photo is now genuinely visible rather than a barely-
    there tint. To keep text fully readable at the new, much lighter overlay
    level, added `textShadow`/`filter:drop-shadow(...)` to every text
    element sitting on top of a hero photo (headline, gold-gradient word,
    description, badges, logo) across all 3 placements, and lightened a few
    muted-gray body-text colors (`#6B7A9E`→`#9BA8C8`/`#C8D2E8`) that were
    originally tuned for a near-opaque dark background, not a lighter,
    photo-backed one.
  - Verified: `node -c` on all 3 touched files; re-ran the existing mocked-
    fetch Playwright checks (still pass — photo wiring/orientation/quality-
    ranking logic untouched, only the overlay/text styling changed); and a
    new visual-regression Playwright pass rendering a synthetic gradient-
    skyline SVG data URI as the "photo" (sidesteps this sandbox having no
    outbound access to a real photo host) and screenshotting all 3
    placements — confirmed the photo is now clearly visible behind the text
    in all 3, and every text element remains fully legible against it.

- **2026-07-18 (session continuing 14, follow-up — hero photo QUALITY fixed,
  not just presence)**: Direct follow-up to the entry below, same session —
  user came back after the first pass with a pointed correction: "عکس های
  فوق العاده استثنایی استفاده کنیا" (use truly exceptional photos). Root-
  caused why the first pass could plausibly under-deliver on quality: the
  underlying `searchUnsplash()`/`searchPexels()` helpers reused from
  `js/chat.js` were built for SQUARE social-media post images and forced
  `orientation=squarish`/`orientation=square` server-side
  (`api/proxy-groq.js`, hardcoded, no client override existed) — a wide hero
  banner rendered with `backgroundSize:cover` against a square source photo
  loses most of its actual composition to cropping, and picked randomly
  among the top 3 results rather than favoring the best one.
  - **`api/proxy-groq.js`**: both `handleUnsplashSearch`/`handlePexelsSearch`
    now accept an optional `orientation` in the request body, validated
    against a small allowlist (`landscape`/`portrait`/`squarish` for
    Unsplash, `landscape`/`portrait`/`square` for Pexels — an invalid value
    falls back to the original default rather than being passed through raw).
    Defaults are UNCHANGED (`squarish`/`square`) when the field is absent, so
    every existing social-media-post caller in `js/chat.js` (which never
    sends this field) behaves identically to before — zero regression risk.
  - **`js/core.js`**: replaced `_dvGetStockPhoto()`'s reuse of the shared
    square/random-pick `searchUnsplash()`/`searchPexels()` with a new,
    purpose-built `_dvSearchHeroPhoto(query)` — requests `orientation:
    "landscape"` and a larger candidate pool (`per_page:10`, not 5), then
    picks the single MOST-LIKED Unsplash result (Unsplash's search response
    includes a real `likes` count per photo) rather than a random pick among
    the top 3 — the closest available proxy for "exceptional" from a live
    search API, and deterministic rather than lucky. Falls through to Pexels
    (which has no public like-count signal, so takes its first/most-relevant
    result) only if Unsplash returns nothing. Prefers each result's
    highest-resolution URL (Unsplash `urls.full` over `regular`; Pexels
    `src.original` over `large2x`/`large`).
  - **Cache keys bumped** (`home_hero_v1`→`v2`, `about_hero_v1`→`v2`,
    `marketindex_banner_v1`→`v2` — `js/app.js`/`js/about.js`/
    `js/marketindex.js`) so any visitor who already cached a squarish photo
    from the first pass gets a fresh landscape fetch instead of serving the
    old cached one for its remaining ~30-day TTL. Search queries themselves
    also sharpened toward more evocative, premium-feeling results ("cinematic
    aerial golden hour" / "blue hour luxury waterfront cinematic" / "aerial
    drone photography cinematic") rather than plain, generic terms.
  - Verified: `node -c` on all 5 touched files; a mocked-fetch Node test
    harness against the real `api/proxy-groq.js` handler (6 cases) —
    confirmed both providers still default to their original
    squarish/square orientation when the field is omitted (zero regression
    for existing social-post callers), correctly pass through
    `orientation:"landscape"` when supplied, correctly reject/fall back to
    the safe default on an invalid/malicious orientation value rather than
    injecting it raw into the upstream URL, and the Groq default (no
    `provider` param) code path is completely unaffected; and a real-browser
    Playwright test with a mocked multi-result Unsplash response (3 photos
    with different `likes` counts) confirming the Home hero photo genuinely
    resolves to the highest-`likes` result (not the first or a random one)
    and that the request correctly carries `orientation:"landscape"` +
    `per_page:10` — zero console errors.
  - **Nothing new needed to go live**: same `UNSPLASH_ACCESS_KEY`/
    `PEXELS_API_KEY` env vars already configured, no new setup.

- **2026-07-18 (session continuing 14, first real photos added to the site)**:
  User pointed out the site had zero real images anywhere ("میگم ما اصلا تو
  سایت تصویر نداریم") right after finishing a batch of pending SQL
  migrations, and asked for a recommendation on how many/where to add
  quality images. Scoped to a small, deliberately conservative set — "a few
  quality images" (چندتا), not a per-area/per-card gallery — to stay within
  free-tier rate limits (Unsplash/Pexels) and avoid scope creep.
  - **New shared helper**: `_dvGetStockPhoto(cacheKey, query)` in
    `js/core.js` — reuses the EXISTING platform-level `searchUnsplash()`/
    `searchPexels()` functions (`js/chat.js`, built the previous session for
    the zero-touch-onboarding shared-key migration — no new API surface, no
    per-user key). Caches the resolved URL in `localStorage` for 30 days per
    `cacheKey`, so a given hero section only makes one live API call per
    visitor per month, not on every page load (protects the shared
    Unsplash/Pexels rate limit). Resolves to `null` (never throws) if both
    providers are unavailable — every call site treats `null` as "keep the
    existing gradient/solid background," so this can never break a page.
    Safe to call from any file despite `core.js` loading before `chat.js`
    in `index.html`'s script order, since all module scripts are `defer`red
    and this helper is only ever invoked later, inside a render function
    that runs after every deferred script has already executed and defined
    its globals (same cross-file-call safety already established elsewhere
    in this codebase).
  - **3 placements, each a real photo faded in behind a dark gradient
    overlay so existing text stays fully readable** (never a raw, unfiltered
    photo that could clash with content on top):
    1. **Home hero** (`js/app.js` `renderHome()`) — "Dubai skyline Burj
       Khalifa sunset skyscrapers".
    2. **About page hero** (`js/about.js` `renderAbout()`) — "Dubai Marina
       skyline architecture waterfront". The hero block gained
       `position:relative`/`overflow:hidden`/rounded corners/a border to
       actually hold a background photo (previously just plain centered
       text with no container); the logo/subtitle/heading/mission text were
       moved into a new `abtHeroContent` wrapper (`zIndex:1`) sitting above
       the photo+overlay layers.
    3. **Market Index banner** (`js/marketindex.js` `renderMarketIndex()`)
       — "Dubai Business Bay towers aerial real estate". The existing
       header (title/date/LIVE badge) was wrapped in a new `bannerWrap`
       container holding the photo+overlay behind it — the header's own
       content and styling are otherwise unchanged.
  - Verified: `node -c` on all 4 touched files; a real-browser Playwright
    test with a mocked `/api/proxy-groq?provider=unsplash` response (so the
    wiring could be verified end-to-end without a real API key in this
    sandbox) — confirmed all 3 photo layers correctly resolve the mocked
    URL into their `backgroundImage` and fade to `opacity:1`, and that the
    Market Index header's own text still renders correctly on top — zero
    console errors.
  - **Nothing else needed to go live**: this reuses the exact same
    `UNSPLASH_ACCESS_KEY`/`PEXELS_API_KEY` env vars + `/api/proxy-groq`
    proxy the user already configured in Vercel for the previous session's
    Social Media Manager work — no new setup, no new cost beyond what's
    already provisioned.

- **2026-07-17 (session 14, directive #4 category 1 shipped — Gemini/
  Unsplash/Pexels/ElevenLabs moved fully to a platform-shared server proxy,
  Profile Panel consolidation)**: Direct continuation of the Gemini-gap
  finding above, per the user's explicit "همین الان انجام بده" (do this part
  now) — only the Meta OAuth/App-Review piece (category 2) is deferred to
  tomorrow; this shipped tonight in full.
  - **`api/proxy-groq.js` extended** (not a new file — Vercel Hobby's
    12-function ceiling — this file's job broadened from "Groq chat proxy"
    to "shared AI/content proxy," documented as such in a new top-of-file
    comment) with a `?provider=` switch: `gemini` (text + image generation
    via `gemini-2.0-flash`/`gemini-2.0-flash-exp`, `GEMINI_API_KEY`),
    `unsplash` (`UNSPLASH_ACCESS_KEY`), `pexels` (`PEXELS_API_KEY`),
    `elevenlabs` (text-to-speech, `ELEVENLABS_API_KEY` — returns
    base64-encoded audio in a JSON body, since a Vercel function returns one
    JSON-compatible response, not a raw stream; the client decodes it back
    into a Blob). No `provider` param keeps the original Groq behavior
    100% unchanged (default branch, zero risk to the existing, already-
    working chat proxy).
  - **`js/chat.js`**: migrated every direct-to-Gemini call site (16 — AI
    image generation, AI-written captions/subtitles, translation, hashtag
    intelligence, HSO generator, bulk 30-day post generator, story
    templates, emoji suggestions, A/B caption testing, HSO slide extraction
    with Groq fallback, avatar image generation, etc.) off
    `localStorage.getItem("dv_gemini_key")` and the direct
    `generativelanguage.googleapis.com` URL, onto the new proxy — done as a
    mechanical, minimal-diff URL substitution (`replace_all` on the exact
    identical URL string across all 15 `gemini-2.0-flash` sites, one more
    for the `gemini-2.0-flash-exp` image-gen site) so the surrounding
    request/response-parsing code needed zero changes. Removed every
    now-dead `if(!geminiKey)...` early-return/alert gate (8 identical
    single-line guards removed in one pass, the rest individually since
    each had different surrounding logic — 2 were actually "try Gemini
    first, else fall back to Groq/Unsplash" branches, which now always
    attempt Gemini first since the platform proxy is always available
    rather than being conditional on a personal key). Same treatment for
    `searchUnsplash()`/`searchUnsplashMulti()`/`searchPexels()`/
    `searchPexelsMulti()` (4 functions) and `speakVoiceoverEL()` (ElevenLabs
    voiceover) — the latter also removed 2 now-unnecessary "no ElevenLabs
    key — add one or skip narration" gates (one was a whole confirmation
    screen, `_renderNarrationGate()`, deleted entirely since asking a user
    to "add a free ElevenLabs key" is exactly the manual step this
    directive eliminates; narration now just always attempts, and
    gracefully falls back to the existing `speakVoiceoverFallback()` if the
    operator hasn't set `ELEVENLABS_API_KEY` yet — same as before, just no
    longer keyed off a personal credential).
  - **`api/auto-post.js`**: `findImageForPost()` (used by the scheduled
    auto-posting cron to pick an image when a post has none) switched from
    each user's own `social_credentials.pexels_key` to the same platform-
    level `PEXELS_API_KEY` env var — this was a real, independent instance
    of the same problem on the SERVER side, not just the client tools.
  - **Every trace of the 4 keys removed from BOTH user-facing surfaces**:
    `js/app.js` `renderProfilePanel()`'s whole "AI API Keys" section (Groq/
    Gemini/Unsplash/Pexels fields) deleted outright — not kept as an
    optional override, per the user's explicit "nothing should be
    available to users" — and `js/chat.js` `showSocialSetup()`'s
    corresponding 4 field definitions (Unsplash/Pexels/Gemini/ElevenLabs
    key+voice) removed, plus the now-pointless `pexels_key` column from the
    `_syncCredsToServer()`/`_syncCredsFromServer()` push/pull payloads and
    the dead `pexels` field from `getSocialCreds()` (confirmed unused
    anywhere via grep before removing).
  - **Consolidation into ONE user-facing settings surface, per the user's
    explicit, repeated instruction** ("فقط همون موارد مربوط به کاربر بمونه
    سمت سایت که اونم همگی تو قسمت پروفایل باشه" — only user-related items
    stay on the site, and they should ALL be in the Profile section):
    `showSocialSetup()`'s remaining real fields — WhatsApp Business
    Token/Phone Number ID/WABA ID, Meta Ads Pixel ID/Conversions API Token,
    plus 2 YouTube fields (Client Secret, initial Access Token) that
    Profile Panel was missing — were moved into `renderProfilePanel()`
    using the EXACT SAME localStorage keys already in use, so anything a
    user had already entered pre-fills automatically with zero data loss
    (verified explicitly, see below). The WhatsApp pay-per-window credit
    balance + "Buy Credit" row (previously only shown inside the separate
    Social Setup modal) moved along with it. `showSocialSetup()` itself is
    now a 3-line redirect (`showProfilePanel=true;render();`) rather than
    being deleted outright, since multiple call sites across `js/chat.js`
    still reference it by name — this way none of them needed to be
    individually hunted down and changed.
  - **Explicitly NOT touched tonight** (per the user's own sequencing —
    Meta App Review is tomorrow): WhatsApp Business Token/Phone ID/WABA ID
    and Meta Ads Pixel ID/CAPI Token fields themselves are STILL manual-
    paste fields (just relocated, not yet OAuth-automated) — that migration
    needs the operator's Meta App Review to complete first, per directive
    #4's existing text above. Also not touched: the pre-existing LinkedIn/
    Twitter/TikTok manual-paste fields (same category-2 reasoning), and a
    pre-existing, unrelated small inconsistency noticed in passing —
    Profile Panel's LinkedIn URN field is labeled "Organization URN" while
    the old Social Setup version called the identical `dv_linkedin_urn` key
    "Person URN" — flagged here rather than guessed at and silently changed.
  - Verified: `node -c` on all 4 touched files; a mocked-fetch Node test
    harness against the real `api/proxy-groq.js` handler (12 cases) —
    Groq's default (no `provider` param) behavior is completely unchanged;
    Gemini generate returns real candidates using the platform key (never
    exposed to the client) with the correct model in the URL; a disallowed
    model is rejected; a missing `GEMINI_API_KEY` 500s with a clear message;
    Unsplash/Pexels search both return real results using the correct
    server-side auth header; ElevenLabs returns valid base64-encoded audio
    that decodes correctly; an overlong ElevenLabs text 413s; a GET request
    is rejected — all PASS; the pre-existing OTP (18 checks) and Meta-
    conversion (12 checks) test suites re-run with zero regressions,
    confirming this refactor didn't disturb unrelated features; and a
    dedicated real-browser Playwright test (13 checks) that pre-seeded
    localStorage with realistic "already configured in a previous session"
    values (Instagram token, WhatsApp Business token/phone ID, Meta Pixel
    ID, LinkedIn token, YouTube client ID, and — deliberately — old, now-
    unused Gemini/Pexels keys) before loading the app: confirmed every one
    of those values renders pre-filled in the consolidated Profile Panel
    (nothing reset to blank), confirmed the AI API Keys section and its
    Groq/Gemini fields are gone, confirmed the old unused Gemini/Pexels
    localStorage values are still readable afterward (proving no
    `removeItem` ever touched them), and confirmed calling
    `showSocialSetup()` now opens the Profile Panel with no second modal
    appearing — zero console errors.
  - **Manual steps required before this is fully live**: set
    `GEMINI_API_KEY` (may already be set for the RAG pipeline — the same
    key works for generation too), `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`,
    and `ELEVENLABS_API_KEY` in Vercel env vars. Until each is set, that
    specific tool degrades gracefully exactly like every other Meta/API-
    gated feature in this project (Gemini tools return a clear 500 rather
    than crash; ElevenLabs narration silently falls back to the existing
    music-only path; Unsplash/Pexels image search simply returns no
    results, and the app's other free image sources still work).

- **2026-07-17 (session 14, follow-up — OTP made genuinely zero-typing: a
  WhatsApp button tap or an email magic link, not just a typed code)**: User
  asked directly, right after the OTP system above shipped, whether a user
  could connect "without receiving an OTP" at all — just enter phone/email/
  account, click Connect, and have it auto-connect with no manual step.
  Answered honestly rather than overpromising: for SOCIAL ACCOUNTS (Instagram/
  Facebook/WhatsApp Business/etc.), yes — that's exactly what OAuth "Connect
  X" achieves (the user clicks Connect and approves on that platform's own
  screen, no typing at all; this is the directive #4 target, still pending
  Meta App Review). For phone/email specifically, SOME proof of ownership is
  unavoidable in principle (that's what "verification" means, and a $0-effort
  phone/email field would let anyone type someone else's contact info) — but
  the typed 6-digit code can be replaced with a genuine single TAP, matching
  what the user was actually asking for. Built both:
  - **WhatsApp: tap "✅ This is me," zero typing.** New `button_token` column
    (`otp_verifications`) plus `sendWhatsAppOtpTapTemplate()` (`api/inbox.js`)
    — sends a Utility-category WhatsApp template with ONE quick-reply button
    whose payload is the token. **Real technical constraint, disclosed
    plainly**: Meta restricts its "Authentication" template category (used by
    the typed-code flow already shipped) to code-delivery mechanics only —
    no custom buttons — so a true tap-to-confirm experience needs a SEPARATE
    Utility-category template (new `DV_OTP_WHATSAPP_TAP_TEMPLATE_NAME` env
    var), not a variant of the Authentication one. When the user taps the
    button, WhatsApp sends the payload back through the SAME webhook already
    receiving all inbound WhatsApp messages (`handleWhatsAppWebhook`) — a new
    branch there (checked only when `phone_number_id` matches OUR OWN
    platform number, never an individual agent's own connected number, since
    that has nothing to do with account sign-up) matches the payload against
    the pending `otp_verifications` row via `_consumeOtpButtonTap()` and
    marks it verified — no code, no typing, ever. Falls back automatically to
    the already-shipped typed-code Authentication template when the tap
    template env var isn't set, so nothing regresses if the operator sets up
    one template but not the other.
  - **Email: click the link, zero typing.** New `link_token_hash` column plus
    a `verifyUrl` included in the OTP email (kept alongside the 6-digit code,
    not instead of it — some inbox/webmail clients mangle links, so the typed
    code stays as a guaranteed fallback). New GET action
    `action=verify-otp-link` (`api/inbox.js`) — a plain browser navigation,
    verifies the matching row and shows a small branded confirmation page.
  - **Auto-detection — the part that actually delivers "click Connect and it
    just connects"**: none of the above is useful if the ORIGINAL browser tab
    still just sits there waiting for the user to come back and click
    something. New `action=otp-status` (GET, polled) plus `js/auth.js`
    `_dvStartOtpPoll()`/`_dvStopOtpPoll()` — the Sign Up screen polls every 3s
    the moment a code is sent, and the instant ANY of the 3 confirmation paths
    (typed code, WhatsApp tap, email link) marks the row verified server-side,
    the UI updates itself automatically with zero further clicks anywhere —
    genuinely matching what the user described. Polling is torn down
    consistently through the single `renderAuthModal()` "modal is closed"
    guard (covers back-button/X/overlay-click/successful-sign-in in one
    place) plus on phone-input-edit and after a successful account creation.
  - Verified: extended the mocked-fetch Node test harness (9 more cases,
    18 total across both files) — send-otp with the tap template configured
    sends a real `quick_reply` template (not the code one) and returns
    `tapMode:true`; the insert row carries both new tokens; the email body
    contains the real magic-link URL; a WhatsApp button-tap webhook event on
    the platform's own phone_number_id correctly matches and verifies the
    pending row via PATCH and does NOT log itself as a normal inbox message;
    the identical tap payload arriving on a DIFFERENT (agent-owned)
    phone_number_id is correctly ignored; a genuine email magic-link GET
    request verifies and shows the success page; an expired magic link is
    rejected with a clear "expired" message; `otp-status` correctly reports
    `false` before and `true` after verification; and a button-tap payload
    with no matching pending row is silently ignored (never surfaced as an
    error back to Meta, matching this webhook's existing "always 200"
    convention) — all PASS, zero regressions on the original 9 cases. A
    second, dedicated Playwright test drove the REAL polling loop end-to-end
    (mocked `otp-status` responses) confirming the Sign Up screen
    auto-detects verification, stops polling, and shows the green verified
    badge with zero additional user action — exactly the flow the user asked
    for. `node -c` on both touched files.
  - **Manual steps**: same as the entry below, plus — if the operator wants
    the genuine tap experience (recommended, matches what the user actually
    asked for) rather than the typed-code fallback — create and get Meta's
    approval for a Utility-category template with one quick-reply button,
    then set `DV_OTP_WHATSAPP_TAP_TEMPLATE_NAME` (and confirm the button
    payload wiring matches once tested live — this session could not test
    against a real Meta webhook).

- **2026-07-17 (session 14, zero-touch onboarding — OTP verification system,
  first concrete step on the new #4 CRITICAL DIRECTIVE)**: Direct follow-up
  to writing the standing directive above. User was explicit that this isn't
  just documentation — the actual onboarding flow must change now so a user's
  job is limited to phone/email/social-connect, with OTP as the only
  verification mechanism. Built the foundational, reusable primitive every
  future "confirm you own this contact" step should build on, then applied it
  to the one concrete gap it could close today without an external Meta
  approval blocking it: phone verification during Sign Up (previously,
  Sign Up never collected a phone number at all).
  - **New migration**: `supabase-otp-verification-schema.sql` (requires
    manual execution) — `otp_verifications` table (contact_type/contact_
    value/code_hash/purpose/attempts/expires_at/verified_at), RLS enabled
    with zero policies (service-role-only by construction — no client, anon
    or authenticated, ever reads/writes this table directly; a code is only
    ever generated/checked server-side). Also adds `user_profiles.phone_
    verified boolean default false` — the existing `phone` column already
    existed pre-session, this just adds the flag that distinguishes "typed
    in" from "actually confirmed theirs."
  - **`api/inbox.js` extended** (not a new file — the project is already at
    Vercel Hobby's 12-function ceiling): 2 new actions.
    - `action=send-otp` — generates a 6-digit code, SHA-256-hashes it before
      storing (the plaintext code is never persisted anywhere), 10-minute
      expiry, and a per-contact throttle (max 3 codes per contact per 15
      minutes, checked via a direct Supabase query — independent of the
      existing per-IP `rateLimitExceeded` limiter also applied on top, so
      someone can't OTP-bomb one specific phone/email from many different
      IPs). For `contact_type:"email"`, sends via the existing
      `shared.sendEmail()` (Resend — already configured, works today, zero
      new setup). For `contact_type:"phone"`, sends via a new
      `sendWhatsAppOtpTemplate()` using a **platform-level** WhatsApp
      Business number (new `DV_PLATFORM_WHATSAPP_PHONE_ID`/`DV_PLATFORM_
      WHATSAPP_TOKEN` env vars) — deliberately separate from any individual
      agent's own per-agent WABA connection (`social_credentials`), since
      this is DubaiVal's own system number sending a first-contact message
      to a brand-new signup, not an agent messaging their own client.
      **Real technical accuracy point**: unlike the plain-text
      `sendWhatsAppMessage()` used for agent↔client chat inside an
      already-open 24h conversation window, a signup contact has no such
      window with our platform's number — Meta only allows a business to
      message a number that's never messaged us first via a **pre-approved
      "Authentication" category template**, not a free-form text message.
      `sendWhatsAppOtpTemplate()`'s component shape (body variable + a
      copy-code button) matches Meta's standard Authentication template
      format, but this could not be tested against a real, approved Meta
      template in this sandbox — if the operator's actual approved template
      differs in its component structure, this needs a one-line adjustment
      to match once tested live. Graceful degradation: if the platform
      WhatsApp env vars aren't set (true today), returns a clear
      `503 {code:"whatsapp_otp_unavailable"}` rather than crashing or
      silently doing nothing — the client already knows how to handle this
      (see below).
    - `action=verify-otp` — looks up the most recent non-expired,
      non-verified code for that contact+purpose, hashes the submitted code
      and compares, caps at 5 failed attempts (`429` after that, forcing a
      fresh code rather than allowing unlimited guesses), and marks
      `verified_at` on success.
  - **`js/auth.js` Sign Up flow**: added a phone number field (previously
    completely absent from Sign Up) right after Name, with a "Verify" button
    that calls the new `send-otp` action, a 6-digit code-entry step once
    sent, and a green "✓ Phone verified via WhatsApp" confirmation once
    correct. Three new functions: `dvSendPhoneOtp()`, `dvVerifyPhoneOtp()`,
    and `dvSignUp()` extended to attach `phone`/`phone_verified` to the
    `user_profiles` insert only when a phone was actually entered — **never
    blocks account creation** on phone verification succeeding, matching
    this project's established graceful-degradation pattern for any
    Meta-gated feature. If `send-otp` comes back `whatsapp_otp_unavailable`
    (true today, since the platform WhatsApp number isn't connected yet),
    the UI shows a plain, honest message — "WhatsApp verification isn't
    switched on yet — you can still create your account now and verify your
    phone later from your profile" — and Sign Up proceeds normally with
    `phone_verified:false`. This is a deliberate, temporary, disclosed
    exception to the directive's "OTP is the only mechanism" rule, not a
    silent gap — the moment the operator connects the platform WhatsApp
    number, this same code path starts actually verifying with zero further
    changes needed.
  - **Explicitly NOT built this session** (per the directive's own scoping,
    and to avoid a risky, large, blind rewrite of the CORE sign-up/session
    mechanism in one pass): replacing Supabase Auth's own email+password
    session flow with a passwordless email-OTP-only login (Supabase Auth
    does support this natively via `signInWithOtp`, but swapping the
    project's actual live authentication mechanism — used by every existing
    signed-in user today — is a materially bigger, higher-risk change than
    adding a new, additive, non-blocking phone-verification step, and wasn't
    what this pass targeted); any of the OAuth "Connect X" flows for
    WhatsApp Embedded Signup / Instagram / Facebook / LinkedIn / Twitter /
    TikTok / Meta Ads Pixel auto-discovery described in directive #4 above —
    every one of those still needs the operator's own Meta/LinkedIn/Twitter/
    TikTok App Review to complete first, a real external, days-to-weeks
    process this session cannot shortcut; migrating the existing manual
    WhatsApp Access Token/Phone Number ID/WABA ID and Meta Pixel ID/CAPI
    token fields in Social Setup (`js/chat.js` `showSocialSetup()`) to the
    OAuth-based flows the directive calls for — these are the biggest,
    most-cited remaining violations of directive #4 and are the natural next
    target once the operator confirms Meta App Review status for Facebook
    Login for Business + WhatsApp Embedded Signup.
  - Verified: `node -c` on both touched files; a mocked-fetch Node test
    harness against the real `api/inbox.js` handlers (9 cases) — invalid
    `contact_type` 400s, email OTP sends via Resend and never touches Meta's
    Graph API, phone OTP with no platform WhatsApp number configured
    correctly 503s with `whatsapp_otp_unavailable` and never calls Meta,
    phone OTP WITH the platform number configured correctly calls the right
    phone ID with a correctly-normalized (digits-only) phone number and a
    real `type:"template"` payload, a per-contact throttle (3 recent codes
    already sent) correctly 429s before ever sending a 4th, a correct code
    verifies and marks `verified_at`, a wrong code fails and increments
    `attempts` without marking verified, an expired code is correctly
    rejected as expired (not "wrong code"), and a request with no pending
    code at all gets a clear "request a new one" message; and a real-browser
    Playwright pass on the actual Sign Up modal confirming the phone field
    and Verify button render, the 6-digit code-entry UI appears once a code
    is "sent," the green verified badge renders once `phoneVerified` is set,
    and the graceful "WhatsApp verification isn't switched on yet" message
    renders correctly when the backend reports the platform number isn't
    configured — zero non-network console errors in either pass.
  - **Manual steps required before phone verification is fully live**: (1)
    run `supabase-otp-verification-schema.sql` in Supabase SQL Editor —
    email OTP already works today without this being blocking (email send
    itself needs no new table, only the throttle/expiry bookkeeping does,
    so until this runs, email OTP send will fail at the insert step with a
    clear 500 rather than silently pretending to succeed); (2) connect
    DubaiVal's own platform WhatsApp Business number (separate from any
    individual agent's own WABA connection) and set `DV_PLATFORM_WHATSAPP_
    PHONE_ID`/`DV_PLATFORM_WHATSAPP_TOKEN` in Vercel env vars; (3) create
    and get Meta approval for an "Authentication" category WhatsApp message
    template (WhatsApp Manager → Message Templates), then set `DV_OTP_
    WHATSAPP_TEMPLATE_NAME`/`DV_OTP_WHATSAPP_TEMPLATE_LANG` if the approved
    name/language differ from the `otp_verification`/`en_US` defaults. Until
    (2)+(3) are done, phone verification shows the honest "not switched on
    yet" message and Sign Up proceeds without it — zero breakage, exactly
    the same graceful-degradation pattern used throughout this project for
    every other Meta-gated feature.

- **2026-07-17 (session 14, AI Chief of Staff — Meta Ads conversion
  feedback loop, "report real leads back to Meta")**: User shared 4
  competitor ads (LogixContact — generic dev shop, irrelevant; **YCloud** —
  a Meta Official BSP Partner that sends WhatsApp conversion outcomes back
  to Meta via Conversions API to make ad targeting smarter; Wazzup —
  WhatsApp-to-CRM sync, same problem AI Chief of Staff already solves;
  Qmize — a cheaper WhatsApp-marketing alternative, mostly confirming real
  market demand for this category) and asked whether the YCloud idea
  specifically should be built into DubaiVal. Confirmed via `AskUserQuestion`
  before writing code: (1) this should NOT be wired into the RAG knowledge
  base — RAG grounds AI TEXT GENERATION with retrievable domain facts;
  a conversion event is a structured analytics/attribution signal with
  nothing to semantically retrieve, so forcing it through RAG would be the
  wrong tool for the job (user agreed); (2) "real conversion," for this
  business, means the moment a new record is saved to the **Client Memory
  Bank** — the same definition of a qualified lead this whole tab already
  centers on (user agreed). Built directly into AI Chief of Staff per the
  user's explicit direction, since the users of this tab are exactly who
  YCloud targets — individual agents and companies connecting their own
  phone/CRM to run better-targeted ad campaigns.
  - **The real technical mechanism**: when someone clicks "Send Message" on
    a Facebook/Instagram ad, WhatsApp's own incoming-webhook payload
    includes a `referral` object (`ctwa_clid` — the specific token Meta's
    Conversions API needs to attribute a later conversion back to that
    exact ad). This was always present in the raw webhook payload (already
    stored as `raw_payload` text, `api/inbox.js` `handleWhatsAppWebhook`)
    but never extracted or acted on. Now captured into a new
    `social_inbox.ad_referral` jsonb column at webhook-receive time, carried
    through Inbox → AI Chief Co-pilot (`chiefsCopilotAnalyze()` gained a 5th
    `adReferral` param, sourced from the real inbox row's `ad_referral` in
    `js/inbox.js`) → `chiefsCopilotSaveClient()`/`chiefsSaveClient()`
    (`chiefs_clients.ad_referral`, new column) → and finally, the moment a
    genuinely NEW client record is saved with a real `ctwa_clid` present,
    fire-and-forget-reports the conversion to Meta.
  - **New server action**: `api/inbox.js` `handleMetaConversion()`
    (`action=meta-conversion`, extended into this existing file, not a new
    one — the project is already at Vercel Hobby's 12-function ceiling).
    Resolves the caller's real signed-in identity, reads the agent's OWN
    Meta Ads Pixel ID + Conversions API token from `social_credentials`
    (per-agent, matching how every other platform credential in this
    project already works), hashes the client's phone (SHA-256, digits-only
    normalized — Meta requires PII hashed before it ever leaves the caller's
    server) and POSTs a `Lead` event to `https://graph.facebook.com/v19.0/
    {pixel_id}/events` with `action_source:"business_messaging"`,
    `messaging_channel:"whatsapp"`, and the real `ctwa_clid` for
    attribution. Fails completely soft everywhere (no ad attribution, no
    Pixel connected, a rejected Graph API call) — this is a pure background
    analytics signal and must never block or interrupt the agent's actual
    client-save flow.
  - **New Social Setup fields** (`js/chat.js` `showSocialSetup()`, alongside
    the existing WhatsApp Business fields — same per-agent
    `social_credentials` table, so this needed zero new sync/push/pull
    plumbing): "Meta Ads Pixel ID" and "Meta Conversions API Access Token."
  - **New 4th Automation Settings toggle** (`js/chiefs.js`,
    `CHIEFS_AUTOMATION.autoReportConversions`, default `true` — matches the
    directive's "automatic by default" standing rule): "Report ad
    conversions to Meta," shown on the Dashboard's "⚡ AUTOMATION" card with
    a live Connected/Not-connected status line reading the local Pixel/token
    presence.
  - **New migration**: `supabase-meta-conversion-schema.sql` (requires
    manual execution) — `social_inbox.ad_referral jsonb`,
    `chiefs_clients.ad_referral jsonb`, `social_credentials.meta_pixel_id
    text`, `social_credentials.meta_capi_token text`.
  - Verified: a mocked-fetch Node test harness against the real
    `api/inbox.js` `handleMetaConversion()` handler (5 cases) — no
    `ctwa_clid` short-circuits with zero network calls, an invalid access
    token 401s, a signed-in agent with no Pixel connected gets a clear
    `ok:false` reason (never an error), a fully-connected agent gets a real
    Graph API call to the correct Pixel URL with the correct
    `event_name`/`action_source`/`messaging_channel`/`ctwa_clid`/correctly
    SHA-256-hashed-and-normalized phone number, and a Graph API rejection
    degrades to `ok:false` (not a thrown error, still HTTP 200 to the
    caller); a second Node vm-sandbox test (3 cases) confirming
    `chiefsSaveClient()` correctly fires the conversion report only when
    BOTH a real `ad_referral.ctwa_clid` is present AND the toggle is on, and
    correctly stays silent when either condition is false; `node -c` on all
    4 touched files; and a real-browser Playwright pass confirming the 4th
    toggle renders on the Dashboard with the correct default (on) state and
    persists correctly on click — zero console errors.
  - **Manual steps required before this is live**: (1) run
    `supabase-meta-conversion-schema.sql` in Supabase SQL Editor; (2) an
    agent/company that wants this must connect their own Meta Ads Pixel ID
    + generate a Conversions API access token (Meta Events Manager →
    Settings → Conversions API → Generate Access Token) and paste both into
    Social Setup — same one-time setup pattern as the WhatsApp Business API
    connection. Until both are done, the toggle is visible and on by
    default but silently no-ops (real client saves still work exactly as
    before; no conversion is reported, no error shown).
  - **Not built this session, explicitly out of scope for now**: reporting
    any OTHER event as a "conversion" (e.g., a pipeline deal reaching
    Offer/Closing, or an actual closed deal) — the user confirmed "new
    Client Memory Bank record" as the definition to build first; a
    deal-stage-based signal was discussed as the alternative and could be
    added later as a second, separate event type if the user wants a
    stronger (later-funnel) signal in addition to this one.

- **2026-07-17 (session 14, AI Chief of Staff — Automation Settings shipped,
  implementing the standing directive above)**: User asked for a full
  inventory of every tool in AI Chief of Staff, then to bring each one to
  the automation-first state described in the directive just written above
  — no manual copy/paste-style workflow anywhere, one toggle per
  automatable process, default ON.
  - **Full tool inventory** (`js/chiefs.js`) reviewed end to end: Dashboard
    (stats/quick actions/Smart To-Do), Daily Briefing (already auto-
    generates once per session), Property Inventory CRUD (inherently manual
    data entry — nobody else has an agent's own pocket-listing details to
    pull in automatically), Client Memory Bank CRUD, **Conversation
    Scanner** (previously: paste text → click Extract → review → click "Use
    This Client" → form opens → click Save — a 2-click manual review even
    after extraction), **Voice Call Transcription** (upload → auto-
    transcribes → auto-runs the same scanner → same 2-click manual review),
    **Auto-Matching Engine** (already automatic on every inventory/client
    save), **AI Message Drafter** (previously: manual "Draft Message" click
    per match), **match approval/send** (previously: "Copy & Approve" —
    copies to clipboard, agent must paste into WhatsApp themselves — or
    "Send via WhatsApp" — opens a wa.me deep-link, still requires the agent
    to hit send in their own WhatsApp app), Deal Pipeline CRUD (inherently
    manual — nobody else tracks an agent's own deal stages), Commission
    Tracker (pure read-only computed report, no action to automate),
    Document Assistant (AI already writes 100% of the text; kept as an
    explicit per-deal trigger — there's no sensible "automatic" moment to
    draft an Offer Letter or MOU without the agent choosing to, unlike a
    routine data-collection task), **AI Chief Co-pilot** (Inbox's "Analyze
    with Co-pilot" — previously: analyze → click "Generate Reply Draft" →
    Copy or open wa.me manually).
  - **Fix — real automation, not just a settings screen that does nothing**:
    new `CHIEFS_AUTOMATION` state (`autoDraft`/`autoSend`/`autoSaveExtracted`,
    all default `true`, persisted to `localStorage` — cross-device Supabase
    sync flagged as a follow-up below) plus a visible "⚡ AUTOMATION" toggle
    card at the top of the Dashboard (3 switches, plain language, no jargon).
    Wired into the actual pipelines, not just cosmetic:
    - `_chiefsAutoMatch()` now auto-drafts every freshly-created match
      immediately (fire-and-forget `chiefsDraftMessage()` per match) when
      `autoDraft` is on — the agent never has to open Matches and click
      Draft one by one.
    - `chiefsDraftMessage()` now auto-sends the moment drafting finishes,
      when `autoSend` is on, via a new `chiefsSendMatchMessage()`.
    - **The actual "send" mechanism was upgraded, not just gated by a
      toggle**: `chiefsSendMatchMessage()`/the redesigned `chiefsApproveMatch()`
      now POST to the real, already-working WhatsApp Business API endpoint
      (`/api/inbox?action=whatsapp-send` — the exact pipeline fixed earlier
      this same session) instead of copying to the clipboard and hoping the
      agent pastes it in. This closes the actual gap the user was pointing
      at: "approval" in this tab now means one click that DOES the action,
      not one click that prepares the action for the agent to still do by
      hand elsewhere. Falls back to the old clipboard+wa.me behavior only
      when WhatsApp Business API isn't connected yet or the client has no
      phone on file — never a hard failure, and the match status
      (`sent` vs `approved`) reflects which actually happened. The old
      `chiefsWhatsApp()` function is kept as a deliberate manual override
      for an agent who wants to send from their own personal WhatsApp app
      instead of the connected Business number.
    - `chiefsScanConversation()` now calls a new `chiefsScannerAutoSave()`
      immediately after AI extraction, when `autoSaveExtracted` is on —
      saves straight to the Client Memory Bank (via the existing
      `chiefsSaveClient()`, which itself already triggers auto-matching) with
      zero further clicks. Since `chiefsTranscribeVoiceCall()` already funnels
      into this same function, the voice-call entry point gets this for
      free — one shared toggle covers both entry points, per the directive's
      explicit requirement. When off, the existing 2-step manual review is
      unchanged, now with a small status line explaining which mode is
      active and where to change it.
    - **AI Chief Co-pilot** (`chiefsCopilotDraft()`, Inbox's per-message
      helper): now auto-sends via the same real WhatsApp API the instant a
      reply is drafted — but ONLY when the source is genuinely a WhatsApp
      conversation with a phone-shaped contact (email/Instagram/Facebook
      replies have no send API wired here, so auto-send is a no-op for
      those, exactly as before). When off (or not applicable), the overlay
      now also gained a real "Approve & Send" button using the same API
      call (falls back to clipboard+wa.me), alongside the pre-existing
      "Copy"/"WhatsApp App" manual-override buttons — so even "approval"
      mode here is a single real send, not copy-then-go-paste-elsewhere.
  - **Deliberately NOT made automatic, with reasoning**: Property Inventory,
    Client, and Pipeline manual CRUD forms — these are the agent's own
    private data with no external source to pull from automatically; "type
    it in" IS the entry mechanism here, not a routine-task complaint the
    directive was aimed at. Document Assistant's generation trigger — stays
    an explicit per-deal action since there's no sensible "automatic"
    moment to draft a legal-adjacent document without being asked.
  - **Accepted, disclosed trade-off**: with every toggle at its default
    (all `true`), the AI now autonomously SENDS real WhatsApp messages to
    real clients with no human ever reading them first, the moment a match
    or an inbox reply is drafted. This is a real, deliberate consequence of
    the user's own explicit design directive ("default should lean toward
    automatic... a user has to deliberately flip a process to requires
    approval") — flagged here plainly rather than silently softened, so a
    future session (or the user, re-reading this) understands exactly what
    shipping with these defaults means in production.
  - Verified: a Node vm-sandbox test (17 checks) — automation defaults all
    true, persists to and respects `localStorage` overrides, the scanner
    auto-saves the AI-extracted client with the correct data and closes
    itself with zero manual clicks when `autoSaveExtracted` is on, correctly
    shows the review card instead when it's off, `chiefsSendMatchMessage()`
    tries the real API first and correctly falls back to clipboard+wa.me
    (status `approved`) on failure, correctly reports `sent` status on a
    real API success, and `_chiefsAutoMatch()` genuinely triggers
    `chiefsDraftMessage()` for a freshly-created match when `autoDraft` is
    on (confirmed the match object actually has a `draft_message` after the
    fire-and-forget call resolves); `node -c js/chiefs.js`; and a
    real-browser Playwright pass confirming the new "⚡ AUTOMATION" card
    renders on the Dashboard with all 3 toggles at their correct default
    (on) state, and clicking a toggle flips both the in-memory state and
    the persisted `localStorage` value — zero console errors.
  - **Follow-up not done this session**: per-device-only persistence
    (`localStorage`) means these toggles don't sync across an agent's
    devices/browsers — a small `chiefs_settings` Supabase table (or a new
    column on `user_profiles`) would fix this, flagged for whenever cross-
    device consistency for this tab actually matters to the user, not built
    speculatively here.

- **2026-07-17 (session 14, CRITICAL — real root cause of "WhatsApp messages
  never arrive" finally found: the `messages` webhook field was never
  actually subscribed, correcting a false claim from session 13)**: Direct
  continuation of tonight's admin/Inbox debugging — after fixing the missing
  `user_id` column (see the `supabase-inbox-user-id-fix.sql` entries below)
  and confirming the test-recipient number was verified, a fresh WhatsApp
  test message STILL never reached `social_inbox`. Root-caused live with the
  user over many steps: confirmed Meta's own "Check test webhooks" panel
  (Meta App Dashboard → WhatsApp → Step 1) showed the real message content
  arriving on Meta's side; confirmed the System User permanent token was
  correctly generated and saved; then checked real Vercel request logs for
  `/api/inbox` around the exact test timestamp and found **only one hit**, a
  bare `GET` returning **405** — meaning Meta's request never actually
  carried `?action=whatsapp-webhook` in a way our own routing recognized,
  which only happens when Meta never calls the webhook for this event type
  at all (a 405 falls through the router's generic `POST only` guard, which
  only fires when none of the specific `action` branches match). Traced this
  to the App Dashboard's stand-alone **"Webhooks"** page (a sibling menu item
  to "WhatsApp" in the left sidebar, not nested under it, and easy to miss
  since the WhatsApp product's own "Step 1/2/3" pages don't surface it) —
  its object-type selector was set to a different object (e.g. Page/User),
  and under the correct **"WhatsApp Business Account"** object type, the
  `messages` field's button still read **"Subscribe"** (never clicked) —
  meaning Meta was never actually configured to deliver `messages` events to
  our callback URL AT ALL, regardless of every other piece (Callback URL,
  verify token, test-recipient verification, System User token) being
  correct. Clicking "Subscribe" on `messages` under the WhatsApp Business
  Account object immediately fixed it — the very next real WhatsApp test
  message arrived in `social_inbox` and rendered correctly in the site's
  Inbox tab.
  - **This directly corrects a false claim in the 2026-07-16 (session 13)
    entry below**, which stated "the `messages` field was subscribed" as
    something already confirmed during that session's investigation — it was
    not, in fact, subscribed (or was subscribed under the wrong object type
    and silently reverted/never took effect). The user identified that an
    earlier session had specifically instructed setting the Webhooks page's
    object-type selector to **"User"** instead of **"WhatsApp Business
    Account"** — this is almost certainly the exact origin of the false
    "already subscribed" claim in that entry, since subscribing `messages`
    under the wrong object type doesn't error, it just silently does nothing
    for actual WhatsApp message delivery. Both the missing `user_id` column
    (session 13's finding) and this webhook-field misconfiguration were real,
    independent, fully-blocking bugs stacked on top of each other — fixing
    only one without the other still would have left messages arriving
    nowhere.
  - **Lesson for future sessions, written here explicitly since it cost
    real, significant user time tonight**: when debugging any Meta
    webhook-delivery issue (WhatsApp, Instagram, Facebook), do not trust a
    prior session's work-log claim that a webhook field was "confirmed
    subscribed" — have the user re-check the live state directly in Meta's
    stand-alone **"Webhooks"** dashboard page (not the product-specific
    "Try it out"/"Configuration" sub-pages, which don't reliably surface
    this), under the SPECIFIC correct object type for that product
    (`whatsapp_business_account` for WhatsApp — not `user`, not `page`), and
    confirm the exact field's button reads "Unsubscribe" (already on), not
    "Subscribe" (still off). Real Vercel request logs (Project → Logs,
    filtered to the exact test timestamp) were what actually broke this
    case open — a 405 on a bare `GET /api/inbox` with no visible `action`
    match proved Meta was never calling our endpoint for this event at all,
    which a webhook-payload preview panel alone ("Check test webhooks") does
    not prove, since apparently it can show simulated/echoed content
    independent of whether live delivery is actually wired up.
  - **Not independently re-checked this session**: whether Instagram/
    Facebook DM webhook fields have the same "wrong object type" risk — the
    user was advised to spot-check the Webhooks page's Instagram/Page object
    types the same way, given this exact class of misconfiguration just cost
    real time here, but this wasn't done as part of this session's own work.
  - Verified live, end-to-end, with the user: a real WhatsApp message sent
    from their own phone to the connected test number, immediately after
    subscribing `messages` under the correct object type, landed in
    `social_inbox` (confirmed via direct Supabase SQL query showing the real
    message content, not the old "Manual test 3" row) and rendered in the
    site's Network → AI Agents → Inbox tab.

- **2026-07-17 (session 14, CRITICAL — Admin login was broken because the
  password previously given to the user was simply wrong, plus a real
  password-wiping bug found while investigating)**: User reported the admin
  password didn't work, and asked for a SHOW/HIDE toggle on the password
  field first, then an investigation into why login fails.
  - **Root cause #1 — wrong password communicated, never actually verified**:
    an earlier session/turn told the user the admin password was
    "DubaiVal2025!", based on a comment in `supabase-admin-security-fix.sql`
    claiming the hardcoded hash in `_admin_password_ok()` was
    `sha256("DubaiVal2025!")` — but this was never independently checked.
    Computed `sha256("DubaiVal2025!")` directly this session
    (`a5e091ad2b1b38009ac2005f93148976fe6adad289f8ed02c622249f84a39360`) and
    confirmed it does NOT match the literal hash hardcoded in that file
    (`67ed667fed4620ba36c09d97b542b81c39a5f63bcbdfe8d1931c234748498fc1`) —
    the comment was simply wrong, and since SHA-256 is one-way, the actual
    original password (whatever it was) cannot be recovered from the hash.
    **Fix**: new migration `supabase-admin-password-reset.sql` (requires
    manual execution) rotates `_admin_password_ok()`'s hash to a new,
    definitely-correct password: **`DubaiVal-Admin-2026!`** — following the
    exact rotation procedure the original file's own comment describes
    ("replace this literal").
  - **Root cause #2 — a real, independent bug, found while building the
    requested SHOW toggle and testing the login flow end-to-end**: 4
    separate background data-refresh functions in `js/core.js`
    (`fetchLiveMarket`, `fetchSupabaseConfig`, `fetchMarketIntelligence`, and
    the market-momentum/AI-intelligence chain that runs 800ms after page
    load) each call the global `render()` completely unconditionally once
    their own fetch settles — with no awareness of what the user is doing
    elsewhere in the app. Since this app rebuilds its entire DOM from scratch
    on every `render()` call (no virtual-DOM diffing), any of these firing
    while the user is on the Admin lock screen — a very likely window, since
    they all fire within the first ~1-13 seconds after page load, exactly
    when someone opening `#admin` would be typing their password — silently
    replaces the whole password field with a fresh, empty, un-toggled one,
    wiping out whatever the user had just typed. Confirmed via a real
    Playwright test: typing a password and clicking the new SHOW button
    produced no visible change and the field's value was reset to empty
    shortly after, even though the click handler itself was correct. This is
    a completely different, additional bug from the wrong-password issue —
    it would have caused login attempts to intermittently and confusingly
    fail (or the field to unexpectedly clear) even with the CORRECT password,
    depending on exact timing.
  - **Fix**: added one shared `_dvSafeRender()` helper (`js/core.js`) that
    skips the re-render specifically when the user is on the Admin section
    with `!window.ADMIN_UNLOCKED` (none of this background data — market
    momentum, live Groq/DLD adjustments, Supabase config — is ever shown on
    that screen, so skipping it there costs nothing) and calls the real
    `render()` otherwise. All 4 previously-unconditional `render()` calls in
    the affected background functions now go through this helper instead.
  - **SHOW/HIDE toggle**: `renderAdmin()`'s password-check block
    (`js/app.js`) now wraps its password `<input>` with the existing
    `_dvPasswordField(inputEl,cl)` helper (`js/auth.js`, already used for the
    Sign In and Set-New-Password fields) instead of appending the raw input
    directly — reused as-is, no new toggle component built.
  - Verified: `node -c` on both touched files; a real-browser Playwright test
    confirming the SHOW/HIDE toggle correctly flips the input's `type`
    between `password`/`text` and its own label between SHOW/HIDE, that a
    typed password now survives the background-render window (previously
    reset to empty), and a full end-to-end login simulation (mocked
    `admin_verify` RPC returning `true` for the new password) confirming the
    real Admin Dashboard — Market Risk Controls, System Diagnostics, Live
    Error & Issue Reports — renders correctly after login.
  - **Manual step required — this fix is NOT live until run**: execute
    `supabase-admin-password-reset.sql` in Supabase SQL Editor (requires
    `supabase-admin-security-fix.sql` already applied, which it is). Until
    then, the OLD (unknown, non-working) password hash remains live — the
    new password `DubaiVal-Admin-2026!` will not work until this migration
    runs. The SHOW/HIDE toggle and the background-render fix both work
    immediately regardless, independent of the SQL migration.

- **2026-07-17 (session 14, Portfolio Manager audit follow-through — 4
  prioritized improvements)**: Direct continuation of a full multi-
  disciplinary audit of the Portfolio Manager (Compare/Personal Advisor/
  Assets/Health/Projections, `js/portfolio.js`) the user requested,
  evaluating it as a potential high-value, monetizable feature. The audit
  surfaced 4 priorities; user asked to implement all of them in order.
  - **Priority 1, cloud sync — audit corrected mid-implementation**: the
    audit had flagged "portfolio only lives in localStorage, no cloud sync"
    as a gap. Starting the implementation surfaced that this was WRONG —
    `syncPortfolioToCloud()`/`syncPortfolioFromCloud()`/`portfolioChanged()`
    (`js/auth.js`) already fully implement this, backed by a real
    `user_portfolios` table (`supabase-user-profiles-schema.sql`) with
    correct owner-only RLS (`auth.uid() = user_id`, a real JWT claim, not a
    client-suppliable value) — called on sign-in and on every asset/goal
    mutation. The audit missed this because it only read `js/portfolio.js`,
    not `js/auth.js`. No work needed here; flagged to the user as a
    correction rather than silently skipped.
  - **Priority 2, portfolio value history + chart (the genuinely missing
    piece)**: new `portfolio_value_snapshots` table
    (`supabase-portfolio-history-schema.sql`, requires manual execution) —
    one row per signed-in user per day (`unique(user_id, snapshot_date)`),
    same owner-only RLS pattern as `user_portfolios`. `js/portfolio.js`
    gained `_capturePortfolioSnapshot()` (fires on every `renderPortfolio()`
    call, throttled to once/day via a `localStorage` date guard — safe to
    call unconditionally regardless of which sub-tab is open),
    `_fetchPortfolioHistory()`, and `_renderPortfolioHistoryChart()` — the
    same smoothed cubic-bezier SVG line-chart technique the Market
    Dashboard's PSF Trend chart already uses (kept self-contained here,
    matching this codebase's existing per-file chart convention rather than
    extracting a shared utility). Rendered at the top of the Health tab,
    signed-in users only, once 2+ snapshots exist.
  - **Priority 3, PDF report + Pro-gated AI Analysis**: `generatePortfolioPDF()`
    reuses the EXACT SAME print/PDF mechanism the Analyzer's `generatePDF()`
    (`js/app.js`) already established (build HTML → inject into the shared
    `#print-report` div → `window.print()` → clear) — header, overview
    stats, area allocation, per-asset table, health-score breakdown if
    computed, same disclaimer footer style. New "PDF Report" button next to
    the existing CSV export on the Assets tab. Both this and the existing
    "AI PORTFOLIO ANALYSIS" button are now gated behind `isProUser()` (same
    pattern as the Analyzer's PDF gate) — a decisive BUY/HOLD/SELL-per-asset
    CFA-style report and a branded PDF are exactly the kind of premium
    output an agent would pay for, and the Upgrade modal's own marketing
    copy already promised "PDF & Arabic report export" as a Pro benefit
    without this actually existing for Portfolio until now.
  - **Priority 4, weekly digest email**: closes the real retention gap the
    audit found — 5 of 6 Opportunity Alert types (everything except Rent
    Optimization) never proactively notify the user, and even the one that
    does is in-app-only (invisible unless the app happens to be open). New
    `handlePortfolioDigest()` in `api/refresh-market-data.js` (extended, not
    a new file — the project is already at Vercel Hobby's 12-function
    ceiling), a new Sunday 08:15 UTC cron
    (`?action=portfolio-digest`, `vercel.json`) — for every user with a
    non-empty portfolio and 2+ value snapshots, compares the latest
    snapshot to the one closest to 7 days prior and emails (via the same
    Resend `sendEmail()` helper Price Alerts already uses) a real
    week-over-week value/ROI/yield summary, deliberately built from the
    already-captured snapshot deltas rather than re-running the full
    client-side valuation engine (building database + hedonic pricing
    stack) inside a serverless function. New
    `supabase-portfolio-digest-schema.sql` adds a `last_digest_sent_at`
    column on `user_portfolios` as a 6-day idempotency guard (skips a user
    already digested this week, so a manual re-trigger or cron double-fire
    can't double-email).
  - Verified: `node -c` on all 3 touched files; a Node vm-sandbox test (7
    cases) for the snapshot/chart logic — not-signed-in short-circuits with
    zero network calls, a signed-in first capture POSTs the correct rounded
    body with a `merge-duplicates` upsert header, a same-day second call is
    correctly throttled, zero assets short-circuits, history fetch
    correctly no-ops when signed out and fetches/returns real rows when
    signed in, and the chart renders without throwing; a second Node test
    (3 cases) for the PDF export confirming it's correctly blocked (no
    `window.print()` call, `#print-report` left untouched) when not Pro,
    correctly builds real HTML with the exact portfolio data and calls
    print when Pro, and no-ops on an empty portfolio; a mocked-fetch Node
    test harness against the real `api/refresh-market-data.js` handler (5
    cases) for the digest — wrong bearer token 401s with zero calls, a real
    user with 3 weeks of snapshots gets a correctly-addressed email with
    the right subject/value/ROI figures and `last_digest_sent_at` gets
    updated, a user already digested within 6 days is skipped with zero
    email calls, a user with an empty portfolio is skipped, and a user with
    only 1 snapshot (not enough for a week-over-week comparison) is
    skipped; and 2 real-browser Playwright passes — one on the Health tab
    (mocked snapshot history) confirming the chart renders with correct
    stats matching the Node test exactly, one on the Assets tab confirming
    the PDF button is correctly blocked pre-Pro (upgrade modal shown,
    `window.print()` never called) and correctly fires `window.print()`
    once `DV_AUTH.profile.is_pro` is set — zero non-network console errors
    in either pass.
  - **Manual steps required before Priorities 2-4 are live**: run
    `supabase-portfolio-history-schema.sql` and
    `supabase-portfolio-digest-schema.sql` in Supabase SQL Editor (both
    require `supabase-user-profiles-schema.sql` already applied, which it
    is, since cloud sync already depends on it). `RESEND_API_KEY` and
    `CRON_SECRET` are already required env vars (Price Alerts already uses
    both) — no new secrets needed. Until the SQL runs: the Health tab
    chart simply never appears (graceful — `_fetchPortfolioHistory()`
    returns an empty array on a 404 from the missing table), and the
    weekly digest cron will find zero snapshots to compare and skip every
    user harmlessly.

- **2026-07-17 (session 14, standing instruction — research findings now get
  injected into the AI's RAG knowledge base)**: User gave a general,
  forward-looking instruction after watching this session's off-plan
  research work: any web search Claude runs to learn new Dubai real-estate
  facts should also get a copy fed into the site's own knowledge base, so
  the specialized real-estate AI gets more expert over time, not just the
  one feature being built. Built a reusable mechanism (not a one-off) plus
  immediately applied it to this session's actual off-plan research.
  - **New Supabase migration**: `supabase-knowledge-research-notes-schema.sql`
    (requires manual execution) — adds `'research_note'` as a 4th allowed
    `knowledge_base.source_type` (alongside `news`/`market_snapshot`/
    `forecast_accuracy`), same additive `alter table ... drop/add constraint`
    pattern already used by `supabase-forecast-accuracy-schema.sql` for the
    3rd one. `research_note` rows are meant to be durable domain/process
    knowledge (how off-plan launches work, payment plan structures, escrow
    rules, etc.) rather than time-sensitive numbers — written once (or
    updated in place via a stable per-title key), not superseded daily like
    market snapshots.
  - **`api/knowledge-query.js` extended** (not a new file — the project is
    already at Vercel Hobby's 12-function ceiling, same constraint noted
    throughout this file): new `action:"ingest"` branch, admin-password-
    gated via the existing `admin_verify()` RPC
    (`supabase-admin-security-fix.sql`) called server-side (this is the
    first `api/*.js` file to verify an admin password itself — every other
    admin action so far was gated entirely inside a Postgres RPC; this one
    needs a server-side check because embedding text requires the
    JINA_API_KEY/GEMINI_API_KEY + SUPABASE_SERVICE_ROLE_KEY, neither of
    which the client can use directly). Batch-embeds each note's content via
    the existing `api/_lib/embeddings.js` `embedTexts()` helper and upserts
    into `knowledge_base` with `source_type:"research_note"`, reusing the
    exact same `resolution=merge-duplicates` insert pattern
    `refresh-market-data.js` already established. Each note's `source_url`
    key is a stable slug of its title (not date-stamped, unlike
    `market_snapshot`) — re-injecting the same fact later updates it in
    place instead of accumulating duplicate rows, since this is evergreen
    knowledge, not a daily-changing figure. The existing plain-search
    behavior (`action` absent/`"query"`) is completely unchanged.
  - **Admin Dashboard — new "◆ AI Knowledge Base — Research Injection" card**
    (`js/app.js` `renderAdmin()`): a small composer (Title, optional Area
    autocomplete, optional Tag, Content textarea) with "+ Add to Queue",
    a review list of queued notes (each removable before injecting — human
    review stays in the loop, matching every other admin-curated flow in
    this project, nothing auto-publishes), and an "Inject N Note(s)" button
    calling the new endpoint. A "↓ Load This Session's Off-Plan Research (5
    facts)" convenience button pre-populates the queue with this session's
    actual researched content (Dubai off-plan EOI/pre-launch process,
    payment plan structures, escrow/DLD regulation, the Oqood interim-
    registration system, and off-plan's ~73-74% share of 2026 transaction
    volume) — queued for review, not auto-injected, so the admin still sees
    exactly what's about to be embedded before it happens.
  - **Accepted trade-off, noted rather than engineered around**: the
    existing recency-weighted `match_knowledge()` ranking (15% weight decays
    to 0 over 180 days) applies uniformly to every `source_type`, including
    `research_note` — so a genuinely evergreen fact loses its small recency
    bonus after ~6 months and competes on pure similarity alone thereafter.
    Content is never excluded or deleted, just no longer gets the freshness
    boost — an acceptable default, not worth a source_type-specific carve-out
    for this project's actual retrieval-quality needs.
  - Verified: `node -c` on both touched files plus the same custom brace-
    balance checker used for the two Off-Plan fixes above (clean); a
    mocked-fetch Node test harness against the real `api/knowledge-query.js`
    handler (5 cases) — a wrong admin password returns 401 with zero
    embedding/insert calls ever made, a correct password with 2 valid notes
    embeds and inserts both with the right `source_type`/merge-duplicates
    header/stable slug, an empty notes array 400s with zero calls, a note
    with blank content is filtered and correctly 400s ("every note needs
    content"), and the pre-existing plain-search `action` path is completely
    unaffected (regression check); and a real-browser Playwright pass on the
    Admin Dashboard (mocked `knowledge-query` response) — confirmed the new
    card renders, clicking the seed button queues exactly 5 notes with
    correct titles/tags, clicking Inject calls the endpoint and clears the
    queue with a success message, manual add-to-queue works, and an empty
    draft is correctly rejected with a validation error — zero non-network
    console errors.
  - **Manual step required before this is usable**: run
    `supabase-knowledge-research-notes-schema.sql` in Supabase SQL Editor
    (requires `supabase-forecast-accuracy-schema.sql` and
    `supabase-admin-security-fix.sql` already applied, which they are).
    Until then, `action:"ingest"` will fail with a Postgres check-constraint
    violation (HTTP 500) — the Admin UI shows this as-is rather than hiding
    it, so it's obvious the migration is still pending. `JINA_API_KEY`/
    `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` were already required
    for the rest of the RAG pipeline and need no additional setup.
  - **Follow-up same session**: user asked to also cover research/domain
    knowledge already established earlier in this project (not just this
    session's off-plan work) — added a 2nd seed,
    `_adminResearchLoadEstablishedFactsPack()` (a "↓ Load Established
    Market/Regulation Facts (3 more)" button next to the off-plan one): the
    Dubai market cycle history (2002 freehold boom through the 2026
    moderation phase — the same era narrative already shown on the Market
    Dashboard's "All" chart view), DLD transfer fee + other closing costs
    (4% DLD fee, ~2% agency commission, mortgage registration fee — the same
    figures already used in the mortgage calculator/Analyzer cost
    breakdowns), and UAE mortgage LTV rules (expat vs. national caps,
    tiered by price — from the mortgage engine). Deliberately did NOT
    include this session's OWN research into Bayut/RapidAPI endpoint names
    or the DLD Dubai Pulse open-data API — those describe options for OUR
    data pipeline, not real-estate knowledge a user's question would ever
    need, so adding them would only dilute retrieval with irrelevant
    internal facts. Both seed buttons push into the same queue and dedupe
    by title (clicking either twice doesn't double-add) — verified via a
    Playwright test confirming all 8 notes queue correctly together and
    re-clicking both buttons a second time still leaves exactly 8.

- **2026-07-17 (session 14, follow-up — Off-Plan Projects: "Paste & Extract"
  AI ingestion, 3rd data-connection path)**: Direct continuation of the
  Bayut import work above. User confirmed building the 3rd data-source
  option discussed earlier (developer sites / Tamani, via AI-extraction —
  not automated scraping), then asked a real business question first:
  whether developers could grant direct site/feed access for always-fresh
  data. Answered directly (not a coding task): yes, in 3 realistic forms —
  (1) a structured feed (XML/CSV/API) the way Bayut/PropertyFinder already
  require from agencies, (2) a dedicated B2B partner API some larger
  developers offer, (3) simplest for now — someone from the developer's team
  submits directly via the app. Flagged this as a business-development task
  (outreach/negotiation) outside what this session can build — but noted the
  "Paste & Extract" tool being built doubles as the exact ingestion
  mechanism for whatever a developer ends up sending (a PDF brochure, a raw
  feed dump, an email) once such a relationship exists.
  - **Why "paste text", not "give me a URL and I'll scrape it"**: many
    developer sites (Emaar, Damac, Sobha, etc.) are JS-rendered SPAs — a
    plain server-side `fetch()` from a Vercel function gets back an empty
    shell, not the real content. A URL-fetch feature would silently fail
    most of the time. Pasting the already-visible text (copied from the
    developer page, a Tamani listing, or a forwarded brochure) sidesteps
    this entirely and is more reliable, matching the same reasoning that
    also applies to Bayut's own JS-heavy pages.
  - **`js/offplan.js`**: new shared `_offplanAIExtract(text)` — sends the
    pasted text to the same Groq AI already used throughout this app
    (`askAI()`, no new API/cost), with a system prompt that explicitly
    forbids inventing any figure not present in the text (matches this
    project's accuracy directive, same honesty stance as the Bayut import's
    defensive parsing) and requests strict JSON matching the project/
    unit-type schema. `_offplanExtractJSON()` parses the AI's reply (handles
    both a ` ```json ` fence and a bare `{...}` block, same pattern already
    used by `extractPostJSON()`/chat.js's `extractJSON()` elsewhere in this
    codebase). Extracted unit types are converted back through the existing
    `_formatUnitPricingForEdit()` into the same shorthand string the manual
    entry field already uses — one shared format, no second parser needed
    on the write side. A null/unparseable AI response returns a clear
    `{error:...}` rather than throwing, and is surfaced to whichever caller
    invoked it.
  - **Public Submit form** (`_renderOffplanSubmitForm`): new
    `OFFPLAN_STATE.aiExtract` state + a "✨ Paste & Extract with AI" toggle
    revealing a textarea + "Extract & Fill Fields" button; a successful
    extraction pre-fills name/developer/area/stage/dates/payment-plan/
    unit-pricing directly into the same form fields the user would
    otherwise type by hand, appends any extracted `notes` to the existing
    notes field (never overwrites), and closes the extraction panel —
    the user still reviews everything before hitting Submit for Review
    (nothing auto-submits).
  - **Admin Quick Add** (`renderAdmin()` in `js/app.js`): identical toggle/
    textarea/button UI ahead of the Quick Add form, wired to a new
    `_adminRunAIExtractOffplan()` that calls the exact same shared
    `_offplanAIExtract()` (cross-file call, safe for the same reason the
    Bayut-import code already established — every `<script defer>` finishes
    loading before any click handler runs) and fills `ADMIN_OFFPLAN_STATE
    .quickAdd` instead of the public form's state — one extraction function,
    two consuming forms, zero duplicated prompt/parsing logic.
  - Verified: `node -c` on both touched files plus a custom string/comment-
    aware brace-balance checker (same tool built for the Bayut-import fix
    above, re-run clean); a Node vm-sandbox test (5 cases) mocking `askAI` —
    a clean ` ```json ` -fenced response extracts and formats correctly, a
    bare-JSON response with prose prefix and mostly-null fields degrades
    gracefully (empty string instead of null, default `project_stage`,
    correctly omits a size range that wasn't given), a genuinely
    unparseable AI reply returns a clean error instead of throwing, empty
    input text short-circuits before ever calling the AI, and a thrown
    network error from `askAI` is caught and surfaced as a normal error
    state; and 2 real-browser Playwright passes — the public Off-Plan tab's
    Submit form (mocked `/api/proxy-groq` response) confirming the textarea
    appears, extraction correctly pre-fills all form fields including the
    formatted unit-pricing shorthand, and the panel auto-closes on success;
    and the Admin Dashboard's Quick Add form (same mocked response)
    confirming the identical fields populate into `ADMIN_OFFPLAN_STATE
    .quickAdd` — zero non-network console errors in either pass.

- **2026-07-17 (session 14, follow-up — Off-Plan Projects: Bayut "New
  Projects" import, reduces manual typing per user's explicit ask)**: User
  asked directly what could be done to connect real data without forcing
  manual entry of every project. Presented 3 real options (Bayut/PropertyFinder
  RapidAPI "New Projects Search" endpoint — same product already wired into
  `api/proxy-rapidapi.js`; official DLD open-data project registry via Dubai
  Pulse — needs a separate API key/registration, user's own task; AI-assisted
  extraction from a pasted developer URL/text). User chose option 1
  ("چون در حال حاظر اون API رو داریم" — because we already have that API).
  - **Server**: `api/proxy-rapidapi.js` — added `"new-projects"` to the
    Bayut endpoint allowlist (same host/rate-limit/auth already in place for
    `properties/list`/`auto-complete`/etc. — this is the identical RapidAPI
    product, just a different endpoint on it).
  - **Honesty constraint, disclosed explicitly rather than guessed away**:
    this session's WebFetch attempts against every Bayut/RapidAPI
    documentation source (bayutapi.com, dlthub.com, apidojo.net,
    rapidapi.com hub pages) were blocked (403 — bot protection), so the
    exact response field names for this endpoint could not be verified
    against a live key from this sandbox. Built accordingly: parsing is
    deliberately defensive (`_parseBayutOffplanCandidate()` in `js/app.js`
    tries several plausible field names per value — `title`/`name`/
    `projectName`; `developer.name`/`developerName`/`company`; etc. — same
    defensive multi-fallback pattern already established for Property
    Finder/Bayut listing photos elsewhere in this app) and a failed/empty
    response shows a clear, honest message telling the admin the endpoint
    may need a one-time adjustment once tested live, rather than crashing
    or silently returning nothing.
  - **Scope, deliberately limited**: only name/developer/area/handover-date/
    source-link are auto-filled from Bayut — per-unit-type PRICING is never
    auto-filled, since list-level project data from this API isn't known to
    reliably carry real per-unit PSF, and Directive #2 (max 3% error, all
    numbers must be accurate) means an admin must always enter/verify real
    pricing before anything publishes. This keeps a human review step (no
    auto-publish of scraped data as fact) while genuinely removing the
    "type every project by hand" burden the user was asking to eliminate.
  - **`js/app.js` `renderAdmin()`**: new "Import from Bayut (New Projects)"
    subsection inside the existing Off-Plan Projects admin card — area
    input + Fetch button, each returned candidate shown as a name/developer/
    area row with a "Use in Quick Add" button that pre-fills
    `ADMIN_OFFPLAN_STATE.quickAdd` (name/developer/area/expectedHandover/
    source/sourceUrl) so the admin only needs to add project stage, launch
    date, payment plan, and real unit-type pricing before publishing —
    reusing the exact same Quick Add form and `_adminQuickAddOffplan()` flow
    already built, no new publish path.
  - Verified: `node -c` on both touched files (a real bug was caught and
    fixed here — a missing closing brace in the new "Use in Quick Add"
    button's style object produced a genuine syntax error; found via a
    custom string/comment-aware brace-balance checker after `node -c`'s own
    error location proved slightly misleading on first read, confirmed
    fixed via a clean re-run of the same checker + `node -c`); and a
    real-browser Playwright pass with a mocked `new-projects` response
    (2 candidates using 2 different field-name conventions on purpose, to
    exercise the defensive fallback parsing) — confirmed both candidates
    render with correctly-parsed developer/area, and clicking "Use in Quick
    Add" on the first one correctly pre-fills `ADMIN_OFFPLAN_STATE.quickAdd`
    with the parsed name/developer/area/handover date/source/sourceUrl —
    zero non-network console errors.
  - **Manual step required before this is useful live**: none beyond what
    was already required (`supabase-offplan-schema.sql` still not run) — the
    Bayut import itself needs no new env var or migration, since it reuses
    the existing `RAPIDAPI_KEY` already configured for every other Bayut/PF
    feature. The one thing to verify once live: confirm the `new-projects`
    endpoint path/response shape actually matches what
    `_parseBayutOffplanCandidate()` expects — if the admin's "Fetch" button
    shows the new honest error message or an empty result, share the exact
    HTTP status/response body and the parser can be corrected in one edit.

- **2026-07-17 (session 14, follow-up — Off-Plan Projects schema revised to
  match how Dubai launches actually work, before the SQL was ever run)**:
  Direct continuation of the Off-Plan Projects build below — before running
  `supabase-offplan-schema.sql` for the first time, the user explained (as
  real domain expertise) the actual off-plan launch process: developers open
  registration weeks before launch (area/design/community/unit-count details
  shared, no firm pricing yet), then launch day sells at real per-unit
  pricing set individually by the developer for each unit/townhouse/villa.
  User asked for a small web search on how this actually works and my
  judgment on how the tab should be structured, then — after 3 concrete
  gaps were found — gave broad authorization to fix everything now, since
  the SQL hadn't been run yet (cheapest possible time to change the schema):
  "هنوز SQL رو اجرا نکردم / هر چیزی که نیاز هست و باعث بهبود در روند میشه رو
  انجام بده" (I haven't run the SQL yet — do whatever improves the process).
  - **Research confirmed 3 real gaps in the first version**: (1) no field
    for the actual project lifecycle (Pre-Launch/EOI → Launched → Under
    Construction → Handed Over) — the first schema only had launch/handover
    dates, no way to record where a project currently sits between them;
    (2) no payment plan field, despite being one of the biggest real
    decision factors for an off-plan buyer (10/70/20, 60/40, 1% monthly,
    post-handover plans are all materially different commitments); (3) most
    importantly, pricing is set PER UNIT TYPE by the developer — a studio, a
    townhouse, and a villa in the same masterplan can have completely
    different PSF — but the first schema had one flat `launch_psf`/
    `unit_types text[]`/`size_min`/`size_max` per PROJECT, unable to
    represent this at all.
  - **`supabase-offplan-schema.sql` rewritten** (still not yet executed,
    zero production impact from this revision): `offplan_projects` gained
    `project_stage` (checked enum: prelaunch/launched/under_construction/
    handed_over, default prelaunch) and `eoi_open_date`/`payment_plan`
    (both nullable — real data won't always have these). Its old review
    workflow column was renamed `status`→`review_status` to avoid colliding
    with the new lifecycle `project_stage` field (both are legitimately
    "status-shaped" but mean different things). New `offplan_unit_types`
    table (project_id FK `on delete cascade`, unit_type, launch_psf, size_min,
    size_max) replaces the old flat per-project pricing fields entirely —
    RLS gated on the parent project being published, same pattern as every
    other public-read policy in this file. `submit_offplan_project()` and
    `admin_add_offplan_project()` both now accept a `p_unit_types jsonb`
    array and loop-insert one `offplan_unit_types` row per entry;
    `admin_pending_offplan_projects()` aggregates each project's unit types
    back into a `jsonb_agg(jsonb_build_object(...))` column so the admin
    queue can show the full picture in one RPC call.
  - **`js/offplan.js` rebuilt to match**: `computeOffPlanForecast()`
    signature changed from `(project,devRecord)` to
    `(area,launchDate,expectedHandover,launchPSF,devRecord)` — decoupled
    from a single project object entirely, since a forecast is now computed
    once PER UNIT TYPE, not once per project. New
    `_offplanProjectForecasts(p,devRecord)` computes one forecast per real
    unit type on a project (falls back to a synthetic "General" entry only
    if a project genuinely has none, and never renders it if there's no
    real PSF behind it — no fabricated forecast). New
    `_parseUnitPricing(str)` — a compact "UnitType:LaunchPSF:SizeMin-SizeMax"
    comma-separated shorthand (e.g. "Studio:1500:400-550, 1BR:1650:750-900")
    used by both the public submit form and the Admin Quick Add form — the
    pragmatic MVP input for per-unit-type pricing without building a full
    dynamic add/remove-row form. `offplanLoad()` now fetches
    `review_status=eq.published` (not the old `status`) and embeds each
    project's unit types via PostgREST's relationship syntax
    (`select=*,unit_types:offplan_unit_types(...)`) in the same request — no
    second round-trip needed. `_renderOffplanCard()` now renders one
    Launch/Handover/+5yr price block PER UNIT TYPE within a project, plus new
    stage/payment-plan/EOI-date badges and meta text.
  - **`js/app.js` Admin Dashboard updated to match**: `ADMIN_OFFPLAN_STATE
    .quickAdd` gained `projectStage`/`eoiOpenDate`/`paymentPlan`/
    `unitPricing` (replacing the old flat `launchPSF`/`sizeMin`/`sizeMax`/
    `unitTypes`); `_adminQuickAddOffplan()` now validates and parses unit
    pricing via the same shared `_parseUnitPricing()` from `js/offplan.js`
    (safe to call across files since all `<script defer>` tags finish
    loading before any render/click handler ever runs) and sends the new RPC
    param shape; the Quick Add form grid gained a Project Stage dropdown, EOI
    Open Date field, and Payment Plan field, plus the same unit-pricing
    shorthand input; the pending-submissions list now shows each project's
    real stage label, payment plan, and a compact per-unit-type PSF summary
    (e.g. "Studio @1400, 1BR @1500") instead of a single flat PSF.
  - Verified: `node -c` on both touched files; a Node vm-sandbox test (7
    cases) — forecast computation with/without developer track record
    (confirmed the two differ and `hasDevData` flips correctly), the
    shorthand parser correctly extracts unit type/PSF/size-range and
    silently drops malformed entries without throwing, a multi-unit-type
    project produces one correctly-differentiated forecast per unit type,
    a project with zero real unit pricing produces an empty (not fabricated)
    forecast array, and an unknown area still falls back gracefully; and 3
    real-browser Playwright passes — the public Off-Plan tab rendering a
    mocked multi-unit-type published project (stage badge, EOI/payment-plan
    meta text, and 2 separate correctly-priced unit-type price blocks all
    confirmed via screenshot, numbers matching the Node test exactly), the
    submit form showing all 4 new fields (confirmed case-insensitively,
    since the visible on-screen text is uppercase via this app's existing
    `textTransform:"uppercase"` label styling — a known case-sensitivity
    quirk in `innerText`-based checks, not a rendering bug), and the Admin
    Dashboard's pending-submissions queue + Quick Add form both rendering
    the new fields and correct per-unit-type summary against a mocked
    `admin_pending_offplan_projects` response — zero non-network console
    errors in any pass.

- **2026-07-17 (session 14, new feature — Off-Plan Projects tab)**: User
  asked for a section where off-plan projects from different developers can
  be tracked, with a price-growth forecast from launch→handover and
  handover→+5yr, based on each developer's own track record, similar
  developer projects, other developers' projects in the same area, and
  current market trends — "so people can analyze a project before buying
  with a better result." Scoped through several clarifying rounds before
  building: (1) data sourcing — user wants Property Finder/Bayut (already
  integrated via `api/proxy-rapidapi.js`) plus Tamani Properties and
  developer-own websites, but this session has no live network access to
  actually pull that data; (2) prediction approach — reuse the existing,
  already-trusted `AREAS[].g` growth engine rather than building a separate
  model (user's explicit preference); (3) nav placement — new sub-tab under
  Market, alongside Analyzer/Find/Map (frozen-nav rule requires explicit
  approval + table sync for any new sub-tab); (4) who can add/edit projects —
  user asked for my take on combining admin-direct vs. community-submission;
  proposed and built a hybrid (below).
  - **Explicit scope for this session**: build the complete structure (data
    schema, forecast engine, UI, admin review workflow) with ZERO fabricated
    project or developer data — DubaiVal's own Directive #2 (max 3% error,
    "ALL numbers... MUST be accurate") makes seeding a live production
    database with placeholder project names or invented developer stats
    unacceptable, even clearly labeled. The tab ships with a real, working,
    graceful empty state instead; real data gets added once sourced, per a
    plan to be worked out with the user next.
  - **New Supabase migration**: `supabase-offplan-schema.sql` (requires
    manual execution) — `offplan_projects` (name/developer/area/launch date/
    expected handover/launch PSF/unit types/size range/source/status) and
    `developer_track_record` (tier, projects tracked, avg growth
    launch→handover %, avg growth handover→+5yr %). RLS: public can only
    ever see `status='published'` rows; every write goes through a
    SECURITY DEFINER RPC (`_admin_password_ok()`, same pattern as every
    other admin RPC in this project), never a raw client INSERT, so a
    tampered client request can't self-publish a submission.
  - **Ownership model (hybrid, per user's explicit ask)**:
    `submit_offplan_project()` — any signed-in user can submit a project;
    always lands as `status='pending'`, invisible publicly.
    `admin_add_offplan_project()` — admin adds directly as already-published
    (admin is the trusted curator, no second review step needed for their
    own additions). `admin_review_offplan_project()` — approve/reject a
    pending submission, with an optional rejection reason. This is the exact
    same "queued, then admin-verified" pattern already used for OFM listing
    document verification (`supabase-ofm-trust-safety.sql`) — reused
    deliberately rather than inventing a second review mechanism.
  - **`js/offplan.js`** (new file) — `computeOffPlanForecast(project,
    devRecord)`: uses the area's own real `AREAS[].g` growth curve
    (annualizing the 1-3yr figure as the construction-period proxy,
    compounded over the actual launch→handover span) as the PRIMARY driver;
    when a developer's track record exists (`projects_tracked>=1` and a
    real average growth figure entered), blends it in at a damped 30% weight
    so a handful of past projects can't swing the number wildly — with NO
    developer data, stays 100% area-based and is explicitly labeled
    "Indicative — area growth only, no developer history yet" rather than
    silently implying developer-specific insight it doesn't have.
    `renderOffPlan()`: area/developer filters, sort (handover date/highest
    growth/newest), a public "Submit a Project" form (any signed-in user —
    prompts sign-in if not), and a 3-stat forecast card per project (Launch
    PSF → At Handover → +5yr Post-Handover, with % change and a confidence
    line). Graceful empty states both for "no projects tracked yet" and for
    the Supabase tables not existing yet (pre-migration).
  - **`js/app.js` `renderAdmin()`** — new "◆ Off-Plan Projects" card:
    pending-submissions queue (Approve / Reject with optional reason), a
    "Quick Add (Published Immediately)" form, and a "Developer Track Record"
    editor (tier, projects tracked, both avg-growth figures, notes) — this
    is the ONLY place real developer performance data enters the system,
    and the forecast engine reads it back automatically via the public
    `developer_track_record` table.
  - **Nav wiring**: `js/core.js` `NAV_SECTIONS` — added `{id:"OffPlan",
    label:"Off-Plan"}` to Market's `subs`, right after `Find`. `js/app.js`
    — added the routing branch and a `TAB_TO_SECTION` entry (for the tour/
    deep-link system). This file's frozen-nav table updated to match (all
    3 kept in sync per the standing rule).
  - Verified: a Node vm-sandbox test of `computeOffPlanForecast()` — confirms
    it stays area-only with no developer record (correctly labeled
    "Indicative"), correctly shifts the projection once a developer record
    is supplied, produces sensible non-negative growth for a real area
    (Business Bay) and gracefully falls back (no throw) for a completely
    unknown area name; `node -c` on all 3 touched files; and 2 real-browser
    Playwright passes — one on the public Off-Plan tab (mocked Supabase 404s
    to simulate the pre-migration state) confirming the graceful "Off-Plan
    data isn't available yet" message renders and the full "Submit a
    Project" form opens with all fields correctly, one on the Admin
    Dashboard (mocked a pending submission) confirming the review queue,
    Approve/Reject buttons, Quick Add form, and Developer Track Record
    editor all render correctly — zero non-network console errors in either
    pass.
  - **Not done this session, explicitly deferred to a follow-up with the
    user**: actually sourcing real off-plan project data (Property Finder/
    Bayut API integration for off-plan listings specifically, Tamani
    Properties, developer websites) and seeding real developer track-record
    figures — this session has no live network access to pull any of that,
    and the user asked to build the structure first, then decide together
    how to connect real data sources.

- **2026-07-17 (session 14, service charge made fully manual in the single-
  property Analyzer)**: User reported checking service charges shown by the
  app and finding several wrong ones, tracing it to the engine's automatic
  fallback to the building/area database's `sc` field whenever the
  Analyzer's optional "Service Charge (AED/sqft/yr)" field was left blank.
  Explicitly scoped the fix after a clarifying exchange: manual-only applies
  **strictly to the single-property Analyzer flow** (sale valuation, rental
  valuation, Smart Rent check) — bulk/multi-building contexts (Smart
  Discovery/Screener, Map, Portfolio-wide sustainability scoring) have no
  per-property manual entry point at all and were explicitly left untouched,
  still using the database/live-data fallback as before.
  - **`js/valuation.js`** — 4 functions that reference the Analyzer's `f`
    (form) object no longer fall back to `bData.sc`/`aData.sc` for the
    ACTUAL reported service charge figure, only `parseFloat(f.serviceCharge)`
    or a flat, clearly-generic 15 AED/sqft/yr placeholder if left blank:
    `computeValuation()`'s netYield calc, `computeSmartRent()`, and
    `computeRentalValuation()`. `computeValuation()`'s Margin-of-Safety
    "Building Quality & Condition" component keeps `aData.sc` (an area-wide
    average, not one potentially-wrong per-building entry) as the
    COMPARISON BENCHMARK only — the number being judged (`scPSF`) is
    manual-only, same as everywhere else. Left the 3 bulk-scan functions
    (`estimateBuildingYield`, `estimateBuildingRentYield`,
    `estimateRentalDemandScore` — none take an `f` param, all iterate many
    buildings at once for Find/Map/Discovery) completely unchanged.
  - **`js/core.js`** — `computeSustainabilityScore()`'s "Service Charge
    Efficiency" component (25% of the score) previously scored `bData.sc`
    directly with zero connection to the Analyzer form at all. Added an
    optional 5th `manualSC` param; the efficiency sub-score now stays
    neutral (70, no penalty/bonus) unless the user has actually entered
    their own service charge, comparing it against the area average
    (again, a benchmark only). Portfolio's 3 bulk sustainability call sites
    (`js/portfolio.js`) deliberately left unchanged — no per-asset manual
    override field exists there, out of scope per the user's own framing.
  - **`js/market.js`** — Analyzer result's own `computeSustainabilityScore`
    call site now passes `f.serviceCharge`; added a new "Service Charge"
    row to the existing "Confidence Factors" panel
    (User-provided / Not provided — generic estimate used) so the new
    manual-only behavior is visible, not a silent change.
  - **`js/workspace.js`** — Report Builder's sustainability section call
    site (reads from `analyzerState.f`) updated to pass
    `analyzerState.f.serviceCharge` too.
  - **`js/app.js`** — both PDF export templates (English + Arabic) had a
    sub-caption literally printing `val.bData.sc` next to the Service
    Charge metric, presenting the untrusted per-building DB figure as fact
    on an exported document. Now shows "User-provided" vs "Generic estimate
    — enter yours for accuracy" (Arabic: "أدخلها المستخدم" / "تقدير عام")
    based on whether `f.serviceCharge` was actually entered.
  - Verified: `node -c` on all 5 touched files; a Node vm-sandbox test
    confirming a real building with a real (non-15) `bData.sc` no longer
    gets silently substituted into `val.sc`/netYield when the field is left
    blank (uses the flat 15 default instead), confirming the manual value IS
    used correctly when provided, and confirming the sustainability score's
    efficiency component stays neutral (70) with no input and reacts
    correctly once one is given; a broader regression pass computing
    `computeValuation()` across a sample of real buildings/areas with mixed
    manual-SC-present/absent inputs, 0 throws.

- **2026-07-17 (session 14, follow-up — Market Dashboard's PSF/Yield
  histograms made clickable)**: Direct follow-up to the Home redesign above
  — user flagged the "PSF Distribution"/"Yield Distribution" bar charts on
  Market Dashboard (`renderMarket()`, `js/market.js`) as "خیلی بزرگ و بدرد
  نخور" (very big/heavy and useless) with no real function. Confirmed by
  reading the code: neither histogram had a single click handler on any bar
  — purely decorative, despite being a real distribution of the actual
  9,226-building/347-area dataset.
  - **Fix**: every bar in both histograms is now clickable — clicking a PSF
    bucket (`<1K`/`1-1.5K`/`1.5-2K`/`2-3K`/`3K+`) or a Yield bucket
    (`<5%`/`5-6`/`6-7`/`7-8`/`8%+`) navigates to Market → Find (the Advanced
    Market Screener), pre-fills `FIND_STATE.sf.minPSF`/`.maxPSF` (or
    `.minYield` for the yield bars) to match exactly that bucket, and
    auto-runs the search — turning a static "here's the shape of the market"
    chart into a real "show me the buildings behind this bar" shortcut, with
    zero duplicated filtering logic (it drives the screener's own existing
    "DISCOVER PROPERTIES" button via a new stable `id="dvScreenerDiscoverBtn"`
    rather than reimplementing the building-matching logic a second time).
    Added a small "Tap a bar to browse those buildings" hint under each
    chart title, plus a hover-opacity cue on each bar, so the new
    interactivity is discoverable.
  - Verified: `node -c` on both touched files; a Playwright test clicking
    the real "2-3K" PSF bar end-to-end — confirmed it navigated to
    Market/Find, set `sf.minPSF=2000`/`sf.maxPSF=3000`, and populated
    `sf.results` with real buildings correctly inside that PSF range (e.g.
    "Bluewaters Bay - Building 9" at PSF 2508) — zero non-network console
    errors.

- **2026-07-17 (session 14, Home page redesign — Market Cycle widget
  replaces "Explore Platform")**: User asked, after noticing the Market
  Dashboard's "All"-view market-cycle chart (2026-07-15 session, showing
  Dubai's 2002-present boom/bust history), whether adding something similar
  to the Home tab would make it more visually engaging, and whether it
  should replace an existing Home section or just be appended. Reviewed all
  6 of Home's current sections (Hero, AI Search, Top Opportunities, Explore
  Platform, Portfolio, Recent Activity) and recommended replacing "Explore
  Platform" specifically — confirmed by the user.
  - **Why Explore Platform**: it was just 6 shortcut tiles (Deal Board, AI
    Chief, Map, Workspace, Advisor, News) that deep-link to destinations
    already one tap away in the persistent sidebar/bottom-tab nav — the
    lowest-unique-value section on the page, with no live/real data of its
    own, unlike every other section.
  - **Fix**: moved `MARKET_CYCLE_INDEX` (the 2002-present illustrative
    index) from being a local `var` re-declared on every `renderMarket()`
    call (`js/market.js`) to a single shared global in `js/core.js` (loads
    before both `market.js` and `app.js`) — avoids duplicating the dataset
    a second time for Home's own widget. `renderHome()`'s old "④ EXPLORE"
    section (`js/app.js`) is now "④ MARKET CYCLE": a compact card with the
    current index value, a "+329% since 2002"-style badge, a smoothed SVG
    trend line (green/red depending on overall direction, same curve-drawing
    technique as the Dashboard's chart, just condensed), and a "VIEW FULL
    MARKET CYCLE →" button/card-click that pre-sets
    `window.CHART_STATE.view="All"` before navigating to Market Dashboard,
    landing directly on the same full chart instead of the default 1-year
    view.
  - Verified: `node -c` on all 3 touched files; a Playwright test confirming
    the widget renders with real computed values (index 429, +329% since
    2002) at full opacity once its fade-in animation completes, and that
    clicking "VIEW FULL MARKET CYCLE" correctly navigates to Market/Dashboard
    with `CHART_STATE.view` set to `"All"` — zero non-network console
    errors. Note: an early screenshot pass appeared to show the section
    "missing" — turned out to be the same `dv-fu`/`dv-fu-N` CSS fade-up
    animation used by every Home section (opacity 0 until its delay+duration
    elapses, ~0.8s total) simply not having finished yet at the moment that
    particular screenshot was captured, not a real rendering bug — confirmed
    by re-checking computed `opacity` after the animation's own timing
    window had genuinely passed.

- **2026-07-17 (session 14, CRITICAL — hidden `#admin` route unreachable by
  direct URL since 2026-07-07)**: User reported they could not find/reach
  the Admin dashboard at all after being given the `dubaival.com/#admin`
  URL + password. Investigated instead of assuming user error, and found a
  real, 10-day-old regression.
  - **Root cause**: `js/app.js`'s `render()` has a one-time check,
    `if(!window._adminHashChecked&&window.location.hash==="#admin"){...}`
    (line ~2463), that's supposed to route a fresh page load of `#admin`
    straight to the Admin dashboard. But `js/core.js` (which always
    executes BEFORE `app.js`, since deferred `<script>` tags run in
    document order) has a small top-level IIFE that runs at module-load
    time — added 2026-07-07 to guarantee `history.state` is populated on
    the very first page load (fixing an unrelated back-button edge case) —
    that unconditionally called
    `history.replaceState(stateObj,"",  "#"+currentSection+...)` using
    `currentSection`/`currentSubTab`'s hardcoded module-level DEFAULTS
    (`"Home"`/`""`), since nothing has parsed the real URL yet at that
    point. This silently rewrote the browser's URL from `#admin` to
    `#Home` via `replaceState` before `app.js` even loaded — so by the time
    `render()` finally ran (deliberately deferred to `DOMContentLoaded` per
    the 2026-07-12 script-`defer` performance fix) and checked
    `window.location.hash==="#admin"`, the hash had already been clobbered
    to `#Home` and the condition was always false. This is the ONLY
    hash-based deep link anywhere in the app (confirmed via a full grep for
    `location.hash` across every `js/*.js` file) — so this one regression
    made the hidden Admin route completely unreachable by direct URL for
    10 days straight, with no other route affected (everything else is
    driven by in-app `pushState`/`popstate`, not the initial URL).
  - **Fix**: the IIFE now only defaults the hash to `#Home` when the page
    loads with NO hash at all (`window.location.hash||("#"+currentSection+...)`)
    — preserving whatever hash was actually in the URL (like `#admin`)
    instead of unconditionally overwriting it, while still guaranteeing
    `history.state` is non-null on first load for the original back-button
    fix this IIFE was added for.
  - Verified: a Playwright test doing a genuinely FRESH navigation
    (`page.goto('.../index.html#admin')`, not an in-app click) — confirmed
    `window.location.hash` stays `"#admin"` after load and the rendered
    page shows the real "◆ DUBAIVAL ADMIN" password screen, not Home.
    `node -c js/core.js`.

- **2026-07-17 (session 14, follow-up — global sub-tab pill bar lightened)**:
  Direct continuation of the spacing feedback above — user also asked
  whether the top sub-tab row's large/bold text ("Deal Board / AI Agents /
  AI Chief of Staff", etc.) was good design, flagged because it now sits
  directly above the new colored agent-selector pill row and the two looked
  like competing rows of navigation. Confirmed this is `.dv-pill`/
  `.dv-subtabs` in `index.html` — ONE shared CSS component used for every
  section's sub-navigation app-wide (Market, Portfolio, Network, SocialMedia,
  More), not something scoped to AI Assistant — so this needed a decision
  before touching it. Asked via `AskUserQuestion`; user chose "lighten it
  everywhere" (the recommended option) over a page-scoped-only fix.
  - **Fix**: `.dv-pill` font-size 13px→12px, font-weight 600→500 (700→600
    when active), padding 8px 16px→7px 14px. Purely a CSS token change, no
    JS touched — applies identically to every sub-tab bar across the whole
    app, giving these page-level nav rows a quieter, secondary visual weight
    relative to feature-level controls like the new agent-selector pills.
  - Verified: a Playwright screenshot of the AI Agents chat view confirming
    the top sub-tab row (Deal Board/AI Agents/AI Chief of Staff) now reads
    clearly secondary to the colored agent-selector pill row beneath it.

- **2026-07-17 (session 14, follow-up — AI Agents chat spacing)**: User
  shared 2 real screenshots from the live deployed site. One (AI Assistant /
  Chat tab, Valuation Agent active) confirmed the earlier AI Agents redesign
  IS live and rendering correctly (real colored icon badges, not text) — but
  flagged the vertical spacing in that same view as too tight ("فاصله بین
  نوار بالا و مثال‌های پایین... فاصله کم نیست؟"): the active-agent header
  card, the first assistant message bubble, the suggestion chips, and the
  input row were all bunched close together with minimal breathing room.
  Confirmed by inspection: `hdr` had only `marginBottom:"10px"`, `msgsDiv`
  had `paddingTop:"8px"`, and the suggestions block had `marginBottom:"10px"`
  — all tight margins stacked on top of each other.
  - **Fix, `renderChat()` in `js/chat.js`**: increased breathing room across
    the whole header→messages→suggestions→input stack — `hdr` marginBottom
    10px→18px (plus a small marginTop for extra separation from the agent
    selector row above it), `msgsDiv` paddingTop 8px→4px/gap 12px→14px/
    paddingBottom 12px→16px, suggestions gap 7px→8px/marginBottom 10px→16px,
    and the agent-selector bar's own paddingBottom 12px→14px.
  - The other screenshot (Media Studio/Studio tab) still showed the OLD
    raw-icon-as-text bug (literal "palette"/"smartphone"/"eye"/"rocket"/
    "trending-up" text) despite that fix having already been committed and
    pushed earlier this session — almost certainly because the user
    redeployed once (picking up the AI Agents fix, confirmed live in the
    first screenshot) but hadn't yet re-run the deploy commands a second
    time to pick up the separate, later Media Studio commit. Flagged this
    explicitly to the user rather than assuming the fix itself had failed.
  - Also flagged, not yet acted on (deferred to the user's decision since it
    has app-wide blast radius): the top-level sub-tab pill bar (`.dv-pill`/
    `.dv-subtabs` in `index.html`, used identically for EVERY section's
    sub-navigation — Market/Portfolio/Network/SocialMedia/More, not
    exclusive to AI Assistant) renders at 13px font-size / 600-700 font-
    weight, which the user felt looked heavy/oversized, especially now that
    it sits directly above the new, visually similar (but smaller/lighter)
    agent-selector pill row from this session's AI Agents redesign — two
    stacked rows of pill-shaped buttons with different weights can read as
    competing navigation. Not changed without confirmation since it's a
    single shared component affecting every tab in the app, not scoped to
    this page.
  - Verified: `node -c js/chat.js`; a Playwright screenshot of the Valuation
    Agent chat view confirming visibly more breathing room between the
    header card, first message, and suggestion chips.

- **2026-07-17 (session 14, follow-up — Social Media Manager / Media Studio
  redesign)**: Direct continuation of the AI Agents redesign above — user
  raised the same "old/dead website" complaint about Network → SocialMedia →
  Studio (where AI Video Studio, Edit Video, and the Social Media Manager
  agent all live), asking whether the SMM agent should be moved back out to
  the main AI Agents tab or whether the design itself could just be fixed.
  Recommended (and, after user agreement, executed) keeping the agent where
  it is — moving it back would recreate the exact "SMM tools scattered
  across tabs" problem a past session deliberately consolidated — and fixing
  the visual design instead.
  - **Real bug found, much bigger than expected**: `makeToolGrid()`
    (`js/chat.js`, `renderMediaStudio()`) rendered every tool card's `icon`
    field via `div({fontSize:"24px"},tool.icon)` — since `div()`/`el()` set
    that as plain `textContent`, and `tool.icon` values are lucide ICON
    NAMES ("video", "scissors", "palette", "smartphone", "eye", "rocket",
    "brain", "hash", etc.), every single tool card on this page — Setup
    excluded, ~25 cards across Create/Analytics/Advanced AI Tools/Avatar
    Studio — was literally displaying the raw word "video"/"scissors"/
    "palette"/etc. at 24px instead of an icon. Confirmed via a real
    Playwright screenshot before touching any code. This was almost
    certainly the single biggest driver of the "looks like an old/dead
    website" complaint — a page where every card shows a stray English word
    instead of an icon reads as broken/unfinished at a glance. Also found 2
    bogus icon names hiding inside an otherwise-correct lucide-name list —
    `"LM"` (Create Avatar) and `"HD"` (Translate) — neither is a real lucide
    icon or a meaningful abbreviation (unlike the deliberate "IG"/"FB"/"WA"
    platform-monogram convention used elsewhere in this file); fixed to
    `"user-plus"` and `"languages"` respectively.
  - **Fix**: `makeToolGrid()` now renders a real `<i data-lucide="...">`
    icon inside a colored badge (`hexAlpha(color,0.14)` circle at rest,
    brightening on hover) — same visual language as the AI Agents pill
    redesign above, and the card border itself now carries a faint
    permanent tint of its section's color (`hexAlpha(color,0.18)`) instead
    of being neutral gray until hovered.
  - **Layout fix — the SMM chat was sandwiched mid-grid behind an
    inconsistent divider style**: the CREATE section used to render 2 video
    tools, then a centered-emoji-label-between-two-1px-rules divider
    ("💬 AI SOCIAL MEDIA MANAGER"), then the embedded outreach-agent chat,
    then a second divider, then 3 more tool cards — a visual language
    (line-dividers) used nowhere else on this page (every other section
    uses `makeSectionHeader`'s left-border label). Restructured: all 5
    CREATE tools now form one contiguous grid (video tools still lead,
    preserving the 2026-07-13 session's deliberate value-ordering decision
    that video tools should come first), and the chat moved to its own
    section afterward with a real `makeSectionHeader` label ("OR CHAT WITH
    YOUR AGENT") in the outreach agent's own orange (`#F97316`) instead of
    the arbitrary gold borrowed from CREATE — consistent with every other
    section header on the page, and no longer reads as an unrelated patch
    dropped mid-layout.
  - Verified: `node -c js/chat.js`; Playwright screenshots of Media Studio
    (before/after — before clearly shows literal "video"/"scissors"/
    "palette"/"smartphone"/"eye" text instead of icons; after shows clean
    uniform badge cards and the chat correctly separated under its own
    orange header), the expanded Analytics section, and the Avatar Studio
    tab (confirms the same fix + the "LM"→"user-plus" rename render
    correctly there too) — zero console errors in any pass. Same sandbox
    limitation as the AI Agents redesign: actual icon GLYPHS don't render
    in these screenshots since `lucide.js` loads from the `unpkg.com` CDN
    and this sandbox's proxy blocks it — confirmed this is a
    test-environment limitation, not a code defect (the icon-injection
    pipeline itself, `lucide.createIcons()` in `js/app.js`, is unchanged);
    icons will render correctly on the live site.

- **2026-07-17 (session 14, AI Agents visual redesign)**: User paused the
  WhatsApp real-message-delivery investigation to raise a direct design
  complaint about Network → AI Agents: "دیزاین کارتها و خود قالب AI agents
  خیلی قدیمی و شبیه سایت های مرده نیست؟" (isn't the AI Agents card/template
  design very old, like a dead website?) — then, after hearing the proposed
  direction, gave a direct go-ahead: "الان صبح ، با توجه به توضیحاتی که دادی
  فیکسش کن" (it's morning now, go ahead and fix it based on what you
  explained).
  - **Root cause of the "dead website" look**: `AI_AGENTS` (`js/chat.js`)
    already carries a real per-agent `color` (8 distinct hex values) and a
    real lucide `icon` name for each of the 8 agents — but the agent
    selector bar rendered every pill as the same flat neutral
    `cl.surface`/`cl.border` regardless of which agent was active or what
    its color was, and the "active agent" header above the chat thread was
    a plain text line with no icon, no color, no visual weight at all. All
    8 agents' own distinct branding data existed and was simply never used
    anywhere in the render — a real gap, not a stale asset.
  - **Fix, `renderChat()` in `js/chat.js`**: the agent-selector pills now
    render a small colored icon-badge (`hexAlpha(agent.color,...)` fill)
    inside each pill, and the ACTIVE pill gets a real gradient background
    (`linear-gradient` from a 22%-alpha to an 8%-alpha tint of the agent's
    own color), a matching colored border, and a soft colored glow
    (`box-shadow`) — inactive pills stay visually quiet so the active one
    reads clearly. The active-agent header above the thread was rebuilt
    entirely: a 42px rounded icon tile (colored fill + border + glow) next
    to the agent's name (in its own color) and description, on a
    gradient-tinted card background — replacing the old plain text line.
    Every part of this is driven by the existing `agent.color`/`agent.icon`
    fields, so switching agents (e.g. General → Valuation) instantly
    re-themes the whole selector + header to the new agent's own color with
    zero additional data needed.
  - Verified: `node -c js/chat.js`; two Playwright screenshots (480×900,
    tour overlay force-removed) — one on the default "General" agent
    (gold theme) and one after programmatically switching to "Valuation"
    (green theme) — confirmed the pill/header colors, gradient, and glow
    correctly re-theme end-to-end. Note: the lucide icon GLYPHS themselves
    did not render inside the colored badges in these sandboxed
    screenshots, since `lucide.js` loads from the `unpkg.com` CDN and this
    sandbox's outbound proxy blocks that domain — confirmed this is a
    test-environment limitation, not a code defect, by checking that
    `lucide.createIcons()` (already wired into `js/app.js`'s render
    pipeline, unchanged this session) is the only thing standing between
    the `data-lucide` tags and a real rendered icon; icons will render
    correctly on the live site where the CDN is reachable.

- **2026-07-16/17 (session 13, follow-up — Inbox stayed empty even after
  the user_id fix, because social_inbox's live schema drifted from the repo's
  own schema file)**: Direct continuation of the `user_id` fix above. After
  running `supabase-inbox-user-id-fix.sql` and re-sending the manual curl
  webhook test, `SELECT * FROM social_inbox` still came back empty — until
  introspecting the ACTUAL live columns (`information_schema.columns`, since
  the repo's `supabase-inbox-schema.sql` turned out not to be trustworthy
  ground truth) revealed `social_inbox` has no `received_at` column at all —
  it has `created_at` instead — while `email_inbox` genuinely does have
  `received_at` (confirmed the same way). `js/inbox.js` fetched BOTH tables
  with the same `&order=received_at.desc` — which 400's outright for
  `social_inbox`, so the Inbox fetch for social messages has always failed
  silently regardless of whether any rows existed underneath.
  - **Fix**: `js/inbox.js`'s `social_inbox` fetch now orders by `created_at`
    instead; the client-side sort key (`ts: s.received_at` → `s.created_at`)
    and the per-card timestamp display (`d.received_at || d.ts` → `d.received_at
    || d.created_at`) updated to match. `email_inbox`'s `received_at` usage
    (fetch order + `api/inbox.js`'s Gmail ingestion) was double-checked
    against its own live schema and left untouched — correct as-is.
  - **Lesson for future sessions, written into the fix itself as a code
    comment**: this repo's `supabase-*.sql` files are not guaranteed to match
    what's actually deployed — a table can drift (extra/missing/renamed
    columns) from whatever the schema file says, especially for older
    features. When a query against a real table errors or silently returns
    nothing, check `information_schema.columns` directly before assuming the
    repo's schema file is accurate.
  - Verified: `node -c js/inbox.js`; not yet re-confirmed end-to-end live in
    this sandbox (no network access to the real Supabase project), but the
    fix directly matches the exact column set the user confirmed via a live
    `information_schema.columns` query against production.

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

- **🟡 View-system expansion — Stage 1 shipped, Stages 2-4 not started**
  (added 2026-07-26): direct follow-up to the multi-view combination work
  above. The user's own numbered plan has 4 stages; only Stage 1 (multi-view
  support + weighted combination formula) is done. Remaining:
  - **Stage 2**: add new, real, confirmed view types to `VIEW_P`/
    `_dvRentalViewPremium` and both Analyzer form option lists — Dubai
    Opera View (Downtown Dubai), Coca-Cola Arena View (City Walk), Burj Al
    Arab View, Atlantis View, Dubai Skyline View for villas at night
    (currently only exists generically, not villa/night-specific),
    Creek Harbour-specific views (Creek/Marina view with Downtown skyline
    backdrop, Park/landscaped view, Ras Al Khor Wildlife Sanctuary view) —
    all 5 confirmed real/marketed via WebSearch this session (not guessed),
    but their specific premium MAGNITUDES still need calibration against
    real market data per Directive #2, not just added at an arbitrary
    percentage.
  - **Stage 3**: extend the same Burj-Khalifa-style distance-dampening
    mechanism (`getViewDistanceInfo()`/`_dvViewDistCurve()`) to the new
    single-fixed-point landmark views from Stage 2 (Atlantis, Burj Al Arab,
    Dubai Opera) — needs new reference coordinates in `KEY_POIS` (or a
    similar structure) for each landmark, new `_dvXxxKm()` helper functions
    (`js/data-residential.js`, alongside the existing `_dvBurjKhalifaKm()`/
    `_dvNearestBeachKm()`), and `_dvIsDistanceSensitiveView()`/
    `getViewDistanceInfo()` extended to recognize these as additional
    "kind" categories beyond the current "landmark"/"sea".
  - **Stage 4**: area-quality-tier multiplier for Canal View (and possibly
    Skyline View) — the user asked directly whether the SAME view type
    should get different premiums depending on which area's canal segment
    it is (Business Bay canal vs. Al Jaddaf canal vs. Marina canal) — a
    real, unanswered product/calibration question flagged for a future
    session's judgment (mechanism and specific area-tier assignments not
    yet designed).
  - See the "multi-view support, Stage 1" work-log entry directly above for
    exactly what Stage 1 shipped (the `_dvCombineViewPremiums()` weighted
    formula, `_dvRenderViewFields()` progressive-disclosure UI, and the new
    "View Premium Breakdown" disclosure card).

- **🟡 Real per-area momentum engine — needs manual SQL** (added
  2026-07-22): run `supabase-real-momentum-schema.sql` in Supabase SQL
  Editor. Until it's run, `getRealMomentumFactor()` always returns `null`
  and `getMomentumFactor()` gracefully falls back to the pre-existing
  AI-estimated `MARKET_MOMENTUM` path (zero breakage, exactly the same
  behavior as before this change) — the new weekly `?action=momentum-refresh`
  cron (Sundays 07:20 UTC, already registered in `vercel.json`) will start
  populating real data the first time it runs after the migration is
  applied, but per-area confidence won't reach "high" until a few weeks of
  `price_history` have accumulated in both the recent and prior comparison
  windows (same bridging pattern as `growth_1yr_realized`). See the
  "real, automatic, per-area/per-property-type momentum engine" work-log
  entry above for the full design and the disclosed, deliberate side effect
  on every apartment/villa valuation's default Market PSF (the old flat
  -3%/+2% `MACRO_VARS.aptAdj`/`villaAdj` defaults were removed, since they
  were themselves exactly the "one flat percentage for every area" the user
  asked to have replaced).

- **🟡 LinkedIn + X/Twitter OAuth "Connect" — needs 2 new Developer Apps'
  credentials** (added 2026-07-21): set `LINKEDIN_CLIENT_ID`/
  `LINKEDIN_CLIENT_SECRET` (LinkedIn Developer App with "Sign In with
  LinkedIn using OpenID Connect" + "Share on LinkedIn" products) and
  `TWITTER_CONSUMER_KEY`/`TWITTER_CONSUMER_SECRET` (Twitter/X Developer App
  with OAuth 1.0a explicitly enabled + `https://www.dubaival.com/callback`
  registered as its callback URL) in Vercel env vars. Until either is set,
  that platform's "Connect" button in Profile shows a clear "not set up
  yet" message rather than a broken redirect. **Also**: the existing Meta
  App's permission request needs `instagram_content_publish`/
  `pages_manage_posts`/`ads_management`/`business_management` added (a real
  bug fix this session — the previously-submitted scope list could never
  actually publish anything) and re-submitted for App Review if not
  already included — check current review status before assuming these
  are approved. See the 2026-07-21 "real zero-touch OAuth 'Connect' flows"
  work-log entry above for the full design (all 3 flows are otherwise
  code-complete and tested).

- **🟡 Traffic & Funnel Stats (Admin Dashboard) — needs manual SQL** (added
  2026-07-21): run `supabase-visitor-stats-schema.sql` in Supabase SQL
  Editor (requires `supabase-analytics-events-schema.sql` and
  `supabase-admin-security-fix.sql` already applied, which they are). Until
  it's run, the Admin Dashboard's new "◆ Traffic & Funnel Stats" card shows
  a clear message pointing at this file instead of data — the purchase-
  success tracking/banner (`js/core.js` `dvTrack`/`renderPurchaseSuccessBanner`)
  work immediately regardless, since they only depend on the already-live
  `analytics_events` table. **Also a standing manual step, walked through
  with the user, not something this session can do**: once a real purchase
  has happened and shown up in `analytics_events`, mark `pro_upgrade_completed`
  (and optionally `signup_completed`/`analyze_property`/`analyze_rental`) as
  **Key Events** in GA4 — Admin → Events → find the event name → toggle
  "Mark as key event." No GA4 API access exists in this session to automate
  this step.

- **🟡 AI Voice Concierge — needs manual SQL + a real ElevenLabs/Twilio
  account + operator dashboard setup** (added 2026-07-20): run
  `supabase-voice-agent-schema.sql` in Supabase SQL Editor (requires
  `supabase-admin-security-fix.sql` and `supabase-chiefs-schema.sql` already
  applied, which they are). Then, when ready to actually go live (not yet,
  per the user — company/trade-license work is deferred, needed for Meta
  too):
  1. Set `ELEVENLABS_API_KEY` in Vercel env vars, then click "Create/Update
     Shared Agent" in Admin Dashboard → AI Voice Concierge — this creates
     the real shared agent via ElevenLabs' API and returns the exact URLs
     to paste into ElevenLabs' OWN dashboard for the 2 webhook tools
     (`lookup_market_knowledge`/`save_lead`) and the 2 webhooks
     (conversation-initiation/post-call) — see the work-log entry above for
     why this one piece is a manual dashboard step rather than a second API
     call (their nested tool-attachment JSON schema couldn't be verified
     live in this sandbox).
  2. Set `ELEVENLABS_WEBHOOK_SECRET` once ElevenLabs' dashboard shows it (the
     2 webhook actions accept unsigned requests until this is set — a
     deliberate degrade-open default so the feature isn't blocked before the
     operator has a real secret to configure, matching the same pattern as
     `WHATSAPP_VERIFY_TOKEN`/`META_WEBHOOK_VERIFY_TOKEN`).
  3. Buy a real Twilio phone number (confirmed via live research: Twilio
     sells UAE geographic numbers, but inbound-only, gated behind a
     Regulatory Bundle KYC step — the same category of external, operator-
     only process as Meta Business Verification), link it to the shared
     ElevenLabs Agent via ElevenLabs' own Twilio integration UI, then add it
     to the pool in Admin Dashboard → AI Voice Concierge — Number Pool.
  4. Confirm `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are set (already
     required for every other credit product — `voice-checkout` reuses
     them, no new Stripe setup needed).
  5. Re-check the default $9.99/60-minute bundle price
     (`VOICE_MINUTES_BUNDLE_PRICE_CENTS`/`VOICE_MINUTES_BUNDLE_MINUTES` env
     vars) once the real Twilio UAE per-minute rate is confirmed — this
     session's default is a reasonable starting estimate, not a verified
     final number, same disclosed-uncertainty class as the WhatsApp
     per-window price correction earlier in this project's history.
  Until all of the above are done: the whole feature degrades gracefully —
  Chiefs' "Voice" tab and Dashboard card show a clear "not set up yet"
  error rather than crashing, and the Admin cards show the same. Server-
  side code (all 3 touched files) is otherwise fully built and tested per
  this project's own audit-then-fix methodology — see the work-log entry
  above.

- **🟡 Reply Automation toggles — need manual SQL** (added 2026-07-19): run
  `supabase-reply-automation-toggle-schema.sql` in Supabase SQL Editor. Adds
  4 boolean columns (`auto_reply_email`/`auto_reply_whatsapp`/
  `auto_reply_instagram`/`auto_reply_facebook`) to `social_credentials`. Until
  it's run, every channel behaves exactly as before this session's fix
  (defaults to auto-reply ON everywhere, matching the pre-migration-row
  fallback the app code already handles gracefully) — flipping a toggle in
  Profile → Reply Automation will silently no-op server-side (the sync call
  succeeds since PostgREST just ignores unknown JSON keys on an upsert
  without erroring, but the column won't exist to actually gate anything) until
  this migration runs. No new env vars needed — reuses the existing
  `GROQ_API_KEY`/`JINA_API_KEY`/`GEMINI_API_KEY`/Supabase service role key
  already required for RAG + Groq. See the "Inbox auto-reply pipeline" work
  log entry above for the full design (RAG grounding + the toggle itself +
  the Instagram comment-handling fix, all shipped together).

- **🔴 CRITICAL, NOT YET LIVE — AI Chief of Staff RLS lockdown needs manual
  SQL execution NOW** (added 2026-07-19): run
  `supabase-chiefs-security-lockdown.sql` in Supabase SQL Editor immediately.
  Until this runs, the OLD, unrestricted `anon USING(true)` policies remain
  live on `chiefs_inventory`/`chiefs_clients`/`chiefs_matches`/
  `chiefs_pipeline` — meaning anyone who knows or guesses an `agent_id`
  (now somewhat more discoverable via the public AI Concierge link,
  `#concierge=<agentId>`) can still read/write an agent's entire workspace
  via a direct Supabase REST call using the public anon key. The client-side
  fixes (Sign-In-Required gate, the new server-side `concierge-save`
  endpoint, the `claim_chiefs_workspace` migration flow) are all
  deploy-ready, but do NOT close the hole by themselves — the old permissive
  RLS would still accept a direct anon-key request from anyone else
  regardless of what the client UI does. See the "Security & real per-agent
  ownership" section above (under "AI Chief of Staff — Complete Feature
  List") and the 2026-07-19 work-log entry for full details.

- **🟡 Track Record — removed from nav 2026-07-18, needs a real automated
  transaction feed before it comes back** (see the same-dated work-log
  entry above for the full product discussion). To rebuild it properly:
  (1) a reliable, ongoing source of REAL, RANDOMLY-sampled (not hand-
  picked) CLOSED sale transactions with building/area/beds/size/price/date
  — the project doesn't have a solid one today; RapidAPI Bayut/PropertyFinder
  transaction-shaped endpoints have had repeated field-shape/parser issues
  across this project's history (see the 2026-07-15 "Bayut import" and
  earlier PropertyFinder-parser entries), and the official DLD Dubai Pulse
  open-data API was considered but never integrated; (2) a weekly (or
  similar) cron, modeled on the existing `forecast-accuracy` job in
  `api/refresh-market-data.js`, that scores `computeValuation()` against
  each newly-closed transaction using ONLY the benchmark data that existed
  before that sale (to avoid hindsight bias) and appends the result to a
  new, append-only Supabase table — never overwritten, growing indefinitely;
  (3) once real accumulated volume exists, surface a summarized stat
  ("checked against N real sales, median error X%") inside
  `renderAnalyzerResult()` (`js/market.js`) — NOT as its own tab — reusing
  the exact scoring approach already written in `renderTrackRecord()`
  (same file, currently dormant/unreferenced, kept specifically for this
  reuse). Do not re-add the Market → TrackRecord tab or resurface the
  current static/hand-picked case-study list anywhere in the meantime —
  that was the user's explicit instruction.

- **🔴 Directive #4 category 2 (Meta OAuth automation) — BLOCKED, not a
  code problem: the business has no real UAE trade license yet, so Meta
  Business Verification cannot be completed** (found 2026-07-18, session
  continuing from 14). User attempted Meta Business Verification tonight
  (business.facebook.com Business Info → legal name "DubAIVal" already set,
  address + phone completed, but the verification wizard's "Select your
  business type" step requires uploading a real registration document —
  Trade License, Certificate of Incorporation, etc. — and the user confirmed
  no such document exists yet: "هنوز ثبت نکردم" (haven't registered yet).
  **This is a hard, external, non-technical blocker** — no amount of code
  or Meta Dashboard configuration can substitute for a real registered
  business entity. Without Business Verification, Meta only allows
  sensitive permissions (`whatsapp_business_management`,
  `whatsapp_business_messaging`, `ads_management`) in **Development Mode**
  — usable only by the app's own admins/testers, never by arbitrary real
  end users — so the WhatsApp Embedded Signup / Facebook Login for Business
  Pixel-auto-discovery flows described in directive #4's main text cannot
  go live for real agents until this is resolved.
  - **User's decision tonight**: pause this work entirely rather than
    register a business under time pressure. Explicitly chose to set this
    aside and work on other parts of the site instead — this is NOT
    something for a future session to silently retry; wait for the user to
    confirm a real UAE trade license exists (commonly obtained via a Dubai
    free zone — IFZA, Meydan Free Zone, SHAMS, RAKEZ, and similar all offer
    relatively fast e-commerce/media/tech licenses, mentioned to the user
    as one option, not a specific recommendation) before resuming Meta
    Business Verification or any OAuth "Connect X" build-out.
  - **What's already done and does NOT need to be repeated**: Business
    Portfolio "Dubai AI Valuation" exists (created Jun 25, 2026, per its own
    Business History), Legal business name/Address/Business phone/Website
    are all filled in correctly on business.facebook.com Business Info,
    Two-Factor Authentication backup admin is already added. The ONLY
    missing piece is the actual verification document upload, which needs a
    real registered entity first.
  - **Everything else built tonight (category 1 — shared platform keys,
    Profile Panel consolidation) is unaffected and already live** — this
    blocker is scoped ONLY to category 2 (per-agent WhatsApp Business/Meta
    Pixel/other-platform OAuth automation).

- **🟡 Directive #4 — category 1 (shared platform keys) SHIPPED same night;
  category 2 (per-agent OAuth) still needs tomorrow's Meta App Review.** See
  the "directive #4 category 1 shipped" work-log entry above for full
  details — Gemini/Unsplash/Pexels/ElevenLabs are now 100% server-proxied
  with zero user-facing key fields anywhere (removed, not just optional),
  and every remaining real user-facing field (WhatsApp Business/Meta Pixel/
  LinkedIn/Twitter/TikTok/YouTube) was consolidated into ONE place —
  `renderProfilePanel()` (`js/app.js`) — with `showSocialSetup()` now a
  thin redirect to it. What's LEFT for tomorrow is exactly category 2
  below: those consolidated WhatsApp Business/Meta Pixel fields are still
  manual-paste (just relocated, not yet OAuth-automated) — that migration
  needs the operator's Meta App Review to complete first.
  (found + scope finalized 2026-07-17, session 14, while walking the user
  through Profile Panel settings — explicitly deferred to the next session:
  "بیخیالش، فردا شروعش کن" then, once the Gemini gap above was reported,
  the user gave the FULL standing instruction for tomorrow verbatim: "تمام
  کلیدها رو بیاریم سمت ادمین، هیچ چیزی نباید برای کاربرها در دسترس باشه...
  هیچکدوم از تنظیمات نباید سمت کاربر باشه جز شماره تلفن، ایمیل، سوشال
  اکانتها، و مشخصات کاربر که خودش باید وارد کنه" — bring ALL keys to the
  admin side, nothing should be user-facing except phone number, email,
  social accounts, and the user's own profile details. This supersedes and
  broadens the narrower "just add a Gemini fallback, keep the field
  optional" framing from the initial finding below — the user does NOT want
  an optional bring-your-own-key override left in user hands either; every
  key becomes platform-only.
  - **The concrete finding that triggered this** (`renderProfilePanel()` in
    `js/app.js`, "AI API Keys" section, 4 fields — Groq/Gemini/Unsplash/
    Pexels): Groq is technically already safe to remove from the user's
    view since `askAI()` (`js/api.js`) already falls back to the shared
    platform key via `/api/proxy-groq` when `localStorage.dv_groq` is empty
    — the field is currently just a redundant optional override, not a
    requirement. **Gemini/Unsplash/Pexels have NO such fallback at all** —
    confirmed via grep, ~20+ call sites across `js/chat.js` (AI image
    generation, AI-written captions/subtitles, translation, hashtag
    intelligence, HSO generator, bulk 30-day post generator, story
    templates, emoji suggestions, A/B caption testing, etc.) call Gemini's
    REST API directly from the client using `localStorage.getItem
    ("dv_gemini_key")` and either silently `return null` or show an alert
    like "Gemini key needed" when empty — meaning most Social Media
    Manager AI tools are currently unusable for any agent who hasn't gone
    and pasted in their own key.
  - **Full scope, per the user's explicit instruction — two genuinely
    different categories, need different fixes**:
    1. ✅ **DONE same night — shared/platform-level keys that have NOTHING
       to do with any specific user's own account** — Groq, Gemini,
       Unsplash, Pexels, ElevenLabs. See the work-log entry above for the
       full implementation (`api/proxy-groq.js` extended with a
       `?provider=` switch, all ~20 `js/chat.js` call sites migrated, both
       user-facing fields removed entirely). Nothing left to do here.
    2. **Per-agent business assets — the fix is OAuth/Embedded Signup, NOT
       "the agent gets their own token."** WhatsApp Business Token/Phone
       ID/WABA ID, Meta Ads Pixel ID/CAPI Token, and every other platform's
       raw API key (Instagram/Facebook/LinkedIn/Twitter/TikTok/YouTube) in
       `showSocialSetup()` are currently manual-paste fields — that's the
       bug to fix, and "admin can't hold a shared token here since every
       agent has their own different number/account" does NOT mean the
       agent has to go generate/find/copy that token themselves either.
       **Explicit correction, per the user's direct pushback this same
       session** (they were clear: the agent's ENTIRE job is limited to
       typing their own phone number, WhatsApp number, email, and a social
       handle/username — never a token, never a Phone Number ID, never a
       WABA ID, full stop): the real fix is the SAME "Connect X" pattern
       Instagram/Facebook already use successfully in `renderProfilePanel()`
       (`js/app.js` — click Connect, approve on Meta's own screen, Account
       ID/Access Token/Page ID come back "AUTO-FILLED AFTER CONNECT," the
       agent never sees or types either one). WhatsApp needs its exact
       equivalent: **WhatsApp Embedded Signup** — the agent clicks "Connect
       WhatsApp," Meta's own embedded flow handles phone verification
       INTERNALLY (Meta sends and checks that OTP itself, as part of their
       hosted flow — not something DubaiVal asks the agent to do
       separately), and our server receives the Phone Number ID + Access
       Token automatically via a server-side authorization-code exchange.
       Meta Ads Pixel ID should likewise auto-discover via the Marketing
       API once ads_management scope is granted through the same Facebook
       Login flow — never typed in. Still blocked on the operator
       completing Meta App Review for these specific products (Facebook
       Login for Business + WhatsApp Embedded Signup), unchanged from
       before — but once that's done, category 2 becomes exactly as
       zero-touch as category 1, just via OAuth instead of a shared key.
       Don't scope tomorrow's work as "the agent still needs a token, we
       just can't share it" — that framing is wrong and was corrected here.
    3. Also re-check the **Phone/WhatsApp fields in the "Account" section**
       of the same Profile Panel (`js/app.js`, plain `dv_phone`/
       `dv_whatsapp_number` text inputs) — these ARE on the user's allowed
       list (phone number) per the user's own instruction, but should be
       reconciled with the new OTP-verified `phone`/`phone_verified` fields
       on `user_profiles` added this same session (`js/auth.js` Sign Up) —
       right now there may be 2 separate, unreconciled phone fields (one
       unverified in Profile Panel, one OTP-verified at Sign Up) worth
       unifying into one single verified value rather than leaving both.

- **🟡 Zero-touch onboarding OTP system — needs manual SQL + platform
  WhatsApp number + approved Meta template** (added 2026-07-17, session 14):
  run `supabase-otp-verification-schema.sql` in Supabase SQL Editor. Email
  OTP (Sign Up phone-verification's fallback path, and any future email-OTP
  use) works immediately once this runs — no other setup needed, reuses the
  existing `RESEND_API_KEY`. WhatsApp OTP additionally needs: (1) the
  operator connects DubaiVal's OWN platform WhatsApp Business number
  (distinct from any individual agent's own connection in Social Setup) and
  sets `DV_PLATFORM_WHATSAPP_PHONE_ID`/`DV_PLATFORM_WHATSAPP_TOKEN` in Vercel
  env vars; (2) the operator creates and gets Meta's approval for EITHER (or
  both — the code prefers the tap template when set) of: an "Authentication"
  category template for the typed-code fallback (`DV_OTP_WHATSAPP_TEMPLATE_
  NAME`/`DV_OTP_WHATSAPP_TEMPLATE_LANG`, defaults `otp_verification`/`en_US`),
  or — **recommended, since it's the genuine zero-typing "tap ✅ This is me"
  experience the user specifically asked for** — a Utility-category template
  with one quick-reply button (`DV_OTP_WHATSAPP_TAP_TEMPLATE_NAME`, no
  default, must be set explicitly to activate tap mode). Until (1)+(2), Sign
  Up's phone step shows an honest "WhatsApp verification isn't switched on
  yet" message and account creation proceeds without blocking on it — this is
  a deliberate, disclosed, temporary exception to directive #4's "OTP is the
  only mechanism" rule, not a silent gap. The email magic-link path (click
  the link in the OTP email, zero typing) already works today the moment the
  base SQL migration runs — no extra setup beyond that. **This is the reusable primitive
  for the rest of directive #4** — any future session building the WhatsApp
  Embedded Signup / Facebook Login / other OAuth "Connect X" flows described
  in that directive should reuse `send-otp`/`verify-otp` (`api/inbox.js`)
  rather than inventing a second OTP mechanism.

- **🟡 AI Chief of Staff → Meta Ads conversion feedback loop — needs manual
  SQL + per-agent Meta setup** (added 2026-07-17, session 14): run
  `supabase-meta-conversion-schema.sql` in Supabase SQL Editor. Then, for
  any agent/company who wants ad-conversion reporting to actually work:
  connect their Meta Ads Pixel ID + generate a Conversions API access token
  (Meta Events Manager → Settings → Conversions API → Generate Access
  Token) and paste both into Social Setup. Until both are done, the
  Dashboard's "Report ad conversions to Meta" toggle is visible and on by
  default but silently no-ops — real Client Memory Bank saves are
  completely unaffected either way. **Use this**: the whole point of this
  feature per the user's explicit direction was so agents/companies
  connecting AI Chief of Staff (personal phone or company CRM) get better-
  targeted ad campaigns over time — flag this to any user asking about ad
  performance/ROI, and remind them Social Setup is where the Pixel/token
  connection happens. See the "Meta Ads conversion feedback loop" work-log
  entry above for the full design (built after 4 competitor products the
  user shared, most directly inspired by YCloud's WhatsApp→Meta CAPI
  pattern).

- **🔴 CRITICAL, NOT YET LIVE — Admin password rotation needs manual SQL
  execution NOW** (added 2026-07-17, session 14): run
  `supabase-admin-password-reset.sql` in Supabase SQL Editor immediately.
  The password previously given to the user ("DubaiVal2025!") was wrong (a
  stale/incorrect code comment, never actually verified against the real
  hash) — the admin login has likely never worked with that password. The
  new password, once this migration runs, is **`DubaiVal-Admin-2026!`**. See
  the 2026-07-17 "Admin login was broken" work-log entry above for the full
  root-cause trail (also includes an independent, already-fixed bug where
  background data-refresh timers could wipe an in-progress password field).

- **🟡 Portfolio value history + weekly digest — needs manual SQL** (added
  2026-07-17, session 14): run `supabase-portfolio-history-schema.sql` and
  `supabase-portfolio-digest-schema.sql` in Supabase SQL Editor (both
  require `supabase-user-profiles-schema.sql` already applied, which it is
  — cloud sync already depends on it). Until then: the Health tab's
  "Portfolio Value History" chart never appears (fails gracefully — no
  error), and the weekly digest cron (`?action=portfolio-digest`, Sundays
  08:15 UTC) finds no snapshot rows to compare and skips every user. Both
  `RESEND_API_KEY` and `CRON_SECRET` are already required (Price Alerts
  already uses both) — no new env vars needed. See the "Portfolio Manager
  audit follow-through" work-log entry above for the full design.

- **🟡 AI Knowledge Base Research Injection — needs manual SQL** (added
  2026-07-17, session 14): run `supabase-knowledge-research-notes-schema.sql`
  in Supabase SQL Editor (requires `supabase-forecast-accuracy-schema.sql`
  and `supabase-admin-security-fix.sql` already applied, which they are).
  Until then, the Admin Dashboard's "AI Knowledge Base — Research Injection"
  card's "Inject" button will fail with a clear Postgres constraint error
  (HTTP 500) rather than silently doing nothing. Once run, click "↓ Load
  This Session's Off-Plan Research (5 facts)" in the Admin Dashboard, review
  the queued notes, and click "Inject" to get this session's actual
  off-plan domain research (EOI/pre-launch process, payment plans, escrow/
  DLD, Oqood, off-plan transaction share) into the AI's grounded knowledge
  base. See the 2026-07-17 "research findings now get injected into the AI's
  RAG knowledge base" work-log entry above for the full design — this is a
  standing, reusable mechanism for any future research pass, not a one-off.

- **🟡 Off-Plan Projects — needs manual SQL + real data sourcing** (added
  2026-07-17, session 14; schema revised same session before the SQL was
  ever run — see the "schema revised to match how Dubai launches actually
  work" work-log entry above): run `supabase-offplan-schema.sql` in Supabase
  SQL Editor (requires `supabase-admin-security-fix.sql` already applied,
  which it is — reuses `_admin_password_ok()`). Until it's run, the tab
  shows a graceful "Off-Plan data isn't available yet" message instead of an
  error. Once it's run, the tab is fully functional but the database starts
  completely EMPTY (deliberately — no fabricated project/developer data was
  seeded, per this project's own accuracy directive). Pricing is now modeled
  per unit type (`offplan_unit_types`, one row per Studio/1BR/Townhouse/
  Villa/etc. within a project) rather than one flat PSF per project, and
  projects carry a real lifecycle stage (`project_stage`) and
  `payment_plan` field. Next step, to be worked out with the user: how to
  actually source real off-plan project data (Property Finder/Bayut API —
  likely extendable from the existing `api/proxy-rapidapi.js` integration —
  plus Tamani Properties and developer websites, none of which this session
  had live network access to investigate) and real developer track-record
  figures (avg growth launch→handover / handover→+5yr per developer,
  entered via the "Developer Track Record" editor in the Admin Dashboard).
  See the 2026-07-17 "Off-Plan Projects tab" and its schema-revision
  follow-up work-log entries above for the full design and scoping
  conversation.

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
  using the Vercel CLI. The deploy folder is a git repo.

  **🔴 STANDING RULE (user's explicit instruction, 2026-07-21) — always give
  the deploy command as ONE SINGLE LINE, chained with `&&`, that runs with
  one Enter press — never a multi-line block the user has to run line by
  line.** `&&` chaining works in both `cmd.exe` and modern PowerShell (7+),
  matching the user's Windows environment. The one-line command to give at
  the end of every session:

  ```
  git fetch origin && git reset --hard origin/claude/dubaival-code-quality-k29ojs && vercel --prod --archive=tgz
  ```

  **`--archive=tgz` is REQUIRED, not optional, since 2026-07-12** (the
  programmatic SEO pages added ~9,576 files): Vercel's per-deploy upload on
  the Hobby plan rejects deploys above ~5,000 individual file requests
  (`Error: Too many requests - try again in 24 hours (more than 5000, code:
  "api-upload-free")`). `--archive=tgz` bundles the whole deploy into one
  tarball upload instead of one request per file, avoiding that cap
  entirely. Always include this flag in the deploy command from now on —
  do not give the user the plain `vercel --prod` form.

  If a previous merge left conflicts (`unmerged files` error), the user
  needs to run `git merge --abort` first, separately, before the one-line
  command above — flag this only if it's actually relevant that session,
  don't prepend it by default.

  **NEVER tell the user to `git merge origin/...` without `git reset --hard` first.**
  `git reset --hard` is the correct and safe method — it avoids merge conflicts entirely.

  **Always give the user the one-line command above at the end of each task**
  (targeting `claude/dubaival-code-quality-k29ojs`, not the old
  `dubaival-portfolio-manager-5bgbjk` — that branch is now research-only and
  is never deployed directly) — nothing else, no git checkout main, no git
  push origin main, and no splitting it back into separate lines.
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
| Market Index | ✅ Complete — **the tab's own "click any area for valuation" promise silently failed on a stale analyzerState.stage, plus a mislabeled Sustainability metric, both fixed 2026-07-18** | Low |
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
| AI Assistant (SocialChat) | ✅ Complete → **removed 2026-07-18** (confirmed 100% duplicate of Network → AI Agents, see the "Removed sub-tabs" note near the top of this file) | Low |
| Workspace | ✅ Complete | Low |
| Reports | ✅ Complete — **4 real bugs found and fixed 2026-07-18** (duplicate-section generation, area not auto-syncing with a loaded valuation, mortgage LTV ignoring buyer nationality, a crash in the adjacent Workspace Dashboard's Deal Network widget); remaining documented gap is LOW-severity: voice input on Firefox/mobile | Medium |
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
- **Reports**: Voice input در Firefox و برخی mobile browsers کار نمی‌کند بدون fallback

---

### نکات کلی معماری

1. ~~RAG grounding در ۵ جای app غیرفعال است~~ — **قدیمی شد (تأیید شده 2026-07-11)**: RAG کاملاً فعال و live است (هم Supabase SQL هم Gemini/Jina key تنظیم شده) — به بخش "✅ COMPLETED: RAG Knowledge Base" در Outstanding items مراجعه کن.
2. **localStorage** برای Portfolio و Reports بدون cloud sync — ریسک data loss (هنوز واقعی به نظر می‌رسه — warning banner + Export دستی وجود داره ولی cloud sync خودکار نه)
3. ~~Admin password در `deals.js` client-side چک می‌شود~~ — **قدیمی شد (تأیید شده 2026-07-12)**: کد فعلی هیچ‌جا رمز رو client-side مقایسه نمی‌کنه؛ همه‌جا (`js/app.js`, `js/deals.js`, `js/core.js`) از طریق `p_admin_password` به یک RPC سمت سرور فرستاده می‌شه (فیکس سشن ۱۱-۷-۲۰۲۶، `supabase-admin-security-fix.sql`).
