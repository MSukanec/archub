import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences'
import { Folder, Plus, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import ProjectItem from '@/components/cards/ProjectItem'
import ProjectHeroCard from '@/components/ui-custom/ProjectHeroCard'

export default function ProfileProjects() {
  const { openModal } = useGlobalModalStore()
  const [activeTab, setActiveTab] = useState('projects')
  
  const { data: userData, isLoading } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setSelectedProject } = useProjectContext()
  const [, navigate] = useLocation()

  // Mark active project using useUserOrganizationPreferences hook
  const { data: userOrgPrefs } = useUserOrganizationPreferences(organizationId);
  const activeProjectId = userOrgPrefs?.last_project_id
  
  const projectsWithActive = projects.map(project => ({
    ...project,
    is_active: project.id === activeProjectId
  }))
  
  // Put active project first
  const sortedProjects = activeProjectId ? [
    ...projectsWithActive.filter(project => project.id === activeProjectId),
    ...projectsWithActive.filter(project => project.id !== activeProjectId)
  ] : projectsWithActive

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
    navigate('/project/basic-data')
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

  const headerProps = {
    title: "Gestión de Proyectos",
    breadcrumb: [
      { name: "Perfil", href: "/profile/data" },
      { name: "Gestión de Proyectos", href: "/profile/projects" }
    ],
    tabs: [
      {
        id: 'projects',
        label: 'Proyectos',
        icon: Folder,
        isActive: activeTab === 'projects',
        onClick: () => setActiveTab('projects')
      },
      {
        id: 'basic-data',
        label: 'Datos Básicos',
        icon: Settings,
        isActive: activeTab === 'basic-data',
        onClick: () => setActiveTab('basic-data')
      }
    ],
    actionButton: activeTab === 'projects' ? {
      label: "Nuevo Proyecto",
      icon: Plus,
      onClick: () => openModal('project', {})
    } : undefined
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
            {/* ProjectHeroCard - Show for active project */}
            {activeProjectId && (
              <ProjectHeroCard 
                project={sortedProjects.find(p => p.id === activeProjectId)}
                organizationId={organizationId}
              />
            )}

            {/* Projects List */}
            {sortedProjects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {sortedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onSelect={(project) => handleSelectProject(project.id)}
                    onNavigateToBasicData={handleNavigateToBasicData}
                    isActiveProject={project.id === userOrgPrefs?.last_project_id}
                  />
                ))}
              </div>
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

        {/* Tab: Datos Básicos */}
        {activeTab === 'basic-data' && (
          <EmptyState
            icon={<Settings className="w-12 h-12" />}
            title="Datos Básicos"
            description="Esta sección estará disponible próximamente para gestionar la configuración básica del perfil y organización"
          />
        )}
      </div>
    </Layout>
  )
}