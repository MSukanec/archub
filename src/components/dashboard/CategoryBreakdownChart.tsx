import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface CategoryData {
  name: string
  value: number
  color?: string
}

interface CategoryBreakdownChartProps {
  data: CategoryData[]
  isLoading?: boolean
  height?: number
  valueFormatter?: (value: number) => string
  loadingText?: string
  emptyText?: string
  showLegend?: boolean
  innerRadius?: number
  outerRadius?: number
}

const COLORS = [
  'hsl(76, 100%, 40%)',
  'hsl(173, 58%, 39%)',
  'hsl(197, 37%, 24%)',
  'hsl(43, 74%, 49%)',
  'hsl(27, 87%, 67%)',
  'hsl(12, 76%, 61%)',
  'hsl(340, 75%, 55%)',
  'hsl(262, 52%, 47%)',
]

export function CategoryBreakdownChart({
  data,
  isLoading = false,
  height = 250,
  valueFormatter = (value: number) => new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value),
  loadingText = 'Cargando datos...',
  emptyText = 'No hay datos disponibles',
  showLegend = true,
  innerRadius = 60,
  outerRadius = 90
}: CategoryBreakdownChartProps) {
  
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

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length],
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
  }))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 5, right: 5, bottom: showLegend ? 30 : 5, left: 5 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy={showLegend ? "45%" : "50%"}
            labelLine={false}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload
                return (
                  <div 
                    className="rounded-lg p-3 shadow-lg border"
                    style={{
                      backgroundColor: 'var(--popover-bg)',
                      color: 'var(--popover-fg)',
                      borderColor: 'var(--border)'
                    }}
                  >
                    <p className="font-medium text-sm mb-1">{item.name}</p>
                    <p className="text-sm" style={{ color: 'var(--popover-fg)', opacity: 0.8 }}>
                      {valueFormatter(item.value)} ({item.percentage}%)
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
              formatter={(value, entry: any) => (
                <span className="text-xs text-muted-foreground">
                  {entry.payload.name}
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
