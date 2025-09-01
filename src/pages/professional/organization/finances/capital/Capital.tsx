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
    { id: "members", label: "Resumen por Socio", isActive: activeTab === "members" },
    { id: "currencies", label: "Detalle por Moneda", isActive: activeTab === "currencies" },
    { id: "detail", label: "Detalle de Aportes/Retiros", isActive: activeTab === "detail" },
  ]

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

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }

  const renderActiveTab = () => {
    const commonProps = {
      organizationId,
      projectId,
      searchValue
    }

    switch (activeTab) {
      case "members":
        return <CapitalDashboard {...commonProps} />
      case "currencies":
        return <CapitalDetail {...commonProps} />
      case "detail":
        return <CapitalHistory {...commonProps} />
      default:
        return <CapitalDashboard {...commonProps} />
    }
  }

  return (
    <Layout
      headerProps={{
        title: "Movimientos de Capital",
        showSearch: true,
        searchValue: searchValue,
        onSearchChange: setSearchValue,
        tabs: tabs,
        onTabChange: handleTabChange,
        actions: [
          <button
            key="new-movement"
            onClick={handleNewMovement}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Nuevo Aporte
          </button>
        ]
      }}
    >
      {renderActiveTab()}
    </Layout>
  )
}