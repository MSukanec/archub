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
        return "bg-green-500"
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

  const currentMonth = format(startDate, 'MMMM yyyy', { locale: es })

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
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDates('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {currentMonth}
              </span>
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
        <div className="border-t">
          {/* Combined Header Row */}
          <div className="flex bg-muted/50 border-b">
            {/* Personnel Header */}
            <div className="flex-shrink-0 w-64 px-6 py-3 border-r">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Personal
              </span>
            </div>
            
            {/* Timeline Header - with padding to account for scrollbar */}
            <div className="flex-1 pr-4">
              <div className="overflow-x-auto">
                <div className="flex">
                  {dateRange.map((date) => {
                    const isTodayDate = isToday(date)
                    return (
                      <div key={date.getTime()} className={`px-3 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[40px] flex-shrink-0 relative ${isTodayDate ? 'bg-blue-50 text-blue-700 border-x-2 border-blue-400' : 'text-muted-foreground'}`}>
                        <div className="flex flex-col items-center">
                          <span className={isTodayDate ? 'font-bold' : ''}>{format(date, 'dd')}</span>
                          <span className={`text-[10px] ${isTodayDate ? 'font-semibold' : ''}`}>{format(date, 'EEE', { locale: es })}</span>
                        </div>
                        {isTodayDate && (
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-blue-500 z-10"></div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Combined Body Rows */}
          <div className="divide-y divide-border">
            {workers.map((worker, index) => (
              <div key={worker.id} className="flex hover:bg-muted/50">
                {/* Personnel Cell */}
                <div className="flex-shrink-0 w-64 px-6 py-4 bg-background border-r">
                  <div className="flex items-center">
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
                </div>

                {/* Timeline Cells - with padding to account for scrollbar */}
                <div className="flex-1 pr-4">
                  <div className="overflow-x-auto">
                    <div className="flex">
                      {dateRange.map((date) => {
                        const status = getAttendanceStatus(worker.id, date)
                        const isWeekendDay = isWeekend(date)
                        const isTodayDate = isToday(date)
                        return (
                          <div key={`${worker.id}-${date.getTime()}`} className={`px-3 py-4 text-center min-w-[40px] flex-shrink-0 relative ${isTodayDate ? 'bg-blue-50/30 border-x-2 border-blue-400' : ''}`}>
                            <div className={`w-6 h-6 rounded-full mx-auto ${getAttendanceColor(status, isWeekendDay)}`}>
                              {isWeekendDay && !hideWeekends && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-xs text-gray-400">×</span>
                                </div>
                              )}
                            </div>
                            {isTodayDate && (
                              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-blue-500 z-10 pointer-events-none"></div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomGradebook