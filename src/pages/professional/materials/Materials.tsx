import { useState, useEffect } from 'react'
import { DashboardLayout as Layout } from "@/layouts"
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { useGlobalModalStore } from '@/components/modal'
import { Package, Plus } from 'lucide-react'
import MaterialPaymentsTab from './MaterialPaymentsTab'
import PurchaseOrdersTab from './PurchaseOrdersTab'
import PurchasesTab from './PurchasesTab'
import MaterialSettingsTab from './MaterialSettingsTab'

export default function Materials() {
  const [activeTab, setActiveTab] = useState('purchase-orders')
  const { data: userData, isLoading } = useCurrentUser()
  const { selectedProjectId, currentOrganizationId } = useProjectContext()
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()

  useEffect(() => {
    setSidebarContext('construction')
  }, [])

  const headerTabs = [
    {
      id: "purchase-orders",
      label: "Órdenes de Compra",
      isActive: activeTab === "purchase-orders"
    },
    {
      id: "purchases",
      label: "Compras",
      isActive: activeTab === "purchases"
    },
    {
      id: "payments",
      label: "Pagos",
      isActive: activeTab === "payments"
    },
    {
      id: "settings",
      label: "Ajustes",
      isActive: activeTab === "settings",
      disabled: true
    }
  ]

  const headerProps = {
    icon: Package,
    title: "Materiales",
    description: "Gestiona los pagos de materiales del proyecto, órdenes de compra, compras y ajustes de inventario.",
    organizationId: currentOrganizationId || undefined,
    showMembers: true,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    ...(activeTab === "purchase-orders" && {
      actionButton: {
        label: "Nueva Orden",
        icon: Plus,
        onClick: () => openModal('purchase-order', {
          projectId: selectedProjectId,
          organizationId: currentOrganizationId,
          mode: 'create'
        })
      }
    }),
    ...(activeTab === "payments" && {
      actionButton: {
        label: "Nuevo Pago",
        icon: Plus,
        onClick: () => openModal('material-payment', {
          projectId: selectedProjectId,
          organizationId: currentOrganizationId,
          mode: 'create'
        })
      }
    }),
    ...(activeTab === "purchases" && {
      actionButton: {
        label: "Nueva Compra",
        icon: Plus,
        onClick: () => openModal('material-purchase', {
          projectId: selectedProjectId,
          organizationId: currentOrganizationId,
          mode: 'create'
        })
      }
    })
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-4">
        {activeTab === 'payments' && (
          <MaterialPaymentsTab projectId={selectedProjectId || undefined} />
        )}

        {activeTab === 'purchase-orders' && (
          <PurchaseOrdersTab projectId={selectedProjectId || undefined} organizationId={currentOrganizationId || undefined} />
        )}

        {activeTab === 'purchases' && (
          <PurchasesTab projectId={selectedProjectId || undefined} />
        )}

        {activeTab === 'settings' && (
          <MaterialSettingsTab projectId={selectedProjectId || undefined} />
        )}
      </div>
    </Layout>
  )
}
