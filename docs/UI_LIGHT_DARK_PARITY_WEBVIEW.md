# Webview Light/Dark Parity Check

**Scope:** Webview only (no mobile/iOS impact).  
**Goal:** Ensure light and dark modes preserve the same hierarchy, meaning, and interaction clarity.

## Parity Principles
1. Light mode is not a softened version of dark mode. It must be equally clear.
2. Visual hierarchy must match: what is primary in dark is primary in light.
3. Color meaning must remain consistent across modes.
4. Interactions must be equally discoverable and readable.

## Parity Checklist (Step-by-Step)
### 1) Base Surfaces
- Verify `surface-0` and `surface-1` have clear separation.
- Ensure cards do not blend into the page background in light mode.
- Confirm elevation tokens are visible but subtle.

### 2) Typography & Contrast
- Body text >= 4.5:1 contrast in both modes.
- Labels never below 60% opacity.
- Headers maintain the same visual weight across modes.

### 3) Component Role Clarity
- Stat chips look informational in both modes.
- Filter chips look interactive in both modes.
- Cards, tabs, and nav are visually distinct and consistent.

### 4) Data Language Consistency
- Metric colors unchanged between modes.
- Status colors do not shift or wash out in light mode.
- Charts use the same target band and axis system.

### 5) Chart Readability
- Gridlines visible in both modes.
- Axis labels readable in both modes.
- Tooltips are legible and consistent.

### 6) Interaction States
- Hover, focus, selected, and disabled are visible in both modes.
- Primary CTA is still the most dominant action.
- Active nav state is unmistakable.

## Parity Matrix (What Must Match)
| Area | Must Match | Example |
| --- | --- | --- |
| Hierarchy | Primary and secondary focus | Hero summary is dominant in both modes |
| Spacing | Layout rhythm | Same section spacing and padding |
| Color Meaning | Metric and status mapping | Calories always orange |
| Interaction | Active/hover/focus clarity | Tabs show selection clearly |
| Depth | Elevation and borders | Cards visibly separate from background |

## Common Failure Modes
- Light mode uses pastels that reduce contrast.
- Dark mode relies on glow for hierarchy.
- Tabs feel like chips in one mode and buttons in the other.
- Charts lose axis clarity in light mode.

## QA Pass (Required)
For each screen, complete a side-by-side check:
- [ ] Hierarchy matches (primary, secondary, tertiary)
- [ ] Metric colors match
- [ ] Targets and legends visible
- [ ] Tabs and nav states visible
- [ ] Card separation visible
- [ ] Tooltips readable

## Sign-Off Criteria
- No category below 8.5 in the Award Bar rubric.
- Contrast passes WCAG AA for body text.
- External reviewer confirms parity consistency.

