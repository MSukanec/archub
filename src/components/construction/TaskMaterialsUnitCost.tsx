import { useTaskMaterials } from '@/hooks/use-generated-tasks'

interface TaskMaterialsUnitCostProps {
  task: any
}

export default function TaskMaterialsUnitCost({ task }: TaskMaterialsUnitCostProps) {
  const { data: materials = [], isLoading } = useTaskMaterials(task.task_id)

  // Calcular SOLO el costo por unidad (sin multiplicar por cantidad)
  const costPerUnit = materials.reduce((sum, material) => {
    const unitPrice = material.material_view?.computed_unit_price || 0;
    const quantity = material.amount || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  // Formatear el costo
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

  if (costPerUnit === 0) {
    return <span className="text-xs text-muted-foreground">–</span>
  }

  return (
    <span className="text-xs font-medium text-foreground">
      {formatCost(costPerUnit)}
    </span>
  )
}