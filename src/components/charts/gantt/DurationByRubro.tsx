import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DurationByRubroProps {
  data: any[]
}

export default function DurationByRubro({ data }: DurationByRubroProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const durationByRubro: Record<string, { total: number, count: number }> = {}

    data.forEach(task => {
      const rubro = task.rubro_name || task.task?.rubro_name || 'Sin Rubro'
      const duration = task.duration_in_days || 0

      if (rubro === 'Sin Rubro' && duration === 0) return // Skip empty data

      if (!durationByRubro[rubro]) {
        durationByRubro[rubro] = { total: 0, count: 0 }
      }

      durationByRubro[rubro].total += duration
      durationByRubro[rubro].count += 1
    })

    const entries = Object.entries(durationByRubro).filter(([rubro, stats]) => 
      rubro !== 'Sin Rubro' && stats.count > 0
    )

    if (entries.length === 0) {
      return [{ rubro: 'Sin datos disponibles', fullRubro: 'Sin datos disponibles', averageDuration: 0, totalTasks: 0 }]
    }

    return entries
      .map(([rubro, stats]) => ({
        rubro: rubro.length > 20 ? rubro.substring(0, 20) + '...' : rubro,
        fullRubro: rubro,
        averageDuration: stats.count > 0 ? Math.round((stats.total / stats.count) * 10) / 10 : 0,
        totalTasks: stats.count
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 8) // Top 8 rubros
  }, [data])

  return (
    <Card className="h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Duración Promedio por Rubro</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="horizontal" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid-text))" opacity={0.3} />
            <XAxis 
              type="number"
              tick={{ fontSize: 11, fill: 'hsl(var(--chart-grid-text))' }}
              tickFormatter={(value) => `${value}d`}
              axisLine={{ stroke: 'hsl(var(--chart-grid-text))', opacity: 0.3 }}
              tickLine={{ stroke: 'hsl(var(--chart-grid-text))', opacity: 0.3 }}
            />
            <YAxis 
              type="category"
              dataKey="rubro"
              tick={{ fontSize: 10, fill: 'hsl(var(--chart-grid-text))' }}
              width={100}
              axisLine={{ stroke: 'hsl(var(--chart-grid-text))', opacity: 0.3 }}
              tickLine={{ stroke: 'hsl(var(--chart-grid-text))', opacity: 0.3 }}
            />
            <Tooltip 
              formatter={(value: any) => [`${value.toFixed(1)} días`, 'Duración Promedio']}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload
                return `${item?.fullRubro || label} (${item?.totalTasks || 0} tareas)`
              }}
              contentStyle={{ 
                backgroundColor: 'var(--popover-bg)', 
                border: '1px solid hsl(var(--card-border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Bar 
              dataKey="averageDuration" 
              fill="var(--chart-2)" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}