import React, { useState } from 'react'
import { LayoutGrid, Plus, Edit, Trash2, X, Filter, CalendarDays, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpandableSearchButton } from '@/components/ui/expandable-search-button'
import { Tabs } from '@/components/ui-custom/Tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Selector } from '@/components/ui-custom/Selector'
import { ProjectSelector } from '@/components/navigation/ProjectSelector'
import { CustomRestricted } from '@/components/ui-custom/CustomRestricted'
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
  primaryActionLabel,
  onPrimaryActionClick,
  primaryActionRestriction,
  secondaryActionLabel,
  onSecondaryActionClick,
  customActions = [],
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
    showSearch || // Search
    (showGrouping && onGroupingChange) || // Grouping
    customFilters || // Custom filters
    onClearFilters || // Clear filters
    customActions.length > 0 || // Custom actions
    onTodayClick || // Today button
    (primaryActionLabel && onPrimaryActionClick) || // Primary action
    (secondaryActionLabel && onSecondaryActionClick) // Secondary action
  )

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
                {/* Help button right next to title */}
                {features && features.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-muted-foreground hover:text-foreground p-2"
                    title={isExpanded ? 'Ocultar información' : 'Click para más información'}
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* Project Selector where the help button was */}
              {showProjectSelector && (
                <div className="flex items-center">
                  <ProjectSelector />
                </div>
              )}
            </div>
          </div>

          {/* Expandable Content - Features Grid */}
          {isExpanded && features && features.length > 0 && (
            <div className="px-4 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1 text-primary">
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider line - only show if there's bottom content */}
          {hasBottomContent && <div className="border-t border-[var(--card-border)]" />}
        </>
      )}

      {/* Bottom Row - ActionBar Content - only render if there's content */}
      {hasBottomContent && (
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
        
        {/* Parameter Selector - ONLY for specific cases like admin task parameters page */}
        {parameterSelector && (
          <div className="flex items-center gap-2">
            <div className="w-64">
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
            
            {/* Parameter Action Buttons */}
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
                  Agrupar por Tarea
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

        {/* Today Button - For gradebook pages */}
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

        {/* 4. PRIMARY BUTTON (rightmost position) */}
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
      )}
    </div>
  )
}