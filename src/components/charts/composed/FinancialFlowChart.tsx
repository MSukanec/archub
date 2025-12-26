import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CHART_AXIS, CHART_STATES, CHART_DIMENSIONS, CHART_SHAPES } from '../theme'
export interface FinancialFlowDataPoint {
  label: string
  inflow: number
  outflow: number
  net: number
}
export interface FinancialFlowChartProps {
  data: FinancialFlowDataPoint[]
  height?: number
  valueFormatter?: (value: number) => string
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  inflowLabel?: string
  outflowLabel?: string
  netLabel?: string
  inflowColor?: string
  outflowColor?: string
  netColor?: string
}
export function FinancialFlowChart({
  data,
  height = CHART_DIMENSIONS.height.lg,
  valueFormatter = (v) => v.toLocaleString(),
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  inflowLabel = 'Inflow',
  outflowLabel = 'Outflow',
  netLabel = 'Net',
  inflowColor = 'var(--positive)',
  outflowColor = 'var(--negative)',
  netColor = 'var(--neutral)',
}: FinancialFlowChartProps) {
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
        <LineChart data={data} margin={CHART_DIMENSIONS.margin.withLegend}>
          <CartesianGrid {...CHART_AXIS.grid} />
          <XAxis
            dataKey="label"
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
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                      <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {valueFormatter(entry.value)}
                      </p>
                    ))}
                  </div>
                )
              }
              return null
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px'}} />
          <Line
            type="monotone"
            dataKey="inflow"
            stroke={inflowColor}
            strokeWidth={CHART_SHAPES.line.strokeWidth}
            name={inflowLabel}
            connectNulls
            dot={{ fill: inflowColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: inflowColor, stroke: '#fff', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="outflow"
            stroke={outflowColor}
            strokeWidth={CHART_SHAPES.line.strokeWidth}
            name={outflowLabel}
            connectNulls
            dot={{ fill: outflowColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: outflowColor, stroke: '#fff', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke={netColor}
            strokeWidth={CHART_SHAPES.line.strokeWidth + 1}
            name={netLabel}
            connectNulls
            dot={{ fill: netColor, strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, fill: netColor, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
