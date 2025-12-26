# Chart Components Catalog

> **AGNOSTIC NORM**: All charts are pure visualization components. They receive data via props and know nothing about the business domain.

## Quick Reference

| Chart | Type | Folder | Use Case |
|-------|------|--------|----------|
| `TrendLineChart` | Line | `/line` | Time series with single line |
| `MultiLineChart` | Line | `/line` | Multiple series comparison |
| `SparklineChart` | Line | `/sparkline` | Compact inline trends |
| `VerticalBarChart` | Bar | `/bar` | Category comparison |
| `HorizontalBarChart` | Bar | `/bar` | Ranked/balance data |
| `GroupedBarChart` | Bar | `/bar` | Side-by-side comparison |
| `DonutChart` | Pie | `/pie` | Proportions with center label |
| `PieChart` | Pie | `/pie` | Simple proportions |
| `ComposedChart` | Composed | `/composed` | Bar + Line overlay |
| `ProgressRing` | Radial | `/radial` | Single percentage |
| `HeatmapGrid` | Heatmap | `/heatmap` | Time-based intensity |
| `DataTable` | Table | `/table` | Categorized values with icons |

---

## Line Charts (`/line`)

### TrendLineChart
```
    ●───●
   /     \───●
  /           \
●               ●
└──────────────────
  Jan  Feb  Mar  Apr
```
**Props:** `data`, `height?`, `color?`, `valueFormatter?`, `isLoading?`, `emptyText?`

**Use:** Time series, monthly trends, progress over time

---

### MultiLineChart
```
●───●       ╭─────● Line A
     \     /
      ●───●
         ╭────● Line B
────●───●
└──────────────────
  Jan  Feb  Mar  Apr
```
**Props:** `data`, `series[]`, `height?`, `valueFormatter?`, `showLegend?`

**Use:** Compare multiple metrics, income vs expense

---

## Sparkline Charts (`/sparkline`)

### SparklineChart
```
  ╭─╮   ╭──
 ╱  ╲─╱
╱        
```
**Props:** `data`, `color?`, `height?`

**Use:** Inline micro-charts, table cells, KPI cards

---

## Bar Charts (`/bar`)

### VerticalBarChart
```
     ██
  ██ ██
  ██ ██ ██
  ██ ██ ██ ██
  ─────────────
  A  B  C  D
```
**Props:** `data`, `height?`, `color?`, `valueFormatter?`, `showAxis?`

**Use:** Category comparison, counts, discrete values

---

### HorizontalBarChart
```
Category A ████████████ +100
Category B ████████    +50
Category C ██████────   -30
           ─────|─────────
                0
```
**Props:** `data`, `height?`, `valueFormatter?`, `barSize?`

**Use:** Ranked items, balance display, positive/negative values

---

### GroupedBarChart
```
     ██
  ██ ░░ ██
  ██ ░░ ██ ░░
  ─────────────
  Jan Feb Mar
  ██ Income ░░ Expense
```
**Props:** `data`, `keys[]`, `height?`, `colors?`, `showLegend?`

**Use:** Side-by-side comparison, income vs expense by period

---

## Pie Charts (`/pie`)

### DonutChart
```
    ╭──────╮
   ╱   45%  ╲
  │    ●    │
   ╲       ╱
    ╰──────╯
  ■ Cat A  ■ Cat B
```
**Props:** `data`, `height?`, `innerRadius?`, `outerRadius?`, `showLegend?`

**Use:** Proportions, category distribution, with center metric

---

### PieChart
```
    ╭──────╮
   ╱  ████  ╲
  │ ████████ │
   ╲ ████   ╱
    ╰──────╯
```
**Props:** `data`, `height?`, `showLabels?`

**Use:** Simple proportions, no center hole

---

## Composed Charts (`/composed`)

### ComposedBarLineChart
```
        ●───●───●  (line)
     ██      ██
  ██ ██   ██ ██ ██
  ─────────────────
  Jan Feb Mar Apr May
```
**Props:** `data`, `barKey`, `lineKey`, `height?`, `barColor?`, `lineColor?`

**Use:** Daily values + cumulative, bars + trend

---

## Radial Charts (`/radial`)

### ProgressRing
```
    ╭──────╮
   ╱ ██████ ╲
  │   75%   │
   ╲ ██████ ╱
    ╰──────╯
```
**Props:** `value`, `height?`, `color?`, `label?`

**Use:** Single percentage, completion, progress

---

## Heatmap Charts (`/heatmap`)

### HeatmapGrid
```
  ░░ ▒▒ ▓▓ ██ ░░ ▒▒
  ▒▒ ▓▓ ██ ▒▒ ░░ ░░
  ░░ ░░ ▒▒ ▓▓ ██ ▓▓
  W1 W2 W3 W4 W5 W6
  
  ░ Low  ▒ Med  ▓ High  █ Max
```
**Props:** `data`, `height?`, `colorScale?`

**Use:** Weekly activity, time-based intensity

---

## Table Charts (`/table`)

### DataTable
```
  ┌────────────────────────┐
  │ 🏦 Category A    +500  │
  │ 💰 Category B    -200  │
  │ 📊 Category C    +150  │
  └────────────────────────┘
```
**Props:** `data`, `columns[]`, `emptyMessage?`, `emptyIcon?`

**Use:** Categorized values, wallet balances, breakdown lists

---

## Styling Guide

All charts use the unified theme from `./theme.ts`:

```tsx
import { CHART_COLORS, CHART_AXIS, CHART_TOOLTIP, getChartColor } from './theme'

// Colors
CHART_COLORS.positive  // Green for positive values
CHART_COLORS.negative  // Red for negative values
CHART_COLORS.palette   // Array of 5 chart colors

// Get color by index
getChartColor(0)  // var(--chart-1)
getChartColor(5)  // var(--chart-1) (wraps)

// Axis styling
<XAxis {...CHART_AXIS.xAxis} />
<YAxis {...CHART_AXIS.yAxis} />
<CartesianGrid {...CHART_AXIS.grid} />
```

## Usage Rules

1. **NO Card wrappers** - Charts are pure visualization
2. **NO titles/headers** - Parent component adds context
3. **NO business logic** - Receive processed data via props
4. **YES loading states** - Handle `isLoading` prop
5. **YES empty states** - Handle empty data gracefully
6. **YES formatters** - Accept value formatting functions
