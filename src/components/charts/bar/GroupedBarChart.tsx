import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from 'recharts'
import { CHART_COLORS, CHART_AXIS, CHART_TOOLTIP, CHART_STATES, CHART_DIMENSIONS, CHART_SHAPES, formatCompact, getChartColor } from '../theme'
export interface GroupedBarDataPoint {
  label: string
  [key: string]: string | number
}
export interface BarSeriesConfig {
  key: string
  name: string
  color?: string
}
export interface GroupedBarChartProps {
  data: GroupedBarDataPoint[]
  series: BarSeriesConfig[]
  height?: number
  valueFormatter?: (value: number) => string
  labelFormatter?: (label: string) => string
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  showLegend?: boolean
  showZeroLine?: boolean
  onClick?: (label: string, seriesKey: string) => void
  clickable?: boolean
}
export function GroupedBarChart({
  data,
  series,
  height = CHART_DIMENSIONS.height.lg,
  valueFormatter = formatCompact,
  labelFormatter = (l) => l,
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  showLegend = true,
  showZeroLine = false,
  onClick,
  clickable = false,
}: GroupedBarChartProps) {
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
          {showZeroLine && (
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.5} />
          )}
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className={CHART_TOOLTIP.className}>
                    <p className="font-medium text-sm mb-2">{labelFormatter(label)}</p>
                    {payload.map((entry: any, i: number) => (
                      <p key={i} className="text-sm" style={{ color: entry.fill }}>
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
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color || getChartColor(index)}
              radius={CHART_SHAPES.bar.radius}
              style={clickable ? { cursor: 'pointer'} : undefined}
              onClick={(d: any) => {
                if (clickable && onClick && d?.payload) {
                  onClick(d.payload.label, s.key)
                }
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
