# DubAIVal UI Redesign — Session Prompt

Copy this entire prompt into a NEW Claude Code session for the redesign.

---

## Task

Redesign the DubAIVal web app UI from a cluttered 13-tab horizontal scroll bar
into a clean, modern 5-section navigation inspired by fintech apps (Revolut,
Wise, Bloomberg Terminal). The app is a Dubai real estate AI valuation platform.

**Read `CLAUDE.md` first** — it has the full project context, file map, and
critical directives. Pay special attention to the section
"🎨 UI/UX Redesign Plan" which contains the approved navigation architecture,
design tokens, and file safety rules.

## Critical Rules

1. **DO NOT modify any file listed in "Files that the redesign session MUST NOT
   modify"** in CLAUDE.md. These contain business logic and databases.
2. **DO NOT delete any existing functionality.** Every feature that exists today
   must exist after redesign — just reorganized and restyled.
3. **DO NOT change any function signatures, variable names, or state management.**
   Only change how things look and where they appear in the navigation.
4. **Analyzer page accuracy is sacrosanct.** MAX 3% deviation. Do not touch
   valuation calculations.
5. **Bump cache versions** in `index.html` for every JS file you change.
6. **Test after each major change** to ensure nothing breaks.

## What to do

### Phase 1: Navigation restructure (js/app.js)

Replace the current 13-tab horizontal scroll bar with a 5-section layout:

```
Current 13 tabs:
Market | Index | Analyzer | Map | Find | Deals | Social | Compare | Portfolio | Alerts | Chat | Workspace | About

New 5 sections:
🏠 Home | 📊 Market | 💼 Portfolio | 🤝 Network | ⚙️ More
```

**Desktop**: Left sidebar (240px collapsed to 64px icon-only), main content right.
**Mobile**: Bottom tab bar (5 icons), sub-tabs as horizontal scrollable pills.

Each section has sub-tabs (see CLAUDE.md "Proposed navigation architecture"):

- **Home**: New dashboard landing page (market pulse, portfolio summary, quick actions)
- **Market**: Live Dashboard (current Market tab default), Analyzer, Quick Check,
  Track Record, Market Index, Compare, Live Search, Map, Personal Advisor
  (Mortgage Calculator becomes a collapsible panel inside Analyzer)
- **Portfolio**: My Assets, Health Dashboard, Projections, Alerts, STR Calculator
- **Network**: Deal Board, Agent Hub, AI Agents (8 agents from current Chat tab),
  Social Media Manager (from current Chat tab — post/story/reel generator,
  AI Video Studio with 8 engines, AI Video Editor, Content Calendar, Auto-Post,
  Engagement Analytics, Branding Setup), PropTech Video Platform (from current
  Social tab — js/social.js — Explore feed, Agent Profiles, My Profile, Following)
- **More**: Workspace, Report Builder, About, Settings, Admin (hidden unless admin)

### Phase 2: Visual polish (js/core.js + all UI files)

Apply consistent design system:

- **Cards**: background #0D1220, border 1px solid #1C2540, border-radius 12px,
  padding 20px, subtle hover glow
- **Buttons**: Primary = gold gradient (linear-gradient(135deg, #D4AF37, #B8941F)),
  Secondary = #1A1F2E border, Danger = #EF4444
- **Typography**: Space Grotesk for headings (16-24px, weight 700),
  Inter for body (12-14px, weight 400-500)
- **Spacing**: Consistent 16px/24px gaps between sections, 8px between elements
- **Section headers**: Uppercase, letter-spacing 0.1em, color #D4AF37, with
  subtle left border accent
- **Tables**: Alternating row backgrounds (#0D1220 / #111827), sticky headers
- **Inputs**: background #0D1117, border 1px solid #1C2540, border-radius 8px,
  focus border #D4AF37
- **Transitions**: all 0.2s ease for hover/focus states

### Phase 3: Home dashboard (new, in js/app.js)

Create a new landing page that shows:

1. **Market Pulse Card**: Current avg PSF across Dubai, 24h change arrow, top 3
   movers (highest growth areas), market sentiment indicator
2. **Your Portfolio Card** (if user has assets): Total value, ROI%, monthly
   rental income, health score donut chart
3. **Active Alerts**: Count badge + latest 3 matching properties
4. **Quick Action Buttons**: "Analyze Property", "Search Market", "Compare Areas",
   "Post Deal" — each navigates to the right sub-section
5. **Recent Activity**: Last 5 valuations/searches from localStorage

### What NOT to build

- No new features. Only reorganize and restyle existing ones.
- No new API integrations.
- No changes to databases or valuation logic.
- No new npm packages or build tools (this is a vanilla JS app, no bundler).

## Design references

Style: Dark luxury fintech — think Bloomberg Terminal meets Revolut dark mode.
Clean, spacious, professional. Gold accent (#D4AF37) on dark navy (#070B14).
Minimal borders, generous whitespace, clear visual hierarchy.

## File structure reminder

All JS files are in `js/` folder. HTML shell is `index.html`.
There is NO build step — vanilla JS, no React/Vue/bundler.
Functions are global (window scope). State is in global variables + localStorage.
`el()`, `div()`, `span()` are DOM helper functions in `js/core.js`.

## Verification checklist

After redesign, verify:
- [ ] All 5 sections navigate correctly
- [ ] Analyzer works (sale + rent modes) — numbers match pre-redesign
- [ ] Portfolio loads saved assets from localStorage
- [ ] Deal Board loads from Supabase
- [ ] AI Chat agents respond correctly
- [ ] Social Media Manager + Video Studio works
- [ ] Map renders with Leaflet markers
- [ ] Market Index tables display correctly
- [ ] Compare tool works with 2-3 areas
- [ ] Live Search returns Bayut listings
- [ ] Mortgage calculator computes correctly
- [ ] Workspace and Report Builder function
- [ ] Mobile responsive (bottom tab bar, stacked cards)
- [ ] Language switcher (EN/AR/FA) still works
- [ ] Dark theme consistent across all sections
