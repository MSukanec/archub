import { useState, useMemo, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Clock, Activity, CheckSquare, BarChart3, TableIcon, Edit, Trash2 } from 'lucide-react'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { Table } from '@/components/ui-custom/Table'
import ProgressCurve from '@/components/charts/gantt/ProgressCurve'
import BurndownChart from '@/components/charts/gantt/BurndownChart'
import WorkloadOverTime from '@/components/charts/gantt/WorkloadOverTime'
import TasksByPhase from '@/components/charts/gantt/TasksByPhase'
import DurationByRubro from '@/components/charts/gantt/DurationByRubro'
import StatusBreakdown from '@/components/charts/gantt/StatusBreakdown'
import CriticalPathDistribution from '@/components/charts/gantt/CriticalPathDistribution'
import WeeklyProgressHeatmap from '@/components/charts/gantt/WeeklyProgressHeatmap'
import DependencyNetwork from '@/components/charts/gantt/DependencyNetwork'
import { useConstructionTasksView, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useConstructionProjectPhases } from '@/hooks/use-construction-phases'
import { useConstructionDependencies } from '@/hooks/use-construction-dependencies'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useNavigationStore } from '@/stores/navigationStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { GanttContainer } from '@/components/gantt/GanttContainer'
import { GanttRowProps } from '@/components/gantt/types'
import { generateTaskDescription } from '@/utils/taskDescriptionGenerator'

// Función para limpiar nombres de tareas eliminando códigos y variables
function cleanTaskDisplayName(name: string): string {
  if (!name) return 'Tarea sin nombre'
  
  // Eliminar códigos al inicio (ej: "RPE-000001: ")
  let cleanedName = name.replace(/^[A-Z]{2,4}-[0-9]{6}:\s*/, '')
  
  // Eliminar variables template (ej: "{{aditivos}}", "{{mortar_type}}")
  cleanedName = cleanedName.replace(/\{\{[^}]*\}\}\.?/g, '')
  
  // Eliminar puntos sobrantes al final
  cleanedName = cleanedName.replace(/\.\s*$/, '')
  
  // Limpiar espacios múltiples y trim
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim()
  
  return cleanedName || 'Tarea sin nombre'
}

export default function ConstructionSchedule() {
  const [searchValue, setSearchValue] = useState("")
  const [activeTab, setActiveTab] = useState("list") // Cambiar a list por defecto
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const deleteTask = useDeleteConstructionTask()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [setSidebarContext])

  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.preferences?.last_organization_id

  const { data: tasks = [], isLoading } = useConstructionTasksView(projectId || '')

  // Comentar temporalmente las dependencias para debugging
  // const { data: projectPhases = [] } = useConstructionProjectPhases(projectId || '')
  // const { data: dependencies = [] } = useConstructionDependencies(projectId || '')

  // Filtrar tareas por búsqueda
  const filteredTasks = useMemo(() => {
    if (!searchValue.trim()) return tasks
    const searchTerm = searchValue.toLowerCase()
    return tasks.filter(task => 
      task.name_rendered?.toLowerCase().includes(searchTerm) ||
      task.category_name?.toLowerCase().includes(searchTerm) ||
      task.unit_name?.toLowerCase().includes(searchTerm) ||
      task.phase_name?.toLowerCase().includes(searchTerm)
    )
  }, [tasks, searchValue])

  // Eliminar funciones innecesarias para simplificar

  // Comentar ganttData temporalmente para debugging
  // const ganttData = useMemo(() => {
  //   if (filteredTasks.length === 0) return [];
  //   return filteredTasks.map(task => ({
  //     id: task.id,
  //     name: cleanTaskDisplayName(task.name_rendered || 'Tarea sin nombre'),
  //     type: 'task',
  //     level: 0,
  //     startDate: task.start_date || new Date().toISOString().split('T')[0],
  //     endDate: task.end_date,
  //     durationInDays: task.duration_in_days || 1,
  //     taskData: task
  //   }));
  // }, [filteredTasks]);

  // Mostrar loading state sin Layout complejo para evitar renderizados costosos
  if (isLoading) {
    return (
      <Layout wide={true}>
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-muted-foreground">Cargando...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout wide={true}>
      {/* Feature Introduction - Mobile only */}
      <FeatureIntroduction
        icon={<Calendar className="h-6 w-6" />}
        title="Cronograma de Construcción"
        className="md:hidden"
        features={[
          {
            icon: <Clock className="h-5 w-5" />,
            title: "Vista Gantt Avanzada",
            description: "Visualiza el cronograma con barras temporales, dependencias y fases del proyecto organizadas jerárquicamente."
          },
          {
            icon: <Activity className="h-5 w-5" />,
            title: "Análisis Visual",
            description: "Gráficos de progreso, burndown charts y análisis de rutas críticas para optimizar el cronograma."
          },
          {
            icon: <CheckSquare className="h-5 w-5" />,
            title: "Gestión de Dependencias",
            description: "Define y visualiza dependencias entre tareas para identificar bottlenecks y rutas críticas."
          },
          {
            icon: <BarChart3 className="h-5 w-5" />,
            title: "Reportes de Avance",
            description: "Métricas de progreso temporal, distribución de carga de trabajo y análisis de desviaciones."
          }
        ]}
      />

      {/* ActionBar */}
      <ActionBarDesktop
        title="Cronograma de Construcción"
        icon={<Calendar className="h-5 w-5" />}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        features={[
          {
            icon: <Clock className="h-4 w-4" />,
            title: "Vista Gantt Avanzada",
            description: "Visualiza el cronograma con barras temporales, dependencias y fases del proyecto organizadas jerárquicamente."
          },
          {
            icon: <Activity className="h-4 w-4" />,
            title: "Análisis Visual",
            description: "Gráficos de progreso, burndown charts y análisis de rutas críticas para optimizar el cronograma."
          },
          {
            icon: <CheckSquare className="h-4 w-4" />,
            title: "Gestión de Dependencias",
            description: "Define y visualiza dependencias entre tareas para identificar bottlenecks y rutas críticas."
          },
          {
            icon: <BarChart3 className="h-4 w-4" />,
            title: "Reportes de Avance",
            description: "Métricas de progreso temporal, distribución de carga de trabajo y análisis de desviaciones."
          }
        ]}
        tabs={[
          { value: 'gantt', label: 'Vista Gantt', icon: <Calendar className="h-4 w-4" /> },
          { value: 'list', label: 'Listado de Tareas', icon: <TableIcon className="h-4 w-4" /> },
          { value: 'analytics', label: 'Análisis Visual', icon: <BarChart3 className="h-4 w-4" /> }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'gantt' && (
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Vista Gantt en Debugging</h3>
              <p className="text-sm">Temporalmente deshabilitada para identificar problemas</p>
              <p className="text-xs mt-2">Tareas encontradas: {filteredTasks.length}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="space-y-6">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<TableIcon className="h-16 w-16" />}
              title="No hay tareas para mostrar"
              description="Las tareas que agregues aparecerán en esta lista con detalles completos."
            />
          ) : (
            <Table
              data={filteredTasks}
              columns={[
                {
                  key: 'phase_name',
                  label: 'Fase',
                  width: '15%',
                  render: (task) => (
                    <Badge variant="secondary" className="text-xs">
                      {task.phase_name || 'Sin fase'}
                    </Badge>
                  )
                },
                {
                  key: 'category_name',
                  label: 'Rubro',
                  width: '15%',
                  render: (task) => (
                    <Badge variant="outline" className="text-xs">
                      {task.category_name || 'Sin rubro'}
                    </Badge>
                  )
                },
                {
                  key: 'name_rendered',
                  label: 'Tarea',
                  width: '35%',
                  render: (task) => (
                    <span className="text-sm">
                      {cleanTaskDisplayName(task.name_rendered || 'Tarea sin nombre')}
                    </span>
                  )
                },
                {
                  key: 'unit_name',
                  label: 'Unidad',
                  width: '10%',
                  render: (task) => (
                    <Badge variant="outline" className="text-xs">
                      {task.unit_name || 'N/A'}
                    </Badge>
                  )
                },
                {
                  key: 'quantity',
                  label: 'Cantidad',
                  width: '10%',
                  render: (task) => (
                    <span className="text-sm font-medium">
                      {task.quantity || 0}
                    </span>
                  )
                },
                {
                  key: 'actions',
                  label: 'Acciones',
                  width: '15%',
                  sortable: false,
                  render: (task) => (
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal('construction-task-schedule', { taskId: task.id })}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          showDeleteConfirmation({
                            title: 'Eliminar Tarea',
                            description: `¿Estás seguro de que quieres eliminar "${task.name_rendered || 'esta tarea'}"?`,
                            onConfirm: () => deleteTask.mutate({
                              id: task.id,
                              project_id: task.project_id,
                              organization_id: organizationId || ''
                            })
                          })
                        }}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                }
              ]}
            />
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-16 w-16" />}
              title="No hay datos para analizar"
              description="Agrega tareas con fechas y duraciones para generar análisis visuales del cronograma."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProgressCurve data={filteredTasks} />
              <BurndownChart data={filteredTasks} />
              <WorkloadOverTime data={filteredTasks} />
              <TasksByPhase data={filteredTasks} />
              <DurationByRubro data={filteredTasks} />
              <StatusBreakdown data={filteredTasks} />
              <CriticalPathDistribution data={filteredTasks} dependencies={dependencies} />
              <WeeklyProgressHeatmap data={filteredTasks} />
              <DependencyNetwork data={filteredTasks} dependencies={dependencies} />
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}