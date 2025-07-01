import React from 'react'
import { X, Building, DollarSign, Hammer, Users, Calendar, FileText, Settings, CheckSquare, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation } from 'wouter'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [, navigate] = useLocation()
  
  if (!isOpen) return null

  const handleNavigation = (href: string) => {
    onClose()
    navigate(href)
  }

  const navigationItems = [
    { title: 'Resumen de la Organización', icon: Building, href: '/organization/dashboard' },
    { title: 'Gestión de Proyectos', icon: FileText, href: '/proyectos' },
    { title: 'Gestión de Contactos', icon: Users, href: '/organization/contactos' },
    { title: 'Cronograma', icon: Calendar, href: '/project/timeline' },
    { title: 'Resumen de Finanzas', icon: DollarSign, href: '/finances/dashboard' },
    { title: 'Movimientos', icon: DollarSign, href: '/finances/movements' },
    { title: 'Presupuestos', icon: Hammer, href: '/construction/budgets' },
    { title: 'Bitácora', icon: Hammer, href: '/construction/logs' },
    { title: 'Gestión de Tareas', icon: CheckSquare, href: '/tasks' }
  ]

  return (
    <div className="fixed inset-0 z-50 w-full h-full" style={{ backgroundColor: 'var(--menues-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--menues-border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--menues-fg)' }}>Menú de Navegación</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-transparent"
          style={{ color: 'var(--menues-fg)' }}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-4 h-full">
        <nav className="space-y-2">
          {navigationItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.href)}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors hover:opacity-80"
              style={{
                color: 'var(--menues-fg)',
                backgroundColor: 'transparent'
              }}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Footer */}
      <div className="border-t p-4" style={{ borderColor: 'var(--menues-border)' }}>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleNavigation('/admin/dashboard')}
            className="flex flex-col items-center gap-1 p-3 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--menues-fg)' }}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">Administración</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/tasks')}
            className="flex flex-col items-center gap-1 p-3 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--menues-fg)' }}
          >
            <CheckSquare className="h-5 w-5" />
            <span className="text-xs">Tareas</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/perfil')}
            className="flex flex-col items-center gap-1 p-3 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--menues-fg)' }}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  )
}