import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface MiniTrendChartProps {
  data: { value: number }[]
  color: string
  isLoading?: boolean
}

export function MiniTrendChart({ data, color, isLoading }: MiniTrendChartProps) {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="h-12 w-full bg-muted/20 rounded animate-pulse" />
    )
  }

  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}