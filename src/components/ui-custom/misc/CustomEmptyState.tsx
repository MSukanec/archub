import React from 'react'
import { cn } from '@/lib/utils'

interface CustomEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  fullScreen?: boolean; // Para ocupar toda la pantalla
}

export function CustomEmptyState({
  icon,
  title,
  description,
  action,
  className,
  fullScreen = false
}: CustomEmptyStateProps) {
  return (
    <div className={cn(
      // Base classes for full screen mode with mobile centering
      fullScreen ? "fixed inset-0 z-50 flex" : "w-full min-h-[400px] flex",
      "flex-col justify-center items-center relative overflow-hidden",
      "bg-background transition-all duration-500",
      // Dotted border with accent color
      "border-2 border-dashed border-[var(--accent)]/40 rounded-lg",
      fullScreen ? "m-4" : "m-4",
      className
    )}>
      {/* Animated diagonal hatch background */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 12px,
              var(--accent) 12px,
              var(--accent) 13px,
              transparent 13px,
              transparent 25px
            )`,
            animation: 'hatchMove 10s linear infinite'
          }}
        />
      </div>

      {/* Enhanced fun particle effects */}
      <div className="absolute inset-0 z-0">
        {/* Varied floating particles */}
        <div className="absolute top-[15%] left-[12%] w-2 h-2 bg-[var(--accent)]/40 rounded-full" 
             style={{ animation: 'float 4s ease-in-out infinite' }} />
        <div className="absolute top-[25%] right-[18%] w-3 h-3 bg-[var(--accent)]/30 rounded-full" 
             style={{ animation: 'float 3s ease-in-out infinite reverse', animationDelay: '1s' }} />
        <div className="absolute bottom-[25%] left-[20%] w-2 h-2 bg-[var(--accent)]/35 rounded-full" 
             style={{ animation: 'float 5s ease-in-out infinite', animationDelay: '2s' }} />
        <div className="absolute top-[45%] right-[25%] w-2 h-2 bg-[var(--accent)]/45 rotate-45" 
             style={{ animation: 'float 3.5s ease-in-out infinite', animationDelay: '1.5s' }} />
        <div className="absolute bottom-[35%] right-[15%] w-1 h-1 bg-[var(--accent)]/50 rounded-full" 
             style={{ animation: 'float 4.5s ease-in-out infinite reverse', animationDelay: '0.5s' }} />
        <div className="absolute top-[35%] left-[8%] w-1 h-6 bg-[var(--accent)]/25 rounded-full" 
             style={{ animation: 'float 6s ease-in-out infinite', animationDelay: '2.5s' }} />
        <div className="absolute bottom-[45%] left-[35%] w-1 h-1 bg-[var(--accent)]/55 rounded-full" 
             style={{ animation: 'float 2.8s ease-in-out infinite', animationDelay: '0.8s' }} />
        <div className="absolute top-[60%] right-[35%] w-2 h-2 bg-[var(--accent)]/30 rotate-45" 
             style={{ animation: 'float 4.2s ease-in-out infinite reverse', animationDelay: '1.8s' }} />
        
        {/* Additional fun elements */}
        <div className="absolute top-[20%] left-[60%] w-1 h-1 bg-[var(--accent)]/60 rounded-full animate-ping" 
             style={{ animationDelay: '1s', animationDuration: '3s' }} />
        <div className="absolute bottom-[50%] right-[8%] w-1 h-1 bg-[var(--accent)]/50 rounded-full animate-ping" 
             style={{ animationDelay: '2.5s', animationDuration: '2.5s' }} />
        <div className="absolute top-[70%] left-[15%] w-2 h-2 bg-[var(--accent)]/20 rounded-full animate-pulse" 
             style={{ animationDelay: '1.8s', animationDuration: '3.2s' }} />
      </div>

      {/* Content Container with smaller, refined styling */}
      <div className="relative z-10 flex flex-col items-center max-w-sm mx-auto px-6 text-center">
        {/* Icon with smaller, refined styling */}
        {icon && (
          <div className="mb-4 relative">
            <div className="p-3 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30">
              <div className="text-[var(--accent)]">
                {React.cloneElement(icon as React.ReactElement, { 
                  className: "w-6 h-6" 
                })}
              </div>
            </div>
          </div>
        )}

        {/* Title with smaller, refined typography */}
        <h3 className="text-base font-semibold mb-2 text-foreground leading-tight">
          {title}
        </h3>

        {/* Description with smaller text */}
        {description && (
          <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">
            {description}
          </p>
        )}

        {/* Action button */}
        {action && (
          <div className="relative">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}