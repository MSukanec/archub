import { useEffect, useState } from 'react'
import { Layout } from "@/layouts/dashboard/DashboardLayout"
import { useNavigationStore } from '@/stores/navigationStore'
import { CreditCard, Plus, Calendar } from 'lucide-react'
import GeneralCostsDashboardTab from './GeneralCostsDashboardTab'
import GeneralCostsConceptsTab from './GeneralCostsConceptsTab'
import GeneralCostsPaymentsTab from './GeneralCostsPaymentsTab'
import GeneralCostsSettingsTab from './GeneralCostsSettingsTab'
import { useGlobalModalStore } from '@/components/modal'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGeneralCosts } from '@/features/general-costs/hooks/use-general-costs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type PeriodFilter = '30d' | '3m' | '6m' | '1y' | 'all'

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'all', label: 'Histórico' },
]

export default function GeneralCosts() {
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all')
  
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

  // Period selector for dashboard tab
  const getPeriodSelector = () => {
    if (activeTab !== "dashboard") return []
    
    return [
      <Select
        key="period-selector"
        value={selectedPeriod}
        onValueChange={(value) => setSelectedPeriod(value as PeriodFilter)}
      >
        <SelectTrigger 
          className="h-8 w-[160px] text-xs"
          data-testid="select-period"
        >
          <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              data-testid={`option-period-${option.value}`}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ]
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
    actionButton: getActionButton(),
    actions: getPeriodSelector()
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      {activeTab === "dashboard" && <GeneralCostsDashboardTab onNavigateToConceptos={() => setActiveTab('conceptos')} selectedPeriod={selectedPeriod} />}
      {activeTab === "conceptos" && <GeneralCostsConceptsTab onNewGeneralCost={handleNewGeneralCost} />}
      {activeTab === "pagos" && <GeneralCostsPaymentsTab />}
      {activeTab === "ajustes" && <GeneralCostsSettingsTab />}
    </Layout>
  )
}