# Chart Components Library

> **Nivel 1 Pattern**: All charts are pure visualization components.

## Architecture

```
src/components/charts/
├── theme.ts           # Unified styling tokens
├── CATALOG.md         # Visual reference guide
├── index.ts           # Central exports
│
├── line/              # Line & Area charts
│   ├── TrendLineChart.tsx
│   └── MultiLineChart.tsx
│
├── sparkline/         # Compact inline charts
│   └── SparklineChart.tsx
│
├── bar/               # Bar charts
│   ├── VerticalBarChart.tsx
│   ├── HorizontalBarChart.tsx
│   └── GroupedBarChart.tsx
│
├── pie/               # Pie & Donut charts
│   └── DonutChart.tsx
│
├── radial/            # Radial/Progress charts
│   └── ProgressRingChart.tsx
│
├── composed/          # Multi-type charts
│   └── ComposedBarLineChart.tsx
│
├── heatmap/           # Heatmap grids
│   └── HeatmapGrid.tsx
│
└── table/             # Data tables
    └── DataTable.tsx
```

## Core Principles

### What Charts DO:
- Render data visualizations (lines, bars, pie, etc.)
- Handle internal tooltips
- Format axis values
- Handle `isLoading` and empty states
- Apply visual styles from theme.ts

### What Charts DON'T:
- Wrap in Card containers
- Add titles or headers
- Query or fetch data
- Define page layout
- Know business domain (expenses, materials, etc.)

## Usage Example

```tsx
// CORRECT: Consumer adds Card and context
import { TrendLineChart } from '@/components/charts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

function MyDashboard() {
  const data = [
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 150 },
    { label: 'Mar', value: 120 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <TrendLineChart data={data} height={280} />
      </CardContent>
    </Card>
  )
}
```

## Theme System

All charts use centralized tokens from `theme.ts`:

```tsx
import { 
  CHART_COLORS,      // Color palette & semantic colors
  CHART_AXIS,        // Axis configuration
  CHART_TOOLTIP,     // Tooltip styling
  CHART_SHAPES,      // Shape defaults (radius, stroke, etc.)
  getChartColor,     // Get color by index
  getValueColor,     // Get color by positive/negative
  formatCompact      // Number formatting
} from '@/components/charts'

// Colors
CHART_COLORS.palette[0]  // First chart color
CHART_COLORS.positive    // Green for positive values
CHART_COLORS.negative    // Red for negative values

// Get wrapped color by index
getChartColor(5)  // Returns palette[0] (wraps around)

// Semantic value colors
getValueColor(100)   // Returns positive color
getValueColor(-50)   // Returns negative color
```

## Available Charts

| Import | Type | Use Case |
|--------|------|----------|
| `TrendLineChart` | Area | Time series with gradient fill |
| `MultiLineChart` | Line | Compare multiple series |
| `SparklineChart` | Mini Line | Inline KPI trends |
| `VerticalBarChart` | Bar | Category comparison |
| `HorizontalBarChart` | Bar | Ranked/balance data |
| `GroupedBarChart` | Bar | Side-by-side comparison |
| `DonutChart` | Donut | Proportions with center |
| `ProgressRingChart` | Radial | Single percentage |
| `ComposedBarLineChart` | Bar+Line | Combined visualization |
| `HeatmapGrid` | Grid | Time-based intensity |
| `DataTable` | Table | Categorized data list |

## Adding New Charts

1. Create in appropriate type folder (`line/`, `bar/`, etc.)
2. Use tokens from `theme.ts`
3. NO Card wrappers or titles
4. Receive `data`, `height`, `isLoading` via props
5. Handle empty states gracefully
6. Export from `index.ts`
7. Add to `CATALOG.md`

## Legacy Charts (Deprecated)

The following folders contain legacy charts pending migration:
- `legacy/` - Old feature-specific charts
- `gantt/` - Gantt-specific visualizations
- `courses/` - Learning module charts

These will be consolidated into the type-based structure.
