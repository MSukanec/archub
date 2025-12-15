import { useMemo } from 'react';
import { TrendingUp, Calendar, Tag, DollarSign, CreditCard, Lightbulb, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Plus, BarChart3, PieChart } from 'lucide-react';
import { calculateMonetaryKPI, calculateCountKPI, calculateTextKPI, formatBreakdown } from '@/lib/kpis';
import { format, convertToBaseCurrency } from '@/lib/money';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { useGeneralCostsPayments } from '@/hooks/use-general-costs-payments';
import { useGeneralCostsMonthlySummary } from '@/features/general-costs/hooks/use-general-costs-monthly-summary';
import { useGeneralCostsByCategory } from '@/features/general-costs/hooks/use-general-costs-by-category';
import { 
  StatCard, 
  StatCardTitle, 
  StatCardValue, 
  StatCardMeta,
  StatCardSubValue,
  StatCardTrend,
  DashboardCard,
  InsightCard,
  ActivityCard,
  type InsightItem,
  type ActivityItem,
  type TrendDirection
} from '@/components/dashboard';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDateShort, parseLocalDate } from '@/lib/date-utils';
import { type PeriodFilter } from './GeneralCosts';

interface GeneralCostsDashboardTabProps {
  onNavigateToConceptos?: () => void;
  selectedPeriod?: PeriodFilter;
}

function getPeriodLabel(period: PeriodFilter): string {
  switch (period) {
    case '30d': return 'Últimos 30 días';
    case '3m': return 'Últimos 3 meses';
    case '6m': return 'Últimos 6 meses';
    case '1y': return 'Último año';
    case 'all': return 'Histórico';
  }
}

function getPreviousPeriodDateRange(period: PeriodFilter): { from: Date; to: Date } | null {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);
  
  switch (period) {
    case '30d':
      to.setDate(to.getDate() - 30);
      from.setDate(from.getDate() - 60);
      break;
    case '3m':
      to.setMonth(to.getMonth() - 3);
      from.setMonth(from.getMonth() - 6);
      break;
    case '6m':
      to.setMonth(to.getMonth() - 6);
      from.setMonth(from.getMonth() - 12);
      break;
    case '1y':
      to.setFullYear(to.getFullYear() - 1);
      from.setFullYear(from.getFullYear() - 2);
      break;
    case 'all':
      to.setFullYear(to.getFullYear() - 1);
      from.setFullYear(from.getFullYear() - 2);
      break;
  }
  
  to.setHours(0, 0, 0, 0);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

function getDateFromForPeriod(period: PeriodFilter): Date | null {
  if (period === 'all') return null;
  
  const now = new Date();
  const result = new Date(now);
  
  switch (period) {
    case '30d':
      result.setDate(result.getDate() - 30);
      break;
    case '3m':
      result.setMonth(result.getMonth() - 3);
      break;
    case '6m':
      result.setMonth(result.getMonth() - 6);
      break;
    case '1y':
      result.setFullYear(result.getFullYear() - 1);
      break;
  }
  
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Calculate which periods have confirmed payments
 * Returns an object with period as key and boolean indicating if data exists
 */
export function calculateAvailablePeriods(allPayments: any[]): Record<PeriodFilter, boolean> {
  const confirmedPayments = allPayments.filter(p => p.status === 'confirmed');
  
  // 'all' is always available
  const result: Record<PeriodFilter, boolean> = {
    'all': true,
    '30d': false,
    '3m': false,
    '6m': false,
    '1y': false
  };
  
  // Check each period
  (['30d', '3m', '6m', '1y'] as const).forEach(period => {
    const dateFrom = getDateFromForPeriod(period);
    if (!dateFrom) return;
    
    const hasData = confirmedPayments.some(p => {
      const paymentDate = parseLocalDate(p.payment_date);
      if (!paymentDate) return false;
      const paymentDateAtMidnight = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate(), 0, 0, 0);
      return paymentDateAtMidnight >= dateFrom;
    });
    
    result[period] = hasData;
  });
  
  return result;
}

export default function GeneralCostsDashboardTab({ onNavigateToConceptos, selectedPeriod = 'all' }: GeneralCostsDashboardTabProps) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);
  const { data: allPayments = [], isLoading: isLoadingPayments } = useGeneralCostsPayments(organizationId);
  const { data: monthlySummary = [], isLoading: isLoadingMonthlySummary } = useGeneralCostsMonthlySummary(organizationId ?? null);
  const { data: byCategory = [], isLoading: isLoadingByCategory } = useGeneralCostsByCategory(organizationId ?? null);

  const isLoading = isLoadingPayments || isLoadingMonthlySummary || isLoadingByCategory;

  const dateFrom = useMemo(() => getDateFromForPeriod(selectedPeriod), [selectedPeriod]);

  const confirmedPayments = useMemo(() => {
    const confirmed = allPayments.filter(p => p.status === 'confirmed');
    
    if (!dateFrom) return confirmed;
    
    return confirmed.filter(p => {
      const paymentDate = parseLocalDate(p.payment_date);
      if (!paymentDate) return false;
      // Compare dates at 00:00:00 to avoid time issues
      const paymentDateAtMidnight = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate(), 0, 0, 0);
      return paymentDateAtMidnight >= dateFrom;
    });
  }, [allPayments, dateFrom]);

  const filteredMonthlySummary = useMemo(() => {
    if (!dateFrom) return monthlySummary;
    
    const fromMonth = `${dateFrom.getFullYear()}-${String(dateFrom.getMonth() + 1).padStart(2, '0')}`;
    return monthlySummary.filter(m => m.payment_month >= fromMonth);
  }, [monthlySummary, dateFrom]);

  const filteredByCategory = useMemo(() => {
    if (!dateFrom) return byCategory;
    
    const fromMonth = `${dateFrom.getFullYear()}-${String(dateFrom.getMonth() + 1).padStart(2, '0')}`;
    return byCategory.filter(item => item.payment_month >= fromMonth);
  }, [byCategory, dateFrom]);

  const currentPeriodPaymentsForComparison = useMemo(() => {
    if (selectedPeriod !== 'all') return confirmedPayments;
    
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);
    
    return allPayments.filter(p => p.status === 'confirmed').filter(p => {
      const paymentDate = parseLocalDate(p.payment_date);
      if (!paymentDate) return false;
      const paymentDateAtMidnight = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate(), 0, 0, 0);
      return paymentDateAtMidnight >= oneYearAgo;
    });
  }, [allPayments, selectedPeriod, confirmedPayments]);

  const previousPeriodPayments = useMemo(() => {
    const previousRange = getPreviousPeriodDateRange(selectedPeriod);
    if (!previousRange) return [];
    
    const allConfirmed = allPayments.filter(p => p.status === 'confirmed');
    return allConfirmed.filter(p => {
      const paymentDate = parseLocalDate(p.payment_date);
      if (!paymentDate) return false;
      const paymentDateAtMidnight = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate(), 0, 0, 0);
      return paymentDateAtMidnight >= previousRange.from && paymentDateAtMidnight < previousRange.to;
    });
  }, [allPayments, selectedPeriod]);

  const kpis = useMemo(() => {
    const totalGasto = calculateMonetaryKPI({
      items: confirmedPayments.map(p => ({
        amount: p.amount,
        currency_id: p.currency_id,
        currency: p.currency,
        exchange_rate: p.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    const currentPeriodTotalForTrend = calculateMonetaryKPI({
      items: currentPeriodPaymentsForComparison.map(p => ({
        amount: p.amount,
        currency_id: p.currency_id,
        currency: p.currency,
        exchange_rate: p.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    const previousTotalGasto = calculateMonetaryKPI({
      items: previousPeriodPayments.map(p => ({
        amount: p.amount,
        currency_id: p.currency_id,
        currency: p.currency,
        exchange_rate: p.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    let totalGastoTrend: TrendDirection = 'neutral';
    let totalGastoTrendValue = '';
    if (previousTotalGasto.value > 0) {
      const change = ((currentPeriodTotalForTrend.value - previousTotalGasto.value) / previousTotalGasto.value) * 100;
      totalGastoTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      const periodLabel = selectedPeriod === 'all' ? 'vs año anterior' : 'vs período anterior';
      totalGastoTrendValue = `${change > 0 ? '+' : ''}${Math.round(change)}% ${periodLabel}`;
    }

    const months = new Set(confirmedPayments.map(p => {
      const date = parseLocalDate(p.payment_date);
      if (!date) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }).filter(m => m !== ''));
    const monthCount = months.size || 1;

    const currentMonthsForTrend = new Set(currentPeriodPaymentsForComparison.map(p => {
      const date = parseLocalDate(p.payment_date);
      if (!date) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }).filter(m => m !== ''));
    const currentMonthCountForTrend = currentMonthsForTrend.size || 1;

    const previousMonths = new Set(previousPeriodPayments.map(p => {
      const date = parseLocalDate(p.payment_date);
      if (!date) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }).filter(m => m !== ''));
    const previousMonthCount = previousMonths.size || 1;

    const averageMonthlyItems = confirmedPayments.map(p => ({
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

    const currentAverageMonthlyItemsForTrend = currentPeriodPaymentsForComparison.map(p => ({
      amount: p.amount / currentMonthCountForTrend,
      currency_id: p.currency_id,
      currency: p.currency,
      exchange_rate: p.exchange_rate
    }));

    const currentAverageMonthlyForTrend = calculateMonetaryKPI({
      items: currentAverageMonthlyItemsForTrend,
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    const previousAverageMonthlyItems = previousPeriodPayments.map(p => ({
      amount: p.amount / previousMonthCount,
      currency_id: p.currency_id,
      currency: p.currency,
      exchange_rate: p.exchange_rate
    }));

    const previousAverageMonthly = calculateMonetaryKPI({
      items: previousAverageMonthlyItems,
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    let averageMonthlyTrend: TrendDirection = 'neutral';
    let averageMonthlyTrendValue = '';
    if (previousAverageMonthly.value > 0) {
      const change = ((currentAverageMonthlyForTrend.value - previousAverageMonthly.value) / previousAverageMonthly.value) * 100;
      averageMonthlyTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      averageMonthlyTrendValue = `${change > 0 ? '+' : ''}${Math.round(change)}% vs promedio anterior`;
    }

    const totalPayments = calculateCountKPI({
      count: confirmedPayments.length,
      label: 'pagos'
    });

    const paymentsPerMonth = monthCount > 0 ? Math.round(confirmedPayments.length / monthCount) : 0;
    const currentPaymentsPerMonthForTrend = currentMonthCountForTrend > 0 ? Math.round(currentPeriodPaymentsForComparison.length / currentMonthCountForTrend) : 0;
    const previousPaymentsPerMonth = previousMonthCount > 0 ? Math.round(previousPeriodPayments.length / previousMonthCount) : 0;

    let totalPaymentsTrend: TrendDirection = 'neutral';
    if (previousPaymentsPerMonth > 0) {
      totalPaymentsTrend = currentPaymentsPerMonthForTrend > previousPaymentsPerMonth ? 'up' : currentPaymentsPerMonthForTrend < previousPaymentsPerMonth ? 'down' : 'neutral';
    }

    let topCategory = 'Sin datos';
    let maxAmount = 0;
    const categoryTotals = new Map<string, number>();
    
    filteredByCategory.forEach(item => {
      const existing = categoryTotals.get(item.category_name) || 0;
      categoryTotals.set(item.category_name, existing + Number(item.total_amount));
    });
    
    categoryTotals.forEach((amount, name) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        topCategory = name;
      }
    });

    const allCategoriesTotal = Array.from(categoryTotals.values()).reduce((sum, v) => sum + v, 0);
    const topCategoryPercentage = allCategoriesTotal > 0 ? Math.round((maxAmount / allCategoriesTotal) * 100) : 0;

    const topCategoryKPI = calculateTextKPI({
      text: topCategory || 'Sin categoría',
      icon: 'tag'
    });

    return {
      totalGasto,
      totalGastoTrend,
      totalGastoTrendValue,
      averageMonthly,
      averageMonthlyTrend,
      averageMonthlyTrendValue,
      totalPayments,
      totalPaymentsTrend,
      paymentsPerMonth,
      topCategory: topCategoryKPI,
      topCategoryPercentage
    };
  }, [confirmedPayments, defaultCurrency, filteredByCategory, previousPeriodPayments, selectedPeriod, currentPeriodPaymentsForComparison]);

  const monthlyChartData = useMemo(() => {
    return filteredMonthlySummary.map(m => ({
      month: m.payment_month,
      value: Number(m.total_amount) || 0
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredMonthlySummary]);

  const allCategoryData = useMemo(() => {
    const categoryTotals = new Map<string, number>();
    
    filteredByCategory.forEach(item => {
      const existing = categoryTotals.get(item.category_name) || 0;
      categoryTotals.set(item.category_name, existing + Number(item.total_amount));
    });

    return Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredByCategory]);

  const categoryChartData = useMemo(() => {
    return allCategoryData.slice(0, 8);
  }, [allCategoryData]);

  const insights = useMemo((): InsightItem[] => {
    const messages: InsightItem[] = [];
    
    if (allCategoryData.length > 0 && kpis.totalGasto.value > 0) {
      const topCategoryValue = allCategoryData[0]?.value || 0;
      const topCategoryName = allCategoryData[0]?.name || '';
      const allCategoriesTotal = allCategoryData.reduce((sum, c) => sum + c.value, 0);
      const percentage = allCategoriesTotal > 0 
        ? Math.round((topCategoryValue / allCategoriesTotal) * 100) 
        : 0;
      
      if (percentage >= 50) {
        messages.push({
          title: `"${topCategoryName}" representa el ${percentage}% del gasto total`,
          variant: 'info'
        });
      }
    }
    
    const now = new Date();
    const thisMonthPayments = confirmedPayments.filter(p => {
      const paymentDate = new Date(p.payment_date);
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
    });
    
    if (thisMonthPayments.length > 0) {
      messages.push({
        title: `${thisMonthPayments.length} pago${thisMonthPayments.length > 1 ? 's' : ''} registrado${thisMonthPayments.length > 1 ? 's' : ''} este mes`,
        variant: 'info'
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
              title: `El último mes aumentó ${Math.round(change)}% respecto al anterior`,
              icon: <ArrowUpRight className="h-3 w-3 text-red-600 dark:text-red-400" />,
              variant: 'danger'
            });
          } else {
            messages.push({
              title: `El último mes disminuyó ${Math.round(Math.abs(change))}% respecto al anterior`,
              icon: <ArrowDownRight className="h-3 w-3 text-green-600 dark:text-green-400" />,
              variant: 'success'
            });
          }
        }
      }
    }
    
    if (confirmedPayments.length > 0) {
      messages.push({
        title: `${confirmedPayments.length} pago${confirmedPayments.length > 1 ? 's' : ''} confirmado${confirmedPayments.length > 1 ? 's' : ''} en total`,
        variant: 'info'
      });
    }
    
    return messages.slice(0, 4);
  }, [kpis, allCategoryData, confirmedPayments, monthlyChartData]);

  const recentActivityItems = useMemo((): ActivityItem[] => {
    return confirmedPayments
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
      .slice(0, 5)
      .map((payment) => ({
        id: payment.id,
        title: payment.general_cost?.name || 'Sin concepto',
        subtitle: formatDateShort(payment.payment_date),
        rightContent: (
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
                defaultCurrency?.symbol || '$'
              )}
            </span>
            {payment.currency?.code !== defaultCurrency?.code && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(payment.amount, payment.currency?.symbol || '$')}
              </span>
            )}
          </div>
        ),
        badge: (
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              "border-green-500 text-green-600 dark:text-green-400"
            )}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Confirmado
          </Badge>
        )
      }));
  }, [confirmedPayments, defaultCurrency]);

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
        icon={<CreditCard className="w-12 h-12" />}
        title="Todavía no tenés gastos generales registrados"
        description="Comienza creando un concepto para registrar tus primeros pagos (por ejemplo: Contador, Alquiler, Electricidad)."
        action={
          <Button
            onClick={onNavigateToConceptos}
            data-testid="button-create-first-concept"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Concepto
          </Button>
        }
        data-testid="empty-dashboard-state"
      />
    );
  }

  return (
    <div className="space-y-6" data-testid="general-costs-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="kpi-total-gasto">
          <StatCardTitle>
            <DollarSign className="h-4 w-4" />
            Gasto Total
          </StatCardTitle>
          <StatCardValue>{kpis.totalGasto.formatted}</StatCardValue>
          {kpis.totalGastoTrendValue && (
            <StatCardTrend direction={kpis.totalGastoTrend} value={kpis.totalGastoTrendValue} />
          )}
        </StatCard>

        <StatCard data-testid="kpi-average-monthly">
          <StatCardTitle>
            <TrendingUp className="h-4 w-4" />
            Promedio Mensual
          </StatCardTitle>
          <StatCardValue>{kpis.averageMonthly.formatted}</StatCardValue>
          {kpis.averageMonthlyTrendValue && (
            <StatCardTrend direction={kpis.averageMonthlyTrend} value={kpis.averageMonthlyTrendValue} />
          )}
        </StatCard>

        <StatCard data-testid="kpi-total-payments">
          <StatCardTitle>
            <Calendar className="h-4 w-4" />
            Total Pagos
          </StatCardTitle>
          <StatCardValue>{kpis.totalPayments.formatted}</StatCardValue>
          <StatCardMeta className="flex items-center gap-1">
            {kpis.totalPaymentsTrend === 'up' && <span className="text-red-600 dark:text-red-400">↑</span>}
            {kpis.totalPaymentsTrend === 'down' && <span className="text-green-600 dark:text-green-400">↓</span>}
            ≈ {kpis.paymentsPerMonth} pagos por mes
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="kpi-top-category">
          <StatCardTitle>
            <Tag className="h-4 w-4" />
            Categoría Principal
          </StatCardTitle>
          <StatCardValue className="text-lg">{kpis.topCategory.formatted}</StatCardValue>
          <StatCardMeta>
            {kpis.topCategoryPercentage > 0 
              ? `${kpis.topCategoryPercentage}% del gasto total` 
              : 'Mayor gasto acumulado'}
          </StatCardMeta>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard 
          title="Evolución Mensual"
          icon={<BarChart3 />}
          data-testid="chart-monthly-trend"
        >
          <MonthlyTrendChart 
            data={monthlyChartData}
            height={280}
            emptyText="No hay datos de gastos registrados"
          />
        </DashboardCard>

        <DashboardCard 
          title="Distribución por Categoría"
          icon={<PieChart />}
          data-testid="chart-category-breakdown"
        >
          <CategoryBreakdownChart 
            data={categoryChartData}
            height={280}
            emptyText="No hay categorías con gastos registrados"
          />
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.length > 0 && (
          <InsightCard
            title="Insights"
            titleIcon={<Lightbulb />}
            items={insights}
            data-testid="insights-section"
          />
        )}

        <ActivityCard
          title="Actividad Reciente"
          titleIcon={<Clock />}
          items={recentActivityItems}
          emptyText="No hay pagos registrados"
          data-testid="recent-activity-section"
        />
      </div>
    </div>
  );
}
