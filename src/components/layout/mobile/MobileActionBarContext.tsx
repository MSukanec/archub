import React, { createContext, useContext, useState, ReactNode } from 'react'

interface ActionBarAction {
  id: string
  icon: ReactNode
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

interface ActionBarActions {
  search?: ActionBarAction     // Search
  create?: ActionBarAction     // Crear (verde, principal)
  filter?: ActionBarAction     // Filtros
}

interface MobileActionBarContextType {
  actions: ActionBarActions
  setActions: (actions: ActionBarActions) => void
  clearActions: () => void
  showActionBar: boolean
  setShowActionBar: (show: boolean) => void
  // Search popover state
  showSearchPopover: boolean
  setShowSearchPopover: (show: boolean) => void
  searchValue: string
  setSearchValue: (value: string) => void
  // Filter popover state
  showFilterPopover: boolean
  setShowFilterPopover: (show: boolean) => void
  filterConfig?: any
  setFilterConfig: (config: any) => void
}

const MobileActionBarContext = createContext<MobileActionBarContextType | undefined>(undefined)

export function MobileActionBarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ActionBarActions>({})
  const [showActionBar, setShowActionBar] = useState(false)
  
  // Search state
  const [showSearchPopover, setShowSearchPopover] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  
  // Filter state
  const [showFilterPopover, setShowFilterPopover] = useState(false)
  const [filterConfig, setFilterConfig] = useState<any>(null)

  const clearActions = () => {
    setActions({})
    setShowActionBar(false)
    setShowSearchPopover(false)
    setShowFilterPopover(false)
    setSearchValue('')
  }

  return (
    <MobileActionBarContext.Provider value={{
      actions,
      setActions,
      clearActions,
      showActionBar,
      setShowActionBar,
      showSearchPopover,
      setShowSearchPopover,
      searchValue,
      setSearchValue,
      showFilterPopover,
      setShowFilterPopover,
      filterConfig,
      setFilterConfig
    }}>
      {children}
    </MobileActionBarContext.Provider>
  )
}

export function useMobileActionBar() {
  const context = useContext(MobileActionBarContext)
  if (context === undefined) {
    throw new Error('useMobileActionBar must be used within a MobileActionBarProvider')
  }
  return context
}