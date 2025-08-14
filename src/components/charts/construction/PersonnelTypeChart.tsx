import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { PersonnelTypeData } from '@/hooks/use-construction-dashboard'

interface PersonnelTypeChartProps {
  data: PersonnelTypeData[]
  isLoading: boolean
}

export function PersonnelTypeChart({ data, isLoading }: PersonnelTypeChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando tipos de personal...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">No hay datos de personal disponibles</div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} personas
          </p>
        </div>
      )
    }
    return null
  }

  const CustomBar = (props: any) => {
    const { fill, ...rest } = props
    const dataPoint = data.find(d => d.type === props.payload?.type)
    return <Bar {...rest} fill={dataPoint?.color || fill} />
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart 
        data={data} 
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-text)" />
        <XAxis 
          dataKey="type" 
          tick={{ fill: 'var(--chart-grid-text)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--chart-grid-text)' }}
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis 
          tick={{ fill: 'var(--chart-grid-text)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--chart-grid-text)' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="count" 
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          shape={(props: any) => <CustomBar {...props} />}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}