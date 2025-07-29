import { Layout } from '@/components/layout/desktop/Layout'
import { Building } from 'lucide-react'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useNavigationStore } from '@/stores/navigationStore'
import { useEffect } from 'react'

export default function ConstructionDashboard() {
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [])

  return (
    <Layout>
      <div className="space-y-6">
        {/* FeatureIntroduction - Mobile Only */}
        <FeatureIntroduction
          title="Resumen de Construcción"
          icon={<Building className="w-5 h-5" />}
          className="md:hidden"
          features={[
            {
              icon: <Building className="w-5 h-5" />,
              title: "Dashboard Integral",
              description: "Panel de control con métricas principales del estado de construcción del proyecto."
            }
          ]}
        />

        {/* Action Bar Desktop */}
        <ActionBarDesktop
          title="Resumen de Construcción"
          icon={<Building className="w-6 h-6" />}
          features={[
            {
              icon: <Building className="w-4 h-4" />,
              title: "Dashboard Integral",
              description: "Panel de control con métricas principales del estado de construcción del proyecto."
            }
          ]}
        />

        {/* Mensaje de Próximamente */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building className="h-16 w-16 text-muted-foreground/50 mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Dashboard en Desarrollo
          </h2>
          <p className="text-lg text-muted-foreground mb-2 max-w-md">
            Estamos trabajando en el panel de resumen de construcción con métricas avanzadas y visualizaciones en tiempo real.
          </p>
          <p className="text-sm text-muted-foreground">
            Próximamente disponible con gráficos de progreso, estados de tareas y análisis de productividad.
          </p>
        </div>
      </div>
    </Layout>
  )
}