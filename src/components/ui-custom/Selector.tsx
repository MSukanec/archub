import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface SelectorOption {
  value: string
  label: string
}

interface SelectorProps {
  options: SelectorOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function Selector({
  options = [],
  value,
  onValueChange,
  placeholder = "Seleccionar...",
  className,
  disabled = false
}: SelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedOption = options.find(option => option.value === value)
  const displayText = selectedOption?.label || placeholder

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            // Base button styling identical to secondary variant
            "inline-flex items-center justify-between whitespace-nowrap transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0",
            "disabled:pointer-events-none disabled:opacity-60",
            // Secondary button styling exactly from buttonVariants
            "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] border border-[var(--button-secondary-border)]",
            "hover:bg-[var(--button-secondary-hover-bg)] hover:text-[var(--button-secondary-hover-text)] hover:border-[var(--button-secondary-hover-border)]",
            "rounded-lg px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
            "text-sm font-medium",
            "w-full min-w-0", // Full width and allow text truncation
            className
          )}
        >
          <span className="truncate text-left flex-1">{displayText}</span>
          <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-1" 
        align="start"
        sideOffset={4}
      >
        <div className="space-y-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                value === option.value && "bg-accent text-accent-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
          
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No hay opciones disponibles
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}