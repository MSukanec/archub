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
      {/* Chart - Responsive height and width */}
      <div className="h-48 md:h-64 flex justify-center">
        <div className="w-72 md:w-full">
          <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Single ring - Categories only */}
            <Pie
              data={categoryData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={55}
              startAngle={90}
              endAngle={450}
              label={({ name, percentage }) => 
                percentage > 8 ? `${name}` : '' // Simplified labels for mobile
              }
              labelLine={false}
              style={{ fontSize: '11px' }} // Smaller font for mobile
            >
              {categoryData.map((entry, index) => (
                <Cell key={`category-cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        </div>
      </div>
      
      {/* Legend - Compact for mobile */}
      <div className="border-t pt-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">Leyenda de Rubros:</div>
        <div className="grid grid-cols-3 md:grid-cols-1 gap-1 md:gap-2 text-xs">
          {categoryData.map((category, index) => (
            <div key={index} className="flex items-center md:justify-between">
              <div className="flex items-center gap-1 md:gap-2 min-w-0">
                <div 
                  className="w-2 h-2 md:w-3 md:h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium truncate text-xs">{category.name}</span>
              </div>
              <span className="hidden md:inline text-muted-foreground font-medium text-xs">
                {formatCurrency(category.value)}
              </span>
            </div>
          ))}
        </div>
        
        {/* Mobile summary */}
        <div className="md:hidden mt-2 pt-2 border-t space-y-1">
          {categoryData.map((category, index) => (
            <div key={`mobile-${index}`} className="flex justify-between text-xs">
              <span className="font-medium">{category.name}:</span>
              <span className="text-muted-foreground">{category.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}