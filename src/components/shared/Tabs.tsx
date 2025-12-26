import React from 'react'
import { cn } from '@/lib/utils'
interface Tab {
  value: string
  label: string
  icon?: React.ReactNode
  badge?: string
}
interface TabsProps {
  tabs: Tab[]
  value: string
  onValueChange: (value: string) => void
  className?: string
  fullWidth?: boolean
}
export function Tabs({ tabs, value, onValueChange, className, fullWidth = false }: TabsProps) {
  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-lg p-1 gap-0.5",
        "bg-[var(--button-ghost-bg)] border border-[var(--card-border)]",
        "shadow-button-normal",
        fullWidth && "w-full",
        className
      )}
    >
      {tabs.map((tab, index) => (
        <button
          key={`${tab.value}-${index}`}
          onClick={() => onValueChange(tab.value)}
          className={cn(
            "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150",
            "px-3 py-1.5 h-8",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0",
            "disabled:pointer-events-none disabled:opacity-60",
            "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
            fullWidth && "flex-1",
            value === tab.value
              ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm rounded-lg"
              : "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)] rounded-md"
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.badge && (
            <span 
              className={cn(
                "px-1.5 py-0.5 text-[10px] font-semibold rounded-full leading-none",
                value === tab.value
                  ? "bg-white/20 text-white"
                  : "bg-[var(--accent)] text-white"
              )}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
