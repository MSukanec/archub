import { useState, useMemo, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Activity, CheckSquare, BarChart3, TableIcon, Edit, Trash2 } from 'lucide-react'
import { FILTER_ICONS, FILTER_LABELS, GROUPING_OPTIONS, ACTION_ICONS, ACTION_LABELS, Plus } from '@/constants/actionBarConstants'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { ActionBarDesktopRow } from '@/components/layout/desktop/ActionBarDesktopRow'
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
  const [activeTab, setActiveTab] = useState("gantt")
  const [groupingType, setGroupingType] = useState('rubros')
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const deleteTask = useDeleteConstructionTask()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.preferences?.last_organization_id

  const { data: tasks = [], isLoading } = useConstructionTasksView(projectId || '')

  // Obtener las fases del proyecto y dependencias
  const { data: projectPhases = [] } = useConstructionProjectPhases(projectId || '')
  const { data: dependencies = [] } = useConstructionDependencies(projectId || '')

  // Usar todas las tareas sin filtro de búsqueda
  const filteredTasks = tasks

  // Funciones memoizadas para evitar re-renderizados
  const getRubroName = useMemo(() => (taskId: string) => {
    const task = filteredTasks.find(t => t.id === taskId)
    return task?.category_name || 'Sin rubro'
  }, [filteredTasks])

  const getUnitName = useMemo(() => (unitId: string | null) => {
    if (!unitId) return 'Sin unidad'
    const taskWithUnit = filteredTasks.find(t => t.unit_name)
    return taskWithUnit?.unit_name || 'Sin unidad'
  }, [filteredTasks])

  // Crear estructura Gantt simplificada con las tareas de la vista
  const ganttData = useMemo(() => {
    const ganttRows: any[] = [];

    // Agrupar tareas por phase_name usando los datos de la vista
    const tasksByPhase = filteredTasks.reduce((acc, task) => {
      const phaseName = task.phase_name || 'TAREAS SIN FASE ASIGNADA';
      if (!acc[phaseName]) {
        acc[phaseName] = [];
      }
      acc[phaseName].push(task);
      return acc;
    }, {} as Record<string, typeof filteredTasks>);

    // Procesar cada fase
    Object.entries(tasksByPhase).forEach(([phaseName, tasksInPhase]) => {
      // Agregar encabezado de fase
      ganttRows.push({
        id: `phase-${phaseName.replace(/\s+/g, '-')}`,
        name: phaseName,
        type: 'phase',
        level: 0,
        isHeader: true,
        startDate: undefined,
        endDate: undefined,
        durationInDays: undefined
      });

      // Agregar las tareas de esta fase
      tasksInPhase.forEach((task) => {
        let validStartDate = task.start_date;
        let validEndDate = task.end_date;
        let validDuration = task.duration_in_days;

        // Si no hay start_date, usar fecha de hoy
        if (!validStartDate) {
          validStartDate = new Date().toISOString().split('T')[0];
        }

        // Si hay start_date pero no end_date ni duration, establecer duración de 1 día
        if (validStartDate && !validEndDate && !validDuration) {
          validDuration = 1;
        }

        ganttRows.push({
          id: task.id,
          name: cleanTaskDisplayName(task.name_rendered || 'Tarea sin nombre'),
          type: 'task',
          level: 1,
          startDate: validStartDate,
          endDate: validEndDate,
          durationInDays: validDuration,
          taskData: task
        });
      });
    });

    return ganttRows;
  }, [filteredTasks]);

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

  // Crear tabs para el header
  const headerTabs = [
    {
      id: "gantt",
      label: "Vista Gantt",
      isActive: activeTab === "gantt"
    },
    {
      id: "list", 
      label: "Listado de Tareas",
      isActive: activeTab === "list"
    },
    {
      id: "analytics",
      label: "Análisis Visual", 
      isActive: activeTab === "analytics"
    }
  ]

  return (
    <Layout 
      headerProps={{
        title: "Cronograma de Construcción",
        tabs: headerTabs,
        onTabChange: setActiveTab
      }}
      wide={true}
    >
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

      {/* ActionBarDesktopRow */}
      <ActionBarDesktopRow
        filters={[
          {
            key: 'grouping',
            label: FILTER_LABELS.GROUPING,
            icon: FILTER_ICONS.GROUPING,
            value: groupingType === 'rubros' ? 'Por Rubros' : groupingType === 'fases' ? 'Por Fases' : 'Sin Agrupar',
            setValue: (value) => {
              if (value === 'Por Rubros') setGroupingType('rubros')
              else if (value === 'Por Fases') setGroupingType('fases')
              else setGroupingType('none')
            },
            options: GROUPING_OPTIONS.SCHEDULE,
            defaultLabel: 'Todas las agrupaciones'
          }
        ]}
        actions={[
          {
            label: ACTION_LABELS.NEW_TASK,
            icon: ACTION_ICONS.NEW,
            onClick: () => openModal('construction-task', { 
              projectId: projectId || '', 
              organizationId: organizationId || '' 
            }),
            variant: 'default'
          }
        ]}
      />

      {/* Tab Content */}
      {activeTab === 'gantt' && (
        <div className="space-y-6">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-16 w-16" />}
              title="No hay tareas en el cronograma"
              description="Comienza agregando tareas de construcción para visualizar el cronograma del proyecto."
            />
          ) : (
            <GanttContainer
              data={ganttData}
              dependencies={dependencies}
              onItemEdit={(item) => openModal('construction-task-schedule', { taskId: item.id })}
              onItemDelete={(item) => {
                const task = filteredTasks.find(t => t.id === item.id)
                showDeleteConfirmation({
                  title: 'Eliminar Tarea',
                  description: `¿Estás seguro de que quieres eliminar "${task?.name_rendered || 'esta tarea'}"?`,
                  onConfirm: () => deleteTask.mutate({
                    id: item.id,
                    project_id: task?.project_id || '',
                    organization_id: organizationId || ''
                  })
                })
              }}
            />
          )}
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