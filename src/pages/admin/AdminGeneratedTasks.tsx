import { useState } from 'react'
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
import { CustomTable } from '@/components/ui-custom/misc/CustomTable'
import { NewAdminGeneratedTaskModal } from '@/modals/admin/tasks/NewAdminGeneratedTaskModal'
import { useGeneratedTasks, useDeleteGeneratedTask } from '@/hooks/use-generated-tasks'
import { useTaskTemplates, useTaskTemplateParameters, useTaskTemplateParameterOptions } from '@/hooks/use-task-templates'
import { generateTaskDescription } from '@/utils/taskDescriptionGenerator'
import { useAllTaskParameterValues } from '@/hooks/use-task-parameters-admin'

import { Plus, Edit, Trash2, CheckSquare, Clock, Target, Zap } from 'lucide-react'

interface GeneratedTask {
  id: string
  code: string
  template_id: string
  param_values: any
  is_public: boolean
  created_at: string
  organization_id: string
  updated_at: string
  scope: string
  // Related data for dynamic name generation
  task_templates?: {
    id: string
    name_template: string
    code: string
    category_id: string
  }
}

export default function AdminGeneratedTasks() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [newGeneratedTaskModalOpen, setNewGeneratedTaskModalOpen] = useState(false)
  const [editingGeneratedTask, setEditingGeneratedTask] = useState<GeneratedTask | null>(null)
  const [deletingGeneratedTask, setDeletingGeneratedTask] = useState<GeneratedTask | null>(null)

  // Real data from useGeneratedTasks hook
  const { data: generatedTasks = [], isLoading } = useGeneratedTasks()
  const deleteGeneratedTaskMutation = useDeleteGeneratedTask()

  // Data for dynamic name generation
  const { data: templates = [] } = useTaskTemplates()
  const { data: parameterValues = [] } = useAllTaskParameterValues()

  // Helper function to generate dynamic task name
  const generateTaskName = (task: GeneratedTask): string => {
    console.log('Table generateTaskName - Called with task:', task)
    console.log('Table generateTaskName - Available parameterValues:', parameterValues)
    console.log('Table generateTaskName - First parameterValue structure:', parameterValues[0])
    
    const template = templates.find(t => t.id === task.template_id)
    if (!template) return 'Sin plantilla'

    // Start with the template
    let result = template.name_template
    console.log('Table generateTaskName - Template name_template:', result)

    // Replace placeholders with proper expression template values
    if (task.param_values) {
      Object.entries(task.param_values).forEach(([paramName, paramValue]) => {
        // Find the parameter value option by name (value stored in param_values)
        const parameterOption = parameterValues.find(pv => pv.name === paramValue)
        
        console.log('Table generateTaskName - Looking for param:', paramName, 'value:', paramValue)
        console.log('Table generateTaskName - Found option:', parameterOption)
        console.log('Table generateTaskName - Found option has expression_template:', parameterOption?.expression_template)
        
        if (parameterOption) {
          // Use the expression template to format the value
          const expressionTemplate = parameterOption.expression_template || '{value}'
          const fragment = expressionTemplate.replace('{value}', parameterOption.label)
          
          console.log('Table generateTaskName - Using expression_template:', expressionTemplate)
          console.log('Table generateTaskName - Generated fragment:', fragment)
          
          // Replace placeholder in name_template
          const placeholder = `{{${paramName}}}`
          result = result.replace(placeholder, fragment)
        } else {
          // Fallback to raw value if parameter option not found
          const placeholder = `{{${paramName}}}`
          result = result.replace(placeholder, paramValue as string)
        }
      })
    }

    return result
  }

  // Statistics calculations
  const totalGeneratedTasks = generatedTasks.length
  const publicTasks = generatedTasks.filter(task => task.is_public).length
  const privateTasks = generatedTasks.filter(task => !task.is_public).length
  const recentGeneratedTasks = generatedTasks.filter((task: any) => {
    const taskDate = new Date(task.created_at)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return taskDate >= sevenDaysAgo
  }).length

  // Filter and sort generated tasks
  const filteredGeneratedTasks = generatedTasks
    .filter((task: any) =>
      task.code?.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchValue.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortBy === 'code') {
        return a.code?.localeCompare(b.code) || 0
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleEdit = (generatedTask: GeneratedTask) => {
    setEditingGeneratedTask(generatedTask)
    setNewGeneratedTaskModalOpen(true)
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
  }

  // Table columns configuration
  const columns = [
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      width: '5%',
      render: (task: GeneratedTask) => (
        <span className="text-xs">
          {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: es })}
        </span>
      )
    },
    {
      key: 'code',
      label: 'Código',
      width: '10%',
      render: (task: GeneratedTask) => (
        <span className="text-sm font-medium">{task.code}</span>
      )
    },
    {
      key: 'name',
      label: 'Tarea',
      render: (task: GeneratedTask) => (
        <span className="text-sm">{generateTaskName(task)}</span>
      )
    },
    {
      key: 'is_public',
      label: 'Visibilidad',
      width: '5%',
      render: (task: GeneratedTask) => (
        <Badge variant={task.is_public ? "default" : "secondary"} className="text-xs">
          {task.is_public ? 'Pública' : 'Privada'}
        </Badge>
      )
    },

    {
      key: 'actions',
      label: 'Acciones',
      width: '5%',
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

  const customFilters = (
    <div className="w-[288px] space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Fecha de creación</SelectItem>
            <SelectItem value="code">Código</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const headerProps = {
    title: 'Gestión de Tareas Generadas',
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: clearFilters,
    actions: [
      <Button
        key="new-generated-task"
        onClick={() => {
          setEditingGeneratedTask(null)
          setNewGeneratedTaskModalOpen(true)
        }}
        size="sm"
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Nueva Tarea Generada
      </Button>
    ]
  }

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Tareas Generadas</p>
                <p className="text-lg font-semibold">{totalGeneratedTasks}</p>
              </div>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tareas Públicas</p>
                <p className="text-lg font-semibold">{publicTasks}</p>
              </div>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tareas Privadas</p>
                <p className="text-lg font-semibold">{privateTasks}</p>
              </div>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Nuevas (7 días)</p>
                <p className="text-lg font-semibold">{recentGeneratedTasks}</p>
              </div>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Generated Tasks Table */}
        <CustomTable
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

      <NewAdminGeneratedTaskModal
        open={newGeneratedTaskModalOpen}
        onClose={() => {
          setNewGeneratedTaskModalOpen(false)
          setEditingGeneratedTask(null)
        }}
        generatedTask={editingGeneratedTask}
      />

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