import { Users } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted"

export default function AnalysisLabor() {
  return (
    <div className="space-y-6">
      <div className="min-h-[400px] flex items-center justify-center">
        <PlanRestricted reason="coming_soon">
          <EmptyState
            icon={<Users className="h-16 w-16" />}
            title="Análisis de Mano de Obra"
            description="Funcionalidad coming soon"
          />
        </PlanRestricted>
      </div>
    </div>
  )
}