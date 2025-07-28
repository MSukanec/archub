import { useState, useMemo, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Plus, CheckSquare, Calendar, MapPin, User, Edit, Trash2 } from 'lucide-react'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useConstructionTasks, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useConstructionProjectPhases } from '@/hooks/use-construction-phases'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useNavigationStore } from '@/stores/navigationStore'

export default function ConstructionTasks() {
  const [searchValue, setSearchValue] = useState("")
  const [groupingType, setGroupingType] = useState('phases')
  
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

  const { data: projectPhases = [] } = useConstructionProjectPhases(projectId || '')

  // Debug: verificar datos de tareas
  console.log('ConstructionTasks - projectId:', projectId)
  console.log('ConstructionTasks - organizationId:', organizationId)
  console.log('ConstructionTasks - tasks data:', tasks)
  console.log('ConstructionTasks - tasks length:', tasks.length)

  // Filtrar tareas según búsqueda y agregar groupKey
  const filteredTasks = useMemo(() => {
    let filtered = tasks
    
    if (searchValue.trim()) {
      filtered = tasks.filter(task => {
        const displayName = task.task?.display_name || task.task?.code || ''
        const rubroName = task.task?.rubro_name || ''
        const categoryName = task.task?.category_name || ''
        
        return displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
          rubroName.toLowerCase().includes(searchValue.toLowerCase()) ||
          categoryName.toLowerCase().includes(searchValue.toLowerCase())
      })
    }

    // Agregar groupKey a cada tarea basado en el tipo de agrupación
    return filtered.map(task => {
      let groupKey = 'Sin grupo';
      
      switch (groupingType) {
        case 'rubros':
          groupKey = task.task?.rubro_name || 'Sin rubro';
          break;
        case 'phases':
          groupKey = task.phase_name || 'Sin fase';
          break;
        case 'rubros-phases':
          groupKey = `${task.task?.rubro_name || 'Sin rubro'} - ${task.phase_name || 'Sin fase'}`;
          break;
        case 'phases-rubros':
          groupKey = `${task.phase_name || 'Sin fase'} - ${task.task?.rubro_name || 'Sin rubro'}`;
          break;
        default:
          groupKey = 'Todas las tareas';
      }

      return {
        ...task,
        groupKey
      };
    });
  }, [tasks, searchValue, groupingType])



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
      editingTask: task,
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

  // Definir columnas base para la tabla
  const baseColumns = [
    {
      key: 'phase',
      label: 'Fase',
      render: (task: any) => task.phase_name || 'Sin fase',
      width: '15%'
    },
    {
      key: 'rubro_name',
      label: 'Rubro',
      render: (task: any) => task.task?.rubro_name || 'Sin rubro',
      width: '10%'
    },
    {
      key: 'display_name',
      label: 'Tarea',
      render: (task: any) => task.task?.display_name || task.task?.code || 'Sin nombre',
      width: 'auto' // El resto del espacio disponible (70%)
    },
    {
      key: 'unit',
      label: 'Unidad',
      render: (task: any) => task.task?.unit_symbol || 'Sin unidad',
      width: '5%'
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      render: (task: any) => task.quantity || 0,
      width: '5%'
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
      width: '5%',
      sortable: false
    }
  ]

  // Filtrar columnas según el tipo de agrupación - ocultar columnas agrupadas
  const columns = baseColumns.filter(column => {
    if (groupingType === 'rubros' && column.key === 'rubro_name') return false;
    if (groupingType === 'phases' && column.key === 'phase') return false;
    if (groupingType === 'rubros-phases' && (column.key === 'rubro_name' || column.key === 'phase')) return false;
    if (groupingType === 'phases-rubros' && (column.key === 'rubro_name' || column.key === 'phase')) return false;
    return true;
  });

  if (isLoading) {
    return (
      <Layout headerProps={{ title: "Listado de Tareas" }} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando tareas...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={{ title: "Listado de Tareas" }} wide={true}>
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
          primaryActionLabel="Agregar Tareas en Masa"
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

        {/* Table with phase headers always visible or Empty State */}
        {tasks.length === 0 ? (
          <div className="space-y-4">
            {/* Show phase headers even when empty */}
            {projectPhases.length > 0 ? (
              <div className="space-y-4">
                {projectPhases.map(phase => (
                  <div key={phase.id} className="border rounded-lg">
                    <div className="bg-muted/50 px-4 py-3 border-b">
                      <h3 className="font-medium text-sm text-muted-foreground">
                        {phase.name}
                      </h3>
                    </div>
                    <div className="p-8 text-center text-muted-foreground">
                      <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay tareas en esta fase</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CheckSquare className="h-8 w-8" />}
                title="No hay tareas en el proyecto"
                description="Comienza creando la primera fase y sus tareas de construcción para organizar el trabajo del proyecto."
              />
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredTasks}
            isLoading={isLoading}
            mode="construction"
            groupBy={'groupKey'}
            renderGroupHeader={(groupKey: string, groupRows: any[]) => (
              <>
                <div className="col-span-full text-sm font-medium">
                  {groupKey} ({groupRows.length} tareas)
                </div>
              </>
            )}
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