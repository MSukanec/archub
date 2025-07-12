import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface WalletBalance {
  wallet: string
  balance: number
  color: string
}

interface WalletBalanceChartProps {
  data: WalletBalance[]
  isLoading?: boolean
}

export function WalletBalanceChart({ data, isLoading }: WalletBalanceChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando datos de billeteras...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No hay datos de billeteras disponibles</div>
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.wallet}</p>
          <p className="text-sm text-muted-foreground">
            Balance: {formatCurrency(data.balance)}
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if ((percent * 100) < 5) return null // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={85}
            fill="hsl(110, 40%, 50%)"
            dataKey="balance"
          >
            {data.map((entry, index) => {
              const colors = [
                "hsl(110, 40%, 50%)",
                "hsl(173, 58%, 39%)",
                "hsl(197, 37%, 24%)",
                "hsl(43, 74%, 66%)",
                "hsl(0, 87%, 67%)"
              ];
              return (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              )
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={16}
            wrapperStyle={{ paddingTop: '4px' }}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }} className="text-sm">
                {entry.payload.wallet}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}