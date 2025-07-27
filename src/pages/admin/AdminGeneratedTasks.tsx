import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useGeneratedTasks, useDeleteGeneratedTask } from '@/hooks/use-generated-tasks'

import { generateTaskDescription } from '@/utils/taskDescriptionGenerator'
import { useAllTaskParameterValues } from '@/hooks/use-task-parameters-admin'

import { Plus, Edit, Trash2, CheckSquare, Clock, Target, Zap } from 'lucide-react'

interface GeneratedTask {
  id: string
  created_at: string
  updated_at: string
  param_values: any
}

export default function AdminGeneratedTasks() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'user'>('all')
  const { openModal } = useGlobalModalStore()
  const [deletingGeneratedTask, setDeletingGeneratedTask] = useState<GeneratedTask | null>(null)
  const [processedTaskNames, setProcessedTaskNames] = useState<Record<string, string>>({})

  // Real data from useGeneratedTasks hook
  const { data: generatedTasks = [], isLoading } = useGeneratedTasks()
  const deleteGeneratedTaskMutation = useDeleteGeneratedTask()

  // Data for dynamic name generation  
  const { data: parameterValues = [] } = useAllTaskParameterValues()

  // Process task names when data changes
  useEffect(() => {
    const processTaskNames = async () => {
      const newProcessedNames: Record<string, string> = {};
      
      for (const task of generatedTasks) {
        // With the new template-free system, use the task ID 
        newProcessedNames[task.id] = `Tarea ${task.id.slice(0, 8)}`;
      }
      
      setProcessedTaskNames(newProcessedNames);
    };

    if (generatedTasks.length > 0) {
      processTaskNames();
    }
  }, [generatedTasks]);

  // Helper function to get processed task name
  const getProcessedTaskName = (task: GeneratedTask): string => {
    return processedTaskNames[task.id] || `Tarea ${task.id.slice(0, 8)}`;
  }



  // Filter and sort generated tasks
  const filteredGeneratedTasks = generatedTasks
    .filter((task: any) => {
      // Search filter
      const matchesSearch = task.id?.toLowerCase().includes(searchValue.toLowerCase())
      
      // Type filter is removed since task_parametric doesn't have is_system
      
      return matchesSearch
    })
    .sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleEdit = (generatedTask: GeneratedTask) => {
    openModal('parametric-task', { taskData: generatedTask })
  }

  const handleConfirmDelete = async () => {
    if (!deletingGeneratedTask) return

    try {
      console.log('Delete generated task:', deletingGeneratedTask.id)
      deleteGeneratedTaskMutation.mutate(deletingGeneratedTask.id)
      setDeletingGeneratedTask(null)
    } catch (error) {
      console.error('Error al eliminar tarea generada:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea generada. Inténtalo de nuevo.",
        variant: "destructive"
      })
    }
  }

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('created_at')
    setTypeFilter('all')
  }

  // Table columns configuration
  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '20%',
      render: (task: GeneratedTask) => (
        <span className="text-sm font-mono">{task.id.slice(0, 8)}...</span>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      width: '15%',
      render: (task: GeneratedTask) => (
        <span className="text-xs">
          {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: es })}
        </span>
      )
    },
    {
      key: 'param_values',
      label: 'Parámetros',
      render: (task: GeneratedTask) => (
        <span className="text-sm">{Object.keys(task.param_values || {}).length} parámetros</span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (task: GeneratedTask) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(task)}
            className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingGeneratedTask(task)}
            className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ]

  // ActionBar configuration
  const customFilters = (
    <div className="w-[288px] space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Filtrar por tipo</Label>
        <Select value={typeFilter} onValueChange={(value: 'all' | 'system' | 'user') => setTypeFilter(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las tareas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Fecha de creación</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const features = [
    {
      icon: <Target className="w-4 h-4" />,
      title: "Gestión Avanzada de Tareas",
      description: "Administra tareas generadas con parámetros dinámicos y configuraciones personalizables para optimizar los flujos de trabajo."
    },
    {
      icon: <Zap className="w-4 h-4" />,
      title: "Sistema de Plantillas",
      description: "Crea y gestiona plantillas de tareas con parámetros configurables que se adaptan automáticamente a diferentes contextos."
    },
    {
      icon: <CheckSquare className="w-4 h-4" />,
      title: "Control de Visibilidad",
      description: "Administra la visibilidad y alcance de las tareas generadas, controlando qué tareas son públicas o privadas en el sistema."
    },
    {
      icon: <Clock className="w-4 h-4" />,
      title: "Seguimiento Temporal",
      description: "Monitorea la creación y modificación de tareas generadas con métricas detalladas y análisis de tendencias temporales."
    }
  ]

  return (
    <Layout wide>
      <div className="space-y-6">
        {/* ActionBar */}
        <ActionBarDesktop
          title="Gestión de Tareas Generadas"
          icon={<Target className="w-5 h-5" />}
          features={features}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          customFilters={customFilters}
          onClearFilters={clearFilters}
          primaryActionLabel="Nueva Tarea Generada"
          onPrimaryActionClick={() => openModal('parametric-task', {})}
          customActions={[]}
          showProjectSelector={false}
        />



        {/* Generated Tasks Table */}
        <Table
          data={filteredGeneratedTasks}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground">No hay tareas generadas</h3>
              <p className="text-sm text-muted-foreground mt-1">No hay tareas generadas que coincidan con los filtros seleccionados.</p>
            </div>
          }
        />
      </div>

      {/* Modals are now handled by ModalFactory */}

      <AlertDialog open={!!deletingGeneratedTask} onOpenChange={() => setDeletingGeneratedTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea generada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea generada "{deletingGeneratedTask?.code}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}