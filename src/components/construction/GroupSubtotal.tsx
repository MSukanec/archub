import { useTaskMaterials } from '@/hooks/use-generated-tasks'

interface GroupSubtotalProps {
  tasks: any[]
}

// Hook para obtener materiales de múltiples tareas
function useGroupTaskMaterials(taskIds: string[]) {
  // Para cada task_id, obtener sus materiales usando el hook existente
  const results = taskIds.map(taskId => useTaskMaterials(taskId))
  
  // Combinar todos los resultados
  const isLoading = results.some(result => result.isLoading)
  const allMaterials = results.reduce((acc, result, index) => {
    const taskId = taskIds[index]
    if (result.data) {
      acc[taskId] = result.data
    }
    return acc
  }, {} as Record<string, any[]>)
  
  return { data: allMaterials, isLoading }
}

export default function GroupSubtotal({ tasks }: GroupSubtotalProps) {
  // Obtener todos los task_ids
  const taskIds = tasks.map(task => task.task_id).filter(Boolean)
  
  // Obtener materiales para todas las tareas del grupo
  const { data: allMaterials, isLoading } = useGroupTaskMaterials(taskIds)

  // Calcular subtotal total del grupo
  const totalSubtotal = tasks.reduce((sum, task) => {
    const materials = allMaterials[task.task_id] || []
    
    // Calcular costo por unidad para esta tarea (igual que TaskTotalSubtotal)
    const materialCostPerUnit = materials.reduce((matSum, material) => {
      const unitPrice = material.material_view?.computed_unit_price || 0;
      const quantity = material.amount || 0;
      return matSum + (quantity * unitPrice);
    }, 0);
    
    const taskQuantity = task.quantity || 0;
    const taskSubtotal = materialCostPerUnit * taskQuantity;
    
    return sum + taskSubtotal;
  }, 0);

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