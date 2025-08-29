import { useEffect } from 'react'
import { Users } from 'lucide-react'
import { Layout } from '@/components/layout/desktop/Layout'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted"
import { useNavigationStore } from '@/stores/navigationStore'

export default function Labor() {
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('library')
  }, [setSidebarContext])

  return (
    <Layout
      headerProps={{
        title: "Mano de Obra",
        icon: Users,
        description: "Análisis de costos de mano de obra",
      }}
    >
      <div className="min-h-[400px] flex items-center justify-center">
        <PlanRestricted reason="coming_soon">
          <EmptyState
            icon={<Users className="h-16 w-16" />}
            title="Mano de Obra"
            description="Funcionalidad coming soon"
          />
        </PlanRestricted>
      </div>
    </Layout>
  )
}