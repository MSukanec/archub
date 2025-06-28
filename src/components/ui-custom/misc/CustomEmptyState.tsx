import React from 'react'
import { cn } from '@/lib/utils'

interface CustomEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CustomEmptyState({
  icon,
  title,
  description,
  action,
  className
}: CustomEmptyStateProps) {
  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-200px)] md:min-h-0 md:h-full">
      <div className={cn(
        "w-full max-w-lg mx-auto py-12 md:py-20 px-4 text-center",
        "min-h-[70vh] md:min-h-0 md:h-[70%]",
        "border-2 border-dashed border-[var(--accent)] rounded-xl",
        "bg-background/50 backdrop-blur-sm transition-all duration-300",
        "hover:border-[var(--accent)]/80 hover:bg-background/70",
        "flex flex-col justify-center items-center relative overflow-hidden",
        className
      )}>
        {/* Diagonal Hatch Background Pattern */}
        <div className="absolute inset-0 z-[-1] overflow-hidden">
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                var(--accent) 0px,
                var(--accent) 1px,
                transparent 1px,
                transparent 12px
              )`
            }}
          />
        </div>

        {/* Icon container */}
        {icon && (
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto bg-[var(--accent)]/10 rounded-full flex items-center justify-center shadow-lg border border-[var(--accent)]/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="text-[var(--accent)] [&>svg]:w-12 [&>svg]:h-12">
                {icon}
              </div>
            </div>
            
            {/* Subtle icon glow */}
            <div className="absolute inset-0 w-20 h-20 mx-auto bg-[var(--accent)]/5 rounded-full blur-md animate-pulse" />
          </div>
        )}

        {/* Content */}
        <div className="space-y-4 max-w-md mx-auto relative z-10">
          <h3 className="text-xl font-semibold text-foreground leading-tight">
            {title}
          </h3>
          
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
          
          {action && (
            <div className="pt-4">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}