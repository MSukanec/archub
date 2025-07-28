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

  // Función para obtener el rubro de una tarea
  function getRubroName(taskId: string) {
    const task = filteredTasks.find(t => t.id === taskId)
    return task?.category_name || 'Sin rubro'
  }

  // Función para obtener nombre de unidad
  const getUnitName = (unitId: string | null) => {
    if (!unitId) return 'Sin unidad'
    const taskWithUnit = filteredTasks.find(t => t.unit_name)
    return taskWithUnit?.unit_name || 'Sin unidad'
  }

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
        type: 'group',
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

  const headerProps = {
    title: "Cronograma de Construcción"
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando cronograma...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      {/* Feature Introduction */}
      <FeatureIntroduction
        icon={<Calendar className="h-6 w-6" />}
        title="Cronograma de Construcción"
        description="Planifica, visualiza y controla el cronograma de construcción de tu proyecto con herramientas avanzadas de gestión temporal."
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
                  itemName: task?.name_rendered || 'esta tarea',
                  onConfirm: () => deleteTask.mutate(item.id)
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
                  width: '10%',
                  render: (task) => (
                    <Badge variant="secondary" className="text-xs">
                      {task.phase_name || 'Sin fase'}
                    </Badge>
                  )
                },
                {
                  key: 'category_name',
                  label: 'Rubro',
                  width: '10%',
                  render: (task) => (
                    <Badge variant="outline" className="text-xs">
                      {task.category_name || 'Sin rubro'}
                    </Badge>
                  )
                },
                {
                  key: 'name_rendered',
                  label: 'Tarea',
                  width: 'flex-1',
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
                }
              ]}
              onEdit={(task) => openModal('construction-task-schedule', { taskId: task.id })}
              onDelete={(task) => {
                showDeleteConfirmation({
                  itemName: task.name_rendered || 'esta tarea',
                  onConfirm: () => deleteTask.mutate(task.id)
                })
              }}
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
              <ProgressCurve tasks={filteredTasks} />
              <BurndownChart tasks={filteredTasks} />
              <WorkloadOverTime tasks={filteredTasks} />
              <TasksByPhase tasks={filteredTasks} />
              <DurationByRubro tasks={filteredTasks} />
              <StatusBreakdown tasks={filteredTasks} />
              <CriticalPathDistribution tasks={filteredTasks} dependencies={dependencies} />
              <WeeklyProgressHeatmap tasks={filteredTasks} />
              <DependencyNetwork tasks={filteredTasks} dependencies={dependencies} />
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}