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
    <div className={cn("relative shrink-0", className)}>
      <form onSubmit={handleSubmit}>
        <button
          type={isExpanded ? "submit" : "button"}
          onClick={handleClick}
          className={cn(
            // EXACT COPY from button.tsx ghost variant - line by line identical
            "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0",
            "disabled:pointer-events-none disabled:opacity-60",
            "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
            "bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)]",
            "hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)]",
            "rounded-lg px-4 py-2 shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
            // Width and gap changes only when expanded - MAINTAIN EXACT HEIGHT  
            isExpanded ? "w-80 !gap-1 overflow-hidden h-10" : "h-4 w-4 p-0"
          )}
        >
          {!isExpanded && (
            <Search className="w-4 h-4" />
          )}
          
          {isExpanded && (
            <>
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={placeholder}
                className="bg-transparent border-none outline-none text-sm font-medium text-[var(--button-ghost-text)] placeholder-ghost-text flex-1 order-1"
              />
              <Search className="order-2" />
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleClose()
                }}
                className="order-3 p-1 hover:bg-[var(--button-ghost-hover-bg)] rounded-full transition-colors shrink-0 cursor-pointer"
              >
                <X className="h-3 w-3 text-[var(--button-ghost-text)] shrink-0" />
              </div>
            </>
          )}
        </button>
      </form>
    </div>
  )
}