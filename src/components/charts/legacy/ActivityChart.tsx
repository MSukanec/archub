import React, { useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

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
  timePeriod: TimePeriod
  onTimePeriodChange?: (period: TimePeriod) => void
}

type TimePeriod = 'week' | 'month' | 'year'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const users = payload[0]?.payload?.users || []
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
        <p className="font-medium mb-2">{label}</p>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
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
      {topUsers.map((user: any, index: number) => {
        // Better positioning to avoid overlap with Y-axis and chart edges
        const offsetX = cx - 14 + (index * 10)
        // Adjust Y position based on chart height to avoid going too high
        const maxY = Math.max(cy - 50, 20) // Ensure avatars don't go above chart area
        const offsetY = maxY - (index * 4)
        
        return (
          <foreignObject
            key={user.user_id}
            x={offsetX}
            y={offsetY}
            width={28}
            height={28}
          >
            <Avatar className="h-7 w-7 border-2 border-white shadow-md">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                {user.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </foreignObject>
        )
      })}
    </g>
  )
}

export function ActivityChart({ data, isLoading, timePeriod, onTimePeriodChange }: UserActivityChartProps) {
  
  const getTimePeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'week': return 'últimos 7 días'
      case 'month': return 'último mes'
      case 'year': return 'último año'
      default: return 'últimos 7 días'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Actividad por Miembro</CardTitle>
              <p className="text-sm text-muted-foreground">
                Actividad de miembros en los {getTimePeriodLabel(timePeriod)}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>Semana</Button>
              <Button variant="outline" size="sm" disabled>Mes</Button>
              <Button variant="outline" size="sm" disabled>Año</Button>
            </div>
          </div>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Actividad por Miembro</CardTitle>
            <p className="text-sm text-muted-foreground">
              Actividad de miembros en los {getTimePeriodLabel(timePeriod)}
            </p>
          </div>
          <div className="flex gap-1">
            <Button 
              variant={timePeriod === 'week' ? "default" : "outline"} 
              size="sm"
              onClick={() => onTimePeriodChange && onTimePeriodChange('week')}
            >
              Semana
            </Button>
            <Button 
              variant={timePeriod === 'month' ? "default" : "outline"} 
              size="sm"
              onClick={() => onTimePeriodChange && onTimePeriodChange('month')}
            >
              Mes
            </Button>
            <Button 
              variant={timePeriod === 'year' ? "default" : "outline"} 
              size="sm"
              onClick={() => onTimePeriodChange && onTimePeriodChange('year')}
            >
              Año
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 30, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorUserTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent-hsl))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--accent-hsl))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--chart-grid-text)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--chart-grid-text)' }}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-text)" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--accent)"
                fillOpacity={1}
                fill="url(#colorUserTotal)"
                dot={<CustomDot />}
                activeDot={{ r: 6, stroke: 'var(--accent)', strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}