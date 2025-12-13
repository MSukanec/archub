import { TrendingUp, TrendingDown, Wallet, HandHeart } from 'lucide-react';
import { useMemo } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { usePartnerMovements } from '@/features/finances/hooks/use-partner-movements';
import { usePartnerMetrics } from '@/features/finances/hooks/use-partner-metrics';
import { usePartners } from '@/features/partners';
import PartnerBalanceAccordion from '@/features/finances/components/PartnerBalanceAccordion';

export function PartnerBalancesTab() {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  const { data: movements = [], isLoading: loadingMovements } = usePartnerMovements(organizationId);
  const { data: defaultCurrency, isLoading: loadingCurrency } = useOrganizationDefaultCurrency(organizationId);
  const { data: partners = [], isLoading: loadingPartners } = usePartners(organizationId, { enabled: !!organizationId });

  const {
    totalContributions,
    totalWithdrawals,
    totalInPrimaryCurrency,
    contributionsByCurrency,
    withdrawalsByCurrency,
    balanceByCurrency,
    balanceByPartner,
  } = usePartnerMetrics(movements, defaultCurrency?.code);

  // Enrich balance data with linkedUser from partners
  const balanceByPartnerWithLinkedUser = useMemo(() => {
    return balanceByPartner.map(balance => {
      const partnerData = partners.find(p => p.id === balance.partnerId);
      const linkedUser = partnerData?.contacts?.linked_user;
      const resolvedLinkedUser = Array.isArray(linkedUser) ? linkedUser[0] : linkedUser;
      
      return {
        ...balance,
        linkedUser: resolvedLinkedUser,
      };
    });
  }, [balanceByPartner, partners]);

  const isLoading = loadingMovements || loadingCurrency || loadingPartners;
  const currencySymbol = defaultCurrency?.symbol || '$';

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(absAmount);
  };

  const formatBreakdown = (items: Array<{ currencySymbol: string; amount: number }>) => {
    if (!items || items.length === 0) return '';
    if (items.length === 1) return items[0].currencySymbol;
    return items.map(({ currencySymbol: sym, amount }) => {
      const formattedAmount = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.abs(amount));
      return `${sym} ${formattedAmount}`;
    }).join(' + ');
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se pudo cargar la información de la organización</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (balanceByPartner.length === 0) {
    return (
      <EmptyState
        icon={<HandHeart />}
        title="No hay movimientos de socios"
        description="Registra aportes o retiros de socios para ver el balance por cada uno aquí."
      />
    );
  }

  const isPositiveBalance = totalInPrimaryCurrency >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard data-testid="stat-card-total-aportes">
          <StatCardTitle showArrow={false}>
            <TrendingUp className="w-4 h-4 inline mr-1 text-green-600" />
            Total Aportes
          </StatCardTitle>
          <StatCardValue className="text-green-600">
            {currencySymbol} {formatCurrency(totalContributions)}
          </StatCardValue>
          <StatCardMeta>
            {contributionsByCurrency.length > 1 
              ? formatBreakdown(contributionsByCurrency)
              : `${movements.filter(m => m.amount >= 0).length} aportes confirmados`
            }
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-total-retiros">
          <StatCardTitle showArrow={false}>
            <TrendingDown className="w-4 h-4 inline mr-1 text-red-600" />
            Total Retiros
          </StatCardTitle>
          <StatCardValue className="text-red-600">
            {currencySymbol} {formatCurrency(totalWithdrawals)}
          </StatCardValue>
          <StatCardMeta>
            {withdrawalsByCurrency.length > 1 
              ? formatBreakdown(withdrawalsByCurrency)
              : `${movements.filter(m => m.amount < 0).length} retiros confirmados`
            }
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-saldo-neto">
          <StatCardTitle showArrow={false}>
            <Wallet className="w-4 h-4 inline mr-1" />
            Saldo Neto
          </StatCardTitle>
          <StatCardValue className={isPositiveBalance ? "text-green-600" : "text-red-600"}>
            {isPositiveBalance ? '' : '-'}{currencySymbol} {formatCurrency(totalInPrimaryCurrency)}
          </StatCardValue>
          <StatCardMeta>
            {balanceByCurrency.length > 1 
              ? formatBreakdown(balanceByCurrency.map(c => ({ currencySymbol: c.currencySymbol, amount: c.balance })))
              : 'Aportes - Retiros'
            }
          </StatCardMeta>
        </StatCard>
      </div>

      <PartnerBalanceAccordion 
        partners={balanceByPartnerWithLinkedUser}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
