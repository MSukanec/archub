import React from 'react'
import { cn } from '@/lib/utils'

interface CustomCardProps {
  children?: React.ReactNode
  title?: string
  description?: string
  colorScheme: 'green' | 'purple' | 'blue' | 'orange' | 'red'
  icon?: React.ReactNode
  className?: string
  topContent?: React.ReactNode
  onClick?: () => void
}

export const CustomCard: React.FC<CustomCardProps> = ({
  children,
  title,
  description,
  colorScheme,
  icon,
  className,
  topContent,
  onClick
}) => {
  return (
    <div 
      className={cn(
        `border cursor-pointer transition-all duration-200 hover:shadow-lg`,
        `rounded-lg`,
        className
      )}
      style={{ 
        borderColor: `var(--colorful-card-${colorScheme}-border)`
      }}
      onClick={onClick}
    >
      {/* Top Content Section */}
      <div 
        className="rounded-t-lg p-4 min-h-[100px] flex flex-col justify-center"
        style={{ 
          backgroundColor: `var(--colorful-card-${colorScheme}-top-bg)`,
          color: `var(--colorful-card-${colorScheme}-top-fg)`
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
        className="h-0.5"
        style={{
          background: `linear-gradient(to right, var(--colorful-card-${colorScheme}-color-1), var(--colorful-card-${colorScheme}-color-2))`
        }}
      />

      {/* Bottom Description Section */}
      <div 
        className="rounded-b-lg px-4 py-3 min-h-[60px] flex flex-col justify-center"
        style={{ 
          backgroundColor: `var(--colorful-card-${colorScheme}-bot-bg)`
        }}
      >
        {children || (
          <div className="space-y-1">
            {title && (
              <h3 
                className="font-medium text-sm leading-tight"
                style={{ color: `var(--colorful-card-${colorScheme}-text)` }}
              >
                {title}
              </h3>
            )}
            {description && (
              <p 
                className="text-xs opacity-75 leading-tight"
                style={{ color: `var(--colorful-card-${colorScheme}-text)` }}
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

export default CustomCard