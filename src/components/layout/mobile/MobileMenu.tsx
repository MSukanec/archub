import React from 'react'
import { X, Home, Building, DollarSign, Hammer, Users, Calendar, FileText, Settings, CheckSquare, User } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { useAuthStore } from '@/store/auth-store'
import { useNavigationStore } from '@/store/navigation-store'
import { useMobileMenuStore } from './useMobileMenuStore'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation()
  const { currentUser } = useAuthStore()
  const { sidebarContext, setSidebarContext } = useNavigationStore()

  if (!isOpen) return null

  const organizationId = currentUser?.preferences?.last_organization_id
  const projectId = currentUser?.preferences?.last_project_id
  const organization = currentUser?.organizations?.find(org => org.id === organizationId)
  const projects = currentUser?.organizations?.find(org => org.id === organizationId)?.projects || []

  // Navigation items based on context
  const getNavigationItems = () => {
    if (sidebarContext === 'project' && projectId) {
      return [
        {
          title: 'Resumen del Proyecto',
          icon: Home,
          href: '/project/dashboard',
          isActive: location === '/project/dashboard'
        },
        {
          title: 'Obra',
          icon: Hammer,
          items: [
            { title: 'Presupuestos', href: '/construction/budgets' },
            { title: 'Materiales', href: '/construction/materials' },
            { title: 'Bitácora', href: '/construction/logs' },
            { title: 'Personal', href: '/construction/personnel' }
          ]
        },
        {
          title: 'Cronograma',
          icon: Calendar,
          href: '/project/timeline',
          isActive: location === '/project/timeline'
        },
        {
          title: 'Finanzas',
          icon: DollarSign,
          items: [
            { title: 'Resumen de Finanzas', href: '/finances/dashboard' },
            { title: 'Movimientos', href: '/finances/movements' }
          ]
        },
        {
          title: 'Gestión de Tareas',
          icon: CheckSquare,
          href: '/tasks',
          isActive: location === '/tasks'
        }
      ]
    } else {
      return [
        {
          title: 'Resumen de la Organización',
          icon: Building,
          href: '/organization/dashboard',
          isActive: location === '/organization/dashboard'
        },
        {
          title: 'Gestión de Proyectos',
          icon: FileText,
          href: '/proyectos',
          isActive: location === '/proyectos'
        },
        {
          title: 'Gestión de Contactos',
          icon: Users,
          href: '/organization/contactos',
          isActive: location === '/organization/contactos'
        },
        {
          title: 'Finanzas',
          icon: DollarSign,
          items: [
            { title: 'Resumen de Finanzas', href: '/finances/dashboard' },
            { title: 'Movimientos', href: '/finances/movements' }
          ]
        }
      ]
    }
  }

  const navigationItems = getNavigationItems()

  const handleNavigation = (href: string) => {
    onClose()
    window.location.href = href
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-lg font-semibold">Menú</h1>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Selectors */}
      <div className="p-4 space-y-3 border-b">
        {/* Organization Selector */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Organización</label>
          <Select value={organizationId || ''}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar organización" />
            </SelectTrigger>
            <SelectContent>
              {currentUser?.organizations?.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>
                  <div className="flex items-center gap-2">
                    <span>{org.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {org.plan?.name || 'FREE'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Proyecto</label>
            <Select value={projectId || ''}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: '100px' }}>
        <nav className="space-y-2">
          {navigationItems.map((item, index) => (
            <div key={index}>
              {item.items ? (
                // Accordion style for items with subitems
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground">
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </div>
                  <div className="ml-7 space-y-1">
                    {item.items.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={() => handleNavigation(subItem.href)}
                        className="flex w-full items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                      >
                        {subItem.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Single navigation item
                <button
                  onClick={() => handleNavigation(item.href!)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="flex justify-around items-center">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1" onClick={onClose}>
              <Settings className="h-4 w-4" />
              <span className="text-xs">Administración</span>
            </Button>
          </Link>
          
          <Link href="/tasks">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1" onClick={onClose}>
              <CheckSquare className="h-4 w-4" />
              <span className="text-xs">Tareas</span>
            </Button>
          </Link>
          
          <Link href="/perfil">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1" onClick={onClose}>
              <User className="h-4 w-4" />
              <span className="text-xs">Perfil</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}