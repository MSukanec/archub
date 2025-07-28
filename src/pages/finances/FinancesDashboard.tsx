import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, TrendingDown, FileText, Calendar, CreditCard, User, ArrowUpDown, Plus, Building, Wallet, Clock } from 'lucide-react'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useFinancialSummary, useMonthlyFlowData, useWalletBalances, useRecentMovements, useExpensesByCategory } from '@/hooks/use-finance-dashboard-simple'
import { useWalletCurrencyBalances } from '@/hooks/use-wallet-currency-balances'
import { MonthlyFlowChart } from '@/components/charts/MonthlyFlowChart'
import { WalletBalanceChart } from '@/components/charts/WalletBalanceChart'
import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart'
import { WalletCurrencyBalanceTable } from '@/components/charts/WalletCurrencyBalanceTable'
import { MiniTrendChart } from '@/components/charts/MiniTrendChart'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'wouter'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

// Function to get organization initials
const getOrganizationInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function FinancesDashboard() {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id
  
  // Time period filter state
  const [timePeriod, setTimePeriod] = useState('desde-siempre')
  // Currency view state for ActionBar button
  const [currencyView, setCurrencyView] = useState<'pesificado' | 'dolarizado'>('pesificado')

  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary(organizationId, projectId, timePeriod)
  const { data: monthlyFlow, isLoading: flowLoading } = useMonthlyFlowData(organizationId, projectId, timePeriod)
  const { data: walletBalances, isLoading: walletsLoading } = useWalletBalances(organizationId, projectId, timePeriod)
  const { data: walletCurrencyBalances, isLoading: walletCurrencyLoading } = useWalletCurrencyBalances(organizationId, projectId, timePeriod)
  const { data: recentMovements, isLoading: recentLoading } = useRecentMovements(organizationId, projectId, 5, timePeriod)
  const { data: expensesByCategory, isLoading: categoriesLoading } = useExpensesByCategory(organizationId, projectId, timePeriod)
  
  // Generate mini trend data from monthly flow for each metric
  const incomeTrend = monthlyFlow?.map(month => ({ value: month.income || 0 })) || []
  const expensesTrend = monthlyFlow?.map(month => ({ value: Math.abs(month.expenses || 0) })) || []
  const balanceTrend = monthlyFlow?.map(month => ({ value: month.net || 0 })) || []
  const movementsTrend = monthlyFlow?.map(month => ({ value: (month.income || 0) + Math.abs(month.expenses || 0) })) || []
  
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return { color: 'var(--chart-positive)' }
    if (balance < 0) return { color: 'var(--chart-negative)' }
    return { color: 'var(--chart-neutral)' }
  }

  // Show empty state if no movements exist
  if (!summaryLoading && (!financialSummary || financialSummary.totalMovements === 0)) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <EmptyState 
          icon={<DollarSign className="h-12 w-12" />}
          title="Sin movimientos financieros registrados"
          description="Comienza registrando tu primer ingreso o egreso para ver el resumen completo de tus finanzas."
        />
      </Layout>
    )
  }

  const currentOrganization = userData?.organization;
  const currentProject = userData?.organizations?.[0]?.projects?.[0];

  return (
    <Layout headerProps={{ title: "Resumen Financiero" }} wide={true}>
      <div className="space-y-4">
        <FeatureIntroduction
          title="Resumen Financiero"
          features={features}
          className="md:hidden"
        />

        <ActionBarDesktop
          title="Resumen Financiero"
          icon={<DollarSign className="w-5 h-5" />}
          features={features}
          showProjectSelector={true}
          customGhostButtons={[
            <Button
              key="currency-view"
              variant="ghost"
              onClick={() => {
                setCurrencyView(currencyView === 'pesificado' ? 'dolarizado' : 'pesificado')
              }}
              className="flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              {currencyView === 'pesificado' ? 'Pesificado' : 'Dolarizado'}
            </Button>,
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-32">
                <Clock className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desde-siempre">Todo</SelectItem>
                <SelectItem value="ultimo-mes">Último mes</SelectItem>
                <SelectItem value="ultimo-trimestre">Último trimestre</SelectItem>
                <SelectItem value="ultimo-año">Último año</SelectItem>
              </SelectContent>
            </Select>
          ]}
        />
      
        {/* 1 FILA: Card de TÍTULO (75%) + Card de MOVIMIENTOS (25%) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Welcome Card - Financial Summary (75% width) */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full">
              <CardContent className="p-4 md:p-6 h-full flex flex-col">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                  {/* Mobile Layout: Icon left, title right */}
                  <div className="flex md:hidden items-center gap-3 w-full">
                    {/* Financial Icon */}
                    <div className="flex-shrink-0">
                      <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarFallback className="text-sm font-bold text-[var(--accent-foreground)] bg-[var(--accent)]">
                          <DollarSign className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    {/* Title and organization info */}
                    <div className="flex-1">
                      <motion.h1
                        className="text-xl font-black text-foreground"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        Resumen de Finanzas
                      </motion.h1>
                      <p className="text-base text-muted-foreground">
                        {currentProject ? (
                          <>
                            Proyecto{" "}
                            <span className="font-semibold text-foreground">
                              {currentProject.name}
                            </span>
                          </>
                        ) : (
                          <>
                            Organización{" "}
                            <span className="font-semibold text-foreground">
                              {currentOrganization?.name || "Sin organización"}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Desktop Layout: Icon + info side by side */}
                  <div className="hidden md:flex items-start gap-6 w-full">
                    {/* Financial Icon */}
                    <div className="flex-shrink-0">
                      <Avatar className="h-16 w-16 border-2 border-border">
                        <AvatarFallback className="text-lg font-bold text-[var(--accent-foreground)] bg-[var(--accent)]">
                          <DollarSign className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Financial Summary Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <motion.h1
                          className="text-4xl font-black text-foreground"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          Resumen de Finanzas
                        </motion.h1>
                        
                        {/* Time Period Selector */}
                        <Select value={timePeriod} onValueChange={setTimePeriod}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desde-siempre">DESDE SIEMPRE</SelectItem>
                            <SelectItem value="este-mes">Este mes</SelectItem>
                            <SelectItem value="trimestre">Trimestre</SelectItem>
                            <SelectItem value="semestre">Semestre</SelectItem>
                            <SelectItem value="ano">Año</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <p className="text-xl text-muted-foreground">
                        {currentProject ? (
                          <>
                            Proyecto{" "}
                            <span className="font-semibold text-foreground">
                              {currentProject.name}
                            </span>
                          </>
                        ) : (
                          <>
                            Organización{" "}
                            <span className="font-semibold text-foreground">
                              {currentOrganization?.name || "Sin organización"}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Time Period Selector */}
                  <div className="flex md:hidden w-full">
                    <Select value={timePeriod} onValueChange={setTimePeriod}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desde-siempre">DESDE SIEMPRE</SelectItem>
                        <SelectItem value="este-mes">Este mes</SelectItem>
                        <SelectItem value="trimestre">Trimestre</SelectItem>
                        <SelectItem value="semestre">Semestre</SelectItem>
                        <SelectItem value="ano">Año</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Movements Card - Recent Activity (25% width) */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full relative overflow-hidden">
              <CardContent className="p-4 h-full flex flex-col">
                {/* Mini Chart */}
                <div className="mb-4">
                  <MiniTrendChart 
                    data={movementsTrend} 
                    color="var(--chart-neutral)" 
                    isLoading={summaryLoading} 
                  />
                </div>
                
                {/* Spacer to push content down */}
                <div className="flex-1"></div>
                
                {/* Icon and Title Section - positioned lower */}
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Movimientos (30 días)
                  </span>
                </div>
                
                {/* Amount - smaller size like reference */}
                <div className="text-lg font-bold text-foreground">
                  {summaryLoading ? '...' : formatCurrency(movementsLast30Days)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* 2 FILA: Balances por Billetera y Moneda (100% ancho) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Balances por Billetera y Moneda
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Resumen detallado de saldos organizados por billetera y moneda
            </p>
          </CardHeader>
          <CardContent>
            <WalletCurrencyBalanceTable data={walletCurrencyBalances || []} isLoading={walletCurrencyLoading} />
          </CardContent>
        </Card>

        {/* 3 FILA: Métricas (1 col) + Gráfico de Flujo Financiero (3 cols) */}
        <div className="hidden md:grid grid-cols-4 gap-4 lg:gap-6">
          {/* Columna de Métricas Verticales */}
          <div className="flex flex-col gap-4 lg:gap-6 h-full">
            {/* Card de Ingresos */}
            <Card className="flex-1 relative overflow-hidden">
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
                    Ingresos Totales
                  </span>
                </div>
                
                {/* Amount - smaller size like reference */}
                <div className="text-lg font-bold" style={{ color: 'var(--chart-positive)' }}>
                  {summaryLoading ? '...' : formatCurrency(financialSummary?.totalIncome || 0)}
                </div>
              </CardContent>
            </Card>
            
            {/* Card de Egresos */}
            <Card className="flex-1 relative overflow-hidden">
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
                    Egresos Totales
                  </span>
                </div>
                
                {/* Amount - smaller size like reference */}
                <div className="text-lg font-bold" style={{ color: 'var(--chart-negative)' }}>
                  {summaryLoading ? '...' : formatCurrency(financialSummary?.totalExpenses || 0)}
                </div>
              </CardContent>
            </Card>
            
            {/* Card de Balance */}
            <Card className="flex-1 relative overflow-hidden">
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

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Flujo Financiero Mensual
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ingresos, egresos y flujo neto del período seleccionado
              </p>
            </CardHeader>
            <CardContent className="pb-2">
              <MonthlyFlowChart data={monthlyFlow || []} isLoading={flowLoading} />
            </CardContent>
          </Card>
        </div>

        {/* 4 FILA: 3 cards - Egresos por Categoría, Este Mes, Movimientos Recientes */}
        <div className="hidden md:grid grid-cols-3 gap-4 lg:gap-6">
          {/* Gráfico de Egresos por Categoría */}
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

          {/* Este Mes */}
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
      </div>
    </Layout>
  )
}