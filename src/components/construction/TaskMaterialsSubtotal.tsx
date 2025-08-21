import { useTaskMaterials } from '@/hooks/use-generated-tasks'

interface TaskMaterialsSubtotalProps {
  task: any
}

export default function TaskMaterialsSubtotal({ task }: TaskMaterialsSubtotalProps) {
  const { data: materials = [], isLoading } = useTaskMaterials(task.task_id)

  // Calcular subtotal: (costo por unidad) * cantidad de la tarea
  const costPerUnit = materials.reduce((sum, material) => {
    // material_view puede ser array o objeto
    const materialView = Array.isArray(material.material_view) ? material.material_view[0] : material.material_view;
    const unitPrice = materialView?.computed_unit_price || 0;
    const quantity = material.amount || 0;
    return sum + (quantity * unitPrice);
  }, 0)

  const taskQuantity = task.quantity || 0;
  const subtotal = costPerUnit * taskQuantity;

  // Formatear el subtotal
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

  if (subtotal === 0) {
    return <span className="text-xs text-muted-foreground">–</span>
  }

  return (
    <span className="text-xs font-medium text-foreground">
      {formatCost(subtotal)}
    </span>
  )
}