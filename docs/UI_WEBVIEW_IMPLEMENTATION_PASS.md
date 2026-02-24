# Webview Implementation Pass (Phase 5, Step 1)

**Scope:** Webview only (no mobile/iOS impact).  
**Goal:** Apply the new token system and component standards to webview surfaces and charts.

## What Was Implemented
### 1) Webview Runtime Flag
- Added a client-side flag that sets `data-webview="true"` on `<html>` for non‑iOS desktop widths (>= 1024px).
- This ensures all webview tokens and overrides are scoped and do not affect mobile.

**Files**
- `guthealth/src/components/layout/WebviewFlag.tsx`
- `guthealth/src/app/layout.tsx`

### 2) Webview Token Layer (CSS)
- Added webview surface, text, border, elevation, metric, status, and chart tokens scoped to `html[data-webview="true"]`.
- Added webview utility classes (`webview-card`, `webview-panel`, `webview-chip`, `webview-label`, etc.).
- Added chart token overrides (`--chart-axis`, `--chart-grid`, `--chart-target`, `--chart-tooltip-*`).

**Files**
- `guthealth/src/app/globals.css`

### 3) Dashboard Web Bento (Desktop)
- Updated `DashboardWebBento` to use webview tokens and classes.
- Unified stat chips and panels to new token system.
- Metric colors now flow through CSS variables for desktop.

**Files**
- `guthealth/src/components/dashboard/DashboardWebBento.tsx`

### 4) Trends Charts (Analytics)
- Updated all major trend charts to use CSS variables with fallbacks.
- No impact on mobile because fallbacks preserve existing colors.
- Tooltips now accept webview token styling when available.

**Files**
- `guthealth/src/components/trends/DailyCaloriesTrendChart.tsx`
- `guthealth/src/components/trends/WeightTrendChart.tsx`
- `guthealth/src/components/trends/ActivityTrendChart.tsx`
- `guthealth/src/components/trends/DailyMacrosTrendChart.tsx`
- `guthealth/src/components/trends/CorrelationTrendChart.tsx`
- `guthealth/src/app/trends/page.tsx`

### 5) Insights Webview Root
- Added webview root class to ensure background/text parity on desktop.

**Files**
- `guthealth/src/app/insights/page.tsx`

## Verified Expectations
- Webview tokens only apply when `data-webview="true"`.
- Mobile and iOS remain unchanged because:
  - `data-webview` is not set on those platforms.
  - Chart colors use fallback values.

## Follow‑Up (Next Step)
- Phase 5, Step 2: Interaction & behavior pass (nav, CTA consistency, hover/focus states).

