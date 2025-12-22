import { useState, useEffect, useMemo, useCallback } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { DollarSign, Plus, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationFinancesMovementsTab } from "./OrganizationFinancesMovementsTab";
import OrganizationFinancesDashboardTab, { calculateAvailablePeriods, type PeriodFilter } from "./OrganizationFinancesDashboardTab";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from "@/components/modal/state/globalModalStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useUnifiedMovements } from "@/features/finances/hooks/use-unified-movements";
import { useFinancesDataHealth, DataHealthAlertMulti } from "@/core/data-health";
import { useOrganizationDefaultCurrency, useOrgCurrencyContext } from "@/hooks/use-currencies";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'all', label: 'Histórico' },
];

export default function OrganizationFinances() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [dismissedIssueIds, setDismissedIssueIds] = useState<Set<string>>(new Set());
  const [activeFilterIssueId, setActiveFilterIssueId] = useState<string | null>(null);
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { setSidebarLevel } = useNavigationStore();

  const organizationId = userData?.organization?.id;

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const { data: allMovements = [] } = useUnifiedMovements(organizationId, null);
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);
  const { isMultiCurrency } = useOrgCurrencyContext(organizationId);
  
  const dataHealth = useFinancesDataHealth(allMovements, {
    organizationId: organizationId || '',
    defaultCurrencyId: defaultCurrency?.id,
    isMultiCurrency,
    enabled: !!organizationId && allMovements.length > 0,
  });

  useEffect(() => {
    if (activeFilterIssueId && !dataHealth.hasIssues) {
      setActiveFilterIssueId(null);
    }
  }, [activeFilterIssueId, dataHealth.hasIssues]);

  const filteredMovementIds = useMemo(() => {
    if (!activeFilterIssueId) return null;
    return dataHealth.getAffectedIdsForIssue(activeFilterIssueId);
  }, [activeFilterIssueId, dataHealth]);

  const handleDataHealthClick = useCallback((issueId: string) => {
    if (activeTab !== 'movements') {
      setActiveTab('movements');
      setActiveFilterIssueId(issueId);
    } else {
      if (activeFilterIssueId === issueId) {
        setActiveFilterIssueId(null);
      } else {
        setActiveFilterIssueId(issueId);
      }
    }
  }, [activeTab, activeFilterIssueId]);

  const availablePeriods = useMemo(() => calculateAvailablePeriods(allMovements), [allMovements]);

  const validSelectedPeriod = useMemo(() => {
    if (availablePeriods[selectedPeriod]) return selectedPeriod;
    return 'all';
  }, [selectedPeriod, availablePeriods]);

  useEffect(() => {
    if (validSelectedPeriod !== selectedPeriod) {
      setSelectedPeriod(validSelectedPeriod);
    }
  }, [validSelectedPeriod, selectedPeriod]);

  const handleAddMovement = () => {
    openModal('unified-payment', {
      organizationId,
      projectId: undefined,
      isProjectContext: false,
    });
  };

  const tabs = [
    { id: "dashboard", label: "Visión General", isActive: activeTab === "dashboard" },
    { id: "movements", label: "Movimientos", isActive: activeTab === "movements" },
  ];

  const getPeriodSelector = () => {
    if (activeTab !== "dashboard") return [];
    
    const selectedLabel = PERIOD_OPTIONS.find(opt => opt.value === validSelectedPeriod)?.label || 'Período';
    
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
    ];
  };

  const getActionButton = () => {
    if (activeTab === "movements") {
      return (
        <Button
          key="add-movement"
          onClick={handleAddMovement}
          className="h-8 px-3 text-xs"
          data-testid="button-add-movement"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Movimiento
        </Button>
      );
    }
    return null;
  };

  return (
    <Layout
      wide={false}
      headerProps={{
        icon: DollarSign,
        title: "Finanzas",
        description: "Gestión financiera de toda la organización",
        tabs,
        onTabChange: setActiveTab,
        organizationId,
        showMembers: true,
        showProjectSelector: false,
        actions: (() => {
          const items = [
            ...getPeriodSelector(),
            getActionButton(),
          ].filter(Boolean);
          return items.length > 0 ? items : undefined;
        })(),
      }}
    >
      <div className="space-y-6">
        {dataHealth.result?.issues && dataHealth.result.issues.length > 0 && (
          <DataHealthAlertMulti
            issues={dataHealth.result.issues}
            entityLabel="movimiento"
            activeFilterIssueId={activeFilterIssueId}
            onToggleFilter={handleDataHealthClick}
            dismissedIssueIds={dismissedIssueIds}
            onDismissIssue={(issueId: string) => {
              if (activeFilterIssueId === issueId) {
                setActiveFilterIssueId(null);
              }
              setDismissedIssueIds(prev => new Set([...Array.from(prev), issueId]));
            }}
            filteredItemIds={filteredMovementIds || undefined}
          />
        )}
        
        {activeTab === "dashboard" && (
          <OrganizationFinancesDashboardTab
            movements={allMovements}
            onNavigateToMovements={() => setActiveTab('movements')}
            onNavigateToTab={(tab) => {
              if (tab === 'movements') setActiveTab('movements');
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
        {activeTab === "movements" && (
          <OrganizationFinancesMovementsTab 
            externalFilterIssueId={activeFilterIssueId}
            onClearExternalFilter={() => setActiveFilterIssueId(null)}
            getAffectedIdsForIssue={dataHealth.getAffectedIdsForIssue}
          />
        )}
      </div>
    </Layout>
  );
}
