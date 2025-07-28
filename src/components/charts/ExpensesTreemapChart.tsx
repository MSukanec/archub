import React from 'react'
import { ResponsiveContainer, Treemap, Cell } from 'recharts'

interface ExpensesTreemapData {
  name: string
  size: number
  category: string
  subcategory: string
  color: string
  percentage: number
}

interface ExpensesTreemapChartProps {
  data: ExpensesTreemapData[]
  isLoading?: boolean
}

export function ExpensesTreemapChart({ data, isLoading }: ExpensesTreemapChartProps) {
  
  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando treemap de subcategorías...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No hay datos de subcategorías</div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value)
  }

  const CustomizedContent = (props: any) => {
    const { x, y, width, height, payload } = props
    
    if (!payload) return null

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: payload.color || '#8884d8',
            stroke: '#fff',
            strokeWidth: 2,
            strokeOpacity: 1,
          }}
        />
        {/* Only show text if rectangle is large enough */}
        {width > 60 && height > 40 && payload.subcategory && (
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="#fff"
            fontSize="12"
            fontWeight="bold"
          >
            {payload.subcategory}
          </text>
        )}
        {width > 80 && height > 60 && payload.percentage && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 8}
            textAnchor="middle"
            fill="#fff"
            fontSize="10"
            opacity={0.9}
          >
            {payload.percentage}%
          </text>
        )}
      </g>
    )
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="size"
            stroke="#fff"
            fill="#8884d8"
            content={<CustomizedContent />}
          />
        </ResponsiveContainer>
      </div>
      
      {/* Legend organized by categories */}
      <div className="border-t pt-4">
        <div className="text-xs font-medium text-muted-foreground mb-3">Subcategorías por Categoría:</div>
        <div className="space-y-3">
          {/* Group by category */}
          {['Mano de Obra', 'Materiales', 'Indirectos'].map(category => {
            const categoryData = data.filter(item => item.category === category)
            if (categoryData.length === 0) return null
            
            const categoryTotal = categoryData.reduce((sum, item) => sum + item.size, 0)
            
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{category}</span>
                  <span className="text-muted-foreground">{formatCurrency(categoryTotal)}</span>
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs ml-4">
                  {categoryData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.subcategory}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{formatCurrency(item.size)}</span>
                        <span className="text-muted-foreground">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}