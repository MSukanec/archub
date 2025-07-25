import { useState, useMemo, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Plus, CheckSquare, Calendar, MapPin, User } from 'lucide-react'
import { BudgetTable } from '@/components/ui-custom/BudgetTable'
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

  // Procesar los nombres de las tareas adaptadas al formato de BudgetTable
  const processedTasks = useMemo(() => {
    if (!tasks.length) return []
    
    return tasks.map((task) => ({
      id: task.id,
      budget_id: '', // No aplica para construction tasks
      task_id: task.task?.task_id || '',
      organization_id: task.organization_id || '',
      project_id: task.project_id || '',
      created_at: task.created_at || '',
      updated_at: task.updated_at || '',
      task: task.task ? {
        task_instance_id: task.id,
        project_id: task.project_id || '',
        task_id: task.task.task_id || '',
        task_code: task.task.code || '',
        start_date: task.start_date,
        end_date: task.end_date,
        duration_in_days: task.duration_in_days,
        quantity: task.quantity || 0,
        phase_instance_id: task.phase_instance_id || '',
        phase_name: task.phase_name || '',
        phase_position: 0,
        progress_percent: task.progress_percent || 0,
        unit_id: task.task.unit_id || '',
        unit_name: task.task.unit_name || '',
        unit_symbol: task.task.unit_symbol || '',
        display_name: task.task.display_name || task.task.code || 'Tarea sin nombre',
        subcategory_id: task.task?.id || '',
        subcategory_name: task.task?.category_name || '',
        category_id: task.task?.id || '',
        category_name: task.task.category_name || '',
        rubro_id: task.task.rubro_id || '',
        rubro_name: task.task.rubro_name || '',
        task_group_id: '',
        task_group_name: ''
      } : null
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

  const handleDeleteTask = (taskId: string) => {
    if (!projectId || !organizationId) return

    // Encontrar la tarea para obtener su nombre
    const task = processedTasks.find(t => t.id === taskId)
    const taskName = task?.task?.display_name || 'Tarea sin nombre'

    openModal('delete-confirmation', {
      mode: 'simple',
      title: 'Eliminar Tarea',
      description: `¿Estás seguro que deseas eliminar la tarea "${taskName}"? Esta acción no se puede deshacer.`,
      itemName: taskName,
      destructiveActionText: 'Eliminar Tarea',
      onDelete: () => deleteTask.mutate({
        id: taskId,
        project_id: projectId,
        organization_id: organizationId
      }),
      isLoading: deleteTask.isPending
    })
  }

  // Filtrar tareas según búsqueda
  const filteredTasks = useMemo(() => {
    if (!searchValue.trim()) return processedTasks
    
    return processedTasks.filter(task =>
      task.task?.display_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.task?.rubro_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.task?.task_code?.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.task?.phase_name?.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [processedTasks, searchValue])

  // Función para generar el nombre completo de la tarea
  const generateTaskDisplayName = (task: any, parameterValues: any[] = []): string => {
    if (!task) return 'Sin nombre';
    
    // Usar display_name que ya fue procesado
    return task.display_name || task.task_code || task.name || 'Sin nombre';
  }







  const headerProps = {
    title: "Listado de Tareas"
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando tareas...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
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
      />

      {/* Table or Empty State */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="No hay tareas en el proyecto"
          description="Comienza creando la primera tarea de construcción para organizar el trabajo del proyecto."
        />
      ) : (
        <BudgetTable
          tasks={processedTasks}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          selectedTasks={[]}
          onSelectedTasksChange={() => {}}
          groupingType={groupingType}
          onGroupingChange={setGroupingType}
          searchValue={searchValue}
          isLoading={isLoading}
        />
      )}
    </Layout>
  )
}