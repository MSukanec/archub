import React from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpandableSearchButton } from '@/components/ui/expandable-search-button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface ActionBarDesktopProps {
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSearchClick?: () => void
  showGrouping?: boolean
  groupingType?: string
  onGroupingChange?: (type: string) => void
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
  showGrouping = true,
  groupingType = 'none',
  onGroupingChange,
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

        {/* Grouping button */}
        {showGrouping && onGroupingChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3"
              >
                <Filter />
                Agrupar
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              align="end" 
              className="w-48 p-0 rounded-lg shadow-button-normal border"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)'
              }}
            >
              <div className="py-1">
                <button
                  onClick={() => onGroupingChange('none')}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-medium transition-colors",
                    "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)]",
                    groupingType === 'none' && "bg-[var(--button-ghost-hover-bg)]"
                  )}
                >
                  Sin agrupar
                </button>
                <button
                  onClick={() => onGroupingChange('rubros')}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-medium transition-colors",
                    "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)]",
                    groupingType === 'rubros' && "bg-[var(--button-ghost-hover-bg)]"
                  )}
                >
                  Agrupar por Rubros
                </button>
                <button
                  onClick={() => onGroupingChange('phases')}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-medium transition-colors",
                    "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)]",
                    groupingType === 'phases' && "bg-[var(--button-ghost-hover-bg)]"
                  )}
                >
                  Agrupar por Fases
                </button>
                <button
                  onClick={() => onGroupingChange('rubros-phases')}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-medium transition-colors",
                    "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)]",
                    groupingType === 'rubros-phases' && "bg-[var(--button-ghost-hover-bg)]"
                  )}
                >
                  Rubros y Fases
                </button>
                <button
                  onClick={() => onGroupingChange('phases-rubros')}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-medium transition-colors",
                    "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)]",
                    groupingType === 'phases-rubros' && "bg-[var(--button-ghost-hover-bg)]"
                  )}
                >
                  Fases y Rubros
                </button>
              </div>
            </PopoverContent>
          </Popover>
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