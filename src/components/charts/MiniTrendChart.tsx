import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface MiniTrendData {
  value: number
}

interface MiniTrendChartProps {
  data: MiniTrendData[]
  isLoading?: boolean
  color?: string
  height?: number
  loadingText?: string
  emptyText?: string
  strokeWidth?: number
}

export function MiniTrendChart({
  data,
  isLoading = false,
  color = '#22c55e',
  height = 48,
  loadingText,
  emptyText = 'Sin datos',
  strokeWidth = 2
}: MiniTrendChartProps) {
  
  if (isLoading) {
    return (
      <div 
        style={{ height }} 
        className="w-full bg-muted/20 rounded animate-pulse"
      />
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="w-full flex items-center justify-center">
        <div className="text-xs text-muted-foreground">{loadingText || emptyText}</div>
      </div>
    )
  }

  const hasData = data.some(item => item.value !== 0)

  if (!hasData) {
    return (
      <div style={{ height }} className="w-full flex items-center justify-center">
        <div className="text-xs text-muted-foreground">{emptyText}</div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={data} 
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={strokeWidth}
            dot={false}
            activeDot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
