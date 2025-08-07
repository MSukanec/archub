interface TaskLaborCostProps {
  task: any
}

export default function TaskLaborCost({ task }: TaskLaborCostProps) {
  // Por ahora mostraremos un placeholder hasta que se implemente el sistema de costos de mano de obra
  const laborCostPerUnit = 0; // TODO: Implementar cálculo real de costo de mano de obra

  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (laborCostPerUnit === 0) {
  }

  return (
      {formatCost(laborCostPerUnit)}
    </span>
  )
}