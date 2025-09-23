import { DollarSign } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { BudgetTree } from '@/components/ui-custom/tables-and-trees/BudgetTree'

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
  // Handle reorder tasks
  const handleReorder = (reorderedTasks: any[]) => {
    console.log('Reordered tasks:', reorderedTasks)
    // TODO: Implement actual reorder logic
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
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Presupuesto del Proyecto
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Organiza el orden de presentación de las tareas arrastrando los elementos
        </p>
      </div>

      {/* Budget Tree */}
      <BudgetTree 
        tasks={tasks}
        onReorder={handleReorder}
        onEditTask={onEditTask}
      />
    </div>
  )
}