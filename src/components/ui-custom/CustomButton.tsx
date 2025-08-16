import React from 'react'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomButtonProps {
  icon: LucideIcon
  title: string
  description?: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  variant = 'outline',
  size = 'md',
  className,
  disabled = false
}) => {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  }

  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full justify-start text-left h-auto',
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-center gap-3 w-full">
        <Icon 
          className={cn(
            iconSizes[size],
            'text-muted-foreground flex-shrink-0'
          )} 
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{title}</div>
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {description}
            </div>
          )}
        </div>
      </div>
    </Button>
  )
}