import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Calendar, User, FileText } from 'lucide-react'
import { format, subDays, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface ActivityData {
  date: string
  value: number
  type: 'low' | 'medium' | 'high' | 'very_high'
}

interface ProjectActivityChartProps {
  data: ActivityData[]
  recentActivities: {
    id: string
    user: string
    action: string
    timestamp: string
    type: 'design' | 'construction' | 'finance' | 'general'
  }[]
}

export function ProjectActivityChart({ data, recentActivities }: ProjectActivityChartProps) {
  // Generar calendario de las últimas 7 semanas
  const weeks = 7
  const today = new Date()
  const startDate = startOfWeek(subDays(today, weeks * 7), { weekStartsOn: 1 })
  
  const calendarData = []
  for (let week = 0; week < weeks; week++) {
    const weekData = []
    for (let day = 0; day < 7; day++) {
      const currentDate = addDays(startDate, week * 7 + day)
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const activity = data.find(d => d.date === dateStr)
      weekData.push({
        date: currentDate,
        dateStr,
        value: activity?.value || 0,
        type: activity?.type || 'low'
      })
    }
    calendarData.push(weekData)
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'very_high': return 'var(--accent)'
      case 'high': return 'var(--chart-1)'
      case 'medium': return 'var(--chart-2)'
      case 'low': return 'var(--chart-3)'
      default: return 'var(--border-default)'
    }
  }

  const getActivityOpacity = (type: string) => {
    switch (type) {
      case 'very_high': return 1
      case 'high': return 0.8
      case 'medium': return 0.6
      case 'low': return 0.3
      default: return 0.1
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'design': return <FileText className="h-3 w-3" />
      case 'construction': return <Activity className="h-3 w-3" />
      case 'finance': return <span className="text-xs font-bold">$</span>
      default: return <User className="h-3 w-3" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'design': return 'var(--chart-1)'
      case 'construction': return 'var(--accent)'
      case 'finance': return 'var(--chart-2)'
      default: return 'var(--chart-3)'
    }
  }

  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const totalActivity = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            Actividad del Proyecto
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
              {totalActivity}
            </div>
            <div className="text-xs text-muted-foreground">actividades totales</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Heatmap Calendar */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-card-foreground mb-3">
            Últimas {weeks} semanas
          </div>
          
          {/* Day labels */}
          <div className="flex items-center gap-1 mb-2">
            <div className="w-6"></div>
            {dayLabels.map((day, index) => (
              <div key={index} className="w-4 h-4 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="space-y-1">
            {calendarData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex items-center gap-1">
                <div className="w-6 text-xs text-muted-foreground">
                  {format(week[0].date, 'MMM', { locale: es })}
                </div>
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="w-4 h-4 rounded-sm border border-border cursor-pointer hover:border-accent transition-colors"
                    style={{
                      backgroundColor: getActivityColor(day.type),
                      opacity: getActivityOpacity(day.type)
                    }}
                    title={`${format(day.date, 'dd/MM/yyyy', { locale: es })}: ${day.value} actividades`}
                  />
                ))}
              </div>
            ))}
          </div>
          
          {/* Activity legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
            <span>Menos</span>
            <div className="flex gap-1">
              {['low', 'medium', 'high', 'very_high'].map((type) => (
                <div
                  key={type}
                  className="w-3 h-3 rounded-sm border border-border"
                  style={{
                    backgroundColor: getActivityColor(type),
                    opacity: getActivityOpacity(type)
                  }}
                />
              ))}
            </div>
            <span>Más</span>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-card-foreground">
            Actividad Reciente
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentActivities.slice(0, 6).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-2 rounded border border-border">
                <div 
                  className="flex items-center justify-center w-6 h-6 rounded-full"
                  style={{ 
                    backgroundColor: getTypeColor(activity.type), 
                    color: 'white' 
                  }}
                >
                  {getTypeIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user} • {format(new Date(activity.timestamp), 'HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}