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
import { EstimateList } from './tabs/EstimateList.tsx'
import { EstimatePhases } from './tabs/EstimatePhases.tsx'
import { EstimateSchedule } from './tabs/EstimateSchedule.tsx'

export default function Estimates() {
  const [activeTab, setActiveTab] = useState("tasks")
  
  const { data: userData } = useCurrentUser()
  const { selectedProjectId, currentOrganizationId } = useProjectContext()
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
        label: activeTab === 'tasks' ? 'Nuevo Cómputo' : activeTab === 'phases' ? 'Nueva Fase' : 'Crear',
        onClick: () => {
          if (activeTab === 'tasks') {
            handleAddSingleTask()
          } else if (activeTab === 'phases') {
            handleAddPhase()
          }
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

    // Configure filters based on active tab
    const filterConfig = activeTab === 'tasks' ? {
      title: 'Filtros de Cómputos',
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
  }, [isMobile, activeTab]) // Solo dependencias primitivas



  // Crear tabs para el header
  const headerTabs = [
    {
      id: "tasks",
      label: "Cómputos",
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
    title: "Listado de Cómputos",
    icon: CheckSquare,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    actionButton: activeTab === "tasks" ? {
      label: "Agregar Cómputo",
      icon: Plus,
      onClick: handleAddSingleTask
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
          <div className="text-muted-foreground">Cargando cómputos...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div>
        {activeTab === "tasks" && (
          <EstimateList
            tasks={tasks}
            isLoading={isLoading}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        
        {activeTab === "phases" && (
          <EstimatePhases
            projectPhases={projectPhases}
            onReorder={handleReorderPhases}
            onEdit={handleEditPhase}
            onDelete={handleDeletePhase}
            isUpdating={updatePhasePositions.isPending}
          />
        )}
        
        {activeTab === "schedule" && (
          <EstimateSchedule />
        )}
      </div>
    </Layout>
  )
}