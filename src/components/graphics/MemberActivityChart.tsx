import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
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
  onTimePeriodChange: (period: TimePeriod) => void
}

type TimePeriod = 'week' | 'month' | 'year'

// Generate colors for different users
const getUserColors = (userIndex: number) => {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ]
  return colors[userIndex % colors.length]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">{entry.dataKey}: {entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={entry.payload?.avatar_url} />
            <AvatarFallback className="text-xs" style={{ backgroundColor: entry.color }}>
              {entry.payload?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function MemberActivityChart({ data, isLoading, timePeriod, onTimePeriodChange }: UserActivityChartProps) {
  
  const getTimePeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'week': return 'últimos 7 días'
      case 'month': return 'último mes'
      case 'year': return 'último año'
      default: return 'últimos 7 días'
    }
  }

  // Transform data to create separate lines for each user
  const processChartData = () => {
    if (!data || data.length === 0) return { chartData: [], activeUsers: [] }

    // Get all unique users who have any activity
    const allActiveUsers = new Set<string>()
    data.forEach(dayData => {
      dayData.users.forEach(user => {
        if (user.activity_count > 0) {
          allActiveUsers.add(user.user_id)
        }
      })
    })

    const activeUsersArray = Array.from(allActiveUsers)
    
    // Create chart data with each user as a separate line
    const chartData = data.map(dayData => {
      const result: any = { date: dayData.date }
      
      // For each active user, set their activity count for this day
      activeUsersArray.forEach(userId => {
        const userActivity = dayData.users.find(u => u.user_id === userId)
        result[userId] = userActivity?.activity_count || 0
      })
      
      return result
    })

    // Get user details for legend
    const activeUsers = activeUsersArray.map(userId => {
      // Find user details from any day's data
      for (const dayData of data) {
        const user = dayData.users.find(u => u.user_id === userId)
        if (user) {
          return user
        }
      }
      return null
    }).filter(Boolean)

    return { chartData, activeUsers }
  }

  const { chartData, activeUsers } = processChartData()

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

  if (!chartData || chartData.length === 0 || activeUsers.length === 0) {
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
                onClick={() => onTimePeriodChange('week')}
              >
                Semana
              </Button>
              <Button 
                variant={timePeriod === 'month' ? "default" : "outline"} 
                size="sm"
                onClick={() => onTimePeriodChange('month')}
              >
                Mes
              </Button>
              <Button 
                variant={timePeriod === 'year' ? "default" : "outline"} 
                size="sm"
                onClick={() => onTimePeriodChange('year')}
              >
                Año
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm">Sin actividad registrada</p>
              <p className="text-xs">No hay actividad de miembros en este período</p>
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
              onClick={() => onTimePeriodChange('week')}
            >
              Semana
            </Button>
            <Button 
              variant={timePeriod === 'month' ? "default" : "outline"} 
              size="sm"
              onClick={() => onTimePeriodChange('month')}
            >
              Mes
            </Button>
            <Button 
              variant={timePeriod === 'year' ? "default" : "outline"} 
              size="sm"
              onClick={() => onTimePeriodChange('year')}
            >
              Año
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 80, // More space for legend
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                content={<CustomLegend />}
                wrapperStyle={{ paddingTop: '20px' }}
              />
              
              {/* Generate a line for each active user */}
              {activeUsers.map((user: any, index: number) => (
                <Line
                  key={user.user_id}
                  type="monotone"
                  dataKey={user.user_id}
                  stroke={getUserColors(index)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={user.full_name}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}