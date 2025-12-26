import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { CHART_COLORS, CHART_STATES, CHART_SHAPES, CHART_DIMENSIONS, CHART_TYPOGRAPHY, formatPercent } from '../theme'
export interface ProgressRingChartProps {
  value: number
  color?: string
  height?: number
  label?: string
  isLoading?: boolean
  showPercentage?: boolean
}
export function ProgressRingChart({
  value = 0,
  color = CHART_COLORS.accent,
  height = CHART_DIMENSIONS.height.md,
  label,
  isLoading = false,
  showPercentage = true,
}: ProgressRingChartProps) {
  if (isLoading) {
    return (
      <div style={{ height }} className={CHART_STATES.loading.className}>
        <div className="w-24 h-24 rounded-full bg-muted/20 animate-pulse" />
      </div>
    )
  }
  const normalizedValue = Math.max(0, Math.min(100, value))
  const data = [{ name: 'progress', value: normalizedValue, fill: color }]
  return (
    <div className="relative w-full" style={{ height }} data-testid="chart-progress-ring">
      <ResponsiveContainer>
        <RadialBarChart
          innerRadius={CHART_SHAPES.radial.innerRadius}
          outerRadius={CHART_SHAPES.radial.outerRadius}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={CHART_SHAPES.radial.cornerRadius}
            background={{ fill: CHART_COLORS.ringBackground }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span
            className="font-bold"
            style={{ fontSize: CHART_TYPOGRAPHY.centerLabel.fontSize, color }}
            data-testid="text-progress-percentage"
          >
            {formatPercent(normalizedValue, 0)}
          </span>
        )}
        {label && (
          <span
            className="text-muted-foreground"
            style={{ fontSize: CHART_TYPOGRAPHY.subLabel.fontSize }}
            data-testid="text-progress-label"
          >
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
