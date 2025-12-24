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



  // Simplify data structure for treemap
  const treemapData = data.map((item, index) => ({
    name: item.subcategory,
    size: item.size,
    fill: item.color
  }))


  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-80 rounded-lg" style={{ backgroundColor: 'var(--accent)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            stroke="#fff"
            strokeWidth={1}
          >
            <Tooltip 
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              labelFormatter={(label) => label} // Mostrar el nombre de la subcategoría
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0]
                  return (
                    <div
                      style={{
                        backgroundColor: 'var(--toast-bg)',
                        color: 'var(--toast-fg)',
                        border: '1px solid var(--toast-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        padding: '8px 12px'
                      }}
                    >
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {data.payload.name}
                      </div>
                      <div>
                        Monto: {formatCurrency(data.value as number)}
                      </div>
                    </div>
                  )
                }
                return null
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