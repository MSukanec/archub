import { useState, useMemo } from 'react'
import { Folder, Plus, Calendar, Crown, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { CustomPageLayout } from '@/components/ui-custom/CustomPageLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

type FilterType = 'all' | 'active' | 'completed' | 'on-hold'

interface Project {
  id: string
  name: string
  status: string
  budget: number
  team_size: number
  created_at: string
  organization_id: string
  description?: string
  progress?: number
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

  // Filter projects based on search and filter type
  const filteredProjects = useMemo(() => {
    if (!projectsData) return []
    
    return projectsData.filter((project: Project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                           (project.description || '').toLowerCase().includes(searchValue.toLowerCase())
      
      const matchesFilter = activeFilter === 'all' || project.status === activeFilter
      
      return matchesSearch && matchesFilter
    })
  }, [projectsData, searchValue, activeFilter])

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
    // For now, we'll show organization owner info since we don't have creator details in the project data
    // In a real implementation, you'd join with organization_members to get creator info
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
      title="Proyectos"
      actions={actions}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      filters={filters}
      onClearFilters={handleClearFilters}
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Fecha</TableHead>
                <TableHead className="w-[200px]">Creador</TableHead>
                <TableHead>Nombre del proyecto</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
                <TableHead className="w-[80px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project: Project) => {
                const isSelected = project.id === selectedProject
                const isSelecting = selectProjectMutation.isPending && selectProjectMutation.variables === project.id
                const creator = getCreatorInfo(project)

                return (
                  <TableRow key={project.id} className={cn(
                    "transition-colors",
                    isSelected && "bg-muted/50"
                  )}>
                    <TableCell className="font-medium text-sm text-muted-foreground">
                      {formatDate(project.created_at)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={creator.avatar} />
                          <AvatarFallback className="text-xs">{creator.initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{creator.name}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <button
                        onClick={() => handleSelectProject(project.id)}
                        disabled={isSelecting}
                        className={cn(
                          "flex items-center gap-2 text-left hover:text-primary transition-colors",
                          isSelecting && "opacity-50"
                        )}
                      >
                        <span className="font-medium">{project.name}</span>
                        {isSelected && <Crown className="h-4 w-4 text-primary" />}
                      </button>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(project.status)}
                    </TableCell>
                    
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New/Edit Project Modal */}
      <NewProjectModal
        open={showNewProjectModal}
        onClose={() => {
          setShowNewProjectModal(false)
          setEditingProject(null)
        }}
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