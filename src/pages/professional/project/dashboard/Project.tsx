import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { Info } from 'lucide-react'
import ProjectDashboard from './ProjectDashboard'
import ProjectBasicDataTab from './ProjectBasicDataTab'

export default function Project() {
  const { setSidebarContext } = useNavigationStore()
  const [activeTab, setActiveTab] = useState("dashboard")

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('project')
  }, [setSidebarContext])

  // Header tabs configuration
  const headerTabs = [
    {
      id: "dashboard",
      label: "Resumen", 
      isActive: activeTab === "dashboard"
    },
    {
      id: "basic-data",
      label: "Datos Básicos", 
      isActive: activeTab === "basic-data"
    }
  ]

  // Header configuration
  const headerProps = {
    title: "Resumen de Proyecto",
    icon: Info,
    tabs: headerTabs,
    onTabChange: (tabId: string) => {
      setActiveTab(tabId)
    }
  }

  return (
    <Layout headerProps={headerProps} wide>
      {activeTab === "dashboard" && <ProjectDashboard />}
      {activeTab === "basic-data" && <ProjectBasicDataTab />}
    </Layout>
  )
}