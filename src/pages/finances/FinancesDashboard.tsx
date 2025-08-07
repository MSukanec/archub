import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, TrendingDown, FileText, Calendar, ArrowUpDown, Wallet } from 'lucide-react'

import { TimePeriodSelector } from '@/components/ui-custom/TimePeriodSelector'
import { Selector } from '@/components/ui-custom/Selector'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useFinancialSummary, useMonthlyFlowData, useWalletBalances, useRecentMovements, useExpensesByCategory } from '@/hooks/use-finance-dashboard-simple'
import { useWalletCurrencyBalances } from '@/hooks/use-wallet-currency-balances'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useProjects } from '@/hooks/use-projects'
import { MonthlyFlowChart } from '@/components/charts/MonthlyFlowChart'
import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart'
import { WalletCurrencyBalanceTable } from '@/components/charts/WalletCurrencyBalanceTable'
import { MiniTrendChart } from '@/components/charts/MiniTrendChart'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'wouter'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { motion } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'

export default function FinancesDashboard() {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id
  
  // Get organization currencies to determine default currency
  const { data: organizationCurrencies } = useOrganizationCurrencies(organizationId)
  const defaultCurrency = organizationCurrencies?.find(c => c.is_default)?.currency
  
  // Get projects for filter
  const { data: projects = [] } = useProjects(organizationId)
  
  // Time period filter state
  const [timePeriod, setTimePeriod] = useState('desde-siempre')
  // Currency view state for ActionBar button - initialize with default currency
  const [currencyView, setCurrencyView] = useState<string>(defaultCurrency?.code || 'ARS')
  // Project filter state
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  
  // Initialize selected project with current project
  useEffect(() => {
    if (projectId && !selectedProjectId) {
      setSelectedProjectId(projectId)
    }
  }, [projectId, selectedProjectId])

  // Currency options for Selector - dynamic based on organization's default currency
  const currencyOptions = [
    { value: defaultCurrency?.code || 'ARS', label: defaultCurrency?.name || 'Peso Argentino' },
    { value: 'USD', label: 'Dólar Estadounidense' }
  ]

  // Exchange rate - hardcoded for now, should come from API
  const USD_TO_ARS_RATE = 1200 // Example rate

  // Convert amounts based on currency view
  const convertAmount = (amount: number, currency: string = currencyView) => {
    if (currency === 'USD') {
      return amount / USD_TO_ARS_RATE
    }
    return amount
  }

  // Use selected project for data queries, or empty string for all projects
  const effectiveProjectId = selectedProjectId === 'all' ? '' : selectedProjectId || projectId
  
  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary(organizationId, effectiveProjectId, timePeriod)
  const { data: monthlyFlow, isLoading: flowLoading } = useMonthlyFlowData(organizationId, effectiveProjectId, timePeriod)
  const { data: walletBalances, isLoading: walletsLoading } = useWalletBalances(organizationId, effectiveProjectId, timePeriod)
  const { data: walletCurrencyBalances, isLoading: walletCurrencyLoading } = useWalletCurrencyBalances(organizationId, effectiveProjectId, timePeriod)
  const { data: recentMovements, isLoading: recentLoading } = useRecentMovements(organizationId, effectiveProjectId, 5, timePeriod)
  const { data: expensesByCategory, isLoading: categoriesLoading } = useExpensesByCategory(organizationId, effectiveProjectId, timePeriod)
  
  // Generate mini trend data from monthly flow for each metric (converted to selected currency)
  const incomeTrend = monthlyFlow?.map(month => ({ value: convertAmount(month.income || 0) })) || []
  const expensesTrend = monthlyFlow?.map(month => ({ value: convertAmount(Math.abs(month.expenses || 0)) })) || []
  const balanceTrend = monthlyFlow?.map(month => ({ value: convertAmount(month.net || 0) })) || []
  const movementsTrend = monthlyFlow?.map(month => ({ value: convertAmount((month.income || 0) + Math.abs(month.expenses || 0)) })) || []

  // Prepare data for filters
  const availableProjects = useMemo(() => {
    const projectOptions = projects.map(project => project.name)
    return ['Todos los Proyectos', ...projectOptions]
  }, [projects])

  // Update currency view when default currency changes
  useEffect(() => {
    if (defaultCurrency && currencyView !== defaultCurrency.code) {
      setCurrencyView(defaultCurrency.code)
    }
  }, [defaultCurrency])
  
  // Calculate movements from last 30 days
  const movementsLast30Days = financialSummary ? 
    (financialSummary.totalIncome || 0) + Math.abs(financialSummary.totalExpenses || 0) : 0

  const headerProps = {
    title: "Resumen de Finanzas",
    showSearch: false,
    showFilters: false,
  }

  // Features for ActionBar
  const features = [
    {
      title: "Resumen Financiero Integral",
      description: "Visualiza un panorama completo de ingresos, egresos y balance neto de tu proyecto en tiempo real."
    },
    {
      title: "Análisis por Billeteras",
      description: "Monitorea el estado de cada billetera con balances actualizados y distribución de fondos."
    },
    {
      title: "Multi-moneda y Conversión",
      description: "Maneja múltiples monedas con conversión automática y visualización pesificada o dolarizada."
    },
    {
      title: "Tendencias Temporales",
      description: "Analiza la evolución de tus finanzas con gráficos de flujo mensual y mini tendencias."
    }
  ]

  const formatCurrency = (amount: number, currency: string = currencyView) => {
    if (currency === 'USD') {
      const dollarAmount = amount / USD_TO_ARS_RATE
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(dollarAmount)
    } else {
      // Use the default currency for formatting
      const defaultCurrencyCode = defaultCurrency?.code || 'ARS'
      const locale = defaultCurrencyCode === 'ARS' ? 'es-AR' : 'es-ES'
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: defaultCurrencyCode,
        minimumFractionDigits: 0
      }).format(amount)
    }
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
      {currencyView === 'USD' ? 'USD' : (defaultCurrency?.code || 'ARS')}
    </Badge>
  )

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return { color: 'var(--chart-positive)' }
    if (balance < 0) return { color: 'var(--chart-negative)' }
    return { color: 'var(--chart-neutral)' }
  }

  const currentOrganization = userData?.organization;
  const currentProject = userData?.organizations?.[0]?.projects?.[0];



  return (
    <Layout headerProps={{ title: "Resumen Financiero" }} wide={true}>
        {/* Show empty state if no movements exist */}
        {!summaryLoading && (!financialSummary || financialSummary.totalMovements === 0) ? (
          <EmptyState 
            description="Comienza registrando tu primer ingreso o egreso para ver el resumen completo de tus finanzas."
          />
        ) : (
          <>
        {/* FILA 1: 3 columnas - Balances por Billetera y Moneda / Este Mes / Movimientos Recientes */}
          {/* Balances por Billetera y Moneda */}
          <Card>
            <CardHeader>
                <div>
                    Balances por Billetera y Moneda
                  </CardTitle>
                    Resumen detallado de saldos
                  </p>
                </div>
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
                <div>
                    Este Mes
                  </CardTitle>
                    {format(new Date(), 'MMMM yyyy', { locale: es })}
                  </p>
                </div>
                {getCurrencyBadge()}
              </div>
            </CardHeader>
            <CardContent>
                    {summaryLoading ? '...' : formatCurrency(financialSummary?.thisMonthIncome || 0)}
                  </span>
                </div>
                    {summaryLoading ? '...' : formatCurrency(financialSummary?.thisMonthExpenses || 0)}
                  </span>
                </div>
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
                Movimientos Recientes
              </CardTitle>
                Últimos 5 movimientos registrados
              </p>
            </CardHeader>
            <CardContent>
              {recentMovements && recentMovements.length > 0 ? (
                  {recentMovements.slice(0, 5).map((movement, index) => (
                        <div>
                            {movement.description || 'Sin descripción'}
                          </p>
                            {movement.movement_date && format(new Date(movement.movement_date), 'dd/MM', { locale: es })}
                          </p>
                        </div>
                      </div>
                        {formatMovementAmount(movement)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                    No hay movimientos registrados
                  </p>
                  <Link 
                    href="/finances/movements"
                  >
                    Crear Primer Movimiento
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FILA 2: 4 columnas - 3 KPIs apilados + Gráfico de Flujo Financiero */}
          {/* Columna 1: 3 KPIs apilados */}
            {/* Income Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
                  {/* Mini Chart */}
                    <MiniTrendChart 
                      data={incomeTrend} 
                      color="var(--chart-positive)" 
                      isLoading={flowLoading} 
                    />
                  </div>
                  
                  {/* Spacer to push content down */}
                  
                  {/* Icon and Title Section - positioned lower */}
                        Ingresos Totales
                      </span>
                    </div>
                    {getCurrencyBadge()}
                  </div>
                  
                  {/* Amount - smaller size like reference */}
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
                  {/* Mini Chart */}
                    <MiniTrendChart 
                      data={expensesTrend} 
                      color="var(--chart-negative)" 
                      isLoading={flowLoading} 
                    />
                  </div>
                  
                  {/* Spacer to push content down */}
                  
                  {/* Icon and Title Section - positioned lower */}
                        Egresos Totales
                      </span>
                    </div>
                    {getCurrencyBadge()}
                  </div>
                  
                  {/* Amount - smaller size like reference */}
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
                  {/* Mini Chart */}
                    <MiniTrendChart 
                      data={balanceTrend} 
                      color="var(--chart-neutral)" 
                      isLoading={flowLoading} 
                    />
                  </div>
                  
                  {/* Spacer to push content down */}
                  
                  {/* Icon and Title Section - positioned lower */}
                        Balance Neto
                      </span>
                    </div>
                    {getCurrencyBadge()}
                  </div>
                  
                  {/* Amount - smaller size like reference */}
                    {summaryLoading ? '...' : formatCurrency(financialSummary?.balance || 0)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Columnas 2-4: Gráfico de Flujo Financiero Mensual */}
              <CardHeader>
                  <div>
                      Flujo Financiero Mensual
                    </CardTitle>
                      Ingresos, egresos y flujo neto del período seleccionado
                    </p>
                  </div>
                  {getCurrencyBadge()}
                </div>
              </CardHeader>
                <MonthlyFlowChart 
                  data={monthlyFlow?.map(month => ({
                    ...month,
                    income: convertAmount(month.income || 0),
                    expenses: convertAmount(month.expenses || 0),
                    net: convertAmount(month.net || 0)
                  })) || []} 
                  isLoading={flowLoading} 
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Layout - Cards apiladas verticalmente */}
          {/* Métricas - Mobile */}
            {/* Card de Ingresos */}
                {/* Mini Chart */}
                  <MiniTrendChart 
                    data={incomeTrend} 
                    color="var(--chart-positive)" 
                    isLoading={flowLoading} 
                  />
                </div>
                
                {/* Spacer to push content down */}
                
                {/* Icon and Title Section - positioned lower */}
                    Ingresos
                  </span>
                </div>
                
                {/* Amount - smaller size like reference */}
                  {summaryLoading ? '...' : formatCurrency(financialSummary?.totalIncome || 0)}
                </div>
              </CardContent>
            </Card>
            
            {/* Card de Egresos */}
                {/* Mini Chart */}
                  <MiniTrendChart 
                    data={expensesTrend} 
                    color="var(--chart-negative)" 
                    isLoading={flowLoading} 
                  />
                </div>
                
                {/* Spacer to push content down */}
                
                {/* Icon and Title Section - positioned lower */}
                    Egresos
                  </span>
                </div>
                
                {/* Amount - smaller size like reference */}
                  {summaryLoading ? '...' : formatCurrency(financialSummary?.totalExpenses || 0)}
                </div>
              </CardContent>
            </Card>
            
            {/* Card de Balance */}
                {/* Mini Chart */}
                  <MiniTrendChart 
                    data={balanceTrend} 
                    color="var(--chart-neutral)" 
                    isLoading={flowLoading} 
                  />
                </div>
                
                {/* Spacer to push content down */}
                
                {/* Icon and Title Section - positioned lower */}
                    Balance General
                  </span>
                </div>
                
                {/* Amount - smaller size like reference */}
                  {summaryLoading ? '...' : formatCurrency(financialSummary?.balance || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flujo Financiero Mensual - Mobile */}
          <Card>
            <CardHeader>
                Flujo Financiero
              </CardTitle>
                Ingresos, egresos y flujo neto del período seleccionado
              </p>
            </CardHeader>
              <MonthlyFlowChart data={monthlyFlow || []} isLoading={flowLoading} />
            </CardContent>
          </Card>

          {/* Egresos por Categoría - Mobile */}
          <Card>
            <CardHeader>
                Egresos por Categoría
              </CardTitle>
                Distribución de gastos por tipo de categoría
              </p>
            </CardHeader>
              <ExpensesByCategoryChart data={expensesByCategory || []} isLoading={categoriesLoading} />
            </CardContent>
          </Card>

          {/* Este Mes - Mobile */}
          <Card>
            <CardHeader>
                Este Mes
              </CardTitle>
                {format(new Date(), 'MMMM yyyy', { locale: es })}
              </p>
            </CardHeader>
            <CardContent>
                    {summaryLoading ? '...' : formatCurrency(financialSummary?.thisMonthIncome || 0)}
                  </span>
                </div>
                    {summaryLoading ? '...' : formatCurrency(financialSummary?.thisMonthExpenses || 0)}
                  </span>
                </div>
                      {summaryLoading ? '...' : formatCurrency(financialSummary?.thisMonthBalance || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movimientos Recientes - Mobile */}
          <Card>
            <CardHeader>
                Movimientos Recientes
              </CardTitle>
                Últimos 5 movimientos registrados
              </p>
            </CardHeader>
            <CardContent>
              {recentMovements && recentMovements.length > 0 ? (
                  {recentMovements.slice(0, 5).map((movement, index) => (
                        <div>
                            {movement.description || 'Sin descripción'}
                          </p>
                            {movement.movement_date && format(new Date(movement.movement_date), 'dd/MM', { locale: es })}
                          </p>
                        </div>
                      </div>
                        {formatCurrency(movement.amount || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                    No hay movimientos registrados
                  </p>
                  <Link 
                    href="/finances/movements"
                  >
                    Crear Primer Movimiento
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </>
        )}
      </div>
    </Layout>
  )
}