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

  // Check if all values are zero
  const hasData = data.some(item => item.value !== 0)

  if (!hasData) {
    return (
      <div className="h-12 w-full flex items-center justify-center">
        <div className="text-xs text-muted-foreground">Sin datos</div>
      </div>
    )
  }

  return (
    <div className="h-12 w-full" style={{ minHeight: '48px', minWidth: '100px' }}>
      <ResponsiveContainer width="100%" height={48}>
        <LineChart 
          data={data} 
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}