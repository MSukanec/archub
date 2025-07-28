import React from 'react'
import { ResponsiveContainer, Cell } from 'recharts'
import { PieChart, Pie } from 'recharts'

interface ExpensesSunburstData {
  category: string
  subcategory: string
  amount: number
  percentage: number
  categoryColor: string
  subcategoryColor: string
}

interface ExpensesSunburstChartProps {
  data: ExpensesSunburstData[]
  isLoading?: boolean
}

export function ExpensesSunburstChart({ data, isLoading }: ExpensesSunburstChartProps) {
  
  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando gráfico sunburst...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No hay datos de subcategorías</div>
      </div>
    )
  }

  // Prepare data for categories (inner ring)
  const categoryTotals = new Map<string, { amount: number; color: string }>()
  
  data.forEach(item => {
    const existing = categoryTotals.get(item.category)
    if (existing) {
      existing.amount += item.amount
    } else {
      categoryTotals.set(item.category, {
        amount: item.amount,
        color: item.categoryColor
      })
    }
  })

  const categoryData = Array.from(categoryTotals.entries()).map(([name, info]) => ({
    name,
    value: info.amount,
    color: info.color
  }))

  // Prepare data for subcategories (outer ring)
  const subcategoryData = data.map(item => ({
    name: item.subcategory,
    value: item.amount,
    color: item.subcategoryColor,
    category: item.category
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)}
          </p>
          {data.category && (
            <p className="text-xs text-muted-foreground">
              Categoría: {data.category}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Inner ring - Categories */}
          <Pie
            data={categoryData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={20}
            outerRadius={60}
            startAngle={90}
            endAngle={450}
          >
            {categoryData.map((entry, index) => (
              <Cell key={`category-cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          
          {/* Outer ring - Subcategories */}
          <Pie
            data={subcategoryData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            startAngle={90}
            endAngle={450}
            label={({ name, percent }) => 
              percent > 0.1 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''
            }
            labelLine={false}
          >
            {subcategoryData.map((entry, index) => (
              <Cell key={`subcategory-cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          
          {/* <Tooltip content={<CustomTooltip />} /> */}
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="mt-4 space-y-2">
        <div className="text-xs font-medium text-muted-foreground mb-2">Leyenda:</div>
        <div className="grid grid-cols-1 gap-1 text-xs">
          {categoryData.map((category, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: category.color }}
              />
              <span className="font-medium">{category.name}</span>
              <span className="text-muted-foreground">
                {formatCurrency(category.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}