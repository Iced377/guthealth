# Webview Chart System Upgrade

**Scope:** Webview only (no mobile/iOS impact).  
**Goal:** Make every chart interpretable at a glance and consistent across modes.

## Core Rules (Non-Negotiable)
1. Every chart has **units** (kcal, g, steps, kg/lb).
2. Every chart has a **target line** if a target exists.
3. Every chart has a **legend** if multiple series exist.
4. Every chart has **axis hints** (tick labels and light gridlines).
5. Tooltips are mandatory for interactive charts.

## Chart Types (Standardized)
### 1) Daily Bars (Calories / Steps)
**Purpose:** Show daily values vs target.

**Structure**
- Bars: metric color (identity).
- Target line: neutral line across chart.
- Optional band: target range (95-105%).
- Tooltip: date + value + delta vs target.

**Axis**
- X: days (short labels).
- Y: numeric scale + unit.

### 2) Macro Split (Protein / Carbs / Fat)
**Purpose:** Communicate macro balance within total.

**Structure**
- Use discrete cards (Metric Tiles) or segmented bars.
- Show grams + percentage of target.

**Axis**
- No chart if the macro is already presented as a tile.

### 3) Trend Line (Weight)
**Purpose:** Trend over time with smoothing optional.

**Structure**
- Single line, metric color.
- Dots on hover only.
- Tooltip shows date + weight.

**Axis**
- Y: numeric range + unit.
- X: date (weekly ticks for longer ranges).

## Visual Tokens
Use colors from `UI_DATA_LANGUAGE_WEBVIEW.md`.

**Chart primitives**
- Grid line: 20% opacity (light), 35% opacity (dark)
- Axis text: 60-70% opacity
- Target line: 50% opacity, dashed
- Target band: 6-10% opacity, neutral

## Tooltip Spec
**Anatomy**
- Title: Date or label
- Body: Value + unit
- Subtext: % of target or delta

**Styling**
- Background: surface-3
- Border: border-subtle
- Padding: 8-12px
- Radius: r-sm

## Legend Spec
**Anatomy**
- Metric label + colored dot
- Optional target indicator

**Rules**
- Legends are required for 2+ series.
- Legends are optional for 1 series if label is present in card title.

## Target Logic (UI Encoding)
Use the target band rules from `UI_DATA_LANGUAGE_WEBVIEW.md`.

**Encoding**
- On target: normal bar fill
- Over target: add subtle top accent (status color)
- Under target: lightened fill + neutral outline

## Light/Dark Parity Requirements
- Contrast of axes text must meet 4.5:1 (body standard).
- Gridlines remain visible but not dominant.
- Series colors must remain distinguishable in both modes.

## Chart QA Checklist
- [ ] Units visible
- [ ] Axis labels visible
- [ ] Target line shown (when applicable)
- [ ] Legend present (if multi-series)
- [ ] Tooltip shows value + unit + date
- [ ] Colors match data language spec
- [ ] Works in both light + dark modes
