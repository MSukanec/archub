import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences'
import { Folder, Plus, Home, Search, Filter, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import ProjectRow from '@/components/ui/data-row/rows/ProjectRow'
import ProjectItem from '@/components/ui-custom/general/ProjectItem'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'

export default function Projects() {
  const { openModal } = useGlobalModalStore()
  const [activeTab, setActiveTab] = useState('projects')
  
  const { data: userData, isLoading } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setSelectedProject } = useProjectContext()
  const [, navigate] = useLocation()

  // Filter states
  const [filterByProjectType, setFilterByProjectType] = useState('all')
  const [filterByModality, setFilterByModality] = useState('all')
  const [filterByStatus, setFilterByStatus] = useState('all')

  // Mobile action bar
  const { 
    setActions, 
    setShowActionBar, 
    clearActions,
    setFilterConfig 
  } = useActionBarMobile()
  const isMobile = useMobile()

  // Mark active project using useUserOrganizationPreferences hook
  const { data: userOrgPrefs } = useUserOrganizationPreferences(organizationId);
  const activeProjectId = userOrgPrefs?.last_project_id



  
  const projectsWithActive = projects.map(project => ({
    ...project,
    is_active: project.id === activeProjectId
  }))
  
  // Apply filters
  const filteredProjects = projectsWithActive.filter(project => {
    // Filter by project type
    const matchesProjectType = filterByProjectType === 'all' || 
      project.project_data?.project_type_id === filterByProjectType ||
      project.project_data?.project_type?.name?.toLowerCase().includes(filterByProjectType.toLowerCase());
    
    // Filter by modality
    const matchesModality = filterByModality === 'all' || 
      project.project_data?.modality_id === filterByModality ||
      project.project_data?.modality?.name?.toLowerCase().includes(filterByModality.toLowerCase());
    
    // Filter by status
    const matchesStatus = filterByStatus === 'all' || 
      project.status?.toLowerCase() === filterByStatus.toLowerCase();

    return matchesProjectType && matchesModality && matchesStatus;
  })
  
  // Put active project first
  const sortedProjects = activeProjectId ? [
    ...filteredProjects.filter(project => project.id === activeProjectId),
    ...filteredProjects.filter(project => project.id !== activeProjectId)
  ] : filteredProjects

  const handleClearFilters = () => {
    setFilterByProjectType('all')
    setFilterByModality('all')
    setFilterByStatus('all')
  }

  // Mutación para seleccionar proyecto  
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
      
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userData?.user?.id, organizationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
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
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar proyecto',
      description: 'Esta acción eliminará permanentemente el proyecto y todos sus datos asociados (diseño, obra, finanzas, etc.).',
      itemName: project.name,
      destructiveActionText: 'Eliminar',
      onConfirm: () => deleteProjectMutation.mutate(project.id),
      isLoading: deleteProjectMutation.isPending
    });
  }

  const handleNavigateToBasicData = (project: any) => {
    selectProjectMutation.mutate(project.id)
    // Los datos básicos ahora se manejan en la tab "Datos Básicos" de esta misma página
    setActiveTab('basic-data')
  }

  // Mutación para eliminar proyecto
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

  // Configure mobile action bar only for projects tab
  useEffect(() => {
    if (isMobile && activeTab === 'projects') {
      setActions({
        home: { 
          id: 'home', 
          label: 'Inicio', 
          icon: <Home className="h-6 w-6" />,
          onClick: () => {} 
        },
        search: { 
          id: 'search', 
          label: 'Buscar', 
          icon: <Search className="h-6 w-6" />,
          onClick: () => {} 
        },
        create: {
          id: 'create',
          icon: <Plus className="h-6 w-6" />,
          label: 'Nuevo Proyecto',
          onClick: () => openModal('project', {}),
          variant: 'primary'
        },
        filter: { 
          id: 'filter', 
          label: 'Filtros', 
          icon: <Filter className="h-6 w-6" />,
          onClick: () => {}
        },
        notifications: { 
          id: 'notifications', 
          label: 'Notificaciones', 
          icon: <Bell className="h-6 w-6" />,
          onClick: () => {} 
        },
      })
      setShowActionBar(true)
    } else if (isMobile) {
      // Clear action bar for other tabs
      clearActions()
    }

    return () => {
      if (isMobile && activeTab === 'projects') {
        clearActions()
      }
    }
  }, [isMobile, activeTab, openModal])

  // Configure filter config separately like in movements page
  useEffect(() => {
    if (isMobile && activeTab === 'projects') {
      setFilterConfig({
        filters: [
          {
            key: 'project_type',
            label: 'Tipo de proyecto',
            value: filterByProjectType,
            onChange: setFilterByProjectType,
            allOptionLabel: 'Todos los tipos',
            placeholder: 'Seleccionar tipo...',
            options: [
              { value: 'vivienda', label: 'Vivienda' },
              { value: 'obra nueva', label: 'Obra Nueva' },
              { value: 'remodelacion', label: 'Remodelación' },
              { value: 'mantenimiento', label: 'Mantenimiento' },
              { value: 'consultoria', label: 'Consultoría' }
            ]
          },
          {
            key: 'modality',
            label: 'Modalidad',
            value: filterByModality,
            onChange: setFilterByModality,
            allOptionLabel: 'Todas las modalidades',
            placeholder: 'Seleccionar modalidad...',
            options: [
              { value: 'activo', label: 'Activo' },
              { value: 'completado', label: 'Completado' },
              { value: 'pausado', label: 'Pausado' },
              { value: 'cancelado', label: 'Cancelado' },
              { value: 'planificacion', label: 'Planificación' }
            ]
          },
          {
            key: 'status',
            label: 'Estado',
            value: filterByStatus,
            onChange: setFilterByStatus,
            allOptionLabel: 'Todos los estados',
            placeholder: 'Seleccionar estado...',
            options: [
              { value: 'active', label: 'En proceso' },
              { value: 'completed', label: 'Completado' },
              { value: 'paused', label: 'Pausado' },
              { value: 'cancelled', label: 'Cancelado' },
              { value: 'planning', label: 'Planificación' }
            ]
          }
        ],
        onClearFilters: handleClearFilters
      })
    }
  }, [isMobile, activeTab, filterByProjectType, filterByModality, filterByStatus, setFilterConfig])

  const headerProps = {
    title: "Gestión de Proyectos",
    icon: Folder,
    breadcrumb: [
      { name: "Perfil", href: "/profile/data" },
      { name: "Gestión de Proyectos", href: "/organization/projects" }
    ],
    tabs: [
      {
        id: 'projects',
        label: 'Proyectos',
        isActive: activeTab === 'projects'
      },
    ],
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actionButton: {
      label: "Nuevo Proyecto",
      icon: Plus,
      onClick: () => openModal('project', {})
    }
  }

  if (isLoading || projectsLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          Cargando proyectos...
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Tab: Proyectos */}
        {activeTab === 'projects' && (
          <>

            {/* Projects List */}
            {sortedProjects.length > 0 ? (
              isMobile ? (
                /* Mobile: Lista vertical con ProjectRow */
                <div className="space-y-2">
                  {sortedProjects.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      onClick={() => handleSelectProject(project.id)}
                      isActive={project.id === userOrgPrefs?.last_project_id}
                      density="normal"
                    />
                  ))}
                </div>
              ) : (
                /* Desktop: Grid de 3 columnas con ProjectItem, activo primero */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      onClick={() => handleSelectProject(project.id)}
                      onEdit={() => openModal('project', { editingProject: project, isEditing: true })}
                      isActive={project.id === userOrgPrefs?.last_project_id}
                      projectColor={project.color || 'var(--accent)'}
                    />
                  ))}
                </div>
              )
            ) : (
              <EmptyState
                icon={<Folder className="w-12 h-12" />}
                title="No hay proyectos creados"
                description="Comienza creando tu primer proyecto para gestionar tu trabajo"
                action={
                  <Button
                    onClick={() => openModal('project', {})}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Proyecto
                  </Button>
                }
              />
            )}
          </>
        )}

      </div>
    </Layout>
  )
}