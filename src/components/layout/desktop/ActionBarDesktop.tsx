import React, { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ActionBarDesktopProps {
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSearchClick?: () => void
  showFilters?: boolean
  onFilterClick?: () => void
  primaryActionLabel?: string
  onPrimaryActionClick?: () => void
  customActions?: React.ReactNode[]
  className?: string
}

export function ActionBarDesktop({
  showSearch = true,
  searchValue = '',
  onSearchChange,
  onSearchClick,
  showFilters = true,
  onFilterClick,
  primaryActionLabel,
  onPrimaryActionClick,
  customActions = [],
  className
}: ActionBarDesktopProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  const handleSearchClick = () => {
    setIsSearchExpanded(true)
    if (onSearchClick) {
      onSearchClick()
    }
  }

  const handleSearchClose = () => {
    setIsSearchExpanded(false)
    if (onSearchChange) {
      onSearchChange('')
    }
  }

  return (
    <div 
      className={cn(
        "hidden md:flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)] mb-6 transition-all duration-300",
        className
      )}
      style={{ backgroundColor: "var(--card-bg)" }}
    >
      {/* Left side - Search expanded or empty */}
      <div className="flex items-center flex-1">
        {isSearchExpanded && (
          <div className="relative flex-1 max-w-md mr-4">
            <Input
              type="text"
              placeholder="Buscar tareas, rubros o fases..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pr-12 h-9 bg-white rounded-full border-gray-300 focus:border-accent focus:ring-accent"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Search className="h-4 w-4 text-gray-400" />
              <button
                onClick={handleSearchClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Search button - hidden when expanded */}
        {showSearch && !isSearchExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearchClick}
            className="h-9 px-3"
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        )}

        {/* Filters button */}
        {showFilters && onFilterClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onFilterClick}
            className="h-9 px-3"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        )}

        {/* Custom actions */}
        {customActions.map((action, index) => (
          <div key={index}>{action}</div>
        ))}

        {/* Primary action button */}
        {primaryActionLabel && onPrimaryActionClick && (
          <Button
            onClick={onPrimaryActionClick}
            className="h-9 px-4"
          >
            {primaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}