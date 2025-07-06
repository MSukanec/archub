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
        `border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg`,
        `card-${colorScheme}`,
        className
      )}
      style={{ 
        borderColor: `var(--card-${colorScheme}-border)`
      }}
      onClick={onClick}
    >
      {/* Top Content Section */}
      <div 
        className="rounded-t-lg p-6 min-h-[120px] flex flex-col justify-center"
        style={{ 
          backgroundColor: `var(--card-${colorScheme}-top-bg)`,
          color: `var(--card-${colorScheme}-top-fg)`
        }}
      >
        {topContent || (
          <div className="flex items-center justify-center">
            {icon && (
              <div className="p-3 rounded-lg">
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
          background: `linear-gradient(to right, var(--card-${colorScheme}-color-1), var(--card-${colorScheme}-color-2))`
        }}
      />

      {/* Bottom Description Section */}
      <div 
        className="rounded-b-lg p-4 min-h-[80px] flex flex-col justify-center"
        style={{ 
          backgroundColor: `var(--card-${colorScheme}-bot-bg)`
        }}
      >
        {children || (
          <div className="space-y-2">
            {title && (
              <h3 
                className="font-semibold text-lg"
                style={{ color: `var(--card-${colorScheme}-text)` }}
              >
                {title}
              </h3>
            )}
            {description && (
              <p 
                className="text-sm opacity-80"
                style={{ color: `var(--card-${colorScheme}-text)` }}
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