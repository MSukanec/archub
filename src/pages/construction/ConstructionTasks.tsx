import { useState, useMemo, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, CheckSquare, Edit, Trash2, Calendar, Clock, MapPin, User } from 'lucide-react'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { useConstructionTasks, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useNavigationStore } from '@/stores/navigationStore'
import { generateTaskDescription } from '@/utils/taskDescriptionGenerator'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ConstructionTasks() {
  const [searchValue, setSearchValue] = useState("")
  const [processedTasks, setProcessedTasks] = useState<any[]>([])
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const deleteTask = useDeleteConstructionTask()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [])

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

  const handleEditTask = (task: any) => {
    if (!projectId || !organizationId || !userData?.user?.id) return
    
    openModal('construction-task', {
      projectId,
      organizationId,
      userId: userData.user.id,
      editingTask: task,
      isEditing: true
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

  // Filtrar tareas según búsqueda
  const filteredTasks = useMemo(() => {
    if (!searchValue.trim()) return processedTasks
    
    return processedTasks.filter(task =>
      task.task.processed_display_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.task.display_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.task.rubro_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.task.code?.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.phase_name?.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [processedTasks, searchValue])

  // Preparar datos para la tabla
  const tableData = filteredTasks.map((task) => ({
    id: task.id,
    rubro: task.task.rubro_name || 'Sin rubro',
    tarea: task.task.processed_display_name || task.task.display_name || task.task.code || 'Tarea sin nombre',
    unidad: task.task.unit_id || 'Sin unidad',
    cantidad: task.quantity || 0,
    fase: task.phase_name || 'Sin fase asignada',
    fechas: task.start_date || task.end_date ? (
      <div className="space-y-1">
        {task.start_date && (
          <div className="text-sm text-muted-foreground">
            Inicio: {format(new Date(task.start_date), 'dd/MM/yyyy', { locale: es })}
          </div>
        )}
        {task.end_date && (
          <div className="text-sm text-muted-foreground">
            Fin: {format(new Date(task.end_date), 'dd/MM/yyyy', { locale: es })}
          </div>
        )}
        {task.duration_in_days && (
          <div className="text-sm text-muted-foreground">
            Duración: {task.duration_in_days} días
          </div>
        )}
      </div>
    ) : (
      <span className="text-muted-foreground">Sin fechas definidas</span>
    ),
    originalData: task
  }))

  const tableColumns = [
    { 
      key: 'rubro', 
      label: 'Rubro',
      className: 'w-[150px]'
    },
    { 
      key: 'tarea', 
      label: 'Tarea',
      className: 'min-w-[250px]'
    },
    { 
      key: 'unidad', 
      label: 'Unidad',
      className: 'w-[100px]'
    },
    { 
      key: 'cantidad', 
      label: 'Cantidad',
      className: 'w-[100px] text-right'
    },
    { 
      key: 'fase', 
      label: 'Fase',
      className: 'w-[150px]'
    },
    { 
      key: 'fechas', 
      label: 'Fechas',
      className: 'w-[200px]'
    }
  ]

  const tableActions = [
    {
      label: 'Editar',
      icon: Edit,
      onClick: (item: any) => handleEditTask(item.originalData),
      variant: 'ghost' as const
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      onClick: (item: any) => {
        showDeleteConfirmation({
          title: "Eliminar Tarea",
          description: "¿Estás seguro de que deseas eliminar esta tarea del proyecto?",
          itemName: item.tarea,
          onConfirm: () => handleDeleteTask(item.id)
        })
      },
      variant: 'ghost' as const,
      className: 'text-red-600 hover:text-red-700'
    }
  ]

  const headerProps = {
    title: "Listado de Tareas",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    actions: (
      <Button onClick={handleAddTask} className="h-8 px-3 text-sm">
        <Plus className="h-4 w-4 mr-2" />
        Nueva Tarea
      </Button>
    )
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando tareas...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      {/* Feature Introduction */}
      <FeatureIntroduction
        icon={<CheckSquare className="h-6 w-6" />}
        title="Gestión de Tareas de Construcción"
        features={[
          {
            icon: <CheckSquare className="h-5 w-5" />,
            title: "Control de tareas",
            description: "Listado completo y organización de todas las tareas del proyecto"
          },
          {
            icon: <Calendar className="h-5 w-5" />,
            title: "Programación temporal",
            description: "Fechas de inicio, fin y duración para cada tarea"
          },
          {
            icon: <MapPin className="h-5 w-5" />,
            title: "Organización por fases",
            description: "Tareas agrupadas por fases del proyecto para mejor control"
          },
          {
            icon: <User className="h-5 w-5" />,
            title: "Asignación de recursos",
            description: "Control de cantidades y unidades para cada tarea"
          }
        ]}
      />

      {/* Table or Empty State */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No hay tareas en el proyecto"
          description="Comienza creando la primera tarea de construcción para organizar el trabajo del proyecto."
          action={{
            label: "Crear Primera Tarea",
            onClick: handleAddTask
          }}
        />
      ) : (
        <Table
          data={tableData}
          columns={tableColumns}
          actions={tableActions}
          showSearch={false}
        />
      )}
    </Layout>
  )
}