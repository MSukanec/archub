import React from 'react'
import { X, Building, DollarSign, Hammer, Users, Calendar, FileText, Settings, CheckSquare, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null

  const handleNavigation = (href: string) => {
    onClose()
    window.location.href = href
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
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-lg font-semibold">Menú de Navegación</h1>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {navigationItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.href)}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Footer */}
      <div className="border-t p-4">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleNavigation('/admin/dashboard')}
            className="flex flex-col items-center gap-1 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">Administración</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/tasks')}
            className="flex flex-col items-center gap-1 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <CheckSquare className="h-5 w-5" />
            <span className="text-xs">Tareas</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/perfil')}
            className="flex flex-col items-center gap-1 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  )
}