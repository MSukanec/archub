import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, PieChart, BarChart3, Calendar, ArrowUpRight, ArrowDownRight, LineChart } from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { supabase } from "@/lib/supabase";
import { WalletBalanceChart } from "@/components/graphics/WalletBalanceChart";
import { MonthlyFlowChart } from "@/components/graphics/MonthlyFlowChart";
import { BudgetProgressChart } from "@/components/graphics/BudgetProgressChart";

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  monthlyBudget: number;
  budgetUsed: number;
  pendingPayments: number;
}

interface RecentMovement {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  created_at: string;
}

export default function FinancesDashboard() {
  const [searchValue, setSearchValue] = useState("");
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const organizationId = userData?.preferences?.last_organization_id;
  const projectId = userData?.preferences?.last_project_id;

  // Set sidebar context to finance when component mounts
  useEffect(() => {
    setSidebarContext('finance');
  }, [setSidebarContext]);

  // Fetch financial summary
  const { data: financialSummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['financial-summary', organizationId, projectId],
    queryFn: async () => {
      if (!organizationId || !projectId) return null;

      // Get movements for this project
      const { data: movements, error } = await supabase
        .from('movements')
        .select(`
          id,
          amount,
          movement_data (
            type (
              name
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('project_id', projectId);

      if (error) {
        console.log('No movements found, using default summary');
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netBalance: 0,
          monthlyBudget: 100000,
          budgetUsed: 0,
          pendingPayments: 0
        };
      }

      const income = movements
        ?.filter(m => m.movement_data?.type?.name?.toLowerCase().includes('ingreso'))
        ?.reduce((sum, m) => sum + m.amount, 0) || 0;

      const expenses = movements
        ?.filter(m => m.movement_data?.type?.name?.toLowerCase().includes('gasto'))
        ?.reduce((sum, m) => sum + m.amount, 0) || 0;

      return {
        totalIncome: income,
        totalExpenses: expenses,
        netBalance: income - expenses,
        monthlyBudget: 100000,
        budgetUsed: (expenses / 100000) * 100,
        pendingPayments: Math.floor(Math.random() * 5) + 1
      } as FinancialSummary;
    },
    enabled: !!organizationId && !!projectId
  });

  // Fetch wallet balance data for pie chart
  const { data: walletBalanceData = [], isLoading: loadingWallets } = useQuery({
    queryKey: ['wallet-balance', organizationId, projectId],
    queryFn: async () => {
      if (!organizationId || !projectId) return [];

      const { data: wallets, error } = await supabase
        .from('organization_wallets')
        .select(`
          wallets (
            id,
            name
          ),
          is_active
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (error || !wallets) return [];

      // Mock data for demonstration - in real app would get actual balances
      const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];
      return wallets.map((wallet, index) => ({
        wallet: wallet.wallets?.name || 'Billetera',
        balance: Math.floor(Math.random() * 500000) + 50000,
        color: colors[index % colors.length]
      }));
    },
    enabled: !!organizationId && !!projectId
  });

  // Fetch monthly flow data for line chart
  const { data: monthlyFlowData = [], isLoading: loadingFlow } = useQuery({
    queryKey: ['monthly-flow', organizationId, projectId],
    queryFn: async () => {
      if (!organizationId || !projectId) return [];

      // Generate last 6 months of data
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('es-AR', { month: 'short' });
        
        // Mock data - in real app would aggregate actual movements by month
        const income = Math.floor(Math.random() * 200000) + 100000;
        const expenses = Math.floor(Math.random() * 150000) + 50000;
        
        months.push({
          month: monthName,
          income,
          expenses,
          net: income - expenses
        });
      }
      return months;
    },
    enabled: !!organizationId && !!projectId
  });

  // Fetch budget progress data for bar chart
  const { data: budgetProgressData = [], isLoading: loadingBudget } = useQuery({
    queryKey: ['budget-progress', organizationId, projectId],
    queryFn: async () => {
      if (!organizationId || !projectId) return [];

      // Mock budget categories - in real app would come from budget table
      const categories = [
        'Materiales',
        'Mano de obra',
        'Equipos',
        'Servicios',
        'Varios'
      ];

      return categories.map(category => {
        const budget = Math.floor(Math.random() * 300000) + 100000;
        const spent = Math.floor(Math.random() * budget * 0.9);
        const percentage = (spent / budget) * 100;
        
        return {
          category,
          budget,
          spent,
          remaining: budget - spent,
          percentage
        };
      });
    },
    enabled: !!organizationId && !!projectId
  });

  // Fetch recent movements
  const { data: recentMovements = [], isLoading: loadingMovements } = useQuery({
    queryKey: ['recent-movements', organizationId, projectId],
    queryFn: async () => {
      if (!organizationId || !projectId) return [];

      const { data, error } = await supabase
        .from('movements')
        .select(`
          id,
          description,
          amount,
          created_at,
          movement_data (
            type (
              name
            ),
            category (
              name
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.log('No recent movements found');
        return [];
      }

      return data?.map(m => ({
        id: m.id,
        description: m.description || 'Sin descripción',
        amount: m.amount,
        type: m.movement_data?.type?.name?.toLowerCase().includes('ingreso') ? 'income' : 'expense',
        category: m.movement_data?.category?.name || 'Sin categoría',
        created_at: m.created_at
      })) || [];
    },
    enabled: !!organizationId && !!projectId
  });

  const headerProps = {
    title: "Resumen de Finanzas",
    icon: DollarSign,
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    onClearFilters: () => setSearchValue(""),
    actions: [
      <Button key="reportes" variant="outline" size="sm">
        <BarChart3 className="mr-2 h-4 w-4" />
        Reportes
      </Button>,
      <Button key="nuevo" size="sm">
        <DollarSign className="mr-2 h-4 w-4" />
        Nuevo movimiento
      </Button>
    ]
  };

  const isLoading = loadingSummary || loadingMovements || loadingWallets || loadingFlow || loadingBudget;

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando dashboard financiero...</div>
        </div>
      </Layout>
    );
  }

  const summary = financialSummary || {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    monthlyBudget: 100000,
    budgetUsed: 0,
    pendingPayments: 0
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
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% desde el mes pasado
              </p>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                +8% desde el mes pasado
              </p>
            </CardContent>
          </Card>

          {/* Net Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary.netBalance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.netBalance >= 0 ? 'Ganancia' : 'Pérdida'} del período
              </p>
            </CardContent>
          </Card>

          {/* Budget Usage */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uso del Presupuesto</CardTitle>
              <PieChart className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.budgetUsed.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                ${summary.monthlyBudget.toLocaleString()} presupuesto mensual
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Movimientos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMovements.length > 0 ? (
                  recentMovements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          movement.type === 'income' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
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
                      <div className={`font-bold ${
                        movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.type === 'income' ? '+' : '-'}${Math.abs(movement.amount).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">No hay movimientos financieros registrados.</p>
                    <p className="text-xs">Agrega el primer movimiento para comenzar.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Registrar Ingreso</p>
                      <p className="text-xs text-muted-foreground">Agregar un nuevo ingreso al proyecto</p>
                    </div>
                  </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Registrar Gasto</p>
                      <p className="text-xs text-muted-foreground">Agregar un nuevo gasto al proyecto</p>
                    </div>
                  </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Ver Reportes</p>
                      <p className="text-xs text-muted-foreground">Analizar tendencias financieras</p>
                    </div>
                  </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                      <PieChart className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Gestionar Presupuesto</p>
                      <p className="text-xs text-muted-foreground">Configurar límites y alertas</p>
                    </div>
                  </div>
                </Button>
              </div>

              {summary.pendingPayments > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-800">
                      Tienes {summary.pendingPayments} pagos pendientes
                    </p>
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">
                    Revisa tu plan de pagos para mantener el flujo de caja
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial Graphics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet Balance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
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
                <TrendingUp className="h-5 w-5" />
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

          {/* Budget Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Progreso del Presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetProgressChart 
                data={budgetProgressData} 
                isLoading={loadingBudget} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}