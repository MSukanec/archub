import { useMemo, useCallback } from 'react';
import { TrendingUp, Calendar, DollarSign, CreditCard, Lightbulb, Clock, CheckCircle2, Plus, BarChart3, PieChart } from 'lucide-react';
import { type InsightAction } from '@/components/dashboard/insights/types';
import { calculateMonetaryKPI, calculateCountKPI, calculateTextKPI, formatBreakdown } from '@/lib/kpis';
import { format, convertToBaseCurrency } from '@/lib/money';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency, useOrgCurrencyContext } from '@/hooks/use-currencies';
import { useGeneralCostsPayments } from '../hooks/use-general-costs-payments';
import { useGeneralCostsMonthlySummary } from '../hooks/use-general-costs-monthly-summary';
import { useGeneralCostsByCategory } from '../hooks/use-general-costs-by-category';
import { 
  StatCard, 
  StatCardTitle, 
  StatCardValue, 
  StatCardMeta,
  StatCardMetaContainer,
  StatCardSubValue,
  StatCardTrend,
  StatCardHistoricalComparison,
  DashboardCard,
  ActivityCard,
  CategoryHighlightCard,
  InsightCard,
  type ActivityItem,
  type TrendDirection
} from '@/components/dashboard';
import { calculateHistoricalComparison, getPeriodMeta, getKPILabels } from '@/lib/analytics';
import { generateInsights, buildInsightContext, toInsightItems } from '@/components/dashboard/insights';
import { EmptyState } from '@/components/shared/EmptyState';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentStatusBadge } from '@/components/shared/PaymentStatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDateShort, parseLocalDate } from '@/lib/date-utils';
import { type PeriodFilter } from '@/pages/dashboard/GeneralCostsPage';

interface GeneralCostsDashboardTabProps {
  onNavigateToConceptos?: () => void;
  onNavigateToPayments?: () => void;
  onNavigateToTab?: (tab: string, filters?: Record<string, unknown>) => void;
  onScrollToPanel?: (panelId: string) => void;
  onFilterCategory?: (category: string) => void;
  selectedPeriod?: PeriodFilter;
  dismissedIssueIds?: Set<string>;
  onDismissIssue?: (issueId: string) => void;
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

export default function GeneralCostsDashboardView({ 
  onNavigateToConceptos, 
  onNavigateToPayments,
  onNavigateToTab,
  onScrollToPanel,
  onFilterCategory,
  selectedPeriod = 'all',
  dismissedIssueIds = new Set(),
  onDismissIssue
}: GeneralCostsDashboardTabProps) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);
  const defaultCurrencyId = userData?.organization?.preferences?.default_currency_id;
  const { isMultiCurrency } = useOrgCurrencyContext(organizationId);

  const handleInsightAction = useCallback((action: InsightAction) => {
    switch (action.type) {
      case 'navigate':
        if (action.payload.tab === 'concepts') {
          if (onNavigateToTab) {
            onNavigateToTab('concepts', {
              filterCategory: action.payload.filterCategory,
              filterConcept: action.payload.filterConcept
            });
          } else {
            onNavigateToConceptos?.();
          }
        } else if (action.payload.tab === 'payments') {
          if (onNavigateToTab) {
            onNavigateToTab('payments', action.payload);
          } else {
            onNavigateToPayments?.();
          }
        }
        break;
      case 'filter':
        if (action.payload.category && typeof action.payload.category === 'string') {
          onFilterCategory?.(action.payload.category);
        }
        break;
      case 'open':
        if (action.payload.panel && typeof action.payload.panel === 'string') {
          onScrollToPanel?.(action.payload.panel);
        }
        break;
    }
  }, [onNavigateToConceptos, onNavigateToPayments, onNavigateToTab, onScrollToPanel, onFilterCategory]);

  const handleMonthDrillDown = useCallback((month: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('pagos', { filterMonth: month });
    } else {
      onNavigateToPayments?.();
    }
  }, [onNavigateToTab, onNavigateToPayments]);

  const handleCategoryDrillDown = useCallback((categoryName: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('pagos', { filterCategory: categoryName });
    } else {
      onNavigateToPayments?.();
    }
  }, [onNavigateToTab, onNavigateToPayments]);
  const { data: allPayments = [], isLoading: isLoadingPayments } = useGeneralCostsPayments(organizationId);
  const { data: monthlySummary = [], isLoading: isLoadingMonthlySummary } = useGeneralCostsMonthlySummary(organizationId ?? null);
  const { data: byCategory = [], isLoading: isLoadingByCategory } = useGeneralCostsByCategory(organizationId ?? null);

  const isLoading = isLoadingPayments || isLoadingMonthlySummary || isLoadingByCategory;

  const dateFrom = useMemo(() => getDateFromForPeriod(selectedPeriod), [selectedPeriod]);

  const periodMeta = useMemo(() => {
    const now = new Date();
    return getPeriodMeta(dateFrom, now);
  }, [dateFrom]);

  const kpiLabels = useMemo(() => getKPILabels(periodMeta), [periodMeta]);

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

    // Calcular promedio histórico general (todos los pagos confirmados)
    const allConfirmedPayments = allPayments.filter(p => p.status === 'confirmed');
    const allHistoricalMonths = new Set(allConfirmedPayments.map(p => {
      const date = parseLocalDate(p.payment_date);
      if (!date) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }).filter(m => m !== ''));
    const allHistoricalMonthCount = allHistoricalMonths.size || 1;

    const historicalAverageMonthlyItems = allConfirmedPayments.map(p => ({
      amount: p.amount / allHistoricalMonthCount,
      currency_id: p.currency_id,
      currency: p.currency,
      exchange_rate: p.exchange_rate
    }));

    const historicalAverageMonthly = calculateMonetaryKPI({
      items: historicalAverageMonthlyItems,
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    let averageMonthlyTrend: TrendDirection = 'neutral';
    let averageMonthlyTrendValue = '';
    // Comparar promedio del período actual contra promedio histórico general
    if (historicalAverageMonthly.value > 0 && averageMonthly.value !== historicalAverageMonthly.value) {
      const change = ((averageMonthly.value - historicalAverageMonthly.value) / historicalAverageMonthly.value) * 100;
      averageMonthlyTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      averageMonthlyTrendValue = `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs promedio histórico`;
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

    // Calculate concentration trend from previous period payments
    const previousCategoryTotals = new Map<string, number>();
    previousPeriodPayments.forEach(item => {
      const categoryName = item.general_cost?.name || 'Sin categoría';
      const existing = previousCategoryTotals.get(categoryName) || 0;
      previousCategoryTotals.set(categoryName, existing + item.amount);
    });
    
    let previousMaxAmount = 0;
    previousCategoryTotals.forEach((amount) => {
      if (amount > previousMaxAmount) {
        previousMaxAmount = amount;
      }
    });
    
    const previousAllCategoriesTotal = Array.from(previousCategoryTotals.values()).reduce((sum, v) => sum + v, 0);
    const previousConcentration = previousAllCategoriesTotal > 0 ? Math.round((previousMaxAmount / previousAllCategoriesTotal) * 100) : 0;

    let concentrationTrend: TrendDirection = 'neutral';
    let concentrationTrendValue = '';
    if (previousConcentration > 0) {
      const change = topCategoryPercentage - previousConcentration;
      concentrationTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      concentrationTrendValue = `${change > 0 ? '+' : ''}${change}% vs período anterior`;
    }

    const topCategoryKPI = calculateTextKPI({
      text: topCategory || 'Sin categoría',
      icon: 'tag'
    });

    const periodDivisor = periodMeta.isShortPeriod ? periodMeta.daysCount : monthCount;
    const periodAverageItems = confirmedPayments.map(p => ({
      amount: p.amount / periodDivisor,
      currency_id: p.currency_id,
      currency: p.currency,
      exchange_rate: p.exchange_rate
    }));

    const periodAverage = calculateMonetaryKPI({
      items: periodAverageItems,
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    return {
      totalGasto,
      totalGastoTrend,
      totalGastoTrendValue,
      averageMonthly,
      averageMonthlyTrend,
      averageMonthlyTrendValue,
      periodAverage,
      totalPayments,
      totalPaymentsTrend,
      paymentsPerMonth,
      topCategory: topCategoryKPI,
      topCategoryPercentage,
      topCategoryName: topCategory,
      concentrationTrend,
      concentrationTrendValue,
      previousPeriodGasto: previousTotalGasto.value,
      monthCount
    };
  }, [confirmedPayments, defaultCurrency, filteredByCategory, previousPeriodPayments, selectedPeriod, currentPeriodPaymentsForComparison, periodMeta]);

  const monthlyChartData = useMemo(() => {
    return filteredMonthlySummary.map(m => {
      // Normalize month format to YYYY-MM (e.g., "2025-03")
      const normalizedMonth = m.payment_month.substring(0, 7);
      return {
        month: normalizedMonth,
        value: Number(m.total_amount) || 0
      };
    }).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredMonthlySummary]);

  const currentMonthComparison = useMemo(() => {
    if (monthlyChartData.length < 2) return null;
    
    const chronologicalData = [...monthlyChartData].sort((a, b) => a.month.localeCompare(b.month));
    const currentMonthValue = chronologicalData[chronologicalData.length - 1]?.value ?? 0;
    const historicalValues = chronologicalData.slice(0, -1).map(m => m.value);
    
    return calculateHistoricalComparison(currentMonthValue, historicalValues, {
      windowSize: 6,
      minDataPoints: 2,
      stableThresholdPercent: 5
    });
  }, [monthlyChartData]);

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

  const previousCategoryData = useMemo(() => {
    const categoryTotals = new Map<string, number>();
    
    previousPeriodPayments.forEach(payment => {
      const categoryName = payment.general_cost?.name || 'Sin categoría';
      const existing = categoryTotals.get(categoryName) || 0;
      categoryTotals.set(categoryName, existing + payment.amount);
    });

    return Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [previousPeriodPayments]);

  const paymentsByConcept = useMemo(() => {
    const conceptTotals = new Map<string, { count: number; amount: number }>();
    
    confirmedPayments.forEach(payment => {
      const conceptName = payment.general_cost?.name || 'Sin concepto';
      const existing = conceptTotals.get(conceptName) || { count: 0, amount: 0 };
      conceptTotals.set(conceptName, {
        count: existing.count + 1,
        amount: existing.amount + payment.amount
      });
    });

    return Array.from(conceptTotals.entries())
      .map(([conceptName, data]) => ({
        conceptName,
        paymentsCount: data.count,
        totalAmount: data.amount
      }))
      .sort((a, b) => b.paymentsCount - a.paymentsCount);
  }, [confirmedPayments]);

  const autoInsights = useMemo(() => {
    const context = buildInsightContext({
      totalGasto: kpis.totalGasto.value,
      previousPeriodGasto: kpis.previousPeriodGasto,
      categoryData: allCategoryData,
      previousCategoryData,
      monthlyData: monthlyChartData,
      paymentsCount: confirmedPayments.length,
      monthCount: kpis.monthCount,
      paymentsByConcept,
      isShortPeriod: periodMeta.isShortPeriod,
      daysCount: periodMeta.daysCount,
      currentMonth: new Date().getMonth() + 1
    });
    return generateInsights(context, 3);
  }, [kpis, allCategoryData, previousCategoryData, monthlyChartData, confirmedPayments, paymentsByConcept, periodMeta]);

  const recentActivityItems = useMemo((): ActivityItem[] => {
    return [...confirmedPayments]
      .sort((a, b) => {
        // Primero ordenar por fecha de pago (descendente)
        const dateComparison = new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
        if (dateComparison !== 0) return dateComparison;
        // Si las fechas de pago son iguales, ordenar por fecha de creación (descendente)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 5)
      .map((payment) => ({
        id: payment.id,
        title: payment.general_cost?.name || 'Sin concepto',
        subtitle: `${formatDateShort(payment.payment_date)} · ${payment.general_cost?.category?.name || 'Sin categoría'}`,
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
        badge: <PaymentStatusBadge status="confirmed" />
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
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="kpi-total-gasto">
          <StatCardTitle>
            <DollarSign className="h-4 w-4" />
            {kpiLabels.totalTitle}
          </StatCardTitle>
          <StatCardValue>{defaultCurrency?.symbol} {kpis.totalGasto.formatted}</StatCardValue>
          <StatCardMetaContainer>
            {kpis.totalGastoTrendValue && (
              <StatCardTrend direction={kpis.totalGastoTrend} value={kpis.totalGastoTrendValue} />
            )}
            {!periodMeta.isShortPeriod && (
              <StatCardHistoricalComparison 
                comparison={currentMonthComparison} 
                label="vs promedio mensual"
              />
            )}
          </StatCardMetaContainer>
        </StatCard>

        <StatCard data-testid="kpi-average-monthly">
          <StatCardTitle>
            <TrendingUp className="h-4 w-4" />
            {kpiLabels.averageTitle}
          </StatCardTitle>
          <StatCardValue>{defaultCurrency?.symbol} {kpis.periodAverage?.formatted ?? kpis.averageMonthly.formatted}</StatCardValue>
          <StatCardMetaContainer>
            {!periodMeta.isShortPeriod && kpis.averageMonthlyTrendValue && (
              <StatCardTrend direction={kpis.averageMonthlyTrend} value={kpis.averageMonthlyTrendValue} />
            )}
            <StatCardMeta>{kpiLabels.averageHelper}</StatCardMeta>
          </StatCardMetaContainer>
        </StatCard>

        <StatCard data-testid="kpi-total-payments">
          <StatCardTitle>
            <Calendar className="h-4 w-4" />
            Total Pagos
          </StatCardTitle>
          <StatCardValue>{kpis.totalPayments.formatted}</StatCardValue>
          <StatCardMetaContainer>
            <StatCardTrend 
              direction={kpis.totalPaymentsTrend}
              value={`≈ ${kpis.paymentsPerMonth} pagos por mes`}
            />
          </StatCardMetaContainer>
        </StatCard>

        <StatCard data-testid="kpi-concentration">
          <StatCardTitle>
            <TrendingUp className="h-4 w-4" />
            Concentración del Gasto
          </StatCardTitle>
          <StatCardValue>{kpis.topCategoryPercentage}%</StatCardValue>
          <StatCardMetaContainer>
            <StatCardMeta>{kpis.topCategoryName}</StatCardMeta>
          </StatCardMetaContainer>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard 
          title="Evolución Mensual"
          icon={<BarChart3 />}
          description="Hacé click en un punto para ver los pagos de ese mes"
          data-testid="chart-monthly-trend"
        >
          <MonthlyTrendChart 
            data={monthlyChartData}
            height={280}
            emptyText="No hay datos de gastos registrados"
            clickable
            onBarClick={(month) => handleMonthDrillDown(month)}
          />
        </DashboardCard>

        <DashboardCard 
          title="Distribución por Categoría"
          icon={<PieChart />}
          description="Hacé click en una categoría para ver sus pagos"
          data-testid="chart-category-breakdown"
        >
          <CategoryBreakdownChart 
            data={categoryChartData}
            height={280}
            emptyText="No hay categorías con gastos registrados"
            clickable
            onSliceClick={(name) => handleCategoryDrillDown(name)}
          />
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightCard
          title="Insights"
          titleIcon={<Lightbulb />}
          items={toInsightItems(autoInsights)}
          emptyText="Sin insights en este período. Continuá registrando pagos para obtener análisis."
          onAction={handleInsightAction}
          data-testid="insights-section"
        />

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
