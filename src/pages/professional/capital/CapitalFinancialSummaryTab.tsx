import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DollarSign, ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useFinancialSummary, useMonthlyFlowData, useRecentMovements } from '@/hooks/use-finance-dashboard-simple'
import { useWalletCurrencyBalances } from '@/hooks/use-wallet-currency-balances'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { MonthlyFlowChart } from '@/components/charts/MonthlyFlowChart'
import { WalletCurrencyBalanceTable } from '@/components/charts/WalletCurrencyBalanceTable'
import { formatDateShort } from '@/lib/date-utils'
import { Link } from 'wouter'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { CapitalChart } from '@/components/charts/organization/dashboard/CapitalChart'
import { useMovements } from '@/hooks/use-movements'
import { useMovementKPIs } from '@/hooks/use-movement-kpis'

type Period = 'Semana' | 'Mes' | 'Trimestre' | 'Año';


export default function FinancesDashboard() {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  // Estado para el gráfico de capital
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Trimestre');
  const { data: movements = [] } = useMovements(organizationId, null);
  const { organizationBalances, isLoading: kpisLoading } = useMovementKPIs(organizationId);
  
  // Obtener el balance principal (primera moneda con más movimientos)
  const primaryBalance = organizationBalances && organizationBalances.length > 0 
    ? organizationBalances[0] 
    : null;
  
  // Always use organization view mode
  const viewMode = 'all'
  
  // Get organization currencies to determine default currency
  const { data: organizationCurrencies } = useOrganizationCurrencies(organizationId)
  const defaultCurrency = organizationCurrencies?.find(c => c.is_default)?.currency
  
  // Always use organization view (all projects)
  const effectiveProjectId = ""
  
  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary(organizationId, effectiveProjectId, 'desde-siempre')
  const { data: monthlyFlow, isLoading: flowLoading } = useMonthlyFlowData(organizationId, effectiveProjectId, 'desde-siempre')

  const walletCurrencyData = useWalletCurrencyBalances(organizationId, effectiveProjectId)
  const walletCurrencyLoading = walletCurrencyData.isLoading
  
  // Extract wallet balances from the KPI data structure
  const walletCurrencyBalances = walletCurrencyData.organizationBalances?.flatMap(currency => 
    currency.wallets?.map(wallet => ({
      wallet: wallet.wallet,
      currency: wallet.currency, 
      balance: wallet.balance,
      state: wallet.balance > 0 ? 'Positivo' as const : wallet.balance < 0 ? 'Negativo' as const : 'Neutro' as const
    })) || []
  ) || []
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

        {/* Show empty state if no movements exist */}
        {!summaryLoading && (!financialSummary || financialSummary.totalMovements === 0) ? (
          <EmptyState 
            icon={<DollarSign className="h-12 w-12" />}
            title="Sin movimientos financieros registrados"
            description="Comienza registrando tu primer ingreso o egreso para ver el resumen completo de tus finanzas."
          />
        ) : (
          <>
        {/* Gráfico de Capital - 100% ancho - IDÉNTICO al del dashboard */}
        <div className="relative group mb-6">
          {/* Header - idéntico al dashboard */}
          <div className="flex flex-row items-start justify-between mb-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                  Capital
                </p>
              </div>
              
              {/* Total histórico - debajo del título */}
              <div className="text-5xl font-bold text-foreground tracking-tight leading-none">
                ${primaryBalance?.balance.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) || '0.00'}
              </div>
              
              {/* Ingresos y Egresos - debajo del monto total */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  I: <span className="text-green-600 font-medium">
                    ${primaryBalance?.positiveTotal.toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) || '0.00'}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  E: <span className="text-red-600 font-medium">
                    ${primaryBalance?.negativeTotal.toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) || '0.00'}
                  </span>
                </span>
              </div>
            </div>
            
            {/* Period selector buttons */}
            <div className="flex items-center gap-2">
              {(['Semana', 'Mes', 'Trimestre', 'Año'] as Period[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    selectedPeriod === period
                      ? 'bg-foreground text-background font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid={`button-period-${period.toLowerCase()}`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          
          {/* Gráfico */}
          <CapitalChart 
            movements={movements} 
            primaryCurrencyCode={primaryBalance?.currencyCode || defaultCurrency?.code || '$'}
            selectedPeriod={selectedPeriod}
          />
        </div>

        {/* 2 columnas - Balances por Billetera y Moneda / Movimientos Recientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Balances por Billetera y Moneda */}
          <Card>
            <CardHeader className="pb-2">
              <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                Balances por Billetera
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <WalletCurrencyBalanceTable data={walletCurrencyBalances} isLoading={walletCurrencyLoading} />
            </CardContent>
          </Card>

          {/* Movimientos Recientes */}
          <Card>
            <CardHeader className="pb-2">
              <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                Movimientos Recientes
              </p>
            </CardHeader>
            <CardContent className="pt-4">
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
                            {movement.movement_date && formatDateShort(movement.movement_date)}
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

        {/* Flujo Financiero Mensual - 100% ancho */}
        <div className="relative group mt-6">
          {/* Header - igual que el de Capital */}
          <div className="flex flex-row items-start justify-between mb-4">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                Flujo Financiero Mensual
              </p>
            </div>
          </div>
          
          {/* Gráfico */}
          <MonthlyFlowChart 
            data={monthlyFlow || []} 
            isLoading={flowLoading} 
          />
        </div>

        </>
        )}
      </div>
    </>
  )
}