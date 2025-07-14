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
      case 'days': return 'últimos 7 días'
      case 'weeks': return 'últimas 7 semanas'
      case 'months': return 'últimos 7 meses'
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
    { key: 'files', label: 'Archivos', icon: FileText, color: '#3b82f6' },
    { key: 'events', label: 'Eventos', icon: CalendarDays, color: '#10b981' },
    { key: 'attendees', label: 'Asistencias', icon: Users, color: '#f59e0b' },
    { key: 'equipment', label: 'Maquinarias', icon: Truck, color: '#8b5cf6' }
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
                  {period === 'days' ? 'DÍAS' : period === 'weeks' ? 'SEMANAS' : 'MESES'}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {categories.map(({ key, label, icon: Icon, color }) => (
            <Badge
              key={key}
              variant="secondary"
              className="flex items-center gap-1.5 px-2.5 py-1"
            >
              <Icon className="w-3 h-3" style={{ color }} />
              <span className="text-xs">{label}: {totals[key as keyof typeof totals]}</span>
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80">
          {/* Custom timeline visualization */}
          <div className="relative w-full h-full">
            {/* Y-axis labels - only icons */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-4">
              {displayCategories.map((category) => (
                <div key={category.key} className="flex items-center justify-center w-6">
                  <category.icon className="w-4 h-4" style={{ color: category.color }} />
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="ml-8 h-full relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between py-4">
                {displayCategories.map((_, index) => (
                  <div key={index} className="border-b border-border/30" />
                ))}
              </div>

              {/* X-axis (dates) */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-2">
                {data.map((dayData, index) => (
                  <div key={index} className="text-xs text-muted-foreground text-center min-w-0 flex-1">
                    {dayData.date}
                  </div>
                ))}
              </div>

              {/* Data points */}
              <div className="absolute inset-0 py-4">
                {data.map((dayData, dayIndex) => {
                  const leftPosition = data.length === 1 ? 50 : (dayIndex / (data.length - 1)) * 100
                  return (
                    <div key={dayIndex} className="absolute top-0 bottom-8" style={{ 
                      left: `${leftPosition}%`,
                      transform: 'translateX(-50%)'
                    }}>
                    <div className="h-full flex flex-col justify-between">
                      {displayCategories.map((category) => {
                        const count = dayData[category.key as keyof SiteLogTimelineData] as number
                        return (
                          <div key={category.key} className="flex items-center justify-center">
                            {count > 0 && (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white"
                                style={{ backgroundColor: category.color }}
                              >
                                {count}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border">
          {categories.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}