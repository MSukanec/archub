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
  variant?: 'default' | 'compact'
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
  outerRadius = 90,
  variant = 'default'
}: CategoryBreakdownChartProps) {
  const isCompact = variant === 'compact'
  const effectiveShowLegend = isCompact ? false : showLegend
  const effectiveInnerRadius = isCompact ? 50 : innerRadius
  const effectiveOuterRadius = isCompact ? 80 : outerRadius
  
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

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    
    if (percent < 0.05) return null
    
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] font-medium"
        style={{ 
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          pointerEvents: 'none'
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 5, right: 5, bottom: effectiveShowLegend ? 30 : 5, left: 5 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy={effectiveShowLegend ? "45%" : "50%"}
            labelLine={false}
            innerRadius={effectiveInnerRadius}
            outerRadius={effectiveOuterRadius}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
            label={isCompact ? renderCustomLabel : false}
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
                  <div className="rounded-lg p-3 shadow-lg border border-border bg-popover text-popover-foreground">
                    <p className="font-medium text-sm mb-1">{item.name}</p>
                    <p className="text-sm opacity-80">
                      {valueFormatter(item.value)} ({item.percentage}%)
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          {effectiveShowLegend && (
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
