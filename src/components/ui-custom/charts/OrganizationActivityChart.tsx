import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface ActivityData {
  date: string
  movimientos: number
  tareas: number
  contactos: number
  documentos: number
  total: number
}

interface OrganizationActivityChartProps {
  data: ActivityData[]
  isLoading?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
        <p className="text-sm font-medium mt-1 pt-1 border-t">
          Total: {payload.reduce((sum: number, item: any) => sum + (item.dataKey !== 'total' ? item.value : 0), 0)}
        </p>
      </div>
    )
  }
  return null
}

export function OrganizationActivityChart({ data, isLoading }: OrganizationActivityChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <p className="text-sm text-muted-foreground">
            Actividad de los últimos 7 días
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
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <p className="text-sm text-muted-foreground">
          Actividad de los últimos 7 días
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMovimientos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorTareas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorDocumentos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorContactos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                className="text-gray-600"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-gray-600"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Area
                type="monotone"
                dataKey="movimientos"
                stackId="1"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorMovimientos)"
                name="Movimientos"
              />
              <Area
                type="monotone"
                dataKey="tareas"
                stackId="1"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorTareas)"
                name="Tareas"
              />
              <Area
                type="monotone"
                dataKey="documentos"
                stackId="1"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorDocumentos)"
                name="Documentos"
              />
              <Area
                type="monotone"
                dataKey="contactos"
                stackId="1"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorContactos)"
                name="Contactos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}