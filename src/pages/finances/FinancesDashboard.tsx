import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { supabase } from "@/lib/supabase";
import { WalletBalanceChart } from "@/components/graphics/WalletBalanceChart";
import { MonthlyFlowChart } from "@/components/graphics/MonthlyFlowChart";

export default function FinancesDashboard() {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const organizationId = userData?.preferences?.last_organization_id;

  // Set sidebar context to project when component mounts
  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  // Fetch financial summary
  const { data: financialSummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['financial-summary', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase) return {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        recentMovementsCount: 0,
        thisMonthIncome: 0,
        thisMonthExpenses: 0
      };

      // Get all movements for this organization
      const { data: movements, error } = await supabase
        .from('movements')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error || !movements) {
        console.error('Error fetching movements:', error);
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netBalance: 0,
          recentMovementsCount: 0,
          thisMonthIncome: 0,
          thisMonthExpenses: 0
        };
      }

      // Get movement concepts separately
      const typeIds = movements.map((m: any) => m.type_id).filter(Boolean);
      const uniqueTypeIds = typeIds.filter((id, index, arr) => arr.indexOf(id) === index);
      
      let concepts: any[] = [];
      if (uniqueTypeIds.length > 0) {
        const { data: conceptsData } = await supabase
          .from('movement_concepts')
          .select('id, concept_type')
          .in('id', uniqueTypeIds);
        concepts = conceptsData || [];
      }

      // Create a map for quick lookup
      const conceptMap = concepts.reduce((acc: any, concept: any) => {
        acc[concept.id] = concept.concept_type;
        return acc;
      }, {});

      console.log('Financial summary - movements:', movements.length);
      console.log('Financial summary - movement type_ids:', typeIds);
      console.log('Financial summary - unique type_ids:', uniqueTypeIds);
      console.log('Financial summary - concepts:', concepts);
      console.log('Financial summary - conceptMap:', conceptMap);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Calculate totals
      const income = movements
        .filter((m: any) => conceptMap[m.type_id] === 'INGRESOS')
        .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

      const expenses = movements
        .filter((m: any) => conceptMap[m.type_id] === 'EGRESOS')
        .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

      // Calculate this month's data
      const thisMonthMovements = movements.filter((m: any) => {
        const movementDate = new Date(m.created_at);
        return movementDate.getMonth() === currentMonth && 
               movementDate.getFullYear() === currentYear;
      });

      const thisMonthIncome = thisMonthMovements
        .filter((m: any) => conceptMap[m.type_id] === 'INGRESOS')
        .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

      const thisMonthExpenses = thisMonthMovements
        .filter((m: any) => conceptMap[m.type_id] === 'EGRESOS')
        .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

      return {
        totalIncome: income,
        totalExpenses: expenses,
        netBalance: income - expenses,
        recentMovementsCount: movements.length,
        thisMonthIncome,
        thisMonthExpenses
      };
    },
    enabled: !!organizationId
  });

  // Fetch wallet balance data for pie chart
  const { data: walletBalanceData = [], isLoading: loadingWallets } = useQuery({
    queryKey: ['wallet-balance', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase) return [];

      // Get organization wallets
      const { data: orgWallets, error } = await supabase
        .from('organization_wallets')
        .select('wallet_id')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (error || !orgWallets) return [];

      // Get wallet details
      const walletIds = orgWallets.map(ow => ow.wallet_id);
      const { data: wallets } = await supabase
        .from('wallets')
        .select('id, name')
        .in('id', walletIds);

      if (!wallets) return [];

      // Calculate balance for each wallet
      const walletBalances = await Promise.all(
        wallets.map(async (wallet: any, index: number) => {
          const { data: movements } = await supabase!
            .from('movements')
            .select('amount, type_id')
            .eq('organization_id', organizationId)
            .eq('wallet_id', wallet.id);

          if (!movements) {
            return {
              wallet: wallet.name,
              balance: 0,
              color: `hsl(var(--chart-${(index % 5) + 1}))`
            };
          }

          // Get concept types for these movements
          const typeIds = movements.map((m: any) => m.type_id).filter(Boolean);
          const uniqueTypeIds = typeIds.filter((id, index, arr) => arr.indexOf(id) === index);
          
          let concepts: any[] = [];
          if (uniqueTypeIds.length > 0) {
            const { data: conceptsData } = await supabase!
              .from('movement_concepts')
              .select('id, concept_type')
              .in('id', uniqueTypeIds);
            concepts = conceptsData || [];
          }

          const conceptMap = concepts.reduce((acc: any, concept: any) => {
            acc[concept.id] = concept.concept_type;
            return acc;
          }, {});

          const income = movements
            .filter((m: any) => conceptMap[m.type_id] === 'INGRESOS')
            .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

          const expenses = movements
            .filter((m: any) => conceptMap[m.type_id] === 'EGRESOS')
            .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

          return {
            wallet: wallet.name,
            balance: income - expenses,
            color: `hsl(var(--chart-${(index % 5) + 1}))`
          };
        })
      );

      return walletBalances.filter(wb => wb.balance > 0);
    },
    enabled: !!organizationId
  });

  // Fetch monthly flow data for line chart
  const { data: monthlyFlowData = [], isLoading: loadingFlow } = useQuery({
    queryKey: ['monthly-flow', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase) return [];

      // Get last 6 months of movements
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: movements, error } = await supabase
        .from('movements')
        .select('amount, created_at, type_id')
        .eq('organization_id', organizationId)
        .gte('created_at', sixMonthsAgo.toISOString());

      if (error || !movements) return [];

      // Get concept types
      const typeIds = movements.map((m: any) => m.type_id).filter(Boolean);
      const uniqueTypeIds = typeIds.filter((id, index, arr) => arr.indexOf(id) === index);
      
      let concepts: any[] = [];
      if (uniqueTypeIds.length > 0) {
        const { data: conceptsData } = await supabase
          .from('movement_concepts')
          .select('id, concept_type')
          .in('id', uniqueTypeIds);
        concepts = conceptsData || [];
      }

      const conceptMap = concepts.reduce((acc: any, concept: any) => {
        acc[concept.id] = concept.concept_type;
        return acc;
      }, {});

      // Group by month
      const monthlyData: Record<string, { income: number; expenses: number }> = {};

      movements.forEach((movement: any) => {
        const date = new Date(movement.created_at);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }

        const amount = movement.amount || 0;
        if (conceptMap[movement.type_id] === 'INGRESOS') {
          monthlyData[monthKey].income += amount;
        } else if (conceptMap[movement.type_id] === 'EGRESOS') {
          monthlyData[monthKey].expenses += amount;
        }
      });

      // Convert to chart format
      return Object.keys(monthlyData)
        .sort()
        .slice(-6)
        .map(monthKey => {
          const [year, month] = monthKey.split('-');
          const date = new Date(parseInt(year), parseInt(month));
          const monthName = date.toLocaleDateString('es-AR', { month: 'short' });
          
          return {
            month: monthName,
            income: monthlyData[monthKey].income,
            expenses: monthlyData[monthKey].expenses,
            net: monthlyData[monthKey].income - monthlyData[monthKey].expenses
          };
        });
    },
    enabled: !!organizationId
  });

  // Fetch recent movements
  const { data: recentMovements = [], isLoading: loadingMovements } = useQuery({
    queryKey: ['recent-movements', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase) return [];

      const { data: movements, error } = await supabase
        .from('movements')
        .select('id, description, amount, created_at, type_id, category_id')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !movements) return [];

      // Get concept names
      const typeIds = movements.map((m: any) => m.type_id).filter(Boolean);
      const categoryIds = movements.map((m: any) => m.category_id).filter(Boolean);
      const uniqueTypeIds = typeIds.filter((id, index, arr) => arr.indexOf(id) === index);
      const uniqueCategoryIds = categoryIds.filter((id, index, arr) => arr.indexOf(id) === index);

      let types: any[] = [];
      let categories: any[] = [];
      
      if (uniqueTypeIds.length > 0) {
        const { data: typesData } = await supabase
          .from('movement_concepts')
          .select('id, name, concept_type')
          .in('id', uniqueTypeIds);
        types = typesData || [];
      }

      if (uniqueCategoryIds.length > 0) {
        const { data: categoriesData } = await supabase
          .from('movement_concepts')
          .select('id, name')
          .in('id', uniqueCategoryIds);
        categories = categoriesData || [];
      }

      const typeMap = types.reduce((acc: any, type: any) => {
        acc[type.id] = { name: type.name, concept_type: type.concept_type };
        return acc;
      }, {});

      const categoryMap = categories.reduce((acc: any, category: any) => {
        acc[category.id] = category.name;
        return acc;
      }, {});

      return movements.map((m: any) => ({
        id: m.id,
        description: m.description || 'Sin descripción',
        amount: Math.abs(m.amount || 0), // Always show positive amount
        type: typeMap[m.type_id]?.concept_type === 'INGRESOS' ? 'income' : 'expense',
        category: categoryMap[m.category_id] || typeMap[m.type_id]?.name || 'Sin categoría',
        created_at: m.created_at
      }));
    },
    enabled: !!organizationId
  });

  const headerProps = {
    title: "Resumen de Finanzas",
    icon: DollarSign,
    showSearch: false,
    actions: []
  };

  const isLoading = loadingSummary || loadingMovements || loadingWallets || loadingFlow;

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando resumen financiero...</div>
        </div>
      </Layout>
    );
  }

  const summary = financialSummary || {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    recentMovementsCount: 0,
    thisMonthIncome: 0,
    thisMonthExpenses: 0
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Income */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--accent))' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-1))' }}>
                {formatCurrency(summary.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                Este mes: {formatCurrency(summary.thisMonthIncome)}
              </p>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
              <TrendingDown className="h-4 w-4" style={{ color: 'hsl(var(--accent))' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-2))' }}>
                {formatCurrency(summary.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                Este mes: {formatCurrency(summary.thisMonthExpenses)}
              </p>
            </CardContent>
          </Card>

          {/* Net Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
              <DollarSign className="h-4 w-4" style={{ color: 'hsl(var(--accent))' }} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold`} style={{ 
                color: summary.netBalance >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))'
              }}>
                {formatCurrency(summary.netBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.netBalance >= 0 ? 'Ganancia' : 'Pérdida'} del período
              </p>
            </CardContent>
          </Card>

          {/* Recent Movements Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Movimientos</CardTitle>
              <Calendar className="h-4 w-4" style={{ color: 'hsl(var(--accent))' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.recentMovementsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de movimientos registrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Graphics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wallet Balance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" style={{ color: 'hsl(var(--accent))' }} />
                Balance por Billetera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WalletBalanceChart 
                data={walletBalanceData} 
                isLoading={loadingWallets} 
              />
            </CardContent>
          </Card>

          {/* Monthly Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" style={{ color: 'hsl(var(--accent))' }} />
                Flujo Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyFlowChart 
                data={monthlyFlowData} 
                isLoading={loadingFlow} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Movements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{ color: 'hsl(var(--accent))' }} />
              Movimientos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMovements.length > 0 ? (
                recentMovements.map((movement: any) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg`} style={{
                        backgroundColor: movement.type === 'income' 
                          ? 'hsl(var(--chart-1) / 0.1)' 
                          : 'hsl(var(--chart-2) / 0.1)',
                        color: movement.type === 'income' 
                          ? 'hsl(var(--chart-1))' 
                          : 'hsl(var(--chart-2))'
                      }}>
                        {movement.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{movement.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {movement.category} • {format(new Date(movement.created_at), 'dd MMM', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="font-bold" style={{
                      color: movement.type === 'income' 
                        ? 'hsl(var(--chart-1))' 
                        : 'hsl(var(--chart-2))'
                    }}>
                      {movement.type === 'income' ? '+' : '-'}{formatCurrency(movement.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No hay movimientos financieros registrados.</p>
                  <p className="text-xs">Los movimientos aparecerán aquí cuando se registren.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}