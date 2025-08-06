import { useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Users, UserCheck, Package, MoreHorizontal, Plus } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

export default function ConstructionLabor() {
  const [activeTab, setActiveTab] = useState('propia')
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()

  // Función para crear un nuevo subcontrato
  const handleCreateSubcontract = () => {
    openModal('subcontract', {
      projectId: userData?.preferences?.last_project_id,
      organizationId: userData?.organization?.id,
      userId: userData?.user?.id,
      isEditing: false
    })
  }

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
    onTabChange: (tabId: string) => setActiveTab(tabId),
    // Mostrar botón solo en la pestaña de subcontratos
    ...(activeTab === 'subcontratos' && {
      actionButton: {
        label: "Nuevo Subcontrato",
        icon: Plus,
        onClick: handleCreateSubcontract,
        variant: "default" as const
      }
    })
  }

  // Función para renderizar el contenido según el tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'propia':
        return (
          <EmptyState
            icon={<UserCheck className="w-12 h-12 text-muted-foreground" />}
            title="Mano de Obra Propia"
            description="Aquí podrás gestionar la mano de obra propia de tu organización. Esta funcionalidad estará disponible próximamente."
          />
        )
      case 'subcontratos':
        return (
          <EmptyState
            icon={<Package className="w-12 h-12 text-muted-foreground" />}
            title="Subcontratos"
            description="Gestiona los subcontratos de mano de obra para tu proyecto. Esta funcionalidad estará disponible próximamente."
          />
        )
      case 'otros':
        return (
          <EmptyState
            icon={<MoreHorizontal className="w-12 h-12 text-muted-foreground" />}
            title="Otros"
            description="Otros tipos de mano de obra y recursos humanos. Esta funcionalidad estará disponible próximamente."
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