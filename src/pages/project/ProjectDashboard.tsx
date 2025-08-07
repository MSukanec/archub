import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, BarChart3, TrendingUp, Users, Calendar, Settings, Plus } from 'lucide-react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useProjectStats } from '@/hooks/use-project-stats'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useNavigationStore } from '@/stores/navigationStore'
import { useMobile } from '@/hooks/use-mobile'

import ProjectHeroCard from '@/components/ui-custom/ProjectHeroCard'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Button } from '@/components/ui/button'

export default function ProjectDashboard() {
  const { data: userData } = useCurrentUser()
  const { setSidebarContext } = useNavigationStore()
  const isMobile = useMobile()

  // Get project ID and organization ID from user preferences
  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.preferences?.last_organization_id

  // Fetch project stats
  const { data: stats, isLoading: statsLoading } = useProjectStats(projectId)



  // Set sidebar context
  useEffect(() => {
    setSidebarContext("project")
  }, [setSidebarContext])

  // ActionBar features
  const features = [
    {
      title: "Estadísticas Integrales del Proyecto",
      description: "Visualiza métricas clave incluyendo progreso de construcción, estado financiero, documentos y actividad del equipo en tiempo real."
    },
    {
      title: "Análisis de Tendencias y Progreso",
      description: "Monitorea el avance temporal del proyecto con gráficos de actividad y análisis de productividad por período."
    },
    {
      title: "Gestión Centralizada del Equipo",
      description: "Controla la participación de miembros, clientes y roles dentro del proyecto desde una vista unificada."
    },
    {
      title: "Panel de Control Ejecutivo",
      description: "Accede rápidamente a todas las secciones del proyecto y toma decisiones informadas basadas en datos actualizados."
    }
  ]

  // Find current project
  const currentProject = stats?.project

  if (!currentProject && !statsLoading) {
    return (
      <Layout wide headerProps={{ title: "Resumen del Proyecto" }}>
          <EmptyState
            description="Selecciona un proyecto desde el selector del header para ver el resumen del proyecto."
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout wide headerProps={{ title: "Resumen del Proyecto" }}>
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
        >
          <div 
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--card-border)',
              color: 'var(--card-text)'
            }}
          >
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