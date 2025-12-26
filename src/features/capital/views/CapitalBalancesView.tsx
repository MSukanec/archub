import { TrendingUp, TrendingDown, Wallet, HandHeart } from 'lucide-react';
import { useMemo } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { usePartnerMovements } from '@/features/finances/hooks/use-partner-movements';
import { usePartnerMetrics } from '@/features/finances/hooks/use-partner-metrics';
import { usePartners, usePartnerCapitalKPI, type PartnerCapitalKPI } from '@/features/capital';
import { CapitalBalanceCard } from '@/features/capital/components/CapitalBalanceCard';

interface EnrichedPartnerBalance {
  partnerId: string;
  partnerName: string;
  balance: number;
  ownershipPercentage: number | null;
  partner_contributed: number;
  expected_contribution: number | null;
  deviation_contribution: number | null;
  contribution_status: PartnerCapitalKPI['contribution_status'];
  expected_net_capital: number | null;
  deviation_net: number | null;
  net_status: PartnerCapitalKPI['net_status'];
  linkedUser?: { avatar_url?: string | null } | null;
}

export function CapitalBalancesView() {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  const { data: movements = [], isLoading: loadingMovements } = usePartnerMovements(organizationId);
  const { data: defaultCurrency, isLoading: loadingCurrency } = useOrganizationDefaultCurrency(organizationId);
  const { data: partners = [], isLoading: loadingPartners } = usePartners(organizationId, { enabled: !!organizationId });
  const { data: kpiData = [], isLoading: loadingKPI } = usePartnerCapitalKPI(organizationId, { enabled: !!organizationId });

  const {
    totalContributions,
    totalWithdrawals,
    totalInPrimaryCurrency,
    contributionsByCurrency,
    withdrawalsByCurrency,
    balanceByCurrency,
    balanceByPartner,
  } = usePartnerMetrics(movements, defaultCurrency?.code);

  // Calculate total adjustments from KPI data
  const totalAdjustments = kpiData.length > 0 ? kpiData[0]?.total_adjustments ?? 0 : 0;

  const enrichedBalances = useMemo<EnrichedPartnerBalance[]>(() => {
    if (balanceByPartner.length === 0) return [];

    return balanceByPartner.map(balance => {
      const partnerData = partners.find(p => p.id === balance.partnerId);
      const linkedUser = partnerData?.contacts?.linked_user;
      const resolvedLinkedUser = Array.isArray(linkedUser) ? linkedUser[0] : linkedUser;

      const kpi = kpiData.find(k => k.partner_id === balance.partnerId);

      return {
        partnerId: balance.partnerId,
        partnerName: balance.partnerName,
        balance: balance.balance,
        ownershipPercentage: kpi?.ownership_percentage ?? null,
        partner_contributed: kpi?.partner_contributed ?? 0,
        expected_contribution: kpi?.expected_contribution ?? null,
        deviation_contribution: kpi?.deviation_contribution ?? null,
        contribution_status: kpi?.contribution_status ?? 'sin_porcentaje',
        expected_net_capital: kpi?.expected_net_capital ?? null,
        deviation_net: kpi?.deviation_net ?? null,
        net_status: kpi?.net_status ?? 'sin_porcentaje',
        linkedUser: resolvedLinkedUser,
      };
    }).sort((a, b) => (b.ownershipPercentage ?? 0) - (a.ownershipPercentage ?? 0));
  }, [balanceByPartner, partners, kpiData]);

  const isLoading = loadingMovements || loadingCurrency || loadingPartners || loadingKPI;
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
        title="No hay movimientos de capital"
        description="Registra aportes o retiros de socios para ver el balance por cada uno aquí."
      />
    );
  }

  const isPositiveBalance = totalInPrimaryCurrency >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard data-testid="stat-card-total-aportes">
          <StatCardTitle showArrow={false}>
            <TrendingUp className="h-4 w-4" />
            Total Aportes
          </StatCardTitle>
          <StatCardValue className="text-[var(--positive)]">
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
            <TrendingDown className="h-4 w-4" />
            Total Retiros
          </StatCardTitle>
          <StatCardValue className="text-[var(--negative)]">
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
            <Wallet className="h-4 w-4" />
            Saldo Neto
          </StatCardTitle>
          <StatCardValue className={isPositiveBalance ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
            {isPositiveBalance ? '' : '-'}{currencySymbol} {formatCurrency(totalInPrimaryCurrency)}
          </StatCardValue>
          <StatCardMeta>
            {balanceByCurrency.length > 1 
              ? formatBreakdown(balanceByCurrency.map(c => ({ currencySymbol: c.currencySymbol, amount: c.balance })))
              : 'Aportes - Retiros'
            }
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-partners-count">
          <StatCardTitle showArrow={false}>
            <HandHeart className="h-4 w-4" />
            Socios
          </StatCardTitle>
          <StatCardValue>
            {balanceByPartner.length}
          </StatCardValue>
          <StatCardMeta>
            Participantes con movimientos
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-total-ajustes">
          <StatCardTitle showArrow={false}>
            <Wallet className="h-4 w-4" />
            Total Ajustes
          </StatCardTitle>
          <StatCardValue className={totalAdjustments >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
            {totalAdjustments > 0 ? '+' : ''}{currencySymbol} {formatCurrency(totalAdjustments)}
          </StatCardValue>
          <StatCardMeta>
            {totalAdjustments === 0 ? 'Sin ajustes' : 'Ajustes confirmados'}
          </StatCardMeta>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {enrichedBalances.map((partner) => (
          <CapitalBalanceCard
            key={partner.partnerId}
            partner={partner}
            currencySymbol={currencySymbol}
          />
        ))}
      </div>
    </div>
  );
}
