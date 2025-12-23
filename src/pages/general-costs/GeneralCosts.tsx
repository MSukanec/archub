import { useEffect, useState, useMemo } from 'react'
import { Layout } from "@/layouts/dashboard/DashboardLayout"
import { LabLayout } from "@/layouts/lab/LabLayout"
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
import { Button } from '@/components/ui/button'
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

const GENERAL_COSTS_TABS = [
  { id: 'dashboard', label: 'Visión General' },
  { id: 'conceptos', label: 'Conceptos' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'ajustes', label: 'Ajustes' },
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
  
  const layoutPreference = userData?.preferences?.layout || 'experimental'
  const isLabLayout = layoutPreference === 'lab'
  
  const { data: generalCosts = [] } = useGeneralCosts(organizationId ?? null)
  const hasGeneralCosts = generalCosts.length > 0
  
  const { data: allPayments = [] } = useGeneralCostsPayments(organizationId)
  const availablePeriods = useMemo(() => calculateAvailablePeriods(allPayments), [allPayments])
  
  const validSelectedPeriod = useMemo(() => {
    if (availablePeriods[selectedPeriod]) return selectedPeriod
    return 'all'
  }, [selectedPeriod, availablePeriods])
  
  useEffect(() => {
    if (validSelectedPeriod !== selectedPeriod) {
      setSelectedPeriod(validSelectedPeriod)
    }
  }, [validSelectedPeriod, selectedPeriod])

  useEffect(() => {
    setSidebarContext('organization')
  }, [setSidebarContext])

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

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
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
        )
      case 'conceptos':
        return <GeneralCostsConceptsTab onNewGeneralCost={handleNewGeneralCost} />
      case 'pagos':
        return (
          <GeneralCostsPaymentsTab 
            initialFilterMonth={drillDownFilters.filterMonth}
            initialFilterGeneralCost={drillDownFilters.filterGeneralCost}
            initialFilterCategory={drillDownFilters.filterCategory}
            onClearDrillDown={() => setDrillDownFilters({})}
          />
        )
      case 'ajustes':
        return <GeneralCostsSettingsTab />
      default:
        return (
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
        )
    }
  }

  const secondaryRightContent = (
    <div className="flex items-center gap-3">
      {activeTab === 'dashboard' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              data-testid="select-period"
            >
              <Calendar className="h-4 w-4" />
              <span>{PERIOD_OPTIONS.find(opt => opt.value === validSelectedPeriod)?.label || 'Período'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            {PERIOD_OPTIONS.map((option) => {
              const isAvailable = availablePeriods[option.value];
              return (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => isAvailable && setSelectedPeriod(option.value)}
                  disabled={!isAvailable}
                  className={validSelectedPeriod === option.value ? "font-medium" : ""}
                  data-testid={`option-period-${option.value}`}
                >
                  {option.label}
                  {!isAvailable && option.value !== 'all' && <span className="ml-auto text-xs text-muted-foreground">(sin datos)</span>}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {activeTab === 'conceptos' && (
        <Button
          size="sm"
          onClick={handleNewGeneralCost}
          data-testid="button-add-concept"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Gasto General
        </Button>
      )}
      {activeTab === 'pagos' && hasGeneralCosts && (
        <Button
          size="sm"
          onClick={handleNewPayment}
          data-testid="button-add-payment"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Pago
        </Button>
      )}
    </div>
  )

  const labTabs = GENERAL_COSTS_TABS.map(tab => ({
    ...tab,
    disabled: tab.id === 'pagos' && !hasGeneralCosts,
  }))

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true}
        organizationId={organizationId}
        showMembers={true}
        tabs={labTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        toolbarProps={{
          secondaryRightSlot: secondaryRightContent,
        }}
      >
        {renderView()}
      </LabLayout>
    )
  }

  const headerTabs = GENERAL_COSTS_TABS.map(tab => ({
    ...tab,
    isActive: activeTab === tab.id
  }))

  const getActionButton = () => {
    if (activeTab === "conceptos") {
      return {
        label: "Nuevo Gasto General",
        icon: Plus,
        onClick: handleNewGeneralCost
      }
    }
    if (activeTab === "pagos" && hasGeneralCosts) {
      return {
        label: "Nuevo Pago",
        icon: Plus,
        onClick: handleNewPayment
      }
    }
    return undefined
  }

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
      {renderView()}
    </Layout>
  )
}
