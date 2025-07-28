import React from 'react'
import { ResponsiveContainer, Treemap, Cell, Tooltip } from 'recharts'

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
  
  console.log('Treemap data received:', data)
  
  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando treemap de subcategorías...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    console.log('No treemap data available')
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



  // Simplify data structure for treemap
  const treemapData = data.map((item, index) => ({
    name: item.subcategory,
    size: item.size,
    fill: item.color
  }))

  console.log('Processed treemap data:', treemapData)

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-80 rounded-lg" style={{ backgroundColor: 'var(--accent)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            stroke="#fff"
            content={({ root, depth, x, y, width, height, index, name }) => {
              // Solo renderizar contenido si es un nodo hoja y tiene suficiente espacio
              if (depth === 1 && width > 50 && height > 25) {
                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      style={{
                        fill: treemapData[index]?.fill || '#ccc',
                        stroke: '#fff',
                        strokeWidth: 1
                      }}
                    />
                    {/* Solo mostrar texto si hay suficiente espacio */}
                    {width > 80 && height > 40 && (
                      <text
                        x={x + width / 2}
                        y={y + height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: '11px', // Tamaño como en la leyenda (text-xs)
                          fontWeight: 'normal', // Sin negrita
                          fill: '#fff'
                        }}
                      >
                        {name}
                      </text>
                    )}
                  </g>
                )
              }
              return null
            }}
          >
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Monto']}
              labelFormatter={(label) => label} // Solo mostrar el nombre de la subcategoría
              contentStyle={{
                backgroundColor: 'var(--toast-bg)',
                color: 'var(--toast-fg)',
                border: '1px solid var(--toast-border)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
          </Treemap>
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