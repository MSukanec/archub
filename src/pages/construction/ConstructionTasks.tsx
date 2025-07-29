import { useState, useMemo, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Plus, CheckSquare, Calendar, MapPin, User, Edit, Trash2, TableIcon, Settings } from 'lucide-react'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useConstructionTasks, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useConstructionProjectPhases, useUpdatePhasePositions } from '@/hooks/use-construction-phases'
import { PhaseOrderManager } from '@/components/construction/PhaseOrderManager'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useNavigationStore } from '@/stores/navigationStore'
import ConstructionTaskCard from '@/components/cards/ConstructionTaskCard'

export default function ConstructionTasks() {
  const [searchValue, setSearchValue] = useState("")
  const [activeTab, setActiveTab] = useState("tasks")
  const [groupingType, setGroupingType] = useState('phases')
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const deleteTask = useDeleteConstructionTask()
  const updatePhasePositions = useUpdatePhasePositions()
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
        case 'tasks':
          groupKey = task.task?.display_name || 'Sin nombre';
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

  const handleAddSingleTask = () => {
    if (!projectId || !organizationId || !userData?.user?.id) {
      console.error('Missing required data for single task creation')
      return
    }

    openModal('construction-single-task', {
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
    openModal('construction-single-task', {
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

  const handleEditPhase = (phase: any) => {
    openModal('construction-phase', {
      data: {
        id: phase.project_phase_id,
        phase_id: phase.id,
        position: phase.position
      },
      projectId,
      isEditing: true
    })
  }

  const handleDeletePhase = (phaseId: string) => {
    const phase = projectPhases.find(p => p.project_phase_id === phaseId)
    const phaseName = phase?.name || 'Fase'
    
    showDeleteConfirmation({
      title: "Eliminar fase",
      description: "¿Estás seguro de que deseas eliminar esta fase del proyecto?",
      itemName: phaseName, 
      onConfirm: async () => {
        // TODO: Implementar eliminación de fase
        console.log('Delete phase:', phaseId)
      }
    })
  }

  const handleReorderPhases = (reorderedPhases: any[]) => {
    if (!projectId) return
    
    updatePhasePositions.mutate({
      projectId,
      phases: reorderedPhases
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



  // Definir columnas para la tabla de fases
  const phaseColumns = [
    {
      key: 'position',
      label: 'Posición',
      render: (phase: any) => phase.position,
      width: '10%'
    },
    {
      key: 'name',
      label: 'Nombre de Fase',
      render: (phase: any) => phase.name || 'Sin nombre',
      width: 'auto' // El resto del espacio disponible
    },
    {
      key: 'task_count',
      label: 'Tareas',
      render: (phase: any) => {
        // Contar tareas que pertenecen a esta fase
        const taskCount = tasks.filter(task => task.phase_name === phase.name).length;
        return taskCount;
      },
      width: '10%'
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (phase: any) => (
        <div className="flex gap-1 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditPhase(phase)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeletePhase(phase.project_phase_id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: '10%',
      sortable: false
    }
  ]

  // Para agrupación por tarea, simplemente usar filteredTasks con groupKey
  const finalTasks = useMemo(() => {
    return filteredTasks;
  }, [filteredTasks]);

  // Definir columnas específicas para agrupación por rubros y tareas (sin columna RUBRO)
  const taskGroupingColumns = [
    {
      key: 'phase',
      label: 'Fase',
      render: (task: any) => task.phase_name || 'Sin fase',
      width: 'auto' // Máximo espacio posible
    },
    {
      key: 'unit',
      label: 'Unidad',
      render: (task: any) => task.task?.unit_symbol || 'Sin unidad',
      width: '10%'
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      render: (task: any) => task.quantity || 0,
      width: '10%'
    }
  ]

  // Seleccionar columnas según el tipo de agrupación  
  const columns = useMemo(() => {
    // Para agrupación por tareas, usar columnas específicas sin acciones y reordenadas
    if (groupingType === 'tasks') {
      return taskGroupingColumns;
    }
    
    // Filtrar columnas base para otros tipos de agrupación
    return baseColumns.filter(column => {
      if (groupingType === 'rubros' && column.key === 'rubro_name') return false;
      if (groupingType === 'phases' && column.key === 'phase') return false;
      if (groupingType === 'rubros-phases' && (column.key === 'rubro_name' || column.key === 'phase')) return false;
      if (groupingType === 'phases-rubros' && (column.key === 'rubro_name' || column.key === 'phase')) return false;
      return true;
    });
  }, [groupingType]);

  if (isLoading) {
    return (
      <Layout wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando tareas...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout wide={true}>
      <div className="space-y-6">
        {/* Action Bar Desktop */}
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
          primaryActionLabel={activeTab === "tasks" ? "Agregar Tarea" : "Crear Fase"}
          onPrimaryActionClick={activeTab === "tasks" ? handleAddSingleTask : handleAddPhase}
          secondaryActionLabel={activeTab === "tasks" ? "Agregar Tareas en Masa" : undefined}
          onSecondaryActionClick={activeTab === "tasks" ? handleAddTask : undefined}
          tabs={[
            {
              value: "tasks",
              label: "Tareas",
              icon: <TableIcon className="h-4 w-4" />
            },
            {
              value: "phases",
              label: "Fases",
              icon: <Settings className="h-4 w-4" />
            }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        {activeTab === "tasks" ? (
          // Tab Tareas - Contenido actual
          tasks.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="h-8 w-8" />}
              title="No hay tareas en el proyecto"
              description="Comienza creando la primera fase y sus tareas de construcción para organizar el trabajo del proyecto."
            />
          ) : (
            <Table
              columns={columns}
              data={finalTasks}
              isLoading={isLoading}
              mode="construction"
              groupBy={'groupKey'}
              renderCard={(task: any) => (
                <ConstructionTaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={(taskToDelete) => handleDeleteTask(taskToDelete.id)}
                />
              )}
              renderGroupHeader={(groupKey: string, groupRows: any[]) => {
                if (groupingType === 'tasks') {
                  // Para agrupación por rubros y tareas, calcular suma de cantidades
                  const totalQuantity = groupRows.reduce((sum, row) => sum + (row.quantity || 0), 0);
                  const unitSymbol = groupRows[0]?.task?.unit_symbol || '';
                  const rubroName = groupRows[0]?.task?.rubro_name || '';
                  
                  return (
                    <>
                      <div className="col-span-1 truncate">
                        {rubroName} - {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'fase' : 'fases'})
                      </div>
                      <div className="col-span-1">{unitSymbol}</div> {/* Unidad */}
                      <div className="col-span-1">{totalQuantity}</div> {/* Cantidad total */}
                    </>
                  );
                } else {
                  return (
                    <>
                      <div className="col-span-full text-sm font-medium">
                        {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'instancia' : 'instancias'})
                      </div>
                    </>
                  );
                }
              }}
              emptyState={
                <EmptyState
                  icon={<CheckSquare className="h-8 w-8" />}
                  title="No hay tareas que coincidan"
                  description="Intenta cambiar los filtros de búsqueda para encontrar las tareas que buscas."
                />
              }
            />
          )
        ) : (
          // Tab Fases - Drag & Drop Phase Manager
          projectPhases.length === 0 ? (
            <EmptyState
              icon={<Settings className="h-8 w-8" />}
              title="No hay fases en el proyecto"
              description="Comienza creando la primera fase del proyecto para organizar las tareas por etapas."
            />
          ) : (
            <PhaseOrderManager
              phases={projectPhases}
              onReorder={handleReorderPhases}
              onEdit={handleEditPhase}
              onDelete={handleDeletePhase}
              isUpdating={updatePhasePositions.isPending}
            />
          )
        )}
      </div>
    </Layout>
  )
}