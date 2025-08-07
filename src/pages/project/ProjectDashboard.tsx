import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '@/components/layout/desktop/Layout'
import { useProjectStats } from '@/hooks/use-project-stats'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useNavigationStore } from '@/stores/navigationStore'

import ProjectHeroCard from '@/components/ui-custom/ProjectHeroCard'
import { EmptyState } from '@/components/ui-custom/EmptyState'

export default function ProjectDashboard() {
  const { data: userData } = useCurrentUser()
  const { setSidebarContext } = useNavigationStore()

  // Get project ID and organization ID from user preferences
  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.preferences?.last_organization_id

  // Fetch project stats
  const { data: stats, isLoading: statsLoading } = useProjectStats(projectId)

  // Set sidebar context
  useEffect(() => {
    setSidebarContext("project")
  }, [setSidebarContext])

  // Find current project
  const currentProject = stats?.project

  if (!currentProject && !statsLoading) {
    return (
      <Layout wide headerProps={{ title: "Resumen del Proyecto" }}>
        <div className="space-y-6">
          <EmptyState
            title="No hay proyecto seleccionado"
            description="Selecciona un proyecto desde el selector del header para ver el resumen del proyecto."
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout wide headerProps={{ title: "Resumen del Proyecto" }}>
      <div className="space-y-6">
        {/* Hero Card with Project Background - Only render if we have a project */}
        {currentProject && organizationId && (
          <ProjectHeroCard 
            project={currentProject}
            organizationId={organizationId}
          />
        )}

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
                Estamos trabajando en nuevas funcionalidades para el dashboard del proyecto. 
                Próximamente tendrás acceso a análisis avanzados, reportes detallados y herramientas de gestión adicionales.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}