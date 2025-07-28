import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useGeneratedTasks, useDeleteGeneratedTask, type GeneratedTask } from '@/hooks/use-generated-tasks'

import { Edit, Trash2, Target, Zap, CheckSquare, Clock } from 'lucide-react'

export default function AdminGeneratedTasks() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'user'>('all')
  const { openModal } = useGlobalModalStore()

  // Real data from useGeneratedTasks hook - now using task_parametric_view
  const { data: generatedTasks = [], isLoading } = useGeneratedTasks()
  const deleteGeneratedTaskMutation = useDeleteGeneratedTask()

  // Filter and sort generated tasks
  const filteredGeneratedTasks = generatedTasks
    .filter((task: GeneratedTask) => {
      // Search filter - search in task name
      const matchesSearch = !searchValue || 
        task.name_rendered?.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.code?.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.category_name?.toLowerCase().includes(searchValue.toLowerCase())
      
      return matchesSearch
    })
    .sort((a: GeneratedTask, b: GeneratedTask) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleEdit = (generatedTask: GeneratedTask) => {
    console.log('📝 Editando tarea:', generatedTask);
    const modalData = { task: generatedTask, isEditing: true };
    openModal('parametric-task', modalData)
  }

  const handleDelete = (task: GeneratedTask) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Tarea Generada',
      description: `¿Estás seguro que deseas eliminar la tarea "${task.name_rendered || task.code}"?`,
      onConfirm: () => deleteGeneratedTaskMutation.mutate(task.id)
    })
  }

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('created_at')
    setTypeFilter('all')
  }

  // Table columns configuration
  const columns = [
    { 
      key: 'code', 
      label: 'Código', 
      className: 'w-[15%]',
      render: (task: GeneratedTask) => (
        <div className="font-mono text-sm font-medium">
          {task.code}
        </div>
      )
    },
    { 
      key: 'category_name', 
      label: 'Rubro', 
      className: 'w-[20%]',
      render: (task: GeneratedTask) => (
        <div>
          {task.category_name ? (
            <Badge variant="outline" className="text-xs">
              {task.category_name}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">Sin rubro</span>
          )}
        </div>
      )
    },
    { 
      key: 'name_rendered', 
      label: 'Tarea', 
      className: 'w-[35%]',
      render: (task: GeneratedTask) => (
        <div className="font-medium">
          {task.name_rendered || 'Sin nombre'}
        </div>
      )
    },
    { 
      key: 'unit_name', 
      label: 'Unidad', 
      className: 'w-[15%]',
      render: (task: GeneratedTask) => (
        <div>
          {task.unit_name ? (
            <Badge variant="secondary" className="text-xs">
              {task.unit_name}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">Sin unidad</span>
          )}
        </div>
      )
    },
    { 
      key: 'created_at', 
      label: 'Fecha de Creación', 
      className: 'w-[10%]',
      render: (task: GeneratedTask) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    },
    { 
      key: 'actions', 
      label: 'Acciones', 
      className: 'w-[5%]',
      render: (task: GeneratedTask) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(task)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(task)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const customFilters = [
    {
      key: 'type' as const,
      label: 'Tipo',
      value: typeFilter,
      onChange: setTypeFilter,
      options: [
        { value: 'all', label: 'Todas las tareas' },
        { value: 'system', label: 'Tareas del sistema' },
        { value: 'user', label: 'Tareas de usuario' }
      ]
    }
  ]

  const features = [
    {
      icon: Zap,
      title: "Gestión Avanzada de Tareas",
      description: "Administra tareas paramétricas generadas automáticamente con códigos únicos, categorización por rubros y seguimiento completo de configuración."
    },
    {
      icon: Target,
      title: "Sistema de Plantillas",
      description: "Utiliza plantillas predefinidas para generar tareas consistentes con parámetros configurables y opciones de personalización avanzada."
    },
    {
      icon: CheckSquare,
      title: "Control de Visibilidad",
      description: "Controla qué tareas son visibles según el contexto del proyecto y las necesidades específicas de cada fase de construcción."
    },
    {
      icon: Clock,
      title: "Seguimiento Temporal",
      description: "Monitorea la creación y modificación de tareas con registros temporales completos para auditoría y control de cambios."
    }
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <ActionBarDesktop
          title="Gestión de Tareas Generadas"
          icon={Target}
          features={features}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          customFilters={customFilters}
          onClearFilters={clearFilters}
          primaryActionLabel="Nueva Tarea Generada"
          onPrimaryActionClick={() => openModal('parametric-task')}
        />

        <Table
          data={filteredGeneratedTasks}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No hay tareas generadas"
          emptyDescription="Crea tu primera tarea generada para comenzar a organizar el trabajo."
        />
      </div>
    </Layout>
  )
}