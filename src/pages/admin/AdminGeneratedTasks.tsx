import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useGeneratedTasks, useDeleteGeneratedTask, type GeneratedTask } from '@/hooks/use-generated-tasks'
import { useCurrentUser } from '@/hooks/use-current-user'

import { Edit, Trash2, Target, Zap, CheckSquare, Clock, Plus } from 'lucide-react'

export default function AdminTasks() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'user'>('all')
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()

  // Real data from useGeneratedTasks hook - now using task_parametric_view
  const { data: generatedTasks = [], isLoading } = useGeneratedTasks()
  const deleteGeneratedTaskMutation = useDeleteGeneratedTask()

  // Filter and sort generated tasks
  const filteredGeneratedTasks = generatedTasks
    .filter((task: GeneratedTask) => {
      // Search filter - search in task name
      const matchesSearch = !searchValue || 
        task.display_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.code?.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.element_category_name?.toLowerCase().includes(searchValue.toLowerCase())
      
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
      title: 'Eliminar Tarea',
      description: `¿Estás seguro que deseas eliminar la tarea "${task.display_name || task.code}"?`,
      onConfirm: () => deleteGeneratedTaskMutation.mutate(task.id),
      mode: 'DANGEROUS'
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
      width: '5%',
      render: (task: GeneratedTask) => (
        <div className="font-mono text-sm font-medium">
          {task.code}
        </div>
      )
    },
    { 
      key: 'element_category_name', 
      label: 'Rubro', 
      width: '10%',
      render: (task: GeneratedTask) => (
        <div>
          {task.element_category_name ? (
            <Badge variant="outline" className="text-xs">
              {task.element_category_name}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">Sin rubro</span>
          )}
        </div>
      )
    },
    { 
      key: 'display_name', 
      label: 'Tarea', 
      width: 'minmax(0, 1fr)',
      render: (task: GeneratedTask) => (
        <div className="font-medium">
          {task.display_name || 'Sin nombre'}
        </div>
      )
    },
    { 
      key: 'unit_name', 
      label: 'Unidad', 
      width: '5%',
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
      label: 'Fecha', 
      width: '10%',
      render: (task: GeneratedTask) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    },
    { 
      key: 'actions', 
      label: 'Acciones', 
      width: '5%',
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
          {/* Solo mostrar botón eliminar si NO es del sistema y pertenece a la organización */}
          {!task.is_system && task.organization_id === userData?.organization?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(task)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Gestión Avanzada de Tareas",
      description: "Administra tareas paramétricas generadas automáticamente con códigos únicos, categorización por rubros y seguimiento completo de configuración."
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Sistema de Plantillas",
      description: "Utiliza plantillas predefinidas para generar tareas consistentes con parámetros configurables y opciones de personalización avanzada."
    },
    {
      icon: <CheckSquare className="w-5 h-5" />,
      title: "Control de Visibilidad",
      description: "Controla qué tareas son visibles según el contexto del proyecto y las necesidades específicas de cada fase de construcción."
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Seguimiento Temporal",
      description: "Monitorea la creación y modificación de tareas con registros temporales completos para auditoría y control de cambios."
    }
  ]

  const headerProps = {
    title: 'Tareas',
    actionButton: {
      label: "Nueva Tarea",
      icon: Plus,
      onClick: () => openModal('parametric-task')
    }
  };

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        <Table
          data={filteredGeneratedTasks}
          columns={columns}
          isLoading={isLoading}
          topBar={{
            showSearch: true,
            searchValue: searchValue,
            onSearchChange: setSearchValue,
            showFilter: true,
            isFilterActive: typeFilter !== 'all',
            renderFilterContent: () => (
              <div className="space-y-3 p-2 min-w-[200px]">
                <div>
                  <Label className="text-xs font-medium mb-1 block">Tipo</Label>
                  <Select value={typeFilter} onValueChange={(value: 'all' | 'system' | 'user') => setTypeFilter(value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todas las tareas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las tareas</SelectItem>
                      <SelectItem value="system">Tareas del sistema</SelectItem>
                      <SelectItem value="user">Tareas de usuario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ),
            showClearFilters: typeFilter !== 'all',
            onClearFilters: clearFilters
          }}
          emptyState={
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground">No hay tareas</h3>
              <p className="text-sm text-muted-foreground mt-1">Crea tu primera tarea para comenzar a organizar el trabajo.</p>
            </div>
          }
        />
      </div>
    </Layout>
  )
}