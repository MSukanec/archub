import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { AttendanceWeeklyData } from '@/hooks/use-construction-dashboard'

interface AttendanceChartProps {
  data: AttendanceWeeklyData[]
  isLoading: boolean
}

export function AttendanceChart({ data, isLoading }: AttendanceChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando datos de asistencia...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No hay datos de asistencia disponibles</div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">Semana del {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'rate' ? '%' : ' asistencias'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="expectedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-text)" />
        <XAxis 
          dataKey="week" 
          tick={{ fill: 'var(--chart-grid-text)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--chart-grid-text)' }}
        />
        <YAxis 
          tick={{ fill: 'var(--chart-grid-text)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--chart-grid-text)' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Area
          type="monotone"
          dataKey="expected"
          stackId="1"
          stroke="var(--chart-2)"
          fill="url(#expectedGradient)"
          name="Esperado"
        />
        <Area
          type="monotone"
          dataKey="attendance"
          stackId="2"
          stroke="var(--chart-1)"
          fill="url(#attendanceGradient)"
          name="Real"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}