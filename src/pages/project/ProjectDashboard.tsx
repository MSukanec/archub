import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, BarChart3, TrendingUp, Users, Calendar } from 'lucide-react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useProjectStats } from '@/hooks/use-project-stats'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useNavigationStore } from '@/stores/navigationStore'
import { useMobile } from '@/hooks/use-mobile'

import ProjectHeroCard from '@/components/ui-custom/ProjectHeroCard'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Button } from '@/components/ui/button'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'

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
      icon: <BarChart3 className="h-4 w-4" />,
      title: "Estadísticas Integrales del Proyecto",
      description: "Visualiza métricas clave incluyendo progreso de construcción, estado financiero, documentos y actividad del equipo en tiempo real."
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      title: "Análisis de Tendencias y Progreso",
      description: "Monitorea el avance temporal del proyecto con gráficos de actividad y análisis de productividad por período."
    },
    {
      icon: <Users className="h-4 w-4" />,
      title: "Gestión Centralizada del Equipo",
      description: "Controla la participación de miembros, clientes y roles dentro del proyecto desde una vista unificada."
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      title: "Panel de Control Ejecutivo",
      description: "Accede rápidamente a todas las secciones del proyecto y toma decisiones informadas basadas en datos actualizados."
    }
  ]

  // Find current project
  const currentProject = stats?.project

  if (!currentProject && !statsLoading) {
    return (
      <Layout wide>
        <div className="space-y-6">
          <ActionBarDesktop
            title="Resumen del Proyecto"
            icon={<FolderOpen className="h-5 w-5" />}
            features={features}
          />
          <EmptyState
            title="No hay proyecto seleccionado"
            description="Selecciona un proyecto desde el selector del header para ver el resumen del proyecto."
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout wide>
      <div className="space-y-6">
        {/* ActionBar */}
        <ActionBarDesktop
          title="Resumen del Proyecto"
          icon={<FolderOpen className="h-5 w-5" />}
          features={features}
        />

        {/* Feature Introduction - Mobile only */}
        <FeatureIntroduction
          title="Resumen del Proyecto"
          icon={<FolderOpen className="h-6 w-6" />}
          features={features}
          className="md:hidden"
        />

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