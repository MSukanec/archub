import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { Users, Plus } from 'lucide-react'
import LaborList from './LaborList'

export default function Labor() {
  const { setSidebarContext } = useNavigationStore()
  const [activeTab, setActiveTab] = useState("lista")

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('library')
  }, [setSidebarContext])

  // Header tabs configuration
  const headerTabs = [
    {
      id: "lista",
      label: "Lista", 
      isActive: activeTab === "lista"
    }
  ]

  const handleNewLabor = () => {
    // TODO: Implementar modal para nuevo análisis de mano de obra
    console.log('Crear nuevo análisis de mano de obra')
  }

  // Header configuration
  const headerProps = {
    title: "Análisis de Mano de Obra",
    icon: <Users className="w-5 h-5" />,
    tabs: headerTabs,
    onTabChange: (tabId: string) => {
      setActiveTab(tabId)
    },
    actionButton: {
      label: "Nuevo Análisis de Mano de Obra",
      icon: Plus,
      onClick: handleNewLabor,
      variant: "default" as const
    }
  }

  return (
    <Layout headerProps={headerProps} wide>
      {activeTab === "lista" && <LaborList onNewLabor={handleNewLabor} />}
    </Layout>
  )
}