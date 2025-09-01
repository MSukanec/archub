import React, { useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import CapitalDashboard from './CapitalDashboard'
import CapitalDetail from './CapitalDetail'
import CapitalHistory from './CapitalHistory'

export default function FinancesCapitalMovements() {
  const [searchValue, setSearchValue] = useState("")
  const [activeTab, setActiveTab] = useState("members")
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()

  const organizationId = userData?.organization?.id
  const projectId = userData?.preferences?.last_project_id

  const tabs = [
    { id: "members", label: "Resumen por Socio", component: CapitalDashboard },
    { id: "currencies", label: "Detalle por Moneda", component: CapitalDetail },
    { id: "detail", label: "Detalle de Aportes/Retiros", component: CapitalHistory },
  ]

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component

  const handleNewMovement = () => {
    openModal('movements', {
      title: 'Nuevo Aporte de Capital',
      // Force partner movement type
      defaultData: { 
        movement_type: 'aportes_propios',
        subcategory_id: 'a0429ca8-f4b9-4b91-84a2-b6603452f7fb' // Aportes Propios
      }
    })
  }

  return (
    <Layout
      title="Movimientos de Capital"
      showBackButton
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={[
        {
          label: "Nuevo Aporte",
          variant: "default",
          onClick: handleNewMovement
        }
      ]}
    >
      {ActiveTabComponent && (
        <ActiveTabComponent 
          organizationId={organizationId}
          projectId={projectId}
          searchValue={searchValue}
        />
      )}
    </Layout>
  )
}