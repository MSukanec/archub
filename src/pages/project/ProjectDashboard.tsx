import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen } from 'lucide-react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useProjectStats, useProjectActivity } from '@/hooks/use-project-stats'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useNavigationStore } from '@/stores/navigationStore'
import { useMobile } from '@/hooks/use-mobile'
import { ProjectStatsCards } from '@/components/cards/ProjectStatsCards'
import { ProjectActivityChart } from '@/components/charts/ProjectActivityChart'
import ProjectHeroCard from '@/components/ui-custom/ProjectHeroCard'
import { EmptySpace } from '@/components/ui-custom/EmptySpace'
import { Button } from '@/components/ui/button'

export default function ProjectDashboard() {
  const { data: userData } = useCurrentUser()
  const { setSidebarContext } = useNavigationStore()
  const isMobile = useMobile()

  // Get project ID and organization ID from user preferences
  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.preferences?.last_organization_id

  // Fetch project stats and activity
  const { data: stats, isLoading: statsLoading, error: statsError } = useProjectStats(projectId)
  const { data: activityData, isLoading: activityLoading } = useProjectActivity(projectId)



  // Set sidebar context
  useEffect(() => {
    setSidebarContext("project")
  }, [setSidebarContext])

  const headerProps = {
    title: "Resumen del Proyecto",
    showSearch: false,
    showFilters: false,
  }

  // Find current project
  const currentProject = stats?.project

  if (!currentProject && !statsLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <EmptySpace
          title="No hay proyecto seleccionado"
          description="Selecciona un proyecto desde el selector del header para ver el resumen del proyecto."
          action={
            <Button onClick={() => window.location.href = "/organization/projects"}>
              Ver Proyectos
            </Button>
          }
        />
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Hero Card with Project Background - Only render if we have a project */}
        {currentProject && organizationId && (
          <ProjectHeroCard 
            project={currentProject}
            organizationId={organizationId}
          />
        )}

        {/* Statistics Cards */}
        <ProjectStatsCards stats={stats} isLoading={statsLoading} />

        {/* Activity Chart - Full Width */}
        <ProjectActivityChart data={activityData || []} isLoading={activityLoading} />
      </div>
    </Layout>
  )
}