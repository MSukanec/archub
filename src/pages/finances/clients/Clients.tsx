import React, { useState } from 'react'
import { Receipt } from 'lucide-react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { ClientObligations } from './ClientObligations'
import { ClientMonthlyInstallments } from './ClientMonthlyInstallments'
import { ClientPayments } from './ClientPayments'

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
      id: "monthly-installments",
      label: "Cuotas Mensuales",
      isActive: activeTab === "monthly-installments"
    },
    {
      id: "details",
      label: "Pagos",
      isActive: activeTab === "details"
    }
  ]

  const headerProps = {
    title: "Clientes",
    icon: Receipt,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    ...(activeTab === "obligations" && {
      actionButton: {
        label: "Nuevo Compromiso",
        onClick: () => openModal('project-client', {
          projectId,
          organizationId
        })
      }
    }),
    ...(activeTab === "details" && {
      actionButton: {
        label: "Nuevo Aporte",
        onClick: () => openModal('installment', {
          projectId,
          organizationId,
          subcategoryId: 'f3b96eda-15d5-4c96-ade7-6f53685115d3' // Subcategoría para Aportes de Terceros
        })
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

        {activeTab === "monthly-installments" && (
          <ClientMonthlyInstallments 
            projectId={projectId}
            organizationId={organizationId}
          />
        )}

        {activeTab === "details" && (
          <ClientPayments 
            projectId={projectId}
            organizationId={organizationId}
          />
        )}
      </div>
    </Layout>
  )
}