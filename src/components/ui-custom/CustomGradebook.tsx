import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download } from 'lucide-react'
import { format, eachDayOfInterval, isWeekend, isToday } from 'date-fns'
import { es } from 'date-fns/locale'

interface Worker {
  id: string
  name: string
  avatar_url?: string
  contactType?: string
  contactTypeId?: string
}

interface AttendanceRecord {
  workerId: string
  day: string
  status: 'full' | 'half'
}

interface CustomGradebookProps {
  workers?: Worker[]
  attendance?: AttendanceRecord[]
  startDate?: Date
  endDate?: Date
  hideWeekends?: boolean
  onHideWeekendsChange?: (hideWeekends: boolean) => void
  onExportAttendance?: () => void
}

const CustomGradebook: React.FC<CustomGradebookProps> = ({
  workers = [],
  attendance = [],
  startDate = new Date(),
  endDate = new Date(new Date().getFullYear() + 3, new Date().getMonth(), new Date().getDate()),
  hideWeekends = false,
  onHideWeekendsChange,
  onExportAttendance
}) => {
  // Generate date range
  const dateRange = React.useMemo(() => {
    const dates = eachDayOfInterval({ start: startDate, end: endDate })
    return hideWeekends ? dates.filter(date => !isWeekend(date)) : dates
  }, [startDate, endDate, hideWeekends])

  // Generate month headers for timeline
  const monthHeaders = React.useMemo(() => {
    const headers: { month: string; start: number; span: number }[] = []
    let currentMonth = ''
    let monthStart = 0
    let monthSpan = 0

    dateRange.forEach((date, index) => {
      const monthYear = format(date, 'MMMM yyyy', { locale: es })
      
      if (monthYear !== currentMonth) {
        // Save previous month if exists
        if (currentMonth && monthSpan > 0) {
          headers.push({
            month: currentMonth,
            start: monthStart,
            span: monthSpan
          })
        }
        
        // Start new month
        currentMonth = monthYear
        monthStart = index
        monthSpan = 1
      } else {
        monthSpan++
      }
    })

    // Add last month
    if (currentMonth && monthSpan > 0) {
      headers.push({
        month: currentMonth,
        start: monthStart,
        span: monthSpan
      })
    }

    return headers
  }, [dateRange])

  // Group workers by contact type
  const groupedWorkers = React.useMemo(() => {
    const groups: { [key: string]: Worker[] } = {}
    
    workers.forEach(worker => {
      const contactType = worker.contactType || 'Sin tipo'
      if (!groups[contactType]) {
        groups[contactType] = []
      }
      groups[contactType].push(worker)
    })

    return groups
  }, [workers])

  // Timeline element state
  const [timelineElement, setTimelineElement] = React.useState<HTMLDivElement | null>(null)

  // Get attendance status for a specific worker and date
  const getAttendanceStatus = (workerId: string, day: string) => {
    const record = attendance.find(a => a.workerId === workerId && a.day === day)
    return record?.status || null
  }

  // Drag functionality for timeline scrolling
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, scrollLeft: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!timelineElement) return
    setIsDragging(true)
    setDragStart({
      x: e.pageX - timelineElement.offsetLeft,
      scrollLeft: timelineElement.scrollLeft,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !timelineElement) return
    e.preventDefault()
    const x = e.pageX - timelineElement.offsetLeft
    const walk = (x - dragStart.x) * 2 // Scroll speed multiplier
    timelineElement.scrollLeft = dragStart.scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // Smooth scroll functionality for hover navigation
  const scrollIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  
  const startSmoothScroll = (direction: 'left' | 'right') => {
    if (scrollIntervalRef.current) return
    
    scrollIntervalRef.current = setInterval(() => {
      if (timelineElement) {
        const scrollAmount = direction === 'left' ? -2 : 2 // Small increments for smooth scroll
        timelineElement.scrollLeft += scrollAmount
      }
    }, 16) // ~60fps for smooth animation
  }

  const stopSmoothScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }
  }

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
  }, [])

  const getAttendanceColor = (status: string | null, isWeekendDay: boolean) => {
    if (isWeekendDay && !hideWeekends) {
      return "bg-gray-100 opacity-50"
    }
    switch (status) {
      case "full":
        return "bg-[var(--accent)]"
      case "half":
        return "bg-yellow-500"
      default:
        return "bg-gray-200"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Registro de Asistencia</CardTitle>
            <p className="text-sm text-muted-foreground">
              {workers.length} trabajadores • {dateRange.length} días
            </p>
          </div>
          
          {/* Export Button */}
          {onExportAttendance && (
            <Button onClick={onExportAttendance} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Jornada completa</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Media jornada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span>Sin asistencia</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative">
          {/* Gradebook Header */}
          <div className="flex border-b bg-muted/50">
            {/* Workers column header */}
            <div className="min-w-[300px] p-4 border-r font-medium bg-background">
              Trabajadores
            </div>
            
            {/* Month headers */}
            <div className="flex">
              {monthHeaders.map((header, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center font-medium text-sm bg-muted/30 border-r min-h-[56px] capitalize"
                  style={{ width: `${header.span * 40}px` }}
                >
                  {header.month}
                </div>
              ))}
            </div>
          </div>

          {/* Date headers row */}
          <div className="flex border-b bg-background">
            {/* Empty cell for workers column */}
            <div className="min-w-[300px] border-r"></div>
            
            {/* Timeline scroll container */}
            <div 
              ref={setTimelineElement}
              className="flex overflow-x-auto scrollbar-hide"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {/* Left scroll zone */}
              <div
                className="absolute left-0 top-0 w-8 h-full z-10 pointer-events-auto"
                onMouseEnter={() => startSmoothScroll('left')}
                onMouseLeave={stopSmoothScroll}
              />
              
              {/* Right scroll zone */}
              <div
                className="absolute right-0 top-0 w-8 h-full z-10 pointer-events-auto"
                onMouseEnter={() => startSmoothScroll('right')}
                onMouseLeave={stopSmoothScroll}
              />

              {dateRange.map((date, index) => {
                const isWeekendDay = isWeekend(date)
                const isTodayDate = isToday(date)
                
                return (
                  <div
                    key={index}
                    className={`
                      min-w-[40px] h-12 flex flex-col items-center justify-center text-xs border-r
                      ${isTodayDate ? 'bg-[var(--accent)] text-white font-medium' : 'bg-background'}
                      ${isWeekendDay ? 'bg-muted/50' : ''}
                    `}
                  >
                    <div className="leading-none">{format(date, 'd')}</div>
                    <div className="leading-none text-[10px] opacity-70">
                      {format(date, 'EEE', { locale: es }).slice(0, 3)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Workers rows */}
          <div className="max-h-[600px] overflow-y-auto">
            {Object.entries(groupedWorkers).map(([contactType, groupWorkers]) => (
              <div key={contactType}>
                {/* Group header */}
                <div className="flex bg-muted/30 border-b font-medium text-sm">
                  <div className="min-w-[300px] p-3 border-r">
                    {contactType}
                  </div>
                  <div className="flex-1"></div>
                </div>

                {/* Workers in this group */}
                {groupWorkers.map((worker) => (
                  <div key={worker.id} className="flex border-b hover:bg-muted/20">
                    {/* Worker info */}
                    <div className="min-w-[300px] p-3 border-r flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={worker.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {getInitials(worker.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{worker.name}</span>
                    </div>
                    
                    {/* Attendance cells */}
                    <div className="flex">
                      {dateRange.map((date, dateIndex) => {
                        const dayString = format(date, 'yyyy-MM-dd')
                        const status = getAttendanceStatus(worker.id, dayString)
                        const isWeekendDay = isWeekend(date)
                        
                        return (
                          <div
                            key={dateIndex}
                            className={`
                              min-w-[40px] h-12 border-r flex items-center justify-center
                              ${getAttendanceColor(status, isWeekendDay)}
                            `}
                          >
                            {status === 'full' && (
                              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              </div>
                            )}
                            {status === 'half' && (
                              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomGradebook