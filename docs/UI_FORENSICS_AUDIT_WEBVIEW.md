# UI Forensics Audit (Webview Only)

**Scope:** Webview screens only (no mobile/iOS).  
**Screens Reviewed:** Dashboard / Today’s Snapshot, Highlights / Coach, Analytics / 30D  
**Goal:** Identify component drift, hierarchy conflicts, and data‑language inconsistencies.

## Executive Summary
The UI has strong visual polish but lacks system coherence. The same component styling is used for different roles (stats vs filters vs actions), charts are aesthetically strong but not self‑explanatory, and light mode loses contrast and hierarchy. These issues are preventing award‑level clarity and consistency.

## Component Drift Inventory
### 1) Summary Metric Pills
- **Observed:** Same pill style used for metrics (dashboard) and filters (highlights) across pages.
- **Impact:** Users cannot tell if a pill is actionable or informational.
- **Action:** Split into distinct patterns: `stat-chip`, `filter-chip`, and `nav-chip`.

### 2) Cards & Panels
- **Observed:** Rounded card size/spacing differs by page; light mode softens borders so cards blend into background.
- **Impact:** Hierarchy and sectioning collapse in light mode.
- **Action:** Enforce a shared card spec (radius, padding, border, elevation) across pages.

### 3) Charts
- **Observed:** Gradient‑heavy bars, no axes/legend/target labels; line charts without units.
- **Impact:** Charts look decorative rather than informative.
- **Action:** Add legends, target labels, and axis hints in all chart variants.

### 4) Navigation
- **Observed:** Active state in bottom nav is too subtle in light mode; “+” button feels dominant but context‑less.
- **Impact:** Navigation clarity decreases, CTA feels disconnected.
- **Action:** Strengthen active states and define context‑aware action sheet for the CTA.

## Hierarchy & Layout Issues
### Dashboard
- Primary intent is unclear: the pill row looks like navigation rather than the main data.
- Macro tiles are visually prominent but lack target context relative to the top summary.
- “7‑Day Trend” appears as static text in multiple locations.

### Highlights / Coach
- Excess white space; page lacks an anchor.
- Tabs are visually weak; do not feel like a mode toggle.
- Content cards are equal weight; no narrative flow.

### Analytics
- Chart dominates, but lacks context (legend + target labels).
- Pagination dots are ambiguous and conflict with time toggles.

## Color & Data Language Inconsistencies
- Macro colors do not map cleanly to chart colors across pages.
- Light mode uses pastel tones that blur category distinctions.
- Data states (on‑track, over‑target, under‑target) are not encoded consistently.

## Interaction Issues
- Multiple “dead UI” labels (e.g., “7‑Day Trend”) with no action.
- Horizontal scroll hints (pill row) are unclear and cut off.

## Accessibility Risks
- Light mode contrast too low on labels and pill text.
- Small labels and secondary info are below legibility thresholds.

## Required Fixes (Webview)
1. Establish a single visual language for components and data.
2. Make charts interpretable at a glance.
3. Strengthen light mode contrast and hierarchy.
4. Remove or replace non‑interactive UI that looks actionable.

## Deliverables
- Component mismatch list (this document)
- Remediation checklist by component type
- Before/after screenshots for each screen

