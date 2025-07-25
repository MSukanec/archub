import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CustomRestricted } from '@/components/ui-custom/CustomRestricted'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { Folder, Crown, Plus, Calendar, MoreHorizontal, Edit, Trash2, Home, Search, Filter, X, Users, Settings, BarChart3, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigationStore } from '@/stores/navigationStore'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import ModernProjectCard from '@/components/cards/ModernProjectCard'
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'


export default function OrganizationProjects() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('date_recent')
  const [filterByStatus, setFilterByStatus] = useState('all')



  const { openModal } = useGlobalModalStore()
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
          onClick: () => openModal('project', {})
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

  // Mark active project and put it first
  const activeProjectId = userData?.preferences?.last_project_id
  filteredProjects = filteredProjects.map(project => ({
    ...project,
    is_active: project.id === activeProjectId
  }))
  
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
      
      return projectId;
    },
    onSuccess: (projectId) => {
      // Force immediate refresh of user data
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.refetchQueries({ queryKey: ['current-user'] });
      
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
    // Only update header, no navigation
  }

  // Mutation to go to General mode (no project selected)
  const selectGeneralMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: null })
        .eq('user_id', userData?.user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      // Force immediate refresh of user data  
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.refetchQueries({ queryKey: ['current-user'] });
      
      toast({
        title: "Modo General activado",
        description: "Ahora puedes ver información de toda la organización"
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar al modo General",
        variant: "destructive"
      })
    }
  })

  const handleSelectGeneral = () => {
    selectGeneralMutation.mutate()
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

  // Function to navigate to basic data after setting project as active
  const handleNavigateToBasicData = (project: any) => {
    selectProjectMutation.mutate(project.id)
    // Navigate to basic data page
    navigate('/project/basic-data')
  }

  // Mutación para eliminar proyecto
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      try {
        // CORREGIDO: Solo eliminar el proyecto específico usando transaction
        const { error } = await supabase.rpc('delete_project_safely', {
          project_id: projectId
        })
        
        if (error) {
          // Fallback: eliminar manualmente pero con más cuidado
          console.log('RPC failed, using manual deletion:', error)
          
          // Primero eliminar project_data específico
          const { error: projectDataError } = await supabase
            .from('project_data')
            .delete()
            .eq('project_id', projectId)
            .eq('organization_id', userData?.organization?.id) // SEGURIDAD EXTRA
          
          if (projectDataError) {
            console.error('Error deleting project_data:', projectDataError)
          }
          
          // Luego eliminar el proyecto principal
          const { error: projectError } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)
            .eq('organization_id', userData?.organization?.id) // SEGURIDAD EXTRA
          
          if (projectError) throw projectError
        }
      } catch (error: any) {
        throw error
      }
    },
    onSuccess: () => {
      // Invalidar cache para actualizar lista
      queryClient.invalidateQueries({ queryKey: ['projects', userData?.organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto se ha eliminado correctamente"
      })
      

    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el proyecto",
        variant: "destructive"
      })
    }
  })

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
        onClick={() => openModal('project', {})}
      >
        <Plus className="w-4 h-4 mr-2" />
        Nuevo Proyecto
      </Button>
    </CustomRestricted>
  ]

  const headerProps = {
    icon: Folder,
    title: "Proyectos",
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

  // Define feature introduction content
  const projectFeatures = [
    {
      icon: <Plus className="w-5 h-5" />,
      title: "Crear Proyecto Nuevo",
      description: "Haz clic en 'Nuevo Proyecto' para crear un proyecto para tu organización. Completa la información básica como nombre, tipología, modalidad y estado. Una vez creado, puedes seleccionarlo como 'ACTIVO' para trabajar en él desde todas las secciones de la aplicación (Diseño, Obra, Finanzas, etc.)."
    },
    {
      icon: <Crown className="w-5 h-5" />,
      title: "Cambio de Proyecto Activo",
      description: "No necesitas venir a esta página para cambiar de proyecto. Desde el selector del header (parte superior) puedes cambiar entre proyectos activos de forma rápida. También tienes la opción de seleccionar 'Todos los Proyectos' para ver información general de toda tu organización en lugar de datos específicos de un proyecto."
    }
  ]

  return (
    <>
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* ActionBar Desktop */}
        <ActionBarDesktop
          title="Gestión de Proyectos"
          icon={<Folder className="w-5 h-5" />}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          customFilters={customFilters}
          primaryAction={{
            label: "Nuevo Proyecto",
            onClick: () => openModal('project', {}),
            icon: <Plus className="w-5 h-5" />
          }}
          showProjectSelector={false}
          features={[
            {
              icon: <Plus className="w-5 h-5" />,
              title: "Crear y Gestionar Proyectos",
              description: "Crea nuevos proyectos para tu organización definiendo nombre, tipología, modalidad y estado. Cada proyecto puede ser seleccionado como 'ACTIVO' para trabajar en él desde todas las secciones de la aplicación."
            },
            {
              icon: <Settings className="w-5 h-5" />,
              title: "Cambio de Proyecto Activo",
              description: "Cambia entre proyectos activos desde el selector del header de forma rápida. También puedes seleccionar 'Todos los Proyectos' para ver información general de toda tu organización."
            },
            {
              icon: <BarChart3 className="w-5 h-5" />,
              title: "Estados y Filtros",
              description: "Filtra proyectos por estado (Activo, Planificación, Completado, En Pausa) y ordena por nombre o fecha de creación para una mejor organización."
            },
            {
              icon: <FileText className="w-5 h-5" />,
              title: "Gestión Completa",
              description: "Cada proyecto incluye módulos completos de Diseño, Construcción y Finanzas. Edita información básica, elimina proyectos y navega directamente a los datos del proyecto seleccionado."
            }
          ]}
        />

        {/* Feature Introduction - Solo móvil */}
        <FeatureIntroduction
          title="Proyectos"
          icon={<Folder className="w-5 h-5" />}
          features={projectFeatures}
          className="md:hidden"
        />

        {/* General Mode Card */}
        <Card className="w-full overflow-hidden hover:shadow-lg transition-all duration-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12 border border-black shadow-lg">
                  <AvatarFallback className="text-black font-bold text-lg bg-gray-200">
                    G
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">General</h3>
                  <p className="text-sm text-muted-foreground">Ver información de toda la organización</p>
                </div>
              </div>
              
              {!userData?.preferences?.last_project_id ? (
                <Button 
                  size="sm"
                  className="text-xs font-medium px-3 py-1 h-7 text-white"
                  style={{ backgroundColor: 'var(--accent)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Already in General mode, do nothing
                  }}
                >
                  ACTIVO
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium px-3 py-1 h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectGeneral();
                  }}
                >
                  Seleccionar activo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mostrar contenido solo si hay proyectos */}
        {filteredProjects.length > 0 ? (
          <>
            {/* Vista móvil */}
            {isMobile ? (
              <div className="grid grid-cols-1 gap-4 px-4">
                {filteredProjects.map((project) => (
                  <ModernProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onSelect={(project) => handleSelectProject(project.id)}
                    onNavigateToBasicData={handleNavigateToBasicData}
                    isActiveProject={project.id === userData?.preferences?.last_project_id}
                  />
                ))}
              </div>
            ) : (
              /* Desktop Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                  <ModernProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onSelect={(project) => handleSelectProject(project.id)}
                    onNavigateToBasicData={handleNavigateToBasicData}
                    isActiveProject={project.id === userData?.preferences?.last_project_id}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={<Folder className="w-12 h-12" />}
            title={searchValue || filterByStatus !== 'all' ? "No se encontraron proyectos" : "No hay proyectos creados"}
            description={searchValue || filterByStatus !== 'all' 
              ? 'Prueba ajustando los filtros de búsqueda' 
              : 'Comienza creando tu primer proyecto para gestionar tu trabajo'
            }
          />
        )}



      </div>
    </Layout>




  </>
  )
}