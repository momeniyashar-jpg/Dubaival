# DubAIVal Complete UI Redesign — Session Prompt

Copy this entire prompt into a NEW Claude Code session for the redesign.

---

## FIRST: Switch to the correct branch

**BEFORE doing anything else**, run this command:
```
git checkout claude/dubaival-portfolio-manager-5bgbjk
```
All project files (data-commercial.js, valuation-db.js, social.js, etc.) are
ONLY on this branch. The `main` branch is outdated. Do NOT work on `main`.
Do NOT create a new branch. Work directly on `claude/dubaival-portfolio-manager-5bgbjk`.

---

## Your Role

You are a **world-class senior UI/UX designer**, **expert frontend developer**,
**marketing specialist**, and **product strategist**. Your mission: transform a
cluttered, disorganized web app into a modern, beautiful, user-friendly platform
that rivals the best fintech apps in the world (Revolut, Wise, Bloomberg Terminal,
Robinhood). Every feature must be instantly discoverable — nothing hidden.

## Task

Redesign the DubAIVal web app UI from a cluttered 13-tab horizontal scroll bar
into a clean, modern 5-section navigation. The app is a Dubai real estate AI
valuation platform with 10,880+ properties.

**Read `CLAUDE.md` first** — it has the full project context, file map, and
critical directives.

## Critical Rules (MUST follow)

1. **DO NOT modify any file listed in "Files that the redesign session MUST NOT
   modify"** in CLAUDE.md. These contain business logic, databases, and APIs.
2. **DO NOT delete ANY existing functionality.** Every single feature that exists
   today MUST exist after redesign — just reorganized and restyled. If you cannot
   find where a feature went, you broke the redesign.
3. **DO NOT change any function signatures, variable names, or state management.**
   Only change how things look and where they appear in navigation.
4. **Analyzer page accuracy is sacrosanct.** MAX 3% deviation. Do not touch
   valuation calculations.
5. **Bump cache versions** in `index.html` for every JS file you change.
6. **ALL tools must be directly accessible.** No feature should require "secret
   knowledge" or multi-step discovery to find. A user should be able to see and
   access every tool within 1-2 clicks.
7. **Download any needed images/icons** from reputable CDNs (unpkg, cdnjs,
   Google Fonts icons). Use inline SVGs or emoji where possible for icons.
8. **Test after each major change** to ensure nothing breaks.

## The Core Problem (READ CAREFULLY)

### Problem 1: 13 tabs in horizontal scroll — overwhelming
```
Current: Market | Index | Analyzer | Map | Find | Deals | Social | Compare | Portfolio | Alerts | Chat | Workspace | About
```
Users must scroll horizontally to find tabs. No visual hierarchy. Related
features are scattered (Compare is between Social and Portfolio; Chat with
35+ tools is tab 11 of 13).

### Problem 2: 35+ Social Media Manager tools are HIDDEN

This is the BIGGEST usability problem. The AI Video Studio, Video Editor,
Post Designer, Content Calendar, and 30+ other tools are **invisible to users**
unless they follow this exact 4-step process:

1. Find and click the "Chat" tab (11th of 13, requires horizontal scrolling)
2. Switch from default "DubAIVal Intelligence" agent to "Social Media Manager"
3. Type and send a message asking for a post
4. Wait for AI to generate a valid JSON response

**Only THEN** do tool buttons appear below that specific message. If the AI
response doesn't contain valid JSON, the tools never show. Users have NO idea
these 35+ tools exist.

**This must be fixed.** All tools must be immediately visible when the Social
Media Manager section is opened — no message-sending required.

---

## What to Build — 3 Phases

### Phase 1: Navigation Restructure (`js/app.js`)

Replace the 13-tab horizontal scroll bar with a 5-section layout:

```
New 5 sections:
🏠 Home | 📊 Market | 💼 Portfolio | 🤝 Network | ⚙️ More
```

#### Desktop Layout
- **Left sidebar** (240px wide, collapsible to 64px icon-only)
- 5 primary sections as sidebar items with icons
- Active section highlighted with gold left border + gold text
- Collapse/expand toggle button at bottom of sidebar
- Main content area fills remaining width
- Sub-tabs as horizontal pill buttons inside content area

#### Mobile Layout (< 768px)
- **Bottom tab bar** fixed at bottom (56px height, safe-area-inset)
- 5 icons with labels underneath
- Active tab: gold icon + gold label
- Inactive: muted gray icon + label
- Sub-tabs as horizontal scrollable pills at top of content
- No sidebar on mobile

#### Sub-Tab Architecture

**🏠 HOME** (default landing page — new, build from scratch):
```
No sub-tabs. Single dashboard view:
├── Market Pulse Card (avg PSF, 24h change, top 3 movers, sentiment)
├── Your Portfolio Card (total value, ROI%, rental income, health donut)
├── Active Alerts (count badge + latest 3 matches)
├── Quick Action Buttons (Analyze, Search, Compare, Post Deal)
└── Recent Activity (last 5 valuations/searches from localStorage)
```

**📊 MARKET** (all market intelligence tools):
```
Sub-tabs (horizontal pills):
├── Dashboard     → renderMarket()         [js/market.js]
├── Analyzer      → renderAnalyzer()       [js/market.js] (includes Mortgage as collapsible panel)
├── Quick Check   → Quick Check section    [js/market.js]
├── Track Record  → Track Record section   [js/market.js]
├── Market Index  → renderMarketIndex()    [js/marketindex.js]
├── Compare       → renderCompare()        [js/portfolio.js] ⚠️ lives in portfolio.js!
├── Find          → renderFind()           [js/app.js] ⚠️ lives in app.js!
├── Map           → renderMap()            [js/map.js]
└── Advisor       → renderPersonal()       [js/portfolio.js] ⚠️ lives in portfolio.js!
```

**💼 PORTFOLIO** (investment management):
```
Sub-tabs:
├── My Assets     → renderPortfolio()      [js/portfolio.js] (asset list + add)
├── Health        → Portfolio Health view   [js/portfolio.js]
├── Projections   → Future Projections     [js/portfolio.js] (sliders + what-if)
└── Alerts        → renderAlerts()         [js/app.js] ⚠️ lives in app.js!
```

**🤝 NETWORK** (professional/social tools):
```
Sub-tabs:
├── Deals         → renderDeals()          [js/deals.js] (browse + post + agents)
├── Agent Hub     → renderAgentHub()       [js/deals.js]
├── AI Agents     → renderChat()           [js/chat.js] (8 AI agents)
├── Media Studio  → Social Media Manager   [js/chat.js] ⚠️ 35+ tools, see below!
└── Video Platform→ renderSocial()         [js/social.js] (explore, profiles, following)
```

**⚙️ MORE** (settings & info):
```
Sub-tabs or vertical list:
├── Workspace     → renderWorkspace()      [js/workspace.js]
├── Report Builder→ renderReportBuilder()  [js/workspace.js]
├── About         → renderAbout()          [js/about.js]
├── Settings      → (language, dark mode, profile — extract from current header)
└── Admin         → renderAdmin()          [js/app.js] (hidden unless admin)
```

### Phase 1B: Fix Social Media Manager Tool Visibility

**This is the MOST CRITICAL UI fix.** When user navigates to Network → Media Studio,
they must immediately see ALL 35+ tools organized in a beautiful grid — WITHOUT
needing to send any message first.

#### Current broken flow (in `renderChat()`, `js/chat.js`):
```
renderChat() line 6296-6300:
  if (chatState.agentId === "outreach" && extractPostJSON(m.text))
    → buildPublishBar(postData, msgText, cl)
```
Tools only appear when AI response contains valid JSON. This means tools are
**completely invisible** until after a successful AI interaction.

#### Required new flow:
When "Media Studio" sub-tab is active, render a **Tool Dashboard** above the
chat area. Structure:

```
┌──────────────────────────────────────────────────┐
│  📣 Media Studio                                  │
│  Your complete social media command center         │
├──────────────────────────────────────────────────┤
│                                                    │
│  🎬 CREATE                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │AI Video│ │Edit    │ │Design  │ │Story   │     │
│  │Studio  │ │Video   │ │Post    │ │Templates│    │
│  └────────┘ └────────┘ └────────┘ └────────┘     │
│  ┌────────┐                                       │
│  │Preview │                                       │
│  └────────┘                                       │
│                                                    │
│  🧠 AI INTELLIGENCE                               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │Neuro   │ │Translate│ │A/B Test│ │Hashtags│    │
│  │Hook    │ │         │ │        │ │        │     │
│  └────────┘ └────────┘ └────────┘ └────────┘     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │Rewrite │ │Emojis  │ │Optimize│ │Spy     │     │
│  └────────┘ └────────┘ └────────┘ └────────┘     │
│                                                    │
│  📅 PLANNING                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │Calendar│ │Schedule│ │Bulk 30 │ │Recycle │     │
│  └────────┘ └────────┘ └────────┘ └────────┘     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │Pillars │ │Best    │ │Analyti-│ │Link    │     │
│  │        │ │Time    │ │cs      │ │Bio     │     │
│  └────────┘ └────────┘ └────────┘ └────────┘     │
│  ┌────────┐                                       │
│  │Watermark│                                      │
│  └────────┘                                       │
│                                                    │
│  ⚙️ SETUP                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │Branding│ │Social  │ │Auto-Post│ │Engage- │    │
│  │        │ │Setup   │ │Log     │ │ment    │     │
│  └────────┘ └────────┘ └────────┘ └────────┘     │
│                                                    │
│  🎭 AVATAR STUDIO                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │Gallery │ │Create  │ │Generate│ │Video   │     │
│  └────────┘ └────────┘ └────────┘ └────────┘     │
│  ┌────────┐ ┌────────┐                            │
│  │AutoPilot│ │Batch  │                            │
│  └────────┘ └────────┘                            │
│                                                    │
│  💬 AI Chat (collapsible, below tools)            │
│  [Social Media Manager agent chat interface]       │
└──────────────────────────────────────────────────┘
```

**Implementation approach**: Create a new function `renderMediaStudio()` in
`js/chat.js` that renders this tool grid. Each tool button calls its existing
`show*()` function directly (they all work standalone — they create modal
overlays and don't need chat context). The chat interface with the "outreach"
agent stays at the bottom as a collapsible section for AI-generated content.

**Tool button → function mapping** (all in `js/chat.js`):

| Button | Function | Line |
|---|---|---|
| **CREATE row** | | |
| AI Video Studio | `showVideoGenUI()` | 2196 |
| Edit Video | `showVideoEditor()` | 851 |
| Design Post | `showPostDesigner()` | 3966 |
| Story Templates | `showStoryTemplates()` | 3417 |
| Post Preview | `showPostPreview()` | 3451 |
| **AI INTELLIGENCE row** | | |
| Neuro Hook | `showHookStoryOffer()` | 4501 |
| Translate | `showMultiLanguage()` | 4407 |
| A/B Test | `showABTest()` | 4134 |
| Hashtags | `showHashtagIntelligence()` | 4180 |
| Caption Rewrite | `showCaptionRewriter()` | 3119 |
| Emoji Intelligence | `showEmojiIntelligence()` | 3566 |
| Caption Optimizer | `showCaptionOptimizer()` | 3516 |
| Competitor Spy | `showCompetitorSpy()` | 3161 |
| **PLANNING row** | | |
| Content Calendar | `showContentCalendar()` | 4281 |
| Schedule Post | `showAddCalendarEvent()` | 4587 |
| Bulk 30-Day | `showBulkGenerator()` | 3223 |
| Content Recycler | `showContentRecycler()` | 3265 |
| Content Pillars | `showPillarPlanner()` | 3682 |
| Best Time | `showBestTimeModal()` | 3026 |
| Post Analytics | `showPostAnalytics()` | 3062 |
| Link in Bio | `showLinkInBio()` | 3312 |
| Watermark | `showWatermarkSetup()` | 3631 |
| **SETUP row** | | |
| Branding | `showBrandingSetup()` | 229 |
| Social Setup | `showSocialSetup()` | 6157 |
| Auto-Post Log | `showAutoPostLog()` | 6030 |
| Engagement | `showEngagementDashboard()` | 6091 |
| **AVATAR row** | | |
| Avatar Gallery | `showAvatarStudio()` | 5073 |
| Create Avatar | `showAvatarBuilder()` | 5166 |
| Generate Content | `showAvatarContentGen()` | 5317 |
| Avatar Video | `showAvatarVideoGen()` | 5545 |
| AutoPilot | `showAvatarAutoPilot()` | 5852 |
| Batch Generate | `showAvatarBatchGen()` | 5956 |

**NOTE**: Most `show*()` functions accept an optional `caption` parameter.
When called from the tool grid (without prior chat), pass empty string `""`.
They all create overlay modals that work independently.

### Phase 2: Visual Design System

Apply a consistent, modern design language across ALL pages:

#### Color Palette
```
Background:     #070B14 (deep navy — body/app background)
Surface:        #0D1220 (card backgrounds, sidebar)
Raised:         #131926 (hover states, elevated elements)
Border:         #1C2540 (subtle borders)
Border Active:  #2A3660 (focus/hover borders)
Gold Primary:   #D4AF37 (brand accent, CTAs, active states)
Gold Dim:       #8A6420 (secondary gold, muted accents)
Text Primary:   #E8EDF5 (headings, important text)
Text Secondary: #8899AA (body text, descriptions)
Text Muted:     #556677 (placeholder, timestamps)
Success:        #10B981 (positive changes, confirmed)
Warning:        #F59E0B (caution, pending)
Error:          #EF4444 (negative, danger)
Purple:         #8B5CF6 (rental mode accent)
```

#### Typography
```
Headings: 'Space Grotesk', monospace — weight 700, sizes 16/18/20/24px
Body:     'Inter', sans-serif — weight 400-500, sizes 12/13/14px
Labels:   'Space Grotesk', monospace — weight 500, 9-10px, uppercase, letter-spacing 0.12em
Mono:     'Space Grotesk', monospace — for numbers, codes, badges
```

#### Component Styles
```css
/* Cards */
.card {
  background: #0D1220;
  border: 1px solid #1C2540;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}
.card:hover {
  border-color: #2A3660;
  box-shadow: 0 4px 24px rgba(212, 175, 55, 0.06);
}

/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #D4AF37, #B8941F);
  color: #070B14;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  border: 1px solid #1C2540;
  color: #E8EDF5;
  border-radius: 8px;
  padding: 10px 20px;
}

/* Inputs */
input, select {
  background: #0D1117;
  border: 1px solid #1C2540;
  border-radius: 8px;
  color: #E8EDF5;
  padding: 10px 14px;
  font-size: 13px;
  transition: border-color 0.2s ease;
}
input:focus, select:focus {
  border-color: #D4AF37;
  outline: none;
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.15);
}

/* Section Headers */
.section-header {
  color: #D4AF37;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-family: 'Space Grotesk', monospace;
  font-weight: 600;
  border-left: 3px solid #D4AF37;
  padding-left: 10px;
  margin-bottom: 16px;
}

/* Tables */
table { width: 100%; border-collapse: collapse; }
thead { position: sticky; top: 0; background: #0D1220; }
th { color: #D4AF37; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; padding: 10px 12px; text-align: left; }
tr:nth-child(odd) { background: #0D1220; }
tr:nth-child(even) { background: #111827; }
td { padding: 10px 12px; font-size: 13px; color: #E8EDF5; }

/* Sub-tab pills */
.pill-tab {
  background: transparent;
  border: 1px solid #1C2540;
  border-radius: 20px;
  padding: 6px 16px;
  color: #8899AA;
  font-size: 12px;
  cursor: pointer;
}
.pill-tab.active {
  background: linear-gradient(135deg, #D4AF37, #B8941F);
  color: #070B14;
  border-color: transparent;
  font-weight: 700;
}

/* Tool grid buttons (for Media Studio) */
.tool-btn {
  background: #131926;
  border: 1px solid #1C2540;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}
.tool-btn:hover {
  border-color: #D4AF37;
  background: #1A1F2E;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(212, 175, 55, 0.1);
}
.tool-btn .icon { font-size: 24px; margin-bottom: 6px; }
.tool-btn .label { font-size: 11px; color: #E8EDF5; }
```

#### Spacing Scale
```
4px  — micro gaps (icon-text)
8px  — element gaps (between badges, chips)
12px — tight sections
16px — standard section padding
20px — card padding
24px — between cards/sections
32px — major section separators
48px — page-level margins
```

#### Sidebar Specific
```css
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: #0D1220;
  border-right: 1px solid #1C2540;
  padding: 16px 0;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  transition: width 0.2s ease;
}
.sidebar.collapsed { width: 64px; }
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #8899AA;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.15s ease;
}
.sidebar-item.active {
  color: #D4AF37;
  background: rgba(212, 175, 55, 0.06);
  border-left-color: #D4AF37;
}
.sidebar-item:hover {
  color: #E8EDF5;
  background: rgba(255, 255, 255, 0.03);
}
```

#### Mobile Bottom Tab Bar
```css
.bottom-tabs {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #0D1220;
  border-top: 1px solid #1C2540;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}
.bottom-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #556677;
  font-size: 10px;
}
.bottom-tab.active { color: #D4AF37; }
.bottom-tab .icon { font-size: 22px; }
```

### Phase 3: Home Dashboard (new page in `js/app.js`)

Build a new `renderHome()` function that creates a personalized landing page:

```
┌─────────────────────────────────────────────────────┐
│  Good morning! Here's your Dubai market snapshot     │
├────────────────────────┬────────────────────────────┤
│  MARKET PULSE          │  YOUR PORTFOLIO             │
│  ┌──────────────────┐  │  ┌────────────────────────┐│
│  │ Avg PSF: 1,847   │  │  │ Total: AED 12.4M       ││
│  │ ▲ 2.3% (24h)     │  │  │ ROI: +18.2%            ││
│  │                   │  │  │ Rental: 42K/mo         ││
│  │ Top Movers:       │  │  │ Health: 78/100 [donut] ││
│  │ 1. JVC  +5.2%    │  │  │                        ││
│  │ 2. MBR  +4.1%    │  │  │ [View Portfolio →]     ││
│  │ 3. DHE  +3.8%    │  │  └────────────────────────┘│
│  └──────────────────┘  │                              │
├────────────────────────┴────────────────────────────┤
│  QUICK ACTIONS                                       │
│  [🔍 Analyze] [🔎 Search] [⚖️ Compare] [🤝 Post Deal]│
├─────────────────────────────────────────────────────┤
│  ACTIVE ALERTS (3)     │  RECENT ACTIVITY            │
│  • 2BR JVC < 1800 PSF  │  • Analyzed Marina Vista    │
│  • 3BR DHE > 7% yield  │  • Searched JVC apartments  │
│  • Studio Bus Bay       │  • Compared 3 areas         │
└─────────────────────────────────────────────────────┘
```

Data sources (all already exist — no new APIs):
- Market stats: Calculate from `AREAS` object (347 areas with psf, yield, growth)
- Portfolio: Read from `localStorage("dubaival_portfolio")`
- Alerts: Read from `localStorage("dv_alerts")` + scan `DB` for matches
- Recent activity: Read from `localStorage("dubaival_recent")` (already tracked)
- Top movers: Sort `AREAS` by `g[0]` (growth 0-1yr)

---

## CRITICAL: Features in Unexpected Files

Functions do NOT always live where their names suggest. DO NOT break these:

| Function | Lives in | Will appear in section |
|---|---|---|
| `renderCompare()` | `js/portfolio.js` | Market → Compare |
| `renderFind()` | `js/app.js` | Market → Find |
| `renderAlerts()` | `js/app.js` | Portfolio → Alerts |
| `renderPersonal()` (Advisor) | `js/portfolio.js` | Market → Advisor |
| `renderApiDocs()` | `js/about.js` | More → About |
| `generatePDF()` | `js/market.js` | Market → Analyzer result |
| Social Media Manager (35+ tools) | `js/chat.js` | Network → Media Studio |
| PropTech Video Platform | `js/social.js` | Network → Video Platform |

**Do NOT move functions between files.** Only change how the routing in
`render()` calls them.

## Cross-Cutting Components (DO NOT lose ANY of these)

These shared components appear across multiple sections. They must all survive:

| Component | Function(s) | File | Used in |
|---|---|---|---|
| Auth Modal | `renderAuthModal()`, `renderAuthButton()` | `js/auth.js` | Header, everywhere |
| Notification Bell | `renderNotifBell()` | `js/core.js` + `js/app.js` | Header |
| Tour System | `showTourStep()`, `startTour()` | `js/core.js` | First visit |
| Smart Bar / AI Fill | `renderSmartBar()`, `showSuggestions()` | `js/core.js` | Analyzer, Find |
| Voice Input | `createVoiceMic()` | `js/core.js` | Smart Bar |
| Share Buttons | (inline) | `js/core.js` | Analyzer result, deals |
| PDF Generator | `generatePDF()` | `js/market.js` | Analyzer result |
| Sustainability Score | `computeSustainabilityScore()` | `js/core.js` | Analyzer result |
| Pill/Badge | `pill()` | `js/core.js` | Everywhere |
| Language Switcher | `t()` function | `js/app.js` | Header |
| Dark Mode Toggle | `useThemeToggle()` | `js/core.js` | Header → More/Settings |

## Complete Render Function Map

Every top-level render function and where it routes in the new architecture:

| Function | File | New Location |
|---|---|---|
| `render()` | `js/app.js` | Main entry — rebuild with sidebar/bottom-tab |
| `renderHome()` | `js/app.js` | **NEW** — Home dashboard |
| `renderMarket()` | `js/market.js` | Market → Dashboard |
| `renderAnalyzer()` | `js/market.js` | Market → Analyzer |
| `renderAnalyzerResult()` | `js/market.js` | Market → Analyzer (result) |
| `renderRentalResult()` | `js/market.js` | Market → Analyzer (rent result) |
| `renderCommercialResult()` | `js/market.js` | Market → Analyzer (commercial) |
| `renderLandResult()` | `js/market.js` | Market → Analyzer (land) |
| `renderMarketIndex()` | `js/marketindex.js` | Market → Index |
| `renderMap()` | `js/map.js` | Market → Map |
| `renderMortgage()` | `js/mortgage.js` | Market → Analyzer (collapsible panel) |
| `renderPortfolio()` | `js/portfolio.js` | Portfolio → My Assets |
| `renderCompare()` | `js/portfolio.js` | Market → Compare |
| `renderPersonal()` | `js/portfolio.js` | Market → Advisor |
| `renderFind()` | `js/app.js` | Market → Find |
| `renderAlerts()` | `js/app.js` | Portfolio → Alerts |
| `renderAdmin()` | `js/app.js` | More → Admin |
| `renderDeals()` | `js/deals.js` | Network → Deals |
| `renderDealForm()` | `js/deals.js` | Network → Deals (post mode) |
| `renderAgentHub()` | `js/deals.js` | Network → Agent Hub |
| `renderAdminDashboard()` | `js/deals.js` | Network → Deals (admin) |
| `renderChat()` | `js/chat.js` | Network → AI Agents |
| `renderMediaStudio()` | `js/chat.js` | **NEW** — Network → Media Studio |
| `renderSocial()` | `js/social.js` | Network → Video Platform |
| `renderAbout()` | `js/about.js` | More → About |
| `renderWorkspace()` | `js/workspace.js` | More → Workspace |
| `renderReportBuilder()` | `js/workspace.js` | More → Report Builder |

## PropTech Video Platform Internals (`js/social.js`)

Sub-renderers inside `renderSocial()` — these have their own internal tab system:
- `_renderExplore()` — Video explore feed with filters
- `_renderAgents()` — Agent profiles directory with search
- `_renderMyProfile()` — User's own profile + video uploads
- `_renderFollowing()` — Following feed (areas + agents)
- `_renderVideoCard()` / `_renderVideoModal()` — Video display components
- `_renderAgentCard()` / `_renderAgentProfile()` — Agent display components

## Current State Management (DO NOT change)

| State Variable | File | Purpose |
|---|---|---|
| `currentTab` | `js/core.js:227` | Active tab ID — change values to match new routing |
| `analyzerState` | `js/core.js` | Analyzer form + results |
| `chatState` | `js/core.js:617` | Chat messages, active agent |
| `window.FIND_STATE` | `js/app.js` | Property search state |
| `window.ALERT_FORM` | `js/app.js` | Alert form state |
| `window.PORTFOLIO_STATE` | `js/portfolio.js` | Portfolio assets |
| `DEAL_STATE` | `js/deals.js` | Deal board state |
| `SOCIAL_STATE` | `js/social.js` | Video platform state |
| `WS_STATE` | `js/workspace.js` | Workspace state |
| `DV_NOTIF` | `js/core.js` | Notifications |
| `DV_TOUR` | `js/core.js` | Tour state |
| `darkMode` | `js/data-residential.js:3` | Theme toggle |
| `T` (theme object) | `js/data-residential.js:4-8` | Color tokens |
| `C()` function | `js/data-residential.js` | Get current theme colors |

## DOM Helper Functions (use these — do NOT create new ones)

```js
el(tag, attrs, children)  // Create element — attrs: {style:{}, className, onClick, ...}
div(style, children)      // Shorthand for el("div", {style}, children)
span(style, text)         // Shorthand for span element
btn(style, text, onClick) // Create button
inp(style, placeholder, type, value, onChange)  // Create input
mkSelect(style, options, value, onChange)        // Create select
mkAuto(style, items, value, onChange, placeholder) // Create autocomplete
lbl(text)                 // Create uppercase label
pill(text, color)         // Create colored badge
fld(labelText, input)     // Wrap label + input
hexAlpha(color, alpha)    // Convert hex to rgba
S()                       // Standard input style object
I()                       // Input style with gold caret
C()                       // Get current theme colors {bg, surface, border, gold, white, sub, ...}
t(key)                    // Get translated text (EN/AR/FA)
```

## Files You CAN Modify (UI only)

- `js/app.js` — Tab routing, navigation, header, `render()`, `renderHome()` (new)
- `js/core.js` — Shared UI utilities, theme colors, DOM helpers
- `js/market.js` — Market tab UI layout (NOT valuation logic)
- `js/marketindex.js` — Market Index tab UI
- `js/portfolio.js` — Portfolio tab UI (NOT `computeAssetMetrics`/`computePortfolioHealth`)
- `js/deals.js` — Deals tab UI (NOT Supabase queries)
- `js/chat.js` — Chat/Social Media Manager UI + new `renderMediaStudio()` (NOT API proxy)
- `js/map.js` — Map tab UI
- `js/mortgage.js` — Mortgage tab UI
- `js/workspace.js` — Workspace tab UI
- `js/about.js` — About tab UI
- `js/auth.js` — Auth UI (NOT auth logic)
- `js/social.js` — PropTech Video Platform UI (NOT Supabase queries)
- `index.html` — Shell, meta tags, script loading, font imports

## Files You MUST NOT Modify

- `js/data-residential.js` — 8,522 building database
- `js/data-commercial.js` — 1,930 commercial + 428 land database
- `js/valuation.js` — Valuation engine
- `js/valuation-db.js` — Valuation DB helpers
- `api/proxy-groq.js` — Groq AI proxy
- `api/proxy-video.js` — Video engine proxy (8 engines)
- `api/proxy-rapidapi.js` — RapidAPI proxy
- `api/auto-post.js` — Auto-post cron
- `api/sync-engagement.js` — Engagement sync cron
- `supabase-*.sql` — Database schemas

## File Structure

```
Dubaival/
├── index.html              ← HTML shell (script tags, meta, fonts)
├── logo.png                ← App logo
├── js/
│   ├── data-residential.js ← 8,522 buildings DB + theme (DO NOT TOUCH)
│   ├── data-commercial.js  ← Commercial + land DB (DO NOT TOUCH)
│   ├── valuation.js        ← Valuation engine (DO NOT TOUCH)
│   ├── valuation-db.js     ← DB helpers (DO NOT TOUCH)
│   ├── api.js              ← API helpers (DO NOT TOUCH)
│   ├── core.js             ← el()/div()/span(), UI utilities, Smart Bar, Tour
│   ├── auth.js             ← Auth modal + button
│   ├── app.js              ← render(), tabs, header, Find, Alerts, Admin
│   ├── market.js           ← Market dashboard, Analyzer, results, PDF, Quick Check
│   ├── marketindex.js      ← Market Index tables
│   ├── mortgage.js         ← Mortgage calculator
│   ├── portfolio.js        ← Portfolio, Compare, Personal Advisor
│   ├── map.js              ← Interactive Leaflet map
│   ├── deals.js            ← Deal board, Agent Hub, admin
│   ├── chat.js             ← 8 AI agents + 35+ Social Media Manager tools
│   ├── social.js           ← PropTech Video Platform
│   ├── about.js            ← About/Mission page
│   └── workspace.js        ← Workspace + Report Builder
├── api/                    ← Vercel serverless (DO NOT TOUCH)
└── vercel.json             ← Deployment config
```

## What NOT to Build

- No new features — only reorganize and restyle existing ones
- No new API integrations
- No changes to databases or valuation logic
- No new npm packages or build tools (vanilla JS app, no bundler)
- No React/Vue/Angular — keep it vanilla JS with existing `el()`/`div()` helpers

## Font Loading

Add Inter font to `index.html` if not already present:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"/>
```

## Execution Order

1. **Start with `js/app.js`** — rebuild `render()` with new navigation (sidebar + bottom tabs + sub-tab routing). This is the foundation everything else depends on.
2. **Add `renderHome()`** to `js/app.js` — new dashboard landing page.
3. **Add `renderMediaStudio()`** to `js/chat.js` — tool grid for Social Media Manager. This fixes the hidden tools problem.
4. **Update `index.html`** — add Inter font, bump all cache versions.
5. **Polish each section** — apply consistent card/button/table styles across all render functions.
6. **Test everything** — verify each item in the checklist below.

## Verification Checklist (33 items — VERIFY ALL)

After redesign, verify EVERY item works:

**Navigation:**
- [ ] All 5 sections navigate correctly (Home, Market, Portfolio, Network, More)
- [ ] Sub-tab navigation works within each section
- [ ] Desktop sidebar collapses/expands
- [ ] Mobile bottom tab bar shows on small screens
- [ ] Mobile sub-tabs scroll horizontally

**Market Section:**
- [ ] Live Dashboard renders with count-up animation
- [ ] Analyzer works (sale + rent modes) — numbers match pre-redesign
- [ ] Quick Check works (sale + rent)
- [ ] Track Record table displays correctly
- [ ] Market Index tables display correctly (all 8+ tables)
- [ ] Compare tool works with 2-3 areas
- [ ] Find / Smart Property Discovery returns results
- [ ] Live Search returns Bayut listings
- [ ] Map renders with Leaflet markers and all 6 metrics
- [ ] Mortgage calculator computes correctly (collapsible in Analyzer)
- [ ] Personal Advisor questionnaire works

**Portfolio Section:**
- [ ] Portfolio loads saved assets from localStorage
- [ ] Portfolio Health Score displays correctly
- [ ] Future Projection Simulator sliders work
- [ ] What-If Swap Simulator works
- [ ] Alerts page scans DB correctly

**Network Section:**
- [ ] Deal Board loads from Supabase
- [ ] Post Deal form submits correctly
- [ ] Agent Hub displays agents
- [ ] AI Chat agents respond correctly (all 8)
- [ ] **Media Studio shows ALL 35+ tools directly** (no message required!)
- [ ] AI Video Studio opens and shows all 8 engines
- [ ] Video Editor uploads and trims video (500MB limit)
- [ ] Content Calendar displays months correctly
- [ ] PropTech Video Platform — explore, agents, profile, following

**More Section:**
- [ ] Workspace + Report Builder + PDF export work

**Cross-Cutting:**
- [ ] Notification bell works
- [ ] Auth modal (sign in/up) works
- [ ] Tour system works (Quick + Full)
- [ ] Share buttons work (WhatsApp, X, LinkedIn, Telegram)
- [ ] Language switcher (EN/AR/FA) still works
- [ ] Mobile responsive throughout
- [ ] Dark theme consistent across all sections
- [ ] Home dashboard shows live market data
