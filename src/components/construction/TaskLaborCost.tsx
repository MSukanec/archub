import { useTaskMaterials } from '@/hooks/use-generated-tasks'

interface TaskLaborCostProps {
  task: any
}

export default function TaskLaborCost({ task }: TaskLaborCostProps) {
  // Use task.id if available (for GeneratedTask), otherwise fallback to task.task_id (for construction tasks)
  const taskId = task.id || task.task_id
  const { data: materials = [], isLoading } = useTaskMaterials(taskId)

  // Calcular total por unidad usando materials_view.avg_price (mismo cálculo que el popover)
  const totalPerUnit = materials.reduce((sum, material) => {
    const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
    const unitPrice = materialView?.avg_price || 0;
    const quantity = material.amount || 0;
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