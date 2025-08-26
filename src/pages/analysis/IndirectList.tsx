import { DollarSign } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { CustomRestricted } from '@/components/ui-custom/CustomRestricted'

export default function IndirectList() {
  return (
    <div className="space-y-6">
      <div className="min-h-[400px] flex items-center justify-center">
        <CustomRestricted reason="coming_soon">
          <EmptyState
            icon={<DollarSign className="h-16 w-16" />}
            title="Análisis de Costos Indirectos"
            description="Funcionalidad coming soon"
          />
        </CustomRestricted>
      </div>
    </div>
  )
}