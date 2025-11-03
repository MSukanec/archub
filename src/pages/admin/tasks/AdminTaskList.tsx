import React, { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import AdminTaskRow from '@/components/ui/data-row/rows/AdminTaskRow'
import { useMobile } from '@/hooks/use-mobile'

import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useGeneratedTasks, useDeleteGeneratedTask, useTaskUsageCount, type GeneratedTask } from '@/hooks/use-generated-tasks'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useTaskParametersAdmin } from '@/hooks/use-task-parameters-admin'

import { Edit, Trash2, Target, Zap, CheckSquare, Clock, Plus, TreePine, ChevronRight, ChevronDown, Eye, Copy } from 'lucide-react'
import { EditableParametersTable } from '@/components/admin/EditableParametersTable'
import { exportToExcel, createExportColumns } from '@/lib/export-utils'
import { TaskCostPopover } from '@/components/popovers/TaskCostPopover'
import TaskLaborCost from '@/components/construction/TaskLaborCost'
import { useLocation } from 'wouter'

const AdminTaskList = () => {
  const [activeTab, setActiveTab] = useState('Lista de Tareas')
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'user'>('all')
  const [expandedParameters, setExpandedParameters] = useState<Set<string>>(new Set())
  const [groupingType, setGroupingType] = useState<'none' | 'rubros'>('rubros')

  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const isMobile = useMobile()
  const [, navigate] = useLocation()

  // Real data from useGeneratedTasks hook
  const { data: generatedTasks = [], isLoading } = useGeneratedTasks()
  const deleteGeneratedTaskMutation = useDeleteGeneratedTask()
  const { data: parameters = [] } = useTaskParametersAdmin()
  const { data: taskUsageCount = {} } = useTaskUsageCount()

  // Filter and sort generated tasks
  const filteredGeneratedTasks = generatedTasks
    .filter((task: GeneratedTask) => {
      // Search filter - search in task name
      const matchesSearch = !searchValue || 
        (task.custom_name || task.name_rendered)?.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.code?.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.division?.toLowerCase().includes(searchValue.toLowerCase())
      
      return matchesSearch
    })
    .sort((a: GeneratedTask, b: GeneratedTask) => {
      // Si está agrupado por rubros, ordenar alfabéticamente por rubro
      if (groupingType === 'rubros') {
        const rubroA = (a.division || 'Sin rubro').toLowerCase()
        const rubroB = (b.division || 'Sin rubro').toLowerCase()
        
        // Primero ordenar por rubro alfabéticamente (A-Z)
        const rubroComparison = rubroA.localeCompare(rubroB, 'es', { sensitivity: 'base' })
        if (rubroComparison !== 0) {
          return rubroComparison
        }
        
        // Si el rubro es igual, ordenar por nombre de tarea
        const nameA = (a.custom_name || a.name_rendered || '').toLowerCase()
        const nameB = (b.custom_name || b.name_rendered || '').toLowerCase()
        return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' })
      }
      
      // Ordenamiento por defecto cuando no está agrupado por rubros
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Process tasks for grouping
  const processedTasks = useMemo(() => {
    if (groupingType === 'none') {
      return filteredGeneratedTasks;
    }
    
    if (groupingType === 'rubros') {
      return filteredGeneratedTasks.map(task => ({
        ...task,
        groupKey: task.division || 'Sin rubro'
      }));
    }
    
    return filteredGeneratedTasks;
  }, [filteredGeneratedTasks, groupingType])

  const handleEdit = (generatedTask: GeneratedTask) => {
    console.log('📝 Editando tarea:', generatedTask);
    const modalData = { task: generatedTask, isEditing: true };
    openModal('parametric-task', modalData)
  }

  const handleView = (task: GeneratedTask) => {
    // Marcar que venimos del admin
    localStorage.setItem('taskViewSource', 'admin');
    navigate(`/analysis/${task.id}`)
  }

  const handleDuplicate = (task: GeneratedTask) => {
    // Create a duplicate object with " - Copia" added to the name
    const duplicateTask = {
      ...task,
      id: undefined, // Remove ID so it creates a new task
      custom_name: `${task.custom_name || task.name_rendered || 'Tarea'} - Copia`,
      created_at: undefined, // Remove created_at
      updated_at: undefined  // Remove updated_at
    }
    openModal('parametric-task', { task: duplicateTask, isDuplicating: true })
  }

  const handleDelete = (task: GeneratedTask) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Tarea',
      description: `Para confirmar la eliminación, escribe el nombre exacto de la tarea.`,
      itemName: task.custom_name || task.name_rendered || task.code,
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
    setGroupingType('none')
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
              className="hover:bg-accent text-muted-foreground hover:text-foreground"
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
                    className="hover:bg-accent text-muted-foreground hover:text-foreground"
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

  // Table columns configuration - hide 'Rubro' column when grouped by rubros
  const baseColumns = [
    { 
      key: 'is_completed', 
      label: 'Completa', 
      width: '12%',
      render: (task: GeneratedTask) => (
        <div className="flex items-center justify-center gap-1">
          {task.is_completed ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Completado
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              Incompleto
            </span>
          )}
          {taskUsageCount[task.id] && (
            <span className="text-xs font-medium text-muted-foreground">
              ({taskUsageCount[task.id]})
            </span>
          )}
        </div>
      )
    },
    ...(groupingType !== 'rubros' ? [{ 
      key: 'division', 
      label: 'Rubro', 
      width: '12%',
      render: (task: GeneratedTask) => (
        <div>
          {task.division ? (
            <Badge variant="outline" className="text-xs">
              {task.division}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">Sin rubro</span>
          )}
        </div>
      )
    }] : []),
    { 
      key: 'custom_name', 
      label: 'Tarea', 
      width: 'minmax(0, 1fr)',
      render: (task: GeneratedTask) => (
        <div className="font-medium">
          {task.custom_name || 'Sin nombre personalizado'}
        </div>
      )
    },
    { 
      key: 'unit', 
      label: 'Unidad', 
      width: '8%',
      render: (task: GeneratedTask) => (
        <div>
          {task.unit ? (
            <Badge variant="secondary" className="text-xs">
              {task.unit}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">Sin unidad</span>
          )}
        </div>
      )
    },
    { 
      key: 'total_cost', 
      label: 'Costo Unitario', 
      width: '12%',
      render: (task: GeneratedTask) => (
        <div className="text-center">
          <TaskCostPopover task={task} showCost={true} />
        </div>
      ),
      sortable: false
    },
    { 
      key: 'is_system', 
      label: 'Sistema', 
      width: '8%',
      render: (task: GeneratedTask) => (
        <div className="flex justify-center">
          {task.is_system ? (
            <Badge className="text-xs text-white" style={{ backgroundColor: 'var(--accent)' }}>
              SISTEMA
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              USUARIO
            </Badge>
          )}
        </div>
      )
    }
  ]

  // Dynamic columns based on grouping (using baseColumns which already handles the conditional inclusion)
  const columns = baseColumns;

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Mobile view with AdminTaskRow */}
        <div className="space-y-2">
          {processedTasks.map((task) => (
            <AdminTaskRow
              key={task.id}
              task={task}
              onClick={() => handleEdit(task)}
            />
          ))}
        </div>
        
        {processedTasks.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No se encontraron tareas</p>
            <p className="text-xs">No hay tareas que coincidan con los filtros aplicados.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0">
          <Table
            data={processedTasks}
            columns={columns}
            isLoading={isLoading}
            groupBy={groupingType === 'none' ? undefined : 'groupKey'}
            rowActions={(task: GeneratedTask) => [
              {
                icon: Eye,
                label: 'Ver detalles',
                onClick: () => handleView(task)
              },
              {
                icon: Edit,
                label: 'Editar',
                onClick: () => handleEdit(task)
              },
              {
                icon: Copy,
                label: 'Duplicar',
                onClick: () => handleDuplicate(task)
              },
              {
                icon: Trash2,
                label: 'Eliminar',
                onClick: () => handleDelete(task),
                variant: 'destructive' as const
              }
            ]}
            topBar={{
              tabs: ['Sin Agrupar', 'Por Rubros'],
              activeTab: groupingType === 'none' ? 'Sin Agrupar' : 'Por Rubros',
              onTabChange: (tab: string) => {
                if (tab === 'Sin Agrupar') setGroupingType('none')
                else if (tab === 'Por Rubros') setGroupingType('rubros')
              },
              searchValue: searchValue,
              onSearchChange: setSearchValue,
              isFilterActive: typeFilter !== 'all',
              renderFilterContent: () => (
                <>
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Tipo</Label>
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
                </>
              ),
              onClearFilters: clearFilters
            }}
            renderGroupHeader={groupingType === 'none' ? undefined : (groupKey: string, groupRows: any[]) => (
              <div className="col-span-full text-sm font-medium">
                {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Tarea' : 'Tareas'})
              </div>
            )}
            emptyState={
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No se encontraron tareas</p>
                <p className="text-xs">No hay tareas que coincidan con los filtros aplicados.</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminTaskList;