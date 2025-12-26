import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PartnerCapitalKPI } from '@/features/capital';

interface CapitalBalanceCardProps {
  partner: {
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
  };
  currencySymbol: string;
  onPartnerClick?: () => void;
}

function getContributionConfig(status: PartnerCapitalKPI['contribution_status']) {
  switch (status) {
    case 'equilibrado':
      return {
        icon: Scale,
        label: 'En equilibrio',
        style: { backgroundColor: 'var(--capital-badge-equal)', color: 'white' },
      };
    case 'sobre_aportado':
      return {
        icon: TrendingUp,
        label: 'Sobre aportado',
        style: { backgroundColor: 'var(--capital-badge-over)', color: 'white' },
      };
    case 'bajo_aportado':
      return {
        icon: TrendingDown,
        label: 'Bajo aportado',
        style: { backgroundColor: 'var(--capital-badge-under)', color: 'white' },
      };
    case 'sin_porcentaje':
    default:
      return {
        icon: Minus,
        label: 'Sin % asignado',
        style: { backgroundColor: 'var(--capital-badge-equal)', color: 'white' },
      };
  }
}

function getNetConfig(status: PartnerCapitalKPI['net_status']) {
  switch (status) {
    case 'equilibrado':
      return {
        icon: Scale,
        label: 'En equilibrio',
        style: { backgroundColor: 'var(--capital-badge-equal)', color: 'white' },
      };
    case 'arriba':
      return {
        icon: TrendingUp,
        label: 'Capital arriba',
        style: { backgroundColor: 'var(--capital-badge-over)', color: 'white' },
      };
    case 'abajo':
      return {
        icon: TrendingDown,
        label: 'Capital abajo',
        style: { backgroundColor: 'var(--capital-badge-under)', color: 'white' },
      };
    case 'sin_porcentaje':
    default:
      return {
        icon: Minus,
        label: 'Sin % asignado',
        style: { backgroundColor: 'var(--capital-badge-equal)', color: 'white' },
      };
  }
}

export function CapitalBalanceCard({
  partner,
  currencySymbol,
  onPartnerClick,
}: CapitalBalanceCardProps) {
  const contributionConfig = getContributionConfig(partner.contribution_status);
  const netConfig = getNetConfig(partner.net_status);
  const ContributionIcon = contributionConfig.icon;
  const NetIcon = netConfig.icon;
  const hasPercentage = partner.ownershipPercentage !== null;

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absAmount);
  };

  const formatSignedCurrency = (amount: number) => {
    return (amount > 0 ? '+' : '') + currencySymbol + ' ' + formatCurrency(amount);
  };

  return (
    <Card
      data-testid={`partner-balance-card-${partner.partnerId}`}
      className="relative p-4 transition-shadow cursor-pointer hover:shadow-lg border border-border/50"
      onClick={onPartnerClick}
    >
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

      {hasPercentage && (
        <>
          {/* BLOQUE APORTES */}
          <div className="space-y-3 mb-4 pb-4 border-b border-border/50">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Aportes</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Aporte del Socio</div>
                  <div className="text-sm font-bold text-foreground">
                    {currencySymbol} {formatCurrency(partner.partner_contributed)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Aporte Esperado</div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {partner.expected_contribution !== null
                      ? `${currencySymbol} ${formatCurrency(partner.expected_contribution)}`
                      : '—'}
                  </div>
                </div>
              </div>
              {partner.deviation_contribution !== null && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">Desvío Aporte</span>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      partner.deviation_contribution > 0
                        ? 'text-chart-positive'
                        : partner.deviation_contribution < 0
                          ? 'text-chart-negative'
                          : 'text-muted-foreground',
                    )}
                  >
                    {formatSignedCurrency(partner.deviation_contribution)}
                  </span>
                </div>
              )}
            </div>
            {partner.contribution_status !== 'sin_porcentaje' && (
              <div className="flex gap-2">
                <div 
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                  style={contributionConfig.style}
                >
                  <ContributionIcon className="h-3 w-3" />
                  {contributionConfig.label}
                </div>
              </div>
            )}
          </div>

          {/* BLOQUE CAPITAL NETO */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Capital Neto</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Balance Actual</div>
                  <div
                    className={cn(
                      'text-sm font-bold',
                      partner.balance >= 0 ? 'text-foreground' : 'text-chart-negative',
                    )}
                  >
                    {partner.balance < 0 ? '-' : ''}
                    {currencySymbol} {formatCurrency(partner.balance)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Capital Neto Esperado</div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {partner.expected_net_capital !== null
                      ? `${currencySymbol} ${formatCurrency(partner.expected_net_capital)}`
                      : '—'}
                  </div>
                </div>
              </div>
              {partner.deviation_net !== null && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">Desvío Neto</span>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      partner.deviation_net > 0
                        ? 'text-chart-positive'
                        : partner.deviation_net < 0
                          ? 'text-chart-negative'
                          : 'text-muted-foreground',
                    )}
                  >
                    {formatSignedCurrency(partner.deviation_net)}
                  </span>
                </div>
              )}
            </div>
            {partner.net_status !== 'sin_porcentaje' && (
              <div className="flex gap-2">
                <div 
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                  style={netConfig.style}
                >
                  <NetIcon className="h-3 w-3" />
                  {netConfig.label}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!hasPercentage && (
        <div className="text-center py-4">
          <Badge variant="neutral" className="text-xs">
            <Minus className="h-3 w-3 mr-1" />
            Sin % asignado
          </Badge>
        </div>
      )}
    </Card>
  );
}
