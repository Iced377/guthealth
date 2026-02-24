# Webview Information Architecture & Hierarchy

**Scope:** Webview only (no mobile/iOS impact).  
**Goal:** Align every screen to a single narrative flow so hierarchy is consistent and obvious.

## IA Principles
1. **One page, one primary intent.** Every screen must answer a single “why am I here?” question.
2. **Narrative flow > widget grid.** The user should read top‑to‑bottom without confusion.
3. **Primary → secondary → tertiary** is visible in typography, spacing, and structure.

## Screen 1: Dashboard / Today’s Snapshot
**Primary intent:** “How am I doing today?”

### Proposed Narrative Flow
1. **Hero Summary**
   - Title: “Today’s Snapshot”
   - One primary status indicator (e.g., “+6% over target”).
2. **Daily Summary Row**
   - Stat chips: Calories, Steps, Weight, Fasting, Meals Logged.
   - Chips are informational, not interactive.
3. **Macro Balance**
   - Macro tiles for Calories, Protein, Carbs, Fat.
   - Includes target context.
4. **Daily Trend**
   - One primary chart: Calories (Daily).
   - Optional secondary chart: Steps or Weight (not both unless needed).
5. **Action/Insight**
   - A single “Next best action” card to drive behavior.

### Hierarchy Rules
- Hero summary must be the dominant visual.
- Macro cards are secondary, charts are tertiary.
- “7‑Day Trend” labels must be actionable or removed.

## Screen 2: Highlights / Coach
**Primary intent:** “What matters most today, and what should I do next?”

### Proposed Narrative Flow
1. **Greeting + Status**
   - Personalized greeting with a short summary line.
2. **Top Insights**
   - 2–3 cards with “Insight → Why → Action”.
3. **Behavior Streaks**
   - Summary chips for streaks, fasting, calories, protein (if relevant).
4. **Coach CTA**
   - A clear action: “View detailed plan” or “Adjust goals”.

### Hierarchy Rules
- The tab switch (Highlights / Coach) must read as top‑level navigation.
- Insights need a CTA or they read as static text.

## Screen 3: Analytics / 30D
**Primary intent:** “Am I trending in the right direction?”

### Proposed Narrative Flow
1. **Range Selector**
   - 7D / 30D / 6M / 1Y with clear active state.
2. **Summary Line**
   - “Averaging 1803 kcal (297 under target).”
3. **Primary Chart**
   - Single chart with explicit units, targets, and legend.
4. **Supporting Metrics**
   - Optional micro‑stats: best day, worst day, average delta.

### Hierarchy Rules
- Chart must include axis + legend; this is the core view.
- Pagination dots removed unless true multi‑page chart sections exist.

## Cross‑Screen Hierarchy Consistency
1. **Page titles** appear at the top left with the same style.
2. **Section headers** use the same label + title pattern across all screens.
3. **Primary CTA** is always placed in the same region (bottom right or top right).
4. **Bottom navigation** highlights the active tab clearly in both modes.

## Content Reductions (To Improve Clarity)
- Remove “7‑Day Trend” labels if no control exists.
- Avoid duplicating metrics (e.g., calories in multiple rows without context).
- Limit each screen to **one dominant chart**.

## IA Deliverables
- Narrative wireframe per screen
- Component mapping per section
- Action/insight consistency audit

