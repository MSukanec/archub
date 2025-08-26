import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { Package, Plus } from 'lucide-react'
import MaterialList from './materials/MaterialList'

export default function Materials() {
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

  const handleNewMaterial = () => {
    // TODO: Implementar modal para producto personalizado
    console.log('Crear nuevo producto personalizado')
  }

  // Header configuration
  const headerProps = {
    title: "Análisis de Materiales",
    icon: Package,
    tabs: headerTabs,
    onTabChange: (tabId: string) => {
      setActiveTab(tabId)
    },
    actionButton: {
      label: "Nuevo Producto Personalizado",
      icon: Plus,
      onClick: handleNewMaterial,
      variant: "default" as const
    }
  }

  return (
    <Layout headerProps={headerProps} wide>
      {activeTab === "lista" && <MaterialList />}
    </Layout>
  )
}