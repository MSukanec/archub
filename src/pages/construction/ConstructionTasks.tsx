import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useMemo, useEffect } from 'react'
import { Plus, ListTodo, CheckSquare, Clock, Users, Edit, Trash2, Calendar, Table as TableIcon, Layers } from 'lucide-react'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Table } from '@/components/ui-custom/Table'
import { GanttContainer } from '@/components/gantt'
import { useConstructionTasks, useUpdateConstructionTask, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { GanttRowProps } from '@/components/gantt/types'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { supabase } from '@/lib/supabase'

// Usar el mismo sistema que ConstructionBudgets para procesar nombres
import { generateTaskDescription } from '@/utils/taskDescriptionGenerator';

export default function ConstructionTasks() {
  const [searchValue, setSearchValue] = useState("")
  const [activeTab, setActiveTab] = useState("listado")
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
    console.log('Attempting to open modal with data:', { projectId, organizationId, userData: userData?.user?.id });
    
    if (!projectId || !organizationId || !userData?.user?.id) {
      console.error('Missing project, organization ID, or user data', {
        projectId,
        organizationId,
        userId: userData?.user?.id
      });
      return
    }

    openModal('construction-task-form', {
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

    openModal('construction-phase-form', {
      projectId,
      organizationId,
      userId: userData.user.id
    });
  }

  const handleUpdateQuantity = async (taskId: string, newQuantity: number) => {
    if (!projectId || !organizationId) return

    await updateTask.mutateAsync({
      id: taskId,
      quantity: newQuantity,
      project_id: projectId,
      organization_id: organizationId
    })
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
  const handleEditTask = (item: any) => {
    console.log('Edit button clicked for item:', item);
    if (item.type !== 'task') return
    
    // Abrir modal de edición con datos pre-cargados
    openModal('construction-task-form', {
      projectId,
      organizationId,
      userId: userData?.user?.id,
      editingTask: item.taskData,
      isEditing: true
    })
  }

  // Manejar eliminación de tarea desde Gantt
  const handleDeleteTaskFromGantt = (item: any) => {
    console.log('Delete button clicked for item:', item);
    if (item.type !== 'task' || !item.taskData) return
    
    showDeleteConfirmation({
      title: "Eliminar Tarea",
      description: "¿Estás seguro de que deseas eliminar esta tarea del proyecto?",
      itemName: item.name,
      onConfirm: () => handleDeleteTask(item.taskData.id)
    })
  }

  // Filtrar tareas basado en el searchValue usando processedTasks
  const filteredTasks = processedTasks.filter(task => 
    task.task.processed_display_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    task.task.rubro_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    task.task.code?.toLowerCase().includes(searchValue.toLowerCase())
  )

  // Agrupar las tareas reales por rubro_name para el Gantt
  const ganttData = useMemo(() => {
    if (!filteredTasks.length) return [];

    // Agrupar tareas por rubro_name
    const tasksByRubro = filteredTasks.reduce((acc, task) => {
      const rubroName = task.task.rubro_name || 'Sin Rubro';
      if (!acc[rubroName]) {
        acc[rubroName] = [];
      }
      acc[rubroName].push(task);
      return acc;
    }, {} as Record<string, typeof filteredTasks>);

    // Crear estructura Gantt con agrupadores y tareas
    const ganttRows: any[] = [];

    Object.entries(tasksByRubro).forEach(([rubroName, rubloTasks]: [string, any[]]) => {
      // Agregar fila agrupadora (los grupos no necesitan fechas específicas)
      ganttRows.push({
        id: `group-${rubroName}`,
        name: rubroName,
        type: 'group',
        level: 0,
        isHeader: true,
        startDate: undefined,
        endDate: undefined,
        durationInDays: undefined
      });

      // Agregar tareas del rubro
      rubloTasks.forEach((task: any) => {
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

    return ganttRows;
  }, [filteredTasks]);

  const columns = [
    {
      key: 'fase',
      label: 'Fase',
      render: (task: any) => (
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            {task.phase_name || 'Sin fase'}
          </span>
        </div>
      )
    },
    {
      key: 'rubro',
      label: 'Rubro',
      render: (task: any) => task.task.rubro_name || '-'
    },
    {
      key: 'tarea',
      label: 'Tarea',
      render: (task: any) => (
        <div className="font-medium">
          {task.task.processed_display_name || task.task.display_name}
        </div>
      )
    },
    {
      key: 'unidad',
      label: 'Unidad',
      render: (task: any) => {
        // Obtener la unidad desde task.units si existe en la vista
        if (task.task && task.task.units && task.task.units.name) {
          return task.task.units.name;
        }
        // Fallback si no hay datos de unidad
        return task.task.unit_id ? 'Unidad' : '-';
      }
    },
    {
      key: 'cantidad',
      label: 'Cantidad',
      render: (task: any) => {
        // Obtener la unidad para mostrar dentro del input
        const getTaskUnit = () => {
          if (task.task && task.task.units && task.task.units.name) {
            return task.task.units.name;
          }
          return 'ud';
        };
        
        return (
          <div className="relative">
            <Input
              type="number"
              value={task.quantity}
              onChange={(e) => {
                const newQuantity = parseFloat(e.target.value) || 0
                if (newQuantity > 0) {
                  handleUpdateQuantity(task.id, newQuantity)
                }
              }}
              className="w-20 h-8 pr-8"
              step="0.01"
              min="0.01"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              {getTaskUnit()}
            </div>
          </div>
        )
      }
    },
    {
      key: 'fechas',
      label: 'Fechas',
      render: (task: any) => (
        <div className="text-sm">
          {task.start_date && (
            <div className="text-xs text-muted-foreground">
              Inicio: {new Date(task.start_date).toLocaleDateString('es-ES')}
            </div>
          )}
          {task.end_date && (
            <div className="text-xs text-muted-foreground">
              Fin: {new Date(task.end_date).toLocaleDateString('es-ES')}
            </div>
          )}
          {task.duration_in_days && (
            <div className="text-xs text-muted-foreground">
              Duración: {task.duration_in_days} días
            </div>
          )}
        </div>
      )
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (task: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              openModal('construction-task-form', {
                projectId,
                organizationId,
                userId: userData?.user?.id,
                editingTask: task,
                isEditing: true
              })
            }}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTask(task.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  const actions = [
    <Button 
      key="new-phase"
      variant="outline"
      className="h-8 px-3 text-sm"
      onClick={handleAddPhase}
    >
      <Layers className="w-4 h-4 mr-2" />
      Crear Fase
    </Button>,
    <Button 
      key="new-task"
      className="h-8 px-3 text-sm"
      onClick={handleAddTask}
    >
      <Plus className="w-4 h-4 mr-2" />
      Crear Tarea
    </Button>
  ]

  const headerProps = {
    title: "Tareas",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: false,
    onClearFilters: () => setSearchValue(""),
    actions
  }

  const features = [
    {
      icon: <ListTodo className="w-5 h-5" />,
      title: "Gestión Completa de Tareas",
      description: "Crea, edita y organiza todas las tareas de construcción con descripción detallada, fechas de inicio y finalización."
    },
    {
      icon: <CheckSquare className="w-5 h-5" />,
      title: "Control de Progreso",
      description: "Marca tareas como completadas, en progreso o pendientes. Visualiza el avance general de la obra."
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Planificación Temporal",
      description: "Establece fechas límite, dependencias entre tareas y secuencias de trabajo para optimizar los tiempos."
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Integración con Presupuestos",
      description: "Las tareas creadas aquí se integran automáticamente con el sistema de presupuestos para costeo preciso."
    }
  ]

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-6">
        {/* Feature Introduction */}
        <FeatureIntroduction
          title="Gestión de Tareas de Construcción"
          icon={<ListTodo className="w-6 h-6" />}
          features={features}
        />

        {/* Tabs para alternar vistas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-lg p-1">
            <TabsTrigger 
              value="listado" 
              className="flex items-center gap-2 data-[state=active]:bg-[var(--accent)] data-[state=active]:text-white border-0 rounded-md"
            >
              <TableIcon className="w-4 h-4" />
              Listado
            </TabsTrigger>
            <TabsTrigger 
              value="cronograma" 
              className="flex items-center gap-2 data-[state=active]:bg-[var(--accent)] data-[state=active]:text-white border-0 rounded-md"
            >
              <Calendar className="w-4 h-4" />
              Cronograma
            </TabsTrigger>
          </TabsList>

          {/* Vista Cronograma - Gantt Timeline */}
          <TabsContent value="cronograma" className="mt-6">
            {!projectId ? (
              <EmptyState
                icon={<ListTodo className="w-12 h-12" />}
                title="Selecciona un proyecto"
                description="Para ver el cronograma de construcción, primero selecciona un proyecto específico desde el header."
              />
            ) : filteredTasks.length === 0 && !isLoading ? (
              <EmptyState
                icon={<ListTodo className="w-12 h-12" />}
                title="No hay tareas creadas"
                description="Crea tu primera tarea de construcción para comenzar a organizar el cronograma de la obra."
                action={
                  <Button onClick={handleAddTask}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Tarea
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Cronograma de Construcción</h3>
                <GanttContainer
                  data={ganttData}
                  onItemClick={(item) => {
                    console.log('Clicked item:', item);
                  }}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTaskFromGantt}
                />
              </div>
            )}
          </TabsContent>

          {/* Vista Listado - Tabla */}
          <TabsContent value="listado" className="mt-6">
            {!projectId ? (
              <EmptyState
                icon={<ListTodo className="w-12 h-12" />}
                title="Selecciona un proyecto"
                description="Para ver las tareas de construcción, primero selecciona un proyecto específico desde el header."
              />
            ) : filteredTasks.length === 0 && !isLoading ? (
              <EmptyState
                icon={<ListTodo className="w-12 h-12" />}
                title="No hay tareas creadas"
                description="Crea tu primera tarea de construcción para comenzar a organizar el trabajo de la obra."
                action={
                  <Button onClick={handleAddTask}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Tarea
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Listado de Tareas</h3>
                <Table
                  data={filteredTasks}
                  columns={columns}
                  isLoading={isLoading}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}