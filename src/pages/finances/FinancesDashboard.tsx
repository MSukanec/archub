import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Calendar, FileText } from 'lucide-react'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'

export default function FinancesDashboard() {
  const headerProps = {
    title: "Resumen de Finanzas",
    showSearch: false,
    showFilters: false,
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">$0</div>
              <p className="text-xs text-muted-foreground">
                total acumulado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Egresos</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">$0</div>
              <p className="text-xs text-muted-foreground">
                total gastado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">
                balance actual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Movimientos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                registros totales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Movimientos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomEmptyState 
                title="Sin movimientos registrados"
                description="Comienza registrando ingresos y egresos para ver tu actividad financiera aquí."
                action={
                  <button 
                    onClick={() => window.location.href = '/finances/movements'}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Ver Movimientos
                  </button>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Este Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-medium text-green-600">$0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Egresos</span>
                  <span className="font-medium text-red-600">$0</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Balance Mensual</span>
                    <span className="font-bold">$0</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button 
                onClick={() => window.location.href = '/finances/movements'}
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Ver Movimientos</span>
              </button>
              
              <button 
                onClick={() => window.location.href = '/finances/preferences'}
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <CreditCard className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Preferencias</span>
              </button>
              
              <button 
                onClick={() => window.location.href = '/project/dashboard'}
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Volver al Proyecto</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}