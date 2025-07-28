import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts'

interface ExpensesCategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

interface ExpensesTrendChartProps {
  data: ExpensesCategoryData[]
  isLoading?: boolean
}

export function ExpensesTrendChart({ data, isLoading }: ExpensesTrendChartProps) {

  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando análisis de tendencias...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No hay datos para el análisis de tendencias</div>
      </div>
    )
  }

  // Prepare chart data with projections and additional analysis
  const chartData = data.map((item, index) => {
    // Calculate a projected value (15% increase simulation)
    const projectedAmount = item.amount * 1.15
    
    // Calculate efficiency rating based on percentage vs position
    const efficiencyScore = Math.max(20, Math.min(100, (item.percentage * 2) + (30 - index * 10)))
    
    return {
      name: item.category,
      actual: item.amount,
      projected: projectedAmount,
      efficiency: efficiencyScore,
      percentage: item.percentage,
      fill: item.color === 'var(--chart-1)' ? 'hsl(76, 100%, 40%)' :
            item.color === 'var(--chart-2)' ? 'hsl(173, 58%, 39%)' :
            item.color === 'var(--chart-3)' ? 'hsl(197, 37%, 24%)' : 'hsl(0, 0%, 50%)'
    }
  }).sort((a, b) => b.actual - a.actual)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatCompact = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toString()
  }

  // Calculate average for reference line
  const averageAmount = chartData.reduce((sum, item) => sum + item.actual, 0) / chartData.length

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.split(' ')[0]} // Show only first word
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatCompact}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === 'actual' ? formatCurrency(value) :
                name === 'projected' ? formatCurrency(value) :
                `${value}%`,
                name === 'actual' ? 'Gasto Actual' :
                name === 'projected' ? 'Proyección (+15%)' :
                'Eficiencia'
              ]}
              labelFormatter={(label) => `Categoría: ${label}`}
              contentStyle={{
                backgroundColor: 'var(--toast-bg)',
                color: 'var(--toast-fg)',
                border: '1px solid var(--toast-border)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => 
                value === 'actual' ? 'Gasto Actual' :
                value === 'projected' ? 'Proyección' :
                'Eficiencia %'
              }
            />
            
            {/* Reference line for average */}
            <ReferenceLine 
              y={averageAmount} 
              stroke="var(--muted-foreground)" 
              strokeDasharray="3 3"
              label={{ value: "Promedio", position: "insideTopRight", fontSize: 10 }}
            />
            
            {/* Actual amounts bars */}
            <Bar 
              dataKey="actual" 
              fill="var(--chart-1)"
              radius={[2, 2, 0, 0]}
              opacity={0.8}
            />
            
            {/* Projected amounts bars (lighter) */}
            <Bar 
              dataKey="projected" 
              fill="var(--chart-2)"
              radius={[2, 2, 0, 0]}
              opacity={0.5}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Analysis summary */}
      <div className="border-t pt-4">
        <div className="text-xs font-medium text-muted-foreground mb-3">Análisis Comparativo:</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{item.percentage}%</div>
                <div className="text-muted-foreground">
                  {index === 0 ? 'Mayor' : index === 1 ? 'Medio' : 'Menor'} impacto
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}