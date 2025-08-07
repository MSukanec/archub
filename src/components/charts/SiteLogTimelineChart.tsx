import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
            Línea Temporal de Bitácoras
          </CardTitle>
        </CardHeader>
        <CardContent>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
          <div>
              Línea Temporal de Bitácoras
            </CardTitle>
              Actividades registradas en {getTimePeriodLabel(timePeriod)}
            </p>
          </div>
          
          {/* Time period selector */}
          {onTimePeriodChange && (
            <Select value={timePeriod} onValueChange={onTimePeriodChange}>
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
      
        {/* Chart area - separated from dates */}
          {/* Custom timeline visualization */}
            {/* Y-axis labels - icons perfectly aligned with horizontal lines */}
              {displayCategories.map((category, index) => {
                // Perfect alignment: equal spacing across full height
                const topPosition = (index * 100) / (displayCategories.length - 1)
                return (
                  <div 
                    key={category.key} 
                    style={{ 
                      top: `${topPosition}%`,
                      transform: 'translateY(-50%)'
                    }}
                  >
                  </div>
                )
              })}
            </div>

            {/* Chart area */}
              {/* Horizontal grid lines - exactly aligned with icons */}
                {displayCategories.map((_, index) => {
                  // Same formula as icons for perfect alignment
                  const topPosition = (index * 100) / (displayCategories.length - 1)
                  return (
                    <div 
                      key={index} 
                      style={{ 
                        borderColor: 'var(--chart-grid-text)',
                        top: `${topPosition}%`
                      }} 
                    />
                  )
                })}
              </div>
              
              {/* Vertical grid lines - from first to last horizontal line */}
                {data.map((_, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      borderColor: 'var(--chart-grid-text)'
                    }} 
                  />
                ))}
              </div>

              {/* Data points - positioned exactly at grid intersections */}
                {data.map((dayData, dayIndex) => (
                    {displayCategories.map((category, categoryIndex) => {
                      const count = dayData[category.key as keyof SiteLogTimelineData] as number
                      // Same formula as icons and lines for perfect intersection positioning
                      const topPosition = (categoryIndex * 100) / (displayCategories.length - 1)
                      return (
                        <div 
                          key={category.key} 
                          style={{ 
                            top: `${topPosition}%`,
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          {count > 0 && (
                            <div
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
            {data.map((dayData, index) => (
                {dayData.date}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend with totals */}
          {categories.map(({ key, label, icon: Icon, color }) => (
              <div 
                style={{ backgroundColor: color }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}