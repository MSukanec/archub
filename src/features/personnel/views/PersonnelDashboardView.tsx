import { useMemo, useCallback } from 'react';
import { TrendingUp, DollarSign, CreditCard, Lightbulb, Clock, Plus, BarChart3, PieChart, Users } from 'lucide-react';
import { type InsightAction } from '@/components/insights/types';
import { calculateMonetaryKPI, calculateCountKPI, calculateTextKPI } from '@/lib/kpis';
import { format, convertToBaseCurrency } from '@/lib/money';
import { useCurrentUser } from '@/features/users/hooks';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { usePersonnelPayments } from '@/features/personnel';
import { useProjectContext } from '@/stores/projectContext';
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
} from '@/components';
import { calculateHistoricalComparison, getPeriodMeta, getKPILabels } from '@/lib/analytics';
import { generateInsights, buildInsightContext, toInsightItems } from '@/components/insights';
import { DataHealthAlertMulti, type DataIssue } from '@/core/data-health';
import { EmptyState } from '@/components/shared/EmptyState';
import { MonthlyTrendChart } from '@/components/charts/line/AreaTrendChart';
import { DonutChart } from '@/components/charts/pie/DonutChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PaymentStatusBadge } from '@/components/shared/PaymentStatusBadge';
import { formatDateShort, parseLocalDate } from '@/lib/date-utils';

export type PeriodFilter = '30d' | '3m' | '6m' | '1y' | 'all';

interface PersonnelDashboardTabProps {
  projectId?: string;
  onNavigateToPayments?: () => void;
  onNavigateToTab?: (tab: string, filters?: Record<string, unknown>) => void;
  onScrollToPanel?: (panelId: string) => void;
  selectedPeriod?: PeriodFilter;
  dismissedIssueIds?: Set<string>;
  onDismissIssue?: (issueId: string) => void;
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

function getPersonnelName(payment: any): string {
  if (payment.personnel?.contact?.full_name) {
    return payment.personnel.contact.full_name;
  }
  if (payment.personnel?.contact?.first_name && payment.personnel?.contact?.last_name) {
    return `${payment.personnel.contact.first_name} ${payment.personnel.contact.last_name}`;
  }
  return 'Sin asignar';
}

export default function PersonnelDashboardTab({ 
  projectId,
  onNavigateToPayments,
  onNavigateToTab,
  onScrollToPanel,
  selectedPeriod = 'all',
  dismissedIssueIds = new Set(),
  onDismissIssue
}: PersonnelDashboardTabProps) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { selectedProjectId } = useProjectContext();
  
  const activeProjectId = projectId || selectedProjectId;
  
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);

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
        if (action.payload.category && typeof action.payload.category === 'string') {
          onNavigateToTab?.('payments', { filterPersonnel: action.payload.category });
        }
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

  const handlePersonnelDrillDown = useCallback((personnelName: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('payments', { filterPersonnel: personnelName });
    } else {
      onNavigateToPayments?.();
    }
  }, [onNavigateToTab, onNavigateToPayments]);

  const { data: allPayments = [], isLoading } = usePersonnelPayments(activeProjectId || undefined, organizationId);

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

  const dataHealthIssues = useMemo((): DataIssue[] => {
    const issues: DataIssue[] = [];
    
    const paymentsWithoutPersonnel = confirmedPayments.filter(p => !p.personnel_id);
    if (paymentsWithoutPersonnel.length > 0) {
      issues.push({
        id: 'personnel-missing-personnel',
        ruleId: 'personnel-missing-personnel',
        severity: 'warning',
        title: 'Pagos sin personal asignado',
        description: `${paymentsWithoutPersonnel.length} pago(s) no tienen personal asignado`,
        affectedCount: paymentsWithoutPersonnel.length,
        recommendedAction: {
          label: 'Asignar personal',
          actionType: 'navigate',
          targetPath: '/personnel/payments'
        }
      });
    }
    
    const paymentsWithMissingExchangeRate = confirmedPayments.filter(p => {
      if (!p.currency?.code || !defaultCurrency?.code) return false;
      return p.currency.code !== defaultCurrency.code && !p.exchange_rate;
    });
    if (paymentsWithMissingExchangeRate.length > 0) {
      issues.push({
        id: 'personnel-missing-exchange-rate',
        ruleId: 'personnel-missing-exchange-rate',
        severity: 'critical',
        title: 'Pagos sin tipo de cambio',
        description: `${paymentsWithMissingExchangeRate.length} pago(s) en moneda extranjera sin tipo de cambio`,
        affectedCount: paymentsWithMissingExchangeRate.length,
        recommendedAction: {
          label: 'Agregar tipo de cambio',
          actionType: 'navigate',
          targetPath: '/personnel/payments'
        }
      });
    }
    
    return issues;
  }, [confirmedPayments, defaultCurrency]);

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

  const personnelData = useMemo(() => {
    const personnelTotals = new Map<string, number>();
    
    confirmedPayments.forEach(payment => {
      const personnelName = getPersonnelName(payment);
      const existing = personnelTotals.get(personnelName) || 0;
      personnelTotals.set(personnelName, existing + payment.amount);
    });

    return Array.from(personnelTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [confirmedPayments]);

  const previousPersonnelData = useMemo(() => {
    const personnelTotals = new Map<string, number>();
    
    previousPeriodPayments.forEach(payment => {
      const personnelName = getPersonnelName(payment);
      const existing = personnelTotals.get(personnelName) || 0;
      personnelTotals.set(personnelName, existing + payment.amount);
    });

    return Array.from(personnelTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [previousPeriodPayments]);

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

    let topPersonnel = 'Sin datos';
    let maxAmount = 0;
    
    personnelData.forEach(item => {
      if (item.value > maxAmount) {
        maxAmount = item.value;
        topPersonnel = item.name;
      }
    });

    const allPersonnelTotal = personnelData.reduce((sum, v) => sum + v.value, 0);
    const topPersonnelPercentage = allPersonnelTotal > 0 ? Math.round((maxAmount / allPersonnelTotal) * 100) : 0;

    const previousPersonnelTotals = new Map<string, number>();
    previousPeriodPayments.forEach(payment => {
      const personnelName = getPersonnelName(payment);
      const existing = previousPersonnelTotals.get(personnelName) || 0;
      previousPersonnelTotals.set(personnelName, existing + payment.amount);
    });
    
    let previousMaxAmount = 0;
    previousPersonnelTotals.forEach((amount) => {
      if (amount > previousMaxAmount) {
        previousMaxAmount = amount;
      }
    });
    
    const previousAllPersonnelTotal = Array.from(previousPersonnelTotals.values()).reduce((sum, v) => sum + v, 0);
    const previousConcentration = previousAllPersonnelTotal > 0 ? Math.round((previousMaxAmount / previousAllPersonnelTotal) * 100) : 0;

    let concentrationTrend: TrendDirection = 'neutral';
    let concentrationTrendValue = '';
    if (previousConcentration > 0) {
      const change = topPersonnelPercentage - previousConcentration;
      concentrationTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      concentrationTrendValue = `${change > 0 ? '+' : ''}${change}% vs período anterior`;
    }

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
      topPersonnelPercentage,
      topPersonnelName: topPersonnel,
      concentrationTrend,
      concentrationTrendValue,
      previousPeriodGasto: previousTotalGasto.value,
      monthCount
    };
  }, [confirmedPayments, defaultCurrency, personnelData, previousPeriodPayments, selectedPeriod, currentPeriodPaymentsForComparison, periodMeta, allPayments]);

  const monthlyChartData = useMemo(() => {
    const monthlyTotals = new Map<string, number>();
    
    confirmedPayments.forEach(payment => {
      const date = parseLocalDate(payment.payment_date);
      if (!date) return;
      
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const convertedAmount = convertToBaseCurrency(
        payment.currency?.code || 'ARS',
        defaultCurrency?.code,
        payment.amount,
        payment.exchange_rate ?? null,
        { quoteCurrency: 'USD' }
      );
      
      const existing = monthlyTotals.get(month) || 0;
      monthlyTotals.set(month, existing + convertedAmount);
    });

    return Array.from(monthlyTotals.entries())
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [confirmedPayments, defaultCurrency]);

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

  const personnelChartData = useMemo(() => {
    return personnelData.slice(0, 8);
  }, [personnelData]);

  const paymentsByPersonnel = useMemo(() => {
    const personnelCounts = new Map<string, { count: number; amount: number }>();
    
    confirmedPayments.forEach(payment => {
      const personnelName = getPersonnelName(payment);
      const existing = personnelCounts.get(personnelName) || { count: 0, amount: 0 };
      personnelCounts.set(personnelName, {
        count: existing.count + 1,
        amount: existing.amount + payment.amount
      });
    });

    return Array.from(personnelCounts.entries())
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
      categoryData: personnelData,
      previousCategoryData: previousPersonnelData,
      monthlyData: monthlyChartData,
      paymentsCount: confirmedPayments.length,
      monthCount: kpis.monthCount,
      paymentsByConcept: paymentsByPersonnel,
      isShortPeriod: periodMeta.isShortPeriod,
      daysCount: periodMeta.daysCount,
      currentMonth: new Date().getMonth() + 1
    });
    return generateInsights(context, 3);
  }, [kpis, personnelData, previousPersonnelData, monthlyChartData, confirmedPayments, paymentsByPersonnel, periodMeta]);

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
        title: getPersonnelName(payment),
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
        icon={<Users className="w-12 h-12" />}
        title="Todavía no tenés pagos de mano de obra registrados"
        description="Comienza registrando tu primer pago de mano de obra para ver el dashboard."
        action={
          <Button
            onClick={onNavigateToPayments}
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
    <div className="space-y-6" data-testid="personnel-dashboard">
      <DataHealthAlertMulti
        issues={dataHealthIssues}
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
            <CreditCard className="h-4 w-4" />
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
          <StatCardValue>{kpis.topPersonnelPercentage}%</StatCardValue>
          <StatCardMetaContainer>
            <StatCardMeta>{kpis.topPersonnelName}</StatCardMeta>
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
          title="Distribución por Personal"
          icon={<PieChart />}
          description="Hacé click en un trabajador para ver sus pagos"
          data-testid="chart-personnel-breakdown"
        >
          <DonutChart 
            data={personnelChartData.map(d => ({ label: d.name, value: d.value }))}
            height={280}
            emptyText="No hay personal con pagos registrados"
            clickable
            onClick={(label) => handlePersonnelDrillDown(label)}
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
