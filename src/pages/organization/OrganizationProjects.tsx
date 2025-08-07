import { Layout } from '@/components/layout/desktop/Layout'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { Folder, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import ModernProjectCard from '@/components/cards/ModernProjectCard'



export default function OrganizationProjects() {
  const { openModal } = useGlobalModalStore()
  const [isMobile, setIsMobile] = useState(false)
  
  const { data: userData, isLoading } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setSelectedProject } = useProjectContext()
  const [, navigate] = useLocation()

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Marcar proyecto activo y ponerlo primero
  const activeProjectId = userData?.preferences?.last_project_id
  let displayProjects = projects?.map(project => ({
    ...project,
    is_active: project.id === activeProjectId
  })) || []
  
  if (activeProjectId) {
    displayProjects = [
      ...displayProjects.filter(project => project.id === activeProjectId),
      ...displayProjects.filter(project => project.id !== activeProjectId)
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

  const handleEdit = (project: any) => {
    openModal('project', { editingProject: project, isEditing: true })
  }

  const handleDeleteClick = (project: any) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar proyecto',
      description: 'Esta acción eliminará permanentemente el proyecto y todos sus datos asociados.',
      itemName: project.name,
      destructiveActionText: 'Eliminar',
      onConfirm: () => deleteProjectMutation.mutate(project.id),
      isLoading: deleteProjectMutation.isPending
    });
  }

  const handleNavigateToBasicData = (project: any) => {
    selectProjectMutation.mutate(project.id)
    navigate('/project/basic-data')
  }

  // Mutación para eliminar proyecto
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('organization_id', organizationId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', organizationId] })
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