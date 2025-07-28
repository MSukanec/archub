import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.value === value)
  const displayText = selectedOption?.label || placeholder

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue)
    setOpen(false)
  }

  const handleMouseEnter = () => {
    setOpen(true)
  }

  const handleMouseLeave = () => {
    setOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div 
      ref={containerRef}
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {/* Main button */}
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
          "rounded-lg px-2 py-2 shadow-button-normal hover:shadow-button-hover",
          "text-sm font-medium",
          "min-w-fit", // Minimum width to fit content
          className
        )}
      >
        <span className="text-left flex-1 whitespace-nowrap">{displayText}</span>
        <ChevronDown className={cn(
          "w-4 h-4 ml-2 shrink-0 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </button>
      
      {/* Expanded options */}
      {open && (
        <>
          {/* Invisible bridge to prevent hover gaps */}
          <div className="absolute top-full left-0 right-0 h-1 z-40" />
          
          <div 
            className="absolute top-full left-0 z-50 mt-1 rounded-lg shadow-button-normal border min-w-full"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              maxHeight: '200px' // Límite de altura fijo
            }}
          >
            <div 
              className="py-1 overflow-y-auto overflow-x-hidden"
              style={{
                maxHeight: '200px' // Scroll interno dentro del popover
              }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full text-left px-2 py-2 text-sm font-medium transition-colors",
                    "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)]",
                    value === option.value && "bg-[var(--button-ghost-hover-bg)]",
                    "whitespace-nowrap" // Prevenir wrap de texto
                  )}
                >
                  {option.label}
                </button>
              ))}
              
              {options.length === 0 && (
                <div className="px-2 py-2 text-sm text-[var(--button-ghost-text)]">
                  No hay opciones disponibles
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}