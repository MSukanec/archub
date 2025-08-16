import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Plus, CheckSquare, Calendar } from 'lucide-react'
import { useConstructionTasks, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useConstructionProjectPhases, useUpdatePhasePositions } from '@/hooks/use-construction-phases'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useNavigationStore } from '@/stores/navigationStore'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'

// Import tab components
import { TaskListView } from './tabs/TaskListView'
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
  const { toast } = useToast()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [setSidebarContext])

  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.preferences?.last_organization_id

  const { data: tasks = [], isLoading } = useConstructionTasks(
    projectId || '', 
    organizationId || ''
  )

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
          <TaskListView
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