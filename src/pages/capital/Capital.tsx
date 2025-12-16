import { useEffect, useState, useCallback, useMemo } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import CapitalDashboardTab, { calculateAvailablePeriods, type PeriodFilter } from '@/pages/capital/tabs/CapitalDashboardTab';
import { CapitalParticipantsListTab } from '@/pages/capital/tabs/CapitalParticipantsListTab';
import { CapitalBalancesTab } from '@/pages/capital/tabs/CapitalBalancesTab';
import { CapitalTransactionsTab } from '@/pages/capital/tabs/CapitalTransactionsTab';
import { HandHeart, Plus, TrendingUp, TrendingDown, ChevronDown, Check } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';
import { usePartnerContributions, usePartnerWithdrawals } from '@/features/capital';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const organizationId = userData?.organization?.id;

  const { data: contributions = [] } = usePartnerContributions(organizationId);
  const { data: withdrawals = [] } = usePartnerWithdrawals(organizationId);

  const availablePeriods = useMemo(() => {
    return calculateAvailablePeriods(contributions, withdrawals);
  }, [contributions, withdrawals]);

  const handleAddParticipant = () => {
    openModal('capital-participant', { organizationId });
  };

  const handleAddContribution = () => {
    openModal('capital-contribution', { organizationId });
  };

  const handleAddWithdrawal = () => {
    openModal('capital-withdrawal', { organizationId });
  };

  const handleNavigateToTab = useCallback((tab: string, filters?: Record<string, unknown>) => {
    setActiveTab(tab);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Visión General', isActive: activeTab === 'dashboard' },
    { id: 'list', label: 'Participantes', isActive: activeTab === 'list' },
    { id: 'balances', label: 'Balances', isActive: activeTab === 'balances' },
    { id: 'transactions', label: 'Transacciones', isActive: activeTab === 'transactions' }
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
        return <CapitalTransactionsTab />;
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
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1" data-testid="button-period-filter">
          {periodOptions.find(p => p.value === selectedPeriod)?.label}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {periodOptions.map((option) => {
          const isAvailable = availablePeriods[option.value];
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => isAvailable && setSelectedPeriod(option.value)}
              disabled={!isAvailable}
              className={cn(
                "flex items-center justify-between",
                !isAvailable && "opacity-50 cursor-not-allowed"
              )}
              data-testid={`menu-item-period-${option.value}`}
            >
              <span>{option.label}</span>
              {selectedPeriod === option.value && (
                <Check className="h-4 w-4" />
              )}
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
      actions: [
        <DropdownMenu key="add-transaction">
          <DropdownMenuTrigger asChild>
            <Button className="h-8 px-3 text-xs" data-testid="button-add-transaction">
              <Plus className="w-4 h-4 mr-1" />
              Nueva Transacción
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleAddContribution} data-testid="menu-item-add-contribution">
              <TrendingUp className="w-4 h-4 mr-2 text-[var(--chart-positive)]" />
              Nuevo Aporte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddWithdrawal} data-testid="menu-item-add-withdrawal">
              <TrendingDown className="w-4 h-4 mr-2 text-[var(--chart-negative)]" />
              Nuevo Retiro
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ]
    })
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      {renderTabContent()}
    </Layout>
  );
}
