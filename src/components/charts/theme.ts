/**
 * CHART THEME SYSTEM
 * 
 * Unified styling layer for all chart components.
 * All charts MUST use these tokens to ensure visual consistency.
 * 
 * Colors reference CSS variables from index.css
 */
// ═══════════════════════════════════════════════════════════════════════════
// COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════
export const CHART_COLORS = {
  // Primary palette for categories/series (10 colors: 1-5 from light, 6-10 from dark)
  // Only add new colors beyond these if absolutely necessary (11+)
  // Values correspond to CSS variables in index.css
  palette: [
    '#84cc16', // --chart-1: hsl(76, 100%, 40%)
    '#1fa384', // --chart-2: hsl(173, 58%, 39%)
    '#1c4a6b', // --chart-3: hsl(197, 37%, 24%)
    '#d4a574', // --chart-4: hsl(43, 74%, 66%)
    '#f44747', // --chart-5: hsl(0, 87%, 67%)
    '#4a8fd4', // --chart-6: hsl(210, 40%, 55%)
    '#2ba49d', // --chart-7: hsl(173, 58%, 45%)
    '#2d5986', // --chart-8: hsl(197, 37%, 35%)
    '#e6b886', // --chart-9: hsl(43, 74%, 70%)
    '#f59a56', // --chart-10: hsl(27, 87%, 70%)
  ] as const,
  
  // Semantic colors (must be hex for Recharts)
  positive: '#22c55e', // Green for positive values
  negative: '#ef4444', // Red for negative values
  neutral: '#6b7280',  // Gray for neutral values
  accent: '#84cc16',   // Lime green accent
  
  // Grid and axes
  grid: 'var(--chart-grid)',
  gridText: 'var(--chart-grid-text)',
  axis: 'var(--border)',
  
  // Background for radial charts
  ringBackground: 'var(--chart-ring-bg)',
}
// Get color by index (wraps around palette)
export function getChartColor(index: number): string {
  return CHART_COLORS.palette[index % CHART_COLORS.palette.length]
}
// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════
export const CHART_TYPOGRAPHY = {
  // Axis tick labels
  axisTick: {
    fontSize: 11,
    fontFamily: 'inherit',
  },
  
  // Tooltip text
  tooltip: {
    fontSize: 12,
    fontFamily: 'inherit',
  },
  
  // Legend text
  legend: {
    fontSize: 12,
    fontFamily: 'inherit',
  },
  
  // Center label (for radial/donut)
  centerLabel: {
    fontSize: 32,
    fontWeight: 700,
  },
  
  // Sublabel
  subLabel: {
    fontSize: 14,
    fontWeight: 400,
  },
}
// ═══════════════════════════════════════════════════════════════════════════
// AXIS STYLING
// ═══════════════════════════════════════════════════════════════════════════
export const CHART_AXIS = {
  // Common axis props
  xAxis: {
    tick: { fontSize: CHART_TYPOGRAPHY.axisTick.fontSize, fill: CHART_COLORS.gridText },
    tickLine: false,
    axisLine: { stroke: CHART_COLORS.axis, opacity: 0.3 },
  },
  
  yAxis: {
    tick: { fontSize: CHART_TYPOGRAPHY.axisTick.fontSize, fill: CHART_COLORS.gridText },
    tickLine: false,
    axisLine: false,
  },
  
  // Cartesian grid
  grid: {
    strokeDasharray: '3 3',
    stroke: CHART_COLORS.grid,
    vertical: false,
  },
}
// ═══════════════════════════════════════════════════════════════════════════
// TOOLTIP STYLING
// ═══════════════════════════════════════════════════════════════════════════
export const CHART_TOOLTIP = {
  // Container styling (for Recharts contentStyle)
  container: {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  
  // CSS class for custom tooltip
  className: 'rounded-lg p-3 shadow-lg border border-border bg-popover text-popover-foreground',
}
// ═══════════════════════════════════════════════════════════════════════════
// SHAPE STYLING
// ═══════════════════════════════════════════════════════════════════════════
export const CHART_SHAPES = {
  // Bar chart
  bar: {
    radius: [4, 4, 0, 0] as [number, number, number, number],
    barSize: 24,
  },
  
  // Line chart
  line: {
    strokeWidth: 2,
    dot: { r: 4, strokeWidth: 2 },
    activeDot: { r: 6, strokeWidth: 2 },
  },
  
  // Area chart
  area: {
    strokeWidth: 2,
    fillOpacity: 0.2,
  },
  
  // Pie/Donut chart
  pie: {
    innerRadius: 60,
    outerRadius: 90,
    paddingAngle: 2,
  },
  
  // Radial bar
  radial: {
    innerRadius: '70%',
    outerRadius: '100%',
    cornerRadius: 10,
  },
}
// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT DIMENSIONS
// ═══════════════════════════════════════════════════════════════════════════
export const CHART_DIMENSIONS = {
  // Standard heights
  height: {
    sm: 120,
    md: 200,
    lg: 280,
    xl: 350,
  },
  
  // Margins
  margin: {
    compact: { top: 5, right: 5, bottom: 5, left: 5 },
    standard: { top: 10, right: 10, bottom: 0, left: 0 },
    withLegend: { top: 10, right: 10, bottom: 30, left: 0 },
  },
}
// ═══════════════════════════════════════════════════════════════════════════
// LOADING & EMPTY STATES
// ═══════════════════════════════════════════════════════════════════════════
export const CHART_STATES = {
  loading: {
    className: 'flex items-center justify-center',
    textClassName: 'text-sm text-muted-foreground animate-pulse',
  },
  
  empty: {
    className: 'flex items-center justify-center',
    textClassName: 'text-sm text-muted-foreground',
  },
}
// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Get value color based on positive/negative
 */
export function getValueColor(value: number): string {
  if (value > 0) return CHART_COLORS.positive
  if (value < 0) return CHART_COLORS.negative
  return CHART_COLORS.neutral
}
/**
 * Format number for display (compact notation)
 */
export function formatCompact(value: number, locale = 'es-AR'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value)
}
/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}
