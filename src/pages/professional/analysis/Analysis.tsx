import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useCurrentUser } from '@/hooks/use-current-user'
import { BarChart3, CheckSquare, Package2, Users, Plus } from 'lucide-react'
import TaskList from './TaskList'
import MaterialList from './material-costs/MaterialList'
import LaborList from './LaborList'

export default function Analysis() {
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const [activeTab, setActiveTab] = useState("tasks")

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization')
  }, [setSidebarContext])

  // Tab change handler
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }

  // Tab handlers
  const handleNewTask = () => {
    openModal('analysis-task', {})
  }

  const handleNewMaterial = () => {
    openModal('material-form', {})
  }

  const handleNewLabor = () => {
    // TODO: Implementar modal para nuevo análisis de mano de obra
    console.log('Crear nuevo análisis de mano de obra')
  }

  // Get action button based on active tab
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

  // Header configuration with dynamic tabs
  const headerProps = {
    title: "Análisis de Costos",
    icon: BarChart3,
    organizationId,
    showMembers: true,
    actionButton: getActionButton(),
    tabs: [
      {
        id: 'tasks',
        label: 'Tareas',
        isActive: activeTab === 'tasks'
      },
      {
        id: 'labor',
        label: 'Mano de Obra',
        isActive: activeTab === 'labor'
      },
      {
        id: 'materials',
        label: 'Materiales',
        isActive: activeTab === 'materials'
      }
    ],
    onTabChange: handleTabChange
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {activeTab === 'tasks' && <TaskList />}
        {activeTab === 'labor' && <LaborList onNewLabor={handleNewLabor} />}
        {activeTab === 'materials' && <MaterialList />}
      </div>
    </Layout>
  )
}