import { useMemo, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  Lightbulb, 
  Clock, 
  BarChart3, 
  PieChart,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Scale,
  AlertTriangle,
  Crown
} from 'lucide-react';
import { type InsightAction } from '@/components/dashboard/insights/types';
import { calculateMonetaryKPI, calculateCountKPI, formatBreakdown } from '@/lib/kpis';
import { format as formatMoneyAmount, formatKPI } from '@/lib/money';
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
import { EmptyState } from '@/components/shared/EmptyState';
import { MonthlyTrendChart } from '@/components/charts/line/AreaTrendChart';
import { DonutChart } from '@/components/charts/pie/DonutChart';
import { SparklineChart } from '@/components/charts/sparkline/SparklineChart';
import { HorizontalBarChart } from '@/components/charts/bar/HorizontalBarChart';
import { GroupedBarChart } from '@/components/charts/bar/GroupedBarChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PaymentStatusBadge } from '@/components/shared/PaymentStatusBadge';
import { cn } from '@/lib/utils';
import { formatDateShort, parseLocalDate } from '@/lib/date-utils';
import { 
  usePartners, 
  usePartnerContributions, 
  usePartnerWithdrawals,
  usePartnerCapitalKPI
} from '@/features/capital';

export type PeriodFilter = '30d' | '3m' | '6m' | '1y' | 'all';

interface CapitalDashboardViewProps {
  onNavigateToList?: () => void;
  onNavigateToBalances?: () => void;
  onNavigateToTransactions?: () => void;
  onNavigateToTab?: (tab: string, filters?: Record<string, unknown>) => void;
  onScrollToPanel?: (panelId: string) => void;
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
      return null;
  }
  
  to.setHours(0, 0, 0, 0);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export function calculateAvailablePeriods(
  contributions: Array<{ contribution_date: string; status: string }>,
  withdrawals: Array<{ withdrawal_date: string; status: string }>
): Record<PeriodFilter, boolean> {
  const result: Record<PeriodFilter, boolean> = {
    'all': true,
    '30d': false,
    '3m': false,
    '6m': false,
    '1y': false
  };
  
  const confirmedContributions = contributions.filter(c => c.status === 'confirmed');
  const confirmedWithdrawals = withdrawals.filter(w => w.status === 'confirmed');
  
  (['30d', '3m', '6m', '1y'] as const).forEach(period => {
    const dateFrom = getDateFromForPeriod(period);
    if (!dateFrom) return;
    
    const hasContributionData = confirmedContributions.some(c => {
      const date = parseLocalDate(c.contribution_date);
      if (!date) return false;
      return date >= dateFrom;
    });
    
    const hasWithdrawalData = confirmedWithdrawals.some(w => {
      const date = parseLocalDate(w.withdrawal_date);
      if (!date) return false;
      return date >= dateFrom;
    });
    
    result[period] = hasContributionData || hasWithdrawalData;
  });
  
  return result;
}

export function CapitalDashboardView({ 
  onNavigateToList, 
  onNavigateToBalances,
  onNavigateToTransactions,
  onNavigateToTab,
  onScrollToPanel,
  selectedPeriod = 'all' 
}: CapitalDashboardViewProps) {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);
  const { data: partners = [], isLoading: loadingPartners } = usePartners(organizationId);
  const { data: allContributions = [], isLoading: loadingContributions } = usePartnerContributions(organizationId);
  const { data: allWithdrawals = [], isLoading: loadingWithdrawals } = usePartnerWithdrawals(organizationId);
  const { data: capitalKpiData = [], isLoading: loadingKPI } = usePartnerCapitalKPI(organizationId, { enabled: !!organizationId });

  const isLoading = loadingPartners || loadingContributions || loadingWithdrawals || loadingKPI;

  // Capital health KPIs from SQL view data
  const capitalHealthKPIs = useMemo(() => {
    if (capitalKpiData.length === 0) {
      return {
        totalDeviation: 0,
        underContributedCount: 0,
        topOverContributorName: null as string | null,
        topOverContributorAmount: 0,
        deviationByPartner: [] as Array<{ name: string; value: number; status: string }>
      };
    }

    // Total absolute deviation
    const totalDeviation = capitalKpiData.reduce((sum, kpi) => {
      return sum + Math.abs(kpi.deviation_contribution ?? 0);
    }, 0);

    // Count of under-contributed partners
    const underContributedCount = capitalKpiData.filter(
      kpi => kpi.contribution_status === 'bajo_aportado'
    ).length;

    // Find top over-contributor
    const overContributors = capitalKpiData
      .filter(kpi => kpi.contribution_status === 'sobre_aportado' && (kpi.deviation_contribution ?? 0) > 0)
      .sort((a, b) => (b.deviation_contribution ?? 0) - (a.deviation_contribution ?? 0));
    
    const topOverContributor = overContributors[0];
    const topPartner = topOverContributor 
      ? partners.find(p => p.id === topOverContributor.partner_id) 
      : null;
    const topOverContributorName = topPartner?.contacts?.full_name 
      || topPartner?.contacts?.company_name 
      || null;
    const topOverContributorAmount = topOverContributor?.deviation_contribution ?? 0;

    // Deviation by partner for chart
    const deviationByPartner = capitalKpiData
      .filter(kpi => kpi.deviation_contribution !== null && kpi.deviation_contribution !== 0)
      .map(kpi => {
        const partnerData = partners.find(p => p.id === kpi.partner_id);
        const name = partnerData?.contacts?.full_name 
          || partnerData?.contacts?.company_name 
          || 'Sin nombre';
        return {
          name,
          value: kpi.deviation_contribution ?? 0,
          status: kpi.contribution_status
        };
      })
      .sort((a, b) => b.value - a.value);

    return {
      totalDeviation,
      underContributedCount,
      topOverContributorName,
      topOverContributorAmount,
      deviationByPartner
    };
  }, [capitalKpiData, partners]);

  // Data for deviation bar chart (no truncation - chart handles width)
  const deviationChartData = useMemo(() => {
    return capitalHealthKPIs.deviationByPartner.map(item => ({
      label: item.name,
      value: item.value
    }));
  }, [capitalHealthKPIs.deviationByPartner]);

  // Data for expected vs real contribution chart (no truncation - chart handles it)
  const expectedVsRealData = useMemo(() => {
    return capitalKpiData
      .filter(kpi => kpi.expected_contribution !== null)
      .map(kpi => {
        const partnerData = partners.find(p => p.id === kpi.partner_id);
        const name = partnerData?.contacts?.full_name 
          || partnerData?.contacts?.company_name 
          || 'Sin nombre';
        return {
          label: name,
          expected: kpi.expected_contribution ?? 0,
          real: kpi.total_contributed
        };
      })
      .sort((a, b) => b.real - a.real)
      .slice(0, 6);
  }, [capitalKpiData, partners]);

  const handleInsightAction = useCallback((action: InsightAction) => {
    switch (action.type) {
      case 'navigate':
        if (action.payload.tab === 'list') {
          if (onNavigateToTab) {
            onNavigateToTab('list', action.payload);
          } else {
            onNavigateToList?.();
          }
        } else if (action.payload.tab === 'balances') {
          if (onNavigateToTab) {
            onNavigateToTab('balances', action.payload);
          } else {
            onNavigateToBalances?.();
          }
        } else if (action.payload.tab === 'transactions') {
          if (onNavigateToTab) {
            onNavigateToTab('transactions', action.payload);
          } else {
            onNavigateToTransactions?.();
          }
        }
        break;
      case 'open':
        if (action.payload.panel && typeof action.payload.panel === 'string') {
          onScrollToPanel?.(action.payload.panel);
        }
        break;
    }
  }, [onNavigateToList, onNavigateToBalances, onNavigateToTransactions, onNavigateToTab, onScrollToPanel]);

  const handleMonthDrillDown = useCallback((month: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('transactions', { filterMonth: month });
    } else {
      onNavigateToTransactions?.();
    }
  }, [onNavigateToTab, onNavigateToTransactions]);

  const handlePartnerDrillDown = useCallback((partnerName: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('balances', { filterPartner: partnerName });
    } else {
      onNavigateToBalances?.();
    }
  }, [onNavigateToTab, onNavigateToBalances]);

  const dateFrom = useMemo(() => getDateFromForPeriod(selectedPeriod), [selectedPeriod]);

  const periodMeta = useMemo(() => {
    const now = new Date();
    return getPeriodMeta(dateFrom, now);
  }, [dateFrom]);

  const kpiLabels = useMemo(() => getKPILabels(periodMeta), [periodMeta]);

  const confirmedContributions = useMemo(() => {
    const confirmed = allContributions.filter(c => c.status === 'confirmed');
    
    if (!dateFrom) return confirmed;
    
    return confirmed.filter(c => {
      const contributionDate = parseLocalDate(c.contribution_date);
      if (!contributionDate) return false;
      return contributionDate >= dateFrom;
    });
  }, [allContributions, dateFrom]);

  const confirmedWithdrawals = useMemo(() => {
    const confirmed = allWithdrawals.filter(w => w.status === 'confirmed');
    
    if (!dateFrom) return confirmed;
    
    return confirmed.filter(w => {
      const withdrawalDate = parseLocalDate(w.withdrawal_date);
      if (!withdrawalDate) return false;
      return withdrawalDate >= dateFrom;
    });
  }, [allWithdrawals, dateFrom]);

  const previousPeriodData = useMemo(() => {
    const previousRange = getPreviousPeriodDateRange(selectedPeriod);
    if (!previousRange) return { contributions: [], withdrawals: [] };
    
    const prevContributions = allContributions.filter(c => {
      if (c.status !== 'confirmed') return false;
      const date = parseLocalDate(c.contribution_date);
      if (!date) return false;
      return date >= previousRange.from && date < previousRange.to;
    });
    
    const prevWithdrawals = allWithdrawals.filter(w => {
      if (w.status !== 'confirmed') return false;
      const date = parseLocalDate(w.withdrawal_date);
      if (!date) return false;
      return date >= previousRange.from && date < previousRange.to;
    });
    
    return { contributions: prevContributions, withdrawals: prevWithdrawals };
  }, [allContributions, allWithdrawals, selectedPeriod]);

  const kpis = useMemo(() => {
    const contributionsKPI = calculateMonetaryKPI({
      items: confirmedContributions.map(c => ({
        amount: c.amount,
        currency_id: c.currency_id,
        currency: c.currency,
        exchange_rate: c.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol
    });

    const withdrawalsKPI = calculateMonetaryKPI({
      items: confirmedWithdrawals.map(w => ({
        amount: w.amount,
        currency_id: w.currency_id,
        currency: w.currency,
        exchange_rate: w.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol
    });

    const netCapital = contributionsKPI.value - withdrawalsKPI.value;
    const netCapitalKPI = {
      ...contributionsKPI,
      value: netCapital,
      formatted: formatKPI(netCapital)
    };

    const prevContributionsKPI = calculateMonetaryKPI({
      items: previousPeriodData.contributions.map(c => ({
        amount: c.amount,
        currency_id: c.currency_id,
        currency: c.currency,
        exchange_rate: c.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol
    });

    const prevWithdrawalsKPI = calculateMonetaryKPI({
      items: previousPeriodData.withdrawals.map(w => ({
        amount: w.amount,
        currency_id: w.currency_id,
        currency: w.currency,
        exchange_rate: w.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol
    });

    const prevNetCapital = prevContributionsKPI.value - prevWithdrawalsKPI.value;

    let capitalTrend: TrendDirection = 'neutral';
    let capitalTrendValue = '';
    if (prevNetCapital !== 0) {
      const change = ((netCapital - prevNetCapital) / Math.abs(prevNetCapital)) * 100;
      capitalTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      capitalTrendValue = `${change > 0 ? '+' : ''}${Math.round(change)}% vs período anterior`;
    }

    let contributionsTrend: TrendDirection = 'neutral';
    let contributionsTrendValue = '';
    if (prevContributionsKPI.value > 0) {
      const change = ((contributionsKPI.value - prevContributionsKPI.value) / prevContributionsKPI.value) * 100;
      contributionsTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      contributionsTrendValue = `${change > 0 ? '+' : ''}${Math.round(change)}% vs período anterior`;
    }

    let withdrawalsTrend: TrendDirection = 'neutral';
    let withdrawalsTrendValue = '';
    if (prevWithdrawalsKPI.value > 0) {
      const change = ((withdrawalsKPI.value - prevWithdrawalsKPI.value) / prevWithdrawalsKPI.value) * 100;
      withdrawalsTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      withdrawalsTrendValue = `${change > 0 ? '+' : ''}${Math.round(change)}% vs período anterior`;
    }

    const partnersCount = calculateCountKPI({
      count: partners.length,
      label: 'socios'
    });

    return {
      netCapital: netCapitalKPI,
      capitalTrend,
      capitalTrendValue,
      contributions: contributionsKPI,
      contributionsTrend,
      contributionsTrendValue,
      withdrawals: withdrawalsKPI,
      withdrawalsTrend,
      withdrawalsTrendValue,
      partnersCount,
      previousNetCapital: prevNetCapital
    };
  }, [confirmedContributions, confirmedWithdrawals, defaultCurrency, partners, previousPeriodData]);

  const monthlyChartData = useMemo(() => {
    const monthlyTotals = new Map<string, { contributions: number; withdrawals: number }>();
    
    confirmedContributions.forEach(c => {
      const date = parseLocalDate(c.contribution_date);
      if (!date) return;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyTotals.get(month) || { contributions: 0, withdrawals: 0 };
      existing.contributions += c.amount * (c.exchange_rate || 1);
      monthlyTotals.set(month, existing);
    });
    
    confirmedWithdrawals.forEach(w => {
      const date = parseLocalDate(w.withdrawal_date);
      if (!date) return;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyTotals.get(month) || { contributions: 0, withdrawals: 0 };
      existing.withdrawals += w.amount * (w.exchange_rate || 1);
      monthlyTotals.set(month, existing);
    });
    
    return Array.from(monthlyTotals.entries())
      .map(([month, data]) => ({
        month,
        value: data.contributions - data.withdrawals
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [confirmedContributions, confirmedWithdrawals]);

  const sparklineData = useMemo(() => {
    return monthlyChartData.map(m => m.value);
  }, [monthlyChartData]);

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

  const partnerDistributionData = useMemo(() => {
    const partnerTotals = new Map<string, { label: string; value: number }>();
    
    confirmedContributions.forEach(c => {
      if (!c.partner) return;
      const partnerId = c.partner_id || 'unknown';
      const partnerName = c.partner.contacts?.full_name || 
        `${c.partner.contacts?.first_name || ''} ${c.partner.contacts?.last_name || ''}`.trim() ||
        c.partner.contacts?.company_name || 'Sin nombre';
      
      const existing = partnerTotals.get(partnerId) || { label: partnerName, value: 0 };
      existing.value += c.amount * (c.exchange_rate || 1);
      partnerTotals.set(partnerId, existing);
    });
    
    confirmedWithdrawals.forEach(w => {
      if (!w.partner) return;
      const partnerId = w.partner_id || 'unknown';
      const partnerName = w.partner.contacts?.full_name || 
        `${w.partner.contacts?.first_name || ''} ${w.partner.contacts?.last_name || ''}`.trim() ||
        w.partner.contacts?.company_name || 'Sin nombre';
      
      const existing = partnerTotals.get(partnerId) || { label: partnerName, value: 0 };
      existing.value -= w.amount * (w.exchange_rate || 1);
      partnerTotals.set(partnerId, existing);
    });
    
    return Array.from(partnerTotals.values())
      .filter(p => p.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [confirmedContributions, confirmedWithdrawals]);

  // Capital-specific insights (using InsightItem format directly for InsightCard)
  const capitalInsightItems = useMemo(() => {
    const items: Array<{
      title: string;
      description: string;
      variant: 'warning' | 'info' | 'success';
      actions?: Array<{ id: string; label: string; type: 'navigate'; payload: Record<string, unknown> }>;
    }> = [];

    const netCapital = kpis.netCapital.value;
    const underContributedCount = capitalHealthKPIs.underContributedCount;
    const totalDeviation = capitalHealthKPIs.totalDeviation;
    const partnerCount = capitalKpiData.length;

    // Insight: Partners under-contributed
    if (underContributedCount > 0) {
      items.push({
        variant: 'warning',
        title: `${underContributedCount} socio${underContributedCount > 1 ? 's' : ''} bajo aporte`,
        description: `Hay socios que no han aportado lo que corresponde según su participación.`,
        actions: [{ id: 'view-balances', label: 'Ver balances', type: 'navigate', payload: { tab: 'balances' } }]
      });
    }

    // Insight: Capital concentration
    if (partnerDistributionData.length > 0 && netCapital > 0) {
      const topPartnerValue = partnerDistributionData[0]?.value ?? 0;
      const concentrationPercent = (topPartnerValue / netCapital) * 100;
      
      if (concentrationPercent > 50) {
        items.push({
          variant: 'info',
          title: `${Math.round(concentrationPercent)}% del capital en un solo socio`,
          description: `"${partnerDistributionData[0]?.label}" concentra la mayoría del capital neto.`,
          actions: [{ id: 'view-distribution', label: 'Ver distribución', type: 'navigate', payload: { tab: 'balances' } }]
        });
      }
    }

    // Insight: Total deviation / imbalance
    if (totalDeviation > 0 && netCapital > 0) {
      const deviationPercent = (totalDeviation / netCapital) * 100;
      if (deviationPercent > 10) {
        items.push({
          variant: 'warning',
          title: `Desbalance del ${Math.round(deviationPercent)}%`,
          description: 'El capital presenta desviaciones significativas respecto a los porcentajes acordados.',
          actions: [{ id: 'view-deviations', label: 'Ver desvíos', type: 'navigate', payload: { tab: 'balances' } }]
        });
      }
    }

    // Insight: All balanced (positive)
    if (underContributedCount === 0 && partnerCount > 0) {
      items.push({
        variant: 'success',
        title: 'Capital equilibrado',
        description: 'Todos los socios han aportado según su participación acordada.',
        actions: [{ id: 'view-status', label: 'Ver detalle', type: 'navigate', payload: { tab: 'balances' } }]
      });
    }

    // Insight: Top over-contributor
    if (capitalHealthKPIs.topOverContributorName && capitalHealthKPIs.topOverContributorAmount > 0) {
      items.push({
        variant: 'info',
        title: `Mayor sobreaporte: ${capitalHealthKPIs.topOverContributorName}`,
        description: `Ha aportado ${defaultCurrency?.symbol || '$'} ${formatKPI(capitalHealthKPIs.topOverContributorAmount)} más de lo esperado.`,
        actions: [{ id: 'view-contributor', label: 'Ver socio', type: 'navigate', payload: { tab: 'balances' } }]
      });
    }

    return items.slice(0, 3);
  }, [kpis, capitalHealthKPIs, capitalKpiData, partnerDistributionData, defaultCurrency]);

  const recentActivityItems = useMemo((): ActivityItem[] => {
    const allTransactions = [
      ...confirmedContributions.map(c => ({
        id: c.id,
        type: 'contribution' as const,
        date: c.contribution_date,
        amount: c.amount,
        currencySymbol: c.currency?.symbol || '$',
        partnerName: c.partner?.contacts?.full_name || 
          `${c.partner?.contacts?.first_name || ''} ${c.partner?.contacts?.last_name || ''}`.trim() ||
          'Sin socio',
        createdAt: c.created_at
      })),
      ...confirmedWithdrawals.map(w => ({
        id: w.id,
        type: 'withdrawal' as const,
        date: w.withdrawal_date,
        amount: w.amount,
        currencySymbol: w.currency?.symbol || '$',
        partnerName: w.partner?.contacts?.full_name || 
          `${w.partner?.contacts?.first_name || ''} ${w.partner?.contacts?.last_name || ''}`.trim() ||
          'Sin socio',
        createdAt: w.created_at
      }))
    ];
    
    return allTransactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.partnerName,
        subtitle: formatDateShort(parseLocalDate(t.date) || new Date()),
        badge: <PaymentStatusBadge status="confirmed" />,
        rightContent: (
          <span className={cn(
            "text-sm font-medium",
            t.type === 'contribution' ? 'text-[var(--positive)]' : 'text-[var(--negative)]'
          )}>
            {t.type === 'contribution' ? '+' : '-'}{t.currencySymbol} {t.amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        )
      }));
  }, [confirmedContributions, confirmedWithdrawals]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={`row2-${i}`} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const hasData = confirmedContributions.length > 0 || confirmedWithdrawals.length > 0;

  if (!hasData && partners.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="No hay participantes configurados"
        description="Comienza agregando participantes de capital para gestionar aportes y retiros. Una vez agregues participantes, podrás ver el resumen de capital y las transacciones aquí."
        action={
          <Button onClick={onNavigateToList} data-testid="button-add-participant">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Participante
          </Button>
        }
      />
    );
  }

  if (!hasData && partners.length > 0) {
    return (
      <EmptyState
        icon={<BarChart3 />}
        title="No hay transacciones registradas"
        description="Comienza agregando transacciones (aportes y retiros) para ver el resumen de capital y el análisis de participación."
        action={
          <Button onClick={onNavigateToTransactions} data-testid="button-add-transaction">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Transacción
          </Button>
        }
      />
    );
  }

  const currencySymbol = defaultCurrency?.symbol || '$';

  return (
    <div className="space-y-6">
      {/* Row 1: Core Capital Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          data-testid="kpi-net-capital"
          onClick={onNavigateToBalances}
        >
          <StatCardTitle>
            <Wallet className="h-4 w-4" />
            Capital Neto Total
          </StatCardTitle>
          <StatCardValue className={kpis.netCapital.value >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}>
            {kpis.netCapital.value >= 0 ? '' : '-'}{currencySymbol} {formatKPI(Math.abs(kpis.netCapital.value))}
          </StatCardValue>
          {kpis.capitalTrendValue && (
            <StatCardTrend 
              direction={kpis.capitalTrend} 
              value={kpis.capitalTrendValue} 
            />
          )}
          <StatCardMeta>
            {kpis.contributions.breakdown && kpis.contributions.breakdown.length > 1
              ? formatBreakdown(kpis.netCapital)
              : 'Aportes - Retiros'
            }
          </StatCardMeta>
          {sparklineData.length >= 3 && (
            <div className="mt-2">
              <SparklineChart data={sparklineData} height={24} />
            </div>
          )}
        </StatCard>

        <StatCard 
          data-testid="kpi-total-contributions"
          onClick={onNavigateToTransactions}
        >
          <StatCardTitle>
            <TrendingUp className="h-4 w-4" />
            Total Aportes
          </StatCardTitle>
          <StatCardValue className="text-[var(--positive)]">
            {currencySymbol} {formatKPI(kpis.contributions.value)}
          </StatCardValue>
          {kpis.contributionsTrendValue && (
            <StatCardTrend 
              direction={kpis.contributionsTrend} 
              value={kpis.contributionsTrendValue} 
            />
          )}
          <StatCardMeta>
            {confirmedContributions.length} aporte{confirmedContributions.length !== 1 ? 's' : ''} confirmado{confirmedContributions.length !== 1 ? 's' : ''}
          </StatCardMeta>
        </StatCard>

        <StatCard 
          data-testid="kpi-total-withdrawals"
          onClick={onNavigateToTransactions}
        >
          <StatCardTitle>
            <TrendingDown className="h-4 w-4" />
            Total Retiros
          </StatCardTitle>
          <StatCardValue className="text-[var(--negative)]">
            {currencySymbol} {formatKPI(kpis.withdrawals.value)}
          </StatCardValue>
          {kpis.withdrawalsTrendValue && (
            <StatCardTrend 
              direction={kpis.withdrawalsTrend} 
              value={kpis.withdrawalsTrendValue} 
            />
          )}
          <StatCardMeta>
            {confirmedWithdrawals.length} retiro{confirmedWithdrawals.length !== 1 ? 's' : ''} confirmado{confirmedWithdrawals.length !== 1 ? 's' : ''}
          </StatCardMeta>
        </StatCard>
      </div>

      {/* Row 2: Capital Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          data-testid="kpi-total-deviation"
          onClick={onNavigateToBalances}
        >
          <StatCardTitle>
            <Scale className="h-4 w-4" />
            Desbalance Total
          </StatCardTitle>
          <StatCardValue className={capitalHealthKPIs.totalDeviation > 0 ? 'text-[var(--pending)]' : 'text-[var(--neutral)]'}>
            {currencySymbol} {formatKPI(capitalHealthKPIs.totalDeviation)}
          </StatCardValue>
          <StatCardMeta>
            Suma de desvíos absolutos
          </StatCardMeta>
        </StatCard>

        <StatCard 
          data-testid="kpi-under-contributed"
          onClick={onNavigateToBalances}
        >
          <StatCardTitle>
            <AlertTriangle className="h-4 w-4" />
            Socios Bajo Aporte
          </StatCardTitle>
          <StatCardValue className={capitalHealthKPIs.underContributedCount > 0 ? 'text-[var(--negative)]' : 'text-[var(--positive)]'}>
            {capitalHealthKPIs.underContributedCount}
          </StatCardValue>
          <StatCardMeta>
            {capitalHealthKPIs.underContributedCount === 0 ? 'Todos al día' : 'Requieren atención'}
          </StatCardMeta>
        </StatCard>

        <StatCard 
          data-testid="kpi-top-over-contributor"
          onClick={onNavigateToBalances}
        >
          <StatCardTitle>
            <Crown className="h-4 w-4" />
            Mayor Sobreaporte
          </StatCardTitle>
          <StatCardValue className="text-[var(--positive)] text-lg truncate">
            {capitalHealthKPIs.topOverContributorName 
              ? `${currencySymbol} ${formatKPI(capitalHealthKPIs.topOverContributorAmount)}`
              : '—'}
          </StatCardValue>
          <StatCardMeta className="truncate">
            {capitalHealthKPIs.topOverContributorName || 'Sin sobreaportes'}
          </StatCardMeta>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Evolución del Capital"
          icon={<Clock className="h-5 w-5" />}
          description={`Movimientos netos mensuales`}
          data-testid="card-monthly-trend"
        >
          {monthlyChartData.length >= 2 ? (
            <div className="space-y-2">
              <div className="h-52 overflow-hidden">
                <MonthlyTrendChart 
                  data={monthlyChartData} 
                  height={200}
                />
              </div>
              {currentMonthComparison && (
                <StatCardHistoricalComparison comparison={currentMonthComparison} />
              )}
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              Necesitas al menos 2 meses de datos para ver la evolución
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="Distribución por Socio"
          icon={<PieChart className="h-5 w-5" />}
          description="Balance neto por participante"
          data-testid="card-partner-distribution"
        >
          {partnerDistributionData.length > 0 ? (
              <DonutChart 
                data={partnerDistributionData} 
                height={280}
                innerRadius={50}
                outerRadius={80}
                showLegend
              />
          ) : (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              No hay datos de distribución
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Row 4: Deviation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Desvío por Socio"
          icon={<BarChart3 className="h-5 w-5" />}
          description="Verde = sobreaportado, Rojo = bajo aportado"
          data-testid="card-deviation-by-partner"
        >
          {deviationChartData.length > 0 ? (
              <HorizontalBarChart 
                data={deviationChartData}
                height={220}
                valueFormatter={(v) => `${currencySymbol} ${formatKPI(Math.abs(v))}`}
                colorByValue={true}
                showZeroLine={true}
                yAxisWidth={120}
              />
          ) : (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              No hay desvíos registrados
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="Aporte Esperado vs Real"
          icon={<Scale className="h-5 w-5" />}
          description="Comparación por participante"
          data-testid="card-expected-vs-real"
        >
          {expectedVsRealData.length > 0 ? (
              <GroupedBarChart 
                data={expectedVsRealData}
                series={[
                  { key: 'expected', name: 'Esperado', color: '#6b7280' },
                  { key: 'real', name: 'Real', color: '#22c55e' }
                ]}
                height={220}
                valueFormatter={(v) => `${currencySymbol} ${formatKPI(v)}`}
                showLegend={true}
              />
          ) : (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              No hay datos de porcentaje de participación
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Row 5: Insights & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightCard
          items={capitalInsightItems}
          onAction={handleInsightAction}
          data-testid="card-insights"
        />

        <ActivityCard
          title="Actividad Reciente"
          items={recentActivityItems}
          emptyText="No hay transacciones recientes"
          data-testid="card-recent-activity"
        />
      </div>
    </div>
  );
}

export default CapitalDashboardView;
