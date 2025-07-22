import React from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpandableSearchButton } from '@/components/ui/expandable-search-button'
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
  return (
    <div 
      className={cn(
        "hidden md:flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)] mb-6",
        className
      )}
      style={{ backgroundColor: "var(--card-bg)" }}
    >
      {/* Left side - Empty for spacing */}
      <div className="flex-1"></div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Expandable Search Button */}
        {showSearch && (
          <ExpandableSearchButton
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchClick}
            placeholder="Buscar tareas, rubros o fases..."
          />
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