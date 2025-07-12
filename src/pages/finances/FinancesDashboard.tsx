import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, TrendingUp, TrendingDown, FileText, Calendar, CreditCard, User, ArrowUpDown, Plus, Building, Wallet, Clock } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useFinancialSummary, useMonthlyFlowData, useWalletBalances, useRecentMovements } from '@/hooks/use-finance-dashboard-simple'
import { MonthlyFlowChart } from '@/components/graphics/MonthlyFlowChart'
import { WalletBalanceChart } from '@/components/graphics/WalletBalanceChart'
import { MiniTrendChart } from '@/components/graphics/MiniTrendChart'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'wouter'
import { CustomEmptyState } from '@/components/ui-custom/CustomEmptyState'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary(organizationId, projectId, timePeriod)
  const { data: monthlyFlow, isLoading: flowLoading } = useMonthlyFlowData(organizationId, projectId, timePeriod)
  const { data: walletBalances, isLoading: walletsLoading } = useWalletBalances(organizationId, projectId, timePeriod)
  const { data: recentMovements, isLoading: recentLoading } = useRecentMovements(organizationId, projectId, 5, timePeriod)
  
  // Generate mini trend data from monthly flow for each metric
  const incomeTrend = monthlyFlow?.map(month => ({ value: month.income || 0 })) || []
  const expensesTrend = monthlyFlow?.map(month => ({ value: Math.abs(month.expenses || 0) })) || []
  const balanceTrend = monthlyFlow?.map(month => ({ value: month.net || 0 })) || []
  
  // Calculate movements from last 30 days
  const movementsLast30Days = financialSummary ? 
    (financialSummary.totalIncome || 0) + Math.abs(financialSummary.totalExpenses || 0) : 0

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
    if (balance > 0) return { color: 'var(--chart-positive)' }
    if (balance < 0) return { color: 'var(--chart-negative)' }
    return { color: 'var(--chart-neutral)' }
  }

  // Show empty state if no movements exist
  if (!summaryLoading && (!financialSummary || financialSummary.totalMovements === 0)) {
    return (
      <Layout headerProps={headerProps}>
        <CustomEmptyState 
          icon={<DollarSign className="h-12 w-12" />}
          title="Sin movimientos financieros registrados"
          description="Comienza registrando tu primer ingreso o egreso para ver el resumen completo de tus finanzas."
          action={
            <Link href="/finances/movements">
              <Button className="h-8 px-3 text-sm">
                <Plus className="h-3 w-3 mr-1" />
                Crear Primer Movimiento
              </Button>
            </Link>
          }
        />
      </Layout>
    )
  }

  const currentOrganization = userData?.organization;
  const currentProject = userData?.project;

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Header Row - Welcome Card (75%) + Movements Card (25%) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Welcome Card - Financial Summary (75% width) */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent className="p-4 md:p-6">
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
                        
                        {/* Desktop: selector inline */}
                        <Select value={timePeriod} onValueChange={setTimePeriod}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desde-siempre">Desde siempre</SelectItem>
                            <SelectItem value="año">Año</SelectItem>
                            <SelectItem value="semestre">Semestre</SelectItem>
                            <SelectItem value="trimestre">Trimestre</SelectItem>
                            <SelectItem value="mes">Mes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-lg text-muted-foreground mb-3">
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
                </div>

                {/* Mobile: Stats info below icon and title */}
                <div className="md:hidden mt-4 space-y-2">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                      {summaryLoading ? '...' : (financialSummary?.totalMovements || 0)} movimientos registrados
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm" style={{ color: 'var(--chart-positive)' }}>
                      {summaryLoading ? '...' : formatCurrency(financialSummary?.totalIncome || 0)} ingresos
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm" style={{ color: 'var(--chart-negative)' }}>
                      {summaryLoading ? '...' : formatCurrency(financialSummary?.totalExpenses || 0)} egresos
                    </span>
                  </div>
                </div>

                {/* Mobile: Period selector at bottom - full width */}
                <div className="md:hidden mt-4">
                  <Select value={timePeriod} onValueChange={setTimePeriod}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desde-siempre">Desde siempre</SelectItem>
                      <SelectItem value="año">Año</SelectItem>
                      <SelectItem value="semestre">Semestre</SelectItem>
                      <SelectItem value="trimestre">Trimestre</SelectItem>
                      <SelectItem value="mes">Mes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Desktop: Stats info inline */}
                <div className="hidden md:block">
                  <div className="flex flex-row items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>
                        {summaryLoading ? '...' : (financialSummary?.totalMovements || 0)} movimientos registrados
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span style={{ color: 'var(--chart-positive)' }}>
                        {summaryLoading ? '...' : formatCurrency(financialSummary?.totalIncome || 0)} ingresos
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-4 w-4" />
                      <span style={{ color: 'var(--chart-negative)' }}>
                        {summaryLoading ? '...' : formatCurrency(financialSummary?.totalExpenses || 0)} egresos
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Movements Summary Card (25% width) */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full relative overflow-hidden">
              <CardContent className="p-4 h-full flex flex-col">
                {/* Accent Line at top */}
                <div className="w-full h-1 bg-[var(--accent)] rounded-full mb-6"></div>
                
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

        {/* Segunda Fila: Métricas en columna + Gráficos */}
        <div className="hidden md:grid grid-cols-3 gap-4 lg:gap-6">
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

          {/* Gráfico de Flujo Financiero */}
          <Card className="lg:col-span-2">
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


        </div>

        {/* Métricas Principales - Mobile (Una columna) */}
        <div className="md:hidden grid grid-cols-1 gap-4">
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
                  Ingresos Totales
                </span>
              </div>
              
              {/* Amount - smaller size like reference */}
              <div className="text-lg font-bold" style={{ color: 'var(--chart-positive)' }}>
                {summaryLoading ? '...' : formatCurrency(financialSummary?.totalIncome || 0)}
              </div>
            </CardContent>
          </Card>

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
                  Egresos Totales
                </span>
              </div>
              
              {/* Amount - smaller size like reference */}
              <div className="text-lg font-bold" style={{ color: 'var(--chart-negative)' }}>
                {summaryLoading ? '...' : formatCurrency(financialSummary?.totalExpenses || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
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



        {/* Tercera fila: Este Mes + Balance por Billetera + Movimientos Recientes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
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

          {/* Balance por Billetera */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Balance por Billetera
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribución de balances entre billeteras activas
              </p>
            </CardHeader>
            <CardContent>
              <WalletBalanceChart data={walletBalances || []} isLoading={walletsLoading} />
            </CardContent>
          </Card>

          {/* Movimientos Recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Movimientos Recientes
              </CardTitle>
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
                          <div className="p-1 rounded" style={{ 
                            backgroundColor: isIncome ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                            color: isIncome ? 'var(--chart-positive)' : 'var(--chart-negative)' 
                          }}>
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
                        <div className="text-sm font-medium" style={{ color: isIncome ? 'var(--chart-positive)' : 'var(--chart-negative)' }}>
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

        {/* Balances Detallados */}
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
            {walletsLoading ? (
              <div className="text-sm text-muted-foreground">Cargando balances...</div>
            ) : walletBalances && walletBalances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Billetera</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Moneda</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Balance</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletBalances.map((walletBalance: any, index: number) => {
                      const balance = walletBalance.balance || 0;
                      const isPositive = balance > 0;
                      const isNegative = balance < 0;
                      
                      return (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{walletBalance.wallet}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-muted-foreground">ARS</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-medium text-sm" style={getBalanceColor(balance)}>
                              {formatCurrency(Math.abs(balance))}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end">
                              {isPositive && (
                                <div className="flex items-center space-x-1" style={{ color: 'var(--chart-positive)' }}>
                                  <TrendingUp className="h-3 w-3" />
                                  <span className="text-xs font-medium">Positivo</span>
                                </div>
                              )}
                              {isNegative && (
                                <div className="flex items-center space-x-1" style={{ color: 'var(--chart-negative)' }}>
                                  <TrendingDown className="h-3 w-3" />
                                  <span className="text-xs font-medium">Negativo</span>
                                </div>
                              )}
                              {balance === 0 && (
                                <span className="text-xs font-medium" style={{ color: 'var(--chart-neutral)' }}>Neutral</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  No hay balances para mostrar
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