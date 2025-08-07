import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building } from 'lucide-react'
import { Layout } from '@/components/layout/desktop/Layout'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useNavigationStore } from '@/stores/navigationStore'

export default function ConstructionDashboard() {
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [setSidebarContext])

  // ActionBar features
  const features = [
    {
      title: "Dashboard Integral",
      description: "Panel de control con métricas principales del estado de construcción del proyecto."
    }
  ]

  return (
    <Layout wide>
        {/* ActionBar */}
        <ActionBarDesktop
          features={features}
        />

        {/* Feature Introduction - Mobile only */}
        <FeatureIntroduction
          features={features}
        />

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div 
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--card-border)',
              color: 'var(--card-text)'
            }}
          >
                Estamos trabajando en nuevas funcionalidades para el dashboard de construcción. 
                Próximamente tendrás acceso a análisis avanzados, reportes detallados y herramientas de gestión adicionales.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}