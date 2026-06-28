# DubaiVal — Redesign Phase 2: Visual Polish & UX Fixes

You are continuing the redesign of DubaiVal. Phase 1 (navigation restructure,
Home page, Media Studio) is done. This prompt covers **Phase 2: visual polish,
spacing, and UX improvements**.

**Branch**: `claude/dubaival-portfolio-manager-5bgbjk`
```bash
git checkout claude/dubaival-portfolio-manager-5bgbjk
```

Read `CLAUDE.md` for full project context. Do NOT modify any files listed in
the "Files that the redesign session MUST NOT modify" section of CLAUDE.md.

---

## Task 1: Add Logo to Sidebar Header

The sidebar currently shows only "DV" text. Replace it with the actual DubaiVal
logo. The logo file is `logo.png` in the project root.

- Desktop sidebar (expanded): show `logo.png` (height ~36px) + "DubaiVal" text
  beside it
- Desktop sidebar (collapsed): show just `logo.png` (height ~28px), no text
- Mobile: show `logo.png` in the top header bar (height ~28px)

If `logo.png` doesn't exist, create a clean SVG logo inline: the letters "DV"
in a diamond shape with gold (#D4AF37) accent. But check for `logo.png` first.

---

## Task 2: Fix Glassmorphism Cards on Dark Background

**Problem**: Glass cards on pure dark background (#070B14) look like flat gray
rectangles. The blur has nothing colorful behind it to blur, so the glass
effect is invisible.

**Solution — Gradient Blobs + Border Glow (combined approach):**

### 2a. Add ambient gradient blobs behind the three hero cards on Home page

Behind the row of 3 hero cards (Analyze / Off-Market Deals / AI Media Studio),
add 2-3 large, soft, blurred gradient circles as a CSS pseudo-element or
absolute-positioned div on the parent container:

```css
/* Parent of the 3 hero cards */
.hero-cards-container {
  position: relative;
}
.hero-cards-container::before {
  content: '';
  position: absolute;
  top: -40%;
  left: 10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
.hero-cards-container::after {
  content: '';
  position: absolute;
  bottom: -30%;
  right: 15%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
```

This gives the blur something to work with. The cards themselves should have:
```css
.hero-card {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
```

### 2b. Border glow on hover

Each of the 3 hero cards gets its own signature color on hover:

- **Analyze Any Property**: Gold glow (#D4AF37)
- **Off-Market Deals**: Green glow (#10B981)
- **AI Media Studio**: Purple glow (#8B5CF6)

```css
.hero-card-analyze:hover {
  border-color: rgba(212,175,55,0.4);
  box-shadow: 0 0 30px rgba(212,175,55,0.12), inset 0 0 30px rgba(212,175,55,0.04);
  transform: translateY(-4px);
}
.hero-card-deals:hover {
  border-color: rgba(16,185,129,0.4);
  box-shadow: 0 0 30px rgba(16,185,129,0.12), inset 0 0 30px rgba(16,185,129,0.04);
  transform: translateY(-4px);
}
.hero-card-media:hover {
  border-color: rgba(139,92,246,0.4);
  box-shadow: 0 0 30px rgba(139,92,246,0.12), inset 0 0 30px rgba(139,92,246,0.04);
  transform: translateY(-4px);
}
```

The `translateY(-4px)` on hover solves the original complaint — the card lift
is now clearly visible on dark backgrounds.

### 2c. Apply similar treatment to Market Pulse stat cards

The 6 stat cards (AVG PSF, AVG YIELD, RESIDENTIAL, COMMERCIAL, LAND PLOTS,
AREAS) should also have subtle border glow and slight lift on hover. Use a
shared style:

```css
.stat-card:hover {
  border-color: rgba(255,255,255,0.15);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}
```

---

## Task 3: Fix "347 Areas" Card Color

The number "347" for AREAS is currently **red**. This is wrong — 347 areas of
coverage is a positive metric, not a warning.

Change the color of the "347" number to **blue (#3B82F6)** to match the
informational/positive tone of the other stat cards.

Find where the stat cards are rendered (likely in the Home page render function
or `renderMarket()`) and change only the color for the AREAS card number.

---

## Task 4: Hover Micro-Cards on Three Hero Cards

When the user hovers over any of the 3 hero cards, a **micro-card** should
slide up from the bottom of the card, giving a brief description of what
clicking it does. This helps new users understand what each section offers.

### Implementation:

Each hero card gets a hidden child div that slides up on hover:

```css
.hero-card .micro-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(12px);
  border-radius: 0 0 16px 16px;
  transform: translateY(100%);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
  font-size: 12px;
  color: #8899AA;
  line-height: 1.5;
}
.hero-card:hover .micro-info {
  transform: translateY(0);
  opacity: 1;
}
```

### Content for each micro-card:

- **Analyze Any Property**:
  Text: "AI-powered valuation — price per sqft, rent estimate, yield, investment signal, and confidence score for any Dubai property"
  Small CTA link: "Start Analysis →"

- **Off-Market Deals**:
  Text: "Private owner-to-buyer deal board — browse exclusive listings, verified title deeds, direct contact with property owners"
  Small CTA link: "Browse Deals →"

- **AI Media Studio**:
  Text: "35+ professional tools — AI video creator, post designer, content calendar, hashtag intelligence, avatar studio, and more"
  Small CTA link: "Open Studio →"

Each CTA link should use the card's accent color (gold / green / purple).

---

## Task 5: Add Workspace Card to Home Page

Workspace (My Workspace — custom dashboard builder) is currently buried under
"More" in the sidebar. Add it as a **4th card** on the Home page, in a new row
below the 3 hero cards, or make the hero row a 2×2 grid.

**Recommended layout**: Keep 3 hero cards in one row. Below them, add a
**full-width slim card** for Workspace:

```
┌──────────────────────────────────────────────────────────┐
│ ⬡ My Workspace                                          │
│ Your personalized dashboard — drag & drop widgets,       │
│ custom reports, and saved views                    Open → │
└──────────────────────────────────────────────────────────┘
```

Style:
- Full width of the content area
- Height: ~60-70px (slim, not as tall as hero cards)
- Background: same glassmorphism as hero cards
- Icon: layout/grid icon (Lucide: `layout-dashboard`)
- Hover: subtle white border glow + translateY(-2px)
- Click: navigates to Workspace tab

Also add a hover micro-info tooltip: "Build your personal command center —
choose from 14+ widgets, use preset templates (Investor/Agent/Buyer), and
create custom PDF reports"

---

## Task 6: Make Market Pulse More Visual

The Market Pulse section on Home currently shows 6 plain numbers. Make it more
engaging:

### 6a. Add sparkline/trend indicators next to each number

Each stat card should have a **small directional indicator**:

- **AVG PSF (1,172)**: Add a small green arrow ▲ with "+3.2% vs last month"
  (use a reasonable sample value if live data isn't available)
- **AVG YIELD (6.8%)**: Small indicator showing if stable/up/down
- **RESIDENTIAL (8,507)**: No trend needed, just the count
- **COMMERCIAL (1,914)**: No trend needed
- **LAND PLOTS (428)**: No trend needed
- **AREAS (347)**: No trend needed (fix color to blue per Task 3)

For the property count cards (8507, 1914, 428, 347), instead of trend arrows,
add a subtle **icon** relevant to each:
- Residential: 🏢 or Lucide `building-2`
- Commercial: 💼 or Lucide `briefcase`
- Land: 📍 or Lucide `map-pin`
- Areas: 🗺️ or Lucide `map`

### 6b. Add a subtle divider line between Market Pulse and Top Movers

A thin gradient line or section separator to visually break up the page:
```css
.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 50%, transparent 100%);
  margin: 32px 0;
}
```

---

## Task 7: Fix Market Page Layout — Fill Empty Spaces

**Problem**: The Market (Live Dashboard) page has charts that don't use full
width, leaving large empty spaces on both sides. Everything is stacked
single-column, creating a very long scrollable page.

### Fixes:

### 7a. Charts should use more width

The PSF Distribution and Yield Distribution charts should be **at least 80%
of the content area width**, not the small size they currently are. If they're
in a container with max-width, increase it. They should feel like proper
dashboard charts, not thumbnail previews.

### 7b. Growth Heatmap should be larger

The Growth Heatmap (colored area grid) is currently squeezed small on the
right. It should be **full-width** as its own section, or at minimum 60% width
if paired with another component.

### 7c. Use 2-column grid for table sections

The tables that are currently stacked (Top Movers, Best Value, Most Liquid,
Highest Growth, etc.) — if more than 4 tables exist in sequence, arrange them
in a **2-column grid** on desktop:

```css
.tables-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
@media (max-width: 768px) {
  .tables-grid {
    grid-template-columns: 1fr;
  }
}
```

### 7d. Add section headers with icons

Between major sections of the Market page, add clear section headers:

```
━━ 📊 Price Distribution ━━━━━━━━━━━━━━━━━━━━━━━━━━
[chart]

━━ 🔥 Market Movers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[4 tables in 2x2 grid]

━━ 🏘️ Rental Snapshot ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[rental data]
```

Use Lucide icons (not emoji) and a subtle gradient underline.

---

## Task 8: Portfolio Manager — Do NOT Change

The Portfolio Manager page (Image 3) is well-designed. The empty state is clean
and professional. **Do not modify this page.**

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Logo appears in sidebar (expanded + collapsed) and mobile header
- [ ] Gradient blobs visible behind 3 hero cards on Home
- [ ] Each hero card has its signature color border glow on hover (gold/green/purple)
- [ ] Cards lift (translateY) visibly on hover
- [ ] "347" AREAS number is blue (#3B82F6), not red
- [ ] Hover micro-cards slide up on all 3 hero cards with correct text
- [ ] Workspace card appears on Home page below hero cards
- [ ] Market Pulse stat cards have icons/indicators
- [ ] Section dividers present between Home page sections
- [ ] Market page charts use full/wider width
- [ ] Market page tables in 2-column grid on desktop
- [ ] Market page has section headers with icons
- [ ] Portfolio page is UNCHANGED
- [ ] All existing functionality still works (click Analyze → goes to analyzer, etc.)
- [ ] No console errors
- [ ] Mobile responsive — all changes work on mobile too
