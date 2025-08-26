import { useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { TableIcon, Plus } from 'lucide-react'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import TaskList from './TaskList'

export default function Tasks() {
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization')
  }, [setSidebarContext])

  // Header configuration
  const headerProps = {
    title: "Análisis de Tareas",
    icon: TableIcon,
    actionButton: {
      label: "Crear Tarea Personalizada",
      icon: Plus,
      onClick: () => openModal('parametric-task', {}),
      variant: "default" as const
    }
  }

  return (
    <Layout headerProps={headerProps} wide>
      <TaskList />
    </Layout>
  )
}