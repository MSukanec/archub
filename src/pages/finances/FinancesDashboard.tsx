import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase";

export default function FinancesDashboard() {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;

  // Fetch financial summary
  const { data: financialSummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['financial-summary', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase) return null;

      // Get movements for this organization
      const { data: movements, error } = await supabase
        .from('movements')
        .select('id, amount, description')
        .eq('organization_id', organizationId);

      if (error) {
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netBalance: 0,
          monthlyBudget: 100000,
          budgetUsed: 0,
          pendingPayments: 0
        };
      }

      const totalAmount = movements?.reduce((sum, m) => sum + m.amount, 0) || 0;

      return {
        totalIncome: totalAmount > 0 ? totalAmount : 0,
        totalExpenses: totalAmount < 0 ? Math.abs(totalAmount) : 0,
        netBalance: totalAmount,
        monthlyBudget: 100000,
        budgetUsed: Math.abs(totalAmount),
        pendingPayments: 0
      };
    }
  });

  if (loadingSummary) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Resumen de Finanzas</h1>
          <div className="text-center text-muted-foreground">
            Cargando datos financieros...
          </div>
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

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Resumen de Finanzas</h1>
        
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${summary.totalIncome.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${summary.totalExpenses.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary.netBalance.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presupuesto Usado</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${summary.budgetUsed.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                de ${summary.monthlyBudget.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Progreso del Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min((summary.budgetUsed / summary.monthlyBudget) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>Usado: ${summary.budgetUsed.toLocaleString()}</span>
              <span>Total: ${summary.monthlyBudget.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}