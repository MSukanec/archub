import { useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Scale, Lightbulb, Clock, BarChart3, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { type InsightAction, type MonthlyFinancialData } from '@/components/dashboard/insights/types';
import { calculateMonetaryKPI, calculateCountKPI, formatBreakdown, hasMultipleCurrencies } from '@/lib/kpis';
import { format as formatMoney, formatKPI, convertToBaseCurrency } from '@/lib/money';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { 
  StatCard, 
  StatCardTitle, 
  StatCardValue, 
  StatCardMeta,
  StatCardTrend,
  StatCardHistoricalComparison,
  DashboardCard,
  ActivityCard,
  InsightCard,
  type ActivityItem,
  type TrendDirection
} from '@/components/dashboard';
import { calculateHistoricalComparison, getPeriodMeta, getKPILabels } from '@/lib/analytics';
import { generateFinancialInsights, buildInsightContext, toInsightItems } from '@/components/dashboard/insights';
import { EmptyState } from '@/components/shared/EmptyState';
import { MultiSeriesTrendChart } from '@/components/charts/line/AreaTrendChart';
import { DonutChart } from '@/components/charts/pie/DonutChart';
import { HorizontalBarChart } from '@/components/charts/bar/HorizontalBarChart';
import { cn } from '@/lib/utils';
import { Wallet, Coins } from 'lucide-react';
import { formatDateShort, parseLocalDate } from '@/lib/date-utils';
import { PaymentStatusBadge } from '@/components/shared/PaymentStatusBadge';

export type PeriodFilter = '30d' | '3m' | '6m' | '1y' | 'all';

interface ProjectFinancesDashboardViewProps {
  movements: any[];
  organizationId?: string;
  onNavigateToMovements?: () => void;
  onNavigateToTab?: (tab: string, filters?: Record<string, unknown>) => void;
  onScrollToPanel?: (panelId: string) => void;
  selectedPeriod?: PeriodFilter;
  dismissedIssueIds?: Set<string>;
  onDismissIssue?: (issueId: string) => void;
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  client_payment: 'Cobros Clientes',
  material_payment: 'Pagos Materiales',
  personnel_payment: 'Pagos Personal',
};

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

export function calculateAvailablePeriods(allMovements: any[]): Record<PeriodFilter, boolean> {
  const confirmedMovements = allMovements.filter(m => m.status === 'confirmed');
  
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
    
    const hasData = confirmedMovements.some(m => {
      const movementDate = parseLocalDate(m.payment_date);
      if (!movementDate) return false;
      const movementDateAtMidnight = new Date(movementDate.getFullYear(), movementDate.getMonth(), movementDate.getDate(), 0, 0, 0);
      return movementDateAtMidnight >= dateFrom;
    });
    
    result[period] = hasData;
  });
  
  return result;
}

export function ProjectFinancesDashboardView({ 
  movements: allMovements = [],
  organizationId,
  onNavigateToMovements,
  onNavigateToTab,
  onScrollToPanel,
  selectedPeriod = 'all',
  dismissedIssueIds = new Set(),
  onDismissIssue
}: ProjectFinancesDashboardViewProps) {
  const { data: userData } = useCurrentUser();
  const orgId = organizationId || userData?.organization?.id;
  
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(orgId);

  const handleInsightAction = useCallback((action: InsightAction) => {
    switch (action.type) {
      case 'navigate':
        if (action.payload.tab === 'movements') {
          if (onNavigateToTab) {
            onNavigateToTab('movements', action.payload);
          } else {
            onNavigateToMovements?.();
          }
        }
        break;
      case 'open':
        if (action.payload.panel && typeof action.payload.panel === 'string') {
          onScrollToPanel?.(action.payload.panel);
        }
        break;
    }
  }, [onNavigateToMovements, onNavigateToTab, onScrollToPanel]);

  const handleMonthDrillDown = useCallback((month: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('movements', { filterMonth: month });
    } else {
      onNavigateToMovements?.();
    }
  }, [onNavigateToTab, onNavigateToMovements]);

  const handleCategoryDrillDown = useCallback((categoryName: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('movements', { filterType: categoryName });
    } else {
      onNavigateToMovements?.();
    }
  }, [onNavigateToTab, onNavigateToMovements]);

  const dateFrom = useMemo(() => getDateFromForPeriod(selectedPeriod), [selectedPeriod]);

  const periodMeta = useMemo(() => {
    const now = new Date();
    return getPeriodMeta(dateFrom, now);
  }, [dateFrom]);

  const kpiLabels = useMemo(() => getKPILabels(periodMeta), [periodMeta]);

  const confirmedMovements = useMemo(() => {
    const confirmed = allMovements.filter(m => m.status === 'confirmed');
    
    if (!dateFrom) return confirmed;
    
    return confirmed.filter(m => {
      const movementDate = parseLocalDate(m.payment_date);
      if (!movementDate) return false;
      const movementDateAtMidnight = new Date(movementDate.getFullYear(), movementDate.getMonth(), movementDate.getDate(), 0, 0, 0);
      return movementDateAtMidnight >= dateFrom;
    });
  }, [allMovements, dateFrom]);

  const previousPeriodMovements = useMemo(() => {
    const previousRange = getPreviousPeriodDateRange(selectedPeriod);
    if (!previousRange) return [];
    
    const allConfirmed = allMovements.filter(m => m.status === 'confirmed');
    return allConfirmed.filter(m => {
      const movementDate = parseLocalDate(m.payment_date);
      if (!movementDate) return false;
      const movementDateAtMidnight = new Date(movementDate.getFullYear(), movementDate.getMonth(), movementDate.getDate(), 0, 0, 0);
      return movementDateAtMidnight >= previousRange.from && movementDateAtMidnight < previousRange.to;
    });
  }, [allMovements, selectedPeriod]);

  const ingresoTypes = ['client_payment'];
  const egresoTypes = ['material_payment', 'personnel_payment'];

  const kpis = useMemo(() => {
    const ingresosMovements = confirmedMovements.filter(m => ingresoTypes.includes(m.movement_type));
    const egresosMovements = confirmedMovements.filter(m => egresoTypes.includes(m.movement_type));

    const totalIngresos = calculateMonetaryKPI({
      items: ingresosMovements.map(m => ({
        amount: m.amount,
        currency_id: m.currency_id,
        currency: m.currency,
        exchange_rate: m.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    const totalEgresos = calculateMonetaryKPI({
      items: egresosMovements.map(m => ({
        amount: m.amount,
        currency_id: m.currency_id,
        currency: m.currency,
        exchange_rate: m.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    const balance = totalIngresos.value - totalEgresos.value;

    const previousIngresosMovements = previousPeriodMovements.filter(m => ingresoTypes.includes(m.movement_type));
    const previousEgresosMovements = previousPeriodMovements.filter(m => egresoTypes.includes(m.movement_type));

    const previousIngresos = calculateMonetaryKPI({
      items: previousIngresosMovements.map(m => ({
        amount: m.amount,
        currency_id: m.currency_id,
        currency: m.currency,
        exchange_rate: m.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    const previousEgresos = calculateMonetaryKPI({
      items: previousEgresosMovements.map(m => ({
        amount: m.amount,
        currency_id: m.currency_id,
        currency: m.currency,
        exchange_rate: m.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol,
      quoteCurrency: 'USD'
    });

    let ingresosTrend: TrendDirection = 'neutral';
    let ingresosTrendValue = '';
    if (previousIngresos.value > 0) {
      const change = ((totalIngresos.value - previousIngresos.value) / previousIngresos.value) * 100;
      ingresosTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      const periodLabel = selectedPeriod === 'all' ? 'vs año anterior' : 'vs período anterior';
      ingresosTrendValue = `${change > 0 ? '+' : ''}${Math.round(change)}% ${periodLabel}`;
    }

    let egresosTrend: TrendDirection = 'neutral';
    let egresosTrendValue = '';
    if (previousEgresos.value > 0) {
      const change = ((totalEgresos.value - previousEgresos.value) / previousEgresos.value) * 100;
      egresosTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      const periodLabel = selectedPeriod === 'all' ? 'vs año anterior' : 'vs período anterior';
      egresosTrendValue = `${change > 0 ? '+' : ''}${Math.round(change)}% ${periodLabel}`;
    }

    const totalMovements = calculateCountKPI({
      count: confirmedMovements.length,
      label: 'movimientos'
    });

    const months = new Set(confirmedMovements.map(m => {
      const date = parseLocalDate(m.payment_date);
      if (!date) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }).filter(m => m !== ''));
    const monthCount = months.size || 1;

    return {
      totalIngresos,
      totalEgresos,
      balance,
      ingresosTrend,
      ingresosTrendValue,
      egresosTrend,
      egresosTrendValue,
      totalMovements,
      monthCount,
      previousIngresos: previousIngresos.value,
      previousEgresos: previousEgresos.value
    };
  }, [confirmedMovements, defaultCurrency, previousPeriodMovements, selectedPeriod, ingresoTypes, egresoTypes]);

  const monthlyChartData = useMemo(() => {
    const monthlyTotals = new Map<string, number>();
    
    allMovements.forEach(m => {
      if (m.status !== 'confirmed') return;
      const date = parseLocalDate(m.payment_date);
      if (!date) return;
      if (dateFrom) {
        const movementDateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        if (movementDateAtMidnight < dateFrom) return;
      }
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const convertedAmount = convertToBaseCurrency(
        m.currency?.code || 'ARS',
        defaultCurrency?.code,
        m.signed_amount ?? m.amount,
        m.exchange_rate ?? null,
        { quoteCurrency: 'USD' }
      );
      
      const existing = monthlyTotals.get(monthKey) || 0;
      monthlyTotals.set(monthKey, existing + convertedAmount);
    });

    return Array.from(monthlyTotals.entries())
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [allMovements, dateFrom, defaultCurrency]);

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

  const categoryChartData = useMemo(() => {
    const typeTotals = new Map<string, number>();
    
    confirmedMovements.forEach(m => {
      const convertedAmount = convertToBaseCurrency(
        m.currency?.code || 'ARS',
        defaultCurrency?.code,
        Math.abs(m.amount),
        m.exchange_rate ?? null,
        { quoteCurrency: 'USD' }
      );
      
      const existing = typeTotals.get(m.movement_type) || 0;
      typeTotals.set(m.movement_type, existing + convertedAmount);
    });

    return Array.from(typeTotals.entries())
      .map(([type, value]) => ({
        name: MOVEMENT_TYPE_LABELS[type] || type,
        value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [confirmedMovements, defaultCurrency]);

  const incomeExpenseChartData = useMemo(() => {
    const monthlyData = new Map<string, { income: number; expense: number }>();
    
    allMovements.forEach(m => {
      if (m.status !== 'confirmed') return;
      const date = parseLocalDate(m.payment_date);
      if (!date) return;
      if (dateFrom) {
        const movementDateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        if (movementDateAtMidnight < dateFrom) return;
      }
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const convertedAmount = convertToBaseCurrency(
        m.currency?.code || 'ARS',
        defaultCurrency?.code,
        Math.abs(m.amount),
        m.exchange_rate ?? null,
        { quoteCurrency: 'USD' }
      );
      
      const existing = monthlyData.get(monthKey) || { income: 0, expense: 0 };
      const isIngreso = ingresoTypes.includes(m.movement_type);
      
      if (isIngreso) {
        existing.income += convertedAmount;
      } else {
        existing.expense += convertedAmount;
      }
      monthlyData.set(monthKey, existing);
    });

    return Array.from(monthlyData.entries())
      .map(([period, data]) => ({
        period,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [allMovements, dateFrom, defaultCurrency, ingresoTypes]);

  const monthlyFinancialData: MonthlyFinancialData[] = useMemo(() => {
    return incomeExpenseChartData.map(d => ({
      month: d.period,
      income: d.income,
      expense: d.expense,
      balance: d.balance
    }));
  }, [incomeExpenseChartData]);

  const currencyBalances = useMemo(() => {
    const balances = new Map<string, { name: string; symbol: string; balance: number }>();
    
    allMovements.forEach(m => {
      if (m.status !== 'confirmed') return;
      const currencyCode = m.currency?.code || 'ARS';
      const currencySymbol = m.currency?.symbol || '$';
      const amount = Math.abs(m.amount);
      const isIngreso = ingresoTypes.includes(m.movement_type);
      
      const existing = balances.get(currencyCode) || { name: currencyCode, symbol: currencySymbol, balance: 0 };
      if (isIngreso) {
        existing.balance += amount;
      } else {
        existing.balance -= amount;
      }
      balances.set(currencyCode, existing);
    });

    return Array.from(balances.values())
      .map(b => ({
        name: `${b.symbol} ${b.name}`,
        balance: b.balance
      }))
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  }, [allMovements, ingresoTypes]);

  const walletBalances = useMemo(() => {
    const balances = new Map<string, { name: string; balance: number }>();
    
    allMovements.forEach(m => {
      if (m.status !== 'confirmed') return;
      const walletName = m.wallet?.name || 'Sin billetera';
      const amount = Math.abs(m.amount);
      const isIngreso = ingresoTypes.includes(m.movement_type);
      
      const convertedAmount = convertToBaseCurrency(
        m.currency?.code || 'ARS',
        defaultCurrency?.code,
        amount,
        m.exchange_rate ?? null,
        { quoteCurrency: 'USD' }
      );
      
      const existing = balances.get(walletName) || { name: walletName, balance: 0 };
      if (isIngreso) {
        existing.balance += convertedAmount;
      } else {
        existing.balance -= convertedAmount;
      }
      balances.set(walletName, existing);
    });

    return Array.from(balances.values())
      .map(b => ({
        name: b.name,
        balance: b.balance
      }))
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  }, [allMovements, ingresoTypes, defaultCurrency]);

  const autoInsights = useMemo(() => {
    const categoryData = categoryChartData.map(c => ({
      name: c.name,
      value: c.value
    }));

    const context = buildInsightContext({
      totalGasto: kpis.totalEgresos.value,
      previousPeriodGasto: kpis.previousEgresos,
      categoryData,
      previousCategoryData: [],
      monthlyData: monthlyChartData,
      paymentsCount: confirmedMovements.length,
      monthCount: kpis.monthCount,
      paymentsByConcept: [],
      isShortPeriod: periodMeta.isShortPeriod,
      daysCount: periodMeta.daysCount,
      currentMonth: new Date().getMonth() + 1,
      totalIngresos: kpis.totalIngresos.value,
      totalEgresos: kpis.totalEgresos.value,
      balance: kpis.balance,
      monthlyFinancialData,
      projectFinancialData: []
    });
    return generateFinancialInsights(context, 3);
  }, [kpis, categoryChartData, monthlyChartData, confirmedMovements, periodMeta, monthlyFinancialData]);

  const recentActivityItems = useMemo((): ActivityItem[] => {
    return [...confirmedMovements]
      .sort((a, b) => {
        const dateComparison = new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
        if (dateComparison !== 0) return dateComparison;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      })
      .slice(0, 5)
      .map(movement => {
        const isIngreso = ingresoTypes.includes(movement.movement_type);
        const formattedAmount = formatMoney(movement.amount, movement.currency?.symbol || '$');
        
        return {
          id: movement.id,
          title: movement.entity_name || movement.description || MOVEMENT_TYPE_LABELS[movement.movement_type],
          subtitle: formatDateShort(movement.payment_date),
          rightContent: (
            <span className={cn(
              "font-medium tabular-nums",
              isIngreso ? "text-positive" : "text-negative"
            )}>
              {isIngreso ? '+' : '-'}{formattedAmount}
            </span>
          ),
          leftIcon: isIngreso ? (
            <ArrowUpRight className="h-4 w-4 text-positive" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-negative" />
          ),
          badge: <PaymentStatusBadge status="confirmed" />
        };
      });
  }, [confirmedMovements, ingresoTypes]);

  if (confirmedMovements.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign className="w-12 h-12" />}
        title="Sin movimientos financieros"
        description="Aún no hay movimientos registrados en este período. Los movimientos aparecerán aquí cuando registres cobros o pagos de materiales y personal."
      />
    );
  }

  const currencySymbol = defaultCurrency?.symbol || '$';
  const showMultiCurrencyBreakdown = hasMultipleCurrencies(kpis.totalIngresos) || hasMultipleCurrencies(kpis.totalEgresos);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="kpi-total-ingresos">
          <StatCardTitle>
            <ArrowUpRight className="h-4 w-4" style={{ color: 'var(--positive)' }} />
            Total Ingresos
          </StatCardTitle>
          <StatCardValue style={{ color: 'var(--positive)' }}>
            {currencySymbol} {kpis.totalIngresos.formatted}
          </StatCardValue>
          {kpis.ingresosTrendValue && (
            <StatCardTrend direction={kpis.ingresosTrend} value={kpis.ingresosTrendValue} />
          )}
          {showMultiCurrencyBreakdown && (
            <StatCardMeta>{formatBreakdown(kpis.totalIngresos)}</StatCardMeta>
          )}
        </StatCard>

        <StatCard data-testid="kpi-total-egresos">
          <StatCardTitle>
            <ArrowDownRight className="h-4 w-4" style={{ color: 'var(--negative)' }} />
            Total Egresos
          </StatCardTitle>
          <StatCardValue style={{ color: 'var(--negative)' }}>
            {currencySymbol} {kpis.totalEgresos.formatted}
          </StatCardValue>
          {kpis.egresosTrendValue && (
            <StatCardTrend direction={kpis.egresosTrend} value={kpis.egresosTrendValue} />
          )}
          {showMultiCurrencyBreakdown && (
            <StatCardMeta>{formatBreakdown(kpis.totalEgresos)}</StatCardMeta>
          )}
        </StatCard>

        <StatCard data-testid="kpi-balance">
          <StatCardTitle>
            <Scale className="h-4 w-4" />
            Balance
          </StatCardTitle>
          <StatCardValue style={{ color: kpis.balance >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
            {kpis.balance >= 0 ? '+' : '-'}{currencySymbol} {formatKPI(Math.abs(kpis.balance))}
          </StatCardValue>
          {currentMonthComparison && (
            <StatCardHistoricalComparison comparison={currentMonthComparison} label="vs promedio mensual" />
          )}
          <StatCardMeta>
            {kpis.balance >= 0 ? 'Superávit' : 'Déficit'} del período
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="kpi-total-movimientos">
          <StatCardTitle>
            <DollarSign className="h-4 w-4" />
            Movimientos
          </StatCardTitle>
          <StatCardValue>
            {kpis.totalMovements.formatted}
          </StatCardValue>
          <StatCardMeta>
            {kpis.monthCount} {kpis.monthCount === 1 ? 'mes' : 'meses'} con actividad
          </StatCardMeta>
        </StatCard>
      </div>

      <DashboardCard 
        id="monthlyChart"
        title="Evolución Financiera" 
        icon={<BarChart3 />}
        description="Ingresos, egresos y balance mensual"
        data-testid="chart-monthly-trend"
      >
        <MultiSeriesTrendChart 
          data={monthlyFinancialData.map(d => ({
            month: d.month,
            income: d.income,
            expense: d.expense,
            balance: d.balance
          }))}
          series={[
            { key: 'income', label: 'Ingresos', color: 'var(--chart-1)', type: 'bar' },
            { key: 'expense', label: 'Egresos', color: 'var(--chart-2)', type: 'bar' },
            { key: 'balance', label: 'Balance', color: 'var(--chart-3)', type: 'line' }
          ]}
          height={280}
          emptyText="No hay movimientos registrados"
          showLegend
          showZeroLine
          clickable
          onBarClick={(month) => handleMonthDrillDown(month)}
        />
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard 
          id="categoryBreakdown"
          title="Distribución por Tipo" 
          icon={<PieChart />}
          description="Hacé click en un tipo para ver sus movimientos"
          data-testid="chart-category-breakdown"
        >
          <DonutChart 
            data={categoryChartData.map(d => ({ label: d.name, value: d.value }))} 
            height={280}
            emptyText="No hay movimientos registrados"
            clickable
            onClick={(label) => handleCategoryDrillDown(label)}
          />
        </DashboardCard>

        <div className="grid grid-cols-1 gap-6">
          <DashboardCard 
            id="currencyBalances"
            title="Balance por Moneda" 
            icon={<Coins />}
            description="Balance real en cada moneda"
            data-testid="chart-currency-balances"
          >
            <HorizontalBarChart 
              data={currencyBalances.map(c => ({ label: c.name, value: c.balance }))}
              height={120}
              emptyText="No hay movimientos registrados"
            />
          </DashboardCard>

          <DashboardCard 
            id="walletBalances"
            title="Balance por Billetera" 
            icon={<Wallet />}
            description={`En ${defaultCurrency?.code || 'moneda base'}`}
            data-testid="chart-wallet-balances"
          >
            <HorizontalBarChart 
              data={walletBalances.map(w => ({ label: w.name, value: w.balance }))}
              height={120}
              emptyText="No hay movimientos registrados"
            />
          </DashboardCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightCard
          title="Insights"
          titleIcon={<Lightbulb />}
          items={toInsightItems(autoInsights)}
          emptyText="Sin insights en este período. Continuá registrando movimientos para obtener análisis."
          onAction={handleInsightAction}
          data-testid="insights-section"
        />

        <ActivityCard
          title="Actividad Reciente"
          titleIcon={<Clock />}
          items={recentActivityItems}
          emptyText="No hay movimientos registrados"
          data-testid="activity-section"
        />
      </div>
    </div>
  );
}
