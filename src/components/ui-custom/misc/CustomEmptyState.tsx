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
    <div className="w-full h-[70vh] flex items-center justify-center p-4">
      <div className={cn(
        "w-full max-w-4xl h-full mx-auto py-12 px-8 text-center",
        "border-2 border-dashed border-[var(--accent)] rounded-xl",
        "bg-background/50 backdrop-blur-sm transition-all duration-300",
        "hover:bg-background/70",
        "flex flex-col justify-center items-center relative overflow-hidden",
        // Animación del borde pulsante
        "animate-pulse [animation-duration:2s]",
        className
      )}>
      {/* Ultra-Dynamic Floating Particles Background - Much More Visible */}
      <div className="absolute inset-0 z-[-1]">
        {/* Large floating circles - Layer 1 - MUCH MORE VISIBLE */}
        <div className="absolute top-8 left-8 w-8 h-8 bg-[var(--accent)]/60 rounded-full animate-bounce shadow-lg" 
             style={{ animationDelay: '0s', animationDuration: '1.5s' }} />
        <div className="absolute top-16 right-12 w-6 h-6 bg-[var(--accent)]/70 rounded-full animate-bounce shadow-md" 
             style={{ animationDelay: '0.5s', animationDuration: '1.8s' }} />
        <div className="absolute bottom-12 left-16 w-7 h-7 bg-[var(--accent)]/55 rounded-full animate-bounce shadow-lg" 
             style={{ animationDelay: '1s', animationDuration: '2s' }} />
        <div className="absolute bottom-8 right-8 w-5 h-5 bg-[var(--accent)]/80 rounded-full animate-bounce shadow-md" 
             style={{ animationDelay: '0.3s', animationDuration: '1.7s' }} />
        <div className="absolute top-1/4 left-1/3 w-6 h-6 bg-[var(--accent)]/65 rounded-full animate-bounce shadow-lg" 
             style={{ animationDelay: '0.8s', animationDuration: '1.6s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-[var(--accent)]/75 rounded-full animate-bounce shadow-md" 
             style={{ animationDelay: '0.4s', animationDuration: '1.9s' }} />
        
        {/* Medium floating elements - Layer 2 - MUCH MORE VISIBLE */}
        <div className="absolute top-1/3 left-4 w-4 h-4 bg-[var(--accent)]/85 rounded-full animate-pulse shadow-md" 
             style={{ animationDelay: '0.5s', animationDuration: '1.2s' }} />
        <div className="absolute top-2/3 right-6 w-3 h-3 bg-[var(--accent)]/78 rounded-full animate-pulse shadow-sm" 
             style={{ animationDelay: '1s', animationDuration: '1.5s' }} />
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-[var(--accent)]/90 rounded-full animate-pulse shadow-lg" 
             style={{ animationDelay: '0.8s', animationDuration: '1.1s' }} />
        <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-[var(--accent)]/88 rounded-full animate-pulse shadow-md" 
             style={{ animationDelay: '1.2s', animationDuration: '1.3s' }} />
        <div className="absolute top-3/4 left-1/2 w-3 h-3 bg-[var(--accent)]/82 rounded-full animate-pulse shadow-sm" 
             style={{ animationDelay: '0.3s', animationDuration: '1.4s' }} />
        <div className="absolute top-1/6 right-1/6 w-4 h-4 bg-[var(--accent)]/76 rounded-full animate-pulse shadow-lg" 
             style={{ animationDelay: '1.1s', animationDuration: '1.6s' }} />
        
        {/* Small floating particles - Layer 3 - MUCH MORE VISIBLE */}
        <div className="absolute top-12 left-1/2 w-2 h-2 bg-[var(--accent)]/95 rounded-full animate-ping shadow-lg" 
             style={{ animationDelay: '0.1s', animationDuration: '1.5s' }} />
        <div className="absolute bottom-16 left-1/4 w-1.5 h-1.5 bg-[var(--accent)]/100 rounded-full animate-ping shadow-md" 
             style={{ animationDelay: '0.6s', animationDuration: '1.3s' }} />
        <div className="absolute top-20 right-1/4 w-1.5 h-1.5 bg-[var(--accent)]/92 rounded-full animate-ping shadow-sm" 
             style={{ animationDelay: '1.1s', animationDuration: '1.8s' }} />
        <div className="absolute bottom-20 right-1/2 w-2 h-2 bg-[var(--accent)]/98 rounded-full animate-ping shadow-lg" 
             style={{ animationDelay: '0.7s', animationDuration: '1.5s' }} />
        <div className="absolute top-1/3 right-1/5 w-1.5 h-1.5 bg-[var(--accent)]/100 rounded-full animate-ping shadow-md" 
             style={{ animationDelay: '0.4s', animationDuration: '1.6s' }} />
        <div className="absolute bottom-1/3 left-1/5 w-1.5 h-1.5 bg-[var(--accent)]/96 rounded-full animate-ping shadow-sm" 
             style={{ animationDelay: '1.3s', animationDuration: '1.4s' }} />
        <div className="absolute top-2/5 left-3/4 w-2 h-2 bg-[var(--accent)]/88 rounded-full animate-ping shadow-lg" 
             style={{ animationDelay: '0.7s', animationDuration: '1.7s' }} />
        <div className="absolute bottom-2/5 right-3/4 w-1.5 h-1.5 bg-[var(--accent)]/94 rounded-full animate-ping shadow-md" 
             style={{ animationDelay: '1.4s', animationDuration: '1.2s' }} />
        
        {/* Floating geometric shapes - Layer 4 - MUCH MORE VISIBLE */}
        <div className="absolute top-20 left-1/3 w-6 h-6 border-2 border-[var(--accent)]/80 bg-[var(--accent)]/20 rotate-45 animate-spin shadow-lg" 
             style={{ animationDelay: '0.5s', animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-1/4 w-5 h-5 border-2 border-[var(--accent)]/75 bg-[var(--accent)]/15 rotate-12 animate-spin shadow-md" 
             style={{ animationDelay: '1.5s', animationDuration: '5s' }} />
        <div className="absolute top-1/5 right-2/3 w-4 h-4 border-2 border-[var(--accent)]/85 bg-[var(--accent)]/25 rotate-180 animate-spin shadow-sm" 
             style={{ animationDelay: '1.1s', animationDuration: '3s' }} />
        <div className="absolute bottom-1/5 left-2/3 w-5 h-5 border-2 border-[var(--accent)]/70 bg-[var(--accent)]/18 rotate-90 animate-spin shadow-lg" 
             style={{ animationDelay: '0.8s', animationDuration: '4.5s' }} />
        
        {/* Triangular shapes - MUCH MORE VISIBLE */}
        <div className="absolute top-1/6 left-1/6 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-[var(--accent)]/70 animate-pulse shadow-lg" 
             style={{ animationDelay: '1.4s', animationDuration: '1.6s' }} />
        <div className="absolute bottom-1/6 right-1/6 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-[var(--accent)]/78 animate-pulse shadow-md" 
             style={{ animationDelay: '0.7s', animationDuration: '1.4s' }} />
        
        {/* Star-like shapes - MUCH MORE VISIBLE */}
        <div className="absolute top-1/3 left-5/6 w-4 h-4 bg-[var(--accent)]/72 transform rotate-45 animate-ping shadow-lg" 
             style={{ animationDelay: '0.2s', animationDuration: '2.1s', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        <div className="absolute bottom-1/3 right-5/6 w-3 h-3 bg-[var(--accent)]/80 transform rotate-12 animate-ping shadow-md" 
             style={{ animationDelay: '1.9s', animationDuration: '1.9s', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        
        {/* Floating lines - MUCH MORE VISIBLE */}
        <div className="absolute top-2/5 left-1/6 w-12 h-1 bg-[var(--accent)]/65 rotate-45 animate-pulse shadow-md" 
             style={{ animationDelay: '0.9s', animationDuration: '1.8s' }} />
        <div className="absolute bottom-2/5 right-1/6 w-10 h-1 bg-[var(--accent)]/70 rotate-12 animate-pulse shadow-sm" 
             style={{ animationDelay: '1.2s', animationDuration: '2.1s' }} />
        
        {/* Extra sparkle particles - MUCH MORE VISIBLE */}
        <div className="absolute top-10 left-2/3 w-1.5 h-1.5 bg-[var(--accent)]/100 rounded-full animate-ping shadow-lg" 
             style={{ animationDelay: '0.15s', animationDuration: '0.9s' }} />
        <div className="absolute top-1/4 left-1/12 w-1.5 h-1.5 bg-[var(--accent)]/95 rounded-full animate-ping shadow-md" 
             style={{ animationDelay: '1.45s', animationDuration: '1.05s' }} />
        <div className="absolute bottom-10 right-2/3 w-1.5 h-1.5 bg-[var(--accent)]/98 rounded-full animate-ping shadow-lg" 
             style={{ animationDelay: '0.55s', animationDuration: '1.3s' }} />
        <div className="absolute bottom-1/4 right-1/12 w-1.5 h-1.5 bg-[var(--accent)]/92 rounded-full animate-ping shadow-md" 
             style={{ animationDelay: '1.75s', animationDuration: '0.95s' }} />
        
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