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
        </CardContent>
      </Card>
    )
  }

  return (
        {/* Spacer to push content down */}
        
        {/* Icon and Title Section - positioned lower */}
            {icon && (
              <div style={{ color }}>
                {icon}
              </div>
            )}
              {title}
            </span>
          </div>
            {currencyCode}
          </Badge>
        </div>
        
        {/* Amount - smaller size like reference */}
          {formatter(value)}
        </div>
      </CardContent>
    </Card>
  )
}