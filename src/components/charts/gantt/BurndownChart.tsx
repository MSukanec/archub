import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, addDays, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface BurndownChartProps {
  data: any[]
}

export default function BurndownChart({ data }: BurndownChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Encontrar rango de fechas
    const dates = data
      .filter(task => task.start_date)
      .map(task => new Date(task.start_date))
      .sort((a, b) => a.getTime() - b.getTime())

    if (dates.length === 0) return []

    const startDate = dates[0]
    const endDate = data
      .filter(task => task.end_date)
      .map(task => new Date(task.end_date))
      .sort((a, b) => b.getTime() - a.getTime())[0] || addDays(startDate, 30)

    const totalTasks = data.length
    const burndownData = []

    // Crear puntos de datos día por día
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const completedTasks = data.filter(task => {
        const taskEnd = task.end_date ? new Date(task.end_date) : null
        return taskEnd && taskEnd <= currentDate && (task.progress_percent || 0) >= 100
      }).length

      const remainingTasks = totalTasks - completedTasks

      burndownData.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        displayDate: format(currentDate, 'dd MMM', { locale: es }),
        remaining: remainingTasks,
        completed: completedTasks
      })

      currentDate.setDate(currentDate.getDate() + 7) // Una semana por punto
    }

    return burndownData
  }, [data])

  return (
    <Card className="h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Burndown Chart</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid-text))" strokeOpacity={0.5} />
            <XAxis 
              dataKey="displayDate" 
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
              formatter={(value: any, name: string) => [
                value, 
                name === 'remaining' ? 'Tareas Pendientes' : 'Tareas Completadas'
              ]}
              labelFormatter={(label) => `Fecha: ${label}`}
              contentStyle={{ 
                backgroundColor: 'var(--popover-bg)', 
                border: '1px solid hsl(var(--card-border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="remaining" 
              stroke="var(--chart-2)" 
              strokeWidth={3}
              dot={{ fill: 'var(--chart-2)', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="var(--chart-1)" 
              strokeWidth={3}
              dot={{ fill: 'var(--chart-1)', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}