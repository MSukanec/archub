import React from 'react'
import { ResponsiveContainer, Cell, Tooltip } from 'recharts'
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
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      </div>
    )
  }

  // Prepare data for the single ring - categories only
  const categoryData = data.map(item => ({
    name: item.category,
    value: item.amount,
    color: item.color,
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
      {/* Chart */}
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
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Monto']}
              labelFormatter={(label) => `Categoría: ${label}`}
              contentStyle={{
                backgroundColor: 'var(--toast-bg)',
                color: 'var(--toast-fg)',
                border: '1px solid var(--toast-border)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend inside card */}
          {categoryData.map((category, index) => (
                <div 
                  style={{ backgroundColor: category.color }}
                />
              </div>
                {formatCurrency(category.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}