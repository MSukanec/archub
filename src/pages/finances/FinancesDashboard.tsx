import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, FileText, Calendar, CreditCard, User, ArrowUpDown } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useFinancialSummary, useMonthlyFlowData, useWalletBalances, useRecentMovements } from '@/hooks/use-finance-dashboard-simple'
import { MonthlyFlowChart } from '@/components/graphics/MonthlyFlowChart'
import { WalletBalanceChart } from '@/components/graphics/WalletBalanceChart'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'wouter'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'

export default function FinancesDashboard() {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary(organizationId, projectId)
  const { data: monthlyFlow, isLoading: flowLoading } = useMonthlyFlowData(organizationId, projectId)
  const { data: walletBalances, isLoading: walletsLoading } = useWalletBalances(organizationId, projectId)
  const { data: recentMovements, isLoading: recentLoading } = useRecentMovements(organizationId, projectId, 5)

  const headerProps = {
    title: "Resumen de Finanzas",
    showSearch: false,
    showFilters: false,
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600'
    if (balance < 0) return 'text-red-600'
    return 'text-muted-foreground'
  }

  // Show empty state if no movements exist
  if (!summaryLoading && (!financialSummary || financialSummary.totalMovements === 0)) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <CustomEmptyState 
            title="Sin movimientos financieros registrados"
            description="Comienza registrando tu primer ingreso o egreso para ver el resumen completo de tus finanzas."
            action={
              <Link 
                href="/finances/movements"
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Crear Primer Movimiento
              </Link>
            }
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summaryLoading ? '...' : formatCurrency(financialSummary?.totalIncome || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                acumulado histórico
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Egresos Totales</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summaryLoading ? '...' : formatCurrency(financialSummary?.totalExpenses || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                total gastado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance General</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getBalanceColor(financialSummary?.balance || 0)}`}>
                {summaryLoading ? '...' : formatCurrency(financialSummary?.balance || 0)}
              </div>
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
              <div className="text-2xl font-bold">
                {summaryLoading ? '...' : (financialSummary?.totalMovements || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                registros totales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos - Flujo Mensual y Balance de Billeteras */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flujo Financiero Mensual</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ingresos, egresos y flujo neto de los últimos 12 meses
              </p>
            </CardHeader>
            <CardContent>
              <MonthlyFlowChart data={monthlyFlow || []} isLoading={flowLoading} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Balance por Billetera</CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribución de balances entre billeteras activas
              </p>
            </CardHeader>
            <CardContent>
              <WalletBalanceChart data={walletBalances || []} isLoading={walletsLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Resumen Mensual y Movimientos Recientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Este Mes</CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'MMMM yyyy', { locale: es })}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-medium text-green-600">
                    {summaryLoading ? '...' : formatCurrency(financialSummary?.thisMonthIncome || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Egresos</span>
                  <span className="font-medium text-red-600">
                    {summaryLoading ? '...' : formatCurrency(financialSummary?.thisMonthExpenses || 0)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Balance Mensual</span>
                    <span className={`font-bold ${getBalanceColor(financialSummary?.thisMonthBalance || 0)}`}>
                      {summaryLoading ? '...' : formatCurrency(financialSummary?.thisMonthBalance || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Movimientos Recientes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Últimos 5 movimientos registrados
              </p>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="text-sm text-muted-foreground">Cargando movimientos...</div>
              ) : recentMovements && recentMovements.length > 0 ? (
                <div className="space-y-3">
                  {recentMovements.map((movement: any) => {
                    const isIncome = movement.movement_concepts?.name?.toLowerCase().includes('ingreso')
                    const amount = Math.abs(movement.amount || 0)
                    
                    return (
                      <div key={movement.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1 rounded ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {isIncome ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium line-clamp-1">
                              {movement.description || 'Sin descripción'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(movement.movement_date), 'dd/MM/yyyy', { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(amount)}
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-2 border-t">
                    <Link href="/finances/movements" className="text-sm text-primary hover:underline">
                      Ver todos los movimientos →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ArrowUpDown className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No hay movimientos registrados
                  </p>
                  <Link 
                    href="/finances/movements"
                    className="inline-flex items-center px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Crear Primer Movimiento
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link 
                href="/finances/movements"
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Ver Movimientos</span>
              </Link>
              
              <Link 
                href="/finances/preferences"
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <CreditCard className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Preferencias</span>
              </Link>
              
              <Link 
                href="/project/dashboard"
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Volver al Proyecto</span>
              </Link>

              <Link 
                href="/organization/dashboard"
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <User className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Ver Organización</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}