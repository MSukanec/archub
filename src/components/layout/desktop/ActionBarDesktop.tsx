import React, { useState } from 'react'
import { LayoutGrid, Plus, Edit, Trash2, X, Filter, CalendarDays, ChevronDown, ChevronUp, HelpCircle, Folder, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpandableSearchButton } from '@/components/ui/expandable-search-button'
import { Tabs } from '@/components/ui-custom/Tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Selector } from '@/components/ui-custom/Selector'
import { CustomRestricted } from '@/components/ui-custom/CustomRestricted'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useProjectContext } from '@/stores/projectContext'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'

interface BudgetSelectorProps {
  budgets: any[]
  selectedBudgetId: string
  onBudgetChange: (budgetId: string) => void
  onEditBudget: () => void
  onDeleteBudget: () => void
}

interface ParameterSelectorProps {
  parameters: any[]
  selectedParameterId: string
  onParameterChange: (parameterId: string) => void
  onEditParameter: () => void
  onDeleteParameter: () => void
}

interface Tab {
  value: string
  label: string
  icon?: React.ReactNode
}

interface FeatureItem {
  icon: React.ReactNode
  title: string
  description: string
}

interface ActionBarDesktopProps {
  // Header section (new)
  title?: string
  icon?: React.ReactNode
  // Expandable info section (now using FeatureIntroduction format)
  features?: FeatureItem[]
  // Project selector control
  showProjectSelector?: boolean
  // Action bar functionality
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSearchClick?: () => void
  showGrouping?: boolean
  groupingType?: string
  onGroupingChange?: (type: string) => void
  groupingOptions?: Array<{ value: string; label: string }>
  primaryActionLabel?: string
  onPrimaryActionClick?: () => void
  primaryActionRestriction?: {
    reason?: "coming_soon" | "general_mode" | string
    feature?: string
    current?: number
    functionName?: string
  }
  secondaryActionLabel?: string
  onSecondaryActionClick?: () => void
  customActions?: React.ReactNode[]
  customGhostButtons?: React.ReactNode[]
  budgetSelector?: BudgetSelectorProps
  parameterSelector?: ParameterSelectorProps
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
  features,
  showProjectSelector = true,
  showSearch = true,
  searchValue = '',
  onSearchChange,
  onSearchClick,
  showGrouping = true,
  groupingType = 'none',
  onGroupingChange,
  groupingOptions,
  primaryActionLabel,
  onPrimaryActionClick,
  primaryActionRestriction,
  secondaryActionLabel,
  onSecondaryActionClick,
  customActions = [],
  customGhostButtons = [],
  budgetSelector,
  parameterSelector,
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

  // Check if there's any content in the bottom row
  const hasBottomContent = Boolean(
    (tabs && activeTab && onTabChange) || // Tabs
    budgetSelector || // Budget selector
    (showGrouping && onGroupingChange) || // Grouping
    customFilters || // Custom filters
    onClearFilters || // Clear filters
    customActions.length > 0 || // Custom actions
    customGhostButtons.length > 0 || // Custom ghost buttons
    onTodayClick || // Today button
    (primaryActionLabel && onPrimaryActionClick) || // Primary action
    (secondaryActionLabel && onSecondaryActionClick) // Secondary action
  )

  // Don't render anything if there's no bottom content
  if (!hasBottomContent) {
    return null
  }

  return (
    <div 
      className={cn(
        "hidden md:flex flex-col rounded-lg border border-[var(--card-border)] mb-6 shadow-lg",
        className
      )}
      style={{ backgroundColor: "var(--card-bg)" }}
    >
      {/* Bottom Row - ActionBar Content */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Tabs OR Budget Selector */}
        <div className="flex items-center gap-3">
          {/* Tabs */}
          {tabs && activeTab && onTabChange && (
            <Tabs
              tabs={tabs}
              value={activeTab}
              onValueChange={onTabChange}
            />
          )}
          
          {/* Budget Selector */}
          {budgetSelector && (
            <div className="flex items-center gap-2">
              <div className="min-w-96 w-auto">
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
          
          {/* Parameter Selector */}
          {parameterSelector && (
            <div className="flex items-center gap-2">
              <div className="min-w-96 w-auto">
                <Selector
                  options={parameterSelector.parameters.map((parameter: any) => ({
                    value: parameter.id,
                    label: parameter.label
                  }))}
                  value={parameterSelector.selectedParameterId}
                  onValueChange={parameterSelector.onParameterChange}
                  placeholder="Selecciona un parámetro"
                  className="h-8"
                />
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost-icon"
                  onClick={parameterSelector.onEditParameter}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost-icon"
                  className="text-destructive hover:text-destructive"
                  onClick={parameterSelector.onDeleteParameter}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Filters and Actions */}
        <div className="flex items-center gap-2">
          {/* Custom Filters */}
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
              <PopoverContent className="w-56 p-2">
                <div className="space-y-1">
                  {customFilters}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Grouping Filter */}
          {showGrouping && onGroupingChange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost-icon"
                  className={cn(
                    groupingType !== 'none' && "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0">
                <div className="py-2">
                  {groupingOptions ? (
                    groupingOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onGroupingChange(option.value)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm font-medium transition-colors",
                          "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)]",
                          groupingType === option.value && "bg-[var(--button-ghost-hover-bg)]"
                        )}
                      >
                        {option.label}
                      </button>
                    ))
                  ) : (
                    <>
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
                        onClick={() => onGroupingChange('phases-rubros')}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm font-medium transition-colors",
                          "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)]",
                          groupingType === 'phases-rubros' && "bg-[var(--button-ghost-hover-bg)]"
                        )}
                      >
                        Agrupar por Fases y Rubros
                      </button>
                      <button
                        onClick={() => onGroupingChange('tasks')}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm font-medium transition-colors",
                          "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)]",
                          groupingType === 'tasks' && "bg-[var(--button-ghost-hover-bg)]"
                        )}
                      >
                        Agrupar por Rubros y Tareas
                      </button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Custom Actions */}
          {customActions.map((action, index) => (
            <div key={index}>{action}</div>
          ))}

          {/* Custom Ghost Buttons */}
          {customGhostButtons && customGhostButtons.map((button, index) => 
            <React.Fragment key={`ghost-btn-${index}`}>{button}</React.Fragment>
          )}

          {/* Today Button */}
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

          {/* Secondary Action Button */}
          {secondaryActionLabel && onSecondaryActionClick && (
            <Button
              variant="secondary"
              onClick={onSecondaryActionClick}
            >
              {secondaryActionLabel}
            </Button>
          )}

          {/* Primary Action Button */}
          {primaryActionLabel && onPrimaryActionClick && (
            <CustomRestricted
              reason={primaryActionRestriction?.reason}
              feature={primaryActionRestriction?.feature}
              current={primaryActionRestriction?.current}
              functionName={primaryActionRestriction?.functionName || primaryActionLabel}
            >
              <Button
                onClick={onPrimaryActionClick}
              >
                <Plus className="w-4 h-4 mr-2" />
                {primaryActionLabel}
              </Button>
            </CustomRestricted>
          )}
        </div>
      </div>
    </div>
  )
}