import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface ProgressMetricsData {
  period: string
  tasksCompleted: number
  attendanceRate: number
  budgetUtilization: number
}

interface ProgressMetricsChartProps {
  data: ProgressMetricsData[]
  isLoading: boolean
}

export function ProgressMetricsChart({ data, isLoading }: ProgressMetricsChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando métricas de progreso...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No hay datos de métricas disponibles</div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'tasksCompleted' ? ' tareas' : '%'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-text)" />
        <XAxis 
          dataKey="period" 
          tick={{ fill: 'var(--chart-grid-text)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--chart-grid-text)' }}
        />
        <YAxis 
          tick={{ fill: 'var(--chart-grid-text)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--chart-grid-text)' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line 
          type="monotone" 
          dataKey="tasksCompleted" 
          stroke="var(--chart-positive)" 
          strokeWidth={3}
          name="Tareas Completadas"
          dot={{ fill: "var(--chart-positive)", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "var(--chart-positive)" }}
        />
        <Line 
          type="monotone" 
          dataKey="attendanceRate" 
          stroke="var(--chart-2)" 
          strokeWidth={3}
          name="Asistencia (%)"
          dot={{ fill: "var(--chart-2)", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "var(--chart-2)" }}
        />
        <Line 
          type="monotone" 
          dataKey="budgetUtilization" 
          stroke="var(--chart-3)" 
          strokeWidth={3}
          name="Uso Presupuesto (%)"
          dot={{ fill: "var(--chart-3)", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "var(--chart-3)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}