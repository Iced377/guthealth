# Webview Design System (Foundations)

**Scope:** Webview only (no mobile/iOS impact).  
**Goal:** Establish a coherent foundation for light and dark modes that scales across all webview screens.

## 1) Layout & Grid
**Container width**
- Max width: `1280px` (desktop content)
- Safe side padding: `32px` (desktop), `24px` (tablet)

**Grid**
- 12‑column grid
- Gutter: `24px`
- Column min width: `64px`
- Standard sections snap to the grid; charts can span full width.

**Rhythm**
- Vertical rhythm uses the spacing scale (see below).
- Major section breaks: `48px` to `64px` spacing.

## 2) Spacing Scale (Base Unit = 4px)
Use only these values for margin/padding:
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`

**Usage**
- Micro spacing: `4–8`
- Component padding: `12–20`
- Card padding: `20–24`
- Section spacing: `32–48`
- Page section breaks: `64–80`

## 3) Typography System
**Font pairing (webview)**
- Display / Headline: `Sora` (fallback: `Inter`)
- Body / UI: `Inter`
- Numbers / data: `Inter` (tabular if available)

**Type scale**
| Role | Size | Line Height | Weight | Usage |
| --- | --- | --- | --- | --- |
| Display | 40 | 48 | 600 | Hero summary titles |
| H1 | 32 | 40 | 600 | Page titles |
| H2 | 24 | 32 | 600 | Section titles |
| H3 | 20 | 28 | 600 | Card titles |
| Body | 16 | 24 | 400 | Primary body text |
| Small | 14 | 20 | 400 | Secondary text |
| Label | 12 | 16 | 500 | Uppercase labels |
| Micro | 11 | 14 | 500 | Chart captions |

**Rules**
- Labels are uppercase with `letter-spacing: 0.08em`.
- Numbers in data cards can use `weight 600` for emphasis.

## 4) Surface & Elevation
Define a **3‑layer surface system** for all pages.

**Surface roles**
- `surface-0`: page background
- `surface-1`: base cards and sections
- `surface-2`: nested cards or panels
- `surface-3`: overlays, floating pills, or tooltips

**Elevation tokens (light mode)**
- `e1`: 0 1px 2px rgba(15, 23, 42, 0.06)
- `e2`: 0 4px 12px rgba(15, 23, 42, 0.08)
- `e3`: 0 12px 30px rgba(15, 23, 42, 0.12)

**Elevation tokens (dark mode)**
- `e1`: 0 1px 2px rgba(0, 0, 0, 0.5)
- `e2`: 0 4px 12px rgba(0, 0, 0, 0.6)
- `e3`: 0 12px 30px rgba(0, 0, 0, 0.7)

## 5) Radius System
Use a consistent radius scale to avoid drift.

| Token | Radius | Usage |
| --- | --- | --- |
| r-xs | 6px | Small tags |
| r-sm | 10px | Chips |
| r-md | 14px | Cards |
| r-lg | 18px | Large panels |
| r-pill | 999px | Pills and toggles |

## 6) Borders & Dividers
- Default border: `1px solid` at 12–16% opacity (dark) or 12–18% (light).
- Dividers: use lighter opacity than borders.
- Avoid hard outlines unless active or selected.

## 7) Motion & Interaction
**Durations**
- Micro: 120–160ms
- Standard: 200–240ms
- Page transitions: 300–400ms

**Easings**
- Standard: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Emphasis: `cubic-bezier(0.16, 1, 0.3, 1)`

## 8) Iconography
- Primary sizes: `16px`, `20px`, `24px`
- Stroke width: `1.5–2`
- Icons use metric color only when the icon represents a metric.

## 9) Token Set (Webview Only)
These tokens should be implemented in webview theme files:

**Text**
- `--text-primary`
- `--text-secondary`
- `--text-muted`
- `--text-inverse`

**Surfaces**
- `--surface-0`
- `--surface-1`
- `--surface-2`
- `--surface-3`

**Borders**
- `--border-subtle`
- `--border-strong`

**Shadows**
- `--shadow-e1`
- `--shadow-e2`
- `--shadow-e3`

**Actions**
- `--action-primary`
- `--action-primary-hover`
- `--action-secondary`
- `--action-ghost`

**States**
- `--state-focus`
- `--state-hover`
- `--state-active`

## 10) Accessibility Baseline
- Body text contrast ≥ 4.5:1 in both modes.
- Labels ≥ 12px and never below 60% opacity.
- Focus states must be visible on all interactive components.

## 11) Component Alignment Rules
These are guardrails to prevent drift:
- **Chips** are either **stats** or **filters**, never both.
- **Cards** must include a title and clear context label if showing data.
- **Charts** always include target context or units.

