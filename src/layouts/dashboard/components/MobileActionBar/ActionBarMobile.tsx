import React, { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BottomSheet, 
  BottomSheetContent, 
  BottomSheetHeader, 
  BottomSheetBody, 
  BottomSheetFooter,
  BottomSheetTitle 
} from '@/components/ui/bottom-sheet'
import { useActionBarMobile } from './ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'
import { Search, Filter, Home, Bell, Lock } from 'lucide-react'
import { useLocation } from 'wouter'
import { PlanRestricted } from '@/features/users'
export function ActionBarMobile() {
  const [, navigate] = useLocation()
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
      <BottomSheet open={showSearchPopover} onOpenChange={setShowSearchPopover}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Buscar</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetBody>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" style={{ color: 'var(--main-sidebar-fg)'}} />
              <Input
                ref={searchInputRef}
                placeholder="Buscar..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="flex-1"
                style={{ 
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--input-text)'
                }}
              />
            </div>
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheet>
      {filterConfig && (
        <BottomSheet open={showFilterPopover} onOpenChange={setShowFilterPopover}>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle>Filtros</BottomSheetTitle>
            </BottomSheetHeader>
            <BottomSheetBody>
              <div className="space-y-4">
                {filterConfig.filters?.map((filter: any, index: number) => (
                  <div key={filter.key || index} className="space-y-2">
                    <Label htmlFor={filter.key} style={{ color: 'var(--main-sidebar-fg)'}}>
                      {filter.label}
                    </Label>
                    <Select value={filter.value || ''} onValueChange={filter.onChange}>
                      <SelectTrigger 
                        style={{ 
                          backgroundColor: 'var(--input-bg)',
                          borderColor: 'var(--input-border)',
                          color: 'var(--input-text)'
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
              </div>
            </BottomSheetBody>
            <BottomSheetFooter>
              <Button
                variant="default"
                onClick={() => {
                  if (filterConfig.onClearFilters) {
                    filterConfig.onClearFilters();
                  }
                  setShowFilterPopover(false);
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheet>
      )}
      <BottomSheet open={showNotificationsPopover} onOpenChange={setShowNotificationsPopover}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Notificaciones</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetBody>
            <div className="py-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Bell className="h-8 w-8 text-gray-400" />
                <p style={{ color: 'var(--main-sidebar-fg)'}} className="text-sm">
                  Sin notificaciones
                </p>
              </div>
            </div>
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheet>
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
        style={{ 
          backgroundColor: 'var(--card-bg)',
          borderTopColor: 'var(--card-border)',
          borderTopWidth: '1px'
        }}
      >
        <div className={`flex items-center justify-between ${actions.create ? 'px-4': 'px-8'}`}>
          <button
            onClick={() => navigate('/organization/dashboard')}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors group"
          >
            <Home 
              className="h-6 w-6 transition-colors group-hover:text-[var(--accent)]" 
              style={{ 
                color: 'var(--text-secondary)'
              }} 
            />
          </button>
          {actions.search && (
            <button
              onClick={handleSearchClick}
              className="flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors group"
            >
              <Search 
                className="h-6 w-6 transition-colors group-hover:text-[var(--accent)]" 
                style={{ 
                  color: showSearchPopover ? 'var(--accent)': 'var(--text-secondary)'
                }} 
              />
            </button>
          )}
          {actions.create && (
            actions.create.planRestriction ? (
              <PlanRestricted 
                feature={actions.create.planRestriction.feature} 
                current={actions.create.planRestriction.current}
                functionName={actions.create.label}
                useUpgradeModal={true}
                modalImage={actions.create.planRestriction.modalImage}
                modalTitle={actions.create.planRestriction.modalTitle}
                modalDescription={actions.create.planRestriction.modalDescription}
              >
                <button
                  onClick={actions.create.onClick}
                  className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white transition-colors"
                  style={{ backgroundColor: 'var(--accent)'}}
                  data-testid="button-create-mobile"
                >
                  {React.createElement(actions.create.icon, { className: "h-6 w-6" })}
                </button>
              </PlanRestricted>
            ) : (
              <button
                onClick={actions.create.onClick}
                className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white transition-colors"
                style={{ backgroundColor: 'var(--accent)'}}
                data-testid="button-create-mobile"
              >
                {React.createElement(actions.create.icon, { className: "h-6 w-6" })}
              </button>
            )
          )}
          {actions.filter && (
            <button
              onClick={handleFilterClick}
              className="flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors group"
            >
              <Filter 
                className="h-6 w-6 transition-colors group-hover:text-[var(--accent)]" 
                style={{ 
                  color: showFilterPopover ? 'var(--accent)': 'var(--text-secondary)'
                }} 
              />
            </button>
          )}
          {actions.notifications && (
            <button
              onClick={handleNotificationsClick}
              className="flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors group"
            >
              <Bell 
                className="h-6 w-6 transition-colors group-hover:text-[var(--accent)]" 
                style={{ 
                  color: showNotificationsPopover ? 'var(--accent)': 'var(--text-secondary)'
                }} 
              />
            </button>
          )}
        </div>
      </div>
    </>
  )
}
export const MobileActionBar = ActionBarMobile
