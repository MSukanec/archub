import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Plus, CheckSquare, Calendar, Home, Search, Filter, Bell } from 'lucide-react'
import { useConstructionTasks, useConstructionTasksView, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useConstructionProjectPhases, useUpdatePhasePositions } from '@/hooks/use-construction-phases'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useNavigationStore } from '@/stores/navigationStore'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'

// Import tab components  
import { BudgetItems } from './BudgetItemTab'
import { EstimatePhases } from './EstimatePhases'
import { EstimateSchedule } from './EstimateSchedule'
import { useCreateConstructionTask } from '@/hooks/use-construction-tasks'

export default function Budgets() {
  const [activeTab, setActiveTab] = useState('listado-tareas')
  
  const { data: userData } = useCurrentUser()
  const { selectedProjectId, currentOrganizationId } = useProjectContext()
  const { openModal } = useGlobalModalStore()
  const deleteTask = useDeleteConstructionTask()
  const createTask = useCreateConstructionTask()
  const updatePhasePositions = useUpdatePhasePositions()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { setSidebarContext } = useNavigationStore()
  const { setActions, clearActions, setFilterConfig, setShowActionBar } = useActionBarMobile()
  const isMobile = useMobile()
  const [, navigate] = useLocation()
  const { toast } = useToast()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [setSidebarContext])

  // Usar ProjectContext como fuente única de verdad para org/project IDs
  const projectId = selectedProjectId
  const organizationId = currentOrganizationId

  // Usar la misma fuente que el cronograma para consistencia
  const { data: tasksView = [], isLoading } = useConstructionTasksView(projectId || '', organizationId || '')
  
  // Transformar las tareas de la vista para que sean compatibles con el componente EstimateList
  const tasks = tasksView.map(task => ({
    id: task.id,
    project_id: task.project_id,
    task_id: task.task_id,
    quantity: task.quantity,
    cost_scope: task.cost_scope, // ¡AGREGADO!
    cost_scope_label: task.cost_scope_label, // ¡AGREGADO!
    margin: task.markup_pct || 0, // Mapear markup_pct a margin
    created_at: task.created_at,
    updated_at: task.updated_at,
    phase_name: task.phase_name,
    category_name: task.category_name, // Pasar directamente desde la vista
    division_name: task.division_name, // ¡ESTE CAMPO FALTABA! 
    custom_name: task.custom_name, // Pasar directamente desde la vista
    unit: task.unit, // Pasar directamente desde la vista
    description: task.description, // ¡CAMPO DESCRIPTION FALTABA!
    task: {
      id: task.task_id,
      code: task.task_id, // Usar task_id como code por compatibilidad
      display_name: task.custom_name,
      category_name: task.category_name,
      unit_name: task.unit,
      rubro_name: task.division_name, // Ahora sí disponible en la vista
    }
  }))

  const { data: projectPhases = [] } = useConstructionProjectPhases(projectId || '')

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

  const handleAddBudget = () => {
    if (!projectId || !organizationId || !userData?.user?.id) {
      console.error('Missing required data for budget creation')
      return
    }

    openModal('budget', {
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

  const handleDuplicateTask = (task: any) => {
    if (!projectId || !organizationId || !userData?.user?.id) {
      console.error('Missing required data for task duplication')
      return
    }

    // Duplicar la tarea con los mismos datos pero nueva instancia
    createTask.mutate({
      organization_id: organizationId,
      project_id: projectId,
      task_id: task.task_id, // Usar el mismo task_id para duplicar
      quantity: task.quantity || 1,
      created_by: userData.user.id,
      project_phase_id: "", // No asignar fase inicialmente
      description: task.description || ""
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
      projectId,
      organizationId,
      editingPhase: {
        project_phase_id: phase.project_phase_id,
        phase_id: phase.id,
        position: phase.position,
        phase: {
          name: phase.name,
          description: ''
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
          
          const { error } = await supabase
            .from('construction_project_phases')
            .delete()
            .eq('id', phaseId)
          
          if (error) {
            console.error('Error eliminando fase:', error)
            throw error
          }
          
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

  // Mobile action bar configuration
  useEffect(() => {
    if (!isMobile) return

    const actions = {
      search: {
        id: 'search',
        icon: Search,
        label: 'Buscar',
        onClick: () => {
          // Popover is handled in MobileActionBar
        },
      },
      create: {
        id: 'create',
        icon: Plus,
        label: 'Nuevo Presupuesto',
        onClick: () => {
          handleAddBudget()
        },
        variant: 'primary' as const
      },
      filter: {
        id: 'filter',
        icon: Filter,
        label: 'Filtros',
        onClick: () => {
          // Popover is handled in MobileActionBar
        },
      },
      notifications: {
        id: 'notifications',
        icon: Bell,
        label: 'Notificaciones',
        onClick: () => {
          // Popover is handled in MobileActionBar
        },
      },
    }
    
    setActions(actions)
    setShowActionBar(true)

    // Configure filters for task list
    const filterConfig = {
      title: 'Filtros de Tareas',
      filters: [
        {
          key: 'phase',
          label: 'Fase',
          type: 'select' as const,
          options: [],
          value: '',
          placeholder: 'Todas las fases'
        },
        {
          key: 'category',
          label: 'Rubro',
          type: 'select' as const,
          options: [],
          value: '',
          placeholder: 'Todos los rubros'
        }
      ],
      onApplyFilters: (filters: any) => console.log('Applied filters:', filters),
      onClearFilters: () => console.log('Cleared filters')
    }
    
    setFilterConfig(filterConfig)

    return () => {
      clearActions()
    }
  }, [isMobile]) // Solo dependencias primitivas

  // Define tabs
  const tabs = [
    {
      id: 'listado-tareas',
      label: 'Listado de Tareas',
      isActive: activeTab === 'listado-tareas'
    }
  ]


  const headerProps = {
    title: "Cómputos y Presupuestos",
    icon: CheckSquare,
    organizationId,
    showMembers: true,
    showProjectSelector: true,
    tabs: tabs,
    activeTab: activeTab,
    onTabChange: setActiveTab,
    actionButton: {
      label: "Nuevo Presupuesto",
      icon: Plus,
      onClick: handleAddBudget
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
      {activeTab === 'listado-tareas' && (
        <BudgetItems 
          onAddTask={handleAddBudget}
        />
      )}
      
    </Layout>
  )
}