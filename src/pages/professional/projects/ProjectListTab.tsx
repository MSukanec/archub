import { useState, useEffect, useMemo, useCallback } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences'
import { Folder, Edit, Trash2, Plus, CheckCircle2, Search, Filter, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlanRestricted } from '@/components/ui-custom/security/PlanRestricted'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'

export default function ProjectList() {
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

  const handleClearFilters = () => {
    setSearchValue('')
    setFilterByProjectType('all')
    setFilterByModality('all')
    setFilterByStatus('all')
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
      
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userData?.user?.id, organizationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
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
        'completed': 'Completado',
        'paused': 'Pausado',
        'cancelled': 'Cancelado',
        'planning': 'Planificación'
      }
      return statusConfig[status as keyof typeof statusConfig] || status || 'Sin estado';
    };
    
    // Construir detalles del proyecto
    const projectType = project.project_data?.project_type?.name || 'Sin tipo';
    const modality = project.project_data?.modality?.name || 'Sin modalidad';
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
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { color: 'var(--accent)', text: 'En proceso' },
      'completed': { color: 'var(--main-sidebar-bg)', text: 'Completado' },
      'paused': { color: '#f59e0b', text: 'Pausado' },
      'cancelled': { color: '#ef4444', text: 'Cancelado' },
      'planning': { color: '#3b82f6', text: 'Planificación' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: '#6b7280', text: status || 'Sin estado' }
    
    return (
      <Badge 
        style={{ backgroundColor: config.color, color: 'white' }}
        className="text-xs"
      >
        {config.text}
      </Badge>
    )
  }

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'Proyecto',
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
      key: 'project_type',
      label: 'Tipo',
      render: (project: any) => (
        <div className="text-sm">
          {project.project_data?.project_type?.name || 'Sin especificar'}
        </div>
      )
    },
    {
      key: 'modality',
      label: 'Modalidad',
      render: (project: any) => (
        <div className="text-sm">
          {project.project_data?.modality?.name || 'Sin especificar'}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (project: any) => getStatusBadge(project.status)
    },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      render: (project: any) => (
        <div className="text-sm text-muted-foreground">
          {project.created_at ? format(new Date(project.created_at), 'dd/MM/yyyy', { locale: es }) : 'Sin fecha'}
        </div>
      )
    }
  ]

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

  const getPrimaryRowAction = (project: any) => ({
    label: 'Ir al Proyecto',
    onClick: () => handleSelectProject(project.id)
  })

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
        <Table
          data={sortedProjects}
          columns={columns}
          isLoading={projectsLoading}
          rowActions={getProjectRowActions}
          primaryRowAction={getPrimaryRowAction}
          getIsInactive={(project) => project.status === 'completed'}
          inactiveSeparatorLabel="Proyectos Completados"
          emptyState={
            <EmptyState
              icon={<Folder className="w-12 h-12" />}
              title="No hay proyectos que coincidan"
              description="Ajusta los filtros de búsqueda para encontrar proyectos"
            />
          }
          topBar={{
            showSearch: true,
            searchValue: searchValue,
            onSearchChange: setSearchValue,
            showClearFilters: searchValue !== '' || filterByProjectType !== 'all' || filterByModality !== 'all' || filterByStatus !== 'all',
            onClearFilters: handleClearFilters,
            showFilter: true,
            renderFilterContent: () => (
              <div className="space-y-4 w-72">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Tipo de Proyecto</label>
                  <select 
                    value={filterByProjectType} 
                    onChange={(e) => setFilterByProjectType(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded"
                  >
                    <option value="all">Todos los tipos</option>
                    {availableProjectTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Modalidad</label>
                  <select 
                    value={filterByModality} 
                    onChange={(e) => setFilterByModality(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded"
                  >
                    <option value="all">Todas las modalidades</option>
                    {availableModalities.map(modality => (
                      <option key={modality} value={modality}>{modality}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Estado</label>
                  <select 
                    value={filterByStatus} 
                    onChange={(e) => setFilterByStatus(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded"
                  >
                    <option value="all">Todos los estados</option>
                    {availableStatuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ),
            isFilterActive: filterByProjectType !== 'all' || filterByModality !== 'all' || filterByStatus !== 'all'
          }}
        />
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
