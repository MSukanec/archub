import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

interface WeeklyProgressHeatmapProps {
  data: any[]
}

export default function WeeklyProgressHeatmap({ data }: WeeklyProgressHeatmapProps) {
  const heatmapData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Encontrar rango de fechas
    const dates = data
      .filter(task => task.start_date)
      .map(task => new Date(task.start_date))
      .sort((a, b) => a.getTime() - b.getTime())

    if (dates.length === 0) return []

    const startDate = dates[0]
    const endDate = data
      .filter(task => task.end_date)
      .map(task => new Date(task.end_date))
      .sort((a, b) => b.getTime() - a.getTime())[0] || new Date()

    // Generar semanas
    const weeks = eachWeekOfInterval(
      { start: startDate, end: endDate },
      { weekStartsOn: 1 }
    )

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      
      // Calcular progreso promedio para esta semana
      const tasksInWeek = data.filter(task => {
        const taskStart = task.start_date ? new Date(task.start_date) : null
        const taskEnd = task.end_date ? new Date(task.end_date) : null
        
        return taskStart && (
          (taskStart >= weekStart && taskStart <= weekEnd) ||
          (taskEnd && taskEnd >= weekStart && taskEnd <= weekEnd) ||
          (taskStart <= weekStart && taskEnd && taskEnd >= weekEnd)
        )
      })

      const avgProgress = tasksInWeek.length > 0 
        ? tasksInWeek.reduce((sum, task) => sum + (task.progress_percent || 0), 0) / tasksInWeek.length
        : 0

      return {
        week: format(weekStart, 'dd MMM', { locale: es }),
        progress: Math.round(avgProgress),
        tasks: tasksInWeek.length,
        weekStart
      }
    }).slice(0, 12) // Últimas 12 semanas
  }, [data])

  const getHeatmapColor = (progress: number) => {
    if (progress === 0) return 'bg-muted'
    if (progress < 25) return 'bg-red-200 dark:bg-red-900'
    if (progress < 50) return 'bg-yellow-200 dark:bg-yellow-900'
    if (progress < 75) return 'bg-blue-200 dark:bg-blue-900'
    return 'bg-green-200 dark:bg-green-900'
  }

  return (
    <Card className="h-80">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Heatmap de Avance Semanal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-1 h-40">
          {heatmapData.map((week, index) => (
            <div
              key={week.week}
              className={`
                relative rounded-sm border flex flex-col items-center justify-center
                ${getHeatmapColor(week.progress)}
                transition-all hover:scale-105 cursor-pointer
              `}
              title={`${week.week}: ${week.progress}% promedio (${week.tasks} tareas)`}
            >
              <div className="text-xs font-medium text-center">
                {week.week}
              </div>
              <div className="text-xs opacity-80">
                {week.progress}%
              </div>
              {week.tasks > 0 && (
                <div className="text-xs opacity-60">
                  {week.tasks}t
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-muted rounded-sm border"></div>
            <div className="w-3 h-3 bg-red-200 dark:bg-red-900 rounded-sm border"></div>
            <div className="w-3 h-3 bg-yellow-200 dark:bg-yellow-900 rounded-sm border"></div>
            <div className="w-3 h-3 bg-blue-200 dark:bg-blue-900 rounded-sm border"></div>
            <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded-sm border"></div>
          </div>
          <span>Más</span>
        </div>
      </CardContent>
    </Card>
  )
}