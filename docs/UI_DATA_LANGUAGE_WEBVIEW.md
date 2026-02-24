# Webview Data Language and Color System

**Scope:** Webview screens only (no impact on mobile/iOS).  
**Goal:** Provide a single, consistent data language for metrics, charts, and status states across light and dark modes.

## Principles
1. One metric, one color, everywhere.
2. Metric identity uses metric colors. Performance vs target uses status colors.
3. Charts are interpretable without guessing: labels, targets, and units are explicit.
4. Light and dark modes must preserve hierarchy and meaning, not just theme.

## Metric Color Map (Identity Colors)
Use these for series identity, icons, labels, and primary chart strokes.

| Metric | Token Name | Hex | HSL | Usage Notes |
| --- | --- | --- | --- | --- |
| Calories | metric-calories | #F97316 | 24 95% 53% | Energy intake, main calorie series, calorie pills. |
| Protein | metric-protein | #EF4444 | 0 84% 60% | Macro series + labels. |
| Carbs | metric-carbs | #FBBF24 | 45 93% 57% | Macro series + labels. |
| Fat | metric-fat | #3B82F6 | 217 91% 60% | Macro series + labels. |
| Steps | metric-steps | #10B981 | 160 84% 39% | Activity series + highlights. |
| Weight | metric-weight | #6366F1 | 239 84% 67% | Weight trend series + labels. |
| Fasting | metric-fasting | #A855F7 | 270 91% 65% | Fasting duration indicators. |
| Hydration | metric-hydration | #14B8A6 | 174 72% 46% | Hydration indicators and trend. |

Notes:
- Metric colors must not change by page or mode.
- If the UI shows a metric icon, the icon uses the metric color, not the status color.

## Metric Taxonomy (UI Naming)
Use consistent nouns across all pages and labels.

| Category | Canonical Label | Alternate Labels To Avoid |
| --- | --- | --- |
| Calories | Calories | Energy, Intake (unless paired with Calories) |
| Protein | Protein | Prot |
| Carbs | Carbs | Carbohydrates (use only in long-form copy) |
| Fat | Fat | Lipids |
| Steps | Steps | Activity (too broad) |
| Weight | Weight | Body weight (copy ok, label should be Weight) |
| Fasting | Fasting | Fast time, Fast duration |
| Hydration | Hydration | Fluids |

## Page-to-Metric Mapping
Ensures the same metrics appear with the same color and label on every page.

### Dashboard / Today’s Snapshot
- Summary chips: Calories, Steps, Weight, Fasting, Meals Logged (neutral)
- Macros: Calories, Protein, Carbs, Fat
- Trends: Daily Calories (Calories), Steps (Steps), Weight (Weight)

### Highlights / Coach
- Summary chips: Streak (neutral), Fasting (Fasting), Calories (Calories), Protein (Protein)
- Insight cards: Neutral status + metric accent if specific to a metric

### Analytics / 30D
- Primary chart: Calories (Calories)
- Target and average lines: neutral
- If multi-series: use only metric colors from the map above

## Status Color Map (Performance vs Target)
Use these for status badges, target-state highlights, or alerts.

| Status | Token Name | Hex | HSL | Usage Notes |
| --- | --- | --- | --- | --- |
| On target | state-on-track | #22C55E | 142 71% 45% | Used when values are within target band. |
| Over target | state-over | #F59E0B | 37 92% 50% | Use as caution, not as error. |
| Under target | state-under | #38BDF8 | 199 89% 48% | Informational, not negative. |
| At risk | state-risk | #EF4444 | 0 84% 60% | Only for real warnings. |
| Neutral | state-neutral | #64748B | 215 16% 47% | Default labels and secondary indicators. |

## Target Band Rules (UI Classification)
These thresholds define UI color states only. They are not health guidance.

- On target: 95% - 105% of target
- Under target: 80% - 95% of target
- Over target: 105% - 120% of target
- At risk: below 80% or above 120% of target

If a metric does not have a target, use neutral state and metric identity color.

## Chart Encoding Rules
1. **Series identity** uses metric colors.
2. **Target line** uses neutral gray in light mode and muted gray in dark mode.
3. **Target band** uses a low-opacity neutral fill (6-10%).
4. **Over/under shading** uses status colors only when the UI explicitly states status.
5. **Axes and units** are mandatory for any chart used in decisions.

### Chart Styling Baseline
| Element | Light Mode | Dark Mode |
| --- | --- | --- |
| Axis text | #475569 | #94A3B8 |
| Axis line | #E2E8F0 | #1F2937 |
| Grid line | #E2E8F0 (20%) | #1F2937 (40%) |
| Target line | #94A3B8 | #64748B |
| Tooltip bg | #FFFFFF | #0B0B0F |
| Tooltip border | #E2E8F0 | #1F2937 |

## Metric Color Usage Ramp (UI)
Use consistent tints per metric for different UI roles.

| Role | Light Mode | Dark Mode |
| --- | --- | --- |
| Stroke / line | 500 | 400 |
| Bar fill | 400 | 500 |
| Area fill | 200 at 35% opacity | 500 at 20% opacity |
| Icon / label | 600 | 400 |
| Soft card tint | 100 at 60% opacity | 700 at 20% opacity |

Example (Calories):
- Light: line #F97316, tint #FDEAD7
- Dark: line #FDBA74, tint #7C2D12 (20% opacity)

## UI Usage Rules
### Stat chips (summary pills)
- Use metric identity color for icon and subtle background tint.
- Do not use status colors unless the chip explicitly states status.
- Chips are informational by default; if interactive, apply distinct filter styling.

### Cards
- If a card title references a metric, the left accent or icon should use the metric color.
- Avoid gradients that overpower text; keep background at <= 10% tint.

### Buttons
- Buttons are not metric-colored. Use brand/primary for actions.
- Metric colors are for data, not CTAs.

## Light/Dark Parity Rules
1. Ratio of text contrast must meet or exceed 4.5:1 for body text.
2. Data colors must remain distinguishable in both modes.
3. Light mode cannot rely on pastel washes to separate sections.

## Implementation Notes (Webview)
Recommended CSS variables (to be wired in a later implementation step):

- --metric-calories
- --metric-protein
- --metric-carbs
- --metric-fat
- --metric-steps
- --metric-weight
- --metric-fasting
- --metric-hydration
- --state-on-track
- --state-over
- --state-under
- --state-risk
- --state-neutral

These should be defined per theme and scoped to webview only.
