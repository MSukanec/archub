import { useTaskMaterials } from '@/hooks/use-generated-tasks'

interface TaskTotalSubtotalProps {
  task: any
}

export default function TaskTotalSubtotal({ task }: TaskTotalSubtotalProps) {
  const { data: materials = [], isLoading } = useTaskMaterials(task.task_id)

  // Calcular subtotal de materiales
  const materialCostPerUnit = materials.reduce((sum, material) => {
    const unitPrice = material.material_view?.computed_unit_price || 0;
    const quantity = material.amount || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  const taskQuantity = task.quantity || 0;
  const materialSubtotal = materialCostPerUnit * taskQuantity;

  // Calcular subtotal de mano de obra (por ahora 0)
  const laborSubtotal = 0; // TODO: Implementar cálculo real de mano de obra

  // Total = materiales + mano de obra
  const totalSubtotal = materialSubtotal + laborSubtotal;

  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
  }

  if (totalSubtotal === 0) {
  }

  return (
      {formatCost(totalSubtotal)}
    </span>
  )
}