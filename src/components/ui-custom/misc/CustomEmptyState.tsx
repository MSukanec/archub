import React from 'react'
import { cn } from '@/lib/utils'

interface CustomEmptyStateProps {
  icon: React.ReactNode;
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
    <div className={cn(
      "w-full max-w-lg mx-auto p-8 text-center",
      "border-2 border-dashed border-[var(--accent)] rounded-xl",
      "bg-background/50 backdrop-blur-sm transition-all duration-300",
      "hover:border-[var(--accent)]/60 hover:bg-background/70",
      className
    )}>
      {/* Decorative particles */}
      <div className="relative mb-6">
        <div className="absolute -top-2 -left-2 w-2 h-2 bg-[var(--accent)]/20 rounded-full animate-pulse" />
        <div className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-[var(--accent)]/30 rounded-full animate-pulse delay-75" />
        <div className="absolute -bottom-1 left-3 w-1 h-1 bg-[var(--accent)]/25 rounded-full animate-pulse delay-150" />
        
        {/* Icon container */}
        <div className="w-16 h-16 mx-auto bg-[var(--accent)]/10 rounded-full flex items-center justify-center shadow-sm border border-[var(--accent)]/20">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
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
  )
}