import React from 'react'
import { Button } from '@/components/ui/button'
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext'
import { useMobile } from '@/hooks/use-mobile'
import { Home } from 'lucide-react'
import { useLocation } from 'wouter'

export function MobileActionBar() {
  const { actions, showActionBar } = useMobileActionBar()
  const isMobile = useMobile()
  const [, navigate] = useLocation()
  
  if (!isMobile || !showActionBar) {
    return null
  }

  // Slot 1 siempre es el dashboard de proyectos
  const defaultSlot1 = {
    id: 'project-dashboard',
    icon: <Home className="h-5 w-5" />,
    label: 'Proyectos',
    onClick: () => navigate('/project/documentation'),
    variant: 'secondary' as const
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{ 
        backgroundColor: 'var(--menues-bg)',
        borderColor: 'var(--menues-border)'
      }}
    >
      <div className="flex items-center justify-around px-4 py-3">
        {/* Slot 1 - Dashboard de Proyectos (fijo) */}
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 h-16 w-16 hover:opacity-80"
          onClick={(actions.slot1 || defaultSlot1).onClick}
          style={{ color: 'var(--menues-fg)' }}
        >
          {(actions.slot1 || defaultSlot1).icon}
          <span className="text-xs font-medium">
            {(actions.slot1 || defaultSlot1).label}
          </span>
        </Button>

        {/* Slot 2 - Search */}
        {actions.slot2 ? (
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-16 w-16 hover:opacity-80"
            onClick={actions.slot2.onClick}
            style={{ color: 'var(--menues-fg)' }}
          >
            {actions.slot2.icon}
            <span className="text-xs font-medium">
              {actions.slot2.label}
            </span>
          </Button>
        ) : null}

        {/* Slot 3 - Crear (principal, verde) */}
        {actions.slot3 ? (
          <Button
            className="h-14 w-14 rounded-full shadow-lg flex flex-col items-center justify-center"
            style={{ 
              backgroundColor: 'var(--accent)',
              color: 'white'
            }}
            onClick={actions.slot3.onClick}
          >
            {actions.slot3.icon}
          </Button>
        ) : null}

        {/* Slot 4 - Filtros */}
        {actions.slot4 ? (
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-16 w-16 hover:opacity-80"
            onClick={actions.slot4.onClick}
            style={{ color: 'var(--menues-fg)' }}
          >
            {actions.slot4.icon}
            <span className="text-xs font-medium">
              {actions.slot4.label}
            </span>
          </Button>
        ) : null}

        {/* Slot 5 - Limpiar filtros */}
        {actions.slot5 ? (
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-16 w-16 hover:opacity-80"
            onClick={actions.slot5.onClick}
            style={{ color: 'var(--menues-fg)' }}
          >
            {actions.slot5.icon}
            <span className="text-xs font-medium">
              {actions.slot5.label}
            </span>
          </Button>
        ) : null}
      </div>
    </div>
  )
}