import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences'
import { Folder, ArrowRight, Edit, Trash2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlanRestricted } from '@/components/ui-custom/security/PlanRestricted'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ProjectList() {
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
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
  const [searchValue, setSearchValue] = useState('')

  // Get active project
  const { data: userOrgPrefs } = useUserOrganizationPreferences(organizationId);
  const activeProjectId = userOrgPrefs?.last_project_id

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

  // Format status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { color: 'var(--accent)', text: 'Activo' },
      'completed': { color: '#22c55e', text: 'Completado' },
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
        <div className="flex items-center gap-3">
          {project.is_active && (
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: 'var(--accent)' }}
              title="Proyecto activo"
            />
          )}
          <div>
            <div className="font-medium text-sm">{project.name}</div>
          </div>
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
      label: 'Ir al proyecto',
      icon: ArrowRight,
      onClick: () => handleSelectProject(project.id)
    },
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
        <Table
          data={sortedProjects}
          columns={columns}
          isLoading={projectsLoading}
          rowActions={getProjectRowActions}
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
                    <option value="vivienda">Vivienda</option>
                    <option value="obra nueva">Obra Nueva</option>
                    <option value="remodelacion">Remodelación</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="consultoria">Consultoría</option>
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
                    <option value="activo">Activo</option>
                    <option value="completado">Completado</option>
                    <option value="pausado">Pausado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="planificacion">Planificación</option>
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
                    <option value="active">En proceso</option>
                    <option value="completed">Completado</option>
                    <option value="paused">Pausado</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="planning">Planificación</option>
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
