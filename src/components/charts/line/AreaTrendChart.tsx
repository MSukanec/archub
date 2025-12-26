import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ComposedChart, Bar, Line, Legend, ReferenceLine } from 'recharts'

interface MonthlyTrendData {
  month: string
  value: number
  label?: string
}

interface MultiSeriesData {
  month: string
  income?: number
  expense?: number
  balance?: number
  [key: string]: string | number | undefined
}

interface SeriesConfig {
  key: string
  label: string
  color: string
  type: 'area' | 'bar' | 'line'
  stackId?: string
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[]
  isLoading?: boolean
  color?: string
  height?: number
  valueFormatter?: (value: number) => string
  loadingText?: string
  emptyText?: string
  onBarClick?: (month: string, value: number) => void
  clickable?: boolean
}

interface MultiSeriesChartProps {
  data: MultiSeriesData[]
  series: SeriesConfig[]
  isLoading?: boolean
  height?: number
  valueFormatter?: (value: number) => string
  loadingText?: string
  emptyText?: string
  onBarClick?: (month: string) => void
  clickable?: boolean
  showLegend?: boolean
  showZeroLine?: boolean
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
  emptyText = 'No hay datos disponibles',
  onBarClick,
  clickable = false
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

  const sortedData = [...data].sort((a, b) => (a.month || '').localeCompare(b.month || ''))

  const formatMonth = (month: string) => {
    if (!month) return ''
    
    let date: Date
    
    if (month.includes('T')) {
      date = new Date(month)
    } else {
      const parts = month.split('-')
      if (parts.length >= 2) {
        const [year, m] = parts
        const paddedMonth = m.padStart(2, '0')
        date = new Date(`${year}-${paddedMonth}-01T00:00:00`)
      } else {
        return month
      }
    }
    
    if (isNaN(date.getTime())) return month
    
    const monthName = date.toLocaleDateString('es-AR', { month: 'short' })
    const year = date.getFullYear()
    return `${monthName} ${year}`
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonth}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground fill-muted-foreground"
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground fill-muted-foreground"
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
                  <div className="rounded-lg p-3 shadow-lg border border-border bg-popover text-popover-foreground">
                    <p className="font-medium text-sm mb-1 capitalize">{monthLabel}</p>
                    <p className="text-sm opacity-80">
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
            style={clickable ? { cursor: 'pointer' } : undefined}
            onClick={(data: any) => {
              if (clickable && onBarClick && data?.payload) {
                onBarClick(data.payload.month, data.payload.value)
              }
            }}
            activeDot={clickable ? { 
              r: 6, 
              stroke: color, 
              strokeWidth: 2,
              fill: 'var(--background)',
              cursor: 'pointer',
              onClick: (e: any, payload: any) => {
                if (onBarClick && payload?.payload) {
                  onBarClick(payload.payload.month, payload.payload.value)
                }
              }
            } : undefined}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MultiSeriesTrendChart({
  data,
  series,
  isLoading = false,
  height = 250,
  valueFormatter = (value: number) => new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value),
  loadingText = 'Cargando datos...',
  emptyText = 'No hay datos disponibles',
  onBarClick,
  clickable = false,
  showLegend = true,
  showZeroLine = false
}: MultiSeriesChartProps) {
  
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

  const sortedData = [...data].sort((a, b) => (a.month || '').localeCompare(b.month || ''))

  const formatMonth = (month: string) => {
    if (!month) return ''
    
    let date: Date
    
    if (month.includes('T')) {
      date = new Date(month)
    } else {
      const parts = month.split('-')
      if (parts.length >= 2) {
        const [year, m] = parts
        const paddedMonth = m.padStart(2, '0')
        date = new Date(`${year}-${paddedMonth}-01T00:00:00`)
      } else {
        return month
      }
    }
    
    if (isNaN(date.getTime())) return month
    
    const monthName = date.toLocaleDateString('es-AR', { month: 'short' })
    const year = date.getFullYear()
    return `${monthName} ${year}`
  }

  const renderSeries = (config: SeriesConfig, index: number) => {
    const commonProps = {
      key: config.key,
      dataKey: config.key,
      name: config.label,
      style: clickable ? { cursor: 'pointer' } : undefined,
    }

    switch (config.type) {
      case 'bar':
        return (
          <Bar
            {...commonProps}
            fill={config.color}
            stackId={config.stackId}
            radius={[4, 4, 0, 0]}
            onClick={(data: any) => {
              if (clickable && onBarClick && data?.payload) {
                onBarClick(data.payload.month)
              }
            }}
          />
        )
      case 'line':
        return (
          <Line
            {...commonProps}
            type="monotone"
            stroke={config.color}
            strokeWidth={2}
            dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
            activeDot={clickable ? { r: 6, cursor: 'pointer' } : undefined}
          />
        )
      case 'area':
      default:
        return (
          <Area
            {...commonProps}
            type="monotone"
            stroke={config.color}
            strokeWidth={2}
            fill={config.color}
            fillOpacity={0.2}
          />
        )
    }
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: showLegend ? 30 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonth}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground fill-muted-foreground"
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground fill-muted-foreground"
            tickFormatter={valueFormatter}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          {showZeroLine && (
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          )}
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const monthLabel = formatMonth(label)
                return (
                  <div className="rounded-lg p-3 shadow-lg border border-border bg-popover text-popover-foreground">
                    <p className="font-medium text-sm mb-2 capitalize">{monthLabel}</p>
                    {payload.map((entry: any, i: number) => (
                      <p key={i} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {new Intl.NumberFormat('es-AR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(entry.value as number)}
                      </p>
                    ))}
                  </div>
                )
              }
              return null
            }}
          />
          {showLegend && (
            <Legend 
              verticalAlign="bottom"
              height={25}
              wrapperStyle={{ fontSize: '12px', paddingTop: '0px' }}
            />
          )}
          {series.map((config, index) => renderSeries(config, index))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
