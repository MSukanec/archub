import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface BudgetProgressData {
  category: string
  budget: number
  spent: number
  remaining: number
  percentage: number
}

interface BudgetProgressChartProps {
  data: BudgetProgressData[]
  isLoading?: boolean
}

export function BudgetProgressChart({ data, isLoading }: BudgetProgressChartProps) {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return 'hsl(0, 87%, 67%)'   // chart-5 - rojo
    if (percentage >= 70) return 'hsl(43, 74%, 66%)'  // chart-4 - amarillo
    return 'hsl(110, 40%, 50%)'                       // chart-1 - verde
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-text)" />
        <XAxis dataKey="category" tick={{ fill: 'var(--chart-grid-text)' }} />
        <YAxis tickFormatter={formatCurrency} tick={{ fill: 'var(--chart-grid-text)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}