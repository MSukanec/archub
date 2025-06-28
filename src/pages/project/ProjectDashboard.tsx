import { useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useBudgets } from '@/hooks/use-budgets'
import { useMovements } from '@/hooks/use-movements'
import { useNavigationStore } from '@/stores/navigationStore'
import { 
  Folder, 
  Calendar, 
  User, 
  Building, 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Target,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Construction,
  FileText,
  Settings
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useLocation } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export default function ProjectDashboard() {
  const { data: userData, isLoading } = useCurrentUser()
  const { data: projects = [], isLoading: projectsLoading } = useProjects(userData?.organization?.id)
  const { setSidebarContext } = useNavigationStore()
  const [, navigate] = useLocation()

  const currentProject = projects.find(p => p.id === userData?.preferences?.last_project_id)
  const { data: budgets = [] } = useBudgets(currentProject?.id)
  const { data: movements = [] } = useMovements(userData?.organization?.id, currentProject?.id)

  // Fetch project statistics
  const { data: projectStats } = useQuery({
    queryKey: ['project-stats', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id || !supabase) return null

      // Get site logs count
      const { count: siteLogsCount } = await supabase
        .from('site_logs')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', currentProject.id)

      // Get budget tasks progress
      const { data: budgetTasks } = await supabase
        .from('budget_tasks')
        .select('*')
        .in('budget_id', budgets.map(b => b.id))

      // Get recent site logs
      const { data: recentSiteLogs } = await supabase
        .from('site_logs')
        .select(`
          *,
          site_log_entry_types(name),
          organization_members(
            users(full_name)
          )
        `)
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false })
        .limit(5)

      return {
        siteLogsCount: siteLogsCount || 0,
        budgetTasksCount: budgetTasks?.length || 0,
        recentSiteLogs: recentSiteLogs || []
      }
    },
    enabled: !!currentProject?.id && !!supabase && budgets.length > 0
  })

  // Ensure we're in project sidebar context when this page loads
  useEffect(() => {
    setSidebarContext('project')
  }, [setSidebarContext])

  const headerProps = {
    title: "Dashboard del Proyecto",
    showSearch: false,
    showFilters: false
  }

  if (isLoading || projectsLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          Cargando dashboard del proyecto...
        </div>
      </Layout>
    )
  }

  if (!currentProject) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          <Folder className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-sm font-medium mb-1">No hay proyecto seleccionado</h3>
          <p className="text-xs">Selecciona un proyecto para ver el dashboard</p>
        </div>
      </Layout>
    )
  }

  // Calculate financial metrics
  const totalIncome = movements
    .filter(m => m.amount > 0)
    .reduce((sum, m) => sum + m.amount, 0)

  const totalExpenses = movements
    .filter(m => m.amount < 0)
    .reduce((sum, m) => sum + Math.abs(m.amount), 0)

  const netBalance = totalIncome - totalExpenses

  const totalBudgetAmount = budgets.reduce((sum, budget) => {
    // This would need budget tasks calculation in a real scenario
    return sum + 0 // Placeholder for now
  }, 0)

  // Calculate project progress (simplified)
  const projectProgress = Math.min((projectStats?.siteLogsCount || 0) * 2, 100)

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Project Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 text-white p-3 rounded-lg">
                <Building className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {currentProject.name}
                  </h1>
                  <Badge 
                    variant={currentProject.status === 'active' ? 'default' : 'secondary'}
                    className="text-sm px-3 py-1"
                  >
                    {currentProject.status === 'active' ? 'Activo' : 
                     currentProject.status === 'planning' ? 'Planificación' : 
                     currentProject.status === 'completed' ? 'Completado' : 
                     currentProject.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Iniciado el {format(new Date(currentProject.created_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                  {currentProject.project_data?.project_type?.name && (
                    <span className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      {currentProject.project_data.project_type.name}
                    </span>
                  )}
                  {currentProject.creator && (
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {currentProject.creator.full_name || currentProject.creator.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {projectProgress}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Progreso</div>
              <Progress value={projectProgress} className="w-32 mt-2" />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
                Ingresos Totales
              </CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                ${totalIncome.toLocaleString()}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                {movements.filter(m => m.amount > 0).length} movimientos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">
                Gastos Totales
              </CardTitle>
              <div className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg">
                <TrendingDown className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                ${totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                <ArrowDownRight className="h-3 w-3" />
                {movements.filter(m => m.amount < 0).length} movimientos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Balance Neto
              </CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                ${netBalance.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                <Target className="h-3 w-3" />
                {netBalance >= 0 ? 'Positivo' : 'Negativo'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Registros de Obra
              </CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-lg">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {projectStats?.siteLogsCount || 0}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Entradas de bitácora
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription>
                Accede rápidamente a las funciones más utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => {
                    setSidebarContext('construction')
                    navigate('/construction/budgets')
                  }}
                >
                  <Calculator className="h-6 w-6 text-blue-500" />
                  <span className="text-sm">Presupuestos</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => {
                    setSidebarContext('construction')
                    navigate('/construction/logs')
                  }}
                >
                  <Construction className="h-6 w-6 text-orange-500" />
                  <span className="text-sm">Bitácora</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => {
                    setSidebarContext('project')
                    navigate('/finance/movements')
                  }}
                >
                  <DollarSign className="h-6 w-6 text-green-500" />
                  <span className="text-sm">Finanzas</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => {
                    setSidebarContext('construction')
                    navigate('/construction/personnel')
                  }}
                >
                  <Users className="h-6 w-6 text-purple-500" />
                  <span className="text-sm">Personal</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Site Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Actividad Reciente
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSidebarContext('construction')
                    navigate('/construction/logs')
                  }}
                >
                  Ver todo
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectStats?.recentSiteLogs && projectStats.recentSiteLogs.length > 0 ? (
                  projectStats.recentSiteLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {log.site_log_entry_types?.name || 'Registro'}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(log.created_at), 'dd/MM', { locale: es })}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Por {log.organization_members?.users?.full_name || 'Usuario'}
                        </p>
                        {log.weather && (
                          <p className="text-xs text-muted-foreground">
                            Clima: {log.weather}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">No hay actividad reciente</p>
                    <p className="text-xs">Los registros de obra aparecerán aquí</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen del Proyecto</CardTitle>
            <CardDescription>
              Información detallada sobre el estado actual del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Presupuestos</span>
                </div>
                <div className="text-2xl font-bold">{budgets.length}</div>
                <p className="text-sm text-muted-foreground">
                  {budgets.filter(b => b.status === 'approved').length} aprobados
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Movimientos</span>
                </div>
                <div className="text-2xl font-bold">{movements.length}</div>
                <p className="text-sm text-muted-foreground">
                  {movements.filter(m => m.amount > 0).length} ingresos, {movements.filter(m => m.amount < 0).length} gastos
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Progreso</span>
                </div>
                <div className="text-2xl font-bold">{projectProgress}%</div>
                <p className="text-sm text-muted-foreground">
                  Basado en actividad registrada
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}