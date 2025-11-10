import React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  customContent?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  customContent,
  className
}: EmptyStateProps) {
  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-200px)] md:min-h-0 md:h-full">
      <div className={cn(
        "w-full max-w-lg md:max-w-none mx-auto py-12 md:py-20 text-center",
        "min-h-[70vh] md:min-h-0 md:h-[70%]",
        "border-2 border-dashed rounded-xl",
        "bg-background/50 backdrop-blur-sm transition-all duration-300",
        "hover:bg-background/70",
        "flex flex-col justify-center items-center relative overflow-hidden",
        className
      )}
      style={{
        borderColor: 'var(--accent)',
      }}>
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
            <div 
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg border transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{
                backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
                borderColor: 'rgba(var(--accent-rgb), 0.2)',
                color: 'var(--accent)'
              }}
            >
              <div className="[&>svg]:w-12 [&>svg]:h-12" style={{ color: 'var(--accent)' }}>
                {icon}
              </div>
            </div>
            
            {/* Subtle icon glow */}
            <div 
              className="absolute inset-0 w-20 h-20 mx-auto rounded-full blur-md animate-pulse" 
              style={{
                backgroundColor: 'rgba(var(--accent-rgb), 0.05)'
              }}
            />
            
            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute top-4 left-1/4 w-2 h-2 rounded-full animate-float-diagonal" 
                style={{ 
                  backgroundColor: 'rgba(var(--accent-rgb), 0.3)',
                  animationDelay: '0s', 
                  animationDuration: '6s' 
                }}
              ></div>
              <div 
                className="absolute top-12 right-1/3 w-1 h-1 rounded-full animate-float-diagonal" 
                style={{ 
                  backgroundColor: 'rgba(var(--accent-rgb), 0.4)',
                  animationDelay: '2s', 
                  animationDuration: '8s' 
                }}
              ></div>
              <div 
                className="absolute bottom-8 left-1/3 w-1.5 h-1.5 rounded-full animate-float-diagonal" 
                style={{ 
                  backgroundColor: 'rgba(var(--accent-rgb), 0.2)',
                  animationDelay: '4s', 
                  animationDuration: '7s' 
                }}
              ></div>
              <div 
                className="absolute bottom-16 right-1/4 w-1 h-1 rounded-full animate-float-diagonal" 
                style={{ 
                  backgroundColor: 'rgba(var(--accent-rgb), 0.35)',
                  animationDelay: '1s', 
                  animationDuration: '9s' 
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Custom Content - before main content */}
        {customContent && (
          <div className="relative z-10 w-full">
            {customContent}
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
            <div className="pt-4 flex justify-center relative z-20">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}