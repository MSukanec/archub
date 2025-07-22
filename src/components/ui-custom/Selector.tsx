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

  const handleMouseLeave = () => {
    setOpen(false)
  }

  return (
    <div onMouseLeave={handleMouseLeave}>
      <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            // Base button styling identical to ghost variant
            "inline-flex items-center justify-between whitespace-nowrap transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0",
            "disabled:pointer-events-none disabled:opacity-60",
            // Ghost button styling exactly from buttonVariants (without hover translate)
            "bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)]",
            "hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)]",
            "rounded-lg px-4 py-2 shadow-button-normal hover:shadow-button-hover",
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
          align="start" 
          className="w-[var(--radix-popover-trigger-width)] p-0 rounded-lg shadow-button-normal border"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)'
          }}
          sideOffset={4}
        >
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm font-medium transition-colors",
                  "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)]",
                  value === option.value && "bg-[var(--button-ghost-hover-bg)]"
                )}
              >
                {option.label}
              </button>
            ))}
            
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-[var(--button-ghost-text)]">
                No hay opciones disponibles
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}