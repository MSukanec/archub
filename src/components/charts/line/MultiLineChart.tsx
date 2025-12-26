import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { CHART_COLORS, CHART_AXIS, CHART_TOOLTIP, CHART_STATES, CHART_DIMENSIONS, CHART_SHAPES, formatCompact, getChartColor } from '../theme'
export interface MultiLineDataPoint {
  label: string
  [key: string]: string | number
}
export interface LineSeriesConfig {
  key: string
  name: string
  color?: string
}
export interface MultiLineChartProps {
  data: MultiLineDataPoint[]
  series: LineSeriesConfig[]
  height?: number
  valueFormatter?: (value: number) => string
  labelFormatter?: (label: string) => string
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  showLegend?: boolean
  showDots?: boolean
}
export function MultiLineChart({
  data,
  series,
  height = CHART_DIMENSIONS.height.lg,
  valueFormatter = formatCompact,
  labelFormatter = (l) => l,
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  showLegend = true,
  showDots = true,
}: MultiLineChartProps) {
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
        <LineChart 
          data={data} 
          margin={showLegend ? CHART_DIMENSIONS.margin.withLegend : CHART_DIMENSIONS.margin.standard}
        >
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
                      <p key={i} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {valueFormatter(entry.value)}
                      </p>
                    ))}
                  </div>
                )
              }
              return null
            }}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={25}
              wrapperStyle={{ fontSize: '12px', paddingTop: '0px'}}
            />
          )}
          {series.map((s, index) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color || getChartColor(index)}
              strokeWidth={CHART_SHAPES.line.strokeWidth}
              dot={showDots ? { fill: s.color || getChartColor(index), ...CHART_SHAPES.line.dot } : false}
              activeDot={showDots ? { ...CHART_SHAPES.line.activeDot } : false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
