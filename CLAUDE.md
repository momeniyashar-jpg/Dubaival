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

## `index-6.html` map (line numbers as of commit `4a50ade`)

Section markers are literal `// --- NAME ---` comments in the file — grep for
`^// ---` to re-orient if lines shift after edits.

| Lines | Section |
|---|---|
| 83–142 | Cluster database |
| 144–154 | Market data / view premiums |
| 157–171 | `var DB={...}` — **building database, single massive line (line 166)**, 5612 entries. Schema: `{"p":psf,"lo":lowPsf,"hi":highPsf,"sc":serviceCharge,"a":"Area Name","g":"Grade","df":1(optional, means "data flag"/lower confidence)}`. Keyed by lowercase building name. |
| 172–336 | `const AREA_GRADE_PSF` + `const AREAS={...}` (174–473) — **area benchmark database, 152 keys**. Schema: `{psf, sc, r1/r2/r3 (apartment rents studio/1BR-ish/2BR-ish/3BR-ish — actually studio/1BR/2BR/3BR tiers), and/or rv2..rv7 (villa rent tiers by bedroom count), y:[yieldLow,yieldHigh], g:[growth0-1yr%,growth1-3yr%,growth2-5yr%]}`. Originally 81 canonical keys; 71 more were researched and added 2026-06-16 (see "Recent work" below) to eliminate fallback-to-generic-defaults for buildings whose DLD area tag didn't match a canonical key. |
| 337–474 | Alias map |
| 476–520 | `function lookupBuilding(name, areaHint)` — building DB lookup |
| 521–645 | `function computeValuation(f, buildingVal, liveData)` — **the valuation engine**, see below |
| 646–693 | API helpers: `getUAELocationId`, `fetchLiveData` (uae-real-estate2 RapidAPI), `askAI` (Groq) |
| 789–990 | App state, `fetchLiveMarket`, `fetchSupabaseConfig`/`saveSupabaseConfig` (macro yield/growth adjustment knobs stored in Supabase, editable via admin UI), `fetchMarketIntelligence` |
| 991–1830 | Render layer: deal alerts, PDF report generation (print-based, no library) |
| 1831–2729 | Market tab |
| 2730–2890 | Mortgage standalone + calculator |
| 2891–2956 | Compare tab, Personal tab |
| 2957–end | Chat tab, `sendChat` (Groq-backed AI chat) |

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
use a Node `eval` harness: stub `window`/`document`/`localStorage`/
`navigator`/`fetch`/`requestAnimationFrame` as no-op globals, slice the
`<script>` body out of the HTML by line range (find current `</script>` line
first, it shifts whenever AREAS/DB grow), strip the trailing `render()` call,
append `global.AREAS=AREAS; global.DB=DB; global.computeValuation=...` etc.,
then `eval()` the sliced code in a `vm`/plain Node script. A harmless crash
from `fetchLiveMarket`/`window.location.protocol` always fires at the very
end after your exposed globals are already set — ignore it (filter with
`grep -v` if noisy). `computeValuation` requires both `f.price` and
`f.size`/`f.buaSize` set or it returns `null` (needs `askPSF`).

## Outstanding / open items

- No concrete pending engineering tasks as of 2026-06-16 — the 71-area fix
  was the last open item and is shipped.
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
