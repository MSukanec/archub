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
    <div className={cn("bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4", className)}>
          {Icon && (
            </div>
          )}
          <div>
              {title}
            </h2>
            {description && (
                {description}
              </p>
            )}
          </div>
        </div>
        
        {children && (
            {children}
          </div>
        )}
      </div>
      
      {filters && (
          {filters}
        </div>
      )}
    </div>
  )
}
