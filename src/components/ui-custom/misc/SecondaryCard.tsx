import React from 'react'
import { cn } from '@/lib/utils'

interface SecondaryCardProps {
  children?: React.ReactNode
  title?: string
  icon?: React.ReactNode
  className?: string
  onClick?: () => void
}

export const SecondaryCard: React.FC<SecondaryCardProps> = ({
  children,
  title,
  icon,
  className,
  onClick
}) => {
  return (
    <div 
      className={cn(
        `border cursor-pointer transition-all duration-200 hover:shadow-lg`,
        `rounded-lg border-border bg-card`,
        className
      )}
      onClick={onClick}
    >
      {/* Header Section */}
      <div className="p-4 flex items-center gap-3">
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
        {title && (
          <h3 className="font-medium text-card-foreground">
            {title}
          </h3>
        )}
      </div>

      {/* Content Section */}
      <div className="px-4 pb-4">
        {children}
      </div>

      {/* Bottom Gradient Border */}
      <div 
        className="h-1 rounded-b-lg"
        style={{
          background: `linear-gradient(to right, var(--secondary-card-color-1), var(--secondary-card-color-2))`
        }}
      />
    </div>
  )
}