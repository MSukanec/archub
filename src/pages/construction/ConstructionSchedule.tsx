import { useState, useMemo, useEffect, useRef } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, Clock, Activity, CheckSquare } from 'lucide-react'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { useConstructionTasks, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useProjectPhases } from '@/hooks/use-construction-phases'
import { useConstructionDependencies } from '@/hooks/use-construction-dependencies'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useNavigationStore } from '@/stores/navigationStore'
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

  const { data: tasks = [], isLoading } = useConstructionTasks(
    projectId || '', 
    organizationId || ''
  )

  // Obtener las fases del proyecto y dependencias
  const { data: projectPhases = [] } = useProjectPhases(projectId || '')
  const { data: dependencies = [] } = useConstructionDependencies(projectId || '')

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

    // TODO: Implementar modal de fases
    console.log('Create phase modal not implemented yet');
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
    
    openModal('phase', {
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
      onConfirm: () => {
        console.log('Deleting phase:', item.phaseData.id);
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
      <Button key="new-phase" onClick={handleAddPhase} variant="outline" className="h-8 px-3 text-sm" disabled>
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

      {/* Gantt Chart or Empty State */}
      {ganttData.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="No hay tareas en el cronograma"
          description="Comienza creando tareas para ver el cronograma del proyecto."
          action={
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddTask} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Tarea
              </Button>
              <Button onClick={handleAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Tarea
              </Button>
            </div>
          }
        />
      ) : (
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
      )}
    </Layout>
  )
}