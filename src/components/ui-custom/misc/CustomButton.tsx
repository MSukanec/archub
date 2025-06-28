import React from 'react'
import { cn } from '@/lib/utils'

interface CustomButtonProps {
  children?: React.ReactNode
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  iconOnly?: boolean
  className?: string
}

export const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(({
  children,
  icon,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  className
}, ref) => {
  const baseClasses = cn(
    "relative inline-flex items-center justify-center",
    "rounded-full overflow-hidden",
    "font-medium transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "group",
    iconOnly && "aspect-square"
  )

  const variantClasses = {
    primary: cn(
      "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900",
      "text-white border border-gray-700",
      "shadow-lg shadow-black/20",
      "hover:shadow-xl hover:shadow-black/30",
      "hover:scale-[1.02]",
      "active:scale-[0.98]"
    ),
    secondary: cn(
      "bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100",
      "text-gray-700 border border-gray-300",
      "shadow-sm shadow-gray-200/50",
      "hover:shadow-md hover:shadow-gray-300/30",
      "hover:scale-[1.02]",
      "active:scale-[0.98]"
    ),
    ghost: cn(
      "bg-transparent text-[var(--menues-fg)]",
      "border border-transparent",
      "hover:bg-[var(--button-ghost-hover-bg)]",
      "hover:scale-[1.02]",
      "active:scale-[0.98]"
    )
  }

  const sizeClasses = iconOnly ? {
    sm: "h-6 w-6 text-xs",
    md: "h-7 w-7 text-sm",
    lg: "h-8 w-8 text-base"
  } : {
    sm: "h-6 text-xs",
    md: "h-7 text-sm",
    lg: "h-8 text-base"
  }

  const iconSizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6", 
    lg: "w-7 h-7"
  }

  const iconClasses = iconOnly ? cn(
    "flex items-center justify-center",
    "text-inherit",
    "transition-all duration-200"
  ) : cn(
    "absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center",
    "bg-[var(--accent)] text-white rounded-full",
    "shadow-inner",
    "transition-all duration-200",
    "group-hover:bg-[var(--accent)]/90",
    iconSizeClasses[size]
  )

  const textClasses = cn(
    "px-4",
    {
      "pr-8": size === 'sm',
      "pr-9": size === 'md',
      "pr-10": size === 'lg'
    }
  )

  return (
    <button
      ref={ref}
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
      
      {/* Icon-only mode */}
      {iconOnly && icon ? (
        <div className={iconClasses}>
          <div className="text-inherit [&>svg]:w-3 [&>svg]:h-3">
            {icon}
          </div>
        </div>
      ) : (
        <>
          {/* Text content */}
          <span className={textClasses}>
            {children}
          </span>
          
          {/* Icon circle */}
          {icon && (
            <div className={iconClasses}>
              <div className="text-white [&>svg]:w-2.5 [&>svg]:h-2.5 [&>svg]:text-white">
                {icon}
              </div>
            </div>
          )}
        </>
      )}
    </button>
  )
})

CustomButton.displayName = "CustomButton"