import React, { useState } from 'react'
import { X, Building, DollarSign, Hammer, Users, Calendar, FileText, Settings, CheckSquare, User, Home, FolderOpen, Mail, Activity, Tag, Calculator, FileCode, Package, Shield, Star, Zap, Crown, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation } from 'wouter'
import { useNavigationStore } from '@/stores/navigationStore'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useIsAdmin } from '@/hooks/use-admin-permissions'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [, navigate] = useLocation()
  const { currentSidebarContext, setSidebarContext } = useNavigationStore()
  const { data: userData } = useCurrentUser()
  const isAdmin = useIsAdmin()
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null)
  
  if (!isOpen) return null

  const handleNavigation = (href: string, context?: string) => {
    if (context) {
      setSidebarContext(context as any)
    }
    onClose()
    navigate(href)
  }

  const toggleAccordion = (accordionId: string) => {
    setExpandedAccordion(prev => prev === accordionId ? null : accordionId)
  }

  // Define the same sidebar contexts as in Sidebar.tsx
  const sidebarContexts = {
    organization: [
      { icon: Home, label: 'Resumen de la Organización', href: '/organization/dashboard' },
      { icon: FileText, label: 'Gestión de Proyectos', href: '/proyectos' },
      { icon: Users, label: 'Gestión de Contactos', href: '/organization/contactos' },
      { icon: CheckSquare, label: 'Gestión de Tareas', href: '/tasks' }
    ],
    project: [
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard' },
      { icon: Calendar, label: 'Cronograma', href: '/project/timeline' },
      { icon: Activity, label: 'Actividad', href: '/project/activity' },
      { icon: Users, label: 'Personal', href: '/construction/personnel' },
      { 
        icon: DollarSign, 
        label: 'Finanzas', 
        isAccordion: true, 
        expanded: expandedAccordion === 'finanzas',
        onToggle: () => toggleAccordion('finanzas'),
        children: [
          { icon: Home, label: 'Resumen de Finanzas', href: '/finanzas' },
          { icon: DollarSign, label: 'Movimientos', href: '/movimientos' },
          { icon: Settings, label: 'Preferencias de Finanzas', href: '/preferencias' }
        ]
      },
      {
        icon: Hammer,
        label: 'Obra',
        isAccordion: true,
        expanded: expandedAccordion === 'obra',
        onToggle: () => toggleAccordion('obra'),
        children: [
          { icon: Home, label: 'Resumen de Obra', href: '/construction/dashboard' },
          { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
          { icon: Package, label: 'Materiales', href: '/construction/materials' },
          { icon: FileText, label: 'Bitácora', href: '/bitacora' },
          { icon: Users, label: 'Personal', href: '/construction/personnel' }
        ]
      },
      { icon: Users, label: 'Diseño', href: '#', onClick: () => { setSidebarContext('design'); navigate('/design/dashboard'); } },
      { icon: Hammer, label: 'Construcción', href: '#', onClick: () => { setSidebarContext('construction'); navigate('/construction/dashboard'); } },
      { icon: Users, label: 'Comercialización', href: '#', onClick: () => { setSidebarContext('commercialization'); navigate('/commercialization/dashboard'); } },
      { icon: ArrowLeft, label: 'Volver a Organización', href: '#', onClick: () => { setSidebarContext('organization'); navigate('/organization/dashboard'); } },
    ],
    design: [
      { icon: Home, label: 'Dashboard', href: '/design/dashboard' },
      { icon: Calendar, label: 'Cronograma de Diseño', href: '/design/timeline' },
      { icon: FileText, label: 'Moodboard', href: '/design/moodboard' },
      { icon: FolderOpen, label: 'Documentación técnica', href: '/design/documentacion' },
      { icon: ArrowLeft, label: 'Volver al Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
    ],
    construction: [
      { icon: Home, label: 'Resumen', href: '/construction/dashboard' },
      { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets' },
      { icon: FileText, label: 'Bitácora', href: '/bitacora' },
      { icon: ArrowLeft, label: 'Volver al Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
    ],
    commercialization: [
      { icon: Home, label: 'Dashboard', href: '/commercialization/dashboard' },
      { icon: Building, label: 'Listado de unidades', href: '/commercialization/unidades' },
      { icon: Users, label: 'Clientes interesados', href: '/commercialization/clientes' },
      { icon: FileText, label: 'Estadísticas de venta', href: '/commercialization/estadisticas' },
      { icon: ArrowLeft, label: 'Volver al Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
    ],
    admin: [
      { icon: Home, label: 'Resumen de Administración', href: '/admin/dashboard' },
      { 
        icon: Users, 
        label: 'Comunidad', 
        isAccordion: true, 
        expanded: expandedAccordion === 'admin-comunidad',
        onToggle: () => toggleAccordion('admin-comunidad'),
        children: [
          { icon: Building, label: 'Organizaciones', href: '/admin/organizations' },
          { icon: Users, label: 'Usuarios', href: '/admin/users' }
        ]
      },
      { 
        icon: CheckSquare, 
        label: 'Tareas', 
        isAccordion: true, 
        expanded: expandedAccordion === 'admin-tareas',
        onToggle: () => toggleAccordion('admin-tareas'),
        children: [
          { icon: CheckSquare, label: 'Tareas', href: '/admin/tasks' },
          { icon: Zap, label: 'Tareas Generadas', href: '/admin/generated-tasks' },
          { icon: Settings, label: 'Parámetros', href: '/admin/task-parameters' },
          { icon: FileCode, label: 'Categorías de Tareas', href: '/admin/task-categories-templates' }
        ]
      },
      { 
        icon: Package, 
        label: 'Materiales', 
        isAccordion: true, 
        expanded: expandedAccordion === 'admin-materiales',
        onToggle: () => toggleAccordion('admin-materiales'),
        children: [
          { icon: Package, label: 'Materiales', href: '/admin/materials' },
          { icon: Tag, label: 'Categorías de Materiales', href: '/admin/material-categories' }
        ]
      }
    ]
  }

  const navigationItems = sidebarContexts[currentSidebarContext as keyof typeof sidebarContexts] || sidebarContexts.organization

  return (
    <div className="fixed inset-0 z-50 w-full h-full" style={{ backgroundColor: 'var(--menues-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--menues-border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--menues-fg)' }}>
          {currentSidebarContext === 'organization' && 'Organización'}
          {currentSidebarContext === 'project' && 'Proyecto'}
          {currentSidebarContext === 'design' && 'Diseño'}
          {currentSidebarContext === 'construction' && 'Construcción'}
          {currentSidebarContext === 'commercialization' && 'Comercialización'}
          {currentSidebarContext === 'admin' && 'Administración'}
        </h1>
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
          {navigationItems.map((item: any, index: number) => (
            <div key={`${item.label}-${index}`}>
              {/* Main Button */}
              <button
                onClick={item.isAccordion ? item.onToggle : (item.onClick || (() => handleNavigation(item.href)))}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors hover:opacity-80"
                style={{
                  color: 'var(--menues-fg)',
                  backgroundColor: 'transparent'
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.isAccordion && (
                  <div className="ml-auto">
                    {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                )}
              </button>
              
              {/* Accordion Children */}
              {item.isAccordion && item.expanded && (
                <div className="ml-8 mt-2 space-y-1">
                  {item.children?.map((child: any, childIndex: number) => (
                    <button
                      key={`${child.label}-${childIndex}`}
                      onClick={() => handleNavigation(child.href)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors hover:opacity-80"
                      style={{
                        color: 'var(--menues-fg)',
                        backgroundColor: 'transparent',
                        opacity: 0.8
                      }}
                    >
                      <child.icon className="h-4 w-4" />
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Context Switcher - Bottom */}
      <div className="border-t p-4" style={{ borderColor: 'var(--menues-border)' }}>
        <div className="space-y-2 mb-4">
          <div className="text-xs font-medium opacity-70" style={{ color: 'var(--menues-fg)' }}>
            Cambiar contexto:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleNavigation('/organization/dashboard', 'organization')}
              className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:opacity-80 text-xs"
              style={{ color: 'var(--menues-fg)', opacity: currentSidebarContext === 'organization' ? 1 : 0.6 }}
            >
              <Building className="h-4 w-4" />
              Organización
            </button>
            
            <button
              onClick={() => handleNavigation('/project/dashboard', 'project')}
              className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:opacity-80 text-xs"
              style={{ color: 'var(--menues-fg)', opacity: currentSidebarContext === 'project' ? 1 : 0.6 }}
            >
              <FileText className="h-4 w-4" />
              Proyecto
            </button>
            
            {isAdmin && (
              <button
                onClick={() => handleNavigation('/admin/dashboard', 'admin')}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:opacity-80 text-xs"
                style={{ color: 'var(--menues-fg)', opacity: currentSidebarContext === 'admin' ? 1 : 0.6 }}
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
            )}
          </div>
        </div>
        
        {/* Bottom Footer Actions */}
        <div className="border-t pt-4" style={{ borderColor: 'var(--menues-border)' }}>
          <div className="grid grid-cols-2 gap-2">
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
    </div>
  )
}