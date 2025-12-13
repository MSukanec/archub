import { useEffect, useState } from 'react'
import { Layout } from "@/layouts/dashboard/DashboardLayout"
import { useNavigationStore } from '@/stores/navigationStore'
import { CreditCard, Plus } from 'lucide-react'
import GeneralCostsDashboardTab from './GeneralCostsDashboardTab'
import GeneralCostsConceptsTab from './GeneralCostsConceptsTab'
import GeneralCostsPaymentsTab from './GeneralCostsPaymentsTab'
import GeneralCostsSettingsTab from './GeneralCostsSettingsTab'
import { useGlobalModalStore } from '@/components/modal'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGeneralCosts } from '@/features/general-costs/hooks/use-general-costs'

export default function GeneralCosts() {
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const [activeTab, setActiveTab] = useState("dashboard")
  
  // Get general costs to check if we should disable the Pagos tab
  const { data: generalCosts = [] } = useGeneralCosts(organizationId ?? null)
  const hasGeneralCosts = generalCosts.length > 0

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization')
  }, [setSidebarContext])

  // Header tabs configuration
  const headerTabs = [
    {
      id: "dashboard",
      label: "Visión General",
      isActive: activeTab === "dashboard"
    },
    {
      id: "conceptos",
      label: "Conceptos", 
      isActive: activeTab === "conceptos"
    },
    {
      id: "pagos",
      label: "Pagos",
      isActive: activeTab === "pagos",
      disabled: !hasGeneralCosts
    },
    {
      id: "ajustes",
      label: "Ajustes",
      isActive: activeTab === "ajustes"
    }
  ]

  const handleNewGeneralCost = () => {
    openModal('general-costs', {
      organizationId: userData?.organization?.id
    })
  }

  const handleNewPayment = () => {
    openModal('general-costs-payment', {
      organizationId: userData?.organization?.id,
    })
  }

  // Action button based on active tab
  const getActionButton = () => {
    if (activeTab === "conceptos") {
      return {
        label: "Nuevo Gasto General",
        icon: Plus,
        onClick: handleNewGeneralCost
      }
    }
    if (activeTab === "pagos") {
      return {
        label: "Nuevo Pago",
        icon: Plus,
        onClick: handleNewPayment
      }
    }
    return undefined
  }

  // Header configuration
  const headerProps = {
    title: "Gastos Generales",
    description: "Administra los gastos generales y costos operativos de tu organización.",
    icon: CreditCard,
    organizationId,
    showMembers: true,
    tabs: headerTabs,
    onTabChange: (tabId: string) => {
      setActiveTab(tabId)
    },
    actionButton: getActionButton()
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      {activeTab === "dashboard" && <GeneralCostsDashboardTab onNavigateToConceptos={() => setActiveTab('conceptos')} />}
      {activeTab === "conceptos" && <GeneralCostsConceptsTab onNewGeneralCost={handleNewGeneralCost} />}
      {activeTab === "pagos" && <GeneralCostsPaymentsTab />}
      {activeTab === "ajustes" && <GeneralCostsSettingsTab />}
    </Layout>
  )
}