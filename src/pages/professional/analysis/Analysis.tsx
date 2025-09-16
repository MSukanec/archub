import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { BarChart3, CheckSquare, Package2, Users, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TaskList from './TaskList'
import MaterialList from './MaterialList'
import LaborList from './LaborList'

export default function Analysis() {
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
  const [activeTab, setActiveTab] = useState("tasks")

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('recursos')
  }, [setSidebarContext])

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

  // Header configuration
  const headerProps = {
    title: "Análisis de Costos",
    icon: BarChart3,
    actionButton: getActionButton()
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tareas
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Package2 className="h-4 w-4" />
              Materiales
            </TabsTrigger>
            <TabsTrigger value="labor" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mano de Obra
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <TaskList />
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <MaterialList />
          </TabsContent>

          <TabsContent value="labor" className="mt-6">
            <LaborList onNewLabor={handleNewLabor} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}