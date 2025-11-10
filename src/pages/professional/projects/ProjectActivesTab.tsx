import { useState, useEffect, useMemo, useCallback } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences'
import { Folder, Plus, Bell, Search, Filter } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import ProjectItemCard from '@/components/cards/ProjectItemCard'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { PlanRestricted } from '@/components/ui-custom/security/PlanRestricted'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'

export default function ProjectActives() {
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setSelectedProject } = useProjectContext()
  const { setSidebarLevel } = useNavigationStore()
  const [, navigate] = useLocation()

  // Filter states
  const [filterByProjectType, setFilterByProjectType] = useState('all')
  const [filterByModality, setFilterByModality] = useState('all')
  const [filterByStatus, setFilterByStatus] = useState('all')
  const [searchValue, setSearchValue] = useState('')

  // Mobile Action Bar
  const {
    setActions,
    setShowActionBar,
    clearActions,
    setFilterConfig,
    searchValue: mobileSearchValue,
    setSearchValue: setMobileSearchValue
  } = useActionBarMobile()
  const isMobile = useMobile()

  // Sync search values between mobile and desktop
  useEffect(() => {
    if (isMobile && mobileSearchValue !== searchValue) {
      setSearchValue(mobileSearchValue)
    }
  }, [mobileSearchValue, isMobile])

  // Get active project
  const { data: userOrgPrefs } = useUserOrganizationPreferences(organizationId);
  const activeProjectId = userOrgPrefs?.last_project_id

  // Extract unique values for filters
  const availableProjectTypes = useMemo(() => Array.from(
    new Set(projects.map(p => p.project_data?.project_type?.name).filter(Boolean))
  ), [projects]);

  const availableModalities = useMemo(() => Array.from(
    new Set(projects.map(p => p.project_data?.modality?.name).filter(Boolean))
  ), [projects]);

  const availableStatuses = useMemo(() => {
    const statusNames: Record<string, string> = {
      'active': 'En proceso',
      'completed': 'Completado',
      'paused': 'Pausado',
      'cancelled': 'Cancelado',
      'planning': 'Planificación'
    };
    return Array.from(
      new Set(projects.map(p => p.status).filter(Boolean))
    ).map(status => ({
      value: status,
      label: statusNames[status as keyof typeof statusNames] || status
    }));
  }, [projects]);

  const projectsWithActive = projects.map(project => ({
    ...project,
    is_active: project.id === activeProjectId
  }))

  // Apply filters
  const filteredProjects = projectsWithActive.filter(project => {
    const searchLower = searchValue.toLowerCase();
    const nameMatch = project.name?.toLowerCase().includes(searchLower);
    const searchMatch = !searchValue || nameMatch;
    
    const matchesProjectType = filterByProjectType === 'all' || 
      project.project_data?.project_type_id === filterByProjectType ||
      project.project_data?.project_type?.name?.toLowerCase().includes(filterByProjectType.toLowerCase());
    
    const matchesModality = filterByModality === 'all' || 
      project.project_data?.modality_id === filterByModality ||
      project.project_data?.modality?.name?.toLowerCase().includes(filterByModality.toLowerCase());
    
    const matchesStatus = filterByStatus === 'all' || 
      project.status?.toLowerCase() === filterByStatus.toLowerCase();

    return searchMatch && matchesProjectType && matchesModality && matchesStatus;
  })

  // Put active project first
  const sortedProjects = activeProjectId ? [
    ...filteredProjects.filter(project => project.id === activeProjectId),
    ...filteredProjects.filter(project => project.id !== activeProjectId)
  ] : filteredProjects

  // Select project mutation - AHORA SIN NAVEGACIÓN
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !organizationId) {
        throw new Error('Required data not available');
      }
      
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert({
          user_id: userData.user.id,
          organization_id: organizationId,
          last_project_id: projectId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,organization_id'
        })
      
      if (error) throw error
      return projectId;
    },
    onSuccess: (projectId) => {
      setSelectedProject(projectId, organizationId);
      setSidebarLevel('project');
      
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userData?.user?.id, organizationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['projects', organizationId] });
      
      // NO navegamos, solo mostramos toast
      toast({
        title: "Proyecto activado",
        description: "El proyecto ahora está activo"
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo activar el proyecto",
        variant: "destructive"
      })
    }
  })

  const handleSelectProject = (projectId: string) => {
    // Si ya está activo, no hacer nada
    if (projectId === activeProjectId) return;
    selectProjectMutation.mutate(projectId)
  }

  // Nueva función: Activar Y navegar al proyecto
  const handleNavigateToProject = async (projectId: string) => {
    if (!supabase || !userData?.user?.id || !organizationId) {
      toast({
        title: "Error",
        description: "Datos de usuario no disponibles",
        variant: "destructive"
      });
      return;
    }

    try {
      // Activar el proyecto si no está activo
      if (projectId !== activeProjectId) {
        const { error } = await supabase
          .from('user_organization_preferences')
          .upsert({
            user_id: userData.user.id,
            organization_id: organizationId,
            last_project_id: projectId,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,organization_id'
          });
        
        if (error) throw error;
      }

      // Actualizar contextos
      setSelectedProject(projectId, organizationId);
      setSidebarLevel('project');
      
      // Invalidar queries
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userData?.user?.id, organizationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['projects', organizationId] });
      
      // Navegar al dashboard del proyecto
      navigate('/project/dashboard');
      
      toast({
        title: "Proyecto abierto",
        description: "Accediendo al proyecto..."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo acceder al proyecto",
        variant: "destructive"
      });
    }
  }

  const handleEdit = (project: any) => {
    openModal('project', { editingProject: project, isEditing: true })
  }

  // Stabilize action handlers with useCallback
  const handleSearchClick = useCallback(() => {
    // Popover is handled in MobileActionBar
  }, []);

  const handleCreateClick = useCallback(() => {
    openModal('project', {});
  }, [openModal]);

  const handleFilterClick = useCallback(() => {
    // Popover is handled in MobileActionBar
  }, []);

  const handleNotificationsClick = useCallback(() => {
    // Popover is handled in MobileActionBar
  }, []);

  // Configure Mobile Action Bar
  useEffect(() => {
    if (isMobile) {
      setActions({
        search: {
          id: 'search',
          icon: Search,
          label: 'Buscar',
          onClick: handleSearchClick,
        },
        create: {
          id: 'create',
          icon: Plus,
          label: 'Nuevo Proyecto',
          onClick: handleCreateClick,
          variant: 'primary'
        },
        filter: {
          id: 'filter',
          icon: Filter,
          label: 'Filtros',
          onClick: handleFilterClick,
        },
        notifications: {
          id: 'notifications',
          icon: Bell,
          label: 'Notificaciones',
          onClick: handleNotificationsClick,
        },
      });
      setShowActionBar(true);
    }

    // Cleanup when component unmounts
    return () => {
      if (isMobile) {
        clearActions();
        setShowActionBar(false);
        setMobileSearchValue('');
        setSearchValue('');
      }
    };
  }, [isMobile, setActions, setShowActionBar, clearActions, setMobileSearchValue, handleSearchClick, handleCreateClick, handleFilterClick, handleNotificationsClick]);

  // Configure filters for Mobile Action Bar
  useEffect(() => {
    if (isMobile && availableProjectTypes.length > 0) {
      setFilterConfig({
        filters: [
          {
            label: 'Filtrar por tipo',
            value: filterByProjectType,
            onChange: setFilterByProjectType,
            placeholder: 'Todos los tipos',
            allOptionLabel: 'Todos los tipos',
            options: availableProjectTypes.map(type => ({ value: type!, label: type! }))
          },
          {
            label: 'Filtrar por modalidad',
            value: filterByModality,
            onChange: setFilterByModality,
            placeholder: 'Todas las modalidades',
            allOptionLabel: 'Todas las modalidades',
            options: availableModalities.map(modality => ({ value: modality!, label: modality! }))
          },
          {
            label: 'Filtrar por estado',
            value: filterByStatus,
            onChange: setFilterByStatus,
            placeholder: 'Todos los estados',
            allOptionLabel: 'Todos los estados',
            options: availableStatuses
          }
        ]
      });
    }
  }, [filterByProjectType, filterByModality, filterByStatus, availableProjectTypes, availableModalities, availableStatuses, isMobile]);

  if (projectsLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Cargando proyectos...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProjects.map((project) => (
            <ProjectItemCard
              key={project.id}
              project={project}
              onClick={() => handleSelectProject(project.id)}
              onNavigateToProject={() => handleNavigateToProject(project.id)}
              onEdit={() => handleEdit(project)}
              isActive={project.is_active}
              projectColor={(project as any).use_custom_color && (project as any).custom_color_hex 
                ? (project as any).custom_color_hex 
                : project.color || 'var(--accent)'}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Folder className="w-12 h-12" />}
          title="No hay proyectos creados"
          description="Comienza creando tu primer proyecto para gestionar tu trabajo"
          action={
            <PlanRestricted 
              feature="max_projects" 
              current={projects.length}
              functionName="Crear Proyecto"
            >
              <Button
                onClick={() => openModal('project', {})}
                data-testid="button-create-project-empty"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Proyecto
              </Button>
            </PlanRestricted>
          }
        />
      )}
    </div>
  )
}
