import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BUTTON_SIZE, ICON_SIZE, TRANSITION_DURATION } from '@/lib/constants/ui'

interface SidebarButtonProps {
  icon: LucideIcon
  children?: React.ReactNode
  isActive?: boolean
  onClick?: () => void
  className?: string
  isExpanded?: boolean
}

export function SidebarButton({ 
  icon: Icon, 
  children,
  isActive = false, 
  onClick, 
  className,
  isExpanded = false
}: SidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center rounded-lg transition-all group relative overflow-hidden",
        "hover:shadow-sm hover:scale-[1.02]",
        isActive
          ? "text-primary bg-primary/10 shadow-sm"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700",
        // When collapsed, center the content
        !isExpanded && "justify-center",
        // When expanded, align left with padding
        isExpanded && "justify-start px-3",
        className
      )}
      style={{
        width: isExpanded ? '100%' : `${BUTTON_SIZE}px`,
        height: `${BUTTON_SIZE}px`,
        transitionDuration: `${TRANSITION_DURATION}ms`,
      }}
    >
      <Icon 
        className={cn(
          "flex-shrink-0 transition-colors",
          isActive 
            ? "text-primary" 
            : "text-slate-400 group-hover:text-slate-500",
          // Add margin when expanded and has children
          isExpanded && children && "mr-3"
        )}
        style={{
          width: `${ICON_SIZE}px`,
          height: `${ICON_SIZE}px`,
        }}
      />
      {/* Text content only visible when expanded */}
      {isExpanded && children && (
        <span 
          className={cn(
            "text-sm font-medium whitespace-nowrap transition-opacity",
            isActive 
              ? "text-primary" 
              : "text-slate-700 dark:text-slate-300"
          )}
          style={{ transitionDuration: `${TRANSITION_DURATION}ms` }}
        >
          {children}
        </span>
      )}
    </button>
  )
}