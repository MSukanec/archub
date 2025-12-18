import { useState, useEffect, useMemo, useCallback } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects, useProjectsCount, updateProjectLastActive } from '@/features/projects'
import { useUserOrganizationPreferences, USER_ORGANIZATION_PREFERENCES_QUERY_KEYS } from '@/features/organization'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { Folder, Edit, Trash2, Plus, CheckCircle2, Search, Filter, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Table } from '@/components/shared/table'
import type { Column } from '@/components/shared/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlanRestricted } from '@/features/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useActionBarMobile } from '@/layouts'
import { useMobile } from '@/hooks/use-mobile'
import ProjectRow from '@/features/projects/components/ProjectRow'

export default function ProjectList() {
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined)
  const { data: projectsCount = 0 } = useProjectsCount(organizationId || undefined)
  const { data: organizationCurrencies = [] } = useOrganizationCurrencies(organizationId)
  const { toast } = useToast()
  
  // Get default currency for organization
  const defaultCurrency = useMemo(
    () => organizationCurrencies.find(oc => oc.is_default)?.currency,
    [organizationCurrencies]
  )
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
  const userId = userData?.user?.id;
  const { data: userOrgPrefs } = useUserOrganizationPreferences(userId, organizationId);
  const activeProjectId = userOrgPrefs?.last_project_id

  // Extract unique values for filters
  const availableProjectTypes = useMemo(() => Array.from(
    new Set(projects.map(p => p.project_data?.project_type?.name).filter(Boolean))
  ), [projects]);

  const availableModalities = useMemo(() => Array.from(
    new Set(projects.map(p => p.project_data?.project_modality?.name).filter(Boolean))
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
      project.project_data?.project_modality_id === filterByModality ||
      project.project_data?.project_modality?.name?.toLowerCase().includes(filterByModality.toLowerCase());
    
    const matchesStatus = filterByStatus === 'all' || 
      project.status?.toLowerCase() === filterByStatus.toLowerCase();

    return searchMatch && matchesProjectType && matchesModality && matchesStatus;
  })
  
  // Put active project first
  const sortedProjects = activeProjectId ? [
    ...filteredProjects.filter(project => project.id === activeProjectId),
    ...filteredProjects.filter(project => project.id !== activeProjectId)
  ] : filteredProjects

  const handleClearFilters = () => {
    setSearchValue('')
    setFilterByProjectType('all')
    setFilterByModality('all')
    setFilterByStatus('all')
  }

  // Configure Mobile Action Bar - ONLY RUN ONCE when isMobile changes
  useEffect(() => {
    if (!isMobile) return;

    setActions({
      search: {
        id: 'search',
        icon: Search,
        label: 'Buscar',
        onClick: () => { }, // Popover is handled in ActionBarMobile
      },
      create: {
        id: 'create',
        icon: Plus,
        label: 'Nuevo Proyecto',
        onClick: () => openModal('project', {}),
        variant: 'primary',
        planRestriction: {
          feature: 'max_projects',
          current: projectsCount,
          modalImage: '/features/ft-projects-512.webp',
          modalTitle: 'Alcanzaste el límite de proyectos',
          modalDescription: 'Has llegado al máximo de proyectos permitidos en tu plan actual. Actualiza a un plan superior para crear proyectos ilimitados y gestionar tu negocio sin restricciones.',
        },
      },
      filter: {
        id: 'filter',
        icon: Filter,
        label: 'Filtros',
        onClick: () => { }, // Popover is handled in ActionBarMobile
      },
      notifications: {
        id: 'notifications',
        icon: Bell,
        label: 'Notificaciones',
        onClick: () => { }, // Popover is handled in ActionBarMobile
      },
    });
    setShowActionBar(true);

    // Cleanup when component unmounts
    return () => {
      clearActions();
      setShowActionBar(false);
      setMobileSearchValue('');
      setSearchValue('');
    };
  }, [isMobile, projectsCount, openModal, setActions, setShowActionBar, clearActions, setMobileSearchValue]);

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

  // Select project mutation
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
      
      // Update last_active_at via backend API (fire and forget)
      updateProjectLastActive(projectId, organizationId!).catch(err => 
        console.error('Error updating project last_active_at:', err)
      );
      
      queryClient.invalidateQueries({ 
        queryKey: USER_ORGANIZATION_PREFERENCES_QUERY_KEYS.detail(userData?.user?.id!, organizationId!) 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      // Force immediate refetch to update UI
      queryClient.refetchQueries({
        queryKey: USER_ORGANIZATION_PREFERENCES_QUERY_KEYS.detail(userData?.user?.id!, organizationId!)
      });
      
      navigate('/project/dashboard');
      
      toast({
        title: "Proyecto seleccionado",
        description: "El proyecto se ha seleccionado correctamente"
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo seleccionar el proyecto",
        variant: "destructive"
      })
    }
  })

  const handleSelectProject = (projectId: string) => {
    selectProjectMutation.mutate(projectId)
  }

  const handleEdit = (project: any) => {
    openModal('project', { editingProject: project, isEditing: true })
  }

  const handleDeleteClick = (project: any) => {
    // Helper para obtener el texto del estado
    const getStatusText = (status: string) => {
      const statusConfig = {
        'active': 'En proceso',
        'inactive': 'Inactivo',
        'completed': 'Completado',
        'paused': 'Pausado',
        'cancelled': 'Cancelado',
        'planning': 'Planificación'
      }
      return statusConfig[status as keyof typeof statusConfig] || status || 'Sin estado';
    };
    
    // Construir detalles del proyecto
    const projectType = project.project_data?.project_type?.name || 'Sin tipo';
    const modality = project.project_data?.project_modality?.name || 'Sin modalidad';
    const statusText = getStatusText(project.status);
    const itemDetails = `${projectType} · ${modality} · ${statusText}`;
    
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar proyecto',
      description: 'Esta acción eliminará permanentemente el proyecto y todos sus datos asociados (diseño, obra, finanzas, etc.).',
      itemName: project.name,
      itemDetails: itemDetails,
      itemType: 'proyecto',
      destructiveActionText: 'Eliminar',
      onConfirm: () => deleteProjectMutation.mutate(project.id),
      isLoading: deleteProjectMutation.isPending
    });
  }

  // Format status badge
  const getStatusText = (status: string) => {
    const statusConfig = {
      'active': 'En proceso',
      'inactive': 'Inactivo',
      'completed': 'Completado',
      'paused': 'Pausado',
      'cancelled': 'Cancelado',
      'planning': 'Planificación'
    }
    return statusConfig[status as keyof typeof statusConfig] || status || 'Sin estado'
  }

  const getStatusBadge = (status: string) => (
    <Badge variant="default">
      {getStatusText(status)}
    </Badge>
  )

  // Table columns configuration
  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'name' as const,
      label: 'Proyecto',
      type: 'long-text' as const,
      sortable: false,
      render: (project: any) => (
        <div className="flex items-center gap-2">
          <div className="font-medium text-sm">{project.name}</div>
          {project.is_active && (
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--accent)' }}
              title="Proyecto activo"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </div>
          )}
        </div>
      )
    },
    {
      key: 'project_type' as const,
      label: 'Tipo',
      type: 'short-text' as const,
      sortable: false,
      render: (project: any) => (
        <span className="text-sm">
          {project.project_data?.project_type?.name || 'Sin especificar'}
        </span>
      )
    },
    {
      key: 'modality' as const,
      label: 'Modalidad',
      type: 'short-text' as const,
      sortable: false,
      render: (project: any) => (
        <span className="text-sm">
          {project.project_data?.project_modality?.name || 'Sin especificar'}
        </span>
      )
    },
    {
      key: 'currency' as const,
      label: 'Moneda',
      type: 'short-text' as const,
      sortable: false,
      render: (project: any) => {
        const currency = project.currency || defaultCurrency;
        return (
          <span className="text-sm">
            {currency?.name ? `${currency.name} (${currency.symbol})` : 'Sin especificar'}
          </span>
        );
      }
    },
    {
      key: 'status' as const,
      label: 'Estado',
      type: 'status' as const,
      sortable: false,
      render: (project: any) => getStatusBadge(project.status)
    },
    {
      key: 'created_at' as const,
      label: 'Creación',
      type: 'date' as const,
      sortable: false,
      render: (project: any) => (
        <span className="text-sm text-muted-foreground">
          {project.created_at ? format(new Date(project.created_at), 'dd/MM/yyyy', { locale: es }) : 'Sin fecha'}
        </span>
      )
    },
    {
      key: 'last_active_at' as const,
      label: 'Última Actividad',
      type: 'datetime' as const,
      sortable: false,
      render: (project: any) => (
        <span className="text-sm text-muted-foreground">
          {project.last_active_at 
            ? format(new Date(project.last_active_at), 'dd/MM/yyyy HH:mm', { locale: es }) 
            : 'Nunca'}
        </span>
      )
    }
  ], [defaultCurrency])

  const getProjectRowActions = (project: any) => [
    {
      label: 'Editar',
      icon: Edit,
      onClick: () => handleEdit(project)
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      onClick: () => handleDeleteClick(project),
      variant: 'destructive' as const
    }
  ]

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }
      
      const response = await fetch(`/api/projects/${projectId}?organizationId=${organizationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete project')
      }
      
      return await response.json()
    },
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ['projects', userData?.organization?.id] })
      
      const previousProjects = queryClient.getQueryData(['projects', userData?.organization?.id])
      
      queryClient.setQueryData(['projects', userData?.organization?.id], (old: any[]) => {
        if (!old) return old
        return old.filter(project => project.id !== projectId)
      })
      
      return { previousProjects }
    },
    onSuccess: () => {
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto se ha eliminado correctamente"
      })
      
      queryClient.invalidateQueries({ queryKey: ['projects', userData?.organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
    onError: (error: any, projectId, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', userData?.organization?.id], context.previousProjects)
      }
      
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el proyecto",
        variant: "destructive"
      })
    }
  })

  return (
    <div className="space-y-6">
      {sortedProjects.length > 0 ? (
        isMobile ? (
          <div className="space-y-3 pb-20">
            {sortedProjects.map(project => (
              <ProjectRow
                key={project.id}
                project={project}
                onClick={(proj) => handleSelectProject(proj.id)}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                isActive={project.is_active}
                data-testid={`project-row-${project.id}`}
              />
            ))}
          </div>
        ) : (
          <Table
            data={sortedProjects}
            columns={columns}
            onRowClick={(project) => handleSelectProject(project.id)}
            rowActions={getProjectRowActions}
            emptyStateConfig={{
              title: "No hay proyectos que coincidan",
              description: "Ajusta los filtros de búsqueda para encontrar proyectos"
            }}
          />
        )
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
