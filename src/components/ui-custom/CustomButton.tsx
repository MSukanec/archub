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
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  className,
  disabled = false
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
          "text-left bg-transparent hover:bg-accent/5",
          "border-solid border-[var(--input-border)] hover:border-accent",
          "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--input-border)]",
          isHovered && !disabled && "border-accent shadow-sm"
        )}
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-accent" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium text-sm transition-colors duration-200",
            "text-foreground",
            isHovered && !disabled && "text-accent"
          )}>
            {title}
          </div>
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {description}
            </div>
          )}
        </div>

        {/* Always Visible Add Icon */}
        <div className="flex-shrink-0">
          <Plus className={cn(
            "h-4 w-4 text-muted-foreground transition-colors duration-200",
            isHovered && !disabled && "text-accent"
          )} />
        </div>
      </button>
    </div>
  )
}