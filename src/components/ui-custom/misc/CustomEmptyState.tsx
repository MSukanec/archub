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
    <div className={cn(
      "w-full min-h-[300px] h-full mx-auto py-12 px-4 text-center",
      "border-2 border-dashed border-[var(--accent)] rounded-xl",
      "bg-background/50 backdrop-blur-sm transition-all duration-300",
      "hover:border-[var(--accent)]/60 hover:bg-background/70",
      "flex flex-col justify-center items-center relative overflow-hidden",
      className
    )}>
      {/* Advanced Floating Particles Background */}
      <div className="absolute inset-0 z-[-1]">
        {/* Large floating circles */}
        <div className="absolute top-8 left-8 w-3 h-3 bg-[var(--accent)]/15 rounded-full animate-bounce" 
             style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-16 right-12 w-2 h-2 bg-[var(--accent)]/20 rounded-full animate-bounce" 
             style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
        <div className="absolute bottom-12 left-16 w-2.5 h-2.5 bg-[var(--accent)]/10 rounded-full animate-bounce" 
             style={{ animationDelay: '2s', animationDuration: '4s' }} />
        <div className="absolute bottom-8 right-8 w-1.5 h-1.5 bg-[var(--accent)]/25 rounded-full animate-bounce" 
             style={{ animationDelay: '0.5s', animationDuration: '3.5s' }} />
        
        {/* Medium floating elements */}
        <div className="absolute top-1/3 left-4 w-1 h-1 bg-[var(--accent)]/30 rounded-full animate-pulse" 
             style={{ animationDelay: '1.5s', animationDuration: '2s' }} />
        <div className="absolute top-2/3 right-6 w-1 h-1 bg-[var(--accent)]/20 rounded-full animate-pulse" 
             style={{ animationDelay: '3s', animationDuration: '2.5s' }} />
        <div className="absolute top-1/2 left-1/4 w-0.5 h-0.5 bg-[var(--accent)]/40 rounded-full animate-pulse" 
             style={{ animationDelay: '2.5s', animationDuration: '1.8s' }} />
        <div className="absolute top-1/4 right-1/3 w-0.5 h-0.5 bg-[var(--accent)]/35 rounded-full animate-pulse" 
             style={{ animationDelay: '4s', animationDuration: '2.2s' }} />
        
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-1/3 w-2 h-2 border border-[var(--accent)]/20 rotate-45 animate-spin" 
             style={{ animationDelay: '1s', animationDuration: '8s' }} />
        <div className="absolute bottom-20 right-1/4 w-1.5 h-1.5 border border-[var(--accent)]/15 rotate-12 animate-spin" 
             style={{ animationDelay: '3s', animationDuration: '10s' }} />
        
        {/* Subtle background glow effect */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-xl animate-pulse" 
             style={{ animationDelay: '0s', animationDuration: '4s' }} />
      </div>

      {/* Icon container */}
      {icon && (
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto bg-[var(--accent)]/10 rounded-full flex items-center justify-center shadow-lg border border-[var(--accent)]/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
            {icon}
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
  )
}