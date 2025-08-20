import React, { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext'
import { useMobile } from '@/hooks/use-mobile'
import { Search, Filter, X } from 'lucide-react'
import { useLocation } from 'wouter'

export function MobileActionBar() {
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
  } = useMobileActionBar()
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
            className="fixed bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50"
            style={{ 
              backgroundColor: 'var(--menues-bg)',
              borderColor: 'var(--menues-border)'
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
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--menues-fg)'
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearchPopover(false)}
                style={{ color: 'var(--menues-fg)' }}
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
            className="fixed bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto"
            style={{ 
              backgroundColor: 'var(--menues-bg)',
              borderColor: 'var(--menues-border)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--menues-fg)' }}>Filtros</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilterPopover(false)}
                style={{ color: 'var(--menues-fg)' }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {filterConfig.filters?.map((filter: any, index: number) => (
                <div key={index}>
                  <Label className="text-xs font-medium text-muted-foreground">
                    {filter.label}
                  </Label>
                  <Select 
                    value={filter.value} 
                    onValueChange={filter.onChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={filter.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{filter.allOptionLabel}</SelectItem>
                      {filter.options?.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              {filterConfig.onClearFilters && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    filterConfig.onClearFilters()
                    setShowFilterPopover(false)
                  }}
                >
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{ 
          backgroundColor: 'var(--menues-bg)',
          borderColor: 'var(--menues-border)'
        }}
      >
        <div className="flex items-center justify-around px-6 py-3">
          {/* Search Button */}
          {actions.search && (
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-16 w-16 hover:opacity-80"
              onClick={handleSearchClick}
              style={{ color: 'var(--menues-fg)' }}
            >
              <Search className="h-5 w-5" />
              <span className="text-xs font-medium">Buscar</span>
            </Button>
          )}

          {/* Create Button (centro, verde) */}
          {actions.create && (
            <Button
              className="h-14 w-14 rounded-full shadow-lg flex flex-col items-center justify-center"
              style={{ 
                backgroundColor: 'var(--accent)',
                color: 'white'
              }}
              onClick={actions.create.onClick}
            >
              {actions.create.icon}
            </Button>
          )}

          {/* Filter Button */}
          {actions.filter && (
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-16 w-16 hover:opacity-80"
              onClick={handleFilterClick}
              style={{ color: 'var(--menues-fg)' }}
            >
              <Filter className="h-5 w-5" />
              <span className="text-xs font-medium">Filtros</span>
            </Button>
          )}
        </div>
      </div>
    </>
  )
}