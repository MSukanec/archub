import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  icon?: LucideIcon
  title: string
  description?: string
  children?: React.ReactNode
  filters?: React.ReactNode
  className?: string
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  children,
  filters,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("bg-[var(--layout-bg)] border-b border-[var(--menues-border)] px-6 py-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {Icon && (
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {children && (
          <div className="flex items-center space-x-3">
            {children}
          </div>
        )}
      </div>
      
      {filters && (
        <div className="mt-4">
          {filters}
        </div>
      )}
    </div>
  )
}
