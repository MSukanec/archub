import React from 'react'
import { LayoutGrid, Plus, Edit, Trash2 } from 'lucide-react'
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
  budgetSelector,
  tabs,
  activeTab,
  onTabChange,
  className
}: ActionBarDesktopProps) {
  return (
    <div 
      className={cn(
        "hidden md:flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--card-border)] mb-6 shadow-lg",
        className
      )}
      style={{ backgroundColor: "var(--card-bg)" }}
    >
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
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={budgetSelector.onEditBudget}
              >
                <Edit className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
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

        {/* 3. SECONDARY BUTTONS (Custom actions) */}
        {customActions.map((action, index) => (
          <div key={index}>{action}</div>
        ))}

        {/* 4. PRIMARY BUTTON */}
        {primaryActionLabel && onPrimaryActionClick && (
          <Button
            onClick={onPrimaryActionClick}
            className="h-9 px-4"
          >
            <Plus className="w-4 h-4" />
            {primaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}