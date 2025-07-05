import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, FileText, CreditCard, Settings } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useFinancialSummary, useRecentMovements } from '@/hooks/use-finance-dashboard-simple'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'

export default function FinancesDashboard() {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary(organizationId, projectId)
  const { data: recentMovements, isLoading: recentLoading } = useRecentMovements(organizationId, projectId, 3)

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

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
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
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? '...' : formatCurrency(financialSummary?.totalIncome || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                total acumulado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Egresos</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? '...' : formatCurrency(financialSummary?.totalExpenses || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                total gastado
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

        {/* Estado Financiero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actividad Reciente</CardTitle>
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
                      <div key={movement.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1 rounded ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {isIncome ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium line-clamp-1">
                              {movement.description || 'Sin descripción'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(movement.movement_date).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(amount)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <CustomEmptyState 
                  title="Sin actividad registrada"
                  description="Comienza registrando movimientos financieros para ver la actividad aquí."
                  action={
                    <button 
                      onClick={() => window.location.href = '/finances/movements'}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Ir a Movimientos
                    </button>
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado Financiero</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="text-sm text-muted-foreground">Cargando datos...</div>
              ) : financialSummary && financialSummary.totalMovements > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Este mes - Ingresos</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(financialSummary.thisMonthIncome || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Este mes - Egresos</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(financialSummary.thisMonthExpenses || 0)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Balance Mensual</span>
                      <span className={`font-bold ${getBalanceColor(financialSummary.thisMonthBalance || 0)}`}>
                        {formatCurrency(financialSummary.thisMonthBalance || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <CustomEmptyState 
                  title="Sin datos financieros"
                  description="Registra movimientos para ver el estado financiero de tu proyecto."
                  action={
                    <button 
                      onClick={() => window.location.href = '/finances/movements'}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Crear Movimiento
                    </button>
                  }
                />
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
              <button 
                onClick={() => window.location.href = '/finances/movements'}
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Movimientos</span>
              </button>
              
              <button 
                onClick={() => window.location.href = '/finances/preferences'}
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <Settings className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Preferencias</span>
              </button>
              
              <button 
                onClick={() => window.location.href = '/finances/movements'}
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Nuevo Ingreso</span>
              </button>
              
              <button 
                onClick={() => window.location.href = '/finances/movements'}
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <CreditCard className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Nuevo Egreso</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}