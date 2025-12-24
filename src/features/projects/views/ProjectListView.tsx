import { useState, useEffect, useMemo } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects, useProjectsCount, updateProjectLastActive } from '@/features/projects'
import { projectsKeys } from '@/core/query-keys'
import { useUserOrganizationPreferences, USER_ORGANIZATION_PREFERENCES_QUERY_KEYS } from '@/features/organization'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { Folder, Edit, Trash2, Plus, CheckCircle2, Search, Filter, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOptimisticMutation } from '@/core/save-engine'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal'
import { EmptyState } from '@/components/shared/EmptyState'
import { Table } from '@/components/shared/table'
import type { Column } from '@/components/shared/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlanRestricted } from '@/features/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useActionBarMobile } from '@/layouts'
import { useMobile } from '@/hooks/use-mobile'
import { ProjectRow } from '@/features/projects/components/ProjectRow'

export function ProjectListView() {
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined)
  const { data: projectsCount = 0 } = useProjectsCount(organizationId || undefined)
  const { data: organizationCurrencies = [] } = useOrganizationCurrencies(organizationId)
  
  // Get default currency for organization
  const defaultCurrency = useMemo(
    () => organizationCurrencies.find(oc => oc.is_default)?.currency,
    [organizationCurrencies]
  )
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

  // Configure Mobile Action Bar
  useEffect(() => {
    if (!isMobile) return;

    setActions({
      search: {
        id: 'search',
        icon: Search,
        label: 'Buscar',
        onClick: () => { },
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
        onClick: () => { },
      },
      notifications: {
        id: 'notifications',
        icon: Bell,
        label: 'Notificaciones',
        onClick: () => { },
      },
    });
    setShowActionBar(true);

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
  const { mutate: selectProject, isPending: isSelectingProject } = useOptimisticMutation({
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
      
      setSelectedProject(projectId, organizationId);
      setSidebarLevel('project');
      
      updateProjectLastActive(projectId, organizationId!).catch(err => 
        console.error('Error updating project last_active_at:', err)
      );
      
      navigate('/project/dashboard');
      
      return projectId;
    },
    queryKey: USER_ORGANIZATION_PREFERENCES_QUERY_KEYS.detail(userData?.user?.id!, organizationId!),
    optimisticUpdate: (oldData, projectId) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        last_project_id: projectId
      };
    },
    onSuccessMessage: "Proyecto seleccionado",
    onErrorMessage: "No se pudo seleccionar el proyecto",
    additionalQueryKeys: [['current-user']],
  });

  const handleSelectProject = (projectId: string) => {
    selectProject(projectId)
  }

  const handleEdit = (project: any) => {
    openModal('project', { editingProject: project, isEditing: true })
  }

  const handleDeleteClick = (project: any) => {
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
      onConfirm: () => deleteProject(project.id),
      isLoading: isDeleting
    });
  }

  // Format status
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

  const getStatusVariant = (status: string): 'status-active' | 'status-completed' | 'status-paused' | 'status-cancelled' | 'status-planning' | 'neutral' => {
    const variantMap: Record<string, 'status-active' | 'status-completed' | 'status-paused' | 'status-cancelled' | 'status-planning' | 'neutral'> = {
      'active': 'status-active',
      'completed': 'status-completed',
      'paused': 'status-paused',
      'cancelled': 'status-cancelled',
      'planning': 'status-planning'
    }
    return variantMap[status] || 'neutral'
  }

  const getStatusBadge = (status: string) => (
    <Badge variant={getStatusVariant(status)}>
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
      type: 'medium-text' as const,
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
  const { mutate: deleteProject, isPending: isDeleting } = useOptimisticMutation({
    mutationFn: async (projectId: string) => {
      // If deleting active project, find previous by last_active_at
      if (projectId === activeProjectId && projects.length > 1) {
        const otherProjects = projects
          .filter(p => p.id !== projectId)
          .sort((a, b) => {
            const aTime = a.last_active_at ? new Date(a.last_active_at).getTime() : 0;
            const bTime = b.last_active_at ? new Date(b.last_active_at).getTime() : 0;
            return bTime - aTime;
          });
        
        if (otherProjects.length > 0) {
          setTimeout(() => {
            selectProject(otherProjects[0].id);
          }, 0);
        }
      }
      
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
    queryKey: projectsKeys.list(userData?.organization?.id),
    optimisticUpdate: (oldData, projectId) => {
      if (!oldData) return oldData;
      return oldData.filter((project: any) => project.id !== projectId);
    },
    onSuccessMessage: "El proyecto se ha eliminado correctamente",
    onErrorMessage: "No se pudo eliminar el proyecto",
    additionalQueryKeys: [['current-user']],
  })

  return (
    <div className="space-y-6" data-testid="container-project-list">
      {sortedProjects.length > 0 ? (
        isMobile ? (
          <div className="space-y-3 pb-20" data-testid="list-projects-mobile">
            {sortedProjects.map(project => (
              <ProjectRow
                key={project.id}
                project={project}
                onClick={(proj) => handleSelectProject(proj.id)}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                isActive={project.is_active}
                data-testid={`row-project-${project.id}`}
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
