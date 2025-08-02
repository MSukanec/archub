import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PaymentData {
  month: string
  amount: number
  formattedMonth: string
}

interface SubcontractPaymentsChartProps {
  data: PaymentData[]
  isLoading?: boolean
  currencySymbol?: string
  title?: string
}

export function SubcontractPaymentsChart({
  data,
  isLoading = false,
  currencySymbol = '$',
  title = 'Pagos de Subcontratos por Mes'
}: SubcontractPaymentsChartProps) {
  if (isLoading) {
    return (
      <Card className="col-span-4">
        <CardContent className="p-0">
          <div className="h-32 bg-muted/20 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="col-span-4">
        <CardContent className="p-0">
          <div className="h-32 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">No hay datos de pagos disponibles</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currencySymbol === 'US$' ? 'USD' : 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm" style={{ color: 'var(--chart-1)' }}>
            <span className="font-medium">Pagos: </span>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-4">
      <CardContent className="p-0">
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 0,
                left: 0,
                bottom: 10,
              }}
            >
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-text)" />
              <XAxis 
                dataKey="formattedMonth" 
                stroke="var(--chart-grid-text)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--chart-grid-text)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`
                  }
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(0)}K`
                  }
                  return value.toString()
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="var(--chart-1)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}