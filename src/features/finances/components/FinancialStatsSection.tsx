import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SparklineChart } from '@/components/charts/sparkline/SparklineChart';
import { useFinancialMetrics } from '../hooks/use-financial-metrics';
import type { FinancialMovementWithRelations } from '../types';

interface FinancialStatsSectionProps {
  movements: FinancialMovementWithRelations[];
  primaryCurrencyCode?: string;
  primaryCurrencySymbol?: string;
}

export function FinancialStatsSection({ 
  movements, 
  primaryCurrencyCode,
  primaryCurrencySymbol = '$'
}: FinancialStatsSectionProps) {
  const { totalInPrimaryCurrency, balanceByCurrency, timeline } = useFinancialMetrics(
    movements, 
    primaryCurrencyCode
  );

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
      {/* Columnas 1-2: KPI Principal con Gráfico */}
      <Card className="lg:col-span-2 p-6" data-testid="card-financial-total">
        <div className="space-y-4">
          {/* Header con Total */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Balance Total
              </p>
              <p 
                className={`text-4xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                data-testid="text-total-balance"
              >
                {isPositive ? '' : '-'}{formatCurrency(totalInPrimaryCurrency, primaryCurrencySymbol)}
              </p>
              <p className="text-sm text-muted-foreground">
                Moneda principal: {primaryCurrencyCode || 'N/A'}
              </p>
            </div>
            
            {/* Icon indicator */}
            <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
              {isPositive ? (
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>

          {/* Mini Chart */}
          <div className="pt-2">
            <SparklineChart 
              data={timeline}
              color={isPositive ? '#16a34a' : '#dc2626'}
            />
          </div>
        </div>
      </Card>

      {/* Columna 3: Resumen de Movimientos */}
      <Card className="p-6" data-testid="card-movements-summary">
        <div className="space-y-1 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Movimientos
          </p>
          <p className="text-3xl font-bold" data-testid="text-total-movements">
            {movements.length}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ingresos</span>
            <span className="font-medium text-green-600">
              {movements.filter(m => m.amount > 0).length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Egresos</span>
            <span className="font-medium text-red-600">
              {movements.filter(m => m.amount < 0).length}
            </span>
          </div>
        </div>
      </Card>

      {/* Columna 4: Balance por Moneda */}
      <Card className="p-6" data-testid="card-currency-balance">
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
                    data-testid={`balance-${curr.currencyCode}`}
                  >
                    {formatCurrency(curr.balance, curr.currencySymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>↑ {formatCurrency(curr.income, curr.currencySymbol)}</span>
                  <span>↓ {formatCurrency(curr.expense, curr.currencySymbol)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
