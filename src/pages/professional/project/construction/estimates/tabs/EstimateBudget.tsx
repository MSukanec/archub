import { DollarSign, Plus } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { BudgetTree } from '@/components/ui-custom/tables-and-trees/BudgetTree'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'

interface EstimateBudgetProps {
  tasks?: any[]
  isLoading?: boolean
  onEditTask?: (task: any) => void
}

export function EstimateBudget({ 
  tasks = [], 
  isLoading = false, 
  onEditTask 
}: EstimateBudgetProps) {
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const { selectedProjectId: projectId, currentOrganizationId: organizationId } = useProjectContext()

  // Handle add task
  const handleAddTask = () => {
    if (!projectId || !organizationId || !userData?.user?.id) {
      console.error('Missing required data for task creation')
      return
    }

    openModal('construction-task', {
      projectId,
      organizationId,
      userId: userData.user.id,
      isEditing: false
    })
  }
  // Handle reorder tasks
  const handleReorder = (reorderedTasks: any[]) => {
    console.log('Reordered tasks:', reorderedTasks)
    // TODO: Implement actual reorder logic
  }

  // Handle duplicate task
  const handleDuplicateTask = (task: any) => {
    console.log('Duplicating task:', task)
    // TODO: Implement actual duplicate logic
  }

  // Handle delete task
  const handleDeleteTask = (taskId: string) => {
    console.log('Deleting task:', taskId)
    // TODO: Implement actual delete logic
  }

  // Handle quantity change
  const handleQuantityChange = (taskId: string, quantity: number) => {
    console.log('Quantity change:', taskId, quantity)
    // TODO: Implement actual quantity change logic
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando presupuesto...</div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="h-full">
        <EmptyState
          icon={<DollarSign className="h-12 w-12 text-muted-foreground" />}
          title="Presupuesto de Proyecto"
          description="No hay tareas disponibles para el presupuesto"
          className="h-full"
          action={
            <Button onClick={handleAddTask} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Tarea
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Task button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Presupuesto de Proyecto</h2>
          <p className="text-sm text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'} en el presupuesto
          </p>
        </div>
        <Button onClick={handleAddTask}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Tarea
        </Button>
      </div>

      <BudgetTree 
        tasks={tasks}
        onReorder={handleReorder}
        onDuplicateTask={handleDuplicateTask}
        onDeleteTask={handleDeleteTask}
        onQuantityChange={handleQuantityChange}
        onAddTask={handleAddTask}
      />
    </div>
  )
}