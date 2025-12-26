import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { CHART_COLORS, CHART_TOOLTIP, CHART_STATES, CHART_DIMENSIONS, CHART_SHAPES, formatCompact, getChartColor, formatPercent } from '../theme'

export interface DonutDataPoint {
  label: string
  value: number
  color?: string
}

export interface DonutChartProps {
  data: DonutDataPoint[]
  height?: number
  valueFormatter?: (value: number) => string
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  showLegend?: boolean
  innerRadius?: number
  outerRadius?: number
  onClick?: (label: string, value: number) => void
  clickable?: boolean
}

export function DonutChart({
  data,
  height = CHART_DIMENSIONS.height.lg,
  valueFormatter = formatCompact,
  isLoading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  showLegend = true,
  innerRadius = CHART_SHAPES.pie.innerRadius,
  outerRadius = CHART_SHAPES.pie.outerRadius,
  onClick,
  clickable = false,
}: DonutChartProps) {
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

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || getChartColor(index),
    percentage: total > 0 ? (item.value / total) * 100 : 0,
  }))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 5, right: 5, bottom: showLegend ? 30 : 5, left: 5 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy={showLegend ? '45%' : '50%'}
            labelLine={false}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            paddingAngle={CHART_SHAPES.pie.paddingAngle}
            onClick={(d: any) => {
              if (clickable && onClick && d?.label) {
                onClick(d.label, d.value)
              }
            }}
            style={clickable ? { cursor: 'pointer' } : undefined}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={clickable ? { cursor: 'pointer' } : undefined}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload
                return (
                  <div className={CHART_TOOLTIP.className}>
                    <p className="font-medium text-sm mb-1">{item.label}</p>
                    <p className="text-sm opacity-80">
                      {valueFormatter(item.value)} ({formatPercent(item.percentage)})
                    </p>
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
              wrapperStyle={{ fontSize: '12px', paddingTop: '0px' }}
              formatter={(value, entry: any) => (
                <span className="text-xs text-muted-foreground">{entry.payload.label}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
