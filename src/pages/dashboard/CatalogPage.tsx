import { useEffect, useState } from 'react'
import { Layout } from "@/layouts/dashboard/DashboardLayout"
import { LabLayout } from "@/layouts/lab/LabLayout"
import { useNavigationStore } from '@/stores/navigationStore'
import { useGlobalModalStore } from '@/components/modal'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TasksView } from '@/features/tasks'
import MaterialList from '@/pages/professional/catalog/MaterialList'
import LaborList from '@/pages/professional/catalog/LaborList'

const ANALYSIS_TABS = [
  { id: 'tasks', label: 'Tareas' },
  { id: 'labor', label: 'Mano de Obra' },
  { id: 'materials', label: 'Materiales' },
]

export default function CatalogPage() {
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const [activeTab, setActiveTab] = useState("tasks")

  const layoutPreference = userData?.preferences?.layout || 'experimental'
  const isLabLayout = layoutPreference === 'lab'

  useEffect(() => {
    setSidebarContext('organization')
  }, [setSidebarContext])

  const handleNewTask = () => {
    openModal('analysis-task', {})
  }

  const handleNewMaterial = () => {
    openModal('material-form', {})
  }

  const handleNewLabor = () => {
    console.log('Crear nuevo análisis de mano de obra')
  }

  const renderView = () => {
    switch (activeTab) {
      case 'tasks':
        return <TasksView />
      case 'labor':
        return <LaborList onNewLabor={handleNewLabor} />
      case 'materials':
        return <MaterialList />
      default:
        return <TasksView />
    }
  }

  const secondaryRightContent = (
    <div className="flex items-center gap-3">
      {activeTab === 'tasks' && (
        <Button
          size="sm"
          onClick={handleNewTask}
          data-testid="button-add-task"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Tarea Personalizada
        </Button>
      )}
      {activeTab === 'materials' && (
        <Button
          size="sm"
          onClick={handleNewMaterial}
          data-testid="button-add-material"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Material
        </Button>
      )}
      {activeTab === 'labor' && (
        <Button
          size="sm"
          onClick={handleNewLabor}
          data-testid="button-add-labor"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Análisis de Mano de Obra
        </Button>
      )}
    </div>
  )

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true}
        organizationId={organizationId}
        showMembers={true}
        tabs={ANALYSIS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        toolbarProps={{
          secondaryRightSlot: secondaryRightContent,
        }}
      >
        <div className="space-y-6">
          {renderView()}
        </div>
      </LabLayout>
    )
  }

  const getActionButton = () => {
    switch (activeTab) {
      case 'tasks':
        return {
          label: "Crear Tarea Personalizada",
          icon: Plus,
          onClick: handleNewTask,
          variant: "default" as const
        }
      case 'materials':
        return {
          label: "Nuevo Material",
          icon: Plus,
          onClick: handleNewMaterial,
          variant: "default" as const
        }
      case 'labor':
        return {
          label: "Nuevo Análisis de Mano de Obra",
          icon: Plus,
          onClick: handleNewLabor,
          variant: "default" as const
        }
      default:
        return undefined
    }
  }

  const headerProps = {
    title: "Catálogo Técnico",
    description: "Explora el catálogo técnico de tareas, materiales y mano de obra.",
    icon: Plus,
    organizationId,
    showMembers: true,
    actionButton: getActionButton(),
    tabs: ANALYSIS_TABS.map(tab => ({
      ...tab,
      isActive: activeTab === tab.id
    })),
    onTabChange: setActiveTab
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {renderView()}
      </div>
    </Layout>
  )
}
