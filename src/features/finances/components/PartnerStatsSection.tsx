import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePartnerMetrics } from '../hooks/use-partner-metrics';
import type { FinancialMovementWithRelations } from '../types';

interface PartnerStatsSectionProps {
  movements: FinancialMovementWithRelations[];
  primaryCurrencyCode?: string;
  primaryCurrencySymbol?: string;
  isLoadingCurrency?: boolean;
}

export function PartnerStatsSection({ 
  movements, 
  primaryCurrencyCode,
  primaryCurrencySymbol = '$',
  isLoadingCurrency = false
}: PartnerStatsSectionProps) {
  const { 
    totalInPrimaryCurrency, 
    totalContributions,
    totalWithdrawals,
    contributionsByCurrency,
    withdrawalsByCurrency,
    balanceByCurrency,
    balanceByPartner,
  } = usePartnerMetrics(movements, primaryCurrencyCode);

  // Format currency
  const formatCurrency = (amount: number, symbol: string = '$') => {
    const absAmount = Math.abs(amount);
    return `${symbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(absAmount)}`;
  };

  // Format breakdown for KPIs (ej: "$ 40.690.342,00 + US$ 113.270,00")
  const formatBreakdown = (items: Array<{ currencySymbol: string; amount: number }>) => {
    if (!items || items.length === 0) return '';
    return items.map(({ currencySymbol, amount }) => {
      const formattedAmount = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
      return `${currencySymbol} ${formattedAmount}`;
    }).join(' + ');
  };

  const isPositive = totalInPrimaryCurrency >= 0;

  // Show skeletons while currency is loading
  if (isLoadingCurrency) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Fila 1: KPIs Principales con Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna 1: Total Aportes */}
        <Card className="p-6" data-testid="card-total-contributions">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Aportes
            </p>
            <p 
              className="text-3xl font-bold text-green-600"
              data-testid="text-total-contributions"
            >
              {formatCurrency(totalContributions, primaryCurrencySymbol)}
            </p>
            <p className="text-xs text-muted-foreground">
              {contributionsByCurrency.length > 0 
                ? formatBreakdown(contributionsByCurrency)
                : `${movements.filter(m => m.amount >= 0).length} aportes confirmados`
              }
            </p>
          </div>
        </Card>

        {/* Columna 2: Total Retiros */}
        <Card className="p-6" data-testid="card-total-withdrawals">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Retiros
            </p>
            <p 
              className="text-3xl font-bold text-red-600"
              data-testid="text-total-withdrawals"
            >
              {formatCurrency(totalWithdrawals, primaryCurrencySymbol)}
            </p>
            <p className="text-xs text-muted-foreground">
              {withdrawalsByCurrency.length > 0 
                ? formatBreakdown(withdrawalsByCurrency)
                : `${movements.filter(m => m.amount < 0).length} retiros confirmados`
              }
            </p>
          </div>
        </Card>

        {/* Columna 3: Saldo Neto */}
        <Card className="p-6" data-testid="card-partner-balance-consolidated">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Saldo Neto
            </p>
            <p 
              className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
              data-testid="text-partner-balance"
            >
              {isPositive ? '' : '-'}{formatCurrency(totalInPrimaryCurrency, primaryCurrencySymbol)}
            </p>
            <p className="text-xs text-muted-foreground">
              {balanceByCurrency.length > 0 
                ? formatBreakdown(balanceByCurrency.map(c => ({ currencySymbol: c.currencySymbol, amount: c.balance })))
                : 'Aportes - Retiros'
              }
            </p>
          </div>
        </Card>
      </div>

      {/* Fila 2: Balance por Socio y Balance por Moneda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Balance por Socio */}
        <Card className="p-6" data-testid="card-partner-balance-by-partner">
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Balance por Socio
              </p>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[140px] overflow-y-auto">
            {balanceByPartner.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            ) : (
              balanceByPartner.map((partner, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground truncate max-w-[140px]" title={partner.partnerName}>
                      {partner.partnerName}
                    </span>
                    <span 
                      className={`text-sm font-bold ${partner.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      data-testid={`partner-balance-${partner.partnerId}`}
                    >
                      {partner.balance >= 0 ? '' : '-'}{formatCurrency(partner.balance, primaryCurrencySymbol)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>↑ {formatCurrency(partner.contributions, primaryCurrencySymbol)}</span>
                    <span>↓ {formatCurrency(partner.withdrawals, primaryCurrencySymbol)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Balance por Moneda */}
        <Card className="p-6" data-testid="card-partner-currency-balance">
          <div className="space-y-1 mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Balance por Moneda
            </p>
          </div>
          
          <div className="space-y-3 max-h-[140px] overflow-y-auto">
            {balanceByCurrency.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            ) : (
              balanceByCurrency.map((curr, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {curr.currencyCode}
                    </span>
                    <span 
                      className={`text-sm font-bold ${curr.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      data-testid={`partner-balance-${curr.currencyCode}`}
                    >
                      {formatCurrency(curr.balance, curr.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>↑ {formatCurrency(curr.contributions, curr.currencySymbol)}</span>
                    <span>↓ {formatCurrency(curr.withdrawals, curr.currencySymbol)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
