import { DollarSign } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'

export function EstimateBudget() {
  return (
    <div className="h-full">
      <EmptyState
        icon={<DollarSign className="h-12 w-12 text-muted-foreground" />}
        title="Presupuesto de Proyecto"
        description="Esta funcionalidad está en desarrollo"
        className="h-full"
      />
    </div>
  )
}