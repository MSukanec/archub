import React, { createContext, useContext, useState, ReactNode } from 'react'

interface ActionBarAction {
  id: string
  icon: ReactNode
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

interface ActionBarActions {
  home?: ActionBarAction       // Inicio (nuevo)
  search?: ActionBarAction     // Search
  create?: ActionBarAction     // Crear (principal)
  filter?: ActionBarAction     // Filtros
  notifications?: ActionBarAction  // Notificaciones (nuevo)
}

interface ActionBarMobileContextType {
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

const ActionBarMobileContext = createContext<ActionBarMobileContextType | undefined>(undefined)

export function ActionBarMobileProvider({ children }: { children: ReactNode }) {
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
    <ActionBarMobileContext.Provider
      value={{
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
      }}
    >
      {children}
    </ActionBarMobileContext.Provider>
  )
}

export function useActionBarMobile() {
  const context = useContext(ActionBarMobileContext)
  if (context === undefined) {
    throw new Error('useActionBarMobile must be used within an ActionBarMobileProvider')
  }
  return context
}

