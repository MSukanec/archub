import { useState, useEffect, useMemo, useCallback } from 'react'
import { Layout } from "@/layouts/dashboard/DashboardLayout"
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { useGlobalModalStore } from '@/components/modal'
import { Package, Plus, Calendar, ChevronDown } from 'lucide-react'
import MaterialsDashboardTab, { calculateAvailablePeriods, type PeriodFilter } from './MaterialsDashboardTab'
import MaterialPaymentsTab from './MaterialPaymentsTab'
import PurchaseOrdersTab from './PurchaseOrdersTab'
import PurchasesTab from './PurchasesTab'
import MaterialSettingsTab from './MaterialSettingsTab'
import { useMaterialPayments } from '@/features/materials'
import { DataHealthAlertMulti, type DataIssue } from '@/core/data-health'
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies'
import { parseLocalDate } from '@/lib/date-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'all', label: 'Histórico' },
]

export default function Materials() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all')
  const [dismissedIssueIds, setDismissedIssueIds] = useState<Set<string>>(new Set())
  const [activeFilterIssueId, setActiveFilterIssueId] = useState<string | null>(null)
  const { data: userData, isLoading } = useCurrentUser()
  const { selectedProjectId, currentOrganizationId } = useProjectContext()
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()

  const { data: allPayments = [] } = useMaterialPayments(selectedProjectId || undefined, currentOrganizationId || undefined)
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(currentOrganizationId || undefined)
  const availablePeriods = useMemo(() => calculateAvailablePeriods(allPayments), [allPayments])

  const dataHealthIssues = useMemo((): DataIssue[] => {
    const issues: DataIssue[] = []

    const paymentsWithoutExchangeRate = allPayments.filter(p => {
      if (!p.currency || !defaultCurrency) return false
      return p.currency.code !== defaultCurrency.code && !p.exchange_rate
    })

    if (paymentsWithoutExchangeRate.length > 0) {
      issues.push({
        id: 'materials-missing-exchange-rate',
        ruleId: 'materials-missing-exchange-rate',
        severity: 'warning',
        title: 'Pagos sin cotización',
        description: `${paymentsWithoutExchangeRate.length} pago(s) en moneda extranjera no tienen cotización registrada`,
        affectedCount: paymentsWithoutExchangeRate.length,
        affectedEntities: paymentsWithoutExchangeRate.map(p => ({ id: p.id, label: p.notes || 'Pago' })),
        recommendedAction: {
          label: 'Editar pagos',
          actionType: 'bulk_edit'
        }
      })
    }

    const futurePayments = allPayments.filter(p => {
      const paymentDate = parseLocalDate(p.payment_date)
      if (!paymentDate) return false
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      return paymentDate > today
    })

    if (futurePayments.length > 0) {
      issues.push({
        id: 'materials-future-date',
        ruleId: 'materials-future-date',
        severity: 'info',
        title: 'Pagos con fecha futura',
        description: `${futurePayments.length} pago(s) tienen fecha posterior a hoy`,
        affectedCount: futurePayments.length,
        affectedEntities: futurePayments.map(p => ({ id: p.id, label: p.notes || 'Pago' })),
        recommendedAction: {
          label: 'Revisar fechas',
          actionType: 'manual'
        }
      })
    }

    return issues
  }, [allPayments, defaultCurrency])

  const getAffectedIdsForIssue = useCallback((issueId: string): string[] => {
    const issue = dataHealthIssues.find(i => i.id === issueId)
    if (!issue?.affectedEntities) return []
    return issue.affectedEntities.map(e => String(e.id))
  }, [dataHealthIssues])

  const handleDataHealthClick = useCallback((issueId: string) => {
    if (activeTab !== 'payments') {
      setActiveTab('payments')
      setActiveFilterIssueId(issueId)
    } else {
      if (activeFilterIssueId === issueId) {
        setActiveFilterIssueId(null)
      } else {
        setActiveFilterIssueId(issueId)
      }
    }
  }, [activeTab, activeFilterIssueId])

  useEffect(() => {
    if (activeFilterIssueId && dataHealthIssues.length === 0) {
      setActiveFilterIssueId(null)
    }
  }, [activeFilterIssueId, dataHealthIssues])

  const filteredPaymentIds = useMemo(() => {
    if (!activeFilterIssueId) return null
    return getAffectedIdsForIssue(activeFilterIssueId)
  }, [activeFilterIssueId, getAffectedIdsForIssue])

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
    setSidebarContext('construction')
  }, [])

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
            const isAvailable = availablePeriods[option.value]
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
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    ]
  }

  const headerTabs = [
    {
      id: "dashboard",
      label: "Visión General",
      isActive: activeTab === "dashboard"
    },
    {
      id: "purchase-orders",
      label: "Órdenes de Compra",
      isActive: activeTab === "purchase-orders"
    },
    {
      id: "purchases",
      label: "Compras",
      isActive: activeTab === "purchases"
    },
    {
      id: "payments",
      label: "Pagos",
      isActive: activeTab === "payments"
    },
    {
      id: "settings",
      label: "Ajustes",
      isActive: activeTab === "settings",
      disabled: true
    }
  ]

  const headerProps = {
    icon: Package,
    title: "Materiales",
    description: "Gestiona los pagos de materiales del proyecto, órdenes de compra, compras y ajustes de inventario.",
    organizationId: currentOrganizationId || undefined,
    showMembers: true,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    ...(activeTab === "purchase-orders" && {
      actionButton: {
        label: "Nueva Orden",
        icon: Plus,
        onClick: () => openModal('purchase-order', {
          projectId: selectedProjectId,
          organizationId: currentOrganizationId,
          mode: 'create'
        })
      }
    }),
    ...(activeTab === "payments" && {
      actionButton: {
        label: "Nuevo Pago",
        icon: Plus,
        onClick: () => openModal('material-payment', {
          projectId: selectedProjectId,
          organizationId: currentOrganizationId,
          mode: 'create'
        })
      }
    }),
    ...(activeTab === "purchases" && {
      actionButton: {
        label: "Nueva Compra",
        icon: Plus,
        onClick: () => openModal('material-purchase', {
          projectId: selectedProjectId,
          organizationId: currentOrganizationId,
          mode: 'create'
        })
      }
    }),
    actions: getPeriodSelector()
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      <div className="space-y-4">
        {dataHealthIssues.length > 0 && (
          <DataHealthAlertMulti
            issues={dataHealthIssues}
            entityLabel="pago"
            activeFilterIssueId={activeFilterIssueId}
            onToggleFilter={handleDataHealthClick}
            dismissedIssueIds={dismissedIssueIds}
            onDismissIssue={(issueId: string) => {
              if (activeFilterIssueId === issueId) {
                setActiveFilterIssueId(null)
              }
              setDismissedIssueIds(prev => new Set([...Array.from(prev), issueId]))
            }}
            filteredItemIds={filteredPaymentIds ? new Set(filteredPaymentIds) : undefined}
          />
        )}
        
        {activeTab === 'dashboard' && (
          <MaterialsDashboardTab
            projectId={selectedProjectId || undefined}
            onNavigateToPayments={() => setActiveTab('payments')}
            onNavigateToTab={(tab, filters) => {
              if (tab === 'payments') setActiveTab('payments')
              else if (tab === 'purchase-orders') setActiveTab('purchase-orders')
              else if (tab === 'purchases') setActiveTab('purchases')
            }}
            onScrollToPanel={(panelId) => {
              const element = document.querySelector(`[data-testid="chart-${panelId === 'monthlyChart' ? 'monthly-trend' : panelId}"]`)
              element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            selectedPeriod={validSelectedPeriod}
            dismissedIssueIds={dismissedIssueIds}
            onDismissIssue={(issueId: string) => {
              setDismissedIssueIds(prev => new Set([...Array.from(prev), issueId]))
            }}
          />
        )}

        {activeTab === 'payments' && (
          <MaterialPaymentsTab 
            projectId={selectedProjectId || undefined}
            externalFilterIssueId={activeFilterIssueId}
            onClearExternalFilter={() => setActiveFilterIssueId(null)}
            getAffectedIdsForIssue={getAffectedIdsForIssue}
          />
        )}

        {activeTab === 'purchase-orders' && (
          <PurchaseOrdersTab projectId={selectedProjectId || undefined} organizationId={currentOrganizationId || undefined} />
        )}

        {activeTab === 'purchases' && (
          <PurchasesTab projectId={selectedProjectId || undefined} />
        )}

        {activeTab === 'settings' && (
          <MaterialSettingsTab projectId={selectedProjectId || undefined} />
        )}
      </div>
    </Layout>
  )
}
