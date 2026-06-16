# DubaiVal — Project Context for Claude Sessions

Read this first. It exists so a fresh session doesn't have to re-read the whole
71KB single-file app or re-derive line numbers/history from scratch.

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
- Working branch for Claude sessions: `claude/dubaival-api-integration-xuhskb`
  (NOT `main` — pushes here do not auto-deploy to Production; Vercel's
  Production Deployment is tied to the `main` branch / manual `vercel --prod`
  from the user's machine). If a change needs to go live, the user must merge
  to `main` or run `vercel --prod` locally after pulling this branch.
- `vercel.json`: single static build, `index-6.html` served for all routes.
  There is no build step (`package.json` build script is a no-op echo).
- **The entire app is one file: `index-6.html`** (~3000 lines, ~727KB). Other
  files in the repo (`dubaival.jsx`, `index-3.html`) are old/unused — do not
  edit them, they are not deployed. `src/` and `public/` are empty/unused.

## `index-6.html` map (line numbers as of commit `1b8c59c`)

Section markers are literal `// --- NAME ---` comments in the file — grep for
`^// ---` to re-orient if lines shift after edits. When in doubt, re-grep for
`^function ` / `^const AREAS=` / `^var DB=` rather than trusting this table
blindly — it drifts every time AREAS/DB/render functions grow.

| Lines | Section |
|---|---|
| 83–142 | Cluster database |
| 144–154 | Market data / view premiums |
| 157–171 | `var DB={...}` — **building database, single massive line (line 166)**, 5612 entries. Schema: `{"p":psf,"lo":lowPsf,"hi":highPsf,"sc":serviceCharge,"a":"Area Name","g":"Grade","df":1(optional, means "data flag"/lower confidence)}`. Keyed by lowercase building name. |
| 172–336 | `const AREA_GRADE_PSF` (173, now only used as historical/curated reference data — see note below) + `const AREAS={...}` (174–473) — **area benchmark database, 152 keys**. Schema: `{psf, sc, r1/r2/r3 (apartment rents studio/1BR-ish/2BR-ish/3BR-ish — actually studio/1BR/2BR/3BR tiers), and/or rv2..rv7 (villa rent tiers by bedroom count), y:[yieldLow,yieldHigh], g:[growth0-1yr%,growth1-3yr%,growth2-5yr%]}`. Originally 81 canonical keys; 71 more were researched and added 2026-06-16 to eliminate fallback-to-generic-defaults for buildings whose DLD area tag didn't match a canonical key. |
| 337–474 | Alias map |
| 476–520 | `function lookupBuilding(name, areaHint)` — building DB lookup |
| 521–~644 | `function computeValuation(f, buildingVal, liveData)` — **the valuation engine**, see below |
| ~645–693 | API helpers: `getUAELocationId`, `fetchLiveData` (uae-real-estate2 RapidAPI), `askAI` (Groq) |
| ~789–990 | App state, `fetchLiveMarket`, `fetchSupabaseConfig`/`saveSupabaseConfig` (macro yield/growth adjustment knobs stored in Supabase, editable via admin UI), `fetchMarketIntelligence` |
| ~991–1837 | Render layer: deal alerts, PDF report generation (print-based, no library) |
| 1838–2161 | `renderMarket()` — Market tab. Now ends with a **Track Record / case-study card** (see "Recent work" below) before `return wrap;`. |
| 2162–2896 | `renderAnalyzer()` / `renderAnalyzerResult()` — the main valuation form + result UI (confidence bar, total return badge, investment signal badge live here) |
| 2815–2975 | Mortgage standalone + calculator (`renderMortgageStandalone`, `renderMortgage`) |
| 2976–3041 | Compare tab, Personal tab |
| 3042–end | Chat tab, `sendChat` (Groq-backed AI chat) |

Note: `AREA_GRADE_PSF` (line 173, ~350 hand-researched grade-tier psf entries)
is currently **unused dead data** — its only call site (a "guess B+ grade for
any unmatched building name" heuristic inside `computeValuation`'s area-fallback
branch) was removed 2026-06-16 because it had no real signal backing it and
caused systematic overestimation in budget areas (see "Recent work"). Left in
place rather than deleted in case a smarter grade-detection heuristic wants to
reuse this data later — don't be surprised it's unreferenced.

## The valuation engine (`computeValuation`, line 521)

```
bData = lookupBuilding(buildingVal||f.building||"", f.area)
aData = AREAS[f.area] || {psf:1800, sc:15, y:[5,7], g:[10,18,28]}   // generic fallback, should now rarely trigger
askPSF = price/size (rounded); returns null if !askPSF || !f.area
baseConf = [0,95,85,72,58][dataLayer] || 58                        // dataLayer = how specific the building match was
inputPenalty = (-4 if no floor & not villa) + (-2 if view unspecified) + (-1 if no service charge)
relSpread = (psfHi - psfLo) / adjPSF                                 // CoreLogic FSD-style: real building lo/hi range
spreadAdj = relSpread<=0.15 ? +5 : <=0.25 ? 0 : <=0.40 ? -5 : -10
confScore = clamp(baseConf + inputPenalty + spreadAdj, 40, 97)
confTier  = Very High(>=90) / High(>=80) / Medium(>=68) / Low(>=55) / Indicative(else)

gr = aData.g || [10,18,28]
prRatio = 100 / grossYield                                           // price-to-rent ratio
investSignal = prRatio<15 Undervalued(green) / <20 Fair Value(green) / <25 Elevated(yellow) / else Bubble Risk(red)
                                                                       // thresholds modeled on NY Fed / UBS Bubble Index price-to-rent norms
totalReturnAnnual = netYield + gr[1]/3                                // gross approximation of net yield + annualized mid-term capital growth
                                                                       // UI colors it green if >=8% (vs 8-10% institutional benchmark), yellow >=5%, red below
```

These three derived metrics (confScore w/ FSD spread logic, investSignal,
totalReturnAnnual) were added in commit `eb4606e` ("Add research-backed
investment signal, total return metric, and FSD-style confidence scoring")
after methodology research covering AVM/Hedonic/XGBoost approaches, bubble
detection/CMA, investment return forecasting, Bayut/Property Finder platform
conventions, and Mueller's real-estate market cycle model. **This is live and
wired into the UI** — confidence bar/label (~line 2560), total return badge
w/ color threshold (~line 2656), investment signal badge (~line 2666).

## Recent work log (most recent first)

- **2026-06-16 (`1b8c59c`)**: Implemented 2 of the user's 5 strategic
  proposals (see "Strategic proposals" below), in user-approved order
  (Outlier fix → Case Study):
  1. **Outlier fix** (`d96a36a`, separate commit): live-comps (`dataLayer=2`)
     basePSF now uses a trimmed mean (only comps within the 20th–80th
     percentile band) instead of a raw mean, so a single distress/bulk-sale
     comp can't skew the estimate.
  2. **Found + fixed a real bug while building the Case Study** (same commit
     `1b8c59c`): the area-fallback (`dataLayer=4`, no DB building match)
     branch of `computeValuation` defaulted to guessing "B+" grade pricing
     for *any* typed building name not found in `DB`, with zero actual signal
     behind that guess. Discovered via real-transaction testing: this caused
     a ~56% overestimate for Town Square (a budget/family community) and
     likely skewed every unmatched-building estimate upward across cheaper
     areas. Fixed by dropping the guess — area-fallback now just uses the
     area's own blended psf average (`aData.psf`). `AREA_GRADE_PSF` (line
     173) is now unused/dead but left in place, see line-map note above.
  3. **Case Study / "Track Record" feature**: added a card at the end of
     `renderMarket()` (Market tab) that runs `computeValuation()` *live*
     against 18 real DLD-registered 2025–2026 transactions (sourced via a
     research pass across Bayut/Property Finder/eSpace/Gulf News/Sherwoods/
     Metropolitan/YallaValue/FazWaz/CBNME) and shows estimate-vs-actual with
     a clickable source link per row, plus median error / within-±10% /
     within-±20% summary stats. **Deliberately excludes 9 one-off
     record-breaking transactions** (e.g. the AED 550M Bugatti Residences
     penthouse, AED 422M Aman Residences penthouse, AED 161M 25 Degrees Villa)
     that were also researched — bespoke unicorn sales aren't a fair test of
     a model that prices off building/area averages, and including them
     would have made the accuracy stat meaningless in either direction.
     Honest result on the 18 kept transactions: median error ~20%, ~22%
     within ±10%, ~50% within ±20% — moderate, not spectacular, and reported
     to the user as such before shipping (no cherry-picking). Framed in the
     UI as "check the Confidence Score to gauge the expected range for your
     search" rather than overclaiming a single blended accuracy number.
- **2026-06-16 (`4a50ade`)**: Researched and added all 71 remaining "orphan"
  DLD area-tag strings (area strings present in `DB` that didn't match any
  `AREAS` key, silently falling back to generic defaults). Classified each as:
  - `NEW_AREA` (60) — genuinely distinct submarket, own psf/rent/yield/growth
    entry researched from Bayut/Property Finder/FazWaz/Driven Properties/DLD
    sources.
  - `ALIAS_OF` (9) — DLD cadastral/renamed name mapping to an existing
    canonical area (e.g. `Al Hebiah Third`→DAMAC Hills, `Al Kheeran`→Dubai
    Creek Harbour, `Warsan Fourth`→International City, `Al Yufrah 1`→The
    Valley — per DLD's 2024 area-renaming initiative and registered-community
    cross-references).
  - `BUILDING_NOT_AREA` (3) — `Beachgate By Address`, `Palace Beach
    Residence`, `Marina Vista` were mistagged; all are towers within Emaar
    Beachfront, not areas.
  Result: **0 orphan area strings remain**; 81→152 AREAS keys. Verified via
  structural cross-check (every DB `"a"` tag now resolves), `new Function()`
  syntax check, and end-to-end `computeValuation()` tests on real buildings
  in newly-added areas.
- **(`f799328`, `b8b0ba2`)**: earlier passes normalizing DB area-name strings
  and fixing specific mistagged buildings (Fountain Views/Elie Saab naming,
  Mira) — same root-cause class of bug as above, fixed incrementally.
- **(`eb4606e`)**: investSignal / totalReturnAnnual / confScore-FSD feature
  (see above).
- **(`751000f`, `dc9995b`, `f09fbfc`)**: earlier database coverage passes —
  added 78 buildings for 6 thin-coverage areas, added 17 missing top-volume
  areas, general June-2026 data refresh.
- **(`a669670`, `0fe78ec`)**: migrated live-data API stack to uae-real-estate2
  (RapidAPI) + Groq for AI chat/insights, after the previous PropertyFinder
  API integration broke; added a "Find" tab.
- **(`830f8dd`, `5008576`, `92b7063`)**: AVM accuracy fixes — `df` (data-flag)
  field, geo-adjustments, alias map, stale ultra-luxury PSF corrections.
- **(`8e9ed63`, `a9f0673`, `53e4fa4`, `909f220`, `db28ceb`)**: villa-side form
  overhaul (views, premiums, rentals, bathrooms, maid room, view dropdown
  fix), 50-community villa database upgrade.

## User's 5 strategic proposals (raised 2026-06-16) — status

The user proposed 5 product-trust/growth ideas in one message and asked for
an assessment before prioritizing. Status of each, for future sessions:

1. **Outlier/Data Integrity** (a 30%-below-market distress sale corrupting
   the model) — ✅ **Done**, trimmed-mean fix, `d96a36a`.
2. **Missing Data / "silent buildings"** (what happens when there's
   insufficient data for a building) — **Already existed** before this was
   raised: the confidence score (`confScore`/`confTier`, `computeValuation`
   line ~626) already handles this by lowering confidence (down to
   `baseConf=58` for area-only estimates) rather than silently asserting a
   high-confidence number. No work needed; user was told this directly.
3. **Qualitative variables** (view/floor/furnished) — **Already existed**:
   `vP`/`fP`/`furnP`/`loftP`/`penthP`/`maidP` hedonic premiums already model
   all of these (see "valuation engine" above). No work needed; user was
   told this directly.
4. **Trust/Verification — "Case Study"** (show real transactions vs. model
   estimate) — ✅ **Done**, Track Record card in Market tab, `1b8c59c`. See
   "Recent work log" above for the honest accuracy numbers and methodology.
5. **Retention — "Price Alert"** (notify users of price moves to bring them
   back) — **Not started.** User explicitly deprioritized this behind the
   Case Study via an approved priority order (Outlier → Case Study → implicitly
   Price Alert later). Needs, before any code: (a) the user to pick/set up an
   email-sending service (Resend/SendGrid/etc.), (b) a Supabase schema
   extension to store per-user watched buildings/areas + last-seen price,
   (c) a cron job (Vercel Cron or external) to check for moves and send
   alerts. Do not start this without the user asking.

## Domain/deploy troubleshooting (resolved 2026-06-16)

Domain didn't resolve for 6 days despite correct `ns1/ns2.vercel-dns.com`
nameserver delegation (confirmed via RDAP/WHOIS, not just Namecheap's panel).
Root cause: the domain had never been **added inside the Vercel project's
Settings → Domains** — account-level `vercel.com/account/domains` ("No
domains") is a *different* page from project-level domains and only lists
domains bought through Vercel itself. Fix: add domain inside
`vercel.com/<team>/<project>/settings/domains`, both `dubaival.com` (with
308 redirect to www) and `www.dubaival.com`. Both now show "Valid
Configuration". Lesson for future domain issues on this project: always check
project-level Domains settings first, not account-level.

## Testing technique for this file (no build/test infra exists)

To test `computeValuation`/`AREAS`/`DB` logic in isolation without a browser,
use a Node `eval` harness:

- Stub `window`/`document`/`localStorage`/`navigator`/`fetch`/
  `requestAnimationFrame` as no-op globals. Also stub `setTimeout`/
  `setInterval`/`clearTimeout`/`clearInterval` as no-ops — the script
  schedules a periodic `fetchLiveMarket` poll, and if you `require()` the
  harness as a module (rather than running it standalone) that timer firing
  later will crash the host process with a real (uncaught, async) exception.
- Slice the `<script>` body out of the HTML by line range — find the current
  `</script>` line dynamically (`lines.findIndex((l,i)=>i>100&&l.includes('</script>'))`),
  don't hardcode it, since it shifts whenever AREAS/DB grow.
- Strip the trailing top-level `render();` call by **popping blank/`render();`-only
  lines off the end of a line array in a loop**
  (`while(codeLines.length && /^\s*(render\(\);)?\s*$/.test(codeLines[codeLines.length-1])) codeLines.pop();`).
  Do **not** use a regex `.replace(/render\(\);\s*$/m,'')` on the whole string —
  without `/g` it replaces only the *first* match, and with multiline `$`
  matching every line-end, that first match is usually some unrelated
  mid-file `render();` call inside an event handler, not the trailing one.
- Append your exposure lines (`global.__AREAS=AREAS; global.__DB=DB; global.__computeValuation=computeValuation;` etc.)
  **into the same string you pass to a single `eval(...)` call**, after the
  sliced script body — e.g. `code += '\nglobal.__AREAS=AREAS; ...'; eval(code);`.
  Do **not** call `eval(code)` and then separately call `eval('AREAS')` afterward
  expecting it to see the same bindings — `const`/`let` declared by a direct
  `eval()` call live only in that eval call's own lexical environment, so a
  second, separate `eval()` call in the same function will not see them
  (this produced confusing "AREAS is undefined" failures with no thrown error
  when it was gotten wrong).
- `computeValuation` requires both `f.price` and `f.size`/`f.buaSize` set or
  it returns `null` (needs `askPSF`). `f.price` only matters for the guard and
  for `vsPct`/`verdict`/yield fields — `fairPrice` itself (the model's own
  estimate) doesn't depend on `f.price`, so when testing the model's estimate
  against a real sold price, pass any non-zero dummy price (or the sold price
  itself) just to pass the guard.
- A worked, known-good version of this harness was last built at
  `/tmp/case_study_research/run_valuations.js` (ephemeral — not committed to
  the repo, ask before recreating if needed for a future accuracy check).

## Outstanding / open items

- Outlier fix + Case Study (items 1 & 4 of the "5 strategic proposals" above)
  are both shipped as of 2026-06-16 (`d96a36a`, `1b8c59c`). Next likely ask:
  item 5, **Price Alert / retention** — see status notes above; don't start
  without the user explicitly asking, since it needs a product decision
  (which email service) before any code.
- The honest Track Record accuracy numbers (median ~20% error on the 18
  kept transactions) suggest there's real room to improve AVM accuracy
  beyond the B+ grade-guess fix already made — e.g. the DB's "p" (psf) field
  may reflect asking/listing prices rather than actual closed DLD sale
  prices for some buildings (a plausible explanation for misses like Burj
  Khalifa +62%, Marina Gate 1 -38.5%). This wasn't investigated further in
  this session — flagged here as a real, evidence-backed lead if the user
  wants to keep improving accuracy rather than move on to other features.
- The user has given a broad, non-specific directive to "fix everything and
  upgrade to world-class standard" (SEO, marketing, design, etc.) but has not
  specified concrete deliverables for that beyond the engineering work
  already done. Treat any future "upgrade everything" style request as
  needing scoping/clarification rather than a literal mandate to touch
  SEO/marketing/social copy unprompted — confirm concrete scope before
  doing broad unscoped work.
- `main` branch vs the Claude working branch are not auto-synced/auto-deployed
  to each other — if a session's changes need to reach production, say so
  explicitly to the user, since merging/deploying is the user's call.
