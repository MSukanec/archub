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

const DEFAULT_COLOR_SCALE = (value: number): { bg: string; text: string; bgColor?: string } => {
  if (value === 0) return { bg: 'bg-muted', text: 'text-muted-foreground' }
  if (value < 25) return { bg: '', text: 'text-white', bgColor: '#f44747' }
  if (value < 50) return { bg: '', text: 'text-gray-900 dark:text-gray-100', bgColor: '#d4a574' }
  if (value < 75) return { bg: '', text: 'text-white', bgColor: '#1c4a6b' }
  return { bg: '', text: 'text-white', bgColor: '#84cc16' }
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
              style={colors.bgColor ? { backgroundColor: colors.bgColor } : undefined}
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
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
        <span>Low</span>
        <div className="flex gap-1 shrink-0">
          <div className="w-3 h-3 bg-muted rounded-sm border flex-shrink-0" />
          <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ backgroundColor: '#f44747' }} />
          <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ backgroundColor: '#d4a574' }} />
          <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ backgroundColor: '#1c4a6b' }} />
          <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ backgroundColor: '#84cc16' }} />
        </div>
        <span>High</span>
      </div>
    </div>
  )
}
