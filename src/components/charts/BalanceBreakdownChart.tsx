import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts'

interface BalanceItem {
  name: string
  balance: number
  color?: string
}

interface BalanceBreakdownChartProps {
  data: BalanceItem[]
  isLoading?: boolean
  height?: number
  valueFormatter?: (value: number) => string
  loadingText?: string
  emptyText?: string
  showAxis?: boolean
  barSize?: number
}

const COLORS = [
  'hsl(173, 58%, 39%)',
  'hsl(76, 100%, 40%)',
  'hsl(197, 37%, 24%)',
  'hsl(43, 74%, 49%)',
  'hsl(27, 87%, 67%)',
  'hsl(12, 76%, 61%)',
  'hsl(340, 75%, 55%)',
  'hsl(262, 52%, 47%)',
]

export function BalanceBreakdownChart({
  data,
  isLoading = false,
  height = 200,
  valueFormatter = (value: number) => new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    compactDisplay: 'short',
    signDisplay: 'exceptZero'
  }).format(value),
  loadingText = 'Cargando datos...',
  emptyText = 'No hay datos disponibles',
  showAxis = false,
  barSize = 24
}: BalanceBreakdownChartProps) {
  
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

  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length],
    isNegative: item.balance < 0
  }))

  const getBarColor = (balance: number, defaultColor: string) => {
    if (balance >= 0) return 'hsl(80, 90%, 40%)'
    return 'hsl(0, 75%, 60%)'
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical"
          margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            hide={!showAxis}
            tickFormatter={valueFormatter}
            tick={{ fontSize: 10 }}
            className="text-muted-foreground fill-muted-foreground"
          />
          <YAxis 
            type="category" 
            dataKey="name"
            width={80}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground fill-muted-foreground"
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload
                return (
                  <div className="rounded-lg p-3 shadow-lg border border-border bg-popover text-popover-foreground">
                    <p className="font-medium text-sm mb-1">{item.name}</p>
                    <p className={`text-sm font-semibold ${item.balance >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {new Intl.NumberFormat('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                        signDisplay: 'exceptZero'
                      }).format(item.balance)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar 
            dataKey="balance" 
            radius={[0, 4, 4, 0]}
            barSize={barSize}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.balance, entry.color)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
