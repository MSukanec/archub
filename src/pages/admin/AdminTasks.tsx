import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useTasks, useDeleteTask } from '@/hooks/use-tasks'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { Layout } from '@/components/layout/Layout'
import { CustomTable } from '@/components/ui-custom/misc/CustomTable'
import { NewAdminTaskModal } from '@/modals/NewAdminTaskModal'

import { Plus, Edit, Trash2, CheckSquare, Clock, Target } from 'lucide-react'

interface Task {
  id: string
  name: string
  description: string
  organization_id: string
  category_id: string
  subcategory_id: string
  element_category_id: string
  unit_id: string
  action_id: string
  element_id: string
  unit_labor_price: number
  unit_material_price: number
  created_at: string
}

export default function AdminTasks() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  const { data: tasks = [], isLoading } = useTasks()
  const deleteTaskMutation = useDeleteTask()

  // Statistics calculations
  const totalTasks = tasks.length
  const averageLaborPrice = tasks.length > 0 ? tasks.reduce((sum, task) => sum + (task.unit_labor_price || 0), 0) / tasks.length : 0
  const averageMaterialPrice = tasks.length > 0 ? tasks.reduce((sum, task) => sum + (task.unit_material_price || 0), 0) / tasks.length : 0
  const recentTasks = tasks.filter(task => {
    const taskDate = new Date(task.created_at)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return taskDate >= sevenDaysAgo
  }).length

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task =>
      task.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchValue.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'labor_price') {
        return (b.unit_labor_price || 0) - (a.unit_labor_price || 0)
      }
      if (sortBy === 'material_price') {
        return (b.unit_material_price || 0) - (a.unit_material_price || 0)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setNewTaskModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingTask) return

    try {
      await deleteTaskMutation.mutateAsync(deletingTask.id)
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada exitosamente."
      })
      setDeletingTask(null)
    } catch (error) {
      console.error('Error al eliminar tarea:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea. Inténtalo de nuevo.",
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
      render: (task: Task) => (
        <span className="text-xs">
          {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: es })}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Tarea',
      render: (task: Task) => (
        <div>
          <span className="text-sm font-medium">{task.name}</span>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
      )
    },
    {
      key: 'unit_labor_price',
      label: 'Precio Mano de Obra',
      width: '5%',
      render: (task: Task) => (
        <span className="text-xs">
          ${task.unit_labor_price?.toLocaleString() || '0'}
        </span>
      )
    },
    {
      key: 'unit_material_price',
      label: 'Precio Materiales',
      width: '5%',
      render: (task: Task) => (
        <span className="text-xs">
          ${task.unit_material_price?.toLocaleString() || '0'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '5%',
      render: (task: Task) => (
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
            onClick={() => setDeletingTask(task)}
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
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="labor_price">Precio mano de obra</SelectItem>
            <SelectItem value="material_price">Precio materiales</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const headerProps = {
    title: 'Gestión de Tareas',
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: clearFilters,
    actions: [
      <Button
        key="new-task"
        onClick={() => {
          setEditingTask(null)
          setNewTaskModalOpen(true)
        }}
        size="sm"
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Nueva Tarea
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
                <p className="text-xs text-muted-foreground">Total Tareas</p>
                <p className="text-lg font-semibold">{totalTasks}</p>
              </div>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Precio Promedio Mano de Obra</p>
                <p className="text-lg font-semibold">${averageLaborPrice.toLocaleString()}</p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Precio Promedio Materiales</p>
                <p className="text-lg font-semibold">${averageMaterialPrice.toLocaleString()}</p>
              </div>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Nuevas (7 días)</p>
                <p className="text-lg font-semibold">{recentTasks}</p>
              </div>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Tasks Table */}
        <CustomTable
          data={filteredTasks}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground">No hay tareas</h3>
              <p className="text-sm text-muted-foreground mt-1">No hay tareas que coincidan con los filtros seleccionados.</p>
            </div>
          }
        />
      </div>

      <NewAdminTaskModal
        open={newTaskModalOpen}
        onClose={() => {
          setNewTaskModalOpen(false)
          setEditingTask(null)
        }}
        task={editingTask}
      />

      <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea "{deletingTask?.name}" será eliminada permanentemente.
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