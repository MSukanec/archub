import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Calendar,
  Target,
  Activity
} from 'lucide-react'
import { useProjectContext } from '@/stores/projectContext'
import { useConstructionTasks } from '@/hooks/use-construction-tasks'
import { useBudgetItems } from '@/hooks/use-budget-items'
import { useMovements } from '@/hooks/use-movements'
import { useDesignDocuments } from '@/hooks/use-design-documents'
import { useBudgets } from '@/hooks/use-budgets'
import { formatDateShort } from '@/lib/date-utils'
import { differenceInDays } from 'date-fns'

export default function ProjectDashboard() {
  const { selectedProjectId, currentOrganizationId } = useProjectContext()

  // Fetch data
  const { data: tasks = [], isLoading: tasksLoading } = useConstructionTasks(
    selectedProjectId || '', 
    currentOrganizationId || ''
  )
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets(selectedProjectId || '')
  const activeBudget = budgets.find(b => b.status === 'active' || b.status === 'approved')
  const { data: budgetItems = [], isLoading: budgetItemsLoading } = useBudgetItems(activeBudget?.id)
  const { data: movements = [], isLoading: movementsLoading } = useMovements(
    currentOrganizationId || undefined,
    selectedProjectId
  )
  const { data: documents = [], isLoading: documentsLoading } = useDesignDocuments()

  // Empty state if no project selected
  if (!selectedProjectId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8"
      >
        <div 
          className="rounded-lg p-8 text-center border"
          style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--card-border)',
            color: 'var(--card-text)'
          }}
        >
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Selecciona un Proyecto</h3>
          <p className="text-sm text-muted-foreground">
            Selecciona un proyecto desde el menú superior para ver su dashboard completo.
          </p>
        </div>
      </motion.div>
    )
  }

  // Calculate metrics
  const totalProgress = tasks.length > 0 
    ? Math.round(tasks.reduce((sum, task) => sum + (task.progress_percent || 0), 0) / tasks.length)
    : 0

  const now = new Date()
  const totalTasks = tasks.length
  const onTimeTasks = tasks.filter(task => {
    if (!task.end_date) return true
    const endDate = new Date(task.end_date)
    
    if (task.progress_percent === 100) return true
    
    return endDate >= now
  })
  const scheduleCompliance = totalTasks > 0
    ? Math.round((onTimeTasks.length / totalTasks) * 100)
    : 0
  
  const completedTasks = tasks.filter(task => task.progress_percent === 100)

  const totalBudget = activeBudget ? budgetItems.reduce((sum, item) => {
    const subtotal = item.quantity * item.unit_price
    const withMarkup = subtotal * (1 + (item.markup_pct || 0) / 100)
    return sum + withMarkup
  }, 0) : 0

  const totalSpent = movements
    .filter(m => m.amount < 0)
    .reduce((sum, m) => sum + Math.abs(m.amount), 0)
  
  const budgetConsumed = activeBudget && totalBudget > 0 
    ? Math.round((totalSpent / totalBudget) * 100)
    : 0

  const approvedDocs = documents.filter(doc => doc.status === 'Aprobado')
  const pendingDocs = documents.filter(doc => doc.status === 'Pendiente')
  const rejectedDocs = documents.filter(doc => doc.status === 'Rechazado')

  // Tasks at risk: progress < 10% and start_date > 7 days ago
  const tasksAtRisk = tasks.filter(task => {
    if (!task.start_date || task.progress_percent >= 10) return false
    const startDate = new Date(task.start_date)
    const daysSinceStart = differenceInDays(now, startDate)
    return daysSinceStart > 7
  })

  // Task status distribution
  const pendingTasks = tasks.filter(task => task.progress_percent === 0)
  const inProgressTasks = tasks.filter(task => task.progress_percent > 0 && task.progress_percent < 100)

  // Group tasks by phase
  const tasksByPhase = tasks.reduce((acc, task) => {
    const phase = task.phase_name || 'Sin Fase'
    if (!acc[phase]) {
      acc[phase] = []
    }
    acc[phase].push(task)
    return acc
  }, {} as Record<string, typeof tasks>)

  const phaseProgress = Object.entries(tasksByPhase).map(([phase, phaseTasks]) => ({
    name: phase,
    progress: phaseTasks.length > 0
      ? Math.round(phaseTasks.reduce((sum, t) => sum + (t.progress_percent || 0), 0) / phaseTasks.length)
      : 0
  }))

  // Financial health indicator
  const getFinancialHealth = () => {
    if (budgetConsumed < 80) return { color: 'var(--chart-positive)', label: 'Saludable' }
    if (budgetConsumed < 100) return { color: '#f59e0b', label: 'Advertencia' }
    return { color: 'var(--chart-negative)', label: 'Excedido' }
  }

  const financialHealth = getFinancialHealth()

  // Recent movements (last 5)
  const recentMovements = movements.slice(0, 5)

  // Recent documents (last 3)
  const recentDocuments = documents.slice(0, 3)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const isLoading = tasksLoading || budgetsLoading || budgetItemsLoading || movementsLoading || documentsLoading

  return (
    <div className="space-y-6">
      {/* PROJECT OVERVIEW - KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-4">Panel de Control del Proyecto</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Progreso General */}
          <Card data-testid="card-general-progress">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                Progreso General
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="text-general-progress">
                    {totalProgress}%
                  </div>
                  <Progress value={totalProgress} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {tasks.length} tareas totales
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cumplimiento de Cronograma */}
          <Card data-testid="card-schedule-compliance">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                Cumplimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="text-schedule-compliance">
                    {scheduleCompliance}%
                  </div>
                  <Progress value={scheduleCompliance} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {onTimeTasks.length}/{totalTasks} a tiempo
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Presupuesto Consumido */}
          <Card data-testid="card-budget-consumed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                Presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="text-budget-consumed">
                    {budgetConsumed}%
                  </div>
                  <Progress value={budgetConsumed} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Documentos Aprobados */}
          <Card data-testid="card-approved-docs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="text-approved-docs">
                    {approvedDocs.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    de {documents.length} aprobados
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pendingDocs.length} pendientes
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* EXECUTION HEALTH */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h3 className="text-xl font-semibold mb-4">Salud de Ejecución</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Progress by Phase */}
          <Card data-testid="card-phase-progress">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Progreso por Fases
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : phaseProgress.length > 0 ? (
                <div className="space-y-3">
                  {phaseProgress.map((phase, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{phase.name}</span>
                        <span className="text-sm font-bold">{phase.progress}%</span>
                      </div>
                      <Progress value={phase.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sin fases definidas</p>
              )}
            </CardContent>
          </Card>

          {/* Task Status Distribution */}
          <Card data-testid="card-task-status">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estado de Tareas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span className="text-sm">Pendientes</span>
                    </div>
                    <span className="font-bold" data-testid="count-pending-tasks">{pendingTasks.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                      <span className="text-sm">En Progreso</span>
                    </div>
                    <span className="font-bold" data-testid="count-inprogress-tasks">{inProgressTasks.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--chart-positive)' }}></div>
                      <span className="text-sm">Completadas</span>
                    </div>
                    <span className="font-bold" data-testid="count-completed-tasks">{completedTasks.length}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total</span>
                      <span className="font-bold">{tasks.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks at Risk */}
          <Card data-testid="card-tasks-at-risk">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" style={{ color: '#f59e0b' }} />
                Tareas en Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : tasksAtRisk.length > 0 ? (
                <div className="space-y-2">
                  {tasksAtRisk.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-start gap-2 pb-2 border-b last:border-0">
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {task.display_name || task.task?.display_name || 'Tarea sin nombre'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {task.start_date ? `Inicio: ${formatDateShort(task.start_date)}` : 'Sin fecha'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {tasksAtRisk.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{tasksAtRisk.length - 5} más
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--chart-positive)' }} />
                  <p className="text-sm text-muted-foreground">
                    No hay tareas en riesgo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* FINANCIAL PULSE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-xl font-semibold mb-4">Pulso Financiero</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Budget vs Real */}
          <Card data-testid="card-budget-vs-real">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Presupuesto vs Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : !activeBudget ? (
                <div className="text-center py-4">
                  <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay presupuesto activo
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Presupuestado</span>
                    <span className="font-medium">{formatCurrency(totalBudget)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gastado</span>
                    <span className="font-medium" style={{ color: 'var(--chart-negative)' }}>
                      {formatCurrency(totalSpent)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Disponible</span>
                      <span className="font-bold" style={{ color: totalBudget - totalSpent > 0 ? 'var(--chart-positive)' : 'var(--chart-negative)' }}>
                        {formatCurrency(totalBudget - totalSpent)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Salud Financiera:</span>
                      <Badge 
                        variant="outline" 
                        style={{ 
                          borderColor: financialHealth.color,
                          color: financialHealth.color 
                        }}
                      >
                        {financialHealth.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card data-testid="card-recent-movements" className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Movimientos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : recentMovements.length > 0 ? (
                <div className="space-y-3">
                  {recentMovements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between pb-2 border-b last:border-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: movement.amount < 0 ? 'var(--chart-negative)' : 'var(--chart-positive)' }}
                        ></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {movement.description || 'Sin descripción'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {movement.movement_date && formatDateShort(movement.movement_date)}
                          </p>
                        </div>
                      </div>
                      <span 
                        className="text-sm font-medium ml-2 flex-shrink-0"
                        style={{ color: movement.amount < 0 ? 'var(--chart-negative)' : 'var(--chart-positive)' }}
                      >
                        {formatCurrency(Math.abs(movement.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay movimientos registrados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* DOCUMENTATION & COMPLIANCE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-xl font-semibold mb-4">Documentación y Cumplimiento</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Document Status */}
          <Card data-testid="card-document-status">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Estado de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" style={{ color: 'var(--chart-positive)' }} />
                      <span className="text-sm">Aprobados</span>
                    </div>
                    <span className="font-bold" data-testid="count-approved-docs">{approvedDocs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Pendientes</span>
                    </div>
                    <span className="font-bold" data-testid="count-pending-docs">{pendingDocs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" style={{ color: 'var(--chart-negative)' }} />
                      <span className="text-sm">Rechazados</span>
                    </div>
                    <span className="font-bold" data-testid="count-rejected-docs">{rejectedDocs.length}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total</span>
                      <span className="font-bold">{documents.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card data-testid="card-recent-documents">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : recentDocuments.length > 0 ? (
                <div className="space-y-3">
                  {recentDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-2 pb-2 border-b last:border-0">
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.name || doc.file_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formatDateShort(doc.created_at)}
                          </p>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{
                              borderColor: doc.status === 'Aprobado' ? 'var(--chart-positive)' : 
                                         doc.status === 'Rechazado' ? 'var(--chart-negative)' : '#f59e0b',
                              color: doc.status === 'Aprobado' ? 'var(--chart-positive)' : 
                                    doc.status === 'Rechazado' ? 'var(--chart-negative)' : '#f59e0b'
                            }}
                          >
                            {doc.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay documentos cargados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
