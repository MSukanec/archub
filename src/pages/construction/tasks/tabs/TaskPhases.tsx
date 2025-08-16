import { Settings } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { PhaseOrderManager } from '@/components/construction/PhaseOrderManager'

interface TaskPhasesProps {
  projectPhases: any[]
  onReorder: (reorderedPhases: any[]) => void
  onEdit: (phase: any) => void
  onDelete: (phaseId: string) => void
  isUpdating: boolean
}

export function TaskPhases({ 
  projectPhases, 
  onReorder, 
  onEdit, 
  onDelete, 
  isUpdating 
}: TaskPhasesProps) {
  if (projectPhases.length === 0) {
    return (
      <EmptyState
        icon={<Settings className="h-8 w-8" />}
        title="No hay fases en el proyecto"
        description="Comienza creando la primera fase del proyecto para organizar las tareas por etapas."
      />
    )
  }

  return (
    <PhaseOrderManager
      phases={projectPhases}
      onReorder={onReorder}
      onEdit={onEdit}
      onDelete={onDelete}
      isUpdating={isUpdating}
    />
  )
}