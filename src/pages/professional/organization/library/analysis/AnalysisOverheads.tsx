import { DollarSign } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted"

export default function AnalysisOverheads() {
  return (
    <div className="space-y-6">
      <div className="min-h-[400px] flex items-center justify-center">
        <PlanRestricted reason="coming_soon">
          <EmptyState
            icon={<DollarSign className="h-16 w-16" />}
            title="Análisis de Costos Indirectos"
            description="Funcionalidad coming soon"
          />
        </PlanRestricted>
      </div>
    </div>
  )
}