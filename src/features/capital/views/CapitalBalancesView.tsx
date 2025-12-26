import { TrendingUp, TrendingDown, Wallet, HandHeart, Scale } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
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

  const { data: defaultCurrency, isLoading: loadingCurrency } = useOrganizationDefaultCurrency(organizationId);
  const { data: partners = [], isLoading: loadingPartners } = usePartners(organizationId, { enabled: !!organizationId });
  const { data: kpiData = [], isLoading: loadingKPI } = usePartnerCapitalKPI(organizationId, { enabled: !!organizationId });

  // All totals come directly from the SQL view (first row has org totals)
  const orgTotals = kpiData.length > 0 ? kpiData[0] : null;
  const totalContributions = orgTotals?.org_total_contributions ?? 0;
  const totalWithdrawals = orgTotals?.org_total_withdrawals ?? 0;
  const totalAdjustments = orgTotals?.org_total_adjustments ?? 0;
  const totalNetCapital = orgTotals?.org_total_net_capital ?? 0;

  // Build enriched balances from KPI data
  const enrichedBalances: EnrichedPartnerBalance[] = kpiData.map(kpi => {
    const partnerData = partners.find(p => p.id === kpi.partner_id);
    const partnerName = partnerData?.contacts?.full_name 
      || partnerData?.contacts?.company_name 
      || 'Sin nombre';
    const linkedUser = partnerData?.contacts?.linked_user;
    const resolvedLinkedUser = Array.isArray(linkedUser) ? linkedUser[0] : linkedUser;

    return {
      partnerId: kpi.partner_id,
      partnerName,
      balance: kpi.current_balance,
      ownershipPercentage: kpi.ownership_percentage,
      partner_contributed: kpi.total_contributed,
      expected_contribution: kpi.expected_contribution,
      deviation_contribution: kpi.deviation_contribution,
      contribution_status: kpi.contribution_status,
      expected_net_capital: kpi.expected_net_capital,
      deviation_net: kpi.deviation_net,
      net_status: kpi.net_status,
      linkedUser: resolvedLinkedUser,
    };
  }).sort((a, b) => (b.ownershipPercentage ?? 0) - (a.ownershipPercentage ?? 0));

  const isLoading = loadingCurrency || loadingPartners || loadingKPI;
  const currencySymbol = defaultCurrency?.symbol || '$';

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(absAmount);
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

  if (kpiData.length === 0) {
    return (
      <EmptyState
        icon={<HandHeart />}
        title="No hay movimientos de capital"
        description="Registra aportes o retiros de socios para ver el balance por cada uno aquí."
      />
    );
  }

  const isPositiveNetCapital = totalNetCapital >= 0;

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
            Aportes confirmados
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
            Retiros confirmados
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-saldo-neto">
          <StatCardTitle showArrow={false}>
            <Wallet className="h-4 w-4" />
            Saldo Neto
          </StatCardTitle>
          <StatCardValue className={isPositiveNetCapital ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
            {isPositiveNetCapital ? '' : '-'}{currencySymbol} {formatCurrency(totalNetCapital)}
          </StatCardValue>
          <StatCardMeta>
            Aportes - Retiros + Ajustes
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-partners-count">
          <StatCardTitle showArrow={false}>
            <HandHeart className="h-4 w-4" />
            Socios
          </StatCardTitle>
          <StatCardValue>
            {kpiData.length}
          </StatCardValue>
          <StatCardMeta>
            Participantes con movimientos
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
