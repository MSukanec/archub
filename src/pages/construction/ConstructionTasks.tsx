import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState, useMemo } from 'react'
import { Plus, ListTodo, CheckSquare, Clock, Users, Edit, Trash2 } from 'lucide-react'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Table } from '@/components/ui-custom/Table'
import { GanttContainer } from '@/components/gantt'
import { useConstructionTasks, useUpdateConstructionTask, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Input } from '@/components/ui/input'

export default function ConstructionTasks() {
  const [searchValue, setSearchValue] = useState("")
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const updateTask = useUpdateConstructionTask()
  const deleteTask = useDeleteConstructionTask()

  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.preferences?.last_organization_id

  const { data: tasks = [], isLoading } = useConstructionTasks(
    projectId || '', 
    organizationId || ''
  )

  const handleAddTask = () => {
    if (!projectId || !organizationId || !userData?.user?.id) {
      console.error('Missing project, organization ID, or user data')
      return
    }

    openModal('construction-task', {
      projectId,
      organizationId,
      userId: userData.user.id
    })
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

  // Filtrar tareas basado en el searchValue
  const filteredTasks = tasks.filter(task => 
    task.task.display_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
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

    Object.entries(tasksByRubro).forEach(([rubroName, rubloTasks]) => {
      // Agregar fila agrupadora
      ganttRows.push({
        id: `group-${rubroName}`,
        name: rubroName,
        type: 'group',
        level: 0,
        isHeader: true
      });

      // Agregar tareas del rubro
      rubloTasks.forEach((task) => {
        ganttRows.push({
          id: task.id,
          name: task.task.display_name || task.task.code || 'Tarea sin nombre',
          type: 'task',
          level: 1,
          startDate: task.start_date || undefined,
          endDate: task.end_date || undefined,
          durationInDays: task.duration_in_days || undefined
        });
      });
    });

    return ganttRows;
  }, [filteredTasks]);

  const columns = [
    {
      key: 'rubro',
      label: 'Rubro',
      render: (task: any) => task.task.rubro_name || '-'
    },
    {
      key: 'tarea',
      label: 'Tarea',
      render: (task: any) => (
        <div>
          <div className="font-medium">{task.task.display_name}</div>
          <div className="text-xs text-muted-foreground">{task.task.code}</div>
        </div>
      )
    },
    {
      key: 'unidad',
      label: 'Unidad',
      render: (task: any) => task.task.unit_id ? 'Unidad' : '-'
    },
    {
      key: 'cantidad',
      label: 'Cantidad',
      render: (task: any) => (
        <Input
          type="number"
          value={task.quantity}
          onChange={(e) => {
            const newQuantity = parseFloat(e.target.value) || 0
            if (newQuantity > 0) {
              handleUpdateQuantity(task.id, newQuantity)
            }
          }}
          className="w-20 h-8"
          step="0.01"
          min="0.01"
        />
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
            onClick={() => handleDeleteTask(task.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  const headerProps = {
    title: "Tareas",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: false,
    onClearFilters: () => setSearchValue(""),
    actions: (
      <Button 
        className="h-8 px-3 text-sm"
        onClick={handleAddTask}
        disabled={!projectId || !organizationId}
      >
        <Plus className="w-4 h-4 mr-2" />
        Crear Tarea
      </Button>
    )
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
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Feature Introduction */}
        <FeatureIntroduction
          title="Gestión de Tareas de Construcción"
          icon={<ListTodo className="w-6 h-6" />}
          features={features}
        />

        {/* Gantt Timeline */}
        {filteredTasks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Cronograma de Construcción</h3>
            <GanttContainer
              data={ganttData}
              onItemClick={(item) => {
                console.log('Clicked item:', item);
              }}
            />
          </div>
        )}

        {/* Content Area */}
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
          <Table
            data={filteredTasks}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No se encontraron tareas que coincidan con la búsqueda"
          />
        )}
      </div>
    </Layout>
  )
}