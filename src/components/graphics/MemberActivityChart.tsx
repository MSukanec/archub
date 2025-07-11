import React from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UserActivity {
  date: string
  users: {
    user_id: string
    full_name: string
    avatar_url?: string
    activity_count: number
  }[]
  total: number
}

interface UserActivityChartProps {
  data: UserActivity[]
  isLoading?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const users = payload[0]?.payload?.users || []
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
        <p className="font-medium mb-2">{label}</p>
        <p className="text-sm font-medium mb-2" style={{ color: '#92c900' }}>
          Actividad total: {payload[0]?.value || 0}
        </p>
        {users.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-600 mb-1">Usuarios activos:</p>
            {users.slice(0, 3).map((user: any) => (
              <div key={user.user_id} className="flex items-center gap-2">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={user.avatar_url} alt={user.full_name} />
                  <AvatarFallback className="text-xs">
                    {user.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{user.full_name}: {user.activity_count}</span>
              </div>
            ))}
            {users.length > 3 && (
              <p className="text-xs text-gray-500">+{users.length - 3} más</p>
            )}
          </div>
        )}
      </div>
    )
  }
  return null
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props
  const users = payload?.users || []
  
  if (users.length === 0) return null
  
  // Show up to 3 most active users as dots
  const topUsers = users
    .sort((a: any, b: any) => b.activity_count - a.activity_count)
    .slice(0, 3)
  
  return (
    <g>
      {topUsers.map((user: any, index: number) => (
        <foreignObject
          key={user.user_id}
          x={cx - 10 + (index * 8)}
          y={cy - 10 - (index * 2)}
          width={20}
          height={20}
        >
          <Avatar className="h-5 w-5 border-2 border-white shadow-sm">
            <AvatarImage src={user.avatar_url} alt={user.full_name} />
            <AvatarFallback className="text-xs bg-accent text-accent-foreground">
              {user.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </foreignObject>
      ))}
    </g>
  )
}

export function MemberActivityChart({ data, isLoading }: UserActivityChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actividad por Miembro</CardTitle>
          <p className="text-sm text-muted-foreground">
            Actividad de miembros en los últimos 7 días
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
        <CardTitle>Actividad por Miembro</CardTitle>
        <p className="text-sm text-muted-foreground">
          Actividad de miembros en los últimos 7 días
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUserTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#92c900" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#92c900" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                className="text-gray-600"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-gray-600"
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Area
                type="monotone"
                dataKey="total"
                stroke="#92c900"
                fillOpacity={1}
                fill="url(#colorUserTotal)"
                strokeWidth={2}
                dot={<CustomDot />}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}