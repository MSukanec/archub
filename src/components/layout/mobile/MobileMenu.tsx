import React, { useState } from 'react'
import { X, Building, DollarSign, Hammer, Users, Calendar, FileText, Settings, CheckSquare, User, Home, FolderOpen, Mail, Activity, Tag, Calculator, Package, Shield, Star, Zap, Crown, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  
  if (!isOpen) return null

  const handleNavigation = (href: string, context?: string) => {
    if (context) {
      setSidebarContext(context as any)
    }
    onClose()
    navigate(href)
  }

  // Get current organization and project for selectors
  const currentOrganization = userData?.organization
  const currentProject = userData?.preferences?.last_project_id
  
  // Handle organization change
  const handleOrganizationChange = async (organizationId: string) => {
    // This would need implementation to change organization
    console.log('Changing organization to:', organizationId)
  }
  
  // Handle project change  
  const handleProjectChange = async (projectId: string) => {
    // This would need implementation to change project
    console.log('Changing project to:', projectId)
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 text-white">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-lg font-semibold">
          {currentSidebarContext === 'organization' && 'Organización'}
          {currentSidebarContext === 'project' && 'Proyecto'}
          {currentSidebarContext === 'design' && 'Diseño'}
          {currentSidebarContext === 'construction' && 'Construcción'}
          {currentSidebarContext === 'commercialization' && 'Comercialización'}
          {currentSidebarContext === 'admin' && 'Administración'}
        </h1>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-gray-800">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Organization and Project Selectors */}
      <div className="p-4 space-y-3 border-b border-gray-700">
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">Organización</label>
          <Select value={currentOrganization?.id || ""} onValueChange={handleOrganizationChange}>
            <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Seleccionar organización">
                {currentOrganization?.name || "Seleccionar organización"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {userData?.organizations?.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">Proyecto</label>
          <Select value={currentProject || ""} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Seleccionar proyecto">
                {currentProject ? "Proyecto Actual" : "Seleccionar proyecto"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="project1">Proyecto Ejemplo 1</SelectItem>
              <SelectItem value="project2">Proyecto Ejemplo 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Account Section */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Account</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleNavigation('/organization/dashboard', 'organization')}
              className="flex items-center justify-between w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Resumen de la Organización</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => handleNavigation('/proyectos')}
              className="flex items-center justify-between w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Gestión de Proyectos</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => handleNavigation('/organization/contactos')}
              className="flex items-center justify-between w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Gestión de Contactos</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => handleNavigation('/tasks')}
              className="flex items-center justify-between w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Gestión de Tareas</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Project Section */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Project</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleNavigation('/project/dashboard', 'project')}
              className="flex items-center justify-between w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Resumen del Proyecto</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => handleNavigation('/project/timeline', 'project')}
              className="flex items-center justify-between w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Cronograma</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => handleNavigation('/finanzas/movimientos')}
              className="flex items-center justify-between w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Movimientos</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => handleNavigation('/construction/budgets')}
              className="flex items-center justify-between w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Presupuestos</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => handleNavigation('/construction/logs')}
              className="flex items-center justify-between w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Bitácora</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tools Section */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Tools</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleNavigation('/design/timeline', 'design')}
              className="flex items-center justify-between w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Cronograma de Diseño</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => handleNavigation('/construction/materials')}
              className="flex items-center justify-between w-full p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Materiales</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer with Admin, Profile, Tasks */}
      <div className="p-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-2">
          {isAdmin && (
            <button
              onClick={() => handleNavigation('/admin/dashboard', 'admin')}
              className="flex flex-col items-center gap-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Shield className="h-5 w-5 text-white" />
              <span className="text-xs text-white font-medium">Admin</span>
            </button>
          )}
          
          <button
            onClick={() => handleNavigation('/perfil')}
            className="flex flex-col items-center gap-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <User className="h-5 w-5 text-white" />
            <span className="text-xs text-white font-medium">Profile</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/tasks')}
            className="flex flex-col items-center gap-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <CheckSquare className="h-5 w-5 text-white" />
            <span className="text-xs text-white font-medium">Tasks</span>
          </button>
        </div>
      </div>
    </div>
  )
}