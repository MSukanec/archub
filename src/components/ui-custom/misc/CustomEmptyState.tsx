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
      {/* Moving and Rotating Background Shapes - Enhanced and More Prominent */}
      <div className="absolute inset-0 z-[-1] overflow-hidden">
        {/* Large Moving Circles - Much Bigger and More Visible */}
        <div className="absolute w-16 h-16 bg-[var(--accent)]/40 rounded-full animate-bounce" 
             style={{ 
               top: '8%', 
               left: '12%', 
               animation: 'bounce 4s ease-in-out infinite, float-horizontal 8s ease-in-out infinite'
             }} />
        <div className="absolute w-12 h-12 bg-[var(--accent)]/50 rounded-full animate-bounce" 
             style={{ 
               top: '18%', 
               right: '18%', 
               animationDelay: '1s',
               animation: 'bounce 3.5s ease-in-out infinite, float-diagonal 7s ease-in-out infinite reverse'
             }} />
        <div className="absolute w-20 h-20 bg-[var(--accent)]/35 rounded-full animate-bounce" 
             style={{ 
               bottom: '12%', 
               left: '22%', 
               animationDelay: '2s',
               animation: 'bounce 5s ease-in-out infinite, float-vertical 6s ease-in-out infinite'
             }} />
        <div className="absolute w-14 h-14 bg-[var(--accent)]/45 rounded-full animate-bounce" 
             style={{ 
               bottom: '22%', 
               right: '12%', 
               animationDelay: '0.5s',
               animation: 'bounce 4.5s ease-in-out infinite, float-horizontal 9s ease-in-out infinite reverse'
             }} />
        <div className="absolute w-10 h-10 bg-[var(--accent)]/38 rounded-full animate-bounce" 
             style={{ 
               top: '35%', 
               left: '8%', 
               animationDelay: '1.5s',
               animation: 'bounce 3.8s ease-in-out infinite, float-diagonal 7.5s ease-in-out infinite'
             }} />
        <div className="absolute w-18 h-18 bg-[var(--accent)]/42 rounded-full animate-bounce" 
             style={{ 
               top: '50%', 
               right: '8%', 
               animationDelay: '2.5s',
               animation: 'bounce 4.2s ease-in-out infinite, float-vertical 8.5s ease-in-out infinite reverse'
             }} />

        {/* Large Rotating Squares - Much More Prominent */}
        <div className="absolute w-12 h-12 bg-[var(--accent)]/55 animate-spin" 
             style={{ 
               top: '28%', 
               left: '8%', 
               animation: 'spin 6s linear infinite, float-diagonal 8s ease-in-out infinite'
             }} />
        <div className="absolute w-10 h-10 bg-[var(--accent)]/48 animate-spin" 
             style={{ 
               top: '58%', 
               right: '8%', 
               animationDelay: '1s',
               animation: 'spin 8s linear infinite reverse, float-vertical 7s ease-in-out infinite'
             }} />
        <div className="absolute w-14 h-14 bg-[var(--accent)]/40 animate-spin" 
             style={{ 
               bottom: '38%', 
               left: '6%', 
               animationDelay: '2s',
               animation: 'spin 7s linear infinite, float-horizontal 10s ease-in-out infinite reverse'
             }} />
        <div className="absolute w-8 h-8 bg-[var(--accent)]/52 animate-spin" 
             style={{ 
               top: '15%', 
               left: '50%', 
               animationDelay: '0.8s',
               animation: 'spin 5s linear infinite reverse, float-diagonal 9s ease-in-out infinite'
             }} />
        <div className="absolute w-11 h-11 bg-[var(--accent)]/46 animate-spin" 
             style={{ 
               bottom: '15%', 
               right: '50%', 
               animationDelay: '1.8s',
               animation: 'spin 9s linear infinite, float-vertical 7.5s ease-in-out infinite reverse'
             }} />

        {/* Large Moving Triangles - Much More Visible */}
        <div className="absolute w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-[var(--accent)]/45" 
             style={{ 
               top: '12%', 
               left: '68%', 
               animation: 'float-vertical 5s ease-in-out infinite, spin 12s linear infinite'
             }} />
        <div className="absolute w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-l-transparent border-r-transparent border-b-[var(--accent)]/50" 
             style={{ 
               bottom: '18%', 
               right: '68%', 
               animationDelay: '1.5s',
               animation: 'float-diagonal 6s ease-in-out infinite reverse, spin 10s linear infinite reverse'
             }} />
        <div className="absolute w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-[var(--accent)]/42" 
             style={{ 
               top: '42%', 
               left: '3%', 
               animationDelay: '2.2s',
               animation: 'float-horizontal 7s ease-in-out infinite, spin 8s linear infinite'
             }} />
        <div className="absolute w-0 h-0 border-l-[14px] border-r-[14px] border-b-[24px] border-l-transparent border-r-transparent border-b-[var(--accent)]/38" 
             style={{ 
               top: '65%', 
               right: '25%', 
               animationDelay: '0.7s',
               animation: 'float-vertical 6.5s ease-in-out infinite reverse, spin 11s linear infinite'
             }} />

        {/* Large Rotating Diamonds - Much More Prominent */}
        <div className="absolute w-10 h-10 bg-[var(--accent)]/60 rotate-45" 
             style={{ 
               top: '22%', 
               right: '28%', 
               animation: 'spin 5s linear infinite, float-vertical 8s ease-in-out infinite'
             }} />
        <div className="absolute w-12 h-12 bg-[var(--accent)]/45 rotate-45" 
             style={{ 
               bottom: '28%', 
               left: '38%', 
               animationDelay: '1.2s',
               animation: 'spin 9s linear infinite reverse, float-diagonal 6s ease-in-out infinite'
             }} />
        <div className="absolute w-8 h-8 bg-[var(--accent)]/55 rotate-45" 
             style={{ 
               top: '52%', 
               right: '3%', 
               animationDelay: '2.1s',
               animation: 'spin 7s linear infinite, float-horizontal 9s ease-in-out infinite reverse'
             }} />
        <div className="absolute w-14 h-14 bg-[var(--accent)]/40 rotate-45" 
             style={{ 
               bottom: '45%', 
               left: '75%', 
               animationDelay: '0.9s',
               animation: 'spin 6s linear infinite reverse, float-vertical 7.8s ease-in-out infinite'
             }} />

        {/* Large Moving Hexagons - More Visible */}
        <div className="absolute w-16 h-16 bg-[var(--accent)]/35" 
             style={{ 
               top: '38%', 
               left: '78%', 
               clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
               animation: 'float-vertical 6s ease-in-out infinite, spin 15s linear infinite'
             }} />
        <div className="absolute w-12 h-12 bg-[var(--accent)]/48" 
             style={{ 
               bottom: '32%', 
               right: '38%', 
               animationDelay: '1.3s',
               clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
               animation: 'float-horizontal 8s ease-in-out infinite reverse, spin 12s linear infinite reverse'
             }} />
        <div className="absolute w-10 h-10 bg-[var(--accent)]/42" 
             style={{ 
               top: '8%', 
               left: '40%', 
               animationDelay: '2.8s',
               clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
               animation: 'float-diagonal 7.5s ease-in-out infinite, spin 13s linear infinite'
             }} />

        {/* Additional Stars and Complex Shapes */}
        <div className="absolute w-8 h-8 bg-[var(--accent)]/50" 
             style={{ 
               top: '75%', 
               left: '15%', 
               clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
               animation: 'float-vertical 4.5s ease-in-out infinite, spin 14s linear infinite'
             }} />
        <div className="absolute w-6 h-6 bg-[var(--accent)]/58" 
             style={{ 
               bottom: '8%', 
               right: '85%', 
               animationDelay: '1.7s',
               clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
               animation: 'float-horizontal 5.2s ease-in-out infinite reverse, spin 16s linear infinite reverse'
             }} />

        {/* Enhanced Central Glow Effects */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-[var(--accent)]/8 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[var(--accent)]/6 rounded-full blur-2xl animate-pulse" 
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