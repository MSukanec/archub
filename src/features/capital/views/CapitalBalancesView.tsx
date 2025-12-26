import { TrendingUp, TrendingDown, Wallet, HandHeart, Scale, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useMemo } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { Badge } from '@/components/ui/badge';
import { usePartnerMovements } from '@/features/finances/hooks/use-partner-movements';
import { usePartnerMetrics } from '@/features/finances/hooks/use-partner-metrics';
import { usePartners, usePartnerCapitalKPI, type PartnerCapitalKPI } from '@/features/capital';
import { cn } from '@/lib/utils';

type EquilibriumStatus = PartnerCapitalKPI['equilibrium_status'];

interface EnrichedPartnerBalance {
  partnerId: string;
  partnerName: string;
  balance: number;
  ownershipPercentage: number | null;
  capitalEsperado: number | null;
  desvioCapital: number | null;
  equilibriumStatus: EquilibriumStatus;
  linkedUser?: { avatar_url?: string | null } | null;
}

function getEquilibriumConfig(status: EquilibriumStatus) {
  switch (status) {
    case 'equilibrado':
      return {
        icon: Scale,
        label: 'En equilibrio',
        badgeVariant: 'success' as const,
        className: 'text-chart-positive',
        bgClassName: 'bg-chart-positive/10 border-chart-positive/20',
      };
    case 'sobre_aportado':
      return {
        icon: ArrowUp,
        label: 'Sobre aportado',
        badgeVariant: 'info' as const,
        className: 'text-chart-info',
        bgClassName: 'bg-chart-info/10 border-chart-info/20',
      };
    case 'bajo_aportado':
      return {
        icon: ArrowDown,
        label: 'Bajo aportado',
        badgeVariant: 'warning' as const,
        className: 'text-chart-warning',
        bgClassName: 'bg-chart-warning/10 border-chart-warning/20',
      };
    case 'sin_porcentaje':
    default:
      return {
        icon: Minus,
        label: 'Sin % asignado',
        badgeVariant: 'neutral' as const,
        className: 'text-muted-foreground',
        bgClassName: 'bg-muted/50 border-muted',
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

  const capitalTotal = useMemo(() => {
    if (kpiData.length === 0) return 0;
    return kpiData[0]?.capital_total ?? 0;
  }, [kpiData]);

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
        capitalEsperado: kpi?.capital_esperado ?? null,
        desvioCapital: kpi?.desvio_capital ?? null,
        equilibriumStatus: kpi?.equilibrium_status ?? 'sin_porcentaje',
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
          const config = getEquilibriumConfig(partner.equilibriumStatus);
          const StatusIcon = config.icon;
          const hasPercentage = partner.ownershipPercentage !== null;

          return (
            <div
              key={partner.partnerId}
              data-testid={`partner-balance-card-${partner.partnerId}`}
              className={cn(
                "relative p-4 rounded-lg border transition-colors",
                config.bgClassName
              )}
            >
              <div className="absolute top-3 right-3">
                <Badge variant={config.badgeVariant} className="text-xs">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <IdentityBadge
                  name={partner.partnerName}
                  linkedUser={partner.linkedUser}
                  showName={false}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{partner.partnerName}</h3>
                  {hasPercentage && (
                    <span className="text-xs text-muted-foreground">
                      {partner.ownershipPercentage?.toFixed(1)}% de participación
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Balance Actual</div>
                  <div className={cn(
                    "text-lg font-bold",
                    partner.balance >= 0 ? "text-foreground" : "text-chart-negative"
                  )}>
                    {partner.balance < 0 ? '-' : ''}{currencySymbol} {formatCurrency(partner.balance)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Capital Esperado</div>
                  <div className="text-lg font-medium text-muted-foreground">
                    {partner.capitalEsperado !== null 
                      ? `${currencySymbol} ${formatCurrency(partner.capitalEsperado)}`
                      : '—'
                    }
                  </div>
                </div>
              </div>

              {hasPercentage && partner.desvioCapital !== null && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Desvío</span>
                    <span className={cn(
                      "text-sm font-semibold",
                      partner.desvioCapital > 0 
                        ? "text-chart-positive" 
                        : partner.desvioCapital < 0 
                          ? "text-chart-negative" 
                          : "text-muted-foreground"
                    )}>
                      {partner.desvioCapital > 0 ? '+' : ''}{currencySymbol} {formatCurrency(partner.desvioCapital)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
