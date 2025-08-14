import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface ConstructionKPICardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  loading?: boolean
  subtitle?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

export function ConstructionKPICard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  loading = false,
  subtitle,
  color = 'primary'
}: ConstructionKPICardProps) {
  const getColorStyles = () => {
    switch (color) {
      case 'success':
        return {
          iconBg: 'var(--chart-positive)',
          valueColor: 'var(--chart-positive)'
        }
      case 'warning':
        return {
          iconBg: 'var(--chart-4)',
          valueColor: 'var(--chart-4)'
        }
      case 'danger':
        return {
          iconBg: 'var(--chart-5)',
          valueColor: 'var(--chart-5)'
        }
      case 'secondary':
        return {
          iconBg: 'var(--chart-2)',
          valueColor: 'var(--chart-2)'
        }
      default:
        return {
          iconBg: 'var(--chart-1)',
          valueColor: 'var(--chart-1)'
        }
    }
  }

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'var(--chart-positive)'
      case 'negative':
        return 'var(--chart-negative)'
      default:
        return 'var(--chart-neutral)'
    }
  }

  const colorStyles = getColorStyles()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${colorStyles.iconBg}20` }}
                >
                  <Icon 
                    className="h-5 w-5" 
                    style={{ color: colorStyles.iconBg }}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colorStyles.valueColor }}
                >
                  {loading ? '...' : value}
                </p>
                {change && !loading && (
                  <p 
                    className="text-sm font-medium"
                    style={{ color: getChangeColor() }}
                  >
                    {change}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}