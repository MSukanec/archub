import { CHART_COLORS, CHART_STATES, getChartColor } from '../theme'

export interface SegmentedBarDataPoint {
  label: string
  value: number
  icon?: React.ReactNode
  color?: string
}

export interface SegmentedBarChartProps {
  data: SegmentedBarDataPoint[]
  height?: number
  valueFormatter?: (value: number) => string
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  showPercentages?: boolean
  showValues?: boolean
  className?: string
}

export function SegmentedBarChart({
  data,
  height = 180,
  valueFormatter = (v) => v.toLocaleString(),
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  showPercentages = true,
  showValues = true,
  className = '',
}: SegmentedBarChartProps) {
  if (isLoading) {
    return (
      <div style={{ height }} className={CHART_STATES.loading.className}>
        <div className={CHART_STATES.loading.textClassName}>{loadingText}</div>
      </div>
    )
  }

  const validData = data.filter(item => item.value > 0)
  const total = validData.reduce((sum, item) => sum + item.value, 0)

  if (validData.length === 0 || total === 0) {
    return (
      <div style={{ height }} className={CHART_STATES.empty.className}>
        <div className={CHART_STATES.empty.textClassName}>{emptyText}</div>
      </div>
    )
  }

  let cumulativePercentage = 0
  const segments = validData.map((item, index) => {
    const percentage = (item.value / total) * 100
    const color = item.color || getChartColor(index)
    const startPos = cumulativePercentage
    cumulativePercentage += percentage

    return {
      ...item,
      percentage,
      color,
      startPos,
      endPos: cumulativePercentage,
    }
  })

  return (
    <div className={`flex flex-col ${className}`} style={{ height }}>
      <div className="relative h-16">
        {showValues && segments.map((segment, index) => (
          <div
            key={`values-${segment.label}-${index}`}
            className="absolute flex flex-col items-start"
            style={{
              left: `${segment.startPos}%`,
              transform: 'translateX(8px)',
              top: 0,
            }}
          >
            <div className="text-lg font-bold text-foreground">
              {valueFormatter(segment.value)}
            </div>
            {showPercentages && (
              <div className="text-sm text-muted-foreground">
                {segment.percentage.toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1" />

      <div className="relative h-8 mb-1">
        {segments.map((segment, index) => (
          <div
            key={`labels-${segment.label}-${index}`}
            className="absolute flex flex-col items-start"
            style={{
              left: `${segment.startPos}%`,
              transform: 'translateX(8px)',
              top: 0,
            }}
          >
            {segment.icon && (
              <div className="mb-1" style={{ color: segment.color }}>
                {segment.icon}
              </div>
            )}
            <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {segment.label}
            </div>
          </div>
        ))}
      </div>

      {segments.map((segment, index) => (
        <div
          key={`line-${segment.label}-${index}`}
          className="absolute w-px"
          style={{
            left: `${segment.startPos}%`,
            top: 0,
            bottom: 0,
            backgroundColor: segment.color,
            zIndex: 10,
          }}
        />
      ))}

      <div className="relative">
        <div className="flex w-full h-6 rounded-sm overflow-hidden">
          {segments.map((segment, index) => (
            <div
              key={`bar-${segment.label}-${index}`}
              className="h-full transition-all"
              style={{
                width: `${segment.percentage}%`,
                backgroundColor: segment.color,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
