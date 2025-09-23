import { DollarSign, Plus } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { BudgetTree } from '@/components/ui-custom/tables-and-trees/BudgetTree'
import { Button } from '@/components/ui/button'

interface EstimateBudgetProps {
  tasks?: any[]
  isLoading?: boolean
  onEditTask?: (task: any) => void
  onAddTask?: () => void
}

export function EstimateBudget({ 
  tasks = [], 
  isLoading = false, 
  onEditTask,
  onAddTask
}: EstimateBudgetProps) {
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
          action={
            onAddTask && (
              <Button onClick={onAddTask} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Tarea
              </Button>
            )
          }
          className="h-full"
        />
      </div>
    )
  }

  return (
    <BudgetTree 
      tasks={tasks}
      onReorder={handleReorder}
      onDuplicateTask={handleDuplicateTask}
      onDeleteTask={handleDeleteTask}
      onQuantityChange={handleQuantityChange}
    />
  )
}