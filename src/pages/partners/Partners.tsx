import { useEffect, useState, useCallback, useMemo } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import PartnersDashboardTab, { calculateAvailablePeriods, type PeriodFilter } from '@/pages/partners/tabs/PartnersDashboardTab';
import { PartnersListTab } from '@/pages/partners/tabs/PartnersListTab';
import { PartnerBalancesTab } from '@/pages/partners/tabs/PartnerBalancesTab';
import { PartnerTransactionsTab } from '@/pages/partners/tabs/PartnerTransactionsTab';
import { HandHeart, Plus, TrendingUp, TrendingDown, ChevronDown, Check } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';
import { usePartnerContributions, usePartnerWithdrawals } from '@/features/partners';
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

export default function Partners() {
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

  const handleAddPartner = () => {
    openModal('partner', { organizationId });
  };

  const handleAddContribution = () => {
    openModal('partner-contribution', { organizationId });
  };

  const handleAddWithdrawal = () => {
    openModal('partner-withdrawal', { organizationId });
  };

  const handleNavigateToTab = useCallback((tab: string, filters?: Record<string, unknown>) => {
    setActiveTab(tab);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Visión General', isActive: activeTab === 'dashboard' },
    { id: 'list', label: 'Socios', isActive: activeTab === 'list' },
    { id: 'balances', label: 'Balances', isActive: activeTab === 'balances' },
    { id: 'transactions', label: 'Transacciones', isActive: activeTab === 'transactions' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <PartnersDashboardTab 
            selectedPeriod={selectedPeriod}
            onNavigateToList={() => setActiveTab('list')}
            onNavigateToBalances={() => setActiveTab('balances')}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToTab={handleNavigateToTab}
          />
        );
      case 'list':
        return <PartnersListTab />;
      case 'balances':
        return <PartnerBalancesTab />;
      case 'transactions':
        return <PartnerTransactionsTab />;
      default:
        return (
          <PartnersDashboardTab 
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
    title: "Socios",
    description: "Gestiona los socios de tu organización y sus participaciones",
    organizationId: organizationId ?? undefined,
    showMembers: true,
    tabs,
    onTabChange: setActiveTab,
    ...(activeTab === 'dashboard' && {
      actions: periodFilterComponent ? [periodFilterComponent] : []
    }),
    ...(activeTab === 'list' && {
      actionButton: {
        label: "Agregar Socio",
        icon: Plus,
        onClick: handleAddPartner
      }
    }),
    ...(activeTab === 'transactions' && {
      actions: [
        <DropdownMenu key="add-transaction">
          <DropdownMenuTrigger asChild>
            <Button className="h-8 px-3 text-xs" data-testid="button-add-transaction">
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Movimiento
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleAddContribution} data-testid="menu-item-add-contribution">
              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
              Nuevo Aporte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddWithdrawal} data-testid="menu-item-add-withdrawal">
              <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
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
