import React, { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'
import { Search, Filter, X, Home, Bell } from 'lucide-react'
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
    filterConfig,
    showNotificationsPopover,
    setShowNotificationsPopover
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

  const handleNotificationsClick = () => {
    if (actions.notifications?.onClick) {
      actions.notifications.onClick()
    }
    setShowNotificationsPopover(true)
  }

  return (
    <>
      {/* Search Popover */}
      {showSearchPopover && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowSearchPopover(false)}>
          <div 
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 border"
            style={{ 
              backgroundColor: 'var(--menues-bg)',
              borderColor: 'var(--menues-border)',
              width: 'calc(100vw - 32px)', // full width minus padding
              maxWidth: '400px',
              zIndex: 60
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
                className=""
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Popover */}
      {showFilterPopover && filterConfig && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowFilterPopover(false)}>
          <div 
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 border"
            style={{ 
              backgroundColor: 'var(--menues-bg)',
              borderColor: 'var(--menues-border)',
              width: 'calc(100vw - 32px)',
              maxWidth: '400px',
              zIndex: 60
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
                  className=""
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {filterConfig.filters?.map((filter: any, index: number) => (
                <div key={filter.key || index} className="space-y-2">
                  <Label htmlFor={filter.key} style={{ color: 'var(--menues-fg)' }}>
                    {filter.label}
                  </Label>
                  <Select value={filter.value || ''} onValueChange={filter.onChange}>
                    <SelectTrigger 
                      style={{ 
                        backgroundColor: 'var(--menues-input-bg)',
                        borderColor: 'var(--menues-input-border)',
                        color: 'var(--menues-input-fg)'
                      }}
                    >
                      <SelectValue placeholder={filter.placeholder || 'Seleccionar...'} />
                    </SelectTrigger>
                    <SelectContent style={{ zIndex: 70 }}>
                      {filter.allOptionLabel && (
                        <SelectItem value="all">{filter.allOptionLabel}</SelectItem>
                      )}
                      {filter.options?.map((option: any, optIndex: number) => (
                        <SelectItem key={option.value || optIndex} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              {/* Botón Limpiar Filtros */}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--menues-border)' }}>
                <Button
                  variant="default"
                  onClick={() => {
                    // Usar la función de limpiar filtros de la configuración
                    if (filterConfig.onClearFilters) {
                      filterConfig.onClearFilters();
                    }
                    setShowFilterPopover(false);
                  }}
                  className="w-full"
                  style={{
                    backgroundColor: 'var(--menues-input-bg)',
                    borderColor: 'var(--menues-input-border)',
                    color: 'var(--menues-fg)'
                  }}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Popover */}
      {showNotificationsPopover && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowNotificationsPopover(false)}>
          <div 
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 border"
            style={{ 
              backgroundColor: 'var(--menues-bg)',
              borderColor: 'var(--menues-border)',
              width: 'calc(100vw - 32px)',
              maxWidth: '400px',
              zIndex: 60
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--menues-fg)' }}>Notificaciones</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotificationsPopover(false)}
                  className=""
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Empty state */}
              <div className="py-8 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Bell className="h-8 w-8 text-gray-400" />
                  <p style={{ color: 'var(--menues-fg)' }} className="text-sm">
                    Sin notificaciones
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
        style={{ 
          backgroundColor: 'var(--menues-bg)',
          borderTopColor: 'var(--menues-border)',
          borderTopWidth: '1px'
        }}
      >
        {/* 5 slots when create action exists, 4 slots when it doesn't */}
        <div className={`flex items-center justify-between ${actions.create ? 'px-4' : 'px-8'}`}>
          {/* Slot 1: Home */}
          {actions.home && (
            <button
              onClick={actions.home.onClick}
              className="flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Home className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {/* Slot 2: Search */}
          {actions.search && (
            <button
              onClick={handleSearchClick}
              className="flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Search className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {/* Slot 3: Create (Central, only if exists) */}
          {actions.create && (
            <button
              onClick={actions.create.onClick}
              className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white transition-colors"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {actions.create.icon}
            </button>
          )}

          {/* Slot 4: Filter */}
          {actions.filter && (
            <button
              onClick={handleFilterClick}
              className="flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Filter className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {/* Slot 5: Notifications */}
          {actions.notifications && (
            <button
              onClick={handleNotificationsClick}
              className="flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// Legacy export for backward compatibility during transition
export const MobileActionBar = ActionBarMobile