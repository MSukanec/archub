import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface MonthlyFlowData {
  month: string
  income: number
  expenses: number
  net: number
}

interface MonthlyFlowChartProps {
  data: MonthlyFlowData[]
  isLoading?: boolean
}

export function MonthlyFlowChart({ data, isLoading }: MonthlyFlowChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando flujo mensual...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No hay datos de flujo mensual disponibles</div>
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-text)" />
        <XAxis dataKey="month" tick={{ fill: 'var(--chart-grid-text)' }} />
        <YAxis tickFormatter={formatCurrency} tick={{ fill: 'var(--chart-grid-text)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="income" 
          stroke="hsl(110, 40%, 50%)" 
          strokeWidth={3}
          name="Ingresos"
          connectNulls={true}
          dot={{ fill: "hsl(110, 40%, 50%)", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "hsl(110, 40%, 50%)", stroke: "#fff", strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="expenses" 
          stroke="hsl(0, 87%, 67%)" 
          strokeWidth={3}
          name="Gastos"
          connectNulls={true}
          dot={{ fill: "hsl(0, 87%, 67%)", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "hsl(0, 87%, 67%)", stroke: "#fff", strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="net" 
          stroke="hsl(197, 37%, 24%)" 
          strokeWidth={4}
          name="Flujo neto"
          connectNulls={true}
          dot={{ fill: "hsl(197, 37%, 24%)", strokeWidth: 2, r: 5 }}
          activeDot={{ r: 7, fill: "hsl(197, 37%, 24%)", stroke: "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}