interface TaskLaborSubtotalProps {
  task: any
}

export default function TaskLaborSubtotal({ task }: TaskLaborSubtotalProps) {
  // Por ahora mostraremos un placeholder hasta que se implemente el sistema de costos de mano de obra
  const laborCostPerUnit = 0; // TODO: Implementar cálculo real de costo de mano de obra
  const taskQuantity = task.quantity || 0;
  const subtotal = laborCostPerUnit * taskQuantity;

  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (subtotal === 0) {
  }

  return (
      {formatCost(subtotal)}
    </span>
  )
}