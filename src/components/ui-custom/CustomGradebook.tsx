import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ChevronLeft, ChevronRight, Download, CalendarDays } from 'lucide-react'
import { format, addDays, eachDayOfInterval, isWeekend, isToday, startOfDay, subDays } from 'date-fns'
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
  onExportAttendance?: () => void
  triggerTodayCenter?: boolean
}

const CustomGradebook: React.FC<CustomGradebookProps> = ({
  workers = [],
  attendance = [],
  onExportAttendance,
  triggerTodayCenter = false
}) => {
  // Calculate date range automatically based on attendance data
  const { startDate, endDate } = React.useMemo(() => {
    if (!attendance || attendance.length === 0) {
      // Default range if no attendance data
      const today = new Date()
      return {
        startDate: subDays(today, 15),
        endDate: addDays(today, 15)
      }
    }

    // Find the earliest attendance date
    const attendanceDates = attendance.map(record => new Date(record.day)).sort((a, b) => a.getTime() - b.getTime())
    const firstAttendanceDate = attendanceDates[0]
    
    // Set start date as the first attendance date
    const calculatedStartDate = firstAttendanceDate
    // Set end date as exactly 1 year from the first attendance date
    const calculatedEndDate = addDays(firstAttendanceDate, 365)

    return {
      startDate: calculatedStartDate,
      endDate: calculatedEndDate
    }
  }, [attendance])

  // Generate date range
  const dateRange = React.useMemo(() => {
    const dates = eachDayOfInterval({ start: startDate, end: endDate })
    return dates
  }, [startDate, endDate])

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

  // Timeline element state - declared early to avoid reference errors
  const [timelineElement, setTimelineElement] = React.useState<HTMLDivElement | null>(null)
  
  // Auto-center on today when component loads
  const centerTimelineOnToday = React.useCallback(() => {
    if (timelineElement && dateRange.length > 0) {
      const todayIndex = dateRange.findIndex(date => isToday(date))
      if (todayIndex !== -1) {
        const columnWidth = 40
        const containerWidth = timelineElement.clientWidth
        const scrollPosition = (todayIndex * columnWidth) - (containerWidth / 2) + (columnWidth / 2)
        timelineElement.scrollLeft = Math.max(0, scrollPosition)
      }
    }
  }, [timelineElement, dateRange])

  // Auto-center on component load if today is in range
  React.useEffect(() => {
    if (timelineElement) {
      setTimeout(centerTimelineOnToday, 100)
    }
  }, [timelineElement, centerTimelineOnToday])

  // Center on today when triggered from parent component
  React.useEffect(() => {
    if (triggerTodayCenter && timelineElement) {
      setTimeout(centerTimelineOnToday, 100)
    }
  }, [triggerTodayCenter, timelineElement, centerTimelineOnToday])

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

  const getAttendanceStatus = (workerId: string, date: Date) => {
    const dayString = format(date, 'yyyy-MM-dd')
    const record = attendance.find(a => a.workerId === workerId && a.day === dayString)
    return record?.status || null
  }

  const getAttendanceColor = (status: string | null, isWeekendDay: boolean) => {
    if (isWeekendDay) {
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
          
          <div className="flex items-center gap-4">
            {/* Export Button */}
            {onExportAttendance && (
              <Button onClick={onExportAttendance} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
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
            <span>Ausente</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex border-t relative max-w-full overflow-hidden">
          {/* Fixed Personnel Names Column */}
          <div className="flex-shrink-0 w-64 bg-background border-r">
            {/* Header - matching timeline header height exactly (25px + 40px) */}
            <div className="bg-muted/50 border-b h-[65px] flex items-end px-6 pb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Asistencia
              </span>
            </div>
            
            {/* Personnel List - grouped by contact type */}
            <div>
              {Object.entries(groupedWorkers).map(([contactType, workersInGroup], groupIndex) => (
                <div key={contactType}>
                  {/* Contact Type Header */}
                  <div className="h-[20px] px-6 bg-muted/80 border-b border-border flex items-center">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {contactType} ({workersInGroup.length})
                    </span>
                  </div>
                  
                  {/* Workers in this contact type */}
                  {workersInGroup.map((worker, workerIndex) => {
                    const isLastWorkerInGroup = workerIndex === workersInGroup.length - 1
                    const isLastGroup = groupIndex === Object.keys(groupedWorkers).length - 1
                    const shouldShowBorder = !isLastWorkerInGroup || !isLastGroup
                    
                    return (
                      <div key={worker.id} className={`h-[65px] px-6 bg-background hover:bg-muted/50 flex items-center ${shouldShowBorder ? 'border-b border-border' : ''}`}>
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={worker.avatar_url} alt={worker.name} />
                          <AvatarFallback className="text-xs font-medium">
                            {getInitials(worker.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <div className="text-sm font-medium">{worker.name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Column with Drag Navigation */}
          <div className="flex-1 relative min-w-0 group">
            {/* Left Hover Area - Almost invisible, smooth scroll on hover */}
            <div
              className="absolute left-0 z-20 w-[15px] h-full bg-transparent hover:bg-muted/10 transition-all duration-300 cursor-pointer"
              style={{ 
                top: '65px',
                height: `calc(100% - 65px)`
              }}
              onMouseEnter={() => startSmoothScroll('left')}
              onMouseLeave={stopSmoothScroll}
            >
              <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-30 transition-opacity duration-300">
                <ChevronLeft className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>

            {/* Right Hover Area - Almost invisible, smooth scroll on hover */}
            <div
              className="absolute right-0 z-20 w-[15px] h-full bg-transparent hover:bg-muted/10 transition-all duration-300 cursor-pointer"
              style={{ 
                top: '65px',
                height: `calc(100% - 65px)`
              }}
              onMouseEnter={() => startSmoothScroll('right')}
              onMouseLeave={stopSmoothScroll}
            >
              <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-30 transition-opacity duration-300">
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>

            {/* Scrollable Timeline - hidden scrollbar */}
            <div 
              ref={(el) => {
                // Set timeline element for both auto-scroll and drag functionality
                setTimelineElement(el)
                
                // Only auto-center when explicitly requested (initial load or "Hoy" button)
                // This prevents unwanted centering during drag operations
              }}
              className={`overflow-x-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                userSelect: isDragging ? 'none' : 'auto'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              <table 
                style={{ 
                  minWidth: `${dateRange.length * 40}px`,
                  width: `${dateRange.length * 40}px`
                }}
              >
                {/* Timeline Header with Month Row */}
                <thead className="bg-muted/50 border-b">
                  {/* Month Headers Row */}
                  <tr className="h-[25px] border-b border-border/30">
                    {monthHeaders.map((monthHeader, index) => (
                      <th 
                        key={index}
                        colSpan={monthHeader.span}
                        className="px-1 text-center text-xs font-medium text-muted-foreground bg-muted/30 border-r border-border/20"
                      >
                        <span className="capitalize">{monthHeader.month}</span>
                      </th>
                    ))}
                  </tr>
                  
                  {/* Days Row */}
                  <tr className="h-[40px]">
                    {dateRange.map((date) => {
                      const isTodayDate = isToday(date)
                      return (
                        <th key={date.getTime()} className={`px-3 text-center text-xs font-medium uppercase tracking-wider min-w-[40px] relative ${isTodayDate ? 'bg-[var(--accent)]/50 text-[var(--accent)] border-x-2 border-[var(--accent)]' : 'text-muted-foreground'}`}>
                          <div className="flex flex-col items-center">
                            <span className={isTodayDate ? 'font-bold' : ''}>{format(date, 'dd')}</span>
                            <span className={`text-[10px] ${isTodayDate ? 'font-semibold' : ''}`}>{format(date, 'EEE', { locale: es })}</span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                
                {/* Timeline Body - matching grouped personnel structure */}
                <tbody className="bg-background">
                  {Object.entries(groupedWorkers).map(([contactType, workersInGroup], groupIndex) => (
                    <React.Fragment key={contactType}>
                      {/* Contact Type Header Row */}
                      <tr className="h-[20px] bg-muted/80 border-b border-border">
                        {dateRange.map((date) => {
                          const isTodayDate = isToday(date)
                          return (
                            <td key={`${contactType}-header-${date.getTime()}`} className={`px-3 text-center bg-muted/80 ${isTodayDate ? 'bg-[var(--accent)]/10 border-x-2 border-[var(--accent)]' : ''}`}>
                              {/* Empty cells for contact type header */}
                            </td>
                          )
                        })}
                      </tr>
                      
                      {/* Worker Rows for this contact type */}
                      {workersInGroup.map((worker, workerIndex) => {
                        const isLastWorkerInGroup = workerIndex === workersInGroup.length - 1
                        const isLastGroup = groupIndex === Object.keys(groupedWorkers).length - 1
                        const shouldShowBorder = !isLastWorkerInGroup || !isLastGroup
                        
                        return (
                          <tr key={worker.id} className={`h-[65px] hover:bg-muted/50 ${shouldShowBorder ? 'border-b border-border' : ''}`}>
                            {dateRange.map((date) => {
                              const status = getAttendanceStatus(worker.id, date)
                              const isWeekendDay = isWeekend(date)
                              const isTodayDate = isToday(date)
                              return (
                                <td key={`${worker.id}-${date.getTime()}`} className={`px-3 text-center relative ${isTodayDate ? 'bg-[var(--accent)]/50 border-x-2 border-[var(--accent)]' : ''}`}>
                                  <div className={`w-6 h-6 rounded-full mx-auto ${getAttendanceColor(status, isWeekendDay)}`}>
                                    {isWeekendDay && (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-xs text-gray-400">×</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomGradebook