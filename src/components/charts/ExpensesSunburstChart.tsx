import React from 'react'
import { ResponsiveContainer, Cell } from 'recharts'
import { PieChart, Pie } from 'recharts'

interface ExpensesCategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

interface ExpensesSunburstChartProps {
  data: ExpensesCategoryData[]
  isLoading?: boolean
}

export function ExpensesSunburstChart({ data, isLoading }: ExpensesSunburstChartProps) {
  
  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando gráfico de categorías...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No hay datos de categorías</div>
      </div>
    )
  }

  // Map CSS variables to actual HSL values for display
  const colorMap = {
    'var(--chart-1)': 'hsl(76, 100%, 40%)',   // Verde - Mano de Obra
    'var(--chart-2)': 'hsl(173, 58%, 39%)',   // Azul-Verde - Materiales
    'var(--chart-3)': 'hsl(197, 37%, 24%)'    // Azul - Indirectos
  }

  // Prepare data for the single ring - categories only
  const categoryData = data.map(item => ({
    name: item.category,
    value: item.amount,
    color: colorMap[item.color as keyof typeof colorMap] || item.color,
    percentage: item.percentage
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Single ring - Categories only */}
            <Pie
              data={categoryData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={90}
              startAngle={90}
              endAngle={450}
              label={({ name, percentage }) => 
                percentage > 5 ? `${name} (${percentage}%)` : ''
              }
              labelLine={false}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`category-cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend inside card */}
      <div className="border-t pt-4">
        <div className="text-xs font-medium text-muted-foreground mb-3">Leyenda:</div>
        <div className="grid grid-cols-1 gap-2 text-xs">
          {categoryData.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium">{category.name}</span>
              </div>
              <span className="text-muted-foreground font-medium">
                {formatCurrency(category.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}