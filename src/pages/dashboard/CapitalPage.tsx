import { useEffect, useState, useCallback, useMemo } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { CapitalDashboardView, calculateAvailablePeriods, type PeriodFilter } from '@/features/capital/views/CapitalDashboardView';
import { CapitalParticipantsListView } from '@/features/capital/views/CapitalParticipantsListView';
import { CapitalBalancesView } from '@/features/capital/views/CapitalBalancesView';
import { CapitalTransactionsView } from '@/features/capital/views/CapitalTransactionsView';
import { HandHeart, Plus, ChevronDown, Calendar } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';
import { usePartners, usePartnerContributions, usePartnerWithdrawals } from '@/features/capital';
import { useOrganizationDefaultCurrency, useOrgCurrencyContext } from '@/hooks/use-currencies';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCapitalDataHealth, DataHealthAlertMulti, type NormalizedCapitalTransaction } from '@/core/data-health';

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'all', label: 'Histórico' },
];

const CAPITAL_TABS = [
  { id: 'dashboard', label: 'Visión General' },
  { id: 'list', label: 'Participantes' },
  { id: 'balances', label: 'Balances' },
  { id: 'transactions', label: 'Transacciones' },
];

export default function CapitalPage() {
  const { setSidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [activeFilterIssueId, setActiveFilterIssueId] = useState<string | null>(null);
  const [dismissedIssueIds, setDismissedIssueIds] = useState<Set<string>>(new Set());

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const organizationId = userData?.organization?.id;

  const { data: partners = [] } = usePartners(organizationId);
  const hasPartners = partners.length > 0;
  const { data: contributions = [] } = usePartnerContributions(organizationId);
  const { data: withdrawals = [] } = usePartnerWithdrawals(organizationId);
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);
  const { isMultiCurrency } = useOrgCurrencyContext(organizationId);

  const availablePeriods = useMemo(() => {
    return calculateAvailablePeriods(contributions, withdrawals);
  }, [contributions, withdrawals]);

  const validSelectedPeriod = useMemo(() => {
    if (availablePeriods[selectedPeriod]) return selectedPeriod;
    return 'all';
  }, [selectedPeriod, availablePeriods]);

  useEffect(() => {
    if (validSelectedPeriod !== selectedPeriod) {
      setSelectedPeriod(validSelectedPeriod);
    }
  }, [validSelectedPeriod, selectedPeriod]);

  const normalizedTransactions = useMemo<NormalizedCapitalTransaction[]>(() => {
    const contributionItems = contributions.map((c: any) => ({
      id: c.id,
      type: 'contribution' as const,
      partnerName: c.partner?.contacts?.full_name || 'Sin socio',
      walletId: c.wallet_id || null,
      walletName: c.organization_wallet?.wallets?.name || null,
      date: c.contribution_date,
      amount: c.amount,
      currencyId: c.currency_id,
      exchangeRate: c.exchange_rate || null,
    }));

    const withdrawalItems = withdrawals.map((w: any) => ({
      id: w.id,
      type: 'withdrawal' as const,
      partnerName: w.partner?.contacts?.full_name || 'Sin socio',
      walletId: w.wallet_id || null,
      walletName: w.organization_wallet?.wallets?.name || null,
      date: w.withdrawal_date,
      amount: w.amount,
      currencyId: w.currency_id,
      exchangeRate: w.exchange_rate || null,
    }));

    return [...contributionItems, ...withdrawalItems];
  }, [contributions, withdrawals]);

  const dataHealth = useCapitalDataHealth(normalizedTransactions, {
    organizationId: organizationId || '',
    defaultCurrencyId: defaultCurrency?.id,
    isMultiCurrency,
    enabled: !!organizationId && normalizedTransactions.length > 0,
  });

  useEffect(() => {
    if (activeFilterIssueId && !dataHealth.hasIssues) {
      setActiveFilterIssueId(null);
    }
  }, [activeFilterIssueId, dataHealth.hasIssues]);

  const filteredTransactionIds = useMemo(() => {
    if (!activeFilterIssueId) return null;
    return dataHealth.getAffectedIdsForIssue(activeFilterIssueId);
  }, [activeFilterIssueId, dataHealth]);

  const handleDataHealthClick = useCallback((issueId: string) => {
    if (activeTab !== 'transactions') {
      setActiveTab('transactions');
      setActiveFilterIssueId(issueId);
    } else {
      if (activeFilterIssueId === issueId) {
        setActiveFilterIssueId(null);
      } else {
        setActiveFilterIssueId(issueId);
      }
    }
  }, [activeTab, activeFilterIssueId]);

  const handleAddParticipant = () => {
    openModal('capital-participant', { organizationId });
  };

  const handleAddTransaction = () => {
    openModal('capital-transaction', { organizationId });
  };

  const handleNavigateToTab = useCallback((tab: string, filters?: Record<string, unknown>) => {
    setActiveTab(tab);
  }, []);

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <CapitalDashboardView 
            selectedPeriod={validSelectedPeriod}
            onNavigateToList={() => setActiveTab('list')}
            onNavigateToBalances={() => setActiveTab('balances')}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToTab={handleNavigateToTab}
          />
        );
      case 'list':
        return <CapitalParticipantsListView />;
      case 'balances':
        return <CapitalBalancesView />;
      case 'transactions':
        return (
          <CapitalTransactionsView 
            activeFilterIssueId={activeFilterIssueId}
            getAffectedIdsForIssue={dataHealth.getAffectedIdsForIssue}
          />
        );
      default:
        return (
          <CapitalDashboardView 
            selectedPeriod={validSelectedPeriod}
            onNavigateToList={() => setActiveTab('list')}
            onNavigateToBalances={() => setActiveTab('balances')}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToTab={handleNavigateToTab}
          />
        );
    }
  };

  const dataHealthAlert = dataHealth.result?.issues && dataHealth.result.issues.length > 0 ? (
    <DataHealthAlertMulti
      issues={dataHealth.result.issues}
      entityLabel="transacción"
      activeFilterIssueId={activeFilterIssueId}
      onToggleFilter={handleDataHealthClick}
      dismissedIssueIds={dismissedIssueIds}
      onDismissIssue={(issueId: string) => {
        if (activeFilterIssueId === issueId) {
          setActiveFilterIssueId(null);
        }
        setDismissedIssueIds(prev => new Set([...Array.from(prev), issueId]));
      }}
      filteredItemIds={filteredTransactionIds || undefined}
    />
  ) : null;

  const periodContent = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          data-testid="button-period-filter"
        >
          <Calendar className="h-4 w-4" />
          <span>{PERIOD_OPTIONS.find(p => p.value === validSelectedPeriod)?.label}</span>
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
              data-testid={`menu-item-period-${option.value}`}
            >
              <span>{option.label}</span>
              {!isAvailable && option.value !== 'all' && <span className="ml-auto text-xs text-muted-foreground">(sin datos)</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const getActionButton = () => {
    if (activeTab === 'list') {
      return {
        label: "Agregar Participante",
        icon: Plus,
        onClick: handleAddParticipant
      };
    }
    if (activeTab === 'transactions' && hasPartners) {
      return {
        label: "Nueva Transacción",
        icon: Plus,
        onClick: handleAddTransaction
      };
    }
    return undefined;
  };

  const tabs = CAPITAL_TABS.map(tab => ({
    ...tab,
    isActive: activeTab === tab.id,
    disabled: (tab.id === 'balances' || tab.id === 'transactions') && !hasPartners,
  }));

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true}
        organizationId={organizationId}
        showMembers={true}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div className="space-y-6">
          {dataHealthAlert}
          {renderView()}
        </div>
      </LabLayout>
    );
  }

  const headerProps = {
    icon: HandHeart,
    title: "Capital",
    description: "Gestiona los participantes de capital y sus aportes",
    organizationId: organizationId ?? undefined,
    showMembers: true,
    tabs,
    onTabChange: setActiveTab,
    actions: activeTab === 'dashboard' ? [periodContent] : [],
    actionButton: getActionButton(),
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      <div className="space-y-6">
        {dataHealthAlert}
        {renderView()}
      </div>
    </Layout>
  );
}
