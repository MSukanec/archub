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
    <Card className="h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Curva de Avance Físico</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid-text))" opacity={0.3} />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 11, fill: 'hsl(var(--chart-grid-text))' }}
              axisLine={{ stroke: 'hsl(var(--chart-grid-text))', opacity: 0.3 }}
              tickLine={{ stroke: 'hsl(var(--chart-grid-text))', opacity: 0.3 }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: 'hsl(var(--chart-grid-text))' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              axisLine={{ stroke: 'hsl(var(--chart-grid-text))', opacity: 0.3 }}
              tickLine={{ stroke: 'hsl(var(--chart-grid-text))', opacity: 0.3 }}
            />
            <Tooltip 
              formatter={(value: any) => [`${value.toFixed(1)}%`, 'Progreso']}
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
              dataKey="progressPercent" 
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