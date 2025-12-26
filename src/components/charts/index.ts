/**
 * SEENCEL CHART LIBRARY
 * 
 * Agnostic, reusable chart components organized by type.
 * All charts follow the Nivel 1 pattern: pure visualization, no business logic.
 * 
 * @see CATALOG.md for visual reference and usage guide
 * @see theme.ts for styling tokens
 */

// Theme & Utilities
export * from './theme'

// Line Charts
export { TrendLineChart } from './line/TrendLineChart'
export type { TrendDataPoint, TrendLineChartProps } from './line/TrendLineChart'
export { MultiLineChart } from './line/MultiLineChart'
export type { MultiLineDataPoint, LineSeriesConfig, MultiLineChartProps } from './line/MultiLineChart'

// Sparkline Charts
export { SparklineChart } from './sparkline/SparklineChart'
export type { SparklineDataPoint, SparklineChartProps } from './sparkline/SparklineChart'

// Bar Charts
export { VerticalBarChart } from './bar/VerticalBarChart'
export type { BarDataPoint, VerticalBarChartProps } from './bar/VerticalBarChart'
export { HorizontalBarChart } from './bar/HorizontalBarChart'
export type { HorizontalBarDataPoint, HorizontalBarChartProps } from './bar/HorizontalBarChart'
export { GroupedBarChart } from './bar/GroupedBarChart'
export type { GroupedBarDataPoint, BarSeriesConfig, GroupedBarChartProps } from './bar/GroupedBarChart'

// Pie Charts
export { DonutChart } from './pie/DonutChart'
export type { DonutDataPoint, DonutChartProps } from './pie/DonutChart'

// Radial Charts
export { ProgressRingChart } from './radial/ProgressRingChart'
export type { ProgressRingChartProps } from './radial/ProgressRingChart'

// Composed Charts
export { ComposedBarLineChart } from './composed/ComposedBarLineChart'
export type { ComposedDataPoint, ComposedBarLineChartProps } from './composed/ComposedBarLineChart'

// Heatmap Charts
export { HeatmapGrid } from './heatmap/HeatmapGrid'
export type { HeatmapDataPoint, HeatmapGridProps } from './heatmap/HeatmapGrid'

// Table Charts
export { DataTable } from './table/DataTable'
export type { DataTableColumn, DataTableRow, DataTableProps } from './table/DataTable'

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY ALIASES (for backward compatibility during migration)
// These will be removed after all imports are updated
// ═══════════════════════════════════════════════════════════════════════════

// Alias: CategoryBalanceTable → DataTable
export { DataTable as CategoryBalanceTable } from './table/DataTable'

// Alias: CategoryBreakdownChart → DonutChart  
export { DonutChart as CategoryBreakdownChart } from './pie/DonutChart'

// Alias: MiniTrendChart → SparklineChart
export { SparklineChart as MiniTrendChart } from './sparkline/SparklineChart'

// Alias: MiniSparkline → SparklineChart
export { SparklineChart as MiniSparkline } from './sparkline/SparklineChart'

// Alias: ProgressRing → ProgressRingChart
export { ProgressRingChart as ProgressRing } from './radial/ProgressRingChart'
