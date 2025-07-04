import { useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { MonthlyFlowChart } from '@/components/graphics/MonthlyFlowChart';
import { BudgetProgressChart } from '@/components/graphics/BudgetProgressChart';

export default function FinancesDashboard() {
  const { setSidebarContext } = useNavigationStore();
  const { data: userData } = useCurrentUser();

  // Set sidebar context on component mount
  useEffect(() => {
    setSidebarContext('finances');
  }, [setSidebarContext]);

  // Mock data for charts - replace with real data from Supabase
  const monthlyFlowData = [
    { month: 'Ene', income: 45000, expenses: 35000, net: 10000 },
    { month: 'Feb', income: 52000, expenses: 38000, net: 14000 },
    { month: 'Mar', income: 48000, expenses: 42000, net: 6000 },
    { month: 'Abr', income: 61000, expenses: 45000, net: 16000 },
    { month: 'May', income: 55000, expenses: 39000, net: 16000 },
    { month: 'Jun', income: 67000, expenses: 48000, net: 19000 },
    { month: 'Jul', income: 58000, expenses: 41000, net: 17000 },
  ];

  const budgetProgressData = [
    { category: 'Materiales', budget: 100000, spent: 75000, remaining: 25000, percentage: 75 },
    { category: 'Mano de Obra', budget: 80000, spent: 55000, remaining: 25000, percentage: 68.75 },
    { category: 'Equipos', budget: 50000, spent: 35000, remaining: 15000, percentage: 70 },
    { category: 'Servicios', budget: 30000, spent: 28000, remaining: 2000, percentage: 93.33 },
  ];

  return (
    <Layout wide>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Resumen de Finanzas</h1>
          <p className="text-sm text-muted-foreground">
            Vista general del estado financiero de {userData?.organization?.name || 'la organización'}
          </p>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Ingresos Totales</div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">$ 14.000</div>
            <p className="text-xs text-muted-foreground">
              Este mes $ 0
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Gastos Totales</div>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">$ 1.860.085</div>
            <p className="text-xs text-muted-foreground">
              Este mes $ 777.617
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Balance Neto</div>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">-$ 1.846.085</div>
            <p className="text-xs text-muted-foreground">
              Resultado del periodo
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Movimientos</div>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">
              Total de movimientos registrados
            </p>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
                Balance por Billetera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetProgressChart data={budgetProgressData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
                Flujo Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyFlowChart data={monthlyFlowData} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Movements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
              Movimientos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Sin descripción</div>
                    <div className="text-sm text-muted-foreground">Ingresos • 03 jul</div>
                  </div>
                </div>
                <div className="text-green-600 font-medium">$ 67</div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Rendiganti, Paolo Xavier Sequeira - 4 días.</div>
                    <div className="text-sm text-muted-foreground">Mano de Obra • 03 jul</div>
                  </div>
                </div>
                <div className="text-red-600 font-medium">$ 90.000</div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Cariadón, cadorina, clavos, tornillos, alambre, etc.</div>
                    <div className="text-sm text-muted-foreground">Materiales • 03 jul</div>
                  </div>
                </div>
                <div className="text-red-600 font-medium">$ 83.550</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}