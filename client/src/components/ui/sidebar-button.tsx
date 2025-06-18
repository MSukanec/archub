import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BUTTON_SIZE, ICON_SIZE } from '@/lib/constants/ui'

interface SidebarButtonProps {
  icon: LucideIcon
  isActive?: boolean
  onClick?: () => void
  className?: string
}

export function SidebarButton({ 
  icon: Icon, 
  isActive = false, 
  onClick, 
  className 
}: SidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-lg transition-colors",
        isActive
          ? "text-primary bg-primary/10"
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
            : "text-slate-400 hover:text-slate-500"
        )}
        style={{
          width: `${ICON_SIZE}px`,
          height: `${ICON_SIZE}px`,
        }}
      />
    </button>
  )
}