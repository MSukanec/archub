import React, { createContext, useContext, useState, ReactNode } from 'react'

interface CreateAction {
  label: string
  icon: ReactNode
  onClick: () => void
}

interface OtherAction {
  icon: ReactNode
  onClick: () => void
  tooltip?: string
}

interface MobileActionBarContextType {
  createActions: CreateAction[]
  otherActions: OtherAction[]
  setCreateActions: (actions: CreateAction[]) => void
  setOtherActions: (actions: OtherAction[]) => void
  clearActions: () => void
}

const MobileActionBarContext = createContext<MobileActionBarContextType | undefined>(undefined)

export function MobileActionBarProvider({ children }: { children: ReactNode }) {
  const [createActions, setCreateActions] = useState<CreateAction[]>([])
  const [otherActions, setOtherActions] = useState<OtherAction[]>([])

  const clearActions = () => {
    setCreateActions([])
    setOtherActions([])
  }

  return (
    <MobileActionBarContext.Provider value={{
      createActions,
      otherActions,
      setCreateActions,
      setOtherActions,
      clearActions
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