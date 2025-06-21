import { useState, useMemo } from 'react'
import { Folder, Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { CustomPageLayout } from '@/components/ui-custom/CustomPageLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { NewProjectModal } from '@/modals/NewProjectModal'

type FilterType = 'all' | 'active' | 'completed' | 'on-hold' | 'planning'

interface Project {
  id: string
  name: string
  status: string
  created_at: string
  created_by: string
  organization_id: string
  is_active: boolean
  project_data?: {
    project_type_id?: string
    modality_id?: string
    project_type?: {
      id: string
      name: string
    }
    modality?: {
      id: string
      name: string
    }
  }
  creator?: {
    id: string
    full_name?: string
    first_name?: string
    last_name?: string
    email: string
    avatar_url?: string
  }
}

export default function Projects() {
  const { data, isLoading, error, refetch } = useCurrentUser()
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useProjects(data?.organization?.id)
  const [searchValue, setSearchValue] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const { toast } = useToast()

  // Mutation for selecting a project
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !data?.user?.id) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('user_id', data.user.id)

      if (error) {
        throw error
      }

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      refetch()
    }
  })

  // Mutation for deleting a project
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase) {
        throw new Error('Supabase not available')
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        throw error
      }

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      toast({
        title: 'Proyecto eliminado',
        description: 'El proyecto se eliminó exitosamente.'
      })
      setDeletingProject(null)
    },
    onError: (error) => {
      console.error('Error deleting project:', error)
      toast({
        title: 'Error al eliminar proyecto',
        description: 'No se pudo eliminar el proyecto. Intenta nuevamente.',
        variant: 'destructive'
      })
    }
  })

  const selectedProject = data?.preferences?.last_project_id

  // Filter and sort projects based on search, filter type, and active project
  const filteredProjects = useMemo(() => {
    if (!projectsData) return []
    
    const filtered = projectsData.filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchValue.toLowerCase())
      const matchesFilter = activeFilter === 'all' || project.status === activeFilter
      
      return matchesSearch && matchesFilter
    })

    // Sort projects: active project first, then by creation date
    return filtered.sort((a, b) => {
      const aIsSelected = a.id === selectedProject
      const bIsSelected = b.id === selectedProject
      
      if (aIsSelected && !bIsSelected) return -1
      if (!aIsSelected && bIsSelected) return 1
      
      // If neither or both are selected, sort by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [projectsData, searchValue, activeFilter, selectedProject])

  const handleSelectProject = (projectId: string) => {
    selectProjectMutation.mutate(projectId)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowNewProjectModal(true)
  }

  const handleDeleteProject = (project: Project) => {
    setDeletingProject(project)
  }

  const confirmDeleteProject = () => {
    if (deletingProject) {
      deleteProjectMutation.mutate(deletingProject.id)
    }
  }

  const filters = [
    { label: 'Todos los proyectos', onClick: () => setActiveFilter('all') },
    { label: 'Activos', onClick: () => setActiveFilter('active') },
    { label: 'Completados', onClick: () => setActiveFilter('completed') },
    { label: 'En pausa', onClick: () => setActiveFilter('on-hold') },
    { label: 'Planificación', onClick: () => setActiveFilter('planning') },
  ]

  const handleClearFilters = () => {
    setSearchValue("")
    setActiveFilter('all')
  }

  const handleNewProject = () => {
    setEditingProject(null)
    setShowNewProjectModal(true)
  }

  const actions = (
    <Button variant="default" onClick={handleNewProject}>
      <Plus className="w-4 h-4 mr-2" />
      Nuevo proyecto
    </Button>
  )

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', variant: 'default' as const },
      completed: { label: 'Completado', variant: 'secondary' as const },
      'on-hold': { label: 'En pausa', variant: 'outline' as const },
      planning: { label: 'Planificación', variant: 'outline' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCreatorInfo = (project: Project) => {
    if (project.creator) {
      const name = project.creator.full_name || 
        (project.creator.first_name && project.creator.last_name 
          ? `${project.creator.first_name} ${project.creator.last_name}`
          : project.creator.email)
      
      const initials = project.creator.full_name 
        ? project.creator.full_name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)
        : (project.creator.first_name && project.creator.last_name
            ? `${project.creator.first_name.charAt(0)}${project.creator.last_name.charAt(0)}`
            : project.creator.email.charAt(0).toUpperCase())

      return { name, initials, avatar: project.creator.avatar_url || '' }
    }
    
    // Fallback to current user info
    const creatorName = data?.user?.full_name || 
      (data?.user_data?.first_name && data?.user_data?.last_name 
        ? `${data.user_data.first_name} ${data.user_data.last_name}`
        : data?.user?.email) || 'Usuario'
    
    const creatorInitials = data?.user?.full_name 
      ? data.user.full_name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)
      : (data?.user_data?.first_name && data?.user_data?.last_name
          ? `${data.user_data.first_name.charAt(0)}${data.user_data.last_name.charAt(0)}`
          : data?.user?.email?.charAt(0).toUpperCase()) || 'U'

    return { name: creatorName, initials: creatorInitials, avatar: data?.user?.avatar_url || '' }
  }

  if (isLoading || projectsLoading) {
    return (
      <CustomPageLayout
        icon={Folder}
        title="Proyectos"
        actions={actions}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onClearFilters={handleClearFilters}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-lg font-medium text-muted-foreground">Cargando proyectos...</p>
            </div>
          </CardContent>
        </Card>
      </CustomPageLayout>
    )
  }

  if (error || projectsError) {
    return (
      <CustomPageLayout
        icon={Folder}
        title="Proyectos"
        actions={actions}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onClearFilters={handleClearFilters}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">Error al cargar proyectos</p>
              <p className="text-sm text-muted-foreground">
                Intenta recargar la página o contacta al soporte técnico.
              </p>
            </div>
          </CardContent>
        </Card>
      </CustomPageLayout>
    )
  }

  if (!filteredProjects.length) {
    return (
      <CustomPageLayout
        icon={Folder}
        title="Proyectos"
        actions={actions}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onClearFilters={handleClearFilters}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No se encontraron proyectos</p>
              <p className="text-sm text-muted-foreground">
                {searchValue || activeFilter !== 'all' 
                  ? "Intenta ajustar tu búsqueda o filtros" 
                  : "Aún no hay proyectos en esta organización."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </CustomPageLayout>
    )
  }

  return (
    <CustomPageLayout
      icon={Folder}
      title="Gestión de Proyectos"
      actions={actions}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      filters={filters}
      onClearFilters={handleClearFilters}
    >
      {/* Encabezados de columnas */}
      <div className="w-full px-4 py-2 border-b border-border/50 mb-3">
        <div className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {/* Fecha */}
          <div className="flex-shrink-0 w-20">
            Fecha
          </div>
          
          {/* Creador */}
          <div className="flex-shrink-0 w-48 px-4">
            Creador
          </div>

          {/* Nombre del proyecto */}
          <div className="flex-1 min-w-0 px-4">
            Proyecto
          </div>

          {/* Tipología */}
          <div className="w-32 flex-shrink-0 px-2">
            Tipología
          </div>

          {/* Modalidad */}
          <div className="w-32 flex-shrink-0 px-2">
            Modalidad
          </div>

          {/* Estado */}
          <div className="w-28 flex-shrink-0">
            Estado
          </div>

          {/* Acciones */}
          <div className="w-10 flex-shrink-0">
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredProjects.map((project) => {
          const isSelected = project.id === selectedProject
          const isSelecting = selectProjectMutation.isPending && selectProjectMutation.variables === project.id
          const creator = getCreatorInfo(project)

          return (
            <Card 
              key={project.id} 
              className={cn(
                "w-full transition-all duration-200 hover:shadow-md cursor-pointer",
                isSelected && "border-[var(--accent)] ring-1 ring-[var(--accent)] bg-[var(--accent)]/5"
              )}
              onClick={() => handleSelectProject(project.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between w-full">
                  {/* Fecha */}
                  <div className="flex-shrink-0 w-20">
                    <p className="text-xs text-muted-foreground font-medium">
                      {formatDate(project.created_at)}
                    </p>
                  </div>

                  {/* Creador */}
                  <div className="flex items-center gap-2 w-40 flex-shrink-0">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={creator.avatar} />
                      <AvatarFallback className="text-xs">{creator.initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium truncate">{creator.name}</span>
                  </div>

                  {/* Nombre del proyecto */}
                  <div className="flex-1 min-w-0 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{project.name}</span>
                      {isSelected && (
                        <Badge variant="default" className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20">
                          Activo
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Tipología */}
                  <div className="w-32 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {project.project_data?.project_type?.name || 'Sin tipología'}
                    </span>
                  </div>

                  {/* Modalidad */}
                  <div className="w-32 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {project.project_data?.modality?.name || 'Sin modalidad'}
                    </span>
                  </div>

                  {/* Estado */}
                  <div className="w-28 flex-shrink-0">
                    {getStatusBadge(project.status)}
                  </div>

                  {/* Acciones */}
                  <div className="w-10 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProject(project)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProject(project)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* New/Edit Project Modal */}
      <NewProjectModal
        open={showNewProjectModal}
        onClose={() => {
          setShowNewProjectModal(false)
          setEditingProject(null)
        }}
        editingProject={editingProject}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProject} onOpenChange={() => setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El proyecto "{deletingProject?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomPageLayout>
  )
}