import { useMemo } from 'react';
import { TrendingUp, Calendar, Tag, DollarSign, Lightbulb, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { calculateMonetaryKPI, calculateCountKPI, calculateTextKPI, formatBreakdown } from '@/lib/kpis';
import { formatKPI, format, convertToBaseCurrency } from '@/lib/money';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { useGeneralCostsPayments } from '@/hooks/use-general-costs-payments';
import { useGeneralCostsMonthlySummary } from '@/features/general-costs/hooks/use-general-costs-monthly-summary';
import { useGeneralCostsByCategory } from '@/features/general-costs/hooks/use-general-costs-by-category';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { cn } from '@/lib/utils';
import { formatDateShort } from '@/lib/date-utils';

interface GeneralCostsDashboardTabProps {
  onNavigateToConceptos?: () => void;
}

export default function GeneralCostsDashboardTab({ onNavigateToConceptos }: GeneralCostsDashboardTabProps) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);
  const { data: allPayments = [], isLoading: isLoadingPayments } = useGeneralCostsPayments(organizationId);
  const { data: monthlySummary = [], isLoading: isLoadingMonthlySummary } = useGeneralCostsMonthlySummary(organizationId ?? null);
  const { data: byCategory = [], isLoading: isLoadingByCategory } = useGeneralCostsByCategory(organizationId ?? null);

  const isLoading = isLoadingPayments || isLoadingMonthlySummary || isLoadingByCategory;

  const currentYear = new Date().getFullYear();
  const currentYearPayments = useMemo(() => {
    return allPayments.filter(p => {
      const paymentYear = new Date(p.payment_date).getFullYear();
      return paymentYear === currentYear && p.status === 'confirmed';
    });
  }, [allPayments, currentYear]);

  const kpis = useMemo(() => {
    const totalYTD = calculateMonetaryKPI({
      items: currentYearPayments.map(p => ({
        amount: p.amount,
        currency_id: p.currency_id,
        currency: p.currency,
        exchange_rate: p.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    const months = new Set(currentYearPayments.map(p => {
      const date = new Date(p.payment_date);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }));
    const monthCount = months.size || 1;

    const averageMonthlyItems = currentYearPayments.map(p => ({
      amount: p.amount / monthCount,
      currency_id: p.currency_id,
      currency: p.currency,
      exchange_rate: p.exchange_rate
    }));

    const averageMonthly = calculateMonetaryKPI({
      items: averageMonthlyItems,
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    const confirmedPayments = allPayments.filter(p => p.status === 'confirmed');
    const totalPayments = calculateCountKPI({
      count: confirmedPayments.length,
      label: 'pagos'
    });

    let topCategory = 'Sin datos';
    let maxAmount = 0;
    const categoryTotals = new Map<string, number>();
    
    byCategory.forEach(item => {
      const existing = categoryTotals.get(item.category_name) || 0;
      categoryTotals.set(item.category_name, existing + Number(item.total_amount));
    });
    
    categoryTotals.forEach((amount, name) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        topCategory = name;
      }
    });

    const topCategoryKPI = calculateTextKPI({
      text: topCategory || 'Sin categoría',
      icon: 'tag'
    });

    return {
      totalYTD,
      averageMonthly,
      totalPayments,
      topCategory: topCategoryKPI
    };
  }, [currentYearPayments, allPayments, defaultCurrency, byCategory]);

  const monthlyChartData = useMemo(() => {
    const thisYearMonths = monthlySummary.filter(m => {
      const year = parseInt(m.payment_month.split('-')[0]);
      return year === currentYear;
    });

    return thisYearMonths.map(m => ({
      month: m.payment_month,
      value: Number(m.total_amount) || 0
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [monthlySummary, currentYear]);

  const allCategoryData = useMemo(() => {
    const categoryTotals = new Map<string, number>();
    
    byCategory.forEach(item => {
      const existing = categoryTotals.get(item.category_name) || 0;
      categoryTotals.set(item.category_name, existing + Number(item.total_amount));
    });

    return Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [byCategory]);

  const categoryChartData = useMemo(() => {
    return allCategoryData.slice(0, 8);
  }, [allCategoryData]);

  const insights = useMemo(() => {
    const messages: Array<{ text: string; type: 'positive' | 'negative' | 'neutral' }> = [];
    
    if (kpis.totalYTD.value > 0 && kpis.averageMonthly.value > 0) {
      const currentMonth = new Date().getMonth();
      const expectedTotal = kpis.averageMonthly.value * (currentMonth + 1);
      const difference = ((kpis.totalYTD.value - expectedTotal) / expectedTotal) * 100;
      
      if (Math.abs(difference) > 10) {
        if (difference > 0) {
          messages.push({
            text: `El gasto acumulado está ${Math.round(Math.abs(difference))}% por encima del promedio proyectado`,
            type: 'negative'
          });
        } else {
          messages.push({
            text: `El gasto acumulado está ${Math.round(Math.abs(difference))}% por debajo del promedio proyectado`,
            type: 'positive'
          });
        }
      }
    }
    
    if (allCategoryData.length > 0 && kpis.totalYTD.value > 0) {
      const topCategoryValue = allCategoryData[0]?.value || 0;
      const topCategoryName = allCategoryData[0]?.name || '';
      const allCategoriesTotal = allCategoryData.reduce((sum, c) => sum + c.value, 0);
      const percentage = allCategoriesTotal > 0 
        ? Math.round((topCategoryValue / allCategoriesTotal) * 100) 
        : 0;
      
      if (percentage >= 50) {
        messages.push({
          text: `"${topCategoryName}" representa el ${percentage}% del gasto total`,
          type: 'neutral'
        });
      }
    }
    
    const thisMonthPayments = currentYearPayments.filter(p => {
      const paymentDate = new Date(p.payment_date);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
    });
    
    if (thisMonthPayments.length > 0) {
      messages.push({
        text: `${thisMonthPayments.length} pago${thisMonthPayments.length > 1 ? 's' : ''} registrado${thisMonthPayments.length > 1 ? 's' : ''} este mes`,
        type: 'neutral'
      });
    }
    
    if (monthlyChartData.length >= 2) {
      const lastMonth = monthlyChartData[monthlyChartData.length - 1]?.value || 0;
      const previousMonth = monthlyChartData[monthlyChartData.length - 2]?.value || 0;
      
      if (previousMonth > 0) {
        const change = ((lastMonth - previousMonth) / previousMonth) * 100;
        if (Math.abs(change) > 15) {
          if (change > 0) {
            messages.push({
              text: `El último mes aumentó ${Math.round(change)}% respecto al anterior`,
              type: 'negative'
            });
          } else {
            messages.push({
              text: `El último mes disminuyó ${Math.round(Math.abs(change))}% respecto al anterior`,
              type: 'positive'
            });
          }
        }
      }
    }
    
    return messages.slice(0, 4);
  }, [kpis, categoryChartData, currentYearPayments, monthlyChartData]);

  const recentPayments = useMemo(() => {
    return allPayments
      .filter(p => p.status === 'confirmed')
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
      .slice(0, 5);
  }, [allPayments]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (allPayments.length === 0) {
    return (
      <EmptyState 
        title="Sin Pagos Registrados"
        description="Comienza creando un concepto para registrar tus primeros pagos."
        action={
          <button
            onClick={onNavigateToConceptos}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
          >
            Crear Primer Concepto
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6" data-testid="general-costs-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="kpi-total-ytd">
          <StatCardTitle>
            <DollarSign className="h-4 w-4" />
            Gasto Total YTD
          </StatCardTitle>
          <StatCardValue>{kpis.totalYTD.formatted}</StatCardValue>
          <StatCardMeta>{formatBreakdown(kpis.totalYTD)}</StatCardMeta>
        </StatCard>

        <StatCard data-testid="kpi-average-monthly">
          <StatCardTitle>
            <TrendingUp className="h-4 w-4" />
            Promedio Mensual
          </StatCardTitle>
          <StatCardValue>{kpis.averageMonthly.formatted}</StatCardValue>
          <StatCardMeta>{formatBreakdown(kpis.averageMonthly)}</StatCardMeta>
        </StatCard>

        <StatCard data-testid="kpi-total-payments">
          <StatCardTitle>
            <Calendar className="h-4 w-4" />
            Total Pagos
          </StatCardTitle>
          <StatCardValue>{kpis.totalPayments.formatted}</StatCardValue>
          <StatCardMeta>pagos registrados</StatCardMeta>
        </StatCard>

        <StatCard data-testid="kpi-top-category">
          <StatCardTitle>
            <Tag className="h-4 w-4" />
            Categoría Principal
          </StatCardTitle>
          <StatCardValue className="text-lg">{kpis.topCategory.formatted}</StatCardValue>
          <StatCardMeta>mayor gasto</StatCardMeta>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="chart-monthly-trend">
          <CardHeader>
            <CardTitle className="text-base font-medium">Evolución Mensual {currentYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart 
              data={monthlyChartData}
              height={280}
              emptyText="No hay datos de gastos para este año"
            />
          </CardContent>
        </Card>

        <Card data-testid="chart-category-breakdown">
          <CardHeader>
            <CardTitle className="text-base font-medium">Distribución por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart 
              data={categoryChartData}
              height={280}
              emptyText="No hay categorías con gastos registrados"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.length > 0 && (
          <Card data-testid="insights-section">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {insights.map((insight, index) => (
                  <li 
                    key={index} 
                    className="flex items-start gap-3"
                    data-testid={`insight-item-${index}`}
                  >
                    <div className={cn(
                      "mt-0.5 p-1 rounded-full",
                      insight.type === 'positive' && "bg-green-100 dark:bg-green-900/30",
                      insight.type === 'negative' && "bg-red-100 dark:bg-red-900/30",
                      insight.type === 'neutral' && "bg-muted"
                    )}>
                      {insight.type === 'positive' && <ArrowDownRight className="h-3 w-3 text-green-600 dark:text-green-400" />}
                      {insight.type === 'negative' && <ArrowUpRight className="h-3 w-3 text-red-600 dark:text-red-400" />}
                      {insight.type === 'neutral' && <TrendingUp className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <span className="text-sm text-muted-foreground">{insight.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card data-testid="recent-activity-section">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No hay pagos registrados
              </p>
            ) : (
              <ul className="space-y-3">
                {recentPayments.map((payment, index) => (
                  <li 
                    key={payment.id} 
                    className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0"
                    data-testid={`recent-payment-${index}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {payment.general_cost?.name || 'Sin concepto'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(payment.payment_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-medium whitespace-nowrap block">
                          {format(
                            convertToBaseCurrency(
                              payment.currency?.code || 'ARS',
                              defaultCurrency?.code,
                              payment.amount,
                              payment.exchange_rate ?? null,
                              { quoteCurrency: 'USD' }
                            ),
                            defaultCurrency?.code || 'ARS',
                            { symbol: defaultCurrency?.symbol }
                          )}
                        </span>
                        {payment.currency?.code !== defaultCurrency?.code && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(payment.amount, payment.currency?.code || 'ARS', { symbol: payment.currency?.symbol })}
                          </span>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          payment.status === 'confirmed' && "border-green-500 text-green-600 dark:text-green-400"
                        )}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Confirmado
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
