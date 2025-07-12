import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Plus } from 'lucide-react'
import { Link } from 'wouter'

import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CustomEmptyState } from '@/components/ui-custom/CustomEmptyState'

import { useCurrentUser } from '@/hooks/use-current-user'
import { useFinancialSummary, useMonthlyFlowData, useWalletBalances, useRecentMovements } from '@/hooks/use-finance-dashboard-simple'
import { useFinancialActivity } from '@/hooks/use-financial-activity'
import { useNavigationStore } from '@/stores/navigationStore'
import { useMobile } from '@/hooks/use-mobile'

import { FinancialStatsCards } from '@/components/ui-custom/cards/FinancialStatsCards'
import { FinancialActivityChart } from '@/components/ui-custom/charts/FinancialActivityChart'
import { MonthlyFlowChart } from '@/components/graphics/MonthlyFlowChart'
import { WalletBalanceChart } from '@/components/graphics/WalletBalanceChart'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function FinancesDashboard() {
  const { data: userData } = useCurrentUser()
  const { setSidebarContext } = useNavigationStore()
  const isMobile = useMobile()
  
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary(organizationId, projectId)
  const { data: activityData, isLoading: activityLoading } = useFinancialActivity(organizationId, projectId)
  const { data: monthlyFlow, isLoading: flowLoading } = useMonthlyFlowData(organizationId, projectId)
  const { data: walletBalances, isLoading: walletsLoading } = useWalletBalances(organizationId, projectId)
  const { data: recentMovements, isLoading: recentLoading } = useRecentMovements(organizationId, projectId, 5)

  // Set sidebar context
  useEffect(() => {
    setSidebarContext("finanzas")
  }, [setSidebarContext])

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

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Welcome Card with Dynamic Greeting - 3/4 width + Activity Chart - 1/4 width */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Welcome Card - 3 columns */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                  {/* Finance Icon */}
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 md:h-16 md:w-16 rounded-lg bg-[var(--accent)] bg-opacity-10 flex items-center justify-center border-2 border-[var(--accent)] border-opacity-20">
                      <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-[var(--accent)]" />
                    </div>
                  </div>

                  {/* Welcome Text */}
                  <div className="flex-1">
                    <motion.h1
                      className="text-2xl md:text-4xl font-black text-[var(--card-fg)] mb-1"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      Resumen de Finanzas
                    </motion.h1>
                    <p className="text-sm md:text-base text-[var(--muted-fg)] mb-4">
                      Resumen general de movimientos financieros y balances del proyecto
                    </p>

                    {/* Quick Stats in Welcome Card */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-xl md:text-2xl font-bold text-green-600">
                          {summaryLoading ? '...' : (financialSummary?.totalIncome || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-[var(--muted-fg)]">Ingresos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl md:text-2xl font-bold text-red-600">
                          {summaryLoading ? '...' : (financialSummary?.totalExpenses || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-[var(--muted-fg)]">Egresos</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xl md:text-2xl font-bold ${getBalanceColor(financialSummary?.balance || 0)}`}>
                          {summaryLoading ? '...' : (financialSummary?.balance || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-[var(--muted-fg)]">Balance</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl md:text-2xl font-bold text-[var(--accent)]">
                          {summaryLoading ? '...' : (financialSummary?.totalMovements || 0)}
                        </p>
                        <p className="text-xs text-[var(--muted-fg)]">Movimientos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Chart - 1 column */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <FinancialActivityChart data={activityData || []} isLoading={activityLoading} />
          </motion.div>
        </div>

        {/* This Month and Recent Movements - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Este Mes Card */}
          <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader>
              <CardTitle className="text-[var(--card-fg)]">Este Mes</CardTitle>
              <p className="text-sm text-[var(--muted-fg)]">
                Actividad financiera del mes actual
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[var(--card-fg)]">Ingresos del mes:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {summaryLoading ? '...' : `$${(financialSummary?.thisMonthIncome || 0).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[var(--card-fg)]">Egresos del mes:</span>
                  <span className="text-sm font-semibold text-red-600">
                    {summaryLoading ? '...' : `$${(financialSummary?.thisMonthExpenses || 0).toLocaleString()}`}
                  </span>
                </div>
                <div className="border-t border-[var(--card-border)] pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-[var(--card-fg)]">Balance del mes:</span>
                    <span className={`text-sm font-semibold ${getBalanceColor(financialSummary?.thisMonthBalance || 0)}`}>
                      {summaryLoading ? '...' : `$${(financialSummary?.thisMonthBalance || 0).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movimientos Recientes Card */}
          <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader>
              <CardTitle className="text-[var(--card-fg)]">Movimientos Recientes</CardTitle>
              <p className="text-sm text-[var(--muted-fg)]">
                Últimos 5 movimientos registrados
              </p>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                        <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
                      </div>
                      <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : recentMovements && recentMovements.length > 0 ? (
                <div className="space-y-3">
                  {recentMovements.slice(0, 5).map((movement: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--card-fg)] truncate">
                          {movement.description || 'Sin descripción'}
                        </p>
                        <p className="text-xs text-[var(--muted-fg)]">
                          {movement.movement_date ? format(new Date(movement.movement_date), 'dd/MM/yyyy', { locale: es }) : 'Sin fecha'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${movement.type === 'Ingresos' ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.type === 'Ingresos' ? '+' : '-'}${(movement.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <DollarSign className="h-8 w-8 text-[var(--muted-fg)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--muted-fg)]">No hay movimientos recientes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout: Stats on left, Charts on right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Financial Stats Cards */}
          <FinancialStatsCards 
            stats={financialSummary} 
            isLoading={summaryLoading} 
          />

          {/* Right Column: Charts */}
          <div className="space-y-6">
            {/* Monthly Flow Chart */}
            <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
              <CardHeader>
                <CardTitle className="text-[var(--card-fg)]">Flujo Financiero Mensual</CardTitle>
                <p className="text-sm text-[var(--muted-fg)]">
                  Comparativa de ingresos y egresos por mes
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {flowLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-pulse text-[var(--muted-fg)]">Cargando gráfico...</div>
                    </div>
                  ) : (
                    <MonthlyFlowChart data={monthlyFlow || []} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Wallet Balance Chart */}
            <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
              <CardHeader>
                <CardTitle className="text-[var(--card-fg)]">Balance por Billetera</CardTitle>
                <p className="text-sm text-[var(--muted-fg)]">
                  Distribución de fondos entre billeteras
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {walletsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-pulse text-[var(--muted-fg)]">Cargando gráfico...</div>
                    </div>
                  ) : (
                    <WalletBalanceChart data={walletBalances || []} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}