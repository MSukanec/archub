import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export interface MonthlyFlowData {
  month: string
  inflow: number
  outflow: number
  net: number
}

export interface MonthlyFlowChartProps {
  data: MonthlyFlowData[]
  isLoading?: boolean
  formatValue?: (value: number) => string
  lineLabels?: { inflow: string; outflow: string; net: string }
}

export function MonthlyFlowChart({ 
  data, 
  isLoading,
  formatValue = (v) => v.toString(),
  lineLabels = { inflow: 'Inflow', outflow: 'Outflow', net: 'Net' }
}: MonthlyFlowChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No data available</div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-text)" />
        <XAxis 
          dataKey="month" 
          tick={{ fill: 'var(--chart-grid-text)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--chart-grid-text)' }}
          tickLine={{ stroke: 'var(--chart-grid-text)' }}
        />
        <YAxis 
          tickFormatter={formatValue} 
          tick={{ fill: 'var(--chart-grid-text)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--chart-grid-text)' }}
          tickLine={{ stroke: 'var(--chart-grid-text)' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Line 
          type="monotone" 
          dataKey="inflow" 
          stroke="var(--positive)" 
          strokeWidth={3}
          name={lineLabels.inflow}
          connectNulls={true}
          dot={{ fill: "var(--positive)", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "var(--positive)", stroke: "#fff", strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="outflow" 
          stroke="var(--negative)" 
          strokeWidth={3}
          name={lineLabels.outflow}
          connectNulls={true}
          dot={{ fill: "var(--negative)", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "var(--negative)", stroke: "#fff", strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="net" 
          stroke="var(--neutral)" 
          strokeWidth={4}
          name={lineLabels.net}
          connectNulls={true}
          dot={{ fill: "var(--neutral)", strokeWidth: 2, r: 5 }}
          activeDot={{ r: 7, fill: "var(--neutral)", stroke: "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}