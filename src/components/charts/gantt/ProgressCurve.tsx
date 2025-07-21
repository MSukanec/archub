import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ProgressCurveProps {
  data: any[]
}

export default function ProgressCurve({ data }: ProgressCurveProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Crear una curva de progreso acumulativo por fecha
    const progressByDate: Record<string, { completed: number, total: number }> = {}

    data.forEach(task => {
      if (!task.start_date || !task.progress_percent) return

      const startDate = new Date(task.start_date).toISOString().split('T')[0]
      
      if (!progressByDate[startDate]) {
        progressByDate[startDate] = { completed: 0, total: 0 }
      }
      
      progressByDate[startDate].completed += task.progress_percent || 0
      progressByDate[startDate].total += 100
    })

    return Object.entries(progressByDate)
      .map(([date, stats]) => ({
        date,
        progressPercent: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
        displayDate: format(new Date(date), 'dd MMM', { locale: es })
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data])

  return (
    <Card className="h-80">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Curva de Avance Físico</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip 
              formatter={(value: any) => [`${value.toFixed(1)}%`, 'Progreso']}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="progressPercent" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}