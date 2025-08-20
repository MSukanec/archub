import React, { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'
import { Search, Filter, X } from 'lucide-react'
import { useLocation } from 'wouter'

export function ActionBarMobile() {
  const { 
    actions, 
    showActionBar,
    showSearchPopover,
    setShowSearchPopover,
    searchValue,
    setSearchValue,
    showFilterPopover,
    setShowFilterPopover,
    filterConfig
  } = useActionBarMobile()
  const isMobile = useMobile()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Focus search input when popover opens - always run this hook
  useEffect(() => {
    if (showSearchPopover && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [showSearchPopover])
  
  if (!isMobile || !showActionBar) {
    return null
  }

  const handleSearchClick = () => {
    if (actions.search?.onClick) {
      actions.search.onClick()
    }
    setShowSearchPopover(true)
  }

  const handleFilterClick = () => {
    if (actions.filter?.onClick) {
      actions.filter.onClick()
    }
    setShowFilterPopover(true)
  }

  return (
    <>
      {/* Search Popover */}
      {showSearchPopover && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setShowSearchPopover(false)}>
          <div 
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 z-50"
            style={{ 
              backgroundColor: 'var(--menues-bg)',
              borderColor: 'var(--menues-border)',
              width: 'calc(100vw - 32px)', // full width minus padding
              maxWidth: '400px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" style={{ color: 'var(--menues-fg)' }} />
              <Input
                ref={searchInputRef}
                placeholder="Buscar..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="flex-1"
                style={{ 
                  backgroundColor: 'var(--menues-input-bg)',
                  borderColor: 'var(--menues-input-border)',
                  color: 'var(--menues-input-fg)'
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearchPopover(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Popover */}
      {showFilterPopover && filterConfig && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setShowFilterPopover(false)}>
          <div 
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 z-50"
            style={{ 
              backgroundColor: 'var(--menues-bg)',
              borderColor: 'var(--menues-border)',
              width: 'calc(100vw - 32px)',
              maxWidth: '400px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--menues-fg)' }}>Filtros</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilterPopover(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {filterConfig.filters?.map((filter: any) => (
                <div key={filter.key} className="space-y-2">
                  <Label htmlFor={filter.key} style={{ color: 'var(--menues-fg)' }}>
                    {filter.label}
                  </Label>
                  <Select value={filter.value} onValueChange={filter.onValueChange}>
                    <SelectTrigger 
                      style={{ 
                        backgroundColor: 'var(--menues-input-bg)',
                        borderColor: 'var(--menues-input-border)',
                        color: 'var(--menues-input-fg)'
                      }}
                    >
                      <SelectValue placeholder={filter.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options?.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 flex items-center justify-center gap-6"
        style={{ 
          backgroundColor: 'var(--menues-bg)',
          borderTopColor: 'var(--menues-border)',
          borderTopWidth: '1px'
        }}
      >
        {/* Secondary Actions (Icons only, larger, no borders) */}
        <div className="flex items-center gap-8">
          {/* Search */}
          {actions.search && (
            <button
              onClick={handleSearchClick}
              className="flex items-center justify-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Search className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {/* Filter */}
          {actions.filter && (
            <button
              onClick={handleFilterClick}
              className="flex items-center justify-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Filter className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Primary Action (Central, prominent) */}
        {actions.create && (
          <Button
            onClick={actions.create.onClick}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg"
            size="lg"
          >
            {actions.create.icon}
          </Button>
        )}

        {/* Additional secondary actions can go here */}
        <div className="flex items-center gap-8">
          {/* Placeholder for additional icons */}
          <div className="w-12 h-12" /> {/* Spacer for symmetry */}
          <div className="w-12 h-12" /> {/* Spacer for symmetry */}
        </div>
      </div>
    </>
  )
}

// Legacy export for backward compatibility during transition
export const MobileActionBar = ActionBarMobile