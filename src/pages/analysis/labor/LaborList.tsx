import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted"

interface LaborListProps {
  onNewLabor: () => void
}

export default function LaborList({ onNewLabor }: LaborListProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <PlanRestricted reason="coming_soon">
        <EmptyState
          icon={<Users className="w-8 h-8 text-muted-foreground" />}
          title="No hay análisis de mano de obra"
          description="Comienza agregando tu primer análisis de mano de obra para el proyecto"
          action={
            <Button onClick={onNewLabor}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Análisis de Mano de Obra
            </Button>
          }
        />
      </PlanRestricted>
    </div>
  )
}