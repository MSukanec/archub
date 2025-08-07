import React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  customContent?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  customContent,
  className
}: EmptyStateProps) {
  return (
      <div className={cn(
        "w-full max-w-lg md:max-w-none mx-auto py-12 md:py-20 px-4 text-center",
        "min-h-[70vh] md:min-h-0 md:h-[70%]",
        "border-2 border-dashed rounded-xl",
        "bg-background/50 backdrop-blur-sm transition-all duration-300",
        "hover:bg-background/70",
        "flex flex-col justify-center items-center relative overflow-hidden",
        className
      )}
      style={{
        borderColor: 'var(--accent)',
      }}>
        {/* Diagonal Hatch Background Pattern */}
          <div 
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                var(--accent) 0px,
                var(--accent) 1px,
                transparent 1px,
                transparent 12px
              )`
            }}
          />
        </div>

        {/* Icon container */}
        {icon && (
            <div 
              style={{
                backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
                borderColor: 'rgba(var(--accent-rgb), 0.2)',
                color: 'var(--accent)'
              }}
            >
                {icon}
              </div>
            </div>
            
            {/* Subtle icon glow */}
            <div 
              style={{
                backgroundColor: 'rgba(var(--accent-rgb), 0.05)'
              }}
            />
            
            {/* Floating particles */}
              <div 
                style={{ 
                  backgroundColor: 'rgba(var(--accent-rgb), 0.3)',
                  animationDelay: '0s', 
                  animationDuration: '6s' 
                }}
              ></div>
              <div 
                style={{ 
                  backgroundColor: 'rgba(var(--accent-rgb), 0.4)',
                  animationDelay: '2s', 
                  animationDuration: '8s' 
                }}
              ></div>
              <div 
                style={{ 
                  backgroundColor: 'rgba(var(--accent-rgb), 0.2)',
                  animationDelay: '4s', 
                  animationDuration: '7s' 
                }}
              ></div>
              <div 
                style={{ 
                  backgroundColor: 'rgba(var(--accent-rgb), 0.35)',
                  animationDelay: '1s', 
                  animationDuration: '9s' 
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Custom Content - before main content */}
        {customContent && (
            {customContent}
          </div>
        )}

        {/* Content */}
            {title}
          </h3>
          
          {description && (
              {description}
            </p>
          )}
          
          {action && (
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}