import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatusBreakdownProps {
  data: any[]
}

const STATUS_COLORS = {
  completed: 'hsl(var(--accent))',
  inProgress: '#ffc658', 
  notStarted: '#8884d8'
}

export default function StatusBreakdown({ data }: StatusBreakdownProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    let completed = 0
    let inProgress = 0 
    let notStarted = 0

    data.forEach(task => {
      const progress = task.progress_percent || 0

      if (progress >= 100) {
        completed++
      } else if (progress > 0) {
        inProgress++
      } else {
        notStarted++
      }
    })

    const total = data.length

    return [
      {
        name: 'Completadas',
        value: completed,
        percentage: ((completed / total) * 100).toFixed(1),
        color: STATUS_COLORS.completed
      },
      {
        name: 'En Progreso',
        value: inProgress,
        percentage: ((inProgress / total) * 100).toFixed(1),
        color: STATUS_COLORS.inProgress
      },
      {
        name: 'No Iniciadas',
        value: notStarted,
        percentage: ((notStarted / total) * 100).toFixed(1),
        color: STATUS_COLORS.notStarted
      }
    ].filter(item => item.value > 0)
  }, [data])

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    if (percent < 0.05) return null

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <Card className="h-80">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Estado de Tareas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any, name: string) => [
                `${value} tareas`, 
                name
              ]}
              labelFormatter={(label) => `Estado: ${label}`}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>
                  {value} ({entry.payload.percentage}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}