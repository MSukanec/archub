import { useEffect } from 'react'
import { DollarSign } from 'lucide-react'
import { Layout } from '@/components/layout/desktop/Layout'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted"
import { useNavigationStore } from '@/stores/navigationStore'

export default function AnalysisOverheads() {
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('library')
  }, [setSidebarContext])

  return (
    <Layout
      headerProps={{
        title: "Análisis de Gastos Generales",
        icon: DollarSign,
        description: "Análisis de costos indirectos y gastos generales",
      }}
    >
      <div className="min-h-[400px] flex items-center justify-center">
        <PlanRestricted reason="coming_soon">
          <EmptyState
            icon={<DollarSign className="h-16 w-16" />}
            title="Análisis de Gastos Generales"
            description="Funcionalidad coming soon"
          />
        </PlanRestricted>
      </div>
    </Layout>
  )
}