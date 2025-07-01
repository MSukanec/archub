import React, { useState } from 'react'
import { Home, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation } from 'wouter'

interface CreateAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
}

interface OtherAction {
  icon: React.ReactNode
  onClick: () => void
  tooltip?: string
}

interface MobileActionBarProps {
  createActions: CreateAction[]
  otherActions: OtherAction[]
}

export function MobileActionBar({ createActions, otherActions }: MobileActionBarProps) {
  const [, navigate] = useLocation()
  const [showSpeedDial, setShowSpeedDial] = useState(false)

  const handleCentralButton = () => {
    if (createActions.length === 1) {
      // Ejecutar directamente si solo hay una acción
      createActions[0].onClick()
    } else if (createActions.length > 1) {
      // Mostrar speed dial si hay múltiples acciones
      setShowSpeedDial(!showSpeedDial)
    }
  }

  const handleSpeedDialAction = (action: CreateAction) => {
    action.onClick()
    setShowSpeedDial(false)
  }

  const goHome = () => {
    navigate('/project/dashboard')
  }

  return (
    <>
      {/* Speed Dial Overlay */}
      {showSpeedDial && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setShowSpeedDial(false)}
        />
      )}

      {/* Speed Dial Actions */}
      {showSpeedDial && createActions.length > 1 && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 md:hidden">
          <div className="flex flex-col-reverse items-center space-y-reverse space-y-3">
            {createActions.map((action, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 animate-in slide-in-from-bottom-2 duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="bg-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
                  {action.label}
                </span>
                <Button
                  onClick={() => handleSpeedDialAction(action)}
                  className="w-12 h-12 rounded-full shadow-lg"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)'
                  }}
                >
                  {action.icon}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div 
          className="flex items-center justify-between px-4 py-3 border-t"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)'
          }}
        >
          {/* Botón Home (fijo) */}
          <Button
            onClick={goHome}
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full"
          >
            <Home className="h-5 w-5" />
          </Button>

          {/* Botones dinámicos (2 a la izquierda, 2 a la derecha del central) */}
          <div className="flex items-center space-x-4">
            {/* Botones izquierda del central */}
            {otherActions.slice(0, 2).map((action, index) => (
              <Button
                key={`left-${index}`}
                onClick={action.onClick}
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-full"
                title={action.tooltip}
              >
                {action.icon}
              </Button>
            ))}

            {/* Botón central (+) */}
            <div className="relative">
              <Button
                onClick={handleCentralButton}
                className="w-14 h-14 rounded-full shadow-lg transform -translate-y-1 transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)'
                }}
                disabled={createActions.length === 0}
              >
                <Plus 
                  className={`h-6 w-6 transition-transform duration-200 ${
                    showSpeedDial ? 'rotate-45' : 'rotate-0'
                  }`} 
                />
              </Button>
            </div>

            {/* Botones derecha del central */}
            {otherActions.slice(2, 4).map((action, index) => (
              <Button
                key={`right-${index}`}
                onClick={action.onClick}
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-full"
                title={action.tooltip}
              >
                {action.icon}
              </Button>
            ))}
          </div>

          {/* Espacio para balance visual */}
          <div className="w-10" />
        </div>
      </div>
    </>
  )
}