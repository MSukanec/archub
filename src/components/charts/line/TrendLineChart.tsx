import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { CHART_COLORS, CHART_AXIS, CHART_TOOLTIP, CHART_STATES, CHART_DIMENSIONS, formatCompact } from '../theme'

export interface TrendDataPoint {
  label: string
  value: number
}

export interface TrendLineChartProps {
  data: TrendDataPoint[]
  color?: string
  height?: number
  valueFormatter?: (value: number) => string
  labelFormatter?: (label: string) => string
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  showGradient?: boolean
  onClick?: (label: string, value: number) => void
  clickable?: boolean
}

export function TrendLineChart({
  data,
  color = CHART_COLORS.palette[0],
  height = CHART_DIMENSIONS.height.lg,
  valueFormatter = formatCompact,
  labelFormatter = (l) => l,
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  showGradient = true,
  onClick,
  clickable = false,
}: TrendLineChartProps) {
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

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_DIMENSIONS.margin.standard}>
          {showGradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}
          <CartesianGrid {...CHART_AXIS.grid} />
          <XAxis
            dataKey="label"
            tickFormatter={labelFormatter}
            {...CHART_AXIS.xAxis}
          />
          <YAxis
            tickFormatter={valueFormatter}
            {...CHART_AXIS.yAxis}
            width={60}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className={CHART_TOOLTIP.className}>
                    <p className="font-medium text-sm mb-1">{labelFormatter(label)}</p>
                    <p className="text-sm opacity-80">{valueFormatter(payload[0].value as number)}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={showGradient ? `url(#${gradientId})` : color}
            style={clickable ? { cursor: 'pointer' } : undefined}
            onClick={(d: any) => {
              if (clickable && onClick && d?.payload) {
                onClick(d.payload.label, d.payload.value)
              }
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
