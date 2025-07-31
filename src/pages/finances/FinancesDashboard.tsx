import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, TrendingDown, FileText, Calendar, ArrowUpDown, Wallet } from 'lucide-react'
import { ActionBarDesktopRow } from '@/components/layout/desktop/ActionBarDesktopRow'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
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
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Resumen Financiero Integral",
      description: "Visualiza un panorama completo de ingresos, egresos y balance neto de tu proyecto en tiempo real."
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Análisis por Billeteras",
      description: "Monitorea el estado de cada billetera con balances actualizados y distribución de fondos."
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Multi-moneda y Conversión",
      description: "Maneja múltiples monedas con conversión automática y visualización pesificada o dolarizada."
    },
    {
      icon: <Calendar className="w-6 h-6" />,
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
    <Badge variant="secondary" className="text-xs">
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
      <FeatureIntroduction
        title="Resumen Financiero"
        features={features}
        className="md:hidden"
      />
      
      <div className="space-y-6">
        <ActionBarDesktopRow
          // Use Type filter for currency view
          filterByType={currencyOptions.find(opt => opt.value === currencyView)?.label || 'Peso Argentino'}
          setFilterByType={(label) => {
            const option = currencyOptions.find(opt => opt.label === label)
            if (option) {
              setCurrencyView(option.value)
            }
          }}
          availableTypes={currencyOptions.map(opt => opt.label)}
          
          // Use Category filter for time period
          filterByCategory={timePeriod === 'desde-siempre' ? 'Desde Siempre' : 
                           timePeriod === 'este-mes' ? 'Este Mes' :
                           timePeriod === 'ultimos-30-dias' ? 'Últimos 30 Días' :
                           timePeriod === 'ultimos-90-dias' ? 'Últimos 90 Días' : 'Desde Siempre'}
          setFilterByCategory={(label) => {
            const mapping: { [key: string]: string } = {
              'Desde Siempre': 'desde-siempre',
              'Este Mes': 'este-mes',
              'Últimos 30 Días': 'ultimos-30-dias',
              'Últimos 90 Días': 'ultimos-90-dias'
            }
            setTimePeriod(mapping[label] || 'desde-siempre')
          }}
          availableCategories={['Desde Siempre', 'Este Mes', 'Últimos 30 Días', 'Últimos 90 Días']}
          
          // Use Favorites filter for project selection
          filterByFavorites={selectedProjectId === 'all' ? 'Todos los Proyectos' : (projects.find(p => p.id === selectedProjectId)?.name || 'Todos los Proyectos')}
          setFilterByFavorites={(projectName) => {
            if (projectName === 'Todos los Proyectos') {
              setSelectedProjectId('all')
            } else {
              const project = projects.find(p => p.name === projectName)
              if (project) {
                setSelectedProjectId(project.id)
              }
            }
          }}
          availableFavorites={availableProjects}
          
          // Dummy props to satisfy the interface
          filterByCurrency="all"
          setFilterByCurrency={() => {}}
          availableCurrencies={[]}
          filterByWallet="all"
          setFilterByWallet={() => {}}
          availableWallets={[]}
          
          // Action buttons
          onImportClick={() => {
            console.log('Import action for dashboard')
          }}
          onNewMovementClick={() => {
            console.log('Navigate to new movement')
          }}
        />

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
                      data={incomeTrend} 
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
                      data={expensesTrend} 
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
                      data={balanceTrend} 
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
        <div className="md:hidden space-y-4">
          {/* Métricas - Mobile */}
          <div className="grid grid-cols-2 gap-4">
            {/* Card de Ingresos */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-4 h-full flex flex-col">
                {/* Mini Chart */}
                <div className="mb-4">
                  <MiniTrendChart 
                    data={incomeTrend} 
                    color="var(--chart-positive)" 
                    isLoading={flowLoading} 
                  />
                </div>
                
                {/* Spacer to push content down */}
                <div className="flex-1"></div>
                
                {/* Icon and Title Section - positioned lower */}
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4" style={{ color: 'var(--chart-positive)' }} />
                  <span className="text-sm text-muted-foreground">
                    Ingresos
                  </span>
                </div>
                
                {/* Amount - smaller size like reference */}
                <div className="text-lg font-bold" style={{ color: 'var(--chart-positive)' }}>
                  {summaryLoading ? '...' : formatCurrency(financialSummary?.totalIncome || 0)}
                </div>
              </CardContent>
            </Card>
            
            {/* Card de Egresos */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-4 h-full flex flex-col">
                {/* Mini Chart */}
                <div className="mb-4">
                  <MiniTrendChart 
                    data={expensesTrend} 
                    color="var(--chart-negative)" 
                    isLoading={flowLoading} 
                  />
                </div>
                
                {/* Spacer to push content down */}
                <div className="flex-1"></div>
                
                {/* Icon and Title Section - positioned lower */}
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4" style={{ color: 'var(--chart-negative)' }} />
                  <span className="text-sm text-muted-foreground">
                    Egresos
                  </span>
                </div>
                
                {/* Amount - smaller size like reference */}
                <div className="text-lg font-bold" style={{ color: 'var(--chart-negative)' }}>
                  {summaryLoading ? '...' : formatCurrency(financialSummary?.totalExpenses || 0)}
                </div>
              </CardContent>
            </Card>
            
            {/* Card de Balance */}
            <Card className="col-span-2 relative overflow-hidden">
              <CardContent className="p-4 h-full flex flex-col">
                {/* Mini Chart */}
                <div className="mb-4">
                  <MiniTrendChart 
                    data={balanceTrend} 
                    color="var(--chart-neutral)" 
                    isLoading={flowLoading} 
                  />
                </div>
                
                {/* Spacer to push content down */}
                <div className="flex-1"></div>
                
                {/* Icon and Title Section - positioned lower */}
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--chart-neutral)' }} />
                  <span className="text-sm text-muted-foreground">
                    Balance General
                  </span>
                </div>
                
                {/* Amount - smaller size like reference */}
                <div className="text-lg font-bold" style={getBalanceColor(financialSummary?.balance || 0)}>
                  {summaryLoading ? '...' : formatCurrency(financialSummary?.balance || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flujo Financiero Mensual - Mobile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Flujo Financiero
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ingresos, egresos y flujo neto del período seleccionado
              </p>
            </CardHeader>
            <CardContent className="pb-2">
              <MonthlyFlowChart data={monthlyFlow || []} isLoading={flowLoading} />
            </CardContent>
          </Card>

          {/* Egresos por Categoría - Mobile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Egresos por Categoría
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribución de gastos por tipo de categoría
              </p>
            </CardHeader>
            <CardContent className="pb-2">
              <ExpensesByCategoryChart data={expensesByCategory || []} isLoading={categoriesLoading} />
            </CardContent>
          </Card>

          {/* Este Mes - Mobile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Este Mes
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'MMMM yyyy', { locale: es })}
              </p>
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

          {/* Movimientos Recientes - Mobile */}
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
                        {formatCurrency(movement.amount || 0)}
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
        </>
        )}
      </div>
    </Layout>
  )
}