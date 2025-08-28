import { Users } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { CustomRestricted } from '@/components/ui-custom/security/CustomRestricted'

export default function AnalysisLabor() {
  return (
    <div className="space-y-6">
      <div className="min-h-[400px] flex items-center justify-center">
        <CustomRestricted reason="coming_soon">
          <EmptyState
            icon={<Users className="h-16 w-16" />}
            title="Análisis de Mano de Obra"
            description="Funcionalidad coming soon"
          />
        </CustomRestricted>
      </div>
    </div>
  )
}