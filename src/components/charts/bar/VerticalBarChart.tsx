import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { CHART_COLORS, CHART_AXIS, CHART_TOOLTIP, CHART_STATES, CHART_DIMENSIONS, CHART_SHAPES, formatCompact, getChartColor } from '../theme'

export interface BarDataPoint {
  label: string
  value: number
  color?: string
}

export interface VerticalBarChartProps {
  data: BarDataPoint[]
  color?: string
  height?: number
  valueFormatter?: (value: number) => string
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  showAxis?: boolean
  useColorScale?: boolean
  onClick?: (label: string, value: number) => void
  clickable?: boolean
}

export function VerticalBarChart({
  data,
  color = CHART_COLORS.palette[0],
  height = CHART_DIMENSIONS.height.lg,
  valueFormatter = formatCompact,
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  showAxis = true,
  useColorScale = false,
  onClick,
  clickable = false,
}: VerticalBarChartProps) {
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
        <BarChart data={data} margin={CHART_DIMENSIONS.margin.standard}>
          <CartesianGrid {...CHART_AXIS.grid} />
          <XAxis
            dataKey="label"
            {...CHART_AXIS.xAxis}
            hide={!showAxis}
          />
          <YAxis
            tickFormatter={valueFormatter}
            {...CHART_AXIS.yAxis}
            hide={!showAxis}
            width={60}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className={CHART_TOOLTIP.className}>
                    <p className="font-medium text-sm mb-1">{label}</p>
                    <p className="text-sm opacity-80">{valueFormatter(payload[0].value as number)}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar
            dataKey="value"
            radius={CHART_SHAPES.bar.radius}
            style={clickable ? { cursor: 'pointer' } : undefined}
            onClick={(d: any) => {
              if (clickable && onClick && d?.payload) {
                onClick(d.payload.label, d.payload.value)
              }
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || (useColorScale ? getChartColor(index) : color)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
