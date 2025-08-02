import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MiniTrendChart } from './MiniTrendChart'

interface SubcontractKPICardProps {
  title: string
  value: number
  subtitle?: string
  icon?: React.ReactNode
  trend?: { value: number }[]
  color?: string
  isLoading?: boolean
  formatter?: (value: number) => string
}

export function SubcontractKPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'hsl(var(--chart-1))',
  isLoading = false,
  formatter = (val) => new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(val)
}: SubcontractKPICardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted/20 rounded animate-pulse mb-2" />
          <div className="h-4 bg-muted/20 rounded animate-pulse mb-2" />
          <div className="h-12 bg-muted/20 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div style={{ color }}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color }}>
          {formatter(value)}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {trend && trend.length > 0 && (
          <div className="mt-4">
            <MiniTrendChart 
              data={trend} 
              color={color}
              isLoading={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}