import { TrendingUp, TrendingDown, Users } from 'lucide-react';
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
    balanceByCurrency,
    balanceByPartner
  } = usePartnerMetrics(movements, primaryCurrencyCode);

  // Format currency
  const formatCurrency = (amount: number, symbol: string = '$') => {
    const absAmount = Math.abs(amount);
    return `${symbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(absAmount)}`;
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Columna 1: Balance Total Consolidado */}
      <Card className="p-6" data-testid="card-partner-balance-consolidated">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Balance Total Socios
              </p>
              <p 
                className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                data-testid="text-partner-balance"
              >
                {isPositive ? '' : '-'}{formatCurrency(totalInPrimaryCurrency, primaryCurrencySymbol)}
              </p>
              <p className="text-xs text-muted-foreground">
                {primaryCurrencyCode || 'N/A'}
              </p>
            </div>
            
            {/* Icon indicator */}
            <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
              {isPositive ? (
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>

          {/* Desglose de Aportes y Retiros */}
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">↑ Aportes</span>
              <span className="font-semibold text-green-600" data-testid="text-total-contributions">
                {formatCurrency(totalContributions, primaryCurrencySymbol)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">↓ Retiros</span>
              <span className="font-semibold text-red-600" data-testid="text-total-withdrawals">
                {formatCurrency(totalWithdrawals, primaryCurrencySymbol)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Columna 2: Balance por Socio */}
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

      {/* Columna 3: Balance por Moneda */}
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
  );
}
