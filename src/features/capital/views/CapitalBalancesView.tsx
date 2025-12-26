import { TrendingUp, TrendingDown, Wallet, HandHeart, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { usePartnerMovements } from '@/features/finances/hooks/use-partner-movements';
import { usePartnerMetrics } from '@/features/finances/hooks/use-partner-metrics';
import { usePartners, usePartnerCapitalKPI } from '@/features/capital';
import { cn } from '@/lib/utils';

type HealthStatus = 'positive' | 'warning' | 'negative';

interface EnrichedPartnerBalance {
  partnerId: string;
  partnerName: string;
  balance: number;
  ownershipRatio: number | null;
  healthStatus: HealthStatus;
  isTopContributor: boolean;
  linkedUser?: { avatar_url?: string | null } | null;
}

function getHealthStatus(balance: number, ownershipRatio: number | null, avgRatio: number): HealthStatus {
  if (balance < 0) return 'negative';
  if (ownershipRatio === null) return 'positive';
  const deviation = Math.abs(ownershipRatio - avgRatio);
  if (deviation > avgRatio * 0.5) return 'warning';
  return 'positive';
}

function getHealthConfig(status: HealthStatus) {
  switch (status) {
    case 'positive':
      return {
        icon: CheckCircle2,
        label: 'Balance positivo',
        className: 'text-chart-positive',
        bgClassName: 'bg-chart-positive/10 border-chart-positive/20',
        barClassName: 'bg-chart-positive',
      };
    case 'warning':
      return {
        icon: AlertCircle,
        label: 'Participación atípica',
        className: 'text-chart-warning',
        bgClassName: 'bg-chart-warning/10 border-chart-warning/20',
        barClassName: 'bg-chart-warning',
      };
    case 'negative':
      return {
        icon: AlertCircle,
        label: 'Balance negativo',
        className: 'text-chart-negative',
        bgClassName: 'bg-chart-negative/10 border-chart-negative/20',
        barClassName: 'bg-chart-negative',
      };
  }
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

  const enrichedBalances = useMemo<EnrichedPartnerBalance[]>(() => {
    if (balanceByPartner.length === 0) return [];

    const totalPartners = balanceByPartner.length;
    const avgRatio = totalPartners > 0 ? 1 / totalPartners : 0;

    return balanceByPartner.map(balance => {
      const partnerData = partners.find(p => p.id === balance.partnerId);
      const linkedUser = partnerData?.contacts?.linked_user;
      const resolvedLinkedUser = Array.isArray(linkedUser) ? linkedUser[0] : linkedUser;

      const kpi = kpiData.find(k => k.partner_id === balance.partnerId);
      const ownershipRatio = kpi?.ownership_ratio ?? null;

      const healthStatus = getHealthStatus(balance.balance, ownershipRatio, avgRatio);
      const isTopContributor = ownershipRatio !== null && ownershipRatio > 0.5;

      return {
        partnerId: balance.partnerId,
        partnerName: balance.partnerName,
        balance: balance.balance,
        ownershipRatio,
        healthStatus,
        isTopContributor,
        linkedUser: resolvedLinkedUser,
      };
    }).sort((a, b) => (b.ownershipRatio ?? 0) - (a.ownershipRatio ?? 0));
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

  const formatPercentage = (ratio: number | null) => {
    if (ratio === null) return '—';
    return `${(ratio * 100).toFixed(1)}%`;
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enrichedBalances.map((partner) => {
          const healthConfig = getHealthConfig(partner.healthStatus);
          const HealthIcon = healthConfig.icon;
          const barWidth = partner.ownershipRatio !== null 
            ? Math.min(partner.ownershipRatio * 100, 100) 
            : 0;

          return (
            <div
              key={partner.partnerId}
              data-testid={`partner-balance-card-${partner.partnerId}`}
              className={cn(
                "relative p-4 rounded-lg border transition-colors",
                healthConfig.bgClassName
              )}
            >
              {partner.isTopContributor && (
                <div className="absolute top-2 right-2">
                  <Star className="h-5 w-5 text-chart-warning fill-chart-warning" />
                </div>
              )}

              <div className="flex items-center gap-3 mb-3">
                <IdentityBadge
                  name={partner.partnerName}
                  linkedUser={partner.linkedUser}
                  showName={false}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{partner.partnerName}</h3>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className={cn(
                    "text-2xl font-bold",
                    partner.balance >= 0 ? "text-foreground" : "text-chart-negative"
                  )}>
                    {partner.balance < 0 ? '-' : ''}{currencySymbol} {formatCurrency(partner.balance)}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground">
                  {formatPercentage(partner.ownershipRatio)} del capital total
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-300", healthConfig.barClassName)}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className={cn("flex items-center gap-1.5 text-xs", healthConfig.className)}>
                  <HealthIcon className="h-3.5 w-3.5" />
                  <span>{healthConfig.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
