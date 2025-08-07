import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { MiniTrendChart } from './MiniTrendChart'
import { Badge } from '@/components/ui/badge'
import { formatIntlCurrency } from '@/lib/currency-formatter'

interface SubcontractKPICardProps {
  title: string
  value: number
  subtitle?: string
  icon?: React.ReactNode
  trend?: { value: number }[]
  color?: string
  isLoading?: boolean
  formatter?: (value: number) => string
  currencyCode?: string
}

export function SubcontractKPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'var(--chart-1)',
  isLoading = false,
  formatter = (val) => formatIntlCurrency(val, currencyCode),
  currencyCode = 'ARS'
}: SubcontractKPICardProps) {
  if (isLoading) {
    return (
      <Card className="h-full relative overflow-hidden">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="h-12 bg-muted/20 rounded animate-pulse mb-4" />
          <div className="flex-1"></div>
          <div className="h-4 bg-muted/20 rounded animate-pulse mb-2" />
          <div className="h-6 bg-muted/20 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full relative overflow-hidden">
      <CardContent className="p-4 h-full flex flex-col">
        {/* Spacer to push content down */}
        <div className="flex-1"></div>
        
        {/* Icon and Title Section - positioned lower */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon && (
              <div style={{ color }}>
                {icon}
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              {title}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {currencyCode}
          </Badge>
        </div>
        
        {/* Amount - smaller size like reference */}
        <div className="text-lg font-bold" style={{ color }}>
          {formatter(value)}
        </div>
      </CardContent>
    </Card>
  )
}