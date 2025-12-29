import { useState, useMemo, useCallback, useEffect } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { DollarSign, Plus, Calendar, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/features/users/hooks";
import { useProjectContext } from "@/stores/projectContext";
import { useNavigationStore } from "@/stores/navigationStore";
import { Button } from "@/components/ui/button";
import { useGlobalModalStore } from "@/components/modal";
import { useUnifiedMovements } from "@/features/finances/hooks/use-unified-movements";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ProjectFinancesDashboardView, 
  ProjectFinancesMovementsView,
  calculateAvailablePeriods, 
  type PeriodFilter 
} from "@/features/finances";
import { useFinancesDataHealth, DataHealthAlertMulti } from "@/core/data-health";
import { useOrganizationDefaultCurrency, useOrgCurrencyContext } from "@/hooks/use-currencies";
import { LoadingSpinner } from "@/components/shared/layout/LoadingSpinner";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'all', label: 'Histórico' },
];

const FINANCES_TABS = [
  { id: "dashboard", label: "Visión General" },
  { id: "movements", label: "Movimientos" },
];

export function ProjectFinancesPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const [dismissedIssueIds, setDismissedIssueIds] = useState<Set<string>>(new Set());
  const [activeFilterIssueId, setActiveFilterIssueId] = useState<string | null>(null);
  
  const { data: userData } = useCurrentUser();
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { setSidebarLevel } = useNavigationStore();
  
  const organizationId = currentOrganizationId || userData?.organization?.id;
  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  useEffect(() => {
    setSidebarLevel('project');
  }, [setSidebarLevel]);

  const { data: allMovements = [], isLoading: movementsLoading } = useUnifiedMovements(organizationId, selectedProjectId || undefined);
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
                {!isAvailable && option.value !== 'all' && <span className="ml-auto text-xs text-muted-foreground">(sin datos)</span>}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );

  const headerProps = {
    icon: DollarSign,
    title: "Finanzas del Proyecto",
    description: "Movimientos financieros de este proyecto",
    tabs: FINANCES_TABS.map(tab => ({ ...tab, isActive: activeTab === tab.id })),
    onTabChange: setActiveTab,
    organizationId,
    showMembers: true,
    showProjectSelector: true,
    actions: activeTab === "dashboard" ? [periodContent] : [],
    actionButton: activeTab === "movements" ? {
      label: "Nuevo Movimiento",
      icon: Plus,
      onClick: () => openModal('unified-payment', {
        organizationId,
        projectId: selectedProjectId || undefined,
        isProjectContext: true,
      }),
    } : undefined,
  };

  const isProjectReady = !!selectedProjectId;

  const renderContent = () => {
    if (!isProjectReady) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {activeTab === "dashboard" && (
          <ProjectFinancesDashboardView
            movements={allMovements}
            organizationId={organizationId}
            onNavigateToMovements={() => setActiveTab('movements')}
            onNavigateToTab={(tab) => {
              if (tab === 'movements') setActiveTab('movements');
            }}
            onScrollToPanel={(panelId) => {
              const panelIdToTestId: Record<string, string> = {
                monthlyChart: 'chart-monthly-trend',
                categoryBreakdown: 'chart-category-breakdown'
              };
              const testId = panelIdToTestId[panelId] || `chart-${panelId}`;
              const element = document.querySelector(`[data-testid="${testId}"]`);
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
          <ProjectFinancesMovementsView 
            projectId={selectedProjectId}
            externalFilterIssueId={activeFilterIssueId}
            onClearExternalFilter={() => setActiveFilterIssueId(null)}
            getAffectedIdsForIssue={dataHealth.getAffectedIdsForIssue}
          />
        )}
      </div>
    );
  };

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true} 
        organizationId={organizationId}
        showMembers={true}
        tabs={FINANCES_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        toolbarProps={{
          secondaryRightSlot: periodContent,
        }}
      >
        {renderContent()}
      </LabLayout>
    );
  }

  return (
    <Layout wide={false} headerProps={headerProps}>
      <div className="space-y-6">
        {renderContent()}
      </div>
    </Layout>
  );
}
