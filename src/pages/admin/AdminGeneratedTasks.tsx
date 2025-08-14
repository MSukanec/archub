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
import { useTaskParametersAdmin } from '@/hooks/use-task-parameters-admin'

import { Edit, Trash2, Target, Zap, CheckSquare, Clock, Plus, TreePine, ChevronRight, ChevronDown } from 'lucide-react'
import { EditableParametersTable } from '@/components/admin/EditableParametersTable'
import { exportToExcel, createExportColumns } from '@/lib/export-utils'

export default function AdminTasks() {
  const [activeTab, setActiveTab] = useState('Lista de Tareas')
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'user'>('all')
  const [expandedParameters, setExpandedParameters] = useState<Set<string>>(new Set())

  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()

  // Real data from useGeneratedTasks hook - now using task_parametric_view
  const { data: generatedTasks = [], isLoading } = useGeneratedTasks()
  const deleteGeneratedTaskMutation = useDeleteGeneratedTask()
  const { data: parameters = [] } = useTaskParametersAdmin()

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
      description: `Para confirmar la eliminación, escribe el nombre exacto de la tarea.`,
      itemName: task.display_name || task.code,
      itemType: 'tarea',
      destructiveActionText: 'Eliminar Tarea',
      onConfirm: () => deleteGeneratedTaskMutation.mutate(task.id),
      mode: 'dangerous'
    })
  }

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('created_at')
    setTypeFilter('all')
  }



  // Tree functionality for parameters
  const toggleParameterExpanded = (parameterId: string) => {
    const newExpanded = new Set(expandedParameters)
    if (newExpanded.has(parameterId)) {
      newExpanded.delete(parameterId)
    } else {
      newExpanded.add(parameterId)
    }
    setExpandedParameters(newExpanded)
  }

  // Render parameter tree item
  const renderParameterTreeItem = (parameter: any, level = 0) => {
    const isExpanded = expandedParameters.has(parameter.id)
    const hasOptions = parameter.options && parameter.options.length > 0
    const indentation = level * 24

    return (
      <div key={parameter.id} className="w-full">
        {/* Parameter Item */}
        <div 
          className="group flex items-center justify-between rounded-md p-2 mb-1 hover:bg-accent/50 transition-colors cursor-pointer bg-card border border-border"
          style={{ marginLeft: `${indentation}px` }}
        >
          {/* Left side: Expand/collapse + parameter info */}
          <div className="flex items-center space-x-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6"
              onClick={() => toggleParameterExpanded(parameter.id)}
              disabled={!hasOptions}
            >
              {hasOptions ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
            </Button>

            <div className="flex items-center space-x-2 flex-1">
              <TreePine className="w-4 h-4 text-accent" />
              <div>
                <span className="text-sm font-medium">{parameter.label}</span>
                <div className="text-xs text-muted-foreground">
                  Tipo: {parameter.type} • {parameter.options?.length || 0} opciones
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('task-parameter', { parameter, isEditing: true })}
              className="h-6 w-6 p-0 hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Editar"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Parameter Options - 2nd level */}
        {hasOptions && isExpanded && (
          <div className="mt-1">
            {parameter.options.map((option: any) => (
              <div 
                key={option.id}
                className="flex items-center justify-between rounded-md p-2 mb-1 hover:bg-accent/30 transition-colors border-l-2 border-accent bg-accent/10"
                style={{ marginLeft: `${(level + 1) * 24}px` }}
              >
                {/* Left side: Option info */}
                <div className="flex items-center space-x-2 flex-1">
                  <div className="w-5 flex justify-center">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-sm font-medium text-accent">{option.label}</span>
                    {option.value && option.value !== option.label && (
                      <span className="text-xs text-muted-foreground">({option.value})</span>
                    )}
                  </div>
                </div>
                
                {/* Right side: Option actions */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openModal('task-parameter-option', { option, parameter, isEditing: true })}
                    className="h-6 w-6 p-0 hover:bg-accent text-muted-foreground hover:text-foreground"
                    title="Editar"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Table columns configuration
  const columns = [
    { 
      key: 'code', 
      label: 'Código', 
      width: '8%',
      render: (task: GeneratedTask) => (
        <div className="space-y-1">
          <div className="font-mono text-sm font-medium">
            {task.code}
          </div>
          <div>
            {task.is_system ? (
              <Badge variant="secondary" className="text-xs">
                Sistema
              </Badge>
            ) : (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                Usuario
              </Badge>
            )}
          </div>
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
      width: '10%',
      render: (task: GeneratedTask) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(task)}
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
            title="Editar tarea"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(task)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Eliminar tarea"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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

  const headerTabs = [
    {
      id: 'Lista de Tareas',
      label: 'Lista',
      isActive: activeTab === 'Lista de Tareas'
    },
    {
      id: 'Árbol de Tareas', 
      label: 'Árbol',
      isActive: activeTab === 'Árbol de Tareas'
    }
  ]

  const headerProps = {
    title: 'Tareas',
    actionButton: {
      label: "Nueva Tarea",
      icon: Plus,
      onClick: () => openModal('parametric-task')
    },
    tabs: headerTabs,
    onTabChange: setActiveTab
  };

  return (
    <Layout headerProps={headerProps} wide>
      <div>
        {activeTab === 'Lista de Tareas' && (
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
              onClearFilters: clearFilters,

            }}
            emptyState={
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-muted-foreground">No hay tareas</h3>
                <p className="text-sm text-muted-foreground mt-1">Crea tu primera tarea para comenzar a organizar el trabajo.</p>
              </div>
            }
          />
        )}
        
        {activeTab === 'Árbol de Tareas' && (
          <EditableParametersTable />
        )}
      </div>
    </Layout>
  )
}