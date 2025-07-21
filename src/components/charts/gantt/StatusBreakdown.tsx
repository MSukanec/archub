import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatusBreakdownProps {
  data: any[]
}

const STATUS_COLORS = {
  completed: 'var(--chart-1)',
  inProgress: 'var(--chart-4)', 
  notStarted: 'hsl(var(--chart-grid-text))'
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
    <Card className="h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Estado de Tareas</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={90}
              fill="var(--chart-1)"
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
              contentStyle={{ 
                backgroundColor: 'var(--popover-bg)', 
                border: '1px solid hsl(var(--card-border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
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