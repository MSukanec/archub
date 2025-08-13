import { useState, useMemo, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, CheckSquare, Settings } from 'lucide-react'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useConstructionTasks, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useConstructionProjectPhases, useUpdatePhasePositions } from '@/hooks/use-construction-phases'
import { PhaseOrderManager } from '@/components/construction/PhaseOrderManager'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useNavigationStore } from '@/stores/navigationStore'
import ConstructionTaskCard from '@/components/cards/ConstructionTaskCard'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { TaskMaterialsPopover } from '@/components/construction/TaskMaterialsPopover'
import TaskMaterialsSubtotal from '@/components/construction/TaskMaterialsSubtotal'
import TaskLaborCost from '@/components/construction/TaskLaborCost'
import TaskLaborSubtotal from '@/components/construction/TaskLaborSubtotal'
import TaskTotalSubtotal from '@/components/construction/TaskTotalSubtotal'

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
  const { toast } = useToast()

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

  // Debug logs removed to clean console

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

  const handleViewMaterialDetails = (task: any) => {
    // TODO: Implementar modal de detalle de materiales
    console.log('Ver detalle de materiales para tarea:', task);
    // openModal('task-material-details', { task })
  }

  const handleEditPhase = (phase: any) => {
    openModal('construction-phase', {
      projectId,
      organizationId,
      editingPhase: {
        project_phase_id: phase.project_phase_id,
        phase_id: phase.id,
        position: phase.position,
        phase: {
          name: phase.name,
          description: '' // Por ahora vacío, se podría obtener de la base de datos si es necesario
        }
      },
      isEditing: true
    })
  }

  const handleDeletePhase = (phaseId: string) => {
    const phase = projectPhases.find(p => p.project_phase_id === phaseId)
    const phaseName = phase?.name || 'Fase'
    
    openModal('delete-confirmation', {
      mode: 'simple',
      title: "Eliminar fase",
      description: "¿Estás seguro de que deseas eliminar esta fase del proyecto?",
      itemName: phaseName,
      itemType: "fase",
      destructiveActionText: "Eliminar",
      onConfirm: async () => {
        try {
          if (!supabase) throw new Error('Supabase not initialized')
          
          // Eliminar la fase del proyecto (construction_project_phases)
          const { error } = await supabase
            .from('construction_project_phases')
            .delete()
            .eq('id', phaseId)
          
          if (error) {
            console.error('Error eliminando fase:', error)
            throw error
          }
          
          // Invalidar cache para actualizar la vista
          queryClient.invalidateQueries({ 
            queryKey: ['construction-project-phases', projectId] 
          })
          queryClient.invalidateQueries({ 
            queryKey: ['construction-tasks', projectId] 
          })
          
          toast({
            title: "Fase eliminada",
            description: "La fase ha sido eliminada correctamente."
          })
        } catch (error) {
          console.error('Error:', error)
          toast({
            title: "Error al eliminar",
            description: "No se pudo eliminar la fase. Inténtalo de nuevo.",
            variant: "destructive"
          })
        }
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
      key: 'quantity_with_unit',
      label: 'Cantidad',
      render: (task: any) => {
        const quantity = task.quantity || 0;
        const unit = task.task?.unit_symbol || '';
        return unit ? `${quantity} ${unit}` : quantity.toString();
      },
      width: '8%'
    },
    {
      key: 'labor_cost',
      label: 'Costo Mo.',
      render: (task: any) => (
        <div className="text-center">
          <TaskLaborCost task={task} />
        </div>
      ),
      width: '8%',
      sortable: false
    },
    {
      key: 'labor_subtotal',
      label: 'Subt. Mo.',
      render: (task: any) => (
        <div className="text-center">
          <TaskLaborSubtotal task={task} />
        </div>
      ),
      width: '8%',
      sortable: false
    },
    {
      key: 'material_details',
      label: 'Costo Mat.',
      render: (task: any) => (
        <div className="flex items-center justify-center gap-2">
          <TaskMaterialsPopover task={task} showCost={true} />
        </div>
      ),
      width: '8%',
      sortable: false
    },
    {
      key: 'material_subtotal',
      label: 'Subt. Mat.',
      render: (task: any) => (
        <div className="text-center">
          <TaskMaterialsSubtotal task={task} />
        </div>
      ),
      width: '8%',
      sortable: false
    },
    {
      key: 'total_subtotal',
      label: 'Subtotal',
      render: (task: any) => (
        <div className="text-center">
          <TaskTotalSubtotal task={task} />
        </div>
      ),
      width: '10%',
      sortable: false
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
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTask(task.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: '10%',
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
    // Para sin agrupar, usar todas las columnas base
    if (groupingType === 'none') {
      return baseColumns;
    }
    
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

  // Crear tabs para el header
  const headerTabs = [
    {
      id: "tasks",
      label: "Tareas",
      isActive: activeTab === "tasks"
    },
    {
      id: "phases", 
      label: "Fases",
      isActive: activeTab === "phases"
    }
  ]

  const headerProps = {
    title: "Listado de Tareas",
    tabs: headerTabs,
    onTabChange: setActiveTab,
    actionButton: activeTab === "tasks" ? {
      label: "Agregar Tarea",
      icon: Plus,
      onClick: handleAddSingleTask,
      additionalButton: {
        label: "Agregar en Masa",
        icon: Plus,
        onClick: handleAddTask,
        variant: "ghost"
      }
    } : {
      label: "Crear Fase",
      icon: Plus,
      onClick: handleAddPhase
    }
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
      <div>
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
              groupBy={groupingType === 'none' ? undefined : 'groupKey'}
              topBar={{
                tabs: ['Sin Agrupar', 'Por Fases', 'Por Rubros', 'Por Tareas', 'Por Fases y Rubros', 'Por Rubros y Tareas'],
                activeTab: groupingType === 'none' ? 'Sin Agrupar' : 
                          groupingType === 'phases' ? 'Por Fases' :
                          groupingType === 'rubros' ? 'Por Rubros' :
                          groupingType === 'tasks' ? 'Por Tareas' :
                          groupingType === 'rubros-phases' ? 'Por Fases y Rubros' : 'Por Rubros y Tareas',
                onTabChange: (tab: string) => {
                  if (tab === 'Sin Agrupar') setGroupingType('none')
                  else if (tab === 'Por Fases') setGroupingType('phases')
                  else if (tab === 'Por Rubros') setGroupingType('rubros')
                  else if (tab === 'Por Tareas') setGroupingType('tasks')
                  else if (tab === 'Por Fases y Rubros') setGroupingType('rubros-phases')
                  else setGroupingType('phases-rubros')
                }
              }}
              renderCard={(task: any) => (
                <ConstructionTaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={(taskToDelete) => handleDeleteTask(taskToDelete.id)}
                />
              )}
              renderGroupHeader={groupingType === 'none' ? undefined : (groupKey: string, groupRows: any[]) => {
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
                      <div className="col-span-1">{totalQuantity.toFixed(2)}</div> {/* Cantidad total */}
                    </>
                  );
                } else {
                  return (
                    <>
                      <div className="col-span-full text-sm font-medium">
                        {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Tarea' : 'Tareas'})
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