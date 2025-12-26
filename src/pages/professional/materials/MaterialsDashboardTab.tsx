import { useMemo, useCallback } from 'react';
import { TrendingUp, Calendar, DollarSign, Lightbulb, Clock, CreditCard, Plus, BarChart3, PieChart, Package } from 'lucide-react';
import { type InsightAction } from '@/components/dashboard/insights/types';
import { calculateMonetaryKPI, calculateCountKPI, calculateTextKPI } from '@/lib/kpis';
import { format, convertToBaseCurrency } from '@/lib/money';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { useMaterialPayments } from '@/features/materials';
import { 
  StatCard, 
  StatCardTitle, 
  StatCardValue, 
  StatCardMeta,
  StatCardMetaContainer,
  StatCardTrend,
  StatCardHistoricalComparison,
  DashboardCard,
  ActivityCard,
  InsightCard,
  type ActivityItem,
  type TrendDirection
} from '@/components/dashboard';
import { calculateHistoricalComparison, getPeriodMeta, getKPILabels } from '@/lib/analytics';
import { generateInsights, buildInsightContext, toInsightItems } from '@/components/dashboard/insights';
import { DataHealthAlertMulti } from '@/core/data-health';
import { EmptyState } from '@/components/shared/EmptyState';
import { MonthlyTrendChart } from '@/components/charts/line/AreaTrendChart';
import { DonutChart } from '@/components/charts/pie/DonutChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PaymentStatusBadge } from '@/components/shared/PaymentStatusBadge';
import { formatDateShort, parseLocalDate } from '@/lib/date-utils';
import { useProjectContext } from '@/stores/projectContext';
import { useGlobalModalStore } from '@/components/modal';

export type PeriodFilter = '30d' | '3m' | '6m' | '1y' | 'all';

interface MaterialsDashboardTabProps {
  projectId?: string;
  onNavigateToPayments?: () => void;
  onNavigateToTab?: (tab: string, filters?: Record<string, unknown>) => void;
  onScrollToPanel?: (panelId: string) => void;
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

export function calculateAvailablePeriods(allPayments: any[]): Record<PeriodFilter, boolean> {
  const confirmedPayments = allPayments.filter(p => p.status === 'confirmed');
  
  const result: Record<PeriodFilter, boolean> = {
    'all': true,
    '30d': false,
    '3m': false,
    '6m': false,
    '1y': false
  };
  
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

export default function MaterialsDashboardTab({ 
  projectId,
  onNavigateToPayments,
  onNavigateToTab,
  onScrollToPanel,
  selectedPeriod = 'all',
  dismissedIssueIds = new Set(),
  onDismissIssue
}: MaterialsDashboardTabProps) {
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const organizationId = userData?.organization?.id;
  
  const activeProjectId = projectId || selectedProjectId;
  
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);
  const defaultCurrencyId = userData?.organization?.preferences?.default_currency_id;

  const handleInsightAction = useCallback((action: InsightAction) => {
    switch (action.type) {
      case 'navigate':
        if (action.payload.tab === 'payments') {
          if (onNavigateToTab) {
            onNavigateToTab('payments', action.payload);
          } else {
            onNavigateToPayments?.();
          }
        }
        break;
      case 'filter':
        break;
      case 'open':
        if (action.payload.panel && typeof action.payload.panel === 'string') {
          onScrollToPanel?.(action.payload.panel);
        }
        break;
    }
  }, [onNavigateToPayments, onNavigateToTab, onScrollToPanel]);

  const handleMonthDrillDown = useCallback((month: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('payments', { filterMonth: month });
    } else {
      onNavigateToPayments?.();
    }
  }, [onNavigateToTab, onNavigateToPayments]);

  const handleCategoryDrillDown = useCallback((categoryName: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('payments', { filterCategory: categoryName });
    } else {
      onNavigateToPayments?.();
    }
  }, [onNavigateToTab, onNavigateToPayments]);

  const { data: allPayments = [], isLoading: isLoadingPayments } = useMaterialPayments(
    activeProjectId || undefined, 
    organizationId
  );

  const isLoading = isLoadingPayments;

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
      const paymentDateAtMidnight = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate(), 0, 0, 0);
      return paymentDateAtMidnight >= dateFrom;
    });
  }, [allPayments, dateFrom]);

  const dataHealthIssues = useMemo(() => {
    const issues: Array<{
      id: string;
      ruleId: string;
      severity: 'info' | 'warning' | 'critical';
      title: string;
      description: string;
      affectedCount: number;
      affectedEntities?: Array<{ id: string | number; label: string }>;
      recommendedAction: {
        label: string;
        description?: string;
        actionType: 'navigate' | 'edit' | 'bulk_edit' | 'manual';
        targetPath?: string;
      };
    }> = [];

    const paymentsWithoutExchangeRate = allPayments.filter(p => {
      if (!p.currency || !defaultCurrency) return false;
      return p.currency.code !== defaultCurrency.code && !p.exchange_rate;
    });

    if (paymentsWithoutExchangeRate.length > 0) {
      issues.push({
        id: 'missing-exchange-rate',
        ruleId: 'materials-missing-exchange-rate',
        severity: 'warning',
        title: 'Pagos sin cotización',
        description: `${paymentsWithoutExchangeRate.length} pago(s) en moneda extranjera no tienen cotización registrada. Esto afecta los cálculos de totales.`,
        affectedCount: paymentsWithoutExchangeRate.length,
        affectedEntities: paymentsWithoutExchangeRate.map(p => ({ id: p.id, label: p.notes || 'Pago' })),
        recommendedAction: {
          label: 'Editar pagos',
          description: 'Agregá la cotización a los pagos afectados',
          actionType: 'bulk_edit'
        }
      });
    }

    const futurePayments = allPayments.filter(p => {
      const paymentDate = parseLocalDate(p.payment_date);
      if (!paymentDate) return false;
      return paymentDate > new Date();
    });

    if (futurePayments.length > 0) {
      issues.push({
        id: 'future-payments',
        ruleId: 'materials-future-date',
        severity: 'info',
        title: 'Pagos con fecha futura',
        description: `${futurePayments.length} pago(s) tienen fecha posterior a hoy.`,
        affectedCount: futurePayments.length,
        affectedEntities: futurePayments.map(p => ({ id: p.id, label: p.notes || 'Pago' })),
        recommendedAction: {
          label: 'Revisar fechas',
          description: 'Verificá que las fechas sean correctas',
          actionType: 'manual'
        }
      });
    }

    return { issues };
  }, [allPayments, defaultCurrency]);

  const monthlySummary = useMemo(() => {
    const monthMap = new Map<string, number>();
    
    confirmedPayments.forEach(payment => {
      const paymentDate = parseLocalDate(payment.payment_date);
      if (!paymentDate) return;
      
      const month = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      const convertedAmount = convertToBaseCurrency(
        payment.currency?.code || 'ARS',
        defaultCurrency?.code,
        payment.amount,
        payment.exchange_rate ?? null,
        { quoteCurrency: 'USD' }
      );
      
      monthMap.set(month, (monthMap.get(month) || 0) + convertedAmount);
    });

    return Array.from(monthMap.entries())
      .map(([payment_month, total_amount]) => ({ payment_month, total_amount }))
      .sort((a, b) => a.payment_month.localeCompare(b.payment_month));
  }, [confirmedPayments, defaultCurrency]);

  const bySupplier = useMemo(() => {
    const supplierMap = new Map<string, { total: number; count: number }>();
    
    confirmedPayments.forEach(payment => {
      const supplierName = payment.notes?.split(' - ')[0] || 'Sin proveedor';
      const convertedAmount = convertToBaseCurrency(
        payment.currency?.code || 'ARS',
        defaultCurrency?.code,
        payment.amount,
        payment.exchange_rate ?? null,
        { quoteCurrency: 'USD' }
      );
      
      const existing = supplierMap.get(supplierName) || { total: 0, count: 0 };
      supplierMap.set(supplierName, { 
        total: existing.total + convertedAmount, 
        count: existing.count + 1 
      });
    });

    return Array.from(supplierMap.entries())
      .map(([name, data]) => ({ name, value: data.total, count: data.count }))
      .sort((a, b) => b.value - a.value);
  }, [confirmedPayments, defaultCurrency]);

  const filteredMonthlySummary = useMemo(() => {
    if (!dateFrom) return monthlySummary;
    
    const fromMonth = `${dateFrom.getFullYear()}-${String(dateFrom.getMonth() + 1).padStart(2, '0')}`;
    return monthlySummary.filter(m => m.payment_month >= fromMonth);
  }, [monthlySummary, dateFrom]);

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

    let topSupplier = 'Sin datos';
    let maxAmount = 0;
    const supplierTotals = new Map<string, number>();
    
    bySupplier.forEach(item => {
      supplierTotals.set(item.name, item.value);
      if (item.value > maxAmount) {
        maxAmount = item.value;
        topSupplier = item.name;
      }
    });

    const allSuppliersTotal = Array.from(supplierTotals.values()).reduce((sum, v) => sum + v, 0);
    const topSupplierPercentage = allSuppliersTotal > 0 ? Math.round((maxAmount / allSuppliersTotal) * 100) : 0;

    const previousSupplierTotals = new Map<string, number>();
    previousPeriodPayments.forEach(item => {
      const supplierName = item.notes?.split(' - ')[0] || 'Sin proveedor';
      const existing = previousSupplierTotals.get(supplierName) || 0;
      const convertedAmount = convertToBaseCurrency(
        item.currency?.code || 'ARS',
        defaultCurrency?.code,
        item.amount,
        item.exchange_rate ?? null,
        { quoteCurrency: 'USD' }
      );
      previousSupplierTotals.set(supplierName, existing + convertedAmount);
    });
    
    let previousMaxAmount = 0;
    previousSupplierTotals.forEach((amount) => {
      if (amount > previousMaxAmount) {
        previousMaxAmount = amount;
      }
    });
    
    const previousAllSuppliersTotal = Array.from(previousSupplierTotals.values()).reduce((sum, v) => sum + v, 0);
    const previousConcentration = previousAllSuppliersTotal > 0 ? Math.round((previousMaxAmount / previousAllSuppliersTotal) * 100) : 0;

    let concentrationTrend: TrendDirection = 'neutral';
    let concentrationTrendValue = '';
    if (previousConcentration > 0) {
      const change = topSupplierPercentage - previousConcentration;
      concentrationTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      concentrationTrendValue = `${change > 0 ? '+' : ''}${change}% vs período anterior`;
    }

    const topSupplierKPI = calculateTextKPI({
      text: topSupplier || 'Sin proveedor',
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
      topSupplier: topSupplierKPI,
      topSupplierPercentage,
      topSupplierName: topSupplier,
      concentrationTrend,
      concentrationTrendValue,
      previousPeriodGasto: previousTotalGasto.value,
      monthCount
    };
  }, [confirmedPayments, defaultCurrency, bySupplier, previousPeriodPayments, selectedPeriod, currentPeriodPaymentsForComparison, periodMeta, allPayments]);

  const monthlyChartData = useMemo(() => {
    return filteredMonthlySummary.map(m => {
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

  const supplierChartData = useMemo(() => {
    return bySupplier.slice(0, 8);
  }, [bySupplier]);

  const previousSupplierData = useMemo(() => {
    const supplierTotals = new Map<string, number>();
    
    previousPeriodPayments.forEach(payment => {
      const supplierName = payment.notes?.split(' - ')[0] || 'Sin proveedor';
      const existing = supplierTotals.get(supplierName) || 0;
      const convertedAmount = convertToBaseCurrency(
        payment.currency?.code || 'ARS',
        defaultCurrency?.code,
        payment.amount,
        payment.exchange_rate ?? null,
        { quoteCurrency: 'USD' }
      );
      supplierTotals.set(supplierName, existing + convertedAmount);
    });

    return Array.from(supplierTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [previousPeriodPayments, defaultCurrency]);

  const paymentsBySupplier = useMemo(() => {
    const supplierTotals = new Map<string, { count: number; amount: number }>();
    
    confirmedPayments.forEach(payment => {
      const supplierName = payment.notes?.split(' - ')[0] || 'Sin proveedor';
      const existing = supplierTotals.get(supplierName) || { count: 0, amount: 0 };
      supplierTotals.set(supplierName, {
        count: existing.count + 1,
        amount: existing.amount + payment.amount
      });
    });

    return Array.from(supplierTotals.entries())
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
      categoryData: bySupplier,
      previousCategoryData: previousSupplierData,
      monthlyData: monthlyChartData,
      paymentsCount: confirmedPayments.length,
      monthCount: kpis.monthCount,
      paymentsByConcept: paymentsBySupplier,
      isShortPeriod: periodMeta.isShortPeriod,
      daysCount: periodMeta.daysCount,
      currentMonth: new Date().getMonth() + 1
    });
    return generateInsights(context, 3);
  }, [kpis, bySupplier, previousSupplierData, monthlyChartData, confirmedPayments, paymentsBySupplier, periodMeta]);

  const recentActivityItems = useMemo((): ActivityItem[] => {
    return [...confirmedPayments]
      .sort((a, b) => {
        const dateComparison = new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
        if (dateComparison !== 0) return dateComparison;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 5)
      .map((payment) => ({
        id: payment.id,
        title: payment.notes?.split(' - ')[0] || 'Pago de materiales',
        subtitle: `${formatDateShort(payment.payment_date)} · ${payment.project?.name || 'Sin proyecto'}`,
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
        icon={<Package className="w-12 h-12" />}
        title="Todavía no tenés pagos de materiales registrados"
        description="Comienza registrando tu primer pago de materiales para ver el dashboard con estadísticas y análisis."
        action={
          <Button
            onClick={() => openModal('material-payment', {
              projectId: activeProjectId,
              organizationId,
              mode: 'create'
            })}
            data-testid="button-create-first-payment"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Primer Pago
          </Button>
        }
        data-testid="empty-dashboard-state"
      />
    );
  }

  return (
    <div className="space-y-6" data-testid="materials-dashboard">
      <DataHealthAlertMulti
        issues={dataHealthIssues.issues}
        entityLabel="pago"
        dismissedIssueIds={dismissedIssueIds}
        onDismissIssue={(issueId: string) => {
          onDismissIssue?.(issueId);
        }}
        onToggleFilter={() => {}}
      />

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
            Concentración
          </StatCardTitle>
          <StatCardValue>{kpis.topSupplierPercentage}%</StatCardValue>
          <StatCardMetaContainer>
            <StatCardMeta>{kpis.topSupplierName}</StatCardMeta>
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
            emptyText="No hay datos de pagos registrados"
            clickable
            onBarClick={(month) => handleMonthDrillDown(month)}
          />
        </DashboardCard>

        <DashboardCard 
          title="Distribución por Proveedor"
          icon={<PieChart />}
          description="Hacé click en un proveedor para ver sus pagos"
          data-testid="chart-supplier-breakdown"
        >
          <DonutChart 
            data={supplierChartData.map(d => ({ label: d.name, value: d.value }))}
            height={280}
            emptyText="No hay proveedores con pagos registrados"
            clickable
            onClick={(label) => handleCategoryDrillDown(label)}
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
