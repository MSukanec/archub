import { useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Users, UserCheck, Package, MoreHorizontal } from 'lucide-react'

export default function ConstructionLabor() {
  const [activeTab, setActiveTab] = useState('propia')

  // Configuración de tabs para el header
  const headerTabs = [
    {
      id: "propia",
      label: "Mano de Obra Propia",
      isActive: activeTab === "propia"
    },
    {
      id: "subcontratos", 
      label: "Subcontratos",
      isActive: activeTab === "subcontratos"
    },
    {
      id: "otros",
      label: "Otros",
      isActive: activeTab === "otros"
    }
  ]

  // Configuración del header
  const headerProps = {
    title: "Mano de Obra",
    icon: Users,
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId)
  }

  // Función para renderizar el contenido según el tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'propia':
        return (
          <EmptyState
            icon={UserCheck}
            title="Mano de Obra Propia"
            description="Aquí podrás gestionar la mano de obra propia de tu organización."
            action={{
              label: "Próximamente",
              onClick: () => {},
              disabled: true
            }}
          />
        )
      case 'subcontratos':
        return (
          <EmptyState
            icon={Package}
            title="Subcontratos"
            description="Gestiona los subcontratos de mano de obra para tu proyecto."
            action={{
              label: "Próximamente", 
              onClick: () => {},
              disabled: true
            }}
          />
        )
      case 'otros':
        return (
          <EmptyState
            icon={MoreHorizontal}
            title="Otros"
            description="Otros tipos de mano de obra y recursos humanos."
            action={{
              label: "Próximamente",
              onClick: () => {},
              disabled: true
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {renderTabContent()}
      </div>
    </Layout>
  )
}