import { Layout } from "@/layouts/dashboard/DashboardLayout"
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { useGlobalModalStore } from '@/components/modal'
import { Users, Plus, Calendar, ChevronDown } from 'lucide-react'
import { 
  InsuranceTab, 
  usePersonnelPayments, 
  useInsuranceList,
  PersonnelDashboardView,
  PersonnelListView,
  PersonnelAttendanceView,
  PersonnelPaymentsView,
  calculateAvailablePeriods,
  type PeriodFilter
} from '@/features/personnel'
import { DataHealthAlertMulti, type DataIssue } from '@/core/data-health'
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies'
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

export default function PersonnelPage() {
  const { openModal } = useGlobalModalStore()
  const { selectedProjectId, currentOrganizationId } = useProjectContext()
  const { setSidebarContext } = useNavigationStore()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all')
  const [dismissedIssueIds, setDismissedIssueIds] = useState<Set<string>>(new Set())
  const [activeFilterIssueId, setActiveFilterIssueId] = useState<string | null>(null)

  const { data: insuranceData = [] } = useInsuranceList({
    project_id: selectedProjectId || undefined
  })

  const { data: allPayments = [] } = usePersonnelPayments(selectedProjectId || undefined, currentOrganizationId || undefined)
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(currentOrganizationId || undefined)
  const availablePeriods = useMemo(() => calculateAvailablePeriods(allPayments), [allPayments])

  const dataHealthIssues = useMemo((): DataIssue[] => {
    const issues: DataIssue[] = []
    
    const paymentsWithoutPersonnel = allPayments.filter(p => !p.personnel_id)
    if (paymentsWithoutPersonnel.length > 0) {
      issues.push({
        id: 'personnel-missing-personnel',
        ruleId: 'personnel-missing-personnel',
        severity: 'warning',
        title: 'Pagos sin personal asignado',
        description: `${paymentsWithoutPersonnel.length} pago(s) no tienen personal asignado`,
        affectedCount: paymentsWithoutPersonnel.length,
        affectedEntities: paymentsWithoutPersonnel.map(p => ({ id: p.id, label: p.notes || 'Pago' })),
        recommendedAction: {
          label: 'Asignar personal',
          actionType: 'navigate',
          targetPath: '/personnel/payments'
        }
      })
    }
    
    const paymentsWithMissingExchangeRate = allPayments.filter(p => {
      if (!p.currency?.code || !defaultCurrency?.code) return false
      return p.currency.code !== defaultCurrency.code && !p.exchange_rate
    })
    if (paymentsWithMissingExchangeRate.length > 0) {
      issues.push({
        id: 'personnel-missing-exchange-rate',
        ruleId: 'personnel-missing-exchange-rate',
        severity: 'critical',
        title: 'Pagos sin tipo de cambio',
        description: `${paymentsWithMissingExchangeRate.length} pago(s) en moneda extranjera sin tipo de cambio`,
        affectedCount: paymentsWithMissingExchangeRate.length,
        affectedEntities: paymentsWithMissingExchangeRate.map(p => ({ id: p.id, label: p.notes || 'Pago' })),
        recommendedAction: {
          label: 'Agregar tipo de cambio',
          actionType: 'navigate',
          targetPath: '/personnel/payments'
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

  const headerProps = {
    icon: Users,
    title: "Mano de Obra",
    description: "Gestiona el personal asignado a tus proyectos, registra asistencias y administra seguros de trabajo.",
    organizationId: currentOrganizationId || undefined,
    showMembers: true,
    showProjectSelector: true,
    tabs: [
      {
        id: 'dashboard',
        label: 'Visión General',
        isActive: activeTab === 'dashboard'
      },
      {
        id: 'active',
        label: 'Listado de Personal',
        isActive: activeTab === 'active'
      },
      {
        id: 'payments',
        label: 'Pagos',
        isActive: activeTab === 'payments'
      },
      {
        id: 'attendance',
        label: 'Asistencia',
        isActive: activeTab === 'attendance'
      },
      {
        id: 'insurance',
        label: 'Seguros',
        isActive: activeTab === 'insurance',
        comingSoon: true
      }
    ],
    onTabChange: (tabId: string) => {
      setActiveTab(tabId)
    },
    actionButton: activeTab === 'attendance' ? {
      label: 'Registrar Asistencia',
      icon: Plus,
      onClick: () => openModal('attendance', {})
    } : activeTab === 'active' ? {
      label: 'Agregar Personal',
      icon: Plus,
      onClick: () => openModal('personnel')
    } : activeTab === 'payments' ? {
      label: 'Agregar Pago',
      icon: Plus,
      onClick: () => openModal('personnel-payment', {
        projectId: selectedProjectId,
        organizationId: currentOrganizationId
      })
    } : activeTab === 'insurance' ? {
      label: 'Nuevo Seguro',
      icon: Plus,
      onClick: () => openModal('insurance', { 
        mode: 'create', 
        projectId: selectedProjectId 
      })
    } : undefined,
    actions: getPeriodSelector()
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      <div className="space-y-6 max-w-full min-w-0 overflow-x-hidden">
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
          <PersonnelDashboardView
            projectId={selectedProjectId || undefined}
            onNavigateToPayments={() => setActiveTab('payments')}
            onNavigateToTab={(tab, filters) => {
              if (tab === 'payments') setActiveTab('payments')
              else if (tab === 'active') setActiveTab('active')
              else if (tab === 'attendance') setActiveTab('attendance')
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

        {activeTab === 'active' && (
          <PersonnelListView
            openModal={openModal}
            insuranceData={insuranceData}
            selectedProjectId={selectedProjectId}
          />
        )}

        {activeTab === 'payments' && (
          <PersonnelPaymentsView
            projectId={selectedProjectId || undefined}
            externalFilterIssueId={activeFilterIssueId}
            onClearExternalFilter={() => setActiveFilterIssueId(null)}
            getAffectedIdsForIssue={getAffectedIdsForIssue}
          />
        )}

        {activeTab === 'attendance' && (
          <PersonnelAttendanceView
            openModal={openModal}
            selectedProjectId={selectedProjectId}
            currentOrganizationId={currentOrganizationId}
          />
        )}

        {activeTab === 'insurance' && <InsuranceTab />}
      </div>
    </Layout>
  )
}
