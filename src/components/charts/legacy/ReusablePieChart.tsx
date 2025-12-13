import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface PieChartData {
  name: string
  value: number
  color: string
  percentage?: number
}

interface ReusablePieChartProps {
  data: PieChartData[]
  isLoading?: boolean
  dataKey?: string
  nameKey?: string
  valueFormatter?: (value: number) => string
  loadingText?: string
  emptyText?: string
  showPercentageLabels?: boolean
  minPercentageToShowLabel?: number
}

export function ReusablePieChart({
  data,
  isLoading = false,
  dataKey = 'value',
  nameKey = 'name',
  valueFormatter = (value: number) => new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(value),
  loadingText = 'Cargando...',
  emptyText = 'No hay datos disponibles',
  showPercentageLabels = true,
  minPercentageToShowLabel = 5
}: ReusablePieChartProps) {
  
  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">{loadingText}</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">{emptyText}</div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = data.percentage || ((data[dataKey] / data.total) * 100)
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-1">{data[nameKey]}</p>
          <p className="text-sm text-muted-foreground">
            {valueFormatter(data[dataKey])} {percentage ? `(${percentage.toFixed(1)}%)` : ''}
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (!showPercentageLabels || percentage < minPercentageToShowLabel) return null
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, bottom: 45, left: 10 }}>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={showPercentageLabels ? CustomLabel : false}
            outerRadius={100}
            fill="#8884d8"
            dataKey={dataKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={30}
            wrapperStyle={{ paddingTop: '2px', fontSize: '12px' }}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }} className="text-xs">
                {entry.payload[nameKey]}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}