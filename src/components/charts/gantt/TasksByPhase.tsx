import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TasksByPhaseProps {
  data: any[]
}

const COLORS = [
  'hsl(var(--accent))',
  'hsl(var(--primary))', 
  'hsl(var(--secondary))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#0088fe',
]

export default function TasksByPhase({ data }: TasksByPhaseProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const tasksByPhase: Record<string, number> = {}

    data.forEach(task => {
      const phase = task.phase_name || 'Sin Fase'
      tasksByPhase[phase] = (tasksByPhase[phase] || 0) + 1
    })

    return Object.entries(tasksByPhase).map(([phase, count]) => ({
      name: phase,
      value: count,
      percentage: ((count / data.length) * 100).toFixed(1)
    }))
  }, [data])

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    if (percent < 0.05) return null // Solo mostrar etiquetas para >5%

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
        <CardTitle className="text-sm font-medium">Tareas por Fase</CardTitle>
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
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any, name: string) => [value, 'Tareas']}
              labelFormatter={(label) => `Fase: ${label}`}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => value}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}