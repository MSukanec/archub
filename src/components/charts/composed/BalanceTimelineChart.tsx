import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CHART_AXIS, CHART_STATES, CHART_DIMENSIONS, CHART_SHAPES, formatCompact } from '../theme'
export interface BalanceTimelineDataPoint {
  label: string
  displayLabel: string
  dailyBalance: number
  cumulativeBalance: number
}
export interface BalanceTimelineChartProps {
  data: BalanceTimelineDataPoint[]
  height?: number
  valueFormatter?: (value: number) => string
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  barPositiveColor?: string
  barNegativeColor?: string
  lineColor?: string
  showInterval?: number
}
export function BalanceTimelineChart({
  data,
  height = CHART_DIMENSIONS.height.lg,
  valueFormatter = formatCompact,
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  barPositiveColor = 'hsl(0, 0%, 20%)',
  barNegativeColor = 'hsl(0, 0%, 80%)',
  lineColor = 'hsl(var(--accent-hsl))',
  showInterval,
}: BalanceTimelineChartProps) {
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
  const interval = showInterval ?? (data.length > 30 ? Math.floor(data.length / 12) : 'preserveStartEnd')
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={CHART_DIMENSIONS.margin.standard}>
          <CartesianGrid {...CHART_AXIS.grid} vertical={false} />
          <XAxis
            dataKey="displayLabel"
            {...CHART_AXIS.xAxis}
            interval={interval}
          />
          <YAxis
            tickFormatter={valueFormatter}
            {...CHART_AXIS.yAxis}
            axisLine={false}
            width={60}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload
                const isPositive = d.cumulativeBalance >= 0
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium text-foreground mb-2">{d.label}</p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Balance:{''}
                        <span className={isPositive ? 'text-chart-positive': 'text-chart-negative'}>
                          {valueFormatter(d.cumulativeBalance)}
                        </span>
                      </p>
                      {d.dailyBalance !== 0 && (
                        <p className="text-xs text-muted-foreground">
                          Daily:{''}
                          <span className={d.dailyBalance >= 0 ? 'text-chart-positive': 'text-chart-negative'}>
                            {valueFormatter(d.dailyBalance)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )
              }
              return null
            }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)'}}
          />
          <Bar dataKey="dailyBalance" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.dailyBalance >= 0 ? barPositiveColor : barNegativeColor}
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="cumulativeBalance"
            stroke={lineColor}
            strokeWidth={CHART_SHAPES.line.strokeWidth}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
