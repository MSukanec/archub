import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { Scale, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PartnerCapitalKPI } from '@/features/capital';

interface CapitalBalanceCardProps {
  partner: {
    partnerId: string;
    partnerName: string;
    balance: number;
    ownershipPercentage: number | null;
    capitalEsperado: number | null;
    desvioCapital: number | null;
    equilibriumStatus: PartnerCapitalKPI['equilibrium_status'];
    linkedUser?: { avatar_url?: string | null } | null;
  };
  currencySymbol: string;
  onPartnerClick?: () => void;
}

function getEquilibriumConfig(status: PartnerCapitalKPI['equilibrium_status']) {
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
        bgClassName: 'bg-chart-warning/20 border-chart-warning/20',
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

export function CapitalBalanceCard({
  partner,
  currencySymbol,
  onPartnerClick,
}: CapitalBalanceCardProps) {
  const config = getEquilibriumConfig(partner.equilibriumStatus);
  const StatusIcon = config.icon;
  const hasPercentage = partner.ownershipPercentage !== null;

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absAmount);
  };

  return (
    <Card
      data-testid={`partner-balance-card-${partner.partnerId}`}
      className={cn(
        'relative p-4 transition-shadow cursor-pointer hover:shadow-lg',
        config.bgClassName,
      )}
      onClick={onPartnerClick}
    >
      <div className="absolute top-3 right-3">
        <Badge variant={config.badgeVariant} className="text-xs">
          <StatusIcon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>

      <div className="flex items-center gap-3 mb-4 pr-20">
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
          <div
            className={cn(
              'text-lg font-bold',
              partner.balance >= 0 ? 'text-foreground' : 'text-chart-negative',
            )}
          >
            {partner.balance < 0 ? '-' : ''}
            {currencySymbol} {formatCurrency(partner.balance)}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-1">Capital Esperado</div>
          <div className="text-lg font-medium text-muted-foreground">
            {partner.capitalEsperado !== null
              ? `${currencySymbol} ${formatCurrency(partner.capitalEsperado)}`
              : '—'}
          </div>
        </div>
      </div>

      {hasPercentage && partner.desvioCapital !== null && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Desvío</span>
            <span
              className={cn(
                'text-sm font-semibold',
                partner.desvioCapital > 0
                  ? 'text-chart-positive'
                  : partner.desvioCapital < 0
                    ? 'text-chart-negative'
                    : 'text-muted-foreground',
              )}
            >
              {partner.desvioCapital > 0 ? '+' : ''}
              {currencySymbol} {formatCurrency(partner.desvioCapital)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
