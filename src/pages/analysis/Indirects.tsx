import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { DollarSign, Plus } from 'lucide-react'
import IndirectList from './indirects/IndirectList'

export default function Indirects() {
  const { setSidebarContext } = useNavigationStore()
  const [activeTab, setActiveTab] = useState("lista")

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization')
  }, [setSidebarContext])

  // Header tabs configuration
  const headerTabs = [
    {
      id: "lista",
      label: "Lista", 
      isActive: activeTab === "lista"
    }
  ]

  const handleNewIndirectCost = () => {
    // TODO: Implementar modal para nuevo costo indirecto
    console.log('Crear nuevo costo indirecto')
  }

  // Header configuration
  const headerProps = {
    title: "Análisis de Costos Indirectos",
    icon: DollarSign,
    tabs: headerTabs,
    onTabChange: (tabId: string) => {
      setActiveTab(tabId)
    },
    actionButton: {
      label: "Nuevo Costo Indirecto",
      icon: Plus,
      onClick: handleNewIndirectCost,
      variant: "default" as const
    }
  }

  return (
    <Layout headerProps={headerProps} wide>
      {activeTab === "lista" && <IndirectList onNewIndirectCost={handleNewIndirectCost} />}
    </Layout>
  )
}