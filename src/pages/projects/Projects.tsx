import { Layout } from "@/layouts/dashboard/DashboardLayout"
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects, useProjectsCount } from '@/features/projects'
import { Folder, Plus } from 'lucide-react'
import { useGlobalModalStore } from '@/components/modal'
import { PlanRestricted } from '@/features/users'
import { FEATURE_IMAGES } from '@/constants/images'
import ProjectActivesTab from './ProjectActivesTab'
import ProjectListTab from './ProjectListTab'
import ProjectSettingsTab from './ProjectSettingsTab'

export default function Projects() {
  const { openModal } = useGlobalModalStore()
  const [activeTab, setActiveTab] = useState('actives')
  
  const { data: userData, isLoading } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined)
  
  // Get total projects count for plan restrictions (counts ALL projects, not just active)
  const { data: projectsCount = 0 } = useProjectsCount(organizationId || undefined)

  // Define actions based on active tab
  const getActions = () => {
    // No mostrar botones en el header cuando está en settings
    if (activeTab === 'settings') {
      return []
    }
    
    return [
      <PlanRestricted 
        key="create-project"
        feature="max_projects" 
        current={projectsCount}
        functionName="Crear Proyecto"
        useUpgradeModal={true}
        modalImage={FEATURE_IMAGES.PROJECTS}
        modalTitle="Alcanzaste el límite de proyectos"
        modalDescription="Has llegado al máximo de proyectos permitidos en tu plan actual. Actualiza a un plan superior para crear proyectos ilimitados y gestionar tu negocio sin restricciones."
      >
        <Button
          onClick={() => openModal('project', {})}
          className="h-8 px-3 text-xs"
          data-testid="button-new-project"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Proyecto
        </Button>
      </PlanRestricted>
    ]
  }

  const headerProps = {
    title: "Gestión de Proyectos",
    description: "Administra todos los proyectos de tu organización desde un solo lugar",
    icon: Folder,
    organizationId,
    showMembers: true,
    breadcrumb: [
      { name: "Perfil", href: "/profile/data" },
      { name: "Gestión de Proyectos", href: "/organization/projects" }
    ],
    tabs: [
      {
        id: 'actives',
        label: 'Proyectos Activos',
        isActive: activeTab === 'actives'
      },
      {
        id: 'list',
        label: 'Lista de Proyectos',
        isActive: activeTab === 'list'
      },
      {
        id: 'settings',
        label: 'Ajustes',
        isActive: activeTab === 'settings'
      },
    ],
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actions: getActions()
  }

  if (isLoading || projectsLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="p-8 text-center text-muted-foreground">
          Cargando proyectos...
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {activeTab === 'actives' && <ProjectActivesTab />}
        {activeTab === 'list' && <ProjectListTab />}
        {activeTab === 'settings' && <ProjectSettingsTab />}
      </div>
    </Layout>
  )
}
