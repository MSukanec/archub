import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Building, 
  Users, 
  CheckSquare, 
  Clock, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  AlertTriangle,
  UserCheck,
  Activity,
  Target,
  BarChart3,
  FileText,
  Building2
} from 'lucide-react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActionBar } from '@/components/layout/desktop/ActionBar'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { useCurrentUser } from '@/hooks/use-current-user'

// Chart Components
import { TaskStatusChart } from '@/components/charts/construction/TaskStatusChart'
import { AttendanceChart } from '@/components/charts/construction/AttendanceChart'
import { PersonnelTypeChart } from '@/components/charts/construction/PersonnelTypeChart'
import { ProgressMetricsChart } from '@/components/charts/construction/ProgressMetricsChart'
import { ConstructionKPICard } from '@/components/charts/construction/ConstructionKPICard'

// Hooks
import { 
  useConstructionSummary, 
  useTaskStatusData, 
  useWeeklyAttendanceData, 
  usePersonnelTypeData
} from '@/hooks/use-construction-dashboard'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ConstructionDashboard() {
  const { setSidebarContext } = useNavigationStore()
  const { data: userData } = useCurrentUser()
  const [viewMode, setViewMode] = useState<'project' | 'all'>('project')

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [setSidebarContext])

  const projectId = viewMode === 'project' ? userData?.preferences?.last_project_id : undefined
  const organizationId = userData?.organization?.id

  // Fetch dashboard data
  const { data: summary, isLoading: summaryLoading } = useConstructionSummary(projectId, organizationId)
  const { data: taskStatus, isLoading: taskStatusLoading } = useTaskStatusData(projectId)
  const { data: attendanceData, isLoading: attendanceLoading } = useWeeklyAttendanceData(projectId)
  const { data: personnelTypes, isLoading: personnelLoading } = usePersonnelTypeData(projectId, organizationId)

  // Generate mock progress metrics data (could be replaced with real data)
  const progressMetrics = [
    { period: 'Sem 1', tasksCompleted: 5, attendanceRate: 85, budgetUtilization: 15 },
    { period: 'Sem 2', tasksCompleted: 12, attendanceRate: 92, budgetUtilization: 28 },
    { period: 'Sem 3', tasksCompleted: 18, attendanceRate: 88, budgetUtilization: 45 },
    { period: 'Sem 4', tasksCompleted: 25, attendanceRate: 90, budgetUtilization: 62 },
    { period: 'Sem 5', tasksCompleted: 32, attendanceRate: 87, budgetUtilization: 78 },
    { period: 'Sem 6', tasksCompleted: 38, attendanceRate: 93, budgetUtilization: 89 },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getCurrencyBadge = () => (
    <Badge variant="outline" className="text-xs">
      ARS
    </Badge>
  )

  // Check if we have any data at all
  const hasData = (summary?.totalPersonnel || 0) > 0 || (summary?.totalTasks || 0) > 0

  return (
    <Layout 
      wide
      headerProps={{
        title: "Resumen de Construcción"
      }}
    >
      <div>
        {/* ActionBar with view mode toggle */}
        <ActionBar>
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
                <Building2 className="w-4 h-4 mr-2" />
                Toda la Organización
              </Button>
            </div>
          </div>
        </ActionBar>

        {/* Show empty state if no data exists */}
        {!summaryLoading && !hasData ? (
          <EmptyState 
            icon={<Building className="h-12 w-12" />}
            title="Sin datos de construcción registrados"
            description="Comienza agregando personal y creando tareas para ver el resumen completo de tu proyecto de construcción."
          />
        ) : (
          <>
            {/* ROW 1: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
              <ConstructionKPICard
                title="Personal Activo"
                value={summary?.totalPersonnel || 0}
                subtitle="Total de trabajadores"
                icon={Users}
                loading={summaryLoading}
                color="primary"
              />
              
              <ConstructionKPICard
                title="Tareas Completadas"
                value={summary?.completedTasks || 0}
                subtitle={`de ${summary?.totalTasks || 0} totales`}
                icon={CheckSquare}
                loading={summaryLoading}
                color="success"
                change={summary?.totalTasks ? `${Math.round((summary.completedTasks / summary.totalTasks) * 100)}% completado` : undefined}
                changeType="positive"
              />
              
              <ConstructionKPICard
                title="Tareas Pendientes"
                value={summary?.activeTasks || 0}
                subtitle="En progreso + pendientes"
                icon={Clock}
                loading={summaryLoading}
                color="warning"
              />
              
              <ConstructionKPICard
                title="Asistencia del Mes"
                value={summary?.thisMonthAttendance || 0}
                subtitle={format(new Date(), 'MMMM', { locale: es })}
                icon={UserCheck}
                loading={summaryLoading}
                color="secondary"
                change={summary?.averageDailyAttendance ? `${summary.averageDailyAttendance} promedio diario` : undefined}
              />
            </div>

            {/* ROW 2: Charts - Task Status & Weekly Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
              {/* Task Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Estado de Tareas
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Distribución por estado actual
                  </p>
                </CardHeader>
                <CardContent>
                  <TaskStatusChart 
                    data={taskStatus || []} 
                    isLoading={taskStatusLoading} 
                  />
                </CardContent>
              </Card>

              {/* Weekly Attendance Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Tendencia de Asistencia
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Últimas 8 semanas
                  </p>
                </CardHeader>
                <CardContent>
                  <AttendanceChart 
                    data={attendanceData || []} 
                    isLoading={attendanceLoading} 
                  />
                </CardContent>
              </Card>
            </div>

            {/* ROW 3: Personnel Distribution & Progress Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
              {/* Personnel by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Personal por Tipo
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Distribución de categorías
                  </p>
                </CardHeader>
                <CardContent>
                  <PersonnelTypeChart 
                    data={personnelTypes || []} 
                    isLoading={personnelLoading} 
                  />
                </CardContent>
              </Card>

              {/* Progress Metrics Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Métricas de Progreso
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Evolución semanal del proyecto
                  </p>
                </CardHeader>
                <CardContent>
                  <ProgressMetricsChart 
                    data={progressMetrics} 
                    isLoading={false} 
                  />
                </CardContent>
              </Card>
            </div>

            {/* ROW 4: Additional Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Budget Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Presupuestos
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Resumen financiero
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Presupuestado</span>
                      <span className="font-medium" style={{ color: 'var(--chart-1)' }}>
                        {summaryLoading ? '...' : formatCurrency(summary?.totalBudgetAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Presupuestos Activos</span>
                      <span className="font-medium">
                        {summaryLoading ? '...' : `${summary?.totalBudgets || 0} partidas`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alerts & Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alertas
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tareas que requieren atención
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tareas Vencidas</span>
                      <Badge 
                        variant={summary?.overdueTasks && summary.overdueTasks > 0 ? "destructive" : "secondary"}
                      >
                        {summaryLoading ? '...' : summary?.overdueTasks || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">En Progreso</span>
                      <Badge variant="outline">
                        {summaryLoading ? '...' : summary?.inProgressTasks || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Acciones Rápidas
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Gestión del proyecto
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Gestionar Personal
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Ver Tareas
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Cronograma
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}