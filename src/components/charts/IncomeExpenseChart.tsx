import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from 'recharts'

interface IncomeExpenseData {
  period: string
  income: number
  expense: number
  balance?: number
}

interface IncomeExpenseChartProps {
  data: IncomeExpenseData[]
  isLoading?: boolean
  height?: number
  valueFormatter?: (value: number) => string
  loadingText?: string
  emptyText?: string
  onBarClick?: (period: string, type: 'income' | 'expense') => void
  clickable?: boolean
  showLegend?: boolean
  showBalance?: boolean
  incomeLabel?: string
  expenseLabel?: string
  balanceLabel?: string
  incomeColor?: string
  expenseColor?: string
  balanceColor?: string
}

export function IncomeExpenseChart({
  data,
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
  showBalance = false,
  incomeLabel = 'Ingresos',
  expenseLabel = 'Egresos',
  balanceLabel = 'Balance',
  incomeColor = 'hsl(var(--chart-positive))',
  expenseColor = 'hsl(var(--chart-negative))',
  balanceColor = 'hsl(var(--chart-1))'
}: IncomeExpenseChartProps) {
  
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

  const sortedData = [...data].sort((a, b) => a.period.localeCompare(b.period))

  const formatPeriod = (period: string) => {
    if (!period) return ''
    
    let date: Date
    
    if (period.includes('T')) {
      date = new Date(period)
    } else {
      const parts = period.split('-')
      if (parts.length >= 2) {
        const [year, m] = parts
        const paddedMonth = m.padStart(2, '0')
        date = new Date(`${year}-${paddedMonth}-01T00:00:00`)
      } else {
        return period
      }
    }
    
    if (isNaN(date.getTime())) return period
    
    const monthName = date.toLocaleDateString('es-AR', { month: 'short' })
    const year = date.getFullYear()
    return `${monthName} ${year}`
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: showLegend ? 30 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis 
            dataKey="period" 
            tickFormatter={formatPeriod}
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
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.5} />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const periodLabel = formatPeriod(label)
                const incomeValue = payload.find(p => p.dataKey === 'income')?.value as number || 0
                const expenseValue = payload.find(p => p.dataKey === 'expense')?.value as number || 0
                const balance = incomeValue - expenseValue
                
                return (
                  <div className="rounded-lg p-3 shadow-lg border border-border bg-popover text-popover-foreground">
                    <p className="font-medium text-sm mb-2 capitalize">{periodLabel}</p>
                    <p className="text-sm" style={{ color: incomeColor }}>
                      {incomeLabel}: {new Intl.NumberFormat('es-AR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(incomeValue)}
                    </p>
                    <p className="text-sm" style={{ color: expenseColor }}>
                      {expenseLabel}: {new Intl.NumberFormat('es-AR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(expenseValue)}
                    </p>
                    <p className="text-sm font-medium mt-1 pt-1 border-t border-border" style={{ color: balance >= 0 ? incomeColor : expenseColor }}>
                      {balanceLabel}: {balance >= 0 ? '+' : ''}{new Intl.NumberFormat('es-AR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(balance)}
                    </p>
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
          <Bar 
            dataKey="income" 
            name={incomeLabel}
            fill={incomeColor}
            radius={[4, 4, 0, 0]}
            style={clickable ? { cursor: 'pointer' } : undefined}
            onClick={(data: any) => {
              if (clickable && onBarClick && data?.payload) {
                onBarClick(data.payload.period, 'income')
              }
            }}
          />
          <Bar 
            dataKey="expense" 
            name={expenseLabel}
            fill={expenseColor}
            radius={[4, 4, 0, 0]}
            style={clickable ? { cursor: 'pointer' } : undefined}
            onClick={(data: any) => {
              if (clickable && onBarClick && data?.payload) {
                onBarClick(data.payload.period, 'expense')
              }
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
