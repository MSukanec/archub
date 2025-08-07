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
      </div>
    )
  }

  if (!data || data.length === 0) {
    console.log('No treemap data available')
    return (
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
      {/* Chart */}
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
          {/* Group by category */}
          {['Mano de Obra', 'Materiales', 'Indirectos'].map(category => {
            const categoryData = data.filter(item => item.category === category)
            if (categoryData.length === 0) return null
            
            const categoryTotal = categoryData.reduce((sum, item) => sum + item.size, 0)
            
            return (
                  <span>{category}</span>
                </div>
                  {categoryData.map((item, index) => (
                        <div 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.subcategory}</span>
                      </div>
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