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
      // Base classes for full screen mode
      fullScreen ? "fixed inset-0 z-50" : "w-full min-h-[500px]",
      "flex flex-col justify-center items-center relative overflow-hidden",
      "bg-background transition-all duration-500",
      className
    )}>
      {/* Enhanced Animated Particles Background */}
      <div className="absolute inset-0 z-0">
        {/* Large floating circles with enhanced movement */}
        <div className="absolute top-[10%] left-[15%] w-8 h-8 bg-[var(--accent)]/20 rounded-full animate-bounce" 
             style={{ 
               animationDelay: '0s', 
               animationDuration: '3s',
               transform: 'translateX(0px)'
             }} />
        <div className="absolute top-[20%] right-[20%] w-6 h-6 bg-[var(--accent)]/25 rounded-full animate-bounce" 
             style={{ 
               animationDelay: '1s', 
               animationDuration: '2.5s',
               transform: 'translateY(10px)'
             }} />
        <div className="absolute bottom-[20%] left-[25%] w-10 h-10 bg-[var(--accent)]/15 rounded-full animate-bounce" 
             style={{ 
               animationDelay: '2s', 
               animationDuration: '4s',
               transform: 'translateX(-20px)'
             }} />
        <div className="absolute bottom-[15%] right-[15%] w-5 h-5 bg-[var(--accent)]/30 rounded-full animate-bounce" 
             style={{ 
               animationDelay: '0.5s', 
               animationDuration: '3.5s'
             }} />
        
        {/* Medium floating elements with pulse */}
        <div className="absolute top-[35%] left-[10%] w-4 h-4 bg-[var(--accent)]/35 rounded-full animate-pulse" 
             style={{ 
               animationDelay: '1.5s', 
               animationDuration: '2s',
               transform: 'scale(1.2)'
             }} />
        <div className="absolute top-[60%] right-[12%] w-3 h-3 bg-[var(--accent)]/25 rounded-full animate-pulse" 
             style={{ 
               animationDelay: '3s', 
               animationDuration: '2.5s'
             }} />
        <div className="absolute top-[50%] left-[30%] w-2 h-2 bg-[var(--accent)]/40 rounded-full animate-pulse" 
             style={{ 
               animationDelay: '2.5s', 
               animationDuration: '1.8s'
             }} />
        <div className="absolute top-[25%] right-[35%] w-3 h-3 bg-[var(--accent)]/35 rounded-full animate-pulse" 
             style={{ 
               animationDelay: '4s', 
               animationDuration: '2.2s'
             }} />
        
        {/* Enhanced floating geometric shapes */}
        <div className="absolute top-[30%] left-[40%] w-6 h-6 border-2 border-[var(--accent)]/30 rotate-45 animate-spin" 
             style={{ 
               animationDelay: '1s', 
               animationDuration: '8s'
             }} />
        <div className="absolute bottom-[30%] right-[30%] w-4 h-4 border-2 border-[var(--accent)]/25 rotate-12 animate-spin" 
             style={{ 
               animationDelay: '3s', 
               animationDuration: '10s'
             }} />
        <div className="absolute top-[45%] left-[60%] w-3 h-3 border border-[var(--accent)]/20 rounded-sm animate-spin" 
             style={{ 
               animationDelay: '2s', 
               animationDuration: '6s'
             }} />
        
        {/* Enhanced background glow effects */}
        <div className="absolute top-[30%] left-[20%] w-40 h-40 bg-[var(--accent)]/8 rounded-full blur-3xl animate-pulse" 
             style={{ 
               animationDelay: '0s', 
               animationDuration: '4s'
             }} />
        <div className="absolute bottom-[25%] right-[25%] w-32 h-32 bg-[var(--accent)]/6 rounded-full blur-2xl animate-pulse" 
             style={{ 
               animationDelay: '2s', 
               animationDuration: '5s'
             }} />
        
        {/* Floating stars/dots */}
        <div className="absolute top-[15%] left-[50%] w-1 h-1 bg-[var(--accent)]/50 rounded-full animate-ping" 
             style={{ 
               animationDelay: '1s', 
               animationDuration: '3s'
             }} />
        <div className="absolute top-[70%] left-[45%] w-1 h-1 bg-[var(--accent)]/40 rounded-full animate-ping" 
             style={{ 
               animationDelay: '3s', 
               animationDuration: '2s'
             }} />
        <div className="absolute top-[55%] right-[50%] w-1 h-1 bg-[var(--accent)]/45 rounded-full animate-ping" 
             style={{ 
               animationDelay: '2.5s', 
               animationDuration: '2.5s'
             }} />
        
        {/* Additional moving elements */}
        <div className="absolute top-[40%] left-[70%] w-2 h-2 bg-[var(--accent)]/20 rounded-full opacity-70" 
             style={{ 
               animation: 'float 6s ease-in-out infinite',
               animationDelay: '1s'
             }} />
        <div className="absolute bottom-[40%] left-[35%] w-3 h-3 bg-[var(--accent)]/15 rounded-full opacity-60" 
             style={{ 
               animation: 'float 8s ease-in-out infinite reverse',
               animationDelay: '2s'
             }} />
      </div>

      {/* Animated Icon container */}
      {icon && (
        <div className="relative mb-8 z-10">
          <div className="w-32 h-32 mx-auto bg-background rounded-full flex items-center justify-center shadow-2xl border-4 border-[var(--accent)] transition-all duration-500 hover:scale-110 hover:shadow-3xl relative overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/10 via-[var(--accent)]/5 to-[var(--accent)]/10 animate-pulse rounded-full" />
            
            {/* Icon with accent color and animation */}
            <div className="relative z-10 text-[var(--accent)] animate-pulse" style={{ fontSize: '3rem' }}>
              {icon}
            </div>
          </div>
          
          {/* Enhanced icon glow with pulsing effect */}
          <div className="absolute inset-0 w-32 h-32 mx-auto bg-[var(--accent)]/20 rounded-full blur-xl animate-pulse" 
               style={{ 
                 animationDuration: '2s'
               }} />
          <div className="absolute inset-0 w-40 h-40 mx-auto -m-4 bg-[var(--accent)]/10 rounded-full blur-2xl animate-pulse" 
               style={{ 
                 animationDelay: '1s',
                 animationDuration: '3s'
               }} />
        </div>
      )}

      {/* Content with enhanced styling */}
      <div className="space-y-6 max-w-lg mx-auto relative z-10 text-center px-8">
        <h1 className="text-4xl font-bold text-foreground leading-tight tracking-tight">
          {title}
        </h1>
        
        {description && (
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        )}
        
        {action && (
          <div className="pt-6">
            {action}
          </div>
        )}
      </div>


    </div>
  )
}