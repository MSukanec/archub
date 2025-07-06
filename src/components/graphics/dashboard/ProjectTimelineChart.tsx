import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { CalendarDays, TrendingUp } from 'lucide-react'

interface TimelineDataPoint {
  month: string
  design: number
  construction: number
  finance: number
  commercialization: number
}

interface ProjectTimelineChartProps {
  data: TimelineDataPoint[]
}

export function ProjectTimelineChart({ data }: ProjectTimelineChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-card-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}% completado
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Calcular el progreso total promedio
  const latestData = data[data.length - 1]
  const avgProgress = latestData ? 
    (latestData.design + latestData.construction + latestData.finance + latestData.commercialization) / 4 : 0

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            Timeline de Progreso
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: 'var(--chart-1)' }} />
            <span className="text-lg font-bold" style={{ color: 'var(--chart-1)' }}>
              {Math.round(avgProgress)}%
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="designGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="constructionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="financeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="commercializationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="design"
                stackId="1"
                stroke="var(--chart-1)"
                fill="url(#designGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="construction"
                stackId="1"
                stroke="var(--accent)"
                fill="url(#constructionGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="finance"
                stackId="1"
                stroke="var(--chart-2)"
                fill="url(#financeGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="commercialization"
                stackId="1"
                stroke="var(--chart-4)"
                fill="url(#commercializationGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Leyenda personalizada */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: 'var(--chart-1)' }}
            />
            <span className="text-xs text-muted-foreground">Diseño</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: 'var(--accent)' }}
            />
            <span className="text-xs text-muted-foreground">Obra</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: 'var(--chart-2)' }}
            />
            <span className="text-xs text-muted-foreground">Finanzas</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: 'var(--chart-4)' }}
            />
            <span className="text-xs text-muted-foreground">Comercialización</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}