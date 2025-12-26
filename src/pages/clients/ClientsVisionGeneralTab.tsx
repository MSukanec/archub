import { useMemo, useCallback } from 'react';
import { TrendingUp, Calendar, DollarSign, Users, Lightbulb, Clock, Plus, BarChart3, PieChart, Receipt } from 'lucide-react';
import { LuHandshake } from 'react-icons/lu';
import { type InsightAction } from '@/components/dashboard/insights/types';
import { calculateMonetaryKPI, calculateCountKPI, formatBreakdown } from '@/lib/kpis';
import { format, convertToBaseCurrency } from '@/lib/money';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { useClientPayments, useClientDashboard } from '@/features/clients';
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
} from '@/components/dashboard';
import { calculateHistoricalComparison, getPeriodMeta, getKPILabels } from '@/lib/analytics';
import { generateInsights, buildInsightContext, toInsightItems } from '@/components/dashboard/insights';
import { EmptyState } from '@/components/shared/EmptyState';
import { MonthlyTrendChart } from '@/components/charts/line/AreaTrendChart';
import { DonutChart } from '@/components/charts/pie/DonutChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PaymentStatusBadge } from '@/components/shared/PaymentStatusBadge';
import { formatDateShort, parseLocalDate } from '@/lib/date-utils';
import { type ClientPeriodFilter } from './Clients';

interface ClientsVisionGeneralTabProps {
  onNavigateToList?: () => void;
  onNavigateToPayments?: () => void;
  onNavigateToTab?: (tab: string, filters?: Record<string, unknown>) => void;
  onScrollToPanel?: (panelId: string) => void;
  onFilterClient?: (clientId: string) => void;
  selectedPeriod?: ClientPeriodFilter;
}

function getDateFromForPeriod(period: ClientPeriodFilter): Date | null {
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

function getPreviousPeriodDateRange(period: ClientPeriodFilter): { from: Date; to: Date } | null {
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

export function calculateAvailablePeriods(allPayments: any[]): Record<ClientPeriodFilter, boolean> {
  const confirmedPayments = allPayments.filter(p => p.status === 'confirmed');
  
  const result: Record<ClientPeriodFilter, boolean> = {
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

export default function ClientsVisionGeneralTab({ 
  onNavigateToList, 
  onNavigateToPayments,
  onNavigateToTab,
  onScrollToPanel,
  onFilterClient,
  selectedPeriod = 'all',
}: ClientsVisionGeneralTabProps) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { selectedProjectId } = useProjectContext();
  
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);

  const handleInsightAction = useCallback((action: InsightAction) => {
    switch (action.type) {
      case 'navigate':
        if (action.payload.tab === 'list') {
          onNavigateToList?.();
        } else if (action.payload.tab === 'payments') {
          if (onNavigateToTab) {
            onNavigateToTab('payments', action.payload);
          } else {
            onNavigateToPayments?.();
          }
        }
        break;
      case 'filter':
        if (action.payload.clientId && typeof action.payload.clientId === 'string') {
          onFilterClient?.(action.payload.clientId);
        }
        break;
      case 'open':
        if (action.payload.panel && typeof action.payload.panel === 'string') {
          onScrollToPanel?.(action.payload.panel);
        }
        break;
    }
  }, [onNavigateToList, onNavigateToPayments, onNavigateToTab, onScrollToPanel, onFilterClient]);

  const handleMonthDrillDown = useCallback((month: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('payments', { filterMonth: month });
    } else {
      onNavigateToPayments?.();
    }
  }, [onNavigateToTab, onNavigateToPayments]);

  const handleClientDrillDown = useCallback((clientName: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('payments', { filterClient: clientName });
    } else {
      onNavigateToPayments?.();
    }
  }, [onNavigateToTab, onNavigateToPayments]);

  const { data: allPayments = [], isLoading: isLoadingPayments } = useClientPayments(selectedProjectId || undefined, organizationId);
  const { data: dashboardData, isLoading: isLoadingDashboard } = useClientDashboard(selectedProjectId || undefined, organizationId);

  const isLoading = isLoadingPayments || isLoadingDashboard;

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
    const totalCobrado = calculateMonetaryKPI({
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

    const previousTotalCobrado = calculateMonetaryKPI({
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

    let totalCobradoTrend: TrendDirection = 'neutral';
    let totalCobradoTrendValue = '';
    if (previousTotalCobrado.value > 0) {
      const change = ((currentPeriodTotalForTrend.value - previousTotalCobrado.value) / previousTotalCobrado.value) * 100;
      totalCobradoTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      const periodLabel = selectedPeriod === 'all' ? 'vs año anterior' : 'vs período anterior';
      totalCobradoTrendValue = `${change > 0 ? '+' : ''}${Math.round(change)}% ${periodLabel}`;
    }

    const months = new Set(confirmedPayments.map(p => {
      const date = parseLocalDate(p.payment_date);
      if (!date) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }).filter(m => m !== ''));
    const monthCount = months.size || 1;

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

    const totalPayments = calculateCountKPI({
      count: confirmedPayments.length,
      label: 'pagos'
    });

    const paymentsPerMonth = monthCount > 0 ? Math.round(confirmedPayments.length / monthCount) : 0;

    const totalClients = calculateCountKPI({
      count: dashboardData?.clients?.length || 0,
      label: 'clientes'
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
      totalCobrado,
      totalCobradoTrend,
      totalCobradoTrendValue,
      averageMonthly,
      periodAverage,
      totalPayments,
      paymentsPerMonth,
      totalClients,
      previousPeriodCobrado: previousTotalCobrado.value,
      monthCount
    };
  }, [confirmedPayments, defaultCurrency, previousPeriodPayments, selectedPeriod, currentPeriodPaymentsForComparison, periodMeta, dashboardData?.clients?.length]);

  const monthlyChartData = useMemo(() => {
    const monthlyTotals = new Map<string, number>();
    
    confirmedPayments.forEach(payment => {
      const date = parseLocalDate(payment.payment_date);
      if (!date) return;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amount = convertToBaseCurrency(
        payment.currency?.code || 'ARS',
        defaultCurrency?.code,
        payment.amount,
        payment.exchange_rate ?? null,
        { quoteCurrency: 'USD' }
      );
      
      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + amount);
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

  const clientChartData = useMemo(() => {
    const clientTotals = new Map<string, number>();
    
    confirmedPayments.forEach(payment => {
      const clientName = payment.client?.contact?.full_name || 
                        payment.client?.contact?.company_name ||
                        `${payment.client?.contact?.first_name || ''} ${payment.client?.contact?.last_name || ''}`.trim() ||
                        'Sin cliente';
      
      const amount = convertToBaseCurrency(
        payment.currency?.code || 'ARS',
        defaultCurrency?.code,
        payment.amount,
        payment.exchange_rate ?? null,
        { quoteCurrency: 'USD' }
      );
      
      clientTotals.set(clientName, (clientTotals.get(clientName) || 0) + amount);
    });

    return Array.from(clientTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [confirmedPayments, defaultCurrency]);

  const autoInsights = useMemo(() => {
    const context = buildInsightContext({
      totalGasto: kpis.totalCobrado.value,
      previousPeriodGasto: kpis.previousPeriodCobrado,
      categoryData: clientChartData,
      previousCategoryData: [],
      monthlyData: monthlyChartData,
      paymentsCount: confirmedPayments.length,
      monthCount: kpis.monthCount,
      paymentsByConcept: [],
      isShortPeriod: periodMeta.isShortPeriod,
      daysCount: periodMeta.daysCount,
      currentMonth: new Date().getMonth() + 1
    });
    return generateInsights(context, 3);
  }, [kpis, clientChartData, monthlyChartData, confirmedPayments, periodMeta]);

  const recentActivityItems = useMemo((): ActivityItem[] => {
    return [...confirmedPayments]
      .sort((a, b) => {
        const dateComparison = new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
        if (dateComparison !== 0) return dateComparison;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 5)
      .map((payment) => {
        const clientName = payment.client?.contact?.full_name || 
                          payment.client?.contact?.company_name ||
                          `${payment.client?.contact?.first_name || ''} ${payment.client?.contact?.last_name || ''}`.trim() ||
                          'Sin cliente';
        
        return {
          id: payment.id,
          title: clientName,
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
          badge: <PaymentStatusBadge status="confirmed" />
        };
      });
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

  if (!selectedProjectId) {
    return (
      <EmptyState 
        icon={<LuHandshake className="w-12 h-12" />}
        title="Selecciona un proyecto"
        description="Selecciona un proyecto del selector superior para ver el dashboard de clientes."
        data-testid="empty-no-project-state"
      />
    );
  }

  if (allPayments.length === 0) {
    return (
      <EmptyState 
        icon={<LuHandshake className="w-12 h-12" />}
        title="Todavía no tenés pagos de clientes registrados"
        description="Comienza registrando compromisos y pagos de clientes para ver el análisis financiero."
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
    <div className="space-y-6" data-testid="clients-dashboard">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="kpi-total-cobrado">
          <StatCardTitle>
            <DollarSign className="h-4 w-4" />
            {kpiLabels.totalTitle.replace('Gasto', 'Cobrado')}
          </StatCardTitle>
          <StatCardValue>{defaultCurrency?.symbol} {kpis.totalCobrado.formatted}</StatCardValue>
          <StatCardMetaContainer>
            {kpis.totalCobradoTrendValue && (
              <StatCardTrend direction={kpis.totalCobradoTrend} value={kpis.totalCobradoTrendValue} />
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
            {kpiLabels.averageTitle.replace('Gasto', 'Cobro')}
          </StatCardTitle>
          <StatCardValue>{defaultCurrency?.symbol} {kpis.periodAverage?.formatted ?? kpis.averageMonthly.formatted}</StatCardValue>
          <StatCardMetaContainer>
            <StatCardMeta>{kpiLabels.averageHelper}</StatCardMeta>
          </StatCardMetaContainer>
        </StatCard>

        <StatCard data-testid="kpi-total-payments">
          <StatCardTitle>
            <Receipt className="h-4 w-4" />
            Total Pagos
          </StatCardTitle>
          <StatCardValue>{kpis.totalPayments.formatted}</StatCardValue>
          <StatCardMetaContainer>
            <StatCardMeta>≈ {kpis.paymentsPerMonth} pagos por mes</StatCardMeta>
          </StatCardMetaContainer>
        </StatCard>

        <StatCard data-testid="kpi-total-clients">
          <StatCardTitle>
            <Users className="h-4 w-4" />
            Clientes Activos
          </StatCardTitle>
          <StatCardValue>{kpis.totalClients.formatted}</StatCardValue>
          <StatCardMetaContainer>
            <StatCardMeta>En este proyecto</StatCardMeta>
          </StatCardMetaContainer>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard 
          title="Evolución de Cobros"
          icon={<BarChart3 />}
          description="Hacé click en un punto para ver los pagos de ese mes"
          data-testid="chart-monthly-trend"
        >
          <MonthlyTrendChart 
            data={monthlyChartData}
            height={280}
            emptyText="No hay datos de cobros registrados"
            clickable
            onBarClick={(month) => handleMonthDrillDown(month)}
          />
        </DashboardCard>

        <DashboardCard 
          title="Distribución por Cliente"
          icon={<PieChart />}
          description="Hacé click en un cliente para ver sus pagos"
          data-testid="chart-client-breakdown"
        >
          <DonutChart 
            data={clientChartData.map(d => ({ label: d.name, value: d.value }))}
            height={280}
            emptyText="No hay clientes con pagos registrados"
            clickable
            onClick={(label) => handleClientDrillDown(label)}
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
