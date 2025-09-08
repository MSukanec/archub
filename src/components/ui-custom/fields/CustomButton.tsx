import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomButtonProps {
  icon: LucideIcon
  title: string
  description?: string
  onClick: () => void
  className?: string
  disabled?: boolean
  variant?: 'default' | 'destructive'
  showPlusIcon?: boolean
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  className,
  disabled = false,
  variant = 'default',
  showPlusIcon = false
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className={cn(
        "group relative w-full transition-all duration-200",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onClick()
        }}
        disabled={disabled}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
          "text-left bg-transparent",
          variant === 'destructive' ? "hover:bg-destructive/5" : "hover:bg-accent/5",
          "border-solid border-[var(--input-border)]",
          variant === 'destructive' ? "hover:border-destructive" : "hover:border-accent",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          variant === 'destructive' ? "focus:ring-destructive" : "focus:ring-accent",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--input-border)]",
          isHovered && !disabled && (variant === 'destructive' ? "border-destructive shadow-sm" : "border-accent shadow-sm")
        )}
      >
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          variant === 'destructive' ? "bg-destructive/10" : "bg-accent/10"
        )}>
          <Icon className={cn(
            "w-4 h-4",
            variant === 'destructive' ? "text-destructive" : "text-accent"
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium text-sm transition-colors duration-200",
            variant === 'destructive' ? "text-destructive" : "text-foreground",
            isHovered && !disabled && (variant === 'destructive' ? "text-destructive/80" : "text-accent")
          )}>
            {title}
          </div>
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {description}
            </div>
          )}
        </div>

        {/* Conditional Plus Icon */}
        {showPlusIcon && (
          <div className="flex-shrink-0">
            <Plus className={cn(
              "h-4 w-4 text-muted-foreground transition-colors duration-200",
              isHovered && !disabled && "text-accent"
            )} />
          </div>
        )}
      </button>
    </div>
  )
}