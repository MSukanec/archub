import { useState, useMemo, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Plus, CheckSquare, Calendar, MapPin, User, Edit, Trash2 } from 'lucide-react'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useConstructionTasks, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useNavigationStore } from '@/stores/navigationStore'

export default function ConstructionTasks() {
  const [searchValue, setSearchValue] = useState("")
  const [groupingType, setGroupingType] = useState('none')
  
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

  // Debug: verificar datos de tareas
  console.log('ConstructionTasks - projectId:', projectId)
  console.log('ConstructionTasks - organizationId:', organizationId)
  console.log('ConstructionTasks - tasks data:', tasks)
  console.log('ConstructionTasks - tasks length:', tasks.length)

  // Filtrar tareas según búsqueda
  const filteredTasks = useMemo(() => {
    if (!searchValue.trim()) return tasks
    
    return tasks.filter(task => {
      const displayName = task.task?.display_name || task.task?.code || ''
      const rubroName = task.task?.rubro_name || ''
      const categoryName = task.task?.category_name || ''
      
      return displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
        rubroName.toLowerCase().includes(searchValue.toLowerCase()) ||
        categoryName.toLowerCase().includes(searchValue.toLowerCase())
    })
  }, [tasks, searchValue])

  const handleAddTask = () => {
    if (!projectId || !organizationId || !userData?.user?.id) {
      console.error('Missing required data for task creation')
      return
    }

    openModal('construction-task', {
      projectId,
      organizationId,
      userId: userData.user.id,
      isEditing: false
    })
  }

  const handleAddPhase = () => {
    if (!projectId || !organizationId || !userData?.user?.id) {
      console.error('Missing required data for phase creation')
      return
    }

    openModal('construction-phase', {
      projectId,
      organizationId,
      userId: userData.user.id,
      isEditing: false
    })
  }

  const handleEditTask = (task: any) => {
    openModal('construction-task', {
      projectId,
      organizationId,
      userId: userData?.user?.id,
      taskData: task,
      isEditing: true
    })
  }

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    const taskName = task?.task?.display_name || task?.task?.code || 'Tarea'
    
    showDeleteConfirmation({
      title: "Eliminar tarea",
      description: "¿Estás seguro de que deseas eliminar esta tarea de construcción?",
      itemName: taskName,
      onConfirm: async () => {
        await deleteTask.mutateAsync({
          id: taskId,
          project_id: projectId || '',
          organization_id: organizationId || ''
        })
      }
    })
  }

  // Definir columnas para la tabla
  const columns = [
    {
      key: 'rubro_name',
      label: 'Rubro',
      render: (task: any) => task.task?.rubro_name || 'Sin rubro',
      width: '15%'
    },
    {
      key: 'display_name',
      label: 'Tarea',
      render: (task: any) => task.task?.display_name || task.task?.code || 'Sin nombre',
      width: '30%'
    },
    {
      key: 'unit',
      label: 'Unidad',
      render: (task: any) => task.task?.unit_symbol || 'Sin unidad',
      width: '8%'
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      render: (task: any) => task.quantity || 0,
      width: '8%'
    },
    {
      key: 'progress',
      label: 'Progreso',
      render: (task: any) => `${task.progress_percent || 0}%`,
      width: '8%'
    },
    {
      key: 'phase',
      label: 'Fase',
      render: (task: any) => task.phase_name || 'Sin fase',
      width: '13%'
    },
    {
      key: 'dates',
      label: 'Fechas',
      render: (task: any) => task.start_date ? new Date(task.start_date).toLocaleDateString() : 'Sin fecha',
      width: '8%'
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (task: any) => (
        <div className="flex gap-1 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditTask(task)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTask(task.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: '10%',
      sortable: false
    }
  ]

  if (isLoading) {
    return (
      <Layout headerProps={{ title: "Listado de Tareas" }} layoutWide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando tareas...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={{ title: "Listado de Tareas" }} layoutWide={true}>
      <div className="space-y-4">
        {/* FeatureIntroduction - Mobile Only */}
        <FeatureIntroduction
          title="Listado de Tareas"
          icon={<CheckSquare className="w-5 h-5" />}
          features={[
            {
              icon: <CheckSquare className="w-5 h-5" />,
              title: "Vista de Tabla Completa",
              description: "Listado detallado con todas las tareas organizadas por rubro, unidad, cantidad y fase asignada."
            },
            {
              icon: <Calendar className="w-5 h-5" />,
              title: "Gestión de Fechas",
              description: "Control de fechas de inicio, fin y progreso de cada tarea con vista temporal."
            },
            {
              icon: <MapPin className="w-5 h-5" />,
              title: "Organización por Fases",
              description: "Agrupación automática por fases del proyecto con opciones de agrupamiento flexible."
            },
            {
              icon: <User className="w-5 h-5" />,
              title: "Control de Recursos",
              description: "Gestión de cantidades, unidades y asignación de recursos para cada tarea."
            }
          ]}
        />

        {/* Action Bar Desktop - siempre visible */}
        <ActionBarDesktop
          title="Listado de Tareas"
          icon={<CheckSquare className="w-6 h-6" />}
          features={[
            {
              icon: <CheckSquare className="w-4 h-4" />,
              title: "Vista de Tabla Completa",
              description: "Listado detallado con todas las tareas organizadas por rubro, unidad, cantidad y fase asignada."
            },
            {
              icon: <Calendar className="w-4 h-4" />,
              title: "Gestión de Fechas",
              description: "Control de fechas de inicio, fin y progreso de cada tarea con vista temporal."
            },
            {
              icon: <MapPin className="w-4 h-4" />,
              title: "Organización por Fases",
              description: "Agrupación automática por fases del proyecto con opciones de agrupamiento flexible."
            },
            {
              icon: <User className="w-4 h-4" />,
              title: "Control de Recursos",
              description: "Gestión de cantidades, unidades y asignación de recursos para cada tarea."
            }
          ]}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          showGrouping
          groupingType={groupingType}
          onGroupingChange={setGroupingType}
          primaryActionLabel="Nueva Tarea"
          onPrimaryActionClick={handleAddTask}
          customActions={[
            <Button 
              key="create-phase"
              onClick={handleAddPhase} 
              variant="secondary" 
              className="h-9 px-4"
            >
              <Plus />
              Crear Fase
            </Button>
          ]}
        />

        {/* Table or Empty State */}
        {tasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="h-8 w-8" />}
            title="No hay tareas en el proyecto"
            description="Comienza creando la primera tarea de construcción para organizar el trabajo del proyecto."
          />
        ) : (
          <Table
            columns={columns}
            data={filteredTasks}
            isLoading={isLoading}
            emptyState={
              <EmptyState
                icon={<CheckSquare className="h-8 w-8" />}
                title="No hay tareas que coincidan"
                description="Intenta cambiar los filtros de búsqueda para encontrar las tareas que buscas."
              />
            }
          />
        )}
      </div>
    </Layout>
  )
}