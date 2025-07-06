import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CustomRestricted } from '@/components/ui-custom/misc/CustomRestricted'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { Folder, Crown, Plus, Calendar, MoreHorizontal, Edit, Trash2, Home, Search, Filter, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigationStore } from '@/stores/navigationStore'
import { useLocation } from 'wouter'
import { NewProjectModal } from '@/modals/project/NewProjectModal'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
import ProjectCard from '@/components/cards/ProjectCard'
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext'

export default function OrganizationProjects() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('date_recent')
  const [filterByStatus, setFilterByStatus] = useState('all')
  const [editingProject, setEditingProject] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<any>(null)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const { data: userData, isLoading } = useCurrentUser()
  const { data: projects = [], isLoading: projectsLoading } = useProjects(userData?.organization?.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setSidebarContext } = useNavigationStore()
  const [, navigate] = useLocation()
  const { setActions } = useMobileActionBar()

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Configurar acciones para móvil
  useEffect(() => {
    if (isMobile) {
      setActions({
        slot1: {
          id: 'home',
          icon: <Home className="w-5 h-5" />,
          label: 'Inicio',
          onClick: () => navigate('/organization/dashboard')
        },
        slot2: {
          id: 'search',
          icon: <Search className="w-5 h-5" />,
          label: 'Buscar',
          onClick: () => {}
        },
        slot3: {
          id: 'create',
          icon: <Plus className="w-5 h-5" />,
          label: 'Crear',
          variant: 'primary',
          onClick: () => setShowNewProjectModal(true)
        },
        slot4: {
          id: 'filter',
          icon: <Filter className="w-5 h-5" />,
          label: 'Filtros',
          onClick: () => {}
        },
        slot5: {
          id: 'clear',
          icon: <X className="w-5 h-5" />,
          label: 'Limpiar',
          onClick: () => {
            setSearchValue('')
            setFilterByStatus('all')
            setSortBy('date_recent')
          }
        }
      })
    }

    return () => {
      if (isMobile) {
        setActions({})
      }
    }
  }, [isMobile, navigate, setActions])

  // Filtrar y ordenar proyectos
  let filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchValue.toLowerCase())
    
    if (filterByStatus === "all") return matchesSearch
    if (filterByStatus === "active") return matchesSearch && project.status === 'active'
    if (filterByStatus === "planning") return matchesSearch && project.status === 'planning'
    if (filterByStatus === "completed") return matchesSearch && project.status === 'completed'
    if (filterByStatus === "on-hold") return matchesSearch && project.status === 'on-hold'
    
    return matchesSearch
  }) || []

  // Aplicar ordenamiento
  filteredProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.name.localeCompare(b.name)
      case 'name_desc':
        return b.name.localeCompare(a.name)
      case 'date_recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'date_oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      default:
        return 0
    }
  })

  // Poner el proyecto activo primero
  const activeProjectId = userData?.preferences?.last_project_id
  if (activeProjectId) {
    filteredProjects = [
      ...filteredProjects.filter(project => project.id === activeProjectId),
      ...filteredProjects.filter(project => project.id !== activeProjectId)
    ]
  }

  // Mutación para seleccionar proyecto
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('user_id', userData?.user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      setSidebarContext('project')
      navigate('/project/dashboard')
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
    setEditingProject(project)
    setShowNewProjectModal(true)
  }

  const handleDeleteClick = (project: any) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const clearFilters = () => {
    setSearchValue("")
    setSortBy('date_recent')
    setFilterByStatus('all')
  }

  // Filtros personalizados
  const customFilters = (
    <div className="w-72 p-4 space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_recent">Fecha (Más reciente)</SelectItem>
            <SelectItem value="date_oldest">Fecha (Más antigua)</SelectItem>
            <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
            <SelectItem value="name_desc">Nombre (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Filtrar por estado</Label>
        <Select value={filterByStatus} onValueChange={setFilterByStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="planning">En planificación</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="on-hold">En pausa</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const actions = [
    <CustomRestricted key="new-project" feature="max_projects" current={filteredProjects?.length || 0}>
      <Button 
        className="h-8 px-3 text-sm"
        onClick={() => setShowNewProjectModal(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Nuevo Proyecto
      </Button>
    </CustomRestricted>
  ]

  const headerProps = {
    icon: Folder,
    title: "Gestión de Proyectos",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    customFilters,
    onClearFilters: clearFilters,
    actions
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

  // Obtener el proyecto seleccionado para mostrar información
  const selectedProject = projects?.find(p => p.id === userData?.preferences?.last_project_id);

  return (
    <>
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Card de información del proyecto seleccionado */}
        {selectedProject && (
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Folder className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{selectedProject.name}</h3>
                <p className="text-sm text-muted-foreground">Proyecto activo seleccionado</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Creado:</span>
                <p className="font-medium">{format(new Date(selectedProject.created_at), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipología:</span>
                <p className="font-medium">{selectedProject.project_data?.project_type?.name || 'Sin especificar'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Modalidad:</span>
                <p className="font-medium">{selectedProject.project_data?.modality?.name || 'Sin especificar'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Estado:</span>
                <Badge 
                  variant={
                    selectedProject.status === 'active' ? 'default' :
                    selectedProject.status === 'planning' ? 'secondary' :
                    selectedProject.status === 'completed' ? 'outline' : 'destructive'
                  }
                >
                  {selectedProject.status === 'planning' ? 'Planificación' :
                   selectedProject.status === 'active' ? 'Activo' :
                   selectedProject.status === 'on-hold' ? 'En pausa' : 'Completado'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Mostrar contenido solo si hay proyectos */}
        {filteredProjects.length > 0 ? (
          <>
            {/* Vista móvil */}
            {isMobile ? (
              <div className="space-y-3 px-4">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onSelect={(project) => handleSelectProject(project.id)}
                  />
                ))}
              </div>
            ) : (
              <>
                {/* Headers de columnas - Desktop */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                  <div className="col-span-2">Fecha</div>
                  <div className="col-span-2">Creador</div>
                  <div className="col-span-2">Proyecto</div>
                  <div className="col-span-2">Tipología</div>
                  <div className="col-span-2">Modalidad</div>
                  <div className="col-span-1">Estado</div>
                  <div className="col-span-1">Acciones</div>
                </div>

                {/* Lista de proyectos - Desktop */}
                <div className="space-y-2">
                  {filteredProjects.map((project) => {
                    const isSelected = userData?.preferences?.last_project_id === project.id
                    
                    return (
                      <Card 
                        key={project.id} 
                        className={`w-full cursor-pointer transition-all hover:shadow-sm border ${
                          isSelected ? 'border-[var(--accent)] bg-[var(--accent-bg)]' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectProject(project.id)
                        }}
                      >
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Fecha */}
                        <div className="col-span-2 text-xs text-muted-foreground">
                          {format(new Date(project.created_at), 'dd/MM/yyyy', { locale: es })}
                        </div>

                        {/* Creador */}
                        <div className="col-span-2 flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {project.creator?.full_name?.substring(0, 2).toUpperCase() || 
                               project.creator?.email?.substring(0, 2).toUpperCase() || 'XX'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate">
                            {project.creator?.full_name || project.creator?.email || 'Sin asignar'}
                          </span>
                        </div>

                        {/* Proyecto */}
                        <div className="col-span-2 flex items-center gap-2">
                          <Folder className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {project.name}
                              {isSelected && (
                                <Badge variant="secondary" className="text-xs">
                                  Activo
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tipología */}
                        <div className="col-span-2 text-xs text-muted-foreground">
                          {project.project_data?.project_type?.name || 'Sin especificar'}
                        </div>

                        {/* Modalidad */}
                        <div className="col-span-2 text-xs text-muted-foreground">
                          {project.project_data?.modality?.name || 'Sin especificar'}
                        </div>

                        {/* Estado */}
                        <div className="col-span-1">
                          <Badge 
                            variant={
                              project.status === 'active' ? 'default' :
                              project.status === 'planning' ? 'secondary' :
                              project.status === 'completed' ? 'outline' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {project.status === 'planning' ? 'Planificación' :
                             project.status === 'active' ? 'Activo' :
                             project.status === 'on-hold' ? 'En pausa' : 'Completado'}
                          </Badge>
                        </div>

                        {/* Acciones */}
                        <div className="col-span-1 flex justify-start">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(project)
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteClick(project)
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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
              </>
            )}
          </>
        ) : (
          <CustomEmptyState
            icon={<Folder className="w-12 h-12" />}
            title={searchValue || filterByStatus !== 'all' ? "No se encontraron proyectos" : "No hay proyectos creados"}
            description={searchValue || filterByStatus !== 'all' 
              ? 'Prueba ajustando los filtros de búsqueda' 
              : 'Comienza creando tu primer proyecto para gestionar tu trabajo'
            }
            action={
              !searchValue && filterByStatus === 'all' && (
                <CustomRestricted feature="max_projects" current={filteredProjects?.length || 0}>
                  <Button onClick={() => setShowNewProjectModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Proyecto
                  </Button>
                </CustomRestricted>
              )
            }
          />
        )}

        {/* Dialog de confirmación para eliminar */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente el proyecto "{projectToDelete?.name}". 
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (projectToDelete && supabase) {
                    try {
                      // CORREGIDO: Solo eliminar el proyecto específico usando transaction
                      const { error } = await supabase.rpc('delete_project_safely', {
                        project_id: projectToDelete.id
                      })
                      
                      if (error) {
                        // Fallback: eliminar manualmente pero con más cuidado
                        console.log('RPC failed, using manual deletion:', error)
                        
                        // Primero eliminar project_data específico
                        const { error: projectDataError } = await supabase
                          .from('project_data')
                          .delete()
                          .eq('project_id', projectToDelete.id)
                        
                        if (projectDataError) {
                          console.error('Error deleting project_data:', projectDataError)
                        }
                        
                        // Luego eliminar el proyecto principal
                        const { error: projectError } = await supabase
                          .from('projects')
                          .delete()
                          .eq('id', projectToDelete.id)
                          .eq('organization_id', userData?.organization?.id) // SEGURIDAD EXTRA
                        
                        if (projectError) throw projectError
                      }
                      
                      // Invalidar cache para actualizar lista
                      queryClient.invalidateQueries({ queryKey: ['projects', userData?.organization?.id] })
                      queryClient.invalidateQueries({ queryKey: ['current-user'] })
                      
                      toast({
                        title: "Proyecto eliminado",
                        description: "El proyecto se ha eliminado correctamente"
                      })
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "No se pudo eliminar el proyecto",
                        variant: "destructive"
                      })
                    }
                  }
                  setDeleteDialogOpen(false)
                  setProjectToDelete(null)
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </Layout>

    {/* New Project Modal - Outside Layout */}
    <NewProjectModal
      open={showNewProjectModal}
      onClose={() => {
        setShowNewProjectModal(false)
        setEditingProject(null)
      }}
      editingProject={editingProject}
    />
    </>
  )
}