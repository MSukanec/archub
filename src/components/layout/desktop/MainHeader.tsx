import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Building2, FolderOpen } from "lucide-react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { useProject } from "@/hooks/use-projects";
import { useProjectContext } from "@/stores/projectContext";
import { useNavigationStore } from "@/stores/navigationStore";
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Mapeo de rutas a nombres de páginas
const PAGE_NAMES: Record<string, string> = {
  // Organization level
  '/organization/dashboard': 'Dashboard',
  '/organization/personnel': 'Personal',
  '/organization/analysis': 'Análisis de Costos',
  '/organization/expenses': 'Gastos Generales',
  '/organization/activity': 'Actividad',
  '/organization/preferences': 'Preferencias',
  
  // Project level
  '/project/dashboard': 'Dashboard',
  '/project/gantt': 'Gantt',
  '/project/kanban': 'Kanban',
  '/project/budgets': 'Presupuesto',
  '/project/construction-personnel': 'Personal',
  '/project/construction-materials': 'Materiales',
  '/project/indirects': 'Gastos Indirectos',
  '/project/subcontracts': 'Subcontratos',
  '/project/logs': 'Registros',
  
  // Resources
  '/resources/documentation': 'Documentación',
  '/resources/gallery': 'Galería',
  '/resources/contacts': 'Contactos',
  
  // Finances
  '/finances/movements': 'Movimientos',
  '/finances/conversions': 'Conversiones',
  '/finances/transfers': 'Transferencias',
  '/finances/budgets': 'Presupuestos',
  '/finances/clients': 'Clientes',
  '/finances/capital': 'Capital Social',
  '/finances/general-costs': 'Gastos Generales',
  
  // Admin
  '/admin/users': 'Usuarios',
  '/admin/task-params': 'Parámetros de Tareas',
  '/admin/task-list': 'Lista de Tareas',
  '/admin/material-prices': 'Precios de Materiales',
};

interface Tab {
  id: string;
  label: string;
  isActive: boolean;
}

interface MainHeaderProps {
  actionButton?: {
    label: string;
    icon?: React.ComponentType<any>;
    onClick: () => void;
  };
  tabs?: Tab[];
  onTabChange?: (tabId: string) => void;
  title?: string;
}

export function MainHeader({ actionButton, tabs = [], onTabChange, title }: MainHeaderProps = {}) {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId, setCurrentOrganization, setSelectedProject } = useProjectContext();
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { toast } = useToast();
  
  // ORGANIZATION CHANGE MUTATION - Exact copy from ProfileOrganizations.tsx that WORKS
  const switchOrganization = useMutation({
    mutationFn: async (organizationId: string) => {
      console.log('🔄 Switching to organization:', organizationId)
      const { data, error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('user_id', userData?.user?.id)
        .select()
      
      if (error) {
        console.error('❌ Error switching organization:', error)
        throw error
      }
      console.log('✅ Organization switch successful:', data)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
      console.log('✅ Organization switch queries invalidated');
    },
    onError: (error) => {
      console.error('❌ Organization switch error:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la organización.",
        variant: "destructive"
      })
    }
  });

  // PROJECT CHANGE MUTATION - Exact copy from OrganizationDashboard.tsx that WORKS  
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !currentOrganizationId) {
        throw new Error('Required data not available');
      }
      
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert({
          user_id: userData.user.id,
          organization_id: currentOrganizationId,
          last_project_id: projectId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,organization_id'
        })
      
      if (error) throw error
      return projectId;
    },
    onSuccess: (projectId) => {
      // Update project context
      setSelectedProject(projectId, currentOrganizationId);
      setSidebarLevel('project');
      
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userData?.user?.id, currentOrganizationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      console.log('✅ Project selection successful:', projectId);
    },
    onError: (error) => {
      console.error('❌ Project selection error:', error)
      toast({
        title: "Error",
        description: "No se pudo seleccionar el proyecto",
        variant: "destructive"
      })
    }
  });
  
  // Get real data
  const { data: projectsLite = [] } = useProjectsLite(currentOrganizationId || undefined);
  const { data: currentProject } = useProject(selectedProjectId || undefined);
  
  // Get current organization name from the organizations list using currentOrganizationId
  const currentOrganization = userData?.organizations?.find(org => org.id === currentOrganizationId)?.name || 
                              userData?.organization?.name || 
                              "Organización";
  const currentProjectName = currentProject?.name || "Seleccionar Proyecto";
  
  // Obtener el nombre de la página actual - usar title si está disponible, sino mapeo
  const currentPageName = title || PAGE_NAMES[location] || 'Página';

  const handleOrganizationClick = () => {
    setSidebarLevel('organization');
    navigate('/organization/dashboard');
  };

  const handleProjectClick = () => {
    setSidebarLevel('project');
    navigate('/project/dashboard');
  };

  const handleOrganizationChange = (orgId: string) => {
    setCurrentOrganization(orgId);
    setSidebarLevel('organization');
    navigate('/organization/dashboard');
    
    // SAVE TO SUPABASE using the EXACT same method that works in ProfileOrganizations.tsx
    switchOrganization.mutate(orgId);
  };

  const handleProjectChange = (projectId: string) => {
    // SAVE TO SUPABASE using the EXACT same method that works in OrganizationDashboard.tsx
    selectProjectMutation.mutate(projectId);
    // NO navigate - solo cambiar proyecto activo
  };

  return (
    <div 
      className="w-full h-12 border-b flex items-center justify-between pr-4 z-50"
      style={{ 
        backgroundColor: "var(--main-sidebar-bg)",
        borderBottomColor: "var(--main-sidebar-border)"
      }}
    >
      {/* Left side: Logo and navigation */}
      <div className="flex items-center gap-2">
        {/* Logo - Perfectly aligned with sidebar icons at 24px from left edge */}
        <div className="shrink-0 w-12 h-12 flex items-center justify-center">
          <img 
            src="/ArchubLogo.png" 
            alt="Archub" 
            className="h-8 w-auto"
          />
        </div>

        {/* Organization selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleOrganizationClick}
            className={`flex items-center h-8 px-2 text-xs font-medium transition-all duration-200 ease-out overflow-hidden rounded ${
              sidebarLevel === 'organization' 
                ? 'text-white bg-[var(--main-sidebar-button-active-bg)]' 
                : 'text-white hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
          >
            <Building2 className="h-4 w-4 mr-1" />
            {currentOrganization}
          </button>
          
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center h-8 px-1 transition-all duration-200 ease-out overflow-hidden rounded text-white hover:bg-[var(--main-sidebar-button-hover-bg)]"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="start">
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Seleccionar Organización
                </div>
                {userData?.organizations?.map((org) => (
                  <Button
                    key={org.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOrganizationChange(org.id)}
                    className="w-full justify-start h-8 text-xs"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {org.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Separator */}
        <span className="text-sm text-white opacity-50 mx-1">/</span>

        {/* Project selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleProjectClick}
            className={`flex items-center h-8 px-2 text-xs font-medium transition-all duration-200 ease-out overflow-hidden rounded ${
              sidebarLevel === 'project' 
                ? 'text-white bg-[var(--main-sidebar-button-active-bg)]' 
                : 'text-white hover:bg-[var(--main-sidebar-button-hover-bg)]'
            }`}
          >
            <FolderOpen className="h-4 w-4 mr-1" />
            {currentProjectName}
          </button>
          
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center h-8 px-1 transition-all duration-200 ease-out overflow-hidden rounded text-white hover:bg-[var(--main-sidebar-button-hover-bg)]"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="start">
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Seleccionar Proyecto
                </div>
                {projectsLite.map((project) => (
                  <Button
                    key={project.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleProjectChange(project.id)}
                    className="w-full justify-start h-8 text-xs"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    {project.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Separator */}
        <span className="text-sm text-white opacity-50 mx-1">/</span>
        
        {/* Nombre de la página actual */}
        <span className="text-sm font-medium text-white opacity-90">
          {currentPageName}
        </span>
        
        {/* Tabs - si existen */}
        {tabs && tabs.length > 0 && (
          <>
            {/* Separador vertical antes de las tabs */}
            <div className="h-5 w-px bg-white opacity-30 mx-4" />
            
            <div className="flex items-center gap-0 h-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`relative flex items-center h-full px-4 text-sm font-medium transition-all duration-200 ${
                    tab.isActive
                      ? 'text-[var(--accent)]' 
                      : 'text-[var(--main-sidebar-fg)] opacity-60 hover:opacity-100'
                  }`}
                >
                  {tab.label}
                  {/* Barra inferior para tab activa */}
                  {tab.isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right side: Action button */}
      {actionButton && (
        <div className="flex items-center">
          <Button
            onClick={actionButton.onClick}
            size="sm"
            className="h-8 text-xs font-medium"
          >
            {actionButton.icon && <actionButton.icon className="h-4 w-4 mr-1" />}
            {actionButton.label}
          </Button>
        </div>
      )}
    </div>
  );
}