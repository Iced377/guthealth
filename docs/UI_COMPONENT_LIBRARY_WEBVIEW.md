# Webview Component Library (Core UI)

**Scope:** Webview only (no mobile/iOS impact).  
**Goal:** Define a consistent component system so every screen reads and behaves the same.

## Component Taxonomy
**Structural**
- Page header, section header, card containers, grid layout

**Data**
- Stat chips, metric tiles, chart cards, trend rows, insight cards

**Interactive**
- Tabs, filter chips, buttons, toggles, tooltips

**Navigation**
- Bottom nav (web), breadcrumbs (if used), context chips

## 1) Page Header
**Anatomy**
- Title (H1)
- Subtitle (Small)
- Optional right‑aligned actions (buttons)

**Rules**
- Only one H1 per page.
- Subtitle may contain date/time or status context.
- Actions are brand/primary, not metric‑colored.

## 2) Section Header
**Anatomy**
- Label (Label)
- Title (H2)
- Optional action (ghost button or link)

**Rules**
- Label is uppercase and muted.
- Title must be readable at a glance without scroll.

## 3) Stat Chip (Summary Metric)
**Role:** Informational summary, not interactive.

**Anatomy**
- Icon (metric color)
- Label (Small)
- Value + unit (Body/Stat)

**States**
- Default only (no hover state)
- If interactive, it must become a Filter Chip (see below)

**Rules**
- Use metric identity color, not status color.
- If target status is shown, include explicit text (e.g., “104% of target”).

## 4) Filter Chip (Interactive)
**Role:** Toggles a view, metric, or timeframe.

**Anatomy**
- Label (Small)
- Optional icon

**States**
- Default, Hover, Selected, Disabled, Focus

**Rules**
- Selected uses strong border + background.
- Must look meaningfully different from Stat Chips.

## 5) Metric Tile (Macro Card)
**Role:** Primary KPI tile (calories, protein, carbs, fat).

**Anatomy**
- Label (Label)
- Value (Display‑Small)
- Target status line (Small)
- Progress bar (metric color)

**States**
- Default, Hover

**Rules**
- Progress bar uses metric color; status text uses neutral unless explicitly over/under.
- If over/under target, include explicit text + status color for that line only.

## 6) Chart Card
**Role:** Structured data view.

**Anatomy**
- Card title
- Subtext / timeframe
- Chart area
- Legend + axis hints + target line

**Rules**
- No chart without target context or units.
- Tooltips required for hover.
- Use the data language spec for colors.

## 7) Insight Card
**Role:** Narrative insight + suggestion.

**Anatomy**
- Tag/label (Label)
- Title (H3)
- Body copy (Small)
- Optional CTA (“View details”)

**Rules**
- At least one CTA when insight implies action.
- If tied to a metric, use metric accent dot or left border.

## 8) Tabs (Mode Toggle)
**Role:** Switches between top‑level modes (e.g., Highlights / Coach).

**States**
- Default, Hover, Active, Focus

**Rules**
- Active state must be visually obvious.
- Avoid compact pills for top‑level tabs; use a more structural tab style.

## 9) Navigation (Bottom Web Nav)
**Role:** Primary app navigation on web.

**Anatomy**
- Icon + label for each item
- Active indicator

**Rules**
- Active state must include both icon and label emphasis.
- The central CTA must have a tooltip or label.
- Active state uses brand color, not metric color.

## 10) Button System
**Variants**
- Primary (brand)
- Secondary (neutral)
- Ghost (minimal)

**Rules**
- Do not use metric colors for actions.
- Use consistent hover and focus treatment.

## 11) Tooltip
**Role:** On‑hover data explanation.

**Rules**
- Must include unit + value.
- Tooltip background is surface‑3.

## 12) Empty State
**Role:** Explain absence of data.

**Anatomy**
- Icon (neutral)
- Title (H3)
- Message (Small)

**Rules**
- Include a next action when possible.

## Component Mapping by Screen
### Dashboard / Today’s Snapshot
- Stat chips (summary row)
- Metric tiles (macros)
- Chart cards (daily calories, steps, weight)
- Section headers (macros, vitals)

### Highlights / Coach
- Tabs (mode toggle)
- Stat chips (summary row)
- Insight cards (stack)

### Analytics / 30D
- Tabs (timeframe switch)
- Chart card (primary)
- Tooltip + legend

## Visual States (Required)
Every interactive component must support:
- Default
- Hover
- Active/Selected
- Focus (keyboard)
- Disabled

## Guardrails (Non‑Negotiable)
1. Stats never look like filters.
2. Charts are always interpretable on first read.
3. Metric colors are consistent across every screen.
4. Light and dark parity holds for all states.

