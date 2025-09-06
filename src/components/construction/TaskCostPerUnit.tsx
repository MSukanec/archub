import { useTaskMaterials } from '@/hooks/use-generated-tasks'
import { useTaskLabor } from '@/hooks/use-task-labor'

interface TaskCostPerUnitProps {
  task: any
}

export default function TaskCostPerUnit({ task }: TaskCostPerUnitProps) {
  // Use task.id if available (for GeneratedTask), otherwise fallback to task.task_id (for construction tasks)
  const taskId = task.id || task.task_id
  const { data: materials = [], isLoading: materialsLoading } = useTaskMaterials(taskId)
  const { data: labor = [], isLoading: laborLoading } = useTaskLabor(taskId)

  const isLoading = materialsLoading || laborLoading

  // Calcular total de materiales por unidad
  const materialsTotalPerUnit = materials.reduce((sum, material) => {
    const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
    const unitPrice = materialView?.avg_price || 0;
    const quantity = material.amount || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  // Calcular total de mano de obra por unidad
  const laborTotalPerUnit = labor.reduce((sum, laborItem) => {
    const laborView = Array.isArray(laborItem.labor_view) ? laborItem.labor_view[0] : laborItem.labor_view;
    const unitPrice = laborView?.avg_price || 0;
    const quantity = laborItem.quantity || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  const totalPerUnit = materialsTotalPerUnit + laborTotalPerUnit

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