import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building } from 'lucide-react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'

export default function ConstructionDashboard() {
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [setSidebarContext])

  return (
    <Layout 
      wide
      headerProps={{
        title: "Resumen",
        icon: Building
      }}
    >
      <div>
        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
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