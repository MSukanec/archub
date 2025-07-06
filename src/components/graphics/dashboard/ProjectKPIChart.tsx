import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Target, DollarSign, Users, Clock } from 'lucide-react'

interface KPIData {
  name: string
  value: number
  color: string
  icon: React.ComponentType<any>
  label: string
  max?: number
}

interface ProjectKPIChartProps {
  data: {
    budget: { used: number; total: number }
    team: { active: number; total: number }
    timeline: { elapsed: number; total: number }
    efficiency: { score: number; max: number }
  }
}

export function ProjectKPIChart({ data }: ProjectKPIChartProps) {
  const kpiData: KPIData[] = [
    {
      name: 'Presupuesto',
      value: (data.budget.used / data.budget.total) * 100,
      color: 'var(--chart-1)',
      icon: DollarSign,
      label: `$${data.budget.used.toLocaleString()} / $${data.budget.total.toLocaleString()}`,
      max: 100
    },
    {
      name: 'Equipo',
      value: (data.team.active / data.team.total) * 100,
      color: 'var(--accent)',
      icon: Users,
      label: `${data.team.active} / ${data.team.total} miembros`,
      max: 100
    },
    {
      name: 'Cronograma',
      value: (data.timeline.elapsed / data.timeline.total) * 100,
      color: 'var(--chart-2)',
      icon: Clock,
      label: `${data.timeline.elapsed} / ${data.timeline.total} días`,
      max: 100
    },
    {
      name: 'Eficiencia',
      value: (data.efficiency.score / data.efficiency.max) * 100,
      color: 'var(--chart-4)',
      icon: Target,
      label: `${data.efficiency.score}% eficiencia`,
      max: 100
    }
  ]

  // Datos para el gráfico circular
  const chartData = kpiData.map(item => ({
    name: item.name,
    value: item.value,
    remaining: 100 - item.value
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const kpi = kpiData.find(k => k.name === data.name)
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-card-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{kpi?.label}</p>
          <p className="text-sm font-semibold" style={{ color: kpi?.color }}>
            {Math.round(data.value)}%
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLegend = (props: any) => {
    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        {kpiData.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Icon className="h-5 w-5" style={{ color: item.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                <p className="text-lg font-bold" style={{ color: item.color }}>
                  {Math.round(item.value)}%
                </p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          KPIs del Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {kpiData.map((item, index) => (
                <Pie
                  key={index}
                  data={[
                    { name: item.name, value: item.value },
                    { name: 'remaining', value: 100 - item.value }
                  ]}
                  cx={`${25 + (index % 2) * 50}%`}
                  cy={`${30 + Math.floor(index / 2) * 40}%`}
                  innerRadius={20}
                  outerRadius={35}
                  startAngle={90}
                  endAngle={450}
                  dataKey="value"
                >
                  <Cell fill={item.color} />
                  <Cell fill="var(--border-default)" opacity={0.2} />
                </Pie>
              ))}
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <CustomLegend />
      </CardContent>
    </Card>
  )
}