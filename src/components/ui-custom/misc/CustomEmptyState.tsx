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
      "w-full h-[70vh] mx-auto px-4 text-center",
      "border-2 border-dashed border-[var(--accent)] rounded-xl",
      "bg-background/50 backdrop-blur-sm transition-all duration-300",
      "hover:border-[var(--accent)]/80 hover:bg-background/70",
      "flex flex-col justify-center items-center relative overflow-hidden",
      className
    )}>
      {/* Moving and Rotating Background Shapes */}
      <div className="absolute inset-0 z-[-1] overflow-hidden">
        {/* Large Moving Circles */}
        <div className="absolute w-8 h-8 bg-[var(--accent)]/15 rounded-full animate-bounce" 
             style={{ 
               top: '10%', 
               left: '15%', 
               animationDelay: '0s', 
               animationDuration: '4s',
               transform: 'translateX(0px) translateY(0px)',
               animation: 'bounce 4s ease-in-out infinite, float-horizontal 8s ease-in-out infinite'
             }} />
        <div className="absolute w-6 h-6 bg-[var(--accent)]/20 rounded-full animate-bounce" 
             style={{ 
               top: '20%', 
               right: '20%', 
               animationDelay: '1s', 
               animationDuration: '3.5s',
               animation: 'bounce 3.5s ease-in-out infinite, float-diagonal 7s ease-in-out infinite reverse'
             }} />
        <div className="absolute w-10 h-10 bg-[var(--accent)]/12 rounded-full animate-bounce" 
             style={{ 
               bottom: '15%', 
               left: '25%', 
               animationDelay: '2s', 
               animationDuration: '5s',
               animation: 'bounce 5s ease-in-out infinite, float-vertical 6s ease-in-out infinite'
             }} />
        <div className="absolute w-5 h-5 bg-[var(--accent)]/18 rounded-full animate-bounce" 
             style={{ 
               bottom: '25%', 
               right: '15%', 
               animationDelay: '0.5s', 
               animationDuration: '4.5s',
               animation: 'bounce 4.5s ease-in-out infinite, float-horizontal 9s ease-in-out infinite reverse'
             }} />

        {/* Rotating Squares */}
        <div className="absolute w-4 h-4 bg-[var(--accent)]/25 animate-spin" 
             style={{ 
               top: '30%', 
               left: '10%', 
               animationDuration: '6s',
               animation: 'spin 6s linear infinite, float-diagonal 8s ease-in-out infinite'
             }} />
        <div className="absolute w-3 h-3 bg-[var(--accent)]/22 animate-spin" 
             style={{ 
               top: '60%', 
               right: '10%', 
               animationDuration: '8s',
               animation: 'spin 8s linear infinite reverse, float-vertical 7s ease-in-out infinite'
             }} />
        <div className="absolute w-5 h-5 bg-[var(--accent)]/18 animate-spin" 
             style={{ 
               bottom: '40%', 
               left: '8%', 
               animationDuration: '7s',
               animation: 'spin 7s linear infinite, float-horizontal 10s ease-in-out infinite reverse'
             }} />

        {/* Moving Triangles */}
        <div className="absolute w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-[var(--accent)]/20" 
             style={{ 
               top: '15%', 
               left: '70%', 
               animation: 'float-vertical 5s ease-in-out infinite, spin 12s linear infinite'
             }} />
        <div className="absolute w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-[var(--accent)]/25" 
             style={{ 
               bottom: '20%', 
               right: '70%', 
               animation: 'float-diagonal 6s ease-in-out infinite reverse, spin 10s linear infinite reverse'
             }} />
        <div className="absolute w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent border-b-[var(--accent)]/15" 
             style={{ 
               top: '45%', 
               left: '5%', 
               animation: 'float-horizontal 7s ease-in-out infinite, spin 8s linear infinite'
             }} />

        {/* Rotating Diamonds */}
        <div className="absolute w-3 h-3 bg-[var(--accent)]/30 rotate-45" 
             style={{ 
               top: '25%', 
               right: '30%', 
               animation: 'spin 5s linear infinite, float-vertical 8s ease-in-out infinite'
             }} />
        <div className="absolute w-4 h-4 bg-[var(--accent)]/20 rotate-45" 
             style={{ 
               bottom: '30%', 
               left: '40%', 
               animation: 'spin 9s linear infinite reverse, float-diagonal 6s ease-in-out infinite'
             }} />
        <div className="absolute w-2 h-2 bg-[var(--accent)]/28 rotate-45" 
             style={{ 
               top: '55%', 
               right: '5%', 
               animation: 'spin 7s linear infinite, float-horizontal 9s ease-in-out infinite reverse'
             }} />

        {/* Moving Hexagons */}
        <div className="absolute w-6 h-6 bg-[var(--accent)]/16" 
             style={{ 
               top: '40%', 
               left: '80%', 
               clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
               animation: 'float-vertical 6s ease-in-out infinite, spin 15s linear infinite'
             }} />
        <div className="absolute w-4 h-4 bg-[var(--accent)]/22" 
             style={{ 
               bottom: '35%', 
               right: '40%', 
               clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
               animation: 'float-horizontal 8s ease-in-out infinite reverse, spin 12s linear infinite reverse'
             }} />

        {/* Central Glow Effects */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[var(--accent)]/5 rounded-full blur-2xl animate-pulse" 
             style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-[var(--accent)]/3 rounded-full blur-3xl animate-pulse" 
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