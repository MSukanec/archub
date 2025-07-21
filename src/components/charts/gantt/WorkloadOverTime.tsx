import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

interface WorkloadOverTimeProps {
  data: any[]
}

export default function WorkloadOverTime({ data }: WorkloadOverTimeProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Encontrar rango de fechas
    const dates = data
      .filter(task => task.start_date && task.end_date)
      .flatMap(task => [new Date(task.start_date), new Date(task.end_date)])
      .sort((a, b) => a.getTime() - b.getTime())

    if (dates.length === 0) return []

    const startDate = dates[0]
    const endDate = dates[dates.length - 1]

    const workloadByDate: Record<string, number> = {}

    // Calcular carga de trabajo por cada día
    eachDayOfInterval({ start: startDate, end: endDate }).forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd')
      workloadByDate[dateKey] = 0

      data.forEach(task => {
        if (!task.start_date || !task.end_date) return

        const taskStart = new Date(task.start_date)
        const taskEnd = new Date(task.end_date)

        if (date >= taskStart && date <= taskEnd) {
          workloadByDate[dateKey]++
        }
      })
    })

    // Convertir a formato de gráfico (semanal para reducir puntos)
    const weeklyData: Record<string, number> = {}
    Object.entries(workloadByDate).forEach(([date, count], index) => {
      const weekKey = Math.floor(index / 7)
      const weekLabel = format(new Date(date), 'dd MMM', { locale: es })
      
      if (index % 7 === 0) {
        weeklyData[weekLabel] = count
      }
    })

    return Object.entries(weeklyData).map(([week, count]) => ({
      week,
      activeTasks: count
    }))
  }, [data])

  return (
    <Card className="h-80">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Carga de Trabajo Diaria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="week" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: any) => [value, 'Tareas Activas']}
              labelFormatter={(label) => `Semana: ${label}`}
            />
            <Bar 
              dataKey="activeTasks" 
              fill="hsl(var(--accent))" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}