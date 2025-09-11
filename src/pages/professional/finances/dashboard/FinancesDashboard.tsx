import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, TrendingDown, FileText, Calendar, ArrowUpDown, Wallet, Building } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useFinancialSummary, useMonthlyFlowData, useRecentMovements } from '@/hooks/use-finance-dashboard-simple'
import { useWalletCurrencyBalances } from '@/hooks/use-wallet-currency-balances'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { MonthlyFlowChart } from '@/components/charts/MonthlyFlowChart'
import { WalletCurrencyBalanceTable } from '@/components/charts/WalletCurrencyBalanceTable'
import { MiniTrendChart } from '@/components/charts/MiniTrendChart'
import { ActionBar } from '@/components/layout/desktop/ActionBar'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'wouter'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { motion } from 'framer-motion'
import { useNavigationStore } from '@/stores/navigationStore'


export default function FinancesDashboard() {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  
  // State for view mode toggle
  const [viewMode, setViewMode] = useState<'project' | 'all'>('project')
  
  // Get organization currencies to determine default currency
  const { data: organizationCurrencies } = useOrganizationCurrencies(organizationId)
  const defaultCurrency = organizationCurrencies?.find(c => c.is_default)?.currency
  
  // Use current project for data queries or all projects based on view mode
  const effectiveProjectId = viewMode === 'project' ? (projectId || "") : ""
  
  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary(organizationId, effectiveProjectId, 'desde-siempre')
  const { data: monthlyFlow, isLoading: flowLoading } = useMonthlyFlowData(organizationId, effectiveProjectId, 'desde-siempre')

  const { data: walletCurrencyBalances, isLoading: walletCurrencyLoading } = useWalletCurrencyBalances(organizationId, effectiveProjectId)
  const { data: recentMovements } = useRecentMovements(organizationId, effectiveProjectId, 5, 'desde-siempre')
  
  const formatCurrency = (amount: number) => {
    // Use the default currency for formatting
    const defaultCurrencyCode = defaultCurrency?.code || 'ARS'
    const locale = defaultCurrencyCode === 'ARS' ? 'es-AR' : 'es-ES'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: defaultCurrencyCode,
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Format movement amount with original currency symbol
  const formatMovementAmount = (movement: any) => {
    // Get currency symbol from movement data
    const currencyName = movement.currency?.name || movement.currencies?.name
    const amount = movement.amount || 0
    
    if (currencyName === 'Dólar Estadounidense') {
      return `USD ${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.abs(amount))}`
    } else {
      return `ARS ${new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.abs(amount))}`
    }
  }

  // Get currency badge component
  const getCurrencyBadge = () => (
    <Badge variant="secondary" className="text-xs">
      {defaultCurrency?.code || 'ARS'}
    </Badge>
  )

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return { color: 'var(--chart-positive)' }
    if (balance < 0) return { color: 'var(--chart-negative)' }
    return { color: 'var(--chart-neutral)' }
  }

  return (
    <>
      <div>
        {/* View mode toggle */}
        <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ver datos de:</span>
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'project' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('project')}
                className="h-8 px-3"
              >
                <FileText className="w-4 h-4 mr-2" />
                Proyecto Actual
              </Button>
              <Button
                variant={viewMode === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('all')}
                className="h-8 px-3"
              >
                <Building className="w-4 h-4 mr-2" />
                Toda la Organización
              </Button>
            </div>
          </div>
        </div>

        {/* Show empty state if no movements exist */}
        {!summaryLoading && (!financialSummary || financialSummary.totalMovements === 0) ? (
          <EmptyState 
            icon={<DollarSign className="h-12 w-12" />}
            title="Sin movimientos financieros registrados"
            description="Comienza registrando tu primer ingreso o egreso para ver el resumen completo de tus finanzas."
          />
        ) : (
          <>
        {/* FILA 1: 3 columnas - Balances por Billetera y Moneda / Este Mes / Movimientos Recientes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {/* Balances por Billetera y Moneda */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Balances por Billetera y Moneda
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Resumen detallado de saldos
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  MULTI
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <WalletCurrencyBalanceTable data={walletCurrencyBalances || []} isLoading={walletCurrencyLoading} />
            </CardContent>
          </Card>

          {/* Este Mes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Este Mes
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(), 'MMMM yyyy', { locale: es })}
                  </p>
                </div>
                {getCurrencyBadge()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-medium" style={{ color: 'var(--chart-positive)' }}>
                    {summaryLoading ? '...' : formatCurrency(financialSummary?.thisMonthIncome || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Egresos</span>
                  <span className="font-medium" style={{ color: 'var(--chart-negative)' }}>
                    {summaryLoading ? '...' : formatCurrency(financialSummary?.thisMonthExpenses || 0)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Balance Mensual</span>
                    <span className="font-bold" style={getBalanceColor(financialSummary?.thisMonthBalance || 0)}>
                      {summaryLoading ? '...' : formatCurrency(financialSummary?.thisMonthBalance || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movimientos Recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Movimientos Recientes
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Últimos 5 movimientos registrados
              </p>
            </CardHeader>
            <CardContent>
              {recentMovements && recentMovements.length > 0 ? (
                <div className="space-y-3">
                  {recentMovements.slice(0, 5).map((movement, index) => (
                    <div key={movement.id || index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--accent)]"></div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-32">
                            {movement.description || 'Sin descripción'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {movement.movement_date && format(new Date(movement.movement_date), 'dd/MM', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {formatMovementAmount(movement)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ArrowUpDown className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No hay movimientos registrados
                  </p>
                  <Link 
                    href="/finances/dashboard"
                    className="inline-flex items-center px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Crear Primer Movimiento
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FILA 2: 4 columnas - 3 KPIs apilados + Gráfico de Flujo Financiero */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Columna 1: 3 KPIs apilados */}
          <div className="space-y-4">
            {/* Income Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full relative overflow-hidden">
                <CardContent className="p-4 h-full flex flex-col">
                  {/* Mini Chart */}
                  <div className="mb-4">
                    <MiniTrendChart 
                      data={monthlyFlow?.map(month => ({ value: month.income || 0 })) || []} 
                      color="var(--chart-positive)" 
                      isLoading={flowLoading} 
                    />
                  </div>
                  
                  {/* Spacer to push content down */}
                  <div className="flex-1"></div>
                  
                  {/* Icon and Title Section - positioned lower */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" style={{ color: 'var(--chart-positive)' }} />
                      <span className="text-sm text-muted-foreground">
                        Ingresos Totales
                      </span>
                    </div>
                    {getCurrencyBadge()}
                  </div>
                  
                  {/* Amount - smaller size like reference */}
                  <div className="text-lg font-bold" style={{ color: 'var(--chart-positive)' }}>
                    {summaryLoading ? '...' : formatCurrency(financialSummary?.totalIncome || 0)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Expenses Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="h-full relative overflow-hidden">
                <CardContent className="p-4 h-full flex flex-col">
                  {/* Mini Chart */}
                  <div className="mb-4">
                    <MiniTrendChart 
                      data={monthlyFlow?.map(month => ({ value: Math.abs(month.expenses || 0) })) || []} 
                      color="var(--chart-negative)" 
                      isLoading={flowLoading} 
                    />
                  </div>
                  
                  {/* Spacer to push content down */}
                  <div className="flex-1"></div>
                  
                  {/* Icon and Title Section - positioned lower */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" style={{ color: 'var(--chart-negative)' }} />
                      <span className="text-sm text-muted-foreground">
                        Egresos Totales
                      </span>
                    </div>
                    {getCurrencyBadge()}
                  </div>
                  
                  {/* Amount - smaller size like reference */}
                  <div className="text-lg font-bold" style={{ color: 'var(--chart-negative)' }}>
                    {summaryLoading ? '...' : formatCurrency(financialSummary?.totalExpenses || 0)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="h-full relative overflow-hidden">
                <CardContent className="p-4 h-full flex flex-col">
                  {/* Mini Chart */}
                  <div className="mb-4">
                    <MiniTrendChart 
                      data={monthlyFlow?.map(month => ({ value: month.net || 0 })) || []} 
                      color="var(--chart-neutral)" 
                      isLoading={flowLoading} 
                    />
                  </div>
                  
                  {/* Spacer to push content down */}
                  <div className="flex-1"></div>
                  
                  {/* Icon and Title Section - positioned lower */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" style={getBalanceColor(financialSummary?.balance || 0)} />
                      <span className="text-sm text-muted-foreground">
                        Balance Neto
                      </span>
                    </div>
                    {getCurrencyBadge()}
                  </div>
                  
                  {/* Amount - smaller size like reference */}
                  <div className="text-lg font-bold" style={getBalanceColor(financialSummary?.balance || 0)}>
                    {summaryLoading ? '...' : formatCurrency(financialSummary?.balance || 0)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Columnas 2-4: Gráfico de Flujo Financiero Mensual */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Flujo Financiero Mensual
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Ingresos, egresos y flujo neto del período seleccionado
                    </p>
                  </div>
                  {getCurrencyBadge()}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <MonthlyFlowChart 
                  data={monthlyFlow || []} 
                  isLoading={flowLoading} 
                />
              </CardContent>
            </Card>
          </div>
        </div>

        </>
        )}
      </div>
    </>
  )
}