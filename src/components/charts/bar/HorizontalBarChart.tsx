import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts'
import { CHART_COLORS, CHART_TOOLTIP, CHART_STATES, CHART_DIMENSIONS, CHART_SHAPES, formatCompact, getValueColor } from '../theme'

export interface HorizontalBarDataPoint {
  label: string
  value: number
  color?: string
}

export interface HorizontalBarChartProps {
  data: HorizontalBarDataPoint[]
  height?: number
  valueFormatter?: (value: number) => string
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  barSize?: number
  showZeroLine?: boolean
  colorByValue?: boolean
}

export function HorizontalBarChart({
  data,
  height = CHART_DIMENSIONS.height.md,
  valueFormatter = formatCompact,
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  barSize = CHART_SHAPES.bar.barSize,
  showZeroLine = true,
  colorByValue = true,
}: HorizontalBarChartProps) {
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
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
        >
          <XAxis
            type="number"
            hide
            tickFormatter={valueFormatter}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={80}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground fill-muted-foreground"
            axisLine={false}
            tickLine={false}
          />
          {showZeroLine && (
            <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload
                const isPositive = item.value >= 0
                return (
                  <div className={CHART_TOOLTIP.className}>
                    <p className="font-medium text-sm mb-1">{item.label}</p>
                    <p className={`text-sm font-semibold ${isPositive ? 'text-chart-positive' : 'text-chart-negative'}`}>
                      {valueFormatter(item.value)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            barSize={barSize}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || (colorByValue ? getValueColor(entry.value) : CHART_COLORS.palette[0])}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
