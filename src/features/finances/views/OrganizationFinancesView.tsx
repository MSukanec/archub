import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationFinancesMovementsView, OrganizationFinancesDashboardView, calculateAvailablePeriods, type PeriodFilter } from "@/features/organization";
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

interface OrganizationFinancesViewProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function OrganizationFinancesView({ activeTab, onTabChange }: OrganizationFinancesViewProps) {
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
      onTabChange('movements');
      setActiveFilterIssueId(issueId);
    } else {
      if (activeFilterIssueId === issueId) {
        setActiveFilterIssueId(null);
      } else {
        setActiveFilterIssueId(issueId);
      }
    }
  }, [activeTab, activeFilterIssueId, onTabChange]);

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

  return (
    <div className="space-y-6 p-6">

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
        <OrganizationFinancesDashboardView
          movements={allMovements}
          onNavigateToMovements={() => onTabChange('movements')}
          onNavigateToTab={(tab) => {
            if (tab === 'movements') onTabChange('movements');
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
        <OrganizationFinancesMovementsView 
          externalFilterIssueId={activeFilterIssueId}
          onClearExternalFilter={() => setActiveFilterIssueId(null)}
          getAffectedIdsForIssue={dataHealth.getAffectedIdsForIssue}
        />
      )}
    </div>
  );
}
