import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ActivityData {
  date: string
  total: number
}

interface FinancialActivityChartProps {
  data: ActivityData[]
  isLoading?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--card-bg)] p-3 border border-[var(--card-border)] rounded-lg shadow-lg">
        <p className="font-medium mb-2 text-[var(--card-fg)]">{label}</p>
        <p className="text-sm font-medium text-[hsl(var(--accent))]">
          Movimientos: {payload[0]?.value || 0}
        </p>
      </div>
    )
  }
  return null
}

export function FinancialActivityChart({ data, isLoading }: FinancialActivityChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--card-fg)]">Actividad Financiera</CardTitle>
          <p className="text-sm text-[var(--muted-fg)]">
            Movimientos de los últimos 7 días
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
      <CardHeader>
        <CardTitle className="text-[var(--card-fg)]">Actividad Financiera</CardTitle>
        <p className="text-sm text-[var(--muted-fg)]">
          Movimientos de los últimos 7 días
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFinancial" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-text)" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: 'var(--chart-grid-text)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'var(--chart-grid-text)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fillUrl="#colorFinancial"
                fill="url(#colorFinancial)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}