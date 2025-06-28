import React from 'react'
import { cn } from '@/lib/utils'

interface CustomButtonProps {
  children: React.ReactNode
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CustomButton({
  children,
  icon,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className
}: CustomButtonProps) {
  const baseClasses = cn(
    "relative inline-flex items-center justify-center",
    "rounded-full overflow-hidden",
    "font-medium transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "group"
  )

  const variantClasses = {
    primary: cn(
      "bg-gradient-to-b from-white/20 to-white/5",
      "border border-white/20",
      "text-foreground",
      "shadow-lg shadow-black/10",
      "hover:from-white/30 hover:to-white/10",
      "hover:border-white/30",
      "hover:shadow-xl hover:shadow-black/20",
      "active:scale-[0.98] active:shadow-md",
      "backdrop-blur-sm"
    ),
    secondary: cn(
      "bg-gradient-to-b from-muted/80 to-muted/60",
      "border border-border/50",
      "text-muted-foreground",
      "shadow-md shadow-black/5",
      "hover:from-muted/90 hover:to-muted/70",
      "hover:text-foreground",
      "active:scale-[0.98]"
    ),
    ghost: cn(
      "bg-transparent",
      "text-muted-foreground",
      "hover:bg-muted/20",
      "hover:text-foreground",
      "active:scale-[0.98]"
    )
  }

  const sizeClasses = {
    sm: "h-7 text-xs",
    md: "h-8 text-sm",
    lg: "h-10 text-base"
  }

  const iconSizeClasses = {
    sm: "w-7 h-7",
    md: "w-8 h-8", 
    lg: "w-10 h-10"
  }

  const iconClasses = cn(
    "absolute right-0 top-0 flex items-center justify-center",
    "bg-gradient-to-b from-black/80 to-black/60",
    "text-white rounded-full",
    "shadow-inner",
    "transition-all duration-200",
    "group-hover:from-black/90 group-hover:to-black/70",
    iconSizeClasses[size]
  )

  const textClasses = cn(
    "px-4 pr-10",
    {
      "pr-9": size === 'sm',
      "pr-10": size === 'md',
      "pr-12": size === 'lg'
    }
  )

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-full" />
      
      {/* Text content */}
      <span className={textClasses}>
        {children}
      </span>
      
      {/* Icon circle */}
      {icon && (
        <div className={iconClasses}>
          <div className="text-white [&>svg]:w-3 [&>svg]:h-3 [&>svg]:text-white">
            {icon}
          </div>
        </div>
      )}
    </button>
  )
}