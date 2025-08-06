import { useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { GeneratedTask } from '@shared/schema'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useGeneratedTasks, useDeleteGeneratedTask } from '@/hooks/use-generated-tasks'
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
      const matchesType = typeFilter === 'all' || (typeFilter === 'system' ? task.is_system : !task.is_system)
      const searchQuery = searchValue.toLowerCase()
      const matchesSearch = !searchQuery || 
        task.display_name?.toLowerCase().includes(searchQuery) ||
        task.code?.toLowerCase().includes(searchQuery) ||
        task.unit_name?.toLowerCase().includes(searchQuery) ||
        task.element_category_name?.toLowerCase().includes(searchQuery)
      
      return matchesType && matchesSearch
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

  // Table columns for generated tasks
  const columns = [
    {
      key: 'display_name',
      label: 'Tarea',
      render: (task: GeneratedTask) => (
        <div className="max-w-md">
          <div className="font-medium text-sm">{task.display_name}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Código: {task.code}
          </div>
        </div>
      )
    },
    {
      key: 'unit_name',
      label: 'Unidad',
      render: (task: GeneratedTask) => (
        <Badge variant="outline" className="font-mono text-xs">
          {task.unit_name}
        </Badge>
      )
    },
    {
      key: 'element_category_name',
      label: 'Categoría',
      render: (task: GeneratedTask) => (
        <span className="text-sm text-muted-foreground">
          {task.element_category_name}
        </span>
      )
    },
    {
      key: 'is_system',
      label: 'Tipo',
      render: (task: GeneratedTask) => (
        <Badge variant={task.is_system ? "default" : "secondary"}>
          {task.is_system ? 'Sistema' : 'Usuario'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Creado',
      render: (task: GeneratedTask) => (
        <span className="text-xs text-muted-foreground">
          {new Date(task.created_at).toLocaleDateString('es-ES')}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (task: GeneratedTask) => (
        <div className="flex items-center space-x-1">
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
    title: 'Tareas Generadas',
    actionButton: {
      label: "Nueva Tarea",
      icon: Plus,
      onClick: () => openModal('parametric-task')
    }
  };

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {filteredGeneratedTasks.length === 0 && !isLoading ? (
          <div className="space-y-8">
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="border-border/40">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-base font-medium">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Call to Action */}
            <div className="text-center py-12">
              <div className="max-w-md mx-auto space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg inline-flex">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">No hay tareas generadas</h3>
                  <p className="text-sm text-muted-foreground">
                    Comienza creando tu primera tarea paramétrica para organizar el trabajo de tu proyecto.
                  </p>
                </div>
                <Button 
                  onClick={() => openModal('parametric-task')}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Tarea
                </Button>
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </Layout>
  )
}