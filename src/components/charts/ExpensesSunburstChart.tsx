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

  // Create category color mapping based on category names
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Mano de Obra':
        return 'hsl(76, 100%, 40%)'   // Verde - var(--chart-1)
      case 'Materiales':
        return 'hsl(173, 58%, 39%)'   // Azul-Verde - var(--chart-2)
      case 'Indirectos':
        return 'hsl(197, 37%, 24%)'   // Azul - var(--chart-3)
      default:
        return 'hsl(76, 100%, 40%)'   // Fallback verde
    }
  }

  // Prepare data for the single ring - categories only
  const categoryData = data.map(item => ({
    name: item.category,
    value: item.amount,
    color: getCategoryColor(item.category),
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
      
      {/* Legend with correct colors */}
      <div className="border-t pt-3">
        <div className="text-xs font-medium text-muted-foreground mb-3">Leyenda de Rubros:</div>
        <div className="space-y-2">
          {categoryData.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium text-sm">{category.name}</span>
              </div>
              <span className="text-muted-foreground font-medium text-sm">
                {formatCurrency(category.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}