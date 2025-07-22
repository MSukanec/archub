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
      {!isExpanded ? (
        // Collapsed state - Ghost button (identical to Filtros button)
        <button
          type="button"
          onClick={handleClick}
          className="bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)] rounded-lg px-3 py-2 shadow-button-normal transition-all duration-200 flex items-center gap-2 h-9 text-sm font-medium"
        >
          <Search className="h-4 w-4 mr-2" />
          <span className="whitespace-nowrap">Buscar</span>
        </button>
      ) : (
        // Expanded state - Search form (maintaining exact same styling as collapsed)
        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-[var(--button-ghost-bg)] text-[var(--button-ghost-text)] rounded-lg shadow-button-normal border border-[var(--button-ghost-border)] transition-all duration-200 flex items-center gap-2 h-9 px-3 py-2 w-80">
            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={placeholder}
              className="bg-transparent border-none outline-none flex-1 text-sm font-medium text-[var(--button-ghost-text)] placeholder:text-[var(--button-ghost-text)]"
            />
            
            {/* Search Icon */}
            <Search className="h-4 w-4 shrink-0 text-[var(--button-ghost-text)] mr-2" />
            
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-full transition-colors shrink-0"
            >
              <X className="h-3 w-3 text-[var(--button-ghost-text)]" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}