import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { CustomRestricted } from '@/components/ui-custom/CustomRestricted'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { Folder, Plus, Calendar, MoreHorizontal, Edit, Trash2, Home, Search, Filter, X, Users, Settings, BarChart3, FileText, SortAsc } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigationStore } from '@/stores/navigationStore'
import { useProjectContext } from '@/stores/projectContext'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import ModernProjectCard from '@/components/cards/ModernProjectCard'
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext'



export default function OrganizationProjects() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('date_recent')
  const [filterByStatus, setFilterByStatus] = useState('all')
  
  const { openModal } = useGlobalModalStore()
  const [isMobile, setIsMobile] = useState(false)
  
  const { data: userData, isLoading } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setSidebarContext } = useNavigationStore()
  const { setSelectedProject } = useProjectContext()
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

  // Limpiar acciones del action bar al salir de la página
  useEffect(() => {
    return () => {
      setActions({})
    }
  }, [setActions])

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
      if (!supabase || !userData?.user?.id || !organizationId) {
        throw new Error('Required data not available');
      }
      
      // Usar la nueva tabla user_organization_preferences
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
      // Update project context immediately
      setSelectedProject(projectId, organizationId);
      
      // Invalidar cache de user organization preferences
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
    // Only update header, no navigation
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





  const headerProps = {
    title: "Proyectos",
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
    <>
    <Layout headerProps={headerProps}>
      <div className="space-y-6">






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