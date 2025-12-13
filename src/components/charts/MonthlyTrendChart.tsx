import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface MonthlyTrendData {
  month: string
  value: number
  label?: string
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[]
  isLoading?: boolean
  color?: string
  height?: number
  valueFormatter?: (value: number) => string
  loadingText?: string
  emptyText?: string
}

export function MonthlyTrendChart({
  data,
  isLoading = false,
  color = 'var(--chart-1)',
  height = 250,
  valueFormatter = (value: number) => new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value),
  loadingText = 'Cargando datos...',
  emptyText = 'No hay datos disponibles'
}: MonthlyTrendChartProps) {
  
  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="text-sm text-muted-foreground">{loadingText}</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="text-sm text-muted-foreground">{emptyText}</div>
      </div>
    )
  }

  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month))

  const formatMonth = (month: string) => {
    const date = new Date(month + '-01')
    return date.toLocaleDateString('es-AR', { month: 'short' })
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonth}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            tickFormatter={valueFormatter}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const monthLabel = formatMonth(label)
                return (
                  <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-sm mb-1">{monthLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat('es-AR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(payload[0].value as number)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
