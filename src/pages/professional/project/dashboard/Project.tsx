import { useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { Info } from 'lucide-react'
import ProjectDashboard from './ProjectDashboard'

export default function Project() {
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('project')
  }, [setSidebarContext])

  // Header configuration
  const headerProps = {
    title: "Resumen de Proyecto",
    icon: Info
  }

  return (
    <Layout headerProps={headerProps} wide>
      <ProjectDashboard />
    </Layout>
  )
}