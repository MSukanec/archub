import { useState, useEffect, useMemo } from 'react'
import { Plus, Home, Bell, Search, Filter, ExternalLink, Calendar, ChevronDown } from 'lucide-react'
import { LuHandshake } from 'react-icons/lu'
import { Layout } from "@/layouts/dashboard/DashboardLayout"
import { useCurrentUser } from '@/features/users/hooks'
import { useGlobalModalStore } from '@/components/modal'
import { 
  ClientsDashboardView, 
  ClientListView, 
  ClientObligationsView, 
  ClientPaymentsView,
  ClientScheduleView,
  ClientSettingsView,
  ClientPortalConfigView,
  calculateAvailablePeriods,
  type ClientPeriodFilter,
  useClientPayments 
} from '@/features/clients'
import { useNavigationStore } from '@/stores/navigationStore'
import { useActionBarMobile } from '@/layouts'
import { useMobile } from '@/hooks/use-mobile'
import { useLocation, useSearch } from 'wouter'
import { useProjectContext } from '@/stores/projectContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const PERIOD_OPTIONS: { value: ClientPeriodFilter; label: string }[] = [
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'all', label: 'Histórico' },
]

export interface ClientDrillDownFilters {
  filterMonth?: string;
  filterClient?: string;
}

export function ClientsPage() {
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const tabFromUrl = urlParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const { setSidebarContext } = useNavigationStore()
  const [, navigate] = useLocation()
  const { selectedProjectId } = useProjectContext()
  const [selectedPeriod, setSelectedPeriod] = useState<ClientPeriodFilter>('all')
  const [drillDownFilters, setDrillDownFilters] = useState<ClientDrillDownFilters>({})
  const { 
    setActions, 
    setShowActionBar, 
    clearActions, 
    setFilterConfig,
    searchValue: mobileSearchValue,
    setSearchValue: setMobileSearchValue
  } = useActionBarMobile()
  const isMobile = useMobile()

  useEffect(() => {
    setSidebarContext('finances')
  }, [])

  useEffect(() => {
    if (isMobile) {
      setActions({
        home: {
          id: 'home',
          icon: Home,
          label: 'Inicio',
          onClick: () => {
            navigate('/dashboard');
          },
        },
        search: {
          id: 'search',
          icon: Search,
          label: 'Buscar',
          onClick: () => {},
        },
        create: {
          id: 'create',
          icon: Plus,
          label: 'Nuevo Compromiso',
          onClick: () => openModal('client-commitment', {
            projectId: selectedProjectId,
            organizationId: userData?.organization?.id
          }),
          variant: 'primary'
        },
        filter: {
          id: 'filter',
          icon: Filter,
          label: 'Filtros',
          onClick: () => {},
        },
        notifications: {
          id: 'notifications',
          icon: Bell,
          label: 'Notificaciones',
          onClick: () => {},
        },
      });
      setShowActionBar(true);
    }

    return () => {
      if (isMobile) {
        clearActions();
      }
    };
  }, [isMobile])

  const projectId = selectedProjectId
  const organizationId = userData?.organization?.id

  const { data: allPayments = [] } = useClientPayments(projectId || undefined, organizationId)
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

  const headerTabs = [
    {
      id: "dashboard",
      label: "Visión General",
      isActive: activeTab === "dashboard"
    },
    {
      id: "list",
      label: "Lista de Clientes",
      isActive: activeTab === "list"
    },
    {
      id: "obligations",
      label: "Compromisos de Pago",
      isActive: activeTab === "obligations"
    },
    {
      id: "details",
      label: "Pagos",
      isActive: activeTab === "details"
    },
    {
      id: "schedule",
      label: "Cronograma de Pagos",
      isActive: activeTab === "schedule",
      disabled: true
    },
    {
      id: "portal",
      label: "Portal",
      isActive: activeTab === "portal"
    },
    {
      id: "settings",
      label: "Ajustes",
      isActive: activeTab === "settings"
    }
  ]

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
    title: "Clientes",
    icon: LuHandshake,
    description: "Gestiona los clientes del proyecto. Antes de ser cliente, debe ser un contacto.",
    tabs: headerTabs,
    onTabChange: setActiveTab,
    organizationId: userData?.organization?.id,
    showMembers: true,
    showProjectSelector: true,
    ...(activeTab === "list" && {
      actionButton: {
        label: "Agregar Cliente",
        icon: Plus,
        onClick: () => openModal('project-client', {
          projectId,
          organizationId
        })
      }
    }),
    ...(activeTab === "obligations" && {
      actionButton: {
        label: "Nuevo Compromiso",
        icon: Plus,
        onClick: () => openModal('client-commitment', {
          projectId,
          organizationId,
          mode: 'create'
        })
      }
    }),
    ...(activeTab === "details" && {
      actionButton: {
        label: "Nuevo Pago",
        icon: Plus,
        onClick: () => openModal('client-payment', {
          projectId,
          organizationId
        })
      }
    }),
    ...(activeTab === "schedule" && {
      actionButton: {
        label: "Nueva Cuota",
        icon: Plus,
        onClick: () => openModal('client-schedule-item', {
          projectId,
          organizationId,
          mode: 'create'
        })
      }
    }),
    ...(activeTab === "portal" && projectId && {
      actionButton: {
        label: "Ver Portal",
        icon: ExternalLink,
        onClick: () => window.open(`/portal/${projectId}`, '_blank')
      }
    }),
    actions: getPeriodSelector()
  }

  if (!organizationId) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">No se pudo cargar la información de la organización</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      <div className="space-y-4">
        {activeTab === "dashboard" && (
          <ClientsDashboardView 
            onNavigateToList={() => setActiveTab('list')}
            onNavigateToPayments={() => setActiveTab('details')}
            onNavigateToTab={(tab: string, filters?: Record<string, unknown>) => {
              if (tab === 'list') setActiveTab('list');
              else if (tab === 'payments' || tab === 'details') {
                setDrillDownFilters(filters as ClientDrillDownFilters || {});
                setActiveTab('details');
              } else if (tab === 'obligations') {
                setActiveTab('obligations');
              }
            }}
            onScrollToPanel={(panelId: string) => {
              const element = document.querySelector(`[data-testid="chart-${panelId === 'monthlyChart' ? 'monthly-trend' : panelId}"]`);
              element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            selectedPeriod={validSelectedPeriod}
          />
        )}

        {activeTab === "list" && (
          <ClientListView 
            projectId={projectId || undefined}
          />
        )}

        {activeTab === "obligations" && (
          <ClientObligationsView 
            projectId={projectId || undefined}
          />
        )}

        {activeTab === "details" && (
          <ClientPaymentsView 
            projectId={projectId || undefined}
            initialFilterMonth={drillDownFilters.filterMonth}
            initialFilterClient={drillDownFilters.filterClient}
            onClearDrillDown={() => setDrillDownFilters({})}
          />
        )}

        {activeTab === "schedule" && (
          <ClientScheduleView 
            projectId={projectId || undefined}
          />
        )}

        {activeTab === "portal" && (
          <ClientPortalConfigView 
            projectId={projectId || undefined}
          />
        )}

        {activeTab === "settings" && (
          <ClientSettingsView />
        )}
      </div>
    </Layout>
  )
}

export default ClientsPage;
