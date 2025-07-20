import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState, useMemo, useEffect } from 'react'
import { Plus, Calendar, Clock, Activity, CheckSquare, Edit, Trash2 } from 'lucide-react'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { useConstructionTasks, useUpdateConstructionTask, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useProjectPhases } from '@/hooks/use-construction-phases'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { Badge } from '@/components/ui/badge'
import { GanttContainer } from '@/components/gantt/GanttContainer'
import { GanttRowProps } from '@/components/gantt/types'

// Usar el mismo sistema que ConstructionBudgets para procesar nombres
import { generateTaskDescription } from '@/utils/taskDescriptionGenerator';

export default function ConstructionSchedule() {
  const [searchValue, setSearchValue] = useState("")
  const [processedTasks, setProcessedTasks] = useState<any[]>([])
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const queryClient = useQueryClient()
  const updateTask = useUpdateConstructionTask()
  const deleteTask = useDeleteConstructionTask()
  const { showDeleteConfirmation } = useDeleteConfirmation()

  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.preferences?.last_organization_id

  const { data: tasks = [], isLoading } = useConstructionTasks(
    projectId || '', 
    organizationId || ''
  )

  // Obtener las fases del proyecto
  const { data: projectPhases = [] } = useProjectPhases(projectId || '')

  // Procesar los nombres de las tareas de forma asíncrona
  useEffect(() => {
    const processTaskNames = async () => {
      if (!tasks.length) {
        setProcessedTasks([])
        return
      }

      const processed = await Promise.all(
        tasks.map(async (task) => {
          if (task.task.param_values && Object.keys(task.task.param_values).length > 0) {
            const processedName = await generateTaskDescription(task.task.display_name, task.task.param_values)
            
            return {
              ...task,
              task: {
                ...task.task,
                processed_display_name: processedName
              }
            }
          }
          return {
            ...task,
            task: {
              ...task.task,
              processed_display_name: task.task.display_name
            }
          }
        })
      )
      
      setProcessedTasks(processed)
    }

    processTaskNames()
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
    console.log('Attempting to open phase modal with data:', { projectId, organizationId, userData: userData?.user?.id });
    
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
    console.log('Edit button clicked for item:', item);
    if (item.type !== 'task') return
    
    // Abrir modal de edición con datos pre-cargados
    openModal('construction-task', {
      projectId,
      organizationId,
      userId: userData?.user?.id,
      editingTask: item.taskData,
      isEditing: true
    })
  }

  // Manejar eliminación de tarea desde Gantt
  const handleDeleteTaskFromGantt = (item: GanttRowProps) => {
    console.log('Delete button clicked for item:', item);
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
    console.log('Edit phase button clicked for item:', item);
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
    console.log('Delete phase button clicked for item:', item);
    if (item.type !== 'phase' || !item.phaseData) return
    
    showDeleteConfirmation({
      title: "Eliminar Fase",
      description: "¿Estás seguro de que deseas eliminar esta fase del proyecto?",
      itemName: item.name,
      onConfirm: () => {
        // Aquí iría la lógica para eliminar la fase
        console.log('Deleting phase:', item.phaseData.id);
      }
    })
  }

  // Filtrar tareas según búsqueda
  const filteredTasks = useMemo(() => {
    if (!searchValue.trim()) return processedTasks
    
    return processedTasks.filter(task =>
      task.task.processed_display_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.task.display_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.task.rubro_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.task.code?.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [processedTasks, searchValue])

  // Crear estructura Gantt con tareas organizadas dentro de fases
  const ganttData = useMemo(() => {
    const ganttRows: any[] = [];

    // Si hay fases del proyecto, organizar tareas dentro de fases
    if (projectPhases.length > 0) {
      projectPhases.forEach((projectPhase) => {
        // Validar y establecer fechas de la fase
        let validStartDate = projectPhase.start_date;
        let validEndDate = projectPhase.end_date;
        let validDuration = projectPhase.duration_in_days;

        // Si no hay start_date, usar fecha de hoy
        if (!validStartDate) {
          validStartDate = new Date().toISOString().split('T')[0];
        }

        // Si hay start_date pero no end_date ni duration, establecer duración de 7 días por defecto
        if (validStartDate && !validEndDate && !validDuration) {
          validDuration = 7;
        }

        // Agregar la fase como fila de grupo (en mayúsculas)
        ganttRows.push({
          id: `phase-${projectPhase.id}`,
          name: projectPhase.phase.name.toUpperCase(),
          type: 'phase',
          level: 0,
          isHeader: true,
          startDate: validStartDate,
          endDate: validEndDate,
          durationInDays: validDuration,
          phaseData: projectPhase
        });

        // Filtrar tareas que pertenecen a esta fase del proyecto
        const tasksInPhase = filteredTasks.filter(task => 
          task.phase_name === projectPhase.phase.name
        );

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
            validEndDate = validStartDate; // Hacer que end_date sea igual a start_date
            validDuration = 1;
          }

          ganttRows.push({
            id: task.id,
            name: task.task.processed_display_name || task.task.display_name || task.task.code || 'Tarea sin nombre',
            type: 'task',
            level: 1,
            startDate: validStartDate,
            endDate: validEndDate,
            durationInDays: validDuration,
            taskData: task // Agregar datos completos de la tarea para edición/eliminación
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

          ganttRows.push({
            id: task.id,
            name: task.task.processed_display_name || task.task.display_name || task.task.code || 'Tarea sin nombre',
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

        ganttRows.push({
          id: task.id,
          name: task.task.processed_display_name || task.task.display_name || task.task.code || 'Tarea sin nombre',
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

  if (isLoading) {
    return (
      <Layout sidebar="construccion">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando cronograma...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout sidebar="construccion">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cronograma de Construcción</h1>
            <p className="text-muted-foreground">
              Visualización temporal de tareas y fases del proyecto
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddPhase} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Crear Fase
            </Button>
            <Button onClick={handleAddTask}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Tarea
            </Button>
          </div>
        </div>

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

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar tareas..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Gantt Chart */}
        {ganttData.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay tareas en el cronograma</h3>
            <p className="text-muted-foreground mb-6">
              Comienza creando tareas y fases para ver el cronograma del proyecto.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleAddPhase} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Fase
              </Button>
              <Button onClick={handleAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Tarea
              </Button>
            </div>
          </div>
        ) : (
          <GanttContainer
            ganttData={ganttData}
            handleEditTask={handleEditTask}
            handleDeleteTaskFromGantt={handleDeleteTaskFromGantt}
            handleEditPhase={handleEditPhase}
            handleDeletePhase={handleDeletePhase}
          />
        )}
      </div>
    </Layout>
  )
}