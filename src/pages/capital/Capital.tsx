import { useEffect, useState, useCallback, useMemo } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import CapitalDashboardTab, { calculateAvailablePeriods, type PeriodFilter } from '@/pages/capital/tabs/CapitalDashboardTab';
import { CapitalParticipantsListTab } from '@/pages/capital/tabs/CapitalParticipantsListTab';
import { CapitalBalancesTab } from '@/pages/capital/tabs/CapitalBalancesTab';
import { CapitalTransactionsTab } from '@/pages/capital/tabs/CapitalTransactionsTab';
import { HandHeart, Plus, ChevronDown, Check } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';
import { usePartners, usePartnerContributions, usePartnerWithdrawals } from '@/features/capital';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useCapitalDataHealth, DataHealthAlertMulti, type NormalizedCapitalTransaction } from '@/core/data-health';

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'all', label: 'Histórico' },
];

export default function Capital() {
  const { setSidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const organizationId = userData?.organization?.id;

  const { data: partners = [] } = usePartners(organizationId);
  const hasPartners = partners.length > 0;
  const { data: contributions = [] } = usePartnerContributions(organizationId);
  const { data: withdrawals = [] } = usePartnerWithdrawals(organizationId);
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);

  const availablePeriods = useMemo(() => {
    return calculateAvailablePeriods(contributions, withdrawals);
  }, [contributions, withdrawals]);

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
    enabled: !!organizationId && normalizedTransactions.length > 0,
  });

  useEffect(() => {
    if (showOnlyProblems && !dataHealth.hasIssues) {
      setShowOnlyProblems(false);
    }
  }, [showOnlyProblems, dataHealth.hasIssues]);

  const handleDataHealthClick = useCallback(() => {
    if (activeTab !== 'transactions') {
      setActiveTab('transactions');
      setShowOnlyProblems(true);
    } else {
      setShowOnlyProblems(prev => !prev);
    }
  }, [activeTab]);

  const handleAddParticipant = () => {
    openModal('capital-participant', { organizationId });
  };

  const handleAddTransaction = () => {
    openModal('capital-transaction', { organizationId });
  };

  const handleNavigateToTab = useCallback((tab: string, filters?: Record<string, unknown>) => {
    setActiveTab(tab);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Visión General', isActive: activeTab === 'dashboard' },
    { id: 'list', label: 'Participantes', isActive: activeTab === 'list' },
    { id: 'balances', label: 'Balances', isActive: activeTab === 'balances', disabled: !hasPartners },
    { id: 'transactions', label: 'Transacciones', isActive: activeTab === 'transactions', disabled: !hasPartners }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <CapitalDashboardTab 
            selectedPeriod={selectedPeriod}
            onNavigateToList={() => setActiveTab('list')}
            onNavigateToBalances={() => setActiveTab('balances')}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToTab={handleNavigateToTab}
          />
        );
      case 'list':
        return <CapitalParticipantsListTab />;
      case 'balances':
        return <CapitalBalancesTab />;
      case 'transactions':
        return (
          <CapitalTransactionsTab 
            showOnlyProblems={showOnlyProblems}
            affectedIds={dataHealth.affectedIds}
          />
        );
      default:
        return (
          <CapitalDashboardTab 
            selectedPeriod={selectedPeriod}
            onNavigateToList={() => setActiveTab('list')}
            onNavigateToBalances={() => setActiveTab('balances')}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToTab={handleNavigateToTab}
          />
        );
    }
  };

  const periodFilterComponent = activeTab === 'dashboard' ? (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="bg-accent text-white hover:bg-accent/90 rounded-lg px-3 py-1.5 gap-2 text-sm font-medium shadow-button-normal hover:shadow-button-hover hover:-translate-y-0.5 inline-flex items-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        data-testid="button-period-filter"
      >
        {periodOptions.find(p => p.value === selectedPeriod)?.label}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {periodOptions.map((option) => {
          const isAvailable = availablePeriods[option.value];
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => isAvailable && setSelectedPeriod(option.value)}
              disabled={!isAvailable}
              className={selectedPeriod === option.value ? "font-medium text-black dark:text-white" : ""}
              data-testid={`menu-item-period-${option.value}`}
            >
              <span>{option.label}</span>
              {!isAvailable && option.value !== 'all' && <span className="ml-auto text-xs text-muted-foreground">(sin datos)</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  const headerProps = {
    icon: HandHeart,
    title: "Capital",
    description: "Gestiona los participantes de capital y sus aportes",
    organizationId: organizationId ?? undefined,
    showMembers: true,
    tabs,
    onTabChange: setActiveTab,
    ...(activeTab === 'dashboard' && {
      actions: periodFilterComponent ? [periodFilterComponent] : []
    }),
    ...(activeTab === 'list' && {
      actionButton: {
        label: "Agregar Participante",
        icon: Plus,
        onClick: handleAddParticipant
      }
    }),
    ...(activeTab === 'transactions' && {
      actionButton: {
        label: "Nueva Transacción",
        icon: Plus,
        onClick: handleAddTransaction
      }
    })
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      <div className="space-y-6">
        {dataHealth.result?.issues && (
          <DataHealthAlertMulti
            issues={dataHealth.result.issues}
            entityLabel="transacción"
            isFiltering={showOnlyProblems}
            onToggleFilter={handleDataHealthClick}
            showClearButton
          />
        )}
        {renderTabContent()}
      </div>
    </Layout>
  );
}
