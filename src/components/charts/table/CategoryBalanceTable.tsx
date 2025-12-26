import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'
export interface CategoryBalanceRow {
  primaryLabel: string
  primaryIcon?: LucideIcon
  secondaryLabel: string
  secondaryIcon?: LucideIcon
  value: string
  valueVariant: 'positive'| 'negative'| 'neutral'
}
interface CategoryBalanceTableProps {
  columns: [string, string, string]
  data: CategoryBalanceRow[]
  isLoading?: boolean
  emptyMessage?: string
  emptyIcon?: LucideIcon
}
export function CategoryBalanceTable({ 
  columns,
  data, 
  isLoading,
  emptyMessage = 'No data available',
  emptyIcon: EmptyIcon
}: CategoryBalanceTableProps) {
  const getValueColor = (variant: CategoryBalanceRow['valueVariant']) => {
    switch (variant) {
      case 'positive':
        return 'text-chart-positive'
      case 'negative':
        return 'text-chart-negative'
      case 'neutral':
      default:
        return 'text-muted-foreground'
    }
  }
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
          {columns.map((col, i) => (
            <span key={i}>{col}</span>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-3 gap-4 text-sm animate-pulse">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          {EmptyIcon && <EmptyIcon className="h-8 w-8 text-muted-foreground/50" />}
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
        {columns.map((col, i) => (
          <span key={i}>{col}</span>
        ))}
      </div>
      <div className="space-y-2 max-h-[240px] overflow-y-auto">
        {data.map((item, index) => {
          const PrimaryIcon = item.primaryIcon
          const SecondaryIcon = item.secondaryIcon
          
          return (
            <div key={index} className="grid grid-cols-3 gap-4 text-sm items-center py-2">
              <div className="flex items-center gap-2">
                {PrimaryIcon && <PrimaryIcon className="h-4 w-4 text-muted-foreground" />}
                <span className="font-mono font-semibold">{item.primaryLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                {SecondaryIcon && <SecondaryIcon className="h-4 w-4 text-muted-foreground" />}
                <span className="truncate">{item.secondaryLabel}</span>
              </div>
              <div className={`font-semibold ${getValueColor(item.valueVariant)}`}>
                {item.value}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
