import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface MiniTrendChartProps {
  data: { value: number }[]
  color: string
  isLoading?: boolean
}

export function MiniTrendChart({ data, color, isLoading }: MiniTrendChartProps) {
  if (isLoading || !data || data.length === 0) {
    return (
    )
  }

  // Check if all values are zero
  const hasData = data.some(item => item.value !== 0)

  if (!hasData) {
    return (
      </div>
    )
  }

  return (
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