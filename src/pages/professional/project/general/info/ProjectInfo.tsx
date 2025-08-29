import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { Info } from 'lucide-react'
import ProjectInfoBasicData from './ProjectInfoBasicData'

export default function ProjectInfo() {
  const { setSidebarContext } = useNavigationStore()
  const [activeTab, setActiveTab] = useState("basic-data")

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('project')
  }, [setSidebarContext])

  // Header tabs configuration
  const headerTabs = [
    {
      id: "basic-data",
      label: "Datos Básicos", 
      isActive: activeTab === "basic-data"
    }
  ]

  // Header configuration
  const headerProps = {
    title: "Información del Proyecto",
    icon: Info,
    tabs: headerTabs,
    onTabChange: (tabId: string) => {
      setActiveTab(tabId)
    }
  }

  return (
    <Layout headerProps={headerProps} wide>
      {activeTab === "basic-data" && <ProjectInfoBasicData />}
    </Layout>
  )
}