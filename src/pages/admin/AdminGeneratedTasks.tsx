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
        {/* Parameter Item */}
        <div 
          style={{ marginLeft: `${indentation}px` }}
        >
          {/* Left side: Expand/collapse + parameter info */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleParameterExpanded(parameter.id)}
              disabled={!hasOptions}
            >
              {hasOptions ? (
                isExpanded ? (
                ) : (
                )
              ) : (
              )}
            </Button>

              <div>
                  Tipo: {parameter.type} • {parameter.options?.length || 0} opciones
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('task-parameter', { parameter, isEditing: true })}
            >
            </Button>
          </div>
        </div>

        {/* Parameter Options - 2nd level */}
        {hasOptions && isExpanded && (
            {parameter.options.map((option: any) => (
              <div 
                key={option.id}
                style={{ marginLeft: `${(level + 1) * 24}px` }}
              >
                {/* Left side: Option info */}
                  </div>
                  
                    {option.value && option.value !== option.label && (
                    )}
                  </div>
                </div>
                
                {/* Right side: Option actions */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openModal('task-parameter-option', { option, parameter, isEditing: true })}
                  >
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
            {task.code}
          </div>
          <div>
            {task.is_system ? (
                Sistema
              </Badge>
            ) : (
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
              {task.element_category_name}
            </Badge>
          ) : (
          )}
        </div>
      )
    },
    { 
      key: 'display_name', 
      label: 'Tarea', 
      width: 'minmax(0, 1fr)',
      render: (task: GeneratedTask) => (
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
              {task.unit_name}
            </Badge>
          ) : (
          )}
        </div>
      )
    },
    { 
      key: 'created_at', 
      label: 'Fecha', 
      width: '10%',
      render: (task: GeneratedTask) => (
          {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    },
    { 
      key: 'actions', 
      label: 'Acciones', 
      width: '10%',
      render: (task: GeneratedTask) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(task)}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(task)}
          >
          </Button>
        </div>
      )
    }
  ]

  const features = [
    {
      title: "Gestión Avanzada de Tareas",
      description: "Administra tareas paramétricas generadas automáticamente con códigos únicos, categorización por rubros y seguimiento completo de configuración."
    },
    {
      title: "Sistema de Plantillas",
      description: "Utiliza plantillas predefinidas para generar tareas consistentes con parámetros configurables y opciones de personalización avanzada."
    },
    {
      title: "Control de Visibilidad",
      description: "Controla qué tareas son visibles según el contexto del proyecto y las necesidades específicas de cada fase de construcción."
    },
    {
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
                  <div>
                    <Select value={typeFilter} onValueChange={(value: 'all' | 'system' | 'user') => setTypeFilter(value)}>
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