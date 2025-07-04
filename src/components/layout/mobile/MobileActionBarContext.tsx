import React, { createContext, useContext, useState, ReactNode } from 'react'

interface ActionBarAction {
  id: string
  icon: ReactNode
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

interface ActionBarActions {
  slot1?: ActionBarAction  // Dashboard de proyectos (fijo)
  slot2?: ActionBarAction  // Search
  slot3?: ActionBarAction  // Crear (verde, principal)
  slot4?: ActionBarAction  // Filtros
  slot5?: ActionBarAction  // Limpiar filtros
}

interface MobileActionBarContextType {
  actions: ActionBarActions
  setActions: (actions: ActionBarActions) => void
  clearActions: () => void
  showActionBar: boolean
  setShowActionBar: (show: boolean) => void
}

const MobileActionBarContext = createContext<MobileActionBarContextType | undefined>(undefined)

export function MobileActionBarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ActionBarActions>({})
  const [showActionBar, setShowActionBar] = useState(false)

  const clearActions = () => {
    setActions({})
    setShowActionBar(false)
  }

  return (
    <MobileActionBarContext.Provider value={{
      actions,
      setActions,
      clearActions,
      showActionBar,
      setShowActionBar
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