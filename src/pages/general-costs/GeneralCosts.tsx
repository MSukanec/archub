import { useEffect, useState } from 'react'
import { Layout } from '@/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { CreditCard, Plus } from 'lucide-react'
import GeneralCostsList from './GeneralCostsList'
import GeneralCostsPaymentsTab from './GeneralCostsPaymentsTab'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGeneralCosts } from '@/features/general-costs/hooks/use-general-costs'

export default function GeneralCosts() {
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const [activeTab, setActiveTab] = useState("lista")
  
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
      id: "lista",
      label: "Lista", 
      isActive: activeTab === "lista"
    },
    {
      id: "pagos",
      label: "Pagos",
      isActive: activeTab === "pagos",
      isDisabled: !hasGeneralCosts
    }
  ]

  const handleNewGeneralCost = () => {
    openModal('general-costs', {
      organizationId: userData?.organization?.id,
      isEditing: false
    })
  }

  const handleNewPayment = () => {
    openModal('general-costs-payment', {
      organizationId: userData?.organization?.id,
    })
  }

  // Action button based on active tab
  const getActionButton = () => {
    if (activeTab === "lista") {
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
      {activeTab === "lista" && <GeneralCostsList onNewGeneralCost={handleNewGeneralCost} />}
      {activeTab === "pagos" && <GeneralCostsPaymentsTab />}
    </Layout>
  )
}