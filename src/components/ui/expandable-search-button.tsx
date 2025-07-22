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
            "group relative bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)]",
            "rounded-lg shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5",
            "transition-all duration-300 overflow-hidden flex items-center gap-2",
            "h-9 px-4 py-2",
            isExpanded ? "w-80 bg-white border border-gray-300 focus-within:border-accent" : "w-auto"
          )}
        >
          {/* Search Icon - moves to right when expanded */}
          <Search 
            className={cn(
              "h-4 w-4 transition-all duration-300 shrink-0",
              isExpanded ? "order-2 text-gray-400" : "order-1"
            )} 
          />
          
          {/* Button Text - only visible when collapsed */}
          <span 
            className={cn(
              "whitespace-nowrap transition-all duration-300",
              isExpanded ? "opacity-0 w-0" : "opacity-100 w-auto"
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
              "bg-transparent border-none outline-none flex-1 text-sm transition-all duration-300",
              isExpanded ? "opacity-100 w-full order-1" : "opacity-0 w-0 pointer-events-none"
            )}
          />
          
          {/* Close Button - only visible when expanded */}
          {isExpanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleClose()
              }}
              className="order-3 p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
            >
              <X className="h-3 w-3 text-gray-400" />
            </button>
          )}
        </button>
      </form>
    </div>
  )
}