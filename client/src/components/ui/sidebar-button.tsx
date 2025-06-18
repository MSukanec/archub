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
  if (!isExpanded) {
    // Collapsed state: only icon, centered, exact BUTTON_SIZE
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center justify-center rounded-lg transition-colors",
          "hover:shadow-sm hover:scale-[1.02]",
          isActive
            ? "text-primary bg-primary/10 shadow-sm"
            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700",
          className
        )}
        style={{
          width: `${BUTTON_SIZE}px`,
          height: `${BUTTON_SIZE}px`,
        }}
      >
        <Icon 
          className={cn(
            "flex-shrink-0",
            isActive 
              ? "text-primary" 
              : "text-slate-400"
          )}
          style={{
            width: `${ICON_SIZE}px`,
            height: `${ICON_SIZE}px`,
          }}
        />
      </button>
    )
  }

  // Expanded state: icon + text, full width, left aligned
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center px-3 gap-2 rounded-lg transition-colors w-full",
        "hover:shadow-sm hover:scale-[1.01]",
        isActive
          ? "text-primary bg-primary/10 shadow-sm"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700",
        className
      )}
      style={{
        height: `${BUTTON_SIZE}px`,
      }}
    >
      <Icon 
        className={cn(
          "flex-shrink-0",
          isActive 
            ? "text-primary" 
            : "text-slate-400"
        )}
        style={{
          width: `${ICON_SIZE}px`,
          height: `${ICON_SIZE}px`,
        }}
      />
      {children && (
        <span 
          className={cn(
            "text-sm font-medium whitespace-nowrap",
            isActive 
              ? "text-primary" 
              : "text-slate-700 dark:text-slate-300"
          )}
        >
          {children}
        </span>
      )}
    </button>
  )
}