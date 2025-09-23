import { useTaskMaterials } from '@/hooks/use-generated-tasks'
import { useTaskLabor } from '@/hooks/use-task-labor'
import { useEffect } from 'react'

interface TaskTotalSubtotalProps {
  task: any
  onSubtotalChange?: (taskId: string, subtotal: number) => void
}

export default function TaskTotalSubtotal({ task, onSubtotalChange }: TaskTotalSubtotalProps) {
  const { data: materials = [], isLoading: materialsLoading } = useTaskMaterials(task.task_id)
  const { data: labor = [], isLoading: laborLoading } = useTaskLabor(task.task_id)

  const isLoading = materialsLoading || laborLoading

  // Calcular subtotal de materiales
  const materialCostPerUnit = materials.reduce((sum, material) => {
    const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
    const unitPrice = materialView?.avg_price || 0;
    const quantity = material.amount || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  const taskQuantity = task.quantity || 0;
  const materialSubtotal = materialCostPerUnit * taskQuantity;

  // Calcular subtotal de mano de obra
  const laborCostPerUnit = labor.reduce((sum, laborItem) => {
    const laborView = laborItem.labor_view;
    const unitPrice = laborView?.avg_price || 0;
    const quantity = laborItem.quantity || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  const laborSubtotal = laborCostPerUnit * taskQuantity;

  // Total = materiales + mano de obra
  const totalSubtotal = materialSubtotal + laborSubtotal;

  // Emit subtotal changes via callback
  useEffect(() => {
    if (onSubtotalChange && task.id && !isLoading) {
      onSubtotalChange(task.id, totalSubtotal);
    }
  }, [onSubtotalChange, task.id, totalSubtotal, isLoading]);

  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">...</span>
  }

  if (totalSubtotal === 0) {
    return <span className="text-xs text-muted-foreground">–</span>
  }

  return (
    <span className="text-xs font-semibold text-foreground">
      {formatCost(totalSubtotal)}
    </span>
  )
}