import { DollarSign, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { CustomRestricted } from '@/components/ui-custom/CustomRestricted'

interface IndirectListProps {
  onNewIndirectCost: () => void
}

export default function IndirectList({ onNewIndirectCost }: IndirectListProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <CustomRestricted reason="coming_soon">
        <EmptyState
          icon={<DollarSign className="w-8 h-8 text-muted-foreground" />}
          title="No hay costos indirectos"
          description="Comienza agregando tu primer costo indirecto para el análisis financiero"
          action={
            <Button onClick={onNewIndirectCost}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Costo Indirecto
            </Button>
          }
        />
      </CustomRestricted>
    </div>
  )
}