import { useTaskLabor } from '@/hooks/use-task-labor'

interface TaskLaborCostProps {
  task: any
}

export default function TaskLaborCost({ task }: TaskLaborCostProps) {
  // Use task.id if available (for GeneratedTask), otherwise fallback to task.task_id (for construction tasks)
  const taskId = task.id || task.task_id
  const { data: labor = [], isLoading } = useTaskLabor(taskId)

  // Calcular total de mano de obra por unidad usando labor_view.avg_price
  const totalPerUnit = labor.reduce((sum, laborItem) => {
    const laborView = Array.isArray(laborItem.labor_view) ? laborItem.labor_view[0] : laborItem.labor_view;
    const unitPrice = laborView?.avg_price || 0;
    const quantity = laborItem.quantity || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">–</span>
  }

  if (totalPerUnit === 0) {
    return <span className="text-xs text-muted-foreground">–</span>
  }

  return (
    <span className="text-xs font-medium text-foreground">
      {formatCost(totalPerUnit)}
    </span>
  )
}