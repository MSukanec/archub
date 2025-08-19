import React, { useState } from 'react'
import { Receipt } from 'lucide-react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { ClientObligations } from './ClientObligations'
import { ClientPaymentCurrencies } from './ClientPaymentCurrencies'
import { ClientPaymentDetails } from './ClientPaymentDetails'

export function Clients() {
  const [activeTab, setActiveTab] = useState("obligations")
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  
  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.organization?.id

  // Crear tabs para el header
  const headerTabs = [
    {
      id: "obligations",
      label: "Compromisos de Pago",
      isActive: activeTab === "obligations"
    },
    {
      id: "currencies",
      label: "Detalle por Moneda", 
      isActive: activeTab === "currencies"
    },
    {
      id: "details",
      label: "Detalle de Pagos",
      isActive: activeTab === "details"
    }
  ]

  const headerProps = {
    title: "Aportes de Clientes",
    icon: Receipt,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    ...(activeTab === "obligations" && {
      actionButton: {
        label: "Nuevo Aporte",
        onClick: () => openModal('installment')
      }
    })
  }

  if (!projectId || !organizationId) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Selecciona un proyecto para ver los aportes de clientes</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-4">
        {activeTab === "obligations" && (
          <ClientObligations 
            projectId={projectId}
            organizationId={organizationId}
          />
        )}

        {activeTab === "currencies" && (
          <ClientPaymentCurrencies 
            projectId={projectId}
            organizationId={organizationId}
          />
        )}

        {activeTab === "details" && (
          <ClientPaymentDetails 
            projectId={projectId}
            organizationId={organizationId}
          />
        )}
      </div>
    </Layout>
  )
}