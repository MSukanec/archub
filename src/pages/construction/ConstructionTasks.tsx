import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState, useMemo, useEffect } from 'react'
import { Plus, ListTodo, CheckSquare, Clock, Users, Edit, Trash2, Table as TableIcon } from 'lucide-react'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Table } from '@/components/ui-custom/Table'
import { useConstructionTasks, useUpdateConstructionTask, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { Badge } from '@/components/ui/badge'

// Usar el mismo sistema que ConstructionBudgets para procesar nombres
import { generateTaskDescription } from '@/utils/taskDescriptionGenerator';

export default function ConstructionTasks() {
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

  const handleUpdateQuantity = async (taskId: string, newQuantity: number) => {
    if (!projectId || !organizationId) return

    try {
      await updateTask.mutateAsync({
        id: taskId,
        project_id: projectId,
        organization_id: organizationId,
        quantity: newQuantity
      })
      
      queryClient.invalidateQueries({ queryKey: ['construction-materials'] })
    } catch (error) {
      console.error('Error updating task quantity:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId || !organizationId) return

    await deleteTask.mutateAsync({
      id: taskId,
      project_id: projectId,
      organization_id: organizationId
    })
  }

  // Manejar edición de tarea desde tabla
  const handleEditTask = (task: any) => {
    openModal('construction-task', {
      projectId,
      organizationId,
      userId: userData?.user?.id,
      editingTask: task,
      isEditing: true
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

  // Configuración de las columnas de la tabla
  const columns = [
    {
      key: 'rubro_name',
      header: 'Rubro',
      sortable: true,
      render: (task: any) => (
        <div className="font-medium text-sm">
          {task.task.rubro_name || 'Sin rubro'}
        </div>
      )
    },
    {
      key: 'display_name',
      header: 'Tarea',
      sortable: true,
      render: (task: any) => (
        <div>
          <div className="font-medium text-sm leading-relaxed">
            {task.task.processed_display_name || task.task.display_name || 'Sin nombre'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {task.task.code}
          </div>
        </div>
      )
    },
    {
      key: 'unit',
      header: 'Unidad',
      sortable: true,
      render: (task: any) => (
        <Badge variant="outline" className="text-xs">
          {task.task.unit_abbreviation || task.task.unit_name || 'Sin unidad'}
        </Badge>
      )
    },
    {
      key: 'quantity',
      header: 'Cantidad',
      sortable: true,
      render: (task: any) => (
        <div className="font-mono text-sm">
          {task.quantity?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
        </div>
      )
    },
    {
      key: 'phase_name',
      header: 'Fase',
      sortable: true,
      render: (task: any) => (
        <div>
          {task.phase_name ? (
            <Badge variant="secondary" className="text-xs">
              {task.phase_name}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Sin fase</span>
          )}
        </div>
      )
    },
    {
      key: 'dates',
      header: 'Fechas',
      sortable: false,
      render: (task: any) => (
        <div className="text-xs space-y-1">
          {task.start_date && (
            <div>Inicio: {new Date(task.start_date).toLocaleDateString('es-ES')}</div>
          )}
          {task.end_date && (
            <div>Fin: {new Date(task.end_date).toLocaleDateString('es-ES')}</div>
          )}
          {task.duration_in_days && (
            <div className="text-muted-foreground">Duración: {task.duration_in_days} días</div>
          )}
        </div>
      )
    }
  ]

  if (isLoading) {
    return (
      <Layout sidebar="construccion">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando tareas...</div>
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
            <h1 className="text-3xl font-bold tracking-tight">Listado de Tareas</h1>
            <p className="text-muted-foreground">
              Gestiona las tareas de construcción del proyecto
            </p>
          </div>
          <Button onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Tarea
          </Button>
        </div>

        {/* Feature Introduction */}
        <FeatureIntroduction
          icon={<TableIcon className="h-6 w-6" />}
          title="Listado de Tareas de Construcción"
          features={[
            {
              icon: <CheckSquare className="h-5 w-5" />,
              title: "Vista tabular completa",
              description: "Visualiza todas las tareas del proyecto en formato de tabla"
            },
            {
              icon: <Users className="h-5 w-5" />,
              title: "Organización por rubros",
              description: "Tareas organizadas por rubros y fases de construcción"
            },
            {
              icon: <ListTodo className="h-5 w-5" />,
              title: "Gestión de cantidades",
              description: "Control de cantidades y unidades de medida"
            },
            {
              icon: <Clock className="h-5 w-5" />,
              title: "Control de fechas",
              description: "Edición rápida y control de fechas de ejecución"
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

        {/* Content */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={<ListTodo className="h-12 w-12" />}
            title="No hay tareas"
            description="No se encontraron tareas para este proyecto. Crea la primera tarea para comenzar."
            action={
              <Button onClick={handleAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Tarea
              </Button>
            }
          />
        ) : (
          <Table
            data={filteredTasks}
            columns={columns}
            showSearch={false}
            searchPlaceholder="Buscar tareas..."
            actions={[
              {
                label: 'Editar',
                icon: Edit,
                onClick: handleEditTask,
                variant: 'ghost' as const,
                size: 'sm' as const
              },
              {
                label: 'Eliminar',
                icon: Trash2,
                onClick: (task: any) => {
                  showDeleteConfirmation({
                    title: "Eliminar Tarea",
                    description: "¿Estás seguro de que deseas eliminar esta tarea del proyecto?",
                    itemName: task.task.processed_display_name || task.task.display_name || 'Tarea',
                    onConfirm: () => handleDeleteTask(task.id)
                  })
                },
                variant: 'ghost' as const,
                size: 'sm' as const
              }
            ]}
          />
        )}
      </div>
    </Layout>
  )
}