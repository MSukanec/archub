import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { CHART_COLORS, CHART_AXIS, CHART_TOOLTIP, CHART_STATES, CHART_DIMENSIONS, CHART_SHAPES, formatCompact, getValueColor } from '../theme'

export interface ComposedDataPoint {
  label: string
  barValue: number
  lineValue: number
}

export interface ComposedBarLineChartProps {
  data: ComposedDataPoint[]
  height?: number
  barColor?: string
  lineColor?: string
  valueFormatter?: (value: number) => string
  labelFormatter?: (label: string) => string
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  barKey?: string
  lineKey?: string
  barName?: string
  lineName?: string
  colorBarByValue?: boolean
}

export function ComposedBarLineChart({
  data,
  height = CHART_DIMENSIONS.height.lg,
  barColor = CHART_COLORS.palette[0],
  lineColor = CHART_COLORS.accent,
  valueFormatter = formatCompact,
  labelFormatter = (l) => l,
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  barName = 'Daily',
  lineName = 'Cumulative',
  colorBarByValue = true,
}: ComposedBarLineChartProps) {
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
        <ComposedChart data={data} margin={CHART_DIMENSIONS.margin.standard}>
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
                    <p className="font-medium text-sm mb-2">{labelFormatter(label)}</p>
                    {payload.map((entry: any, i: number) => (
                      <p key={i} className="text-sm" style={{ color: entry.color || entry.stroke }}>
                        {entry.name}: {valueFormatter(entry.value)}
                      </p>
                    ))}
                  </div>
                )
              }
              return null
            }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar
            dataKey="barValue"
            name={barName}
            radius={CHART_SHAPES.bar.radius}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colorBarByValue ? getValueColor(entry.barValue) : barColor}
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="lineValue"
            name={lineName}
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
