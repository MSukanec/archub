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

// ═══════════════════════════════════════════════════════════════════════════
// LINE CHARTS
// ═══════════════════════════════════════════════════════════════════════════
export { TrendLineChart } from './line/TrendLineChart'
export type { TrendDataPoint, TrendLineChartProps } from './line/TrendLineChart'
export { MultiLineChart } from './line/MultiLineChart'
export type { MultiLineDataPoint, LineSeriesConfig, MultiLineChartProps } from './line/MultiLineChart'

// ═══════════════════════════════════════════════════════════════════════════
// SPARKLINE CHARTS
// ═══════════════════════════════════════════════════════════════════════════
export { SparklineChart } from './sparkline/SparklineChart'
export type { SparklineDataPoint, SparklineChartProps } from './sparkline/SparklineChart'

// ═══════════════════════════════════════════════════════════════════════════
// BAR CHARTS
// ═══════════════════════════════════════════════════════════════════════════
export { VerticalBarChart } from './bar/VerticalBarChart'
export type { BarDataPoint, VerticalBarChartProps } from './bar/VerticalBarChart'
export { HorizontalBarChart } from './bar/HorizontalBarChart'
export type { HorizontalBarDataPoint, HorizontalBarChartProps } from './bar/HorizontalBarChart'
export { GroupedBarChart } from './bar/GroupedBarChart'
export type { GroupedBarDataPoint, BarSeriesConfig, GroupedBarChartProps } from './bar/GroupedBarChart'
export { SegmentedBarChart } from './bar/SegmentedBarChart'
export type { SegmentedBarDataPoint, SegmentedBarChartProps } from './bar/SegmentedBarChart'

// ═══════════════════════════════════════════════════════════════════════════
// PIE CHARTS
// ═══════════════════════════════════════════════════════════════════════════
export { DonutChart } from './pie/DonutChart'
export type { DonutDataPoint, DonutChartProps } from './pie/DonutChart'

// ═══════════════════════════════════════════════════════════════════════════
// RADIAL CHARTS
// ═══════════════════════════════════════════════════════════════════════════
export { ProgressRingChart } from './radial/ProgressRingChart'
export type { ProgressRingChartProps } from './radial/ProgressRingChart'

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSED CHARTS
// ═══════════════════════════════════════════════════════════════════════════
export { ComposedBarLineChart } from './composed/ComposedBarLineChart'
export type { ComposedDataPoint, ComposedBarLineChartProps } from './composed/ComposedBarLineChart'
export { FinancialFlowChart } from './composed/FinancialFlowChart'
export type { FinancialFlowDataPoint, FinancialFlowChartProps } from './composed/FinancialFlowChart'
export { BalanceTimelineChart } from './composed/BalanceTimelineChart'
export type { BalanceTimelineDataPoint, BalanceTimelineChartProps } from './composed/BalanceTimelineChart'

// ═══════════════════════════════════════════════════════════════════════════
// HEATMAP CHARTS
// ═══════════════════════════════════════════════════════════════════════════
export { HeatmapGrid } from './heatmap/HeatmapGrid'
export type { HeatmapDataPoint, HeatmapGridProps } from './heatmap/HeatmapGrid'

// ═══════════════════════════════════════════════════════════════════════════
// ROOT-LEVEL CHARTS (backward compatibility)
// These are unique charts that don't duplicate the type-based charts above
// ═══════════════════════════════════════════════════════════════════════════

// CategoryBalanceTable - Unique 3-column table with icons
export { CategoryBalanceTable } from './CategoryBalanceTable'
export type { CategoryBalanceRow } from './CategoryBalanceTable'

// CategoryBreakdownChart - Donut chart (consider migrating to DonutChart)
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

