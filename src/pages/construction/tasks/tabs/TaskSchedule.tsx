import { Calendar } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/EmptyState'

interface TaskScheduleProps {
  // Props que se definirán cuando se implemente la funcionalidad
}

export function TaskSchedule({}: TaskScheduleProps) {
  return (
    <div className="space-y-4">
      <EmptyState
        icon={<Calendar className="h-8 w-8" />}
        title="Cronograma de Tareas"
        description="Esta funcionalidad estará disponible próximamente."
      />
    </div>
  )
}