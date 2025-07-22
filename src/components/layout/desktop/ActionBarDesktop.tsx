import React from 'react'
import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ActionBarDesktopProps {
  title?: string
  searchValue?: string
  onSearch?: (value: string) => void
  searchPlaceholder?: string
  showFilters?: boolean
  onFilterClick?: () => void
  primaryActionLabel?: string
  onPrimaryActionClick?: () => void
  customActions?: React.ReactNode[]
  className?: string
}

export function ActionBarDesktop({
  title,
  searchValue = '',
  onSearch,
  searchPlaceholder = 'Buscar...',
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
      {/* Left side - Title and Search */}
      <div className="flex items-center gap-4 flex-1">
        {title && (
          <h1 className="text-lg font-semibold text-[var(--card-fg)] whitespace-nowrap">
            {title}
          </h1>
        )}
        
        {onSearch && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Filters button */}
        {showFilters && onFilterClick && (
          <Button
            variant="outline"
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