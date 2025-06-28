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
      "hover:border-[var(--accent)]/80 hover:bg-background/70",
      "flex flex-col justify-center items-center relative overflow-hidden",
      className
    )}>
      {/* Enhanced Floating Particles Background - Many More Particles */}
      <div className="absolute inset-0 z-[-1]">
        {/* Large floating circles - Layer 1 */}
        <div className="absolute top-8 left-8 w-4 h-4 bg-[var(--accent)]/20 rounded-full animate-bounce" 
             style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-16 right-12 w-3 h-3 bg-[var(--accent)]/25 rounded-full animate-bounce" 
             style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
        <div className="absolute bottom-12 left-16 w-3.5 h-3.5 bg-[var(--accent)]/15 rounded-full animate-bounce" 
             style={{ animationDelay: '2s', animationDuration: '4s' }} />
        <div className="absolute bottom-8 right-8 w-2.5 h-2.5 bg-[var(--accent)]/30 rounded-full animate-bounce" 
             style={{ animationDelay: '0.5s', animationDuration: '3.5s' }} />
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-[var(--accent)]/18 rounded-full animate-bounce" 
             style={{ animationDelay: '1.8s', animationDuration: '2.8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-[var(--accent)]/22 rounded-full animate-bounce" 
             style={{ animationDelay: '0.8s', animationDuration: '3.2s' }} />
        
        {/* Medium floating elements - Layer 2 */}
        <div className="absolute top-1/3 left-4 w-2 h-2 bg-[var(--accent)]/35 rounded-full animate-pulse" 
             style={{ animationDelay: '1.5s', animationDuration: '2s' }} />
        <div className="absolute top-2/3 right-6 w-1.5 h-1.5 bg-[var(--accent)]/28 rounded-full animate-pulse" 
             style={{ animationDelay: '3s', animationDuration: '2.5s' }} />
        <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-[var(--accent)]/40 rounded-full animate-pulse" 
             style={{ animationDelay: '2.5s', animationDuration: '1.8s' }} />
        <div className="absolute top-1/4 right-1/3 w-1 h-1 bg-[var(--accent)]/38 rounded-full animate-pulse" 
             style={{ animationDelay: '4s', animationDuration: '2.2s' }} />
        <div className="absolute top-3/4 left-1/2 w-1.5 h-1.5 bg-[var(--accent)]/32 rounded-full animate-pulse" 
             style={{ animationDelay: '0.7s', animationDuration: '2.7s' }} />
        <div className="absolute top-1/6 right-1/6 w-2 h-2 bg-[var(--accent)]/26 rounded-full animate-pulse" 
             style={{ animationDelay: '3.3s', animationDuration: '2.1s' }} />
        
        {/* Small floating particles - Layer 3 */}
        <div className="absolute top-12 left-1/2 w-1 h-1 bg-[var(--accent)]/45 rounded-full animate-ping" 
             style={{ animationDelay: '0.2s', animationDuration: '3s' }} />
        <div className="absolute bottom-16 left-1/4 w-0.5 h-0.5 bg-[var(--accent)]/50 rounded-full animate-ping" 
             style={{ animationDelay: '1.2s', animationDuration: '2.3s' }} />
        <div className="absolute top-20 right-1/4 w-0.5 h-0.5 bg-[var(--accent)]/42 rounded-full animate-ping" 
             style={{ animationDelay: '2.1s', animationDuration: '2.8s' }} />
        <div className="absolute bottom-20 right-1/2 w-1 h-1 bg-[var(--accent)]/48 rounded-full animate-ping" 
             style={{ animationDelay: '1.7s', animationDuration: '3.5s' }} />
        <div className="absolute top-1/3 right-1/5 w-0.5 h-0.5 bg-[var(--accent)]/52 rounded-full animate-ping" 
             style={{ animationDelay: '0.9s', animationDuration: '2.6s' }} />
        <div className="absolute bottom-1/3 left-1/5 w-0.5 h-0.5 bg-[var(--accent)]/46 rounded-full animate-ping" 
             style={{ animationDelay: '3.1s', animationDuration: '2.9s' }} />
        <div className="absolute top-2/5 left-3/4 w-1 h-1 bg-[var(--accent)]/38 rounded-full animate-ping" 
             style={{ animationDelay: '1.4s', animationDuration: '3.1s' }} />
        <div className="absolute bottom-2/5 right-3/4 w-0.5 h-0.5 bg-[var(--accent)]/44 rounded-full animate-ping" 
             style={{ animationDelay: '2.7s', animationDuration: '2.4s' }} />
        
        {/* Floating geometric shapes - Layer 4 */}
        <div className="absolute top-20 left-1/3 w-2 h-2 border border-[var(--accent)]/20 rotate-45 animate-spin" 
             style={{ animationDelay: '1s', animationDuration: '8s' }} />
        <div className="absolute bottom-20 right-1/4 w-1.5 h-1.5 border border-[var(--accent)]/15 rotate-12 animate-spin" 
             style={{ animationDelay: '3s', animationDuration: '10s' }} />
        <div className="absolute top-1/5 right-2/3 w-1 h-1 border border-[var(--accent)]/25 rotate-180 animate-spin" 
             style={{ animationDelay: '2.2s', animationDuration: '6s' }} />
        <div className="absolute bottom-1/5 left-2/3 w-1.5 h-1.5 border border-[var(--accent)]/18 rotate-90 animate-spin" 
             style={{ animationDelay: '1.6s', animationDuration: '9s' }} />
        
        {/* Triangular shapes */}
        <div className="absolute top-1/6 left-1/6 w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-[var(--accent)]/20 animate-pulse" 
             style={{ animationDelay: '2.8s', animationDuration: '3.2s' }} />
        <div className="absolute bottom-1/6 right-1/6 w-0 h-0 border-l-[2px] border-r-[2px] border-b-[4px] border-l-transparent border-r-transparent border-b-[var(--accent)]/28 animate-pulse" 
             style={{ animationDelay: '1.3s', animationDuration: '2.7s' }} />
        
        {/* Star-like shapes */}
        <div className="absolute top-1/3 left-5/6 w-1.5 h-1.5 bg-[var(--accent)]/22 transform rotate-45 animate-ping" 
             style={{ animationDelay: '0.4s', animationDuration: '4.2s', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        <div className="absolute bottom-1/3 right-5/6 w-1 h-1 bg-[var(--accent)]/30 transform rotate-12 animate-ping" 
             style={{ animationDelay: '3.7s', animationDuration: '3.8s', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        
        {/* Floating lines */}
        <div className="absolute top-2/5 left-1/6 w-6 h-0.5 bg-[var(--accent)]/15 rotate-45 animate-pulse" 
             style={{ animationDelay: '1.9s', animationDuration: '3.6s' }} />
        <div className="absolute bottom-2/5 right-1/6 w-4 h-0.5 bg-[var(--accent)]/20 rotate-12 animate-pulse" 
             style={{ animationDelay: '2.4s', animationDuration: '4.1s' }} />
        
        {/* Extra small sparkle particles */}
        <div className="absolute top-10 left-2/3 w-0.5 h-0.5 bg-[var(--accent)]/60 rounded-full animate-ping" 
             style={{ animationDelay: '0.3s', animationDuration: '1.8s' }} />
        <div className="absolute top-1/4 left-1/12 w-0.5 h-0.5 bg-[var(--accent)]/55 rounded-full animate-ping" 
             style={{ animationDelay: '2.9s', animationDuration: '2.1s' }} />
        <div className="absolute bottom-10 right-2/3 w-0.5 h-0.5 bg-[var(--accent)]/58 rounded-full animate-ping" 
             style={{ animationDelay: '1.1s', animationDuration: '2.6s' }} />
        <div className="absolute bottom-1/4 right-1/12 w-0.5 h-0.5 bg-[var(--accent)]/52 rounded-full animate-ping" 
             style={{ animationDelay: '3.5s', animationDuration: '1.9s' }} />
        
        {/* Subtle background glow effect */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-xl animate-pulse" 
             style={{ animationDelay: '0s', animationDuration: '4s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[var(--accent)]/3 rounded-full blur-2xl animate-pulse" 
             style={{ animationDelay: '2s', animationDuration: '5s' }} />
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
  )
}