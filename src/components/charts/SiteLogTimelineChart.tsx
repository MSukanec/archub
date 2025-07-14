import { useState, useRef, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, CalendarDays, Users, Truck, ChevronLeft, ChevronRight } from 'lucide-react'

interface SiteLogTimelineData {
  date: string
  files: number
  events: number
  attendees: number
  equipment: number
}

interface SiteLogTimelineChartProps {
  data: SiteLogTimelineData[]
  isLoading?: boolean
  timePeriod: 'days' | 'weeks' | 'months'
  onTimePeriodChange?: (period: 'days' | 'weeks' | 'months') => void
}

type TimePeriod = 'days' | 'weeks' | 'months'

export function SiteLogTimelineChart({ data, isLoading, timePeriod, onTimePeriodChange }: SiteLogTimelineChartProps) {
  // Drag functionality for timeline scrolling
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 })
  const [timelineElement, setTimelineElement] = useState<HTMLDivElement | null>(null)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const getTimePeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'days': return 'últimas 7 semanas'
      case 'weeks': return 'últimos 7 meses'
      case 'months': return 'últimos 7 trimestres'
      default: return 'período'
    }
  }

  // Calculate totals for summary
  const totals = data.reduce(
    (acc, item) => ({
      files: acc.files + item.files,
      events: acc.events + item.events,
      attendees: acc.attendees + item.attendees,
      equipment: acc.equipment + item.equipment
    }),
    { files: 0, events: 0, attendees: 0, equipment: 0 }
  )

  // Y-axis categories (from bottom to top in display order)
  const categories = [
    { key: 'files', label: 'Archivos', icon: FileText, color: 'var(--chart-1)' },
    { key: 'events', label: 'Eventos', icon: CalendarDays, color: 'var(--chart-2)' },
    { key: 'attendees', label: 'Asistencias', icon: Users, color: 'var(--chart-3)' },
    { key: 'equipment', label: 'Maquinarias', icon: Truck, color: 'var(--chart-4)' }
  ]

  // Categories in reverse order for display (top to bottom: Maquinarias, Asistencias, Eventos, Archivos)
  const displayCategories = [...categories].reverse()

  // Drag functionality handlers
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            Línea Temporal de Bitácoras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-muted h-12 w-12"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </div>
              <p className="mt-3 text-sm">Cargando línea temporal...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Línea Temporal de Bitácoras
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Actividades registradas en {getTimePeriodLabel(timePeriod)}
            </p>
          </div>
          
          {/* Time period selector */}
          {onTimePeriodChange && (
            <Select value={timePeriod} onValueChange={onTimePeriodChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">SEMANAS</SelectItem>
                <SelectItem value="weeks">MESES</SelectItem>
                <SelectItem value="months">TRIMESTRES</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        

      </CardHeader>
      
      <CardContent className="pt-8">
        {/* Timeline Container with Drag Navigation */}
        <div className="relative pb-8">
          {/* Y-axis labels - fixed position, doesn't scroll */}
          <div className="absolute left-0 top-0 z-10 h-32">
            {displayCategories.map((category, index) => {
              const topPosition = (index * 100) / (displayCategories.length - 1)
              return (
                <div 
                  key={category.key} 
                  className="absolute flex items-center justify-center w-6 bg-background"
                  style={{ 
                    top: `${topPosition}%`,
                    transform: 'translateY(-50%)'
                  }}
                >
                  <category.icon className="w-4 h-4" style={{ color: category.color }} />
                </div>
              )
            })}
          </div>

          {/* Left Hover Area - for scroll navigation */}
          <div
            className="absolute left-8 z-20 w-[15px] h-32 bg-transparent hover:bg-muted/10 transition-all duration-300 cursor-pointer"
            onMouseEnter={() => startSmoothScroll('left')}
            onMouseLeave={stopSmoothScroll}
          >
            <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-30 transition-opacity duration-300">
              <ChevronLeft className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>

          {/* Right Hover Area - for scroll navigation */}
          <div
            className="absolute right-0 z-20 w-[15px] h-32 bg-transparent hover:bg-muted/10 transition-all duration-300 cursor-pointer"
            onMouseEnter={() => startSmoothScroll('right')}
            onMouseLeave={stopSmoothScroll}
          >
            <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-30 transition-opacity duration-300">
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>

          {/* Scrollable Timeline Container */}
          <div className="ml-8 relative">
            <div 
              ref={setTimelineElement}
              className={`overflow-x-auto h-32 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} [&::-webkit-scrollbar]:hidden`}
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
              {/* Timeline content with fixed width */}
              <div 
                className="relative h-full"
                style={{ 
                  minWidth: `${Math.max(data.length * 80, 800)}px`,
                  width: `${Math.max(data.length * 80, 800)}px`
                }}
              >
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 h-full">
                  {displayCategories.map((_, index) => {
                    const topPosition = (index * 100) / (displayCategories.length - 1)
                    return (
                      <div 
                        key={index} 
                        className="absolute border-b border-dashed opacity-30 w-full" 
                        style={{ 
                          borderColor: 'var(--chart-grid-text)',
                          top: `${topPosition}%`
                        }} 
                      />
                    )
                  })}
                </div>
                
                {/* Vertical grid lines */}
                <div className="absolute inset-0 flex justify-around">
                  {data.map((_, index) => (
                    <div 
                      key={index} 
                      className="border-l border-dashed opacity-30 h-full" 
                      style={{ 
                        borderColor: 'var(--chart-grid-text)'
                      }} 
                    />
                  ))}
                </div>

                {/* Data points */}
                <div className="absolute inset-0 flex justify-around">
                  {data.map((dayData, dayIndex) => (
                    <div key={dayIndex} className="h-full relative">
                      {displayCategories.map((category, categoryIndex) => {
                        const count = dayData[category.key as keyof SiteLogTimelineData] as number
                        const topPosition = (categoryIndex * 100) / (displayCategories.length - 1)
                        return (
                          <div 
                            key={category.key} 
                            className="absolute flex items-center justify-center"
                            style={{ 
                              top: `${topPosition}%`,
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            {count > 0 && (
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white"
                                style={{ backgroundColor: category.color }}
                              >
                                {count}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* X-axis (dates) - scrolls with content */}
                <div className="absolute top-full pt-4 w-full">
                  <div className="flex justify-around">
                    {data.map((dayData, index) => (
                      <div key={index} className="text-xs text-muted-foreground text-center flex-1">
                        {dayData.date}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend with totals */}
        <div className="flex flex-wrap gap-4 mt-8 pt-4 border-t border-border">
          {categories.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-sm text-muted-foreground">{label}: {totals[key as keyof typeof totals]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}