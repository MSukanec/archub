import { useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { Card } from '@/components/ui/card';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function FinancesDashboard() {
  const { setSidebarContext } = useNavigationStore();
  const { data: userData } = useCurrentUser();

  // Set sidebar context on component mount
  useEffect(() => {
    setSidebarContext('finances');
  }, [setSidebarContext]);

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
            <div className="text-2xl font-bold text-green-600">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% respecto al mes anterior
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Egresos Totales</div>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">$23,456.78</div>
            <p className="text-xs text-muted-foreground">
              +4.1% respecto al mes anterior
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Balance Neto</div>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">$21,775.11</div>
            <p className="text-xs text-muted-foreground">
              +15.3% respecto al mes anterior
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Movimientos</div>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="font-medium">Registrar Ingreso</div>
                <div className="text-sm text-muted-foreground">Agregar un nuevo movimiento de ingreso</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="font-medium">Registrar Egreso</div>
                <div className="text-sm text-muted-foreground">Agregar un nuevo movimiento de egreso</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="font-medium">Ver Reportes</div>
                <div className="text-sm text-muted-foreground">Generar reportes financieros detallados</div>
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Movimientos Recientes</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">Pago de materiales</div>
                  <div className="text-sm text-muted-foreground">Hoy</div>
                </div>
                <div className="text-red-600 font-medium">-$2,500.00</div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">Facturación cliente</div>
                  <div className="text-sm text-muted-foreground">Ayer</div>
                </div>
                <div className="text-green-600 font-medium">+$8,750.00</div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">Servicios profesionales</div>
                  <div className="text-sm text-muted-foreground">2 días</div>
                </div>
                <div className="text-red-600 font-medium">-$1,200.00</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}