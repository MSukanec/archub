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
    label: 'Proyectos',
    onClick: () => navigate('/project/dashboard'),
    variant: 'secondary' as const
  }

  return (
    <div 
      style={{ 
        backgroundColor: 'var(--menues-bg)',
        borderColor: 'var(--menues-border)'
      }}
    >
        {/* Slot 1 - Dashboard de Proyectos (fijo) */}
        <Button
          variant="ghost"
          onClick={(actions.slot1 || defaultSlot1).onClick}
          style={{ color: 'var(--menues-fg)' }}
        >
          {(actions.slot1 || defaultSlot1).icon}
            {(actions.slot1 || defaultSlot1).label}
          </span>
        </Button>

        {/* Slot 2 - Search */}
        {actions.slot2 ? (
          <Button
            variant="ghost"
            onClick={actions.slot2.onClick}
            style={{ color: 'var(--menues-fg)' }}
          >
            {actions.slot2.icon}
              {actions.slot2.label}
            </span>
          </Button>
        ) : null}

        {/* Slot 3 - Crear (principal, verde) */}
        {actions.slot3 ? (
          <Button
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
            onClick={actions.slot4.onClick}
            style={{ color: 'var(--menues-fg)' }}
          >
            {actions.slot4.icon}
              {actions.slot4.label}
            </span>
          </Button>
        ) : null}

        {/* Slot 5 - Limpiar filtros */}
        {actions.slot5 ? (
          <Button
            variant="ghost"
            onClick={actions.slot5.onClick}
            style={{ color: 'var(--menues-fg)' }}
          >
            {actions.slot5.icon}
              {actions.slot5.label}
            </span>
          </Button>
        ) : null}
      </div>
    </div>
  )
}