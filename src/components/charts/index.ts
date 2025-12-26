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
// EXISTING ROOT-LEVEL CHARTS (kept for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════

// CategoryBalanceTable - Unique 3-column table with icons
export { CategoryBalanceTable } from './CategoryBalanceTable'
export type { CategoryBalanceRow } from './CategoryBalanceTable'

// CategoryBreakdownChart - Donut chart
export { CategoryBreakdownChart } from './CategoryBreakdownChart'

// MonthlyTrendChart & MultiSeriesTrendChart - Area/Composed charts
export { MonthlyTrendChart, MultiSeriesTrendChart } from './MonthlyTrendChart'

// IncomeExpenseChart - Grouped bar chart
export { IncomeExpenseChart } from './IncomeExpenseChart'

// BalanceBreakdownChart - Horizontal bar chart
export { BalanceBreakdownChart } from './BalanceBreakdownChart'

// MiniTrendChart - Mini sparkline using Recharts
export { MiniTrendChart } from './MiniTrendChart'

// MiniSparkline - SVG sparkline
export { MiniSparkline } from './MiniSparkline'

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY FEATURE-SPECIFIC CHARTS (pending migration)
// Import directly from their paths until migrated
// ═══════════════════════════════════════════════════════════════════════════

// Legacy charts (named exports - will be deprecated)
export { CapitalChart } from './legacy/CapitalChart'
export { MonthlyFlowChart } from './legacy/MonthlyFlowChart'
export { BreakdownChart } from './legacy/BreakdownChart'

// Gantt charts (default exports - feature-specific, pending migration)
export { default as BurndownChart } from './gantt/BurndownChart'
export { default as ProgressCurve } from './gantt/ProgressCurve'
export { default as StatusBreakdown } from './gantt/StatusBreakdown'
export { default as TasksByPhase } from './gantt/TasksByPhase'
export { default as WeeklyProgressHeatmap } from './gantt/WeeklyProgressHeatmap'
export { default as WorkloadOverTime } from './gantt/WorkloadOverTime'
export { default as DurationByRubro } from './gantt/DurationByRubro'
export { default as CriticalPathDistribution } from './gantt/CriticalPathDistribution'
export { default as DependencyNetwork } from './gantt/DependencyNetwork'

// Course charts (mixed exports - feature-specific, pending migration)
export { default as LineStreak } from './courses/LineStreak'
export { default as MiniBar } from './courses/MiniBar'
export { ProgressChart } from './courses/ProgressChart'
export { default as ProgressRing } from './courses/ProgressRing'
