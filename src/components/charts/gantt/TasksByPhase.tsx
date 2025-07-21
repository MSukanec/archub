import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TasksByPhaseProps {
  data: any[]
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
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
    <Card className="h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Tareas por Fase</CardTitle>
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
              fill="hsl(var(--chart-1))"
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
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover-bg))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => value}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}