import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Palette } from 'lucide-react'
import { Layout } from '@/components/layout/desktop/Layout'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useNavigationStore } from '@/stores/navigationStore'

export default function DesignDashboard() {
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('design')
  }, [setSidebarContext])

  // ActionBar features
  const features = [
    {
      icon: <Palette className="h-4 w-4" />,
      title: "Dashboard Integral",
      description: "Panel de control con métricas principales del estado de diseño del proyecto."
    }
  ]

  return (
    <Layout wide>
      <div className="space-y-6">
        {/* ActionBar */}
        <ActionBarDesktop
          title="Resumen de Diseño"
          icon={<Palette className="h-5 w-5" />}
          features={features}
        />

        {/* Feature Introduction - Mobile only */}
        <FeatureIntroduction
          title="Resumen de Diseño"
          icon={<Palette className="h-6 w-6" />}
          features={features}
          className="md:hidden"
        />

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <div 
            className="rounded-lg p-8 text-center border"
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--card-border)',
              color: 'var(--card-text)'
            }}
          >
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
              <p className="text-sm text-muted-foreground">
                Estamos trabajando en nuevas funcionalidades para el dashboard de diseño. 
                Próximamente tendrás acceso a análisis avanzados, reportes detallados y herramientas de gestión adicionales.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}