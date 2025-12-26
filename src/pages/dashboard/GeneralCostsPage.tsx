import { useEffect, useState, useMemo } from 'react'
import { Layout } from "@/layouts/dashboard/DashboardLayout"
import { LabLayout } from "@/layouts/lab/LabLayout"
import { useNavigationStore } from '@/stores/navigationStore'
import { CreditCard, Plus, Calendar, ChevronDown } from 'lucide-react'
import GeneralCostsDashboardView, { calculateAvailablePeriods } from '@/features/general-costs/views/GeneralCostsDashboardView'
import GeneralCostsConceptsView from '@/features/general-costs/views/GeneralCostsConceptsView'
import GeneralCostsPaymentsView from '@/features/general-costs/views/GeneralCostsPaymentsView'
import GeneralCostsSettingsView from '@/features/general-costs/views/GeneralCostsSettingsView'
import { useGlobalModalStore } from '@/components/modal'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGeneralCosts } from '@/features/general-costs/hooks/use-general-costs'
import { useGeneralCostsPayments } from '@/features/general-costs/hooks/use-general-costs-payments'
import { useLabDrawerStore } from '@/layouts/lab/stores/useLabDrawerStore'
import GeneralCostPaymentDrawer from '@/features/general-costs/drawer/GeneralCostPaymentDrawer'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useGeneralCostsDataHealth, DataHealthAlertMulti } from '@/core/data-health'
import { useOrganizationDefaultCurrency, useOrgCurrencyContext } from '@/hooks/use-currencies'
export type PeriodFilter = '30d'| '3m'| '6m'| '1y'| 'all'
const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '30d', label: 'Últimos 30 días'},
  { value: '3m', label: 'Últimos 3 meses'},
  { value: '6m', label: 'Últimos 6 meses'},
  { value: '1y', label: 'Último año'},
  { value: 'all', label: 'Histórico'},
]
const GENERAL_COSTS_TABS = [
  { id: 'dashboard', label: 'Visión General'},
  { id: 'conceptos', label: 'Conceptos'},
  { id: 'pagos', label: 'Pagos'},
  { id: 'ajustes', label: 'Ajustes'},
]
export interface DrillDownFilters {
  filterMonth?: string;
  filterGeneralCost?: string;
  filterCategory?: string;
}
export default function GeneralCostsPage() {
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
  const { openDrawer, closeDrawer } = useLabDrawerStore()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all')
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false)
  const [drillDownFilters, setDrillDownFilters] = useState<DrillDownFilters>({})
  const [dismissedIssueIds, setDismissedIssueIds] = useState<Set<string>>(new Set())
  
  const layoutPreference = userData?.preferences?.layout || 'experimental'
  const isLabLayout = layoutPreference === 'lab'
  
  const { data: generalCosts = [] } = useGeneralCosts(organizationId ?? null)
  const hasGeneralCosts = generalCosts.length > 0
  
  const { data: allPayments = [] } = useGeneralCostsPayments(organizationId)
  const availablePeriods = useMemo(() => calculateAvailablePeriods(allPayments), [allPayments])
  
  // Data health for payments
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId)
  const { isMultiCurrency } = useOrgCurrencyContext(organizationId)
  const dataHealth = useGeneralCostsDataHealth(allPayments, {
    organizationId: organizationId ?? '',
    defaultCurrencyId: defaultCurrency?.code ?? undefined,
    isMultiCurrency,
    enabled: !!organizationId && allPayments.length > 0,
    filterTags: ['general-costs'],
  })
  
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
    if (isLabLayout) {
      openDrawer({
        title: 'Nuevo Pago de Gastos Generales',
        subtitle: 'Registra un nuevo pago de gastos generales',
        content: (
          <GeneralCostPaymentDrawer
            organizationId={userData?.organization?.id}
            onClose={closeDrawer}
          />
        ),
        width: 'lg',
      })
    } else {
      openModal('general-costs-payment', {
        organizationId: userData?.organization?.id,
      })
    }
  }
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <GeneralCostsDashboardView 
            onNavigateToConceptos={() => setActiveTab('conceptos')} 
            onNavigateToPayments={() => setActiveTab('pagos')}
            onNavigateToTab={(tab, filters) => {
              if (tab === 'concepts') setActiveTab('conceptos');
              else if (tab === 'payments'|| tab === 'pagos') {
                setDrillDownFilters(filters || {});
                setActiveTab('pagos');
              }
            }}
            onScrollToPanel={(panelId) => {
              const element = document.querySelector(`[data-testid="chart-${panelId === 'monthlyChart'? 'monthly-trend': panelId}"]`);
              element?.scrollIntoView({ behavior: 'smooth', block: 'center'});
            }}
            selectedPeriod={validSelectedPeriod}
            dismissedIssueIds={dismissedIssueIds}
            onDismissIssue={(issueId: string) => {
              setDismissedIssueIds(prev => new Set([...Array.from(prev), issueId]));
            }}
          />
        )
      case 'conceptos':
        return <GeneralCostsConceptsView onNewGeneralCost={handleNewGeneralCost} />
      case 'pagos':
        return (
          <GeneralCostsPaymentsView 
            initialFilterMonth={drillDownFilters.filterMonth}
            initialFilterGeneralCost={drillDownFilters.filterGeneralCost}
            initialFilterCategory={drillDownFilters.filterCategory}
            onClearDrillDown={() => setDrillDownFilters({})}
          />
        )
      case 'ajustes':
        return <GeneralCostsSettingsView />
      default:
        return (
          <GeneralCostsDashboardView 
            onNavigateToConceptos={() => setActiveTab('conceptos')} 
            onNavigateToPayments={() => setActiveTab('pagos')}
            onNavigateToTab={(tab, filters) => {
              if (tab === 'concepts') setActiveTab('conceptos');
              else if (tab === 'payments'|| tab === 'pagos') {
                setDrillDownFilters(filters || {});
                setActiveTab('pagos');
              }
            }}
            onScrollToPanel={(panelId) => {
              const element = document.querySelector(`[data-testid="chart-${panelId === 'monthlyChart'? 'monthly-trend': panelId}"]`);
              element?.scrollIntoView({ behavior: 'smooth', block: 'center'});
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
  const periodContent = (
    <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          data-testid="select-period"
        >
          <Calendar className="h-4 w-4" />
          <span>{PERIOD_OPTIONS.find(opt => opt.value === validSelectedPeriod)?.label || 'Período'}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="min-w-[180px] p-2">
        <div className="flex flex-col gap-1">
          {PERIOD_OPTIONS.map((option) => {
            const isAvailable = availablePeriods[option.value];
            return (
              <button
                key={option.value}
                onClick={() => {
                  if (isAvailable) {
                    setSelectedPeriod(option.value);
                    setPeriodPopoverOpen(false);
                  }
                }}
                disabled={!isAvailable}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left w-full ${
                  validSelectedPeriod === option.value 
                    ? "font-medium bg-accent/10" 
                    : "hover:bg-accent/5"
                } ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                data-testid={`option-period-${option.value}`}
              >
                <span>{option.label}</span>
                {!isAvailable && option.value !== 'all'&& <span className="ml-auto text-xs text-muted-foreground">(sin datos)</span>}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
  const labTabs = GENERAL_COSTS_TABS.map(tab => ({
    ...tab,
    disabled: tab.id === 'pagos'&& !hasGeneralCosts,
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
          secondaryRightSlot: periodContent,
        }}
      >
        <div className="space-y-6">
          {allPayments.length > 0 && (
            <DataHealthAlertMulti
              issues={dataHealth.result?.issues || []}
              entityLabel="pago"
              dismissedIssueIds={dismissedIssueIds}
              onDismissIssue={(issueId: string) => {
                setDismissedIssueIds(prev => new Set([...Array.from(prev), issueId]));
              }}
            />
          )}
          {renderView()}
        </div>
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
    if (activeTab !== "dashboard") return undefined
    
    return (
      <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
        <PopoverTrigger asChild>
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
        </PopoverTrigger>
        <PopoverContent align="end" className="min-w-[180px] p-2">
          <div className="flex flex-col gap-1">
            {PERIOD_OPTIONS.map((option) => {
              const isAvailable = availablePeriods[option.value];
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedPeriod(option.value);
                      setPeriodPopoverOpen(false);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left w-full ${
                    validSelectedPeriod === option.value 
                      ? "font-medium bg-accent/10" 
                      : "hover:bg-accent/5"
                  } ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                  data-testid={`option-period-${option.value}`}
                >
                  <span>{option.label}</span>
                  {!isAvailable && option.value !== 'all'&& <span className="ml-auto text-xs text-muted-foreground">(sin datos)</span>}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    )
  }
  const headerProps = {
    title: "Gastos Generales",
    description: "Administra los gastos generales y costos operativos de tu organización.",
    icon: CreditCard,
    organizationId,
    showMembers: true,
    tabs: headerTabs,
    actions: activeTab === "dashboard" ? [periodContent] : [],
    actionButton: getActionButton(),
    onTabChange: (tabId: string) => {
      setActiveTab(tabId)
    },
  }
  return (
    <Layout headerProps={headerProps} wide={false}>
      <div className="space-y-6">
        {allPayments.length > 0 && (
          <DataHealthAlertMulti
            issues={dataHealth.result?.issues || []}
            entityLabel="pago"
            dismissedIssueIds={dismissedIssueIds}
            onDismissIssue={(issueId: string) => {
              setDismissedIssueIds(prev => new Set([...Array.from(prev), issueId]));
            }}
            onToggleFilter={() => setActiveTab('pagos')}
          />
        )}
        {renderView()}
      </div>
    </Layout>
  )
}
