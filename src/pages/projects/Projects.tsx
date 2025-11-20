import { Layout } from '@/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { Folder, Plus } from 'lucide-react'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { PlanRestricted } from '@/components/ui-custom/security/PlanRestricted'
import ProjectActivesTab from './ProjectActivesTab'
import ProjectListTab from './ProjectListTab'
import ProjectSettingsTab from './ProjectSettingsTab'

export default function Projects() {
  const { openModal } = useGlobalModalStore()
  const [activeTab, setActiveTab] = useState('actives')
  
  const { data: userData, isLoading } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined)

  // Define actions based on active tab
  const getActions = () => {
    if (activeTab === 'settings') {
      return [
        <Button
          key="add-project-modality"
          onClick={() => openModal('projectModality', { isEditing: false })}
          className="h-8 px-3 text-xs"
          disabled={!organizationId}
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar Modalidad
        </Button>,
        <Button
          key="add-project-type"
          onClick={() => openModal('projectType', { isEditing: false })}
          className="h-8 px-3 text-xs"
          disabled={!organizationId}
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar Tipo
        </Button>
      ]
    }
    
    return [
      <PlanRestricted 
        key="create-project"
        feature="max_projects" 
        current={projects.length}
        functionName="Crear Proyecto"
      >
        <Button
          onClick={() => openModal('project', {})}
          className="h-8 px-3 text-xs"
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
