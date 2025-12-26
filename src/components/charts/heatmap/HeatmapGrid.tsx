import { CHART_COLORS, CHART_STATES, CHART_DIMENSIONS } from '../theme'

export interface HeatmapDataPoint {
  label: string
  value: number
  count?: number
}

export interface HeatmapGridProps {
  data: HeatmapDataPoint[]
  height?: number
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  valueFormatter?: (value: number) => string
  colorScale?: (value: number) => { bg: string; text: string }
  columns?: number
}

const DEFAULT_COLOR_SCALE = (value: number): { bg: string; text: string } => {
  if (value === 0) return { bg: 'bg-muted', text: 'text-muted-foreground' }
  if (value < 25) return { bg: '[background-color:var(--chart-5)]', text: 'text-white' }
  if (value < 50) return { bg: '[background-color:var(--chart-4)]', text: 'text-gray-900 dark:text-gray-100' }
  if (value < 75) return { bg: '[background-color:var(--chart-3)]', text: 'text-white' }
  return { bg: '[background-color:var(--chart-1)]', text: 'text-white' }
}

export function HeatmapGrid({
  data,
  height = CHART_DIMENSIONS.height.lg,
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  valueFormatter = (v) => `${v}%`,
  colorScale = DEFAULT_COLOR_SCALE,
  columns = 6,
}: HeatmapGridProps) {
  if (isLoading) {
    return (
      <div style={{ height }} className={CHART_STATES.loading.className}>
        <div className={CHART_STATES.loading.textClassName}>{loadingText}</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className={CHART_STATES.empty.className}>
        <div className={CHART_STATES.empty.textClassName}>{emptyText}</div>
      </div>
    )
  }

  return (
    <div style={{ height }} className="flex flex-col">
      <div 
        className="grid gap-2 flex-1"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {data.map((item, index) => {
          const colors = colorScale(item.value)
          return (
            <div
              key={`${item.label}-${index}`}
              className={`
                relative rounded-md border-2 flex flex-col items-center justify-center
                ${colors.text} ${colors.bg}
                transition-all hover:scale-105 cursor-pointer shadow-sm
              `}
              title={`${item.label}: ${valueFormatter(item.value)}${item.count !== undefined ? ` (${item.count} items)` : ''}`}
            >
              <div className="text-xs font-medium text-center">{item.label}</div>
              <div className="text-xs font-bold">{valueFormatter(item.value)}</div>
              {item.count !== undefined && item.count > 0 && (
                <div className="text-xs opacity-70">{item.count}</div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Low</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-muted rounded-sm border" />
          <div className="w-3 h-3 [background-color:var(--chart-5)] rounded-sm border" />
          <div className="w-3 h-3 [background-color:var(--chart-4)] rounded-sm border" />
          <div className="w-3 h-3 [background-color:var(--chart-3)] rounded-sm border" />
          <div className="w-3 h-3 [background-color:var(--chart-1)] rounded-sm border" />
        </div>
        <span>High</span>
      </div>
    </div>
  )
}
