import React, { useState } from 'react'
import { LayoutGrid, Plus, Edit, Trash2, X, Filter, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpandableSearchButton } from '@/components/ui/expandable-search-button'
import { Tabs } from '@/components/ui-custom/Tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Selector } from '@/components/ui-custom/Selector'
import { cn } from '@/lib/utils'

interface BudgetSelectorProps {
  budgets: any[]
  selectedBudgetId: string
  onBudgetChange: (budgetId: string) => void
  onEditBudget: () => void
  onDeleteBudget: () => void
}

interface Tab {
  value: string
  label: string
  icon?: React.ReactNode
}

interface ActionBarDesktopProps {
  // Header section (new)
  title?: string
  icon?: React.ReactNode
  // Expandable info section
  expandableContent?: React.ReactNode
  expandableDescription?: string
  // Action bar functionality
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
  budgetSelector?: BudgetSelectorProps
  tabs?: Tab[]
  activeTab?: string
  onTabChange?: (value: string) => void
  // Custom filters and clear function
  customFilters?: React.ReactNode
  onClearFilters?: () => void
  hasActiveFilters?: boolean
  // Today button for gradebook pages
  onTodayClick?: () => void
  className?: string
}

export function ActionBarDesktop({
  title,
  icon,
  expandableContent,
  expandableDescription,
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
  budgetSelector,
  tabs,
  activeTab,
  onTabChange,
  customFilters,
  onClearFilters,
  hasActiveFilters = false,
  onTodayClick,
  className
}: ActionBarDesktopProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div 
      className={cn(
        "hidden md:flex flex-col rounded-lg border border-[var(--card-border)] mb-6 shadow-lg",
        className
      )}
      style={{ backgroundColor: "var(--card-bg)" }}
    >
      {/* Top Row - Title and Icon */}
      {(title || icon) && (
        <>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="text-accent">
                    {icon}
                  </div>
                )}
                {title && (
                  <h2 className="text-xl font-semibold text-foreground">
                    {title}
                  </h2>
                )}
              </div>
              
              {/* Expandable button - Only show if expandableContent exists */}
              {(expandableContent || expandableDescription) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span className="text-sm mr-2">
                    {isExpanded ? 'Ocultar información' : 'Click para más información'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Expandable Content */}
          {isExpanded && (expandableContent || expandableDescription) && (
            <div className="px-4 pb-3">
              <div className="rounded-lg p-4" style={{ backgroundColor: "var(--muted-bg)" }}>
                {expandableDescription && (
                  <p className="text-muted-foreground mb-3">
                    {expandableDescription}
                  </p>
                )}
                {expandableContent && (
                  <div className="text-muted-foreground">
                    {expandableContent}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Divider line */}
          <div className="border-t border-[var(--card-border)]" />
        </>
      )}

      {/* Bottom Row - ActionBar Content */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Tabs OR Budget Selector (casos puntuales) */}
        <div className="flex items-center gap-3">
        {/* Tabs - For pages with tab navigation like cronograma */}
        {tabs && activeTab && onTabChange && (
          <Tabs
            tabs={tabs}
            value={activeTab}
            onValueChange={onTabChange}
          />
        )}
        
        {/* Budget Selector - ONLY for specific cases like budgets page */}
        {budgetSelector && (
          <div className="flex items-center gap-2">
            <div className="w-64">
              <Selector
                options={budgetSelector.budgets.map((budget: any) => ({
                  value: budget.id,
                  label: budget.name
                }))}
                value={budgetSelector.selectedBudgetId}
                onValueChange={budgetSelector.onBudgetChange}
                placeholder="Selecciona un presupuesto"
                className="h-8"
              />
            </div>
            
            {/* Budget Action Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost-icon"
                onClick={budgetSelector.onEditBudget}
              >
                <Edit className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost-icon"
                className="text-destructive hover:text-destructive"
                onClick={budgetSelector.onDeleteBudget}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right side - SEARCH → GHOST BUTTONS → SECONDARY → PRIMARY */}
      <div className="flex items-center gap-2">
        {/* 1. SEARCH */}
        {showSearch && (
          <ExpandableSearchButton
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchClick}
            placeholder="Buscar tareas, rubros o fases..."
          />
        )}

        {/* 2. GHOST BUTTONS */}
        {showGrouping && onGroupingChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost-icon"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              align="start" 
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



        {/* Custom Filters Popover */}
        {customFilters && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost-icon"
                className={cn(
                  hasActiveFilters && "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
                )}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              align="start" 
              className="w-48 p-0 rounded-lg shadow-button-normal border"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)'
              }}
            >
              <div className="p-3">
                {customFilters}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Clear Filters Button */}
        {onClearFilters && (
          <Button
            variant="ghost-icon"
            onClick={onClearFilters}
            title="Limpiar filtros"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* 3. SECONDARY BUTTONS (Custom actions) */}
        {customActions.map((action, index) => (
          <div key={index}>{action}</div>
        ))}

        {/* 4. PRIMARY BUTTON */}
        {primaryActionLabel && onPrimaryActionClick && (
          <Button
            onClick={onPrimaryActionClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            {primaryActionLabel}
          </Button>
        )}

        {/* Today Button - For gradebook pages (rightmost position) */}
        {onTodayClick && (
          <Button
            variant="ghost"
            onClick={onTodayClick}
            title="Ir a hoy"
          >
            <CalendarDays className="w-4 h-4 mr-1" />
            Hoy
          </Button>
        )}
        </div>
      </div>
    </div>
  )
}