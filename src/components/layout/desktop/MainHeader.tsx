import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Building2, FolderOpen, Slash } from "lucide-react";
import { useLocation, Link } from "wouter";
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
  '/organization/dashboard': 'Visión General',
  '/organization/projects': 'Gestión de Proyectos',
  '/organization/personnel': 'Personal',
  '/organization/activity': 'Actividad',
  '/organization/preferences': 'Preferencias',
  
  // Project level
  '/project/dashboard': 'Visión General',
  '/project/gantt': 'Gantt',
  '/project/kanban': 'Kanban',
  '/budgets': 'Cómputo y Presupuesto',
  '/professional/budgets': 'Cómputo y Presupuesto',
  
  // Construction
  '/construction/dashboard': 'Dashboard de Construcción',
  '/construction/personnel': 'Mano de Obra',
  '/construction/materials': 'Materiales',
  '/construction/indirects': 'Indirectos',
  '/construction/subcontracts': 'Subcontratos',
  '/construction/logs': 'Bitácora',
  
  // General
  '/contacts': 'Contactos',
  '/analysis': 'Análisis de Costos',
  '/movements': 'Movimientos',
  '/clients': 'Clientes',
  '/media': 'Galería',
  '/calendar': 'Calendario',
  
  // Finances
  '/finances/capital': 'Capital',
  '/finances/general-costs': 'Gastos Generales',
  '/finances/dashboard': 'Dashboard Financiero',
  
  // Admin
  '/admin/community': 'Comunidad',
  '/admin/payments': 'Pagos',
  '/admin/costs': 'Costos',
  '/admin/tasks': 'Tareas',
  '/admin/general': 'General',
  '/providers/products': 'Productos',
  
  // Profile
  '/profile': 'Perfil',
  '/profile/organizations': 'Gestión de Organizaciones',
  '/profile/preferences': 'Preferencias de Perfil',
  
  // Learning / Capacitaciones
  '/learning/dashboard': 'Dashboard de Capacitaciones',
  '/learning/courses': 'Mis Cursos',
};

interface MainHeaderProps {
  // Vacío por ahora - sin props
}

export function MainHeader() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId, setCurrentOrganization, setSelectedProject } = useProjectContext();
  const { setSidebarLevel, sidebarLevel, currentSidebarContext } = useNavigationStore();
  const { toast } = useToast();
  
  // Detectar si estamos en el contexto de Learning
  const isLearningContext = currentSidebarContext === 'learning';
  
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
  
  // Obtener el nombre de la página actual
  const currentPageName = PAGE_NAMES[location] || 'Página';

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
        <Link href="/select-mode">
          <div className="shrink-0 w-12 h-12 flex items-center justify-center cursor-pointer">
            <img 
              src="/ArchubLogo.png" 
              alt="Archub" 
              className="h-8 w-auto"
            />
          </div>
        </Link>

        {isLearningContext ? (
          /* Learning breadcrumb - identical style to professional */
          <>
            <button
              onClick={() => navigate('/learning/dashboard')}
              className="flex items-center h-8 px-2 text-xs font-medium transition-all duration-200 ease-out overflow-hidden rounded text-[var(--main-sidebar-button-fg)] bg-[var(--main-sidebar-button-bg)] hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-[var(--main-sidebar-button-hover-fg)]"
            >
              Capacitaciones
            </button>
            
            {/* Separator */}
            <span className="text-xs font-medium text-[var(--main-sidebar-fg)] opacity-30 px-1">/</span>
            
            {/* Nombre de la página actual */}
            <span className="text-xs font-medium text-[var(--main-sidebar-fg)] opacity-80">
              {currentPageName}
            </span>
          </>
        ) : (
          /* Normal organization/project navigation */
          <>
            {/* Organization selector */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleOrganizationClick}
                className={`flex items-center h-8 px-2 text-xs font-medium transition-all duration-200 ease-out overflow-hidden rounded ${
                  sidebarLevel === 'organization' 
                    ? 'text-[var(--main-sidebar-button-active-fg)] bg-[var(--main-sidebar-button-active-bg)]' 
                    : 'text-[var(--main-sidebar-button-fg)] bg-[var(--main-sidebar-button-bg)] hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-[var(--main-sidebar-button-hover-fg)]'
                }`}
              >
                <Building2 className="h-4 w-4 mr-1" />
                {currentOrganization}
              </button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center h-8 px-1 transition-all duration-200 ease-out overflow-hidden rounded text-[var(--main-sidebar-button-fg)] bg-[var(--main-sidebar-button-bg)] hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-[var(--main-sidebar-button-hover-fg)]"
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
            <span className="text-xs font-medium text-[var(--main-sidebar-fg)] opacity-30 px-1">/</span>

            {/* Project selector */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleProjectClick}
                className={`flex items-center h-8 px-2 text-xs font-medium transition-all duration-200 ease-out overflow-hidden rounded ${
                  sidebarLevel === 'project' 
                    ? 'text-[var(--main-sidebar-button-active-fg)] bg-[var(--main-sidebar-button-active-bg)]' 
                    : 'text-[var(--main-sidebar-button-fg)] bg-[var(--main-sidebar-button-bg)] hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-[var(--main-sidebar-button-hover-fg)]'
                }`}
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                {currentProjectName}
              </button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center h-8 px-1 transition-all duration-200 ease-out overflow-hidden rounded text-[var(--main-sidebar-button-fg)] bg-[var(--main-sidebar-button-bg)] hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-[var(--main-sidebar-button-hover-fg)]"
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
            <span className="text-xs font-medium text-[var(--main-sidebar-fg)] opacity-30 px-1">/</span>
            
            {/* Nombre de la página actual */}
            <span className="text-xs font-medium text-[var(--main-sidebar-fg)] opacity-80">
              {currentPageName}
            </span>
          </>
        )}
      </div>
    </div>
  );
}