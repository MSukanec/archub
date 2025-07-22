import React from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  value: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function Tabs({ tabs, value, onValueChange, className }: TabsProps) {
  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-lg p-1 gap-0.5",
        "bg-[var(--button-ghost-bg)] border border-[var(--card-border)]",
        "shadow-button-normal",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onValueChange(tab.value)}
          className={cn(
            "inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150",
            "px-3 py-1.5 h-8",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0",
            "disabled:pointer-events-none disabled:opacity-60",
            "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
            value === tab.value
              ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm rounded-lg"
              : "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)] rounded-md"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}