import React, { createContext, useContext, useState, ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
interface ActionBarAction {
  id: string
  icon: LucideIcon
  label: string
  onClick: () => void
  variant?: 'primary'| 'secondary'
  planRestriction?: {
    feature: string
    current: number
    modalImage?: string
    modalTitle?: string
    modalDescription?: string
  }
}
interface ActionBarActions {
  home?: ActionBarAction
  search?: ActionBarAction
  create?: ActionBarAction
  filter?: ActionBarAction
  notifications?: ActionBarAction
}
interface ActionBarMobileContextType {
  actions: ActionBarActions
  setActions: (actions: ActionBarActions) => void
  clearActions: () => void
  showActionBar: boolean
  setShowActionBar: (show: boolean) => void
  showSearchPopover: boolean
  setShowSearchPopover: (show: boolean) => void
  searchValue: string
  setSearchValue: (value: string) => void
  showFilterPopover: boolean
  setShowFilterPopover: (show: boolean) => void
  filterConfig?: any
  setFilterConfig: (config: any) => void
  showNotificationsPopover: boolean
  setShowNotificationsPopover: (show: boolean) => void
}
const ActionBarMobileContext = createContext<ActionBarMobileContextType | undefined>(undefined)
export function ActionBarMobileProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ActionBarActions>({})
  const [showActionBar, setShowActionBar] = useState(false)
  
  const [showSearchPopover, setShowSearchPopover] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  
  const [showFilterPopover, setShowFilterPopover] = useState(false)
  const [filterConfig, setFilterConfig] = useState<any>(null)
  
  const [showNotificationsPopover, setShowNotificationsPopover] = useState(false)
  const clearActions = () => {
    setActions({})
    setShowActionBar(false)
    setShowSearchPopover(false)
    setShowFilterPopover(false)
    setShowNotificationsPopover(false)
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
        setFilterConfig,
        showNotificationsPopover,
        setShowNotificationsPopover
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
