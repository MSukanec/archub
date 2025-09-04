import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Package2, Plus } from 'lucide-react'
import MaterialList from './MaterialList'

export default function Materials() {
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
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

  const handleNewMaterial = () => {
    openModal('custom-product')
  }

  // Header configuration
  const headerProps = {
    title: "Materiales",
    icon: <Package2 className="w-5 h-5" />,
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