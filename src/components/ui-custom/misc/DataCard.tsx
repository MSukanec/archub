import React from 'react'
import { cn } from '@/lib/utils'

interface DataCardProps {
  children?: React.ReactNode
  title?: string
  description?: string
  icon?: React.ReactNode
  className?: string
  topContent?: React.ReactNode
  onClick?: () => void
}

export const DataCard: React.FC<DataCardProps> = ({
  children,
  title,
  description,
  icon,
  className,
  topContent,
  onClick
}) => {
  return (
    <div 
      className={cn(
        `border cursor-pointer transition-all duration-200 hover:shadow-lg`,
        `rounded-lg border-border`,
        className
      )}
      onClick={onClick}
    >
      {/* Top Content Section */}
      <div 
        className="rounded-t-lg p-4 min-h-[100px] flex flex-col justify-center"
        style={{ 
          backgroundColor: `var(--colorful-card-top-bg)`,
          color: `var(--colorful-card-top-fg)`
        }}
      >
        {topContent || (
          <div className="flex items-center justify-center">
            {icon && (
              <div className="p-2 rounded-lg">
                {icon}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gradient Divider */}
      <div 
        className="h-1"
        style={{
          background: `linear-gradient(to right, var(--colorful-card-color-1), var(--colorful-card-color-2))`
        }}
      />

      {/* Bottom Description Section */}
      <div 
        className="rounded-b-lg px-4 py-3 min-h-[60px] flex flex-col justify-center"
        style={{ 
          backgroundColor: `var(--colorful-card-bot-bg)`
        }}
      >
        {children || (
          <div className="space-y-1">
            {title && (
              <h3 
                className="font-medium text-sm leading-tight"
                style={{ color: `var(--colorful-card-text)` }}
              >
                {title}
              </h3>
            )}
            {description && (
              <p 
                className="text-xs opacity-75 leading-tight"
                style={{ color: `var(--colorful-card-text)` }}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}