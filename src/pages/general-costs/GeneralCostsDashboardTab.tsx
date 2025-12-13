import { useMemo } from 'react';
import { TrendingUp, Calendar, Tag, DollarSign } from 'lucide-react';
import { calculateMonetaryKPI, calculateCountKPI, calculateTextKPI, formatBreakdown } from '@/lib/kpis';
import { formatKPI } from '@/lib/money';
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

export default function GeneralCostsDashboardTab() {
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

  const categoryChartData = useMemo(() => {
    const categoryTotals = new Map<string, number>();
    
    byCategory.forEach(item => {
      const existing = categoryTotals.get(item.category_name) || 0;
      categoryTotals.set(item.category_name, existing + Number(item.total_amount));
    });

    return Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [byCategory]);

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
    </div>
  );
}
