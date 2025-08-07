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
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando progreso de presupuesto...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No hay datos de presupuesto disponibles</div>
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
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <p className="text-sm">Presupuesto: {formatCurrency(data.budget)}</p>
          <p className="text-sm">Gastado: {formatCurrency(data.spent)}</p>
          <p className="text-sm">Restante: {formatCurrency(data.remaining)}</p>
          <p className="text-sm">Progreso: {data.percentage.toFixed(1)}%</p>
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