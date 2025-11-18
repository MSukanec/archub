import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { usePartnerMetrics } from '../hooks/use-partner-metrics';
import type { FinancialMovementWithRelations } from '../types';

interface PartnerStatsSectionProps {
  movements: FinancialMovementWithRelations[];
  primaryCurrencyCode?: string;
  primaryCurrencySymbol?: string;
}

export function PartnerStatsSection({ 
  movements, 
  primaryCurrencyCode,
  primaryCurrencySymbol = '$'
}: PartnerStatsSectionProps) {
  const { 
    totalInPrimaryCurrency, 
    totalContributions,
    totalWithdrawals,
    balanceByCurrency 
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
      {/* Columna 1: Balance Total de Socios */}
      <Card className="p-6" data-testid="card-partner-balance">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Balance Socios
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
        </div>
      </Card>

      {/* Columna 2: Total Aportes */}
      <Card className="p-6" data-testid="card-total-contributions">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Aportes
              </p>
              <p className="text-3xl font-bold text-green-600" data-testid="text-total-contributions">
                {formatCurrency(totalContributions, primaryCurrencySymbol)}
              </p>
              <p className="text-xs text-muted-foreground">
                {movements.filter(m => m.amount >= 0).length} movimientos
              </p>
            </div>
            
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </Card>

      {/* Columna 3: Total Retiros */}
      <Card className="p-6" data-testid="card-total-withdrawals">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Retiros
              </p>
              <p className="text-3xl font-bold text-red-600" data-testid="text-total-withdrawals">
                {formatCurrency(totalWithdrawals, primaryCurrencySymbol)}
              </p>
              <p className="text-xs text-muted-foreground">
                {movements.filter(m => m.amount < 0).length} movimientos
              </p>
            </div>
            
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </Card>

      {/* Columna 4: Balance por Moneda */}
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
