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
  onStartDateChange?: (date: Date) => void
  onEndDateChange?: (date: Date) => void
  onHideWeekendsChange?: (hideWeekends: boolean) => void
  onExportAttendance?: () => void
}

const CustomGradebook: React.FC<CustomGradebookProps> = ({
  workers = [],
  attendance = [],
  startDate = subDays(new Date(), 15), // Default: 15 days before today
  endDate = addDays(new Date(), 15),   // Default: 15 days after today
  hideWeekends = false,
  onStartDateChange,
  onEndDateChange,
  onHideWeekendsChange,
  onExportAttendance
}) => {
  // Generate date range
  const dateRange = React.useMemo(() => {
    const dates = eachDayOfInterval({ start: startDate, end: endDate })
    return hideWeekends ? dates.filter(date => !isWeekend(date)) : dates
  }, [startDate, endDate, hideWeekends])

  // Navigate dates
  const navigateDates = (direction: 'prev' | 'next') => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (direction === 'prev') {
      const newStart = addDays(startDate, -days)
      const newEnd = addDays(endDate, -days)
      onStartDateChange?.(newStart)
      onEndDateChange?.(newEnd)
    } else {
      const newStart = addDays(startDate, days)
      const newEnd = addDays(endDate, days)
      onStartDateChange?.(newStart)
      onEndDateChange?.(newEnd)
    }
  }

  // Navigate to today
  const navigateToToday = () => {
    const today = startOfDay(new Date())
    const newStart = subDays(today, 15)
    const newEnd = addDays(today, 15)
    onStartDateChange?.(newStart)
    onEndDateChange?.(newEnd)
  }

  // Handle date input changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = new Date(e.target.value)
    if (!isNaN(newStart.getTime())) {
      onStartDateChange?.(newStart)
    }
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = new Date(e.target.value)
    if (!isNaN(newEnd.getTime())) {
      onEndDateChange?.(newEnd)
    }
  }

  const getAttendanceStatus = (workerId: string, date: Date) => {
    const dayString = format(date, 'yyyy-MM-dd')
    const record = attendance.find(a => a.workerId === workerId && a.day === dayString)
    return record?.status || null
  }

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
          
          <div className="flex items-center gap-4">
            {/* Date Range Controls */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigateDates('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="start-date" className="text-xs text-muted-foreground">Desde:</Label>
                <input
                  id="start-date"
                  type="date"
                  value={format(startDate, 'yyyy-MM-dd')}
                  onChange={handleStartDateChange}
                  className="text-xs border border-border rounded px-2 py-1 bg-background"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="end-date" className="text-xs text-muted-foreground">Hasta:</Label>
                <input
                  id="end-date"
                  type="date"
                  value={format(endDate, 'yyyy-MM-dd')}
                  onChange={handleEndDateChange}
                  className="text-xs border border-border rounded px-2 py-1 bg-background"
                />
              </div>
              
              <Button variant="outline" size="sm" onClick={() => navigateDates('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={navigateToToday}>
                <CalendarDays className="w-4 h-4 mr-1" />
                Hoy
              </Button>
            </div>

            {/* Weekend Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="hide-weekends"
                checked={hideWeekends}
                onCheckedChange={onHideWeekendsChange}
              />
              <Label htmlFor="hide-weekends" className="text-sm">
                Ocultar fines de semana
              </Label>
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
            {/* Header - matching timeline header height exactly */}
            <div className="bg-muted/50 border-b h-[65px] flex items-center px-6">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Personal
              </span>
            </div>
            
            {/* Personnel List - matching timeline row heights exactly */}
            <div>
              {workers.map((worker, index) => (
                <div key={worker.id} className={`h-[65px] px-6 bg-background hover:bg-muted/50 flex items-center ${index < workers.length - 1 ? 'border-b border-border' : ''}`}>
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
              ))}
            </div>
          </div>

          {/* Timeline Column with Navigation */}
          <div className="flex-1 relative min-w-0">
            {/* Left Navigation Button - Circular - Positioned in middle of data rows only */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 z-20 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm border border-border hover:bg-muted shadow-sm"
              style={{ 
                top: `calc(65px + ${workers.length * 65 / 2}px)`,
                transform: 'translateY(-50%)'
              }}
              onClick={() => navigateDates('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Right Navigation Button - Circular - Positioned in middle of data rows only */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 z-20 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm border border-border hover:bg-muted shadow-sm"
              style={{ 
                top: `calc(65px + ${workers.length * 65 / 2}px)`,
                transform: 'translateY(-50%)'
              }}
              onClick={() => navigateDates('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Scrollable Timeline - hidden scrollbar */}
            <div 
              ref={(el) => {
                if (el && dateRange.length > 0) {
                  // Find today's column index
                  const todayIndex = dateRange.findIndex(date => isToday(date))
                  if (todayIndex !== -1) {
                    // Center today's column horizontally
                    const columnWidth = 40
                    const containerWidth = el.clientWidth
                    const scrollPosition = (todayIndex * columnWidth) - (containerWidth / 2) + (columnWidth / 2)
                    el.scrollLeft = Math.max(0, scrollPosition)
                  }
                }
              }}
              className="overflow-x-auto" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <table 
                style={{ 
                  minWidth: `${dateRange.length * 40}px`,
                  width: `${dateRange.length * 40}px`
                }}
              >
                {/* Timeline Header - exact height match */}
                <thead className="bg-muted/50 border-b">
                  <tr className="h-[65px]">
                    {dateRange.map((date) => {
                      const isTodayDate = isToday(date)
                      return (
                        <th key={date.getTime()} className={`px-3 text-center text-xs font-medium uppercase tracking-wider min-w-[40px] relative ${isTodayDate ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-x-2 border-[var(--accent)]' : 'text-muted-foreground'}`}>
                          <div className="flex flex-col items-center">
                            <span className={isTodayDate ? 'font-bold' : ''}>{format(date, 'dd')}</span>
                            <span className={`text-[10px] ${isTodayDate ? 'font-semibold' : ''}`}>{format(date, 'EEE', { locale: es })}</span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                
                {/* Timeline Body - exact height match */}
                <tbody className="bg-background">
                  {workers.map((worker, index) => (
                    <tr key={worker.id} className={`h-[65px] hover:bg-muted/50 ${index < workers.length - 1 ? 'border-b border-border' : ''}`}>
                      {dateRange.map((date) => {
                        const status = getAttendanceStatus(worker.id, date)
                        const isWeekendDay = isWeekend(date)
                        const isTodayDate = isToday(date)
                        return (
                          <td key={`${worker.id}-${date.getTime()}`} className={`px-3 text-center relative ${isTodayDate ? 'bg-[var(--accent)]/5 border-x-2 border-[var(--accent)]' : ''}`}>
                            <div className={`w-6 h-6 rounded-full mx-auto ${getAttendanceColor(status, isWeekendDay)}`}>
                              {isWeekendDay && !hideWeekends && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-xs text-gray-400">×</span>
                                </div>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
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