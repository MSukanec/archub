import { useState, useMemo, useEffect, useRef } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Calendar, Clock, Activity, CheckSquare, BarChart3, Table, Edit, Trash2 } from 'lucide-react'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { BudgetTable } from '@/components/ui-custom/BudgetTable'
import ProgressCurve from '@/components/charts/gantt/ProgressCurve'
import BurndownChart from '@/components/charts/gantt/BurndownChart'
import WorkloadOverTime from '@/components/charts/gantt/WorkloadOverTime'
import TasksByPhase from '@/components/charts/gantt/TasksByPhase'
import DurationByRubro from '@/components/charts/gantt/DurationByRubro'
import StatusBreakdown from '@/components/charts/gantt/StatusBreakdown'
import CriticalPathDistribution from '@/components/charts/gantt/CriticalPathDistribution'
import WeeklyProgressHeatmap from '@/components/charts/gantt/WeeklyProgressHeatmap'
import DependencyNetwork from '@/components/charts/gantt/DependencyNetwork'
import { useConstructionTasks, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useProjectPhases, useUpdatePhasesDates, useDeleteProjectPhase } from '@/hooks/use-construction-phases'
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
  const deletePhase = useDeleteProjectPhase()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.preferences?.last_organization_id

  const { data: tasks = [], isLoading } = useConstructionTasks(
    projectId || '', 
    organizationId || ''
  )

  // Obtener las fases del proyecto y dependencias
  const { data: projectPhases = [] } = useProjectPhases(projectId || '')
  const { data: dependencies = [] } = useConstructionDependencies(projectId || '')
  const updatePhasesDates = useUpdatePhasesDates()

  // Procesar los nombres de las tareas de forma simplificada
  const processedTasks = useMemo(() => {
    if (!tasks.length) return []
    
    return tasks.map((task) => ({
      ...task,
      task: {
        ...task.task,
        processed_display_name: task.task?.display_name || task.task?.code || 'Tarea sin nombre'
      }
    }))
  }, [tasks])



  const handleAddTask = () => {
    if (!projectId || !organizationId || !userData?.user?.id) {
      console.error('Missing project, organization ID, or user data', {
        projectId,
        organizationId,
        userId: userData?.user?.id
      });
      return
    }

    openModal('construction-task', {
      projectId,
      organizationId,
      userId: userData.user.id
    });
  }

  const handleAddPhase = () => {
    if (!projectId || !organizationId || !userData?.user?.id) {
      console.error('Missing project, organization ID, or user data for phase modal', {
        projectId,
        organizationId,
        userId: userData?.user?.id
      });
      return
    }

    openModal('construction-phase', {
      projectId,
      organizationId,
      userId: userData.user.id
    });
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId || !organizationId) return

    await deleteTask.mutateAsync({
      id: taskId,
      project_id: projectId,
      organization_id: organizationId
    })
  }

  // Manejar edición de tarea desde Gantt
  const handleEditTask = (item: GanttRowProps) => {
    if (item.type !== 'task') return
    
    openModal('construction-task-schedule', {
      projectId,
      organizationId,
      userId: userData?.user?.id,
      editingTask: item.taskData,
      isEditing: true
    })
  }

  // Manejar eliminación de tarea desde Gantt
  const handleDeleteTaskFromGantt = (item: GanttRowProps) => {
    if (item.type !== 'task' || !item.taskData) return
    
    showDeleteConfirmation({
      title: "Eliminar Tarea",
      description: "¿Estás seguro de que deseas eliminar esta tarea del proyecto?",
      itemName: item.name,
      onConfirm: () => handleDeleteTask(item.taskData.id)
    })
  }

  // Manejar edición de fase desde Gantt
  const handleEditPhase = (item: GanttRowProps) => {
    if (item.type !== 'phase' || !item.phaseData) return
    
    openModal('construction-phase', {
      projectId,
      organizationId,
      userId: userData?.user?.id,
      editingPhase: item.phaseData,
      isEditing: true
    });
  }

  // Manejar eliminación de fase desde Gantt
  const handleDeletePhase = (item: GanttRowProps) => {
    if (item.type !== 'phase' || !item.phaseData) return
    
    showDeleteConfirmation({
      title: "Eliminar Fase",
      description: "¿Estás seguro de que deseas eliminar esta fase del proyecto?",
      itemName: item.name,
      onConfirm: async () => {
        console.log('Deleting phase:', item.phaseData.id);
        await deletePhase.mutateAsync({
          id: item.phaseData.id,
          project_id: projectId || ''
        });
      }
    })
  }

  // Filtrar tareas según búsqueda
  const filteredTasks = useMemo(() => {
    if (!searchValue.trim()) return processedTasks
    
    return processedTasks.filter(task => {
      const cleanName = cleanTaskDisplayName(task.task.processed_display_name || task.task.display_name || task.task.code || '')
      return cleanName.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.task.display_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.task.rubro_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.task.code?.toLowerCase().includes(searchValue.toLowerCase())
    })
  }, [processedTasks, searchValue])

  // Transformar construction tasks al formato que espera BudgetTable
  const budgetTasks = useMemo(() => {
    if (!filteredTasks) return []
    
    return filteredTasks.map((task) => ({
      id: task.id,
      budget_id: 'construction-schedule',
      task_id: task.task_id,
      organization_id: task.organization_id || '',
      project_id: task.project_id || '',
      created_at: task.created_at || new Date().toISOString(),
      updated_at: task.updated_at || new Date().toISOString(),
      task: {
        task_instance_id: task.id,
        project_id: task.project_id || '',
        task_id: task.task_id,
        task_code: task.task?.code || '',
        start_date: task.start_date,
        end_date: task.end_date,
        duration_in_days: task.duration_in_days,
        quantity: task.quantity || 0,
        phase_instance_id: task.phase_instance_id || '',
        phase_name: task.phase_name || '',
        phase_position: 1,
        progress_percent: task.progress_percent || 0,
        unit_id: task.task?.unit_id || '',
        unit_name: task.task?.unit_name || '',
        unit_symbol: task.task?.unit_symbol || '',
        display_name: task.task?.processed_display_name || task.task?.display_name || task.task?.code || '',
        subcategory_id: task.task?.subcategory_id || '',
        subcategory_name: task.task?.subcategory_name || '',
        category_id: task.task?.category_id || '',
        category_name: task.task?.category_name || '',
        rubro_id: task.task?.rubro_id || '',
        rubro_name: task.task?.rubro_name || '',
        task_group_id: '',
        task_group_name: ''
      }
    }))
  }, [filteredTasks])

  // Funciones helper requeridas por BudgetTable
  const generateTaskDisplayName = (task: any, parameterValues: any[]) => {
    if (!task) return 'Tarea sin nombre'
    return cleanTaskDisplayName(task.processed_display_name || task.display_name || task.code || 'Tarea sin nombre')
  }

  const getUnitName = (unitId: string | null) => {
    if (!unitId) return 'Sin unidad'
    // Buscar en los datos de las tareas la unidad correspondiente
    const taskWithUnit = filteredTasks.find(t => t.task?.unit_id === unitId)
    return taskWithUnit?.task?.unit_name || taskWithUnit?.task?.unit_symbol || 'Sin unidad'
  }

  // Crear estructura Gantt con tareas organizadas dentro de fases
  const ganttData = useMemo(() => {
    const ganttRows: any[] = [];

    // Si hay fases del proyecto, organizar tareas dentro de fases
    if (projectPhases.length > 0) {
      projectPhases.forEach((projectPhase) => {
        // Filtrar tareas que pertenecen a esta fase del proyecto
        const tasksInPhase = filteredTasks.filter(task => 
          task.phase_name === projectPhase.phase.name
        );

        // Calcular fechas de inicio y fin basándose en las tareas de la fase
        let phaseStartDate = projectPhase.start_date;
        let phaseEndDate = projectPhase.end_date;
        let phaseDuration = projectPhase.duration_in_days;

        if (tasksInPhase.length > 0) {
          // Encontrar la fecha de inicio más temprana de las tareas
          const taskStartDates = tasksInPhase
            .map(task => task.start_date)
            .filter(date => date !== null && date !== undefined)
            .sort();

          // Encontrar la fecha de fin más tardía de las tareas
          const taskEndDates = tasksInPhase
            .map(task => {
              if (task.end_date) {
                return task.end_date;
              } else if (task.start_date && task.duration_in_days) {
                const startDate = new Date(task.start_date);
                startDate.setDate(startDate.getDate() + task.duration_in_days - 1);
                return startDate.toISOString().split('T')[0];
              }
              return null;
            })
            .filter(date => date !== null)
            .sort().reverse();

          // Actualizar fechas de la fase si hay tareas con fechas
          if (taskStartDates.length > 0) {
            phaseStartDate = taskStartDates[0];
          }
          if (taskEndDates.length > 0) {
            phaseEndDate = taskEndDates[0];
          }

          // Calcular duración en días si tenemos ambas fechas
          if (phaseStartDate && phaseEndDate) {
            const startDate = new Date(phaseStartDate);
            const endDate = new Date(phaseEndDate);
            phaseDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          }
        }

        // Solo usar valores por defecto si la fase tiene tareas
        // Si no hay tareas, la fase NO debe mostrar fechas ni barras
        if (tasksInPhase.length === 0) {
          // Limpiar fechas para fases sin tareas
          phaseStartDate = undefined;
          phaseEndDate = undefined;
          phaseDuration = undefined;
        }

        // Agregar la fase como fila de grupo (en mayúsculas)
        ganttRows.push({
          id: `phase-${projectPhase.id}`,
          name: projectPhase.phase.name.toUpperCase(),
          type: 'phase',
          level: 0,
          isHeader: true,
          startDate: phaseStartDate,
          endDate: phaseEndDate,
          durationInDays: phaseDuration,
          phaseData: projectPhase,
          phaseTasks: tasksInPhase // Agregar las tareas contenidas para calculateResolvedEndDate
        });

        // Agregar las tareas de esta fase
        tasksInPhase.forEach((task) => {
          // Validar y establecer fechas por defecto
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

          // Validar que las fechas sean válidas
          const startDateObj = new Date(validStartDate);
          const endDateObj = validEndDate ? new Date(validEndDate) : null;

          // Si end_date existe pero es anterior a start_date, corregir
          if (endDateObj && startDateObj > endDateObj) {
            validEndDate = validStartDate;
            validDuration = 1;
          }

          ganttRows.push({
            id: task.id,
            name: cleanTaskDisplayName(task.task.processed_display_name || task.task.display_name || task.task.code || 'Tarea sin nombre'),
            type: 'task',
            level: 1,
            startDate: validStartDate,
            endDate: validEndDate,
            durationInDays: validDuration,
            taskData: task
          });
        });
      });

      // Agregar tareas sin fase asignada si las hay
      const tasksWithoutPhase = filteredTasks.filter(task => !task.phase_name);
      if (tasksWithoutPhase.length > 0) {
        ganttRows.push({
          id: 'no-phase-header',
          name: 'TAREAS SIN FASE ASIGNADA',
          type: 'group',
          level: 0,
          isHeader: true,
          startDate: undefined,
          endDate: undefined,
          durationInDays: undefined
        });

        tasksWithoutPhase.forEach((task) => {
          let validStartDate = task.start_date;
          let validEndDate = task.end_date;
          let validDuration = task.duration_in_days;

          if (!validStartDate) {
            validStartDate = new Date().toISOString().split('T')[0];
          }

          if (validStartDate && !validEndDate && !validDuration) {
            validDuration = 1;
          }

          ganttRows.push({
            id: task.id,
            name: cleanTaskDisplayName(task.task.processed_display_name || task.task.display_name || task.task.code || 'Tarea sin nombre'),
            type: 'task',
            level: 1,
            startDate: validStartDate,
            endDate: validEndDate,
            durationInDays: validDuration,
            taskData: task
          });
        });
      }
    } else {
      // Si no hay fases del proyecto, mostrar todas las tareas sin agrupación
      filteredTasks.forEach((task) => {
        let validStartDate = task.start_date;
        let validEndDate = task.end_date;
        let validDuration = task.duration_in_days;

        if (!validStartDate) {
          validStartDate = new Date().toISOString().split('T')[0];
        }

        if (validStartDate && !validEndDate && !validDuration) {
          validDuration = 1;
        }

        ganttRows.push({
          id: task.id,
          name: cleanTaskDisplayName(task.task.processed_display_name || task.task.display_name || task.task.code || 'Tarea sin nombre'),
          type: 'task',
          level: 0,
          startDate: validStartDate,
          endDate: validEndDate,
          durationInDays: validDuration,
          taskData: task
        });
      });
    }

    return ganttRows;
  }, [filteredTasks, projectPhases]);

  const headerProps = {
    title: "Cronograma de Construcción",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    actions: [
      <Button key="new-phase" onClick={handleAddPhase} variant="outline" className="h-8 px-3 text-sm">
        <Plus className="h-4 w-4 mr-2" />
        Crear Fase
      </Button>,

      <Button key="new-task" onClick={handleAddTask} className="h-8 px-3 text-sm">
        <Plus className="h-4 w-4 mr-2" />
        Nueva Tarea
      </Button>
    ]
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
        features={[
          {
            icon: <Calendar className="h-5 w-5" />,
            title: "Visualización temporal",
            description: "Cronograma visual tipo Gantt con barras temporales"
          },
          {
            icon: <Activity className="h-5 w-5" />,
            title: "Organización por fases",
            description: "Tareas agrupadas jerárquicamente por fases del proyecto"
          },
          {
            icon: <CheckSquare className="h-5 w-5" />,
            title: "Gestión de dependencias",
            description: "Control de precedencias y relaciones entre tareas"
          },
          {
            icon: <Clock className="h-5 w-5" />,
            title: "Control de tiempo",
            description: "Fechas de inicio, fin y duración de cada elemento"
          }
        ]}
      />

      {/* Conditional Content - EmptyState or Tabs */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="No hay tareas en el cronograma"
          description="Comienza creando tareas para ver el cronograma del proyecto."
          action={
            <Button onClick={handleAddTask}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Tarea
            </Button>
          }
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 border bg-card p-1 rounded-lg">
            <TabsTrigger 
              value="gantt" 
              className="flex items-center gap-2 bg-transparent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-md transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4" />
              Vista Gantt
            </TabsTrigger>
            <TabsTrigger 
              value="table" 
              className="flex items-center gap-2 bg-transparent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-md transition-all duration-200"
            >
              <Table className="h-4 w-4" />
              Listado de Tareas
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 bg-transparent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-md transition-all duration-200"
            >
              <Activity className="h-4 w-4" />
              Análisis Visual
            </TabsTrigger>
          </TabsList>

          {/* Tab Content - Vista Gantt */}
          <TabsContent value="gantt" className="space-y-4">
            <GanttContainer
              data={ganttData}
              dependencies={dependencies}
              allTasks={processedTasks}
              projectId={projectId}
              onItemEdit={(item) => {
                if (item.type === 'task') {
                  handleEditTask(item);
                } else if (item.type === 'phase') {
                  handleEditPhase(item);
                }
              }}
              onItemDelete={(item) => {
                if (item.type === 'task') {
                  handleDeleteTaskFromGantt(item);
                } else if (item.type === 'phase') {
                  handleDeletePhase(item);
                }
              }}
            />
          </TabsContent>

          {/* Tab Content - Segunda Vista */}
          <TabsContent value="table" className="space-y-4">
            <BudgetTable
              budgetId="construction-tasks"
              budgetTasks={budgetTasks}
              isLoading={isLoading}
              groupingType={groupingType}
              selectedTasks={selectedTasks}
              setSelectedTasks={setSelectedTasks}
              generateTaskDisplayName={generateTaskDisplayName}
              parameterValues={[]}
              getUnitName={getUnitName}
              handleDeleteTask={handleDeleteTask}
              handleAddTask={() => handleAddTask()}
              onGroupingChange={setGroupingType}
              mode="construction"
              handleEditTask={handleEditTask}
            />
          </TabsContent>

          {/* Tab Content - Análisis Visual */}
          <TabsContent value="analytics" className="space-y-4">
            {/* Primera fila - 3 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <ProgressCurve data={processedTasks} />
              <BurndownChart data={processedTasks} />
              <WorkloadOverTime data={processedTasks} />
            </div>
            
            {/* Segunda fila - 4 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <TasksByPhase data={processedTasks} />
              <DurationByRubro data={processedTasks} />
              <StatusBreakdown data={processedTasks} />
              <CriticalPathDistribution data={processedTasks} dependencies={dependencies} />
            </div>
            
            {/* Tercera fila - Heatmap (1 col) y Red (3 cols) */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              <WeeklyProgressHeatmap data={processedTasks} />
              <div className="xl:col-span-3">
                <DependencyNetwork data={processedTasks} dependencies={dependencies} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </Layout>
  )
}