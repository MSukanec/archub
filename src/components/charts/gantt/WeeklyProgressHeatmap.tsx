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
    if (progress === 0) return 'bg-muted text-muted-foreground'
    if (progress < 25) return 'text-white' // Red background with CSS variable
    if (progress < 50) return 'text-gray-900 dark:text-gray-100' // Yellow background  
    if (progress < 75) return 'text-white' // Blue background
    return 'text-white' // Green background
  }

  const getHeatmapBgColor = (progress: number) => {
    if (progress === 0) return 'bg-muted'
    if (progress < 25) return '[background-color:var(--chart-5)]' // Red
    if (progress < 50) return '[background-color:var(--chart-4)]' // Yellow
    if (progress < 75) return '[background-color:var(--chart-3)]' // Blue
    return '[background-color:var(--chart-1)]' // Green
  }

  return (
      </CardHeader>
          {heatmapData.map((week, index) => (
            <div
              key={week.week}
              className={`
                relative rounded-md border-2 flex flex-col items-center justify-center
                ${getHeatmapColor(week.progress)} ${getHeatmapBgColor(week.progress)}
                transition-all hover:scale-105 cursor-pointer shadow-sm
              `}
              title={`${week.week}: ${week.progress}% promedio (${week.tasks} tareas)`}
            >
                {week.week}
              </div>
                {week.progress}%
              </div>
              {week.tasks > 0 && (
                  {week.tasks}t
                </div>
              )}
            </div>
          ))}
        </div>
          <span>Menos</span>
          </div>
          <span>Más</span>
        </div>
      </CardContent>
    </Card>
  )
}