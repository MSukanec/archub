import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { BarChart3, CheckSquare, Package2, Users, Plus } from 'lucide-react'
import TaskList from './TaskList'
import MaterialList from './MaterialList'
import LaborList from './LaborList'

export default function Analysis() {
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
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
    openModal('task', {})
  }

  const handleNewMaterial = () => {
    openModal('custom-product')
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
          label: "Nuevo Producto Personalizado", 
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
    actionButton: getActionButton(),
    tabs: [
      {
        id: 'tasks',
        label: 'Tareas',
        isActive: activeTab === 'tasks'
      },
      {
        id: 'materials',
        label: 'Materiales',
        isActive: activeTab === 'materials'
      },
      {
        id: 'labor',
        label: 'Mano de Obra',
        isActive: activeTab === 'labor'
      }
    ],
    onTabChange: handleTabChange
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {activeTab === 'tasks' && <TaskList />}
        {activeTab === 'materials' && <MaterialList />}
        {activeTab === 'labor' && <LaborList onNewLabor={handleNewLabor} />}
      </div>
    </Layout>
  )
}