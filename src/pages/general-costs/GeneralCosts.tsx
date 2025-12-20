import { useEffect, useState, useMemo } from 'react'
import { Layout } from "@/layouts/dashboard/DashboardLayout"
import { useNavigationStore } from '@/stores/navigationStore'
import { CreditCard, Plus, Calendar, ChevronDown } from 'lucide-react'
import GeneralCostsDashboardTab, { calculateAvailablePeriods } from './GeneralCostsDashboardTab'
import GeneralCostsConceptsTab from './GeneralCostsConceptsTab'
import GeneralCostsPaymentsTab from './GeneralCostsPaymentsTab'
import GeneralCostsSettingsTab from './GeneralCostsSettingsTab'
import { useGlobalModalStore } from '@/components/modal'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGeneralCosts } from '@/features/general-costs/hooks/use-general-costs'
import { useGeneralCostsPayments } from '@/hooks/use-general-costs-payments'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type PeriodFilter = '30d' | '3m' | '6m' | '1y' | 'all'

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'all', label: 'Histórico' },
]

export interface DrillDownFilters {
  filterMonth?: string;
  filterGeneralCost?: string;
  filterCategory?: string;
}

export default function GeneralCosts() {
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all')
  const [drillDownFilters, setDrillDownFilters] = useState<DrillDownFilters>({})
  const [dismissedIssueIds, setDismissedIssueIds] = useState<Set<string>>(new Set())
  
  // Get general costs to check if we should disable the Pagos tab
  const { data: generalCosts = [] } = useGeneralCosts(organizationId ?? null)
  const hasGeneralCosts = generalCosts.length > 0
  
  // Get payments to determine which periods have data
  const { data: allPayments = [] } = useGeneralCostsPayments(organizationId)
  const availablePeriods = useMemo(() => calculateAvailablePeriods(allPayments), [allPayments])
  
  // Force 'all' if current period has no data
  const validSelectedPeriod = useMemo(() => {
    if (availablePeriods[selectedPeriod]) return selectedPeriod
    return 'all'
  }, [selectedPeriod, availablePeriods])
  
  // Update selected period if current one becomes invalid
  useEffect(() => {
    if (validSelectedPeriod !== selectedPeriod) {
      setSelectedPeriod(validSelectedPeriod)
    }
  }, [validSelectedPeriod, selectedPeriod])

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
    
    const selectedLabel = PERIOD_OPTIONS.find(opt => opt.value === validSelectedPeriod)?.label || 'Período'
    
    return [
      <DropdownMenu key="period-selector">
        <DropdownMenuTrigger
          className="bg-accent text-white hover:bg-accent/90 rounded-lg px-3 py-1.5 gap-2 text-sm font-medium shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 inline-flex items-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          data-testid="select-period"
        >
          <Calendar className="h-4 w-4" />
          <span>{selectedLabel}</span>
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          {PERIOD_OPTIONS.map((option) => {
            const isAvailable = availablePeriods[option.value];
            return (
              <DropdownMenuItem 
                key={option.value}
                onClick={() => isAvailable && setSelectedPeriod(option.value)}
                disabled={!isAvailable}
                className={validSelectedPeriod === option.value ? "font-medium text-black dark:text-white" : ""}
                data-testid={`option-period-${option.value}`}
              >
                {option.label}
                {!isAvailable && option.value !== 'all' && <span className="ml-auto text-xs text-muted-foreground">(sin datos)</span>}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
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
      {activeTab === "dashboard" && (
        <GeneralCostsDashboardTab 
          onNavigateToConceptos={() => setActiveTab('conceptos')} 
          onNavigateToPayments={() => setActiveTab('pagos')}
          onNavigateToTab={(tab, filters) => {
            if (tab === 'concepts') setActiveTab('conceptos');
            else if (tab === 'payments' || tab === 'pagos') {
              setDrillDownFilters(filters || {});
              setActiveTab('pagos');
            }
          }}
          onScrollToPanel={(panelId) => {
            const element = document.querySelector(`[data-testid="chart-${panelId === 'monthlyChart' ? 'monthly-trend' : panelId}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          selectedPeriod={validSelectedPeriod}
          dismissedIssueIds={dismissedIssueIds}
          onDismissIssue={(issueId: string) => {
            setDismissedIssueIds(prev => new Set([...Array.from(prev), issueId]));
          }}
        />
      )}
      {activeTab === "conceptos" && <GeneralCostsConceptsTab onNewGeneralCost={handleNewGeneralCost} />}
      {activeTab === "pagos" && (
        <GeneralCostsPaymentsTab 
          initialFilterMonth={drillDownFilters.filterMonth}
          initialFilterGeneralCost={drillDownFilters.filterGeneralCost}
          initialFilterCategory={drillDownFilters.filterCategory}
          onClearDrillDown={() => setDrillDownFilters({})}
        />
      )}
      {activeTab === "ajustes" && <GeneralCostsSettingsTab />}
    </Layout>
  )
}