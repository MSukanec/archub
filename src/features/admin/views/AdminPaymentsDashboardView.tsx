import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, CreditCard, BarChart3, PieChart, Clock } from 'lucide-react';
import { AppCard, AppCardTitle, AppCardValue, AppCardMeta, AppCardTrend } from '@/components/shared/AppCard';
import { MonthlyTrendChart } from '@/components/charts/line/AreaTrendChart';
import { DonutChart } from '@/components/charts/pie/DonutChart';
import { ActivityCard, type ActivityItem, type TrendDirection } from '@/components';
import { calculateMonetaryKPI, calculateCountKPI } from '@/lib/kpis';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, subMonths, subYears, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

export type PeriodFilter = '30d' | '3m' | '6m' | '1y' | 'all';

interface Payment {
  id: string;
  provider: string;
  amount: number;
  currency: string;
  exchange_rate: number | null;
  status: string;
  created_at: string;
  users: {
    auth_id: string;
    full_name: string | null;
    email: string;
  };
  courses: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

interface AdminPaymentsDashboardViewProps {
  selectedPeriod?: PeriodFilter;
}

function getDateFromForPeriod(period: PeriodFilter): Date | null {
  if (period === 'all') return null;
  
  const now = new Date();
  
  switch (period) {
    case '30d':
      return startOfDay(subDays(now, 30));
    case '3m':
      return startOfDay(subMonths(now, 3));
    case '6m':
      return startOfDay(subMonths(now, 6));
    case '1y':
      return startOfDay(subYears(now, 1));
    default:
      return null;
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

export default function AdminPaymentsDashboardView({ 
  selectedPeriod = 'all' 
}: AdminPaymentsDashboardViewProps) {
  const { data: exchangeRateData } = useQuery({
    queryKey: ['exchange-rate-usd-ars'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', 'USD')
        .eq('to_currency', 'ARS')
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('Error fetching exchange rate:', error);
        return 1200;
      }
      return Number(data?.rate) || 1200;
    },
  });

  const exchangeRate = exchangeRateData || 1200;

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ['/api/admin/payments/all'],
  });

  const dateFrom = useMemo(() => getDateFromForPeriod(selectedPeriod), [selectedPeriod]);

  const completedPayments = useMemo(() => {
    return payments.filter(p => p.status === 'completed');
  }, [payments]);

  const filteredPayments = useMemo(() => {
    if (!dateFrom) return completedPayments;
    
    return completedPayments.filter(p => {
      const paymentDate = new Date(p.created_at);
      return paymentDate >= dateFrom;
    });
  }, [completedPayments, dateFrom]);

  const previousPeriodPayments = useMemo(() => {
    const previousRange = getPreviousPeriodDateRange(selectedPeriod);
    if (!previousRange) return [];
    
    return completedPayments.filter(p => {
      const paymentDate = new Date(p.created_at);
      return paymentDate >= previousRange.from && paymentDate < previousRange.to;
    });
  }, [completedPayments, selectedPeriod]);

  const kpis = useMemo(() => {
    const convertToUSD = (amount: number, currency: string, rate: number | null) => {
      if (currency === 'USD') return amount;
      const exchangeRateToUse = rate || exchangeRate;
      return amount / exchangeRateToUse;
    };

    const totalRevenueUSD = filteredPayments.reduce((sum, p) => {
      return sum + convertToUSD(p.amount, p.currency, p.exchange_rate);
    }, 0);

    const previousTotalRevenueUSD = previousPeriodPayments.reduce((sum, p) => {
      return sum + convertToUSD(p.amount, p.currency, p.exchange_rate);
    }, 0);

    let revenueTrend: TrendDirection = 'neutral';
    let revenueTrendValue = '';
    if (previousTotalRevenueUSD > 0) {
      const change = ((totalRevenueUSD - previousTotalRevenueUSD) / previousTotalRevenueUSD) * 100;
      revenueTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      const periodLabel = selectedPeriod === 'all' ? 'vs año anterior' : 'vs período anterior';
      revenueTrendValue = `${change > 0 ? '+' : ''}${Math.round(change)}% ${periodLabel}`;
    }

    const paymentsCount = calculateCountKPI({
      count: filteredPayments.length,
      label: 'pagos'
    });

    const previousPaymentsCount = previousPeriodPayments.length;
    let countTrend: TrendDirection = 'neutral';
    let countTrendValue = '';
    if (previousPaymentsCount > 0) {
      const change = ((filteredPayments.length - previousPaymentsCount) / previousPaymentsCount) * 100;
      countTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      const periodLabel = selectedPeriod === 'all' ? 'vs año anterior' : 'vs período anterior';
      countTrendValue = `${change > 0 ? '+' : ''}${Math.round(change)}% ${periodLabel}`;
    }

    const avgPaymentUSD = filteredPayments.length > 0 ? totalRevenueUSD / filteredPayments.length : 0;

    const previousAvgPaymentUSD = previousPeriodPayments.length > 0 
      ? previousTotalRevenueUSD / previousPeriodPayments.length 
      : 0;

    let avgTrend: TrendDirection = 'neutral';
    let avgTrendValue = '';
    if (previousAvgPaymentUSD > 0) {
      const change = ((avgPaymentUSD - previousAvgPaymentUSD) / previousAvgPaymentUSD) * 100;
      avgTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      const periodLabel = selectedPeriod === 'all' ? 'vs año anterior' : 'vs período anterior';
      avgTrendValue = `${change > 0 ? '+' : ''}${Math.round(change)}% ${periodLabel}`;
    }

    const providerCounts: Record<string, number> = {};
    filteredPayments.forEach(p => {
      const provider = p.provider?.toLowerCase() || 'manual';
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });
    
    let topProvider = 'Sin datos';
    let maxCount = 0;
    Object.entries(providerCounts).forEach(([provider, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topProvider = provider;
      }
    });

    const topProviderPercentage = filteredPayments.length > 0 
      ? Math.round((maxCount / filteredPayments.length) * 100) 
      : 0;

    return {
      totalRevenueUSD,
      revenueTrend,
      revenueTrendValue,
      paymentsCount,
      countTrend,
      countTrendValue,
      avgPaymentUSD,
      avgTrend,
      avgTrendValue,
      topProvider,
      topProviderPercentage,
      providerCounts,
    };
  }, [filteredPayments, previousPeriodPayments, exchangeRate, selectedPeriod]);

  const monthlyChartData = useMemo(() => {
    const monthlyTotals = new Map<string, number>();
    
    filteredPayments.forEach(p => {
      const date = new Date(p.created_at);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const amountUSD = p.currency === 'USD' 
        ? p.amount 
        : p.amount / (p.exchange_rate || exchangeRate);
      
      monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + amountUSD);
    });
    
    return Array.from(monthlyTotals.entries())
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredPayments, exchangeRate]);

  const providerChartData = useMemo(() => {
    const providerLabels: Record<string, string> = {
      'mercadopago': 'Mercado Pago',
      'paypal': 'PayPal',
      'bank_transfer': 'Transferencia',
      'manual': 'Manual'
    };

    return Object.entries(kpis.providerCounts)
      .map(([name, value]) => ({
        name: providerLabels[name] || name,
        value
      }))
      .sort((a, b) => b.value - a.value);
  }, [kpis.providerCounts]);

  const recentActivityItems = useMemo((): ActivityItem[] => {
    return [...filteredPayments]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8)
      .map(payment => {
        const providerLabels: Record<string, string> = {
          'mercadopago': 'Mercado Pago',
          'paypal': 'PayPal',
          'bank_transfer': 'Transferencia',
          'manual': 'Manual'
        };
        const providerStyles: Record<string, React.CSSProperties> = {
          'mercadopago': { backgroundColor: '#2563eb', color: 'white' },
          'paypal': { backgroundColor: '#059669', color: 'white' },
          'bank_transfer': { backgroundColor: '#6b7280', color: 'white' },
          'manual': { backgroundColor: '#6b7280', color: 'white' },
        };
        const provider = payment.provider?.toLowerCase() || 'manual';
        
        return {
          id: payment.id,
          title: payment.users?.full_name || payment.users?.email || 'Usuario',
          subtitle: format(new Date(payment.created_at), 'dd MMM yyyy HH:mm', { locale: es }),
          rightContent: (
            <div className="flex flex-col items-end gap-1">
              <span className="font-semibold text-sm">
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: payment.currency,
                  minimumFractionDigits: 0,
                }).format(payment.amount)}
              </span>
              <Badge 
                style={providerStyles[provider] || providerStyles['manual']}
                className="text-xs"
              >
                {providerLabels[provider] || payment.provider}
              </Badge>
            </div>
          ),
        };
      });
  }, [filteredPayments]);

  const formatUSD = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      'mercadopago': 'Mercado Pago',
      'paypal': 'PayPal',
      'bank_transfer': 'Transferencia',
      'manual': 'Manual'
    };
    return labels[provider] || provider;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <AppCard data-testid="kpi-total-revenue">
          <div className="flex items-center justify-between">
            <AppCardTitle>Ingresos Totales</AppCardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </div>
          <AppCardValue>{formatUSD(kpis.totalRevenueUSD)}</AppCardValue>
          {kpis.revenueTrendValue && (
            <AppCardTrend direction={kpis.revenueTrend} value={kpis.revenueTrendValue} />
          )}
          <AppCardMeta>{filteredPayments.length} pagos procesados</AppCardMeta>
        </AppCard>

        <AppCard data-testid="kpi-payments-count">
          <div className="flex items-center justify-between">
            <AppCardTitle>Total Pagos</AppCardTitle>
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <AppCardValue>{kpis.paymentsCount.formatted}</AppCardValue>
          {kpis.countTrendValue && (
            <AppCardTrend direction={kpis.countTrend} value={kpis.countTrendValue} />
          )}
          <AppCardMeta>transacciones completadas</AppCardMeta>
        </AppCard>

        <AppCard data-testid="kpi-avg-payment">
          <div className="flex items-center justify-between">
            <AppCardTitle>Pago Promedio</AppCardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <AppCardValue>{formatUSD(kpis.avgPaymentUSD)}</AppCardValue>
          {kpis.avgTrendValue && (
            <AppCardTrend direction={kpis.avgTrend} value={kpis.avgTrendValue} />
          )}
          <AppCardMeta>por transacción</AppCardMeta>
        </AppCard>

        <AppCard data-testid="kpi-top-provider">
          <div className="flex items-center justify-between">
            <AppCardTitle>Proveedor Principal</AppCardTitle>
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </div>
          <AppCardValue className="text-lg sm:text-xl">
            {getProviderLabel(kpis.topProvider)}
          </AppCardValue>
          <AppCardMeta>{kpis.topProviderPercentage}% de las transacciones</AppCardMeta>
        </AppCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AppCard 
          title="Evolución Mensual"
          icon={<BarChart3 className="h-4 w-4" />}
          data-testid="chart-monthly-trend"
        >
          {monthlyChartData.length > 0 ? (
            <MonthlyTrendChart 
              data={monthlyChartData} 
              height={280}
              formatValue={(value) => formatUSD(value)}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              No hay datos para mostrar
            </div>
          )}
        </AppCard>

        <AppCard 
          title="Distribución por Proveedor"
          icon={<PieChart className="h-4 w-4" />}
          data-testid="chart-provider-distribution"
        >
          {providerChartData.length > 0 ? (
            <DonutChart 
              data={providerChartData} 
              height={280}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              No hay datos para mostrar
            </div>
          )}
        </AppCard>
      </div>

      <ActivityCard
        title="Actividad Reciente"
        titleIcon={<Clock className="h-4 w-4" />}
        items={recentActivityItems}
        data-testid="activity-recent-payments"
      />
    </div>
  );
}
