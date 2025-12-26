import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { CHART_COLORS, CHART_STATES, CHART_SHAPES } from '../theme'

export interface SparklineDataPoint {
  value: number
}

export interface SparklineChartProps {
  data: SparklineDataPoint[] | number[]
  color?: string
  height?: number
  strokeWidth?: number
  isLoading?: boolean
  emptyText?: string
}

export function SparklineChart({
  data,
  color = CHART_COLORS.accent,
  height = 48,
  strokeWidth = CHART_SHAPES.line.strokeWidth,
  isLoading = false,
  emptyText = 'No data',
}: SparklineChartProps) {
  if (isLoading) {
    return (
      <div style={{ height }} className="w-full bg-muted/20 rounded animate-pulse" />
    )
  }

  const normalizedData: SparklineDataPoint[] = Array.isArray(data)
    ? data.map(item => typeof item === 'number' ? { value: item } : item)
    : []

  if (!normalizedData.length || !normalizedData.some(d => d.value !== 0)) {
    return (
      <div style={{ height }} className={CHART_STATES.empty.className}>
        <div className={CHART_STATES.empty.textClassName}>{emptyText}</div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={normalizedData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={strokeWidth}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
