import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CriticalPathDistributionProps {
  data: any[]
  dependencies?: any[]
}

export default function CriticalPathDistribution({ data, dependencies = [] }: CriticalPathDistributionProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Identificar tareas críticas basadas en dependencias y duración
    const taskIds = data.map(task => task.id)
    const tasksWithDependencies = new Set<string>()
    
    dependencies.forEach(dep => {
      if (taskIds.includes(dep.predecessor_task_id)) {
        tasksWithDependencies.add(dep.predecessor_task_id)
      }
      if (taskIds.includes(dep.successor_task_id)) {
        tasksWithDependencies.add(dep.successor_task_id)
      }
    })

    let criticalTasks = 0
    let normalTasks = 0

    data.forEach(task => {
      const duration = task.duration_in_days || 0
      const hasDependencies = tasksWithDependencies.has(task.id)
      
      // Una tarea es crítica si tiene dependencias O duración > 7 días
      if (hasDependencies || duration > 7) {
        criticalTasks++
      } else {
        normalTasks++
      }
    })

    return [
      {
        category: 'Críticas',
        count: criticalTasks,
        percentage: ((criticalTasks / data.length) * 100).toFixed(1),
        fill: 'var(--chart-2)'
      },
      {
        category: 'Normales', 
        count: normalTasks,
        percentage: ((normalTasks / data.length) * 100).toFixed(1),
        fill: 'var(--chart-1)'
      }
    ]
  }, [data, dependencies])

  return (
    <Card className="h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Distribución de Tareas Críticas</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-text)" className="opacity-30" />
            <XAxis 
              dataKey="category"
              tick={{ fontSize: 11, fill: 'hsl(var(--chart-grid-text))' }}
              axisLine={{ stroke: 'hsl(var(--chart-grid-text))', opacity: 0.3 }}
              tickLine={{ stroke: 'hsl(var(--chart-grid-text))', opacity: 0.3 }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: 'hsl(var(--chart-grid-text))' }}
              axisLine={{ stroke: 'hsl(var(--chart-grid-text))', opacity: 0.3 }}
              tickLine={{ stroke: 'hsl(var(--chart-grid-text))', opacity: 0.3 }}
            />
            <Tooltip 
              formatter={(value: any, name: string, props: any) => [
                `${value} tareas (${props.payload.percentage}%)`, 
                'Cantidad'
              ]}
              labelFormatter={(label) => `Tipo: ${label}`}
              contentStyle={{ 
                backgroundColor: 'var(--popover-bg)', 
                border: '1px solid hsl(var(--card-border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Bar 
              dataKey="count" 
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Bar key={`bar-${index}`} fill={entry.fill} dataKey="count" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-muted-foreground">
          <p>* Críticas: con dependencias o duración &gt; 7 días</p>
        </div>
      </CardContent>
    </Card>
  )
}