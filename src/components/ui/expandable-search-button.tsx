import React, { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpandableSearchButtonProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSearchSubmit?: () => void
  placeholder?: string
  className?: string
}

export function ExpandableSearchButton({
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  placeholder = 'Buscar...',
  className
}: ExpandableSearchButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }

  const handleClose = () => {
    setIsExpanded(false)
    if (onSearchChange) {
      onSearchChange('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearchSubmit) {
      onSearchSubmit()
    }
  }

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <button
          type={isExpanded ? "submit" : "button"}
          onClick={handleClick}
          className={cn(
            // Base styles matching ghost button exactly - using gap-2 like regular ghost button
            "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium",
            "bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)]",
            "hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)]",
            "rounded-lg px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0",
            "disabled:pointer-events-none disabled:opacity-60",
            "transition-all duration-200 ease-out overflow-hidden",
            // Use gap-2 when collapsed (like regular ghost button), no gap when expanded
            isExpanded ? "w-80" : "w-auto gap-2"
          )}
        >
          {/* Search Icon - moves to right when expanded */}
          <Search 
            className={cn(
              "h-4 w-4 shrink-0 transition-all duration-200 ease-out",
              isExpanded ? "order-2" : "order-1"
            )} 
          />
          
          {/* Button Text - only visible when collapsed */}
          <span 
            className={cn(
              "transition-all duration-200 ease-out",
              isExpanded ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
            )}
          >
            Buscar
          </span>
          
          {/* Input Field - only visible when expanded */}
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "bg-transparent border-none outline-none text-sm font-medium",
              "text-[var(--button-ghost-text)] placeholder-ghost-text",
              "transition-all duration-200 ease-out",
              isExpanded ? "opacity-100 flex-1 order-1" : "opacity-0 w-0 pointer-events-none"
            )}
          />
          
          {/* Close Button - only visible when expanded */}
          {isExpanded && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleClose()
              }}
              className="order-3 p-1 hover:bg-[var(--button-ghost-hover-bg)] rounded-full transition-colors shrink-0 cursor-pointer"
            >
              <X className="h-3 w-3 text-[var(--button-ghost-text)]" />
            </div>
          )}
        </button>
      </form>
    </div>
  )
}