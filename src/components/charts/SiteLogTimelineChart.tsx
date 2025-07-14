import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, CalendarDays, Users, Truck } from 'lucide-react'

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
            <div className="flex gap-1">
              {(['days', 'weeks', 'months'] as TimePeriod[]).map((period) => (
                <Button
                  key={period}
                  variant={timePeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onTimePeriodChange(period)}
                  className="text-xs"
                >
                  {period === 'days' ? 'SEMANAS' : period === 'weeks' ? 'MESES' : 'TRIMESTRES'}
                </Button>
              ))}
            </div>
          )}
        </div>
        

      </CardHeader>
      
      <CardContent className="pt-8">
        {/* Chart area - separated from dates */}
        <div className="h-32">
          {/* Custom timeline visualization */}
          <div className="relative w-full h-full">
            {/* Y-axis labels - icons perfectly aligned with horizontal lines */}
            <div className="absolute left-0 top-0 h-full">
              {displayCategories.map((category, index) => {
                // Perfect alignment: equal spacing across full height
                const topPosition = (index * 100) / (displayCategories.length - 1)
                return (
                  <div 
                    key={category.key} 
                    className="absolute flex items-center justify-center w-6"
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

            {/* Chart area */}
            <div className="ml-8 h-full relative">
              {/* Horizontal grid lines - exactly aligned with icons */}
              <div className="absolute inset-0 h-full">
                {displayCategories.map((_, index) => {
                  // Same formula as icons for perfect alignment
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
              
              {/* Vertical grid lines - from first to last horizontal line */}
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

              {/* Data points - positioned exactly at grid intersections */}
              <div className="absolute inset-0 flex justify-around">
                {data.map((dayData, dayIndex) => (
                  <div key={dayIndex} className="h-full relative">
                    {displayCategories.map((category, categoryIndex) => {
                      const count = dayData[category.key as keyof SiteLogTimelineData] as number
                      // Same formula as icons and lines for perfect intersection positioning
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
            </div>
          </div>
        </div>

        {/* X-axis (dates) - BELOW the chart, perfectly aligned with vertical lines */}
        <div className="relative">
          <div className="ml-8 flex justify-around pt-6">
            {data.map((dayData, index) => (
              <div key={index} className="text-xs text-muted-foreground text-center flex-1">
                {dayData.date}
              </div>
            ))}
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