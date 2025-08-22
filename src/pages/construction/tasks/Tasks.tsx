import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Plus, CheckSquare, Calendar, Home, Search, Filter, Bell } from 'lucide-react'
import { useConstructionTasks, useConstructionTasksView, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useConstructionProjectPhases, useUpdatePhasePositions } from '@/hooks/use-construction-phases'
import { useCurrentUser } from '@/hooks/use-current-user'
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
import { TaskList } from './tabs/TaskList'
import { TaskPhases } from './tabs/TaskPhases'
import { TaskSchedule } from './tabs/TaskSchedule'

export default function Tasks() {
  const [activeTab, setActiveTab] = useState("tasks")
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const deleteTask = useDeleteConstructionTask()
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

  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.preferences?.last_organization_id

  // Usar la misma fuente que el cronograma para consistencia
  const { data: tasksView = [], isLoading } = useConstructionTasksView(projectId || '', organizationId || '')
  
  // Transformar las tareas de la vista para que sean compatibles con el componente TaskList
  const tasks = tasksView.map(task => ({
    id: task.id,
    project_id: task.project_id,
    task_id: task.task_id,
    quantity: task.quantity,
    created_at: task.created_at,
    updated_at: task.updated_at,
    phase_name: task.phase_name,
    category_name: task.category_name, // Pasar directamente desde la vista
    custom_name: task.custom_name, // Pasar directamente desde la vista
    unit: task.unit, // Pasar directamente desde la vista
    task: {
      id: task.task_id,
      code: task.task_id, // Usar task_id como code por compatibilidad
      display_name: task.custom_name,
      category_name: task.category_name,
      unit_name: task.unit,
      rubro_name: null, // No disponible en la vista
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

  // Stable callbacks para evitar dependencias infinitas
  const handleNavigateHome = useCallback(() => {
    navigate('/dashboard')
  }, [navigate])

  const handleCreateAction = useCallback(() => {
    if (activeTab === 'tasks') {
      handleAddSingleTask()
    } else if (activeTab === 'phases') {
      handleAddPhase()
    }
  }, [activeTab, handleAddSingleTask, handleAddPhase])

  // Mobile action bar configuration
  useEffect(() => {
    if (!isMobile) return

    const actions = {
      home: {
        id: 'home',
        icon: <Home className="h-6 w-6 text-gray-600 dark:text-gray-400" />,
        label: 'Inicio',
        onClick: handleNavigateHome,
      },
      search: {
        id: 'search',
        icon: <Search className="h-5 w-5" />,
        label: 'Buscar',
        onClick: () => {
          // Popover is handled in MobileActionBar
        },
      },
      create: {
        id: 'create',
        icon: <Plus className="h-6 w-6" />,
        label: activeTab === 'tasks' ? 'Nueva Tarea' : activeTab === 'phases' ? 'Nueva Fase' : 'Crear',
        onClick: handleCreateAction,
        variant: 'primary' as const
      },
      filter: {
        id: 'filter',
        icon: <Filter className="h-5 w-5" />,
        label: 'Filtros',
        onClick: () => {
          // Popover is handled in MobileActionBar
        },
      },
      notifications: {
        id: 'notifications',
        icon: <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />,
        label: 'Notificaciones',
        onClick: () => {
          // Popover is handled in MobileActionBar
        },
      },
    }
    
    setActions(actions)
    setShowActionBar(true)

    // Configure filters based on active tab
    const filterConfig = activeTab === 'tasks' ? {
      title: 'Filtros de Tareas',
      filters: [
        {
          key: 'phase',
          label: 'Fase',
          type: 'select' as const,
          options: projectPhases.map(phase => ({ value: phase.id, label: phase.name })),
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
    } : {
      title: 'Filtros de Fases',
      filters: [
        {
          key: 'status',
          label: 'Estado',
          type: 'select' as const,
          options: [
            { value: 'active', label: 'Activa' },
            { value: 'completed', label: 'Completada' },
            { value: 'pending', label: 'Pendiente' }
          ],
          value: '',
          placeholder: 'Todos los estados'
        }
      ],
      onApplyFilters: (filters: any) => console.log('Applied phase filters:', filters),
      onClearFilters: () => console.log('Cleared phase filters')
    }
    
    setFilterConfig(filterConfig)

    return () => {
      clearActions()
    }
  }, [isMobile, activeTab, handleNavigateHome, handleCreateAction, projectPhases, setActions, setShowActionBar, setFilterConfig, clearActions])



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
    },
    {
      id: "schedule", 
      label: "Cronograma",
      isActive: activeTab === "schedule"
    }
  ]

  const headerProps = {
    title: "Listado de Tareas",
    icon: CheckSquare,
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
    } : activeTab === "phases" ? {
      label: "Crear Fase",
      icon: Plus,
      onClick: handleAddPhase
    } : undefined
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
        {activeTab === "tasks" && (
          <TaskList
            tasks={tasks}
            isLoading={isLoading}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        
        {activeTab === "phases" && (
          <TaskPhases
            projectPhases={projectPhases}
            onReorder={handleReorderPhases}
            onEdit={handleEditPhase}
            onDelete={handleDeletePhase}
            isUpdating={updatePhasePositions.isPending}
          />
        )}
        
        {activeTab === "schedule" && (
          <TaskSchedule />
        )}
      </div>
    </Layout>
  )
}