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

interface AttendanceGradebookProps {
  workers?: Worker[]
  attendance?: AttendanceRecord[]
  onExportAttendance?: () => void
  triggerTodayCenter?: boolean
  onEditAttendance?: (workerId: string, date: Date, existingAttendance?: any) => void // New prop for editing attendance
}

const AttendanceGradebook: React.FC<AttendanceGradebookProps> = ({
  workers = [],
  attendance = [],
  onExportAttendance,
  triggerTodayCenter = false,
  onEditAttendance
}) => {
  // Calculate date range: show 3 days before today and 3 days after
  const { startDate, endDate } = React.useMemo(() => {
    const today = new Date()
    
    if (!attendance || attendance.length === 0) {
      // Default range: 3 days before and 3 days after today
      return {
        startDate: subDays(today, 3),
        endDate: addDays(today, 3)
      }
    }

    // Find the earliest attendance date
    const attendanceDates = attendance.map(record => new Date(record.day)).sort((a, b) => a.getTime() - b.getTime())
    const firstAttendanceDate = attendanceDates[0]
    
    // Start from the earliest attendance date or 3 days before today (whichever is earlier)
    const threesDaysAgo = subDays(today, 3)
    const calculatedStartDate = firstAttendanceDate < threesDaysAgo ? firstAttendanceDate : threesDaysAgo
    
    // End at 3 days after today
    const calculatedEndDate = addDays(today, 3)

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
    
    // If no workers, return empty groups but preserve structure for timeline
    if (workers.length === 0) {
      return {}
    }
    
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
  
  // Center timeline on today - for both initial load and HOY button
  const centerTimelineOnToday = React.useCallback(() => {
    if (timelineElement && dateRange.length > 0) {
      const todayIndex = dateRange.findIndex(date => isToday(date))
      if (todayIndex !== -1) {
        const columnWidth = 65 // Updated to match new column width
        const containerWidth = timelineElement.clientWidth
        const scrollPosition = (todayIndex * columnWidth) - (containerWidth / 2) + (columnWidth / 2)
        timelineElement.scrollLeft = Math.max(0, scrollPosition)
      }
    }
  }, [timelineElement, dateRange])

  // Auto-center on component load
  React.useEffect(() => {
    if (timelineElement) {
      setTimeout(centerTimelineOnToday, 100)
    }
  }, [timelineElement, centerTimelineOnToday])

  // Center on today when HOY button is triggered (responds to any change in triggerTodayCenter)
  React.useEffect(() => {
    if (timelineElement) {
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
    <div className="relative border border-border rounded-lg overflow-hidden bg-card w-full">
      {/* Header with title and export */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--table-header-border)] bg-[var(--table-header-bg)] flex-wrap gap-2">
        <div className="min-w-0">
          <h3 className="text-sm text-[var(--table-header-fg)]">Registro de Asistencia</h3>
          <p className="text-sm text-[var(--table-header-fg)]">
            {workers.length} trabajadores • {dateRange.length} días
          </p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          {/* Legend */}
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm flex-wrap">
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--accent)]"></div>
              <span className="text-[var(--table-header-fg)] whitespace-nowrap">Completa</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-[var(--table-header-fg)] whitespace-nowrap">Media</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span className="text-[var(--table-header-fg)] whitespace-nowrap">Ausente</span>
            </div>
          </div>

          {/* Export Button */}
          {onExportAttendance && (
            <Button onClick={onExportAttendance} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      </div>
      {/* Unified Header Row - matching Gantt design */}
      <div className="flex border-b border-[var(--table-header-border)] bg-[var(--table-header-bg)] min-w-0">
        {/* Left Panel Header - Personnel */}
        <div className="flex-shrink-0 w-48 md:w-64 border-r border-[var(--table-header-border)] h-14 flex bg-[var(--table-header-bg)]">
          <div className="px-2 md:px-4 flex items-center font-medium text-xs text-[var(--table-header-fg)] uppercase tracking-wider">
            Personal / Asistencia
          </div>
        </div>

        {/* Timeline Header - Days */}
        <div 
          className="flex-1 overflow-x-auto" 
          id="timeline-header-scroll"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          onScroll={(e) => {
            const contentScroll = document.getElementById('timeline-content-scroll');
            if (contentScroll) {
              contentScroll.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
        >
          <style>
            {`
              #timeline-header-scroll::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          <div style={{ width: `${dateRange.length * 65}px` }}>
            {/* Month Headers Row */}
            <div className="flex h-6">
              {monthHeaders.map((monthHeader, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-center text-xs font-medium text-[var(--table-header-fg)] border-r border-[var(--table-header-border)]/30 last:border-r-0"
                  style={{ width: `${monthHeader.span * 65}px` }}
                >
                  <span className="capitalize">{monthHeader.month}</span>
                </div>
              ))}
            </div>
            
            {/* Days Row */}
            <div className="flex h-8 border-t border-[var(--table-header-border)]">
              {dateRange.map((date) => {
                const isTodayDate = isToday(date)
                const isWeekendDay = isWeekend(date)
                return (
                  <div 
                    key={date.getTime()} 
                    className={`flex items-center justify-center text-xs font-medium border-r border-[var(--table-header-border)]/30 last:border-r-0 ${
                      isWeekendDay 
                        ? 'text-[var(--table-header-fg)]/60' 
                        : 'text-[var(--table-header-fg)]'
                    } ${isTodayDate ? 'bg-[var(--accent)] text-white' : ''}`}
                    style={{ width: '65px', minWidth: '65px' }}
                  >
                    {format(date, 'EEE d', { locale: es })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex min-w-0">
        {/* Fixed Personnel Names Column */}
        <div className="flex-shrink-0 w-48 md:w-64 bg-[var(--table-header-bg)] border-r border-border overflow-hidden">
          {/* Personnel List - grouped by contact type */}
          <div>
              {Object.entries(groupedWorkers).length > 0 ? (
                Object.entries(groupedWorkers).map(([contactType, workersInGroup], groupIndex) => (
                  <div key={contactType}>
                    {/* Contact Type Header */}
                    <div className="h-12 px-2 md:px-4 bg-[var(--table-row-bg)] border-b border-[var(--table-row-border)] flex items-center">
                      <span className="text-xs font-medium uppercase tracking-wider text-[var(--table-row-fg)] truncate">
                        {contactType} ({workersInGroup.length})
                      </span>
                    </div>
                    
                    {/* Workers in this contact type */}
                    {workersInGroup.map((worker, workerIndex) => {
                      const isLastWorkerInGroup = workerIndex === workersInGroup.length - 1
                      const isLastGroup = groupIndex === Object.keys(groupedWorkers).length - 1
                      const shouldShowBorder = !isLastWorkerInGroup || !isLastGroup
                      
                      return (
                        <div key={worker.id} className={`h-12 px-2 md:px-4 bg-[var(--table-row-bg)] hover:bg-[var(--table-row-hover-bg)] transition-colors flex items-center ${shouldShowBorder ? 'border-b border-[var(--table-row-border)]' : ''}`}>
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={worker.avatar_url} alt={worker.name} />
                            <AvatarFallback className="text-xs font-medium">
                              {getInitials(worker.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-2 md:ml-3 min-w-0 flex-1">
                            <div className="text-xs md:text-sm font-medium text-[var(--table-row-fg)] truncate">{worker.name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="h-32 flex items-center justify-center text-[var(--table-row-fg)] text-sm">
                  No se encontraron resultados
                </div>
              )}
            </div>
          </div>

        {/* Timeline Content with synchronized scrolling */}
        <div 
          ref={setTimelineElement}
          className="flex-1 overflow-x-scroll gantt-timeline-scroll relative" 
          id="timeline-content-scroll"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: 'var(--accent) var(--table-header-bg)'
          }}
          onScroll={(e) => {
            const headerScroll = document.getElementById('timeline-header-scroll');
            if (headerScroll) {
              headerScroll.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
        >
          <div style={{ width: `${dateRange.length * 65}px` }}>
            {/* Timeline Content - matching Gantt design */}
            {Object.entries(groupedWorkers).length > 0 ? (
              Object.entries(groupedWorkers).map(([contactType, workersInGroup], groupIndex) => (
                <div key={contactType}>
                  {/* Contact Type Header Row */}
                  <div className="h-12 border-b border-[var(--table-row-border)] bg-[var(--table-row-bg)] flex">
                    {dateRange.map((date) => {
                      const isTodayDate = isToday(date)
                      return (
                        <div 
                          key={`${contactType}-header-${date.getTime()}`} 
                          className={`flex items-center justify-center border-r border-[var(--table-row-border)]/30 last:border-r-0 ${isTodayDate ? 'bg-[var(--accent)]/20 border-l-2 border-r-2 border-[var(--accent)]' : ''}`}
                          style={{ width: '65px', minWidth: '65px' }}
                        >
                          {/* Empty space for contact type header */}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Worker Rows for this contact type */}
                  {workersInGroup.map((worker, workerIndex) => {
                    const isLastWorkerInGroup = workerIndex === workersInGroup.length - 1
                    const isLastGroup = groupIndex === Object.keys(groupedWorkers).length - 1
                    const shouldShowBorder = !isLastWorkerInGroup || !isLastGroup
                    
                    return (
                      <div 
                        key={worker.id} 
                        className={`h-12 flex bg-[var(--table-row-bg)] hover:bg-[var(--table-row-hover-bg)] transition-colors ${shouldShowBorder ? 'border-b border-[var(--table-row-border)]' : ''}`}
                      >
                        {dateRange.map((date) => {
                          const status = getAttendanceStatus(worker.id, date)
                          const isWeekendDay = isWeekend(date)
                          const isTodayDate = isToday(date)
                          return (
                            <div 
                              key={`${worker.id}-${date.getTime()}`} 
                              className={`flex items-center justify-center border-r border-[var(--table-row-border)]/30 last:border-r-0 ${isTodayDate ? 'bg-[var(--accent)]/20 border-l-2 border-r-2 border-[var(--accent)]' : ''}`}
                              style={{ width: '65px', minWidth: '65px' }}
                            >
                              {isWeekendDay ? (
                                <div className={`w-6 h-6 rounded-full ${getAttendanceColor(status, isWeekendDay)} flex items-center justify-center`}>
                                  <span className="text-xs text-gray-400">×</span>
                                </div>
                              ) : (
                                <button
                                  className={`w-6 h-6 rounded-full ${getAttendanceColor(status, isWeekendDay)} hover:scale-110 transition-transform duration-200 cursor-pointer border-2 border-transparent hover:border-white/30`}
                                  onClick={() => {
                                    if (onEditAttendance) {
                                      const attendanceRecord = attendance.find(a => 
                                        a.workerId === worker.id && a.day === format(date, 'yyyy-MM-dd')
                                      );
                                      onEditAttendance(worker.id, date, attendanceRecord);
                                    }
                                  }}
                                  title={`Editar asistencia de ${worker.name} - ${format(date, 'dd/MM/yyyy')}`}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="h-32 flex items-center justify-center">
                <span className="text-[var(--table-row-fg)] text-sm">No se encontraron resultados</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendanceGradebook