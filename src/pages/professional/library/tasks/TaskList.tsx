import { useState, useMemo, useEffect } from 'react'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { useGeneratedTasks } from '@/hooks/use-generated-tasks'
import { TableIcon, Edit, Trash2, Copy, Search, Filter, Plus, Home, Bell, Grid3X3, List } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteGeneratedTask } from '@/hooks/use-generated-tasks'
import { useCurrentUser } from '@/hooks/use-current-user'
import { AnalysisTaskRow } from '@/components/ui/data-row/rows'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

export default function TaskList() {
  const { data: tasks = [], isLoading: tasksLoading } = useGeneratedTasks()
  const { openModal } = useGlobalModalStore()
  const deleteTaskMutation = useDeleteGeneratedTask()
  const { data: userData } = useCurrentUser()
  
  
  // Mobile action bar
  const { 
    setActions, 
    setShowActionBar, 
    clearActions, 
    setFilterConfig
  } = useActionBarMobile()
  const isMobile = useMobile()
  
  // Estado para agrupación - por defecto "Por Rubros"
  const [groupingType, setGroupingType] = useState('rubros')
  
  // Estado para modo de vista - por defecto "Todas"
  const [viewMode, setViewMode] = useState('all')


  // Configure mobile action bar - only set what's needed
  useEffect(() => {
    if (isMobile) {
      setActions({
        home: { id: 'home', label: 'Inicio', icon: <Home className="h-6 w-6" />, onClick: () => {} },
        search: { id: 'search', label: 'Buscar', icon: <Search className="h-6 w-6" />, onClick: () => {} },
        create: {
          id: 'create',
          icon: <Plus className="h-6 w-6" />,
          label: 'Nueva Tarea',
          onClick: () => openModal('task'),
          variant: 'primary'
        },
        filter: { id: 'filter', label: 'Filtros', icon: <Filter className="h-6 w-6" />, onClick: () => {} },
        notifications: { id: 'notifications', label: 'Notificaciones', icon: <Bell className="h-6 w-6" />, onClick: () => {} },
      })
      setShowActionBar(true)
    }

    return () => {
      if (isMobile) {
        clearActions()
      }
    }
  }, [isMobile])

  // Configure filter options
  useEffect(() => {
    if (isMobile) {
      setFilterConfig({
        filters: [
          {
            label: 'Agrupación',
            value: groupingType,
            onChange: setGroupingType,
            placeholder: 'Seleccionar agrupación',
            allOptionLabel: 'Sin agrupar',
            options: [
              { value: 'none', label: 'Sin agrupar' },
              { value: 'rubros', label: 'Por rubros' }
            ]
          }
        ]
      })
    }
  }, [isMobile, groupingType])

  // Filtrar tareas por modo de vista y agregar groupKey
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    // Filtrar por modo de vista
    if (viewMode === 'organization') {
      // Solo tareas de la organización (no del sistema)
      filtered = filtered.filter(task => !task.is_system && task.organization_id === userData?.organization?.id);
    } else {
      // Modo "Todas": tareas del sistema O de mi organización (nunca de otras organizaciones)
      filtered = filtered.filter(task => 
        task.is_system || task.organization_id === userData?.organization?.id
      );
    }
    
    return filtered.map(task => {
      let groupKey = '';
      
      switch (groupingType) {
        case 'rubros':
          groupKey = task.division || 'Sin rubro';
          break;
        default:
          groupKey = '';
      }
      
      return {
        ...task,
        groupKey
      };
    });
  }, [tasks, groupingType, viewMode, userData?.organization?.id]);

  // Columnas base para la tabla
  const baseColumns = [
    {
      key: 'category',
      label: 'Rubro',
      width: '18%',
      render: (task: any) => (
        <Badge variant="outline" className="text-xs">
          {task.division || 'Sin rubro'}
        </Badge>
      )
    },
    {
      key: 'name_rendered',
      label: 'Tarea',
      width: '52%',
      render: (task: any) => (
        <span className="text-sm font-medium">{task.custom_name || 'Sin nombre'}</span>
      )
    },
    {
      key: 'unit',
      label: 'Unidad',
      width: '9%',
      render: (task: any) => (
        <Badge variant="secondary" className="text-xs">
          {task.unit || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'is_system',
      label: 'Tipo',
      width: '10%',
      render: (task: any) => (
        <Badge 
          variant={task.is_system ? "default" : "secondary"}
          className={`text-xs ${task.is_system 
            ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90' 
            : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300'
          }`}
        >
          {task.is_system ? 'Sistema' : 'Organización'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '11%',
      render: (task: any) => {
        // Solo mostrar acciones para tareas que pertenecen a la organización (no del sistema)
        const canEdit = !task.is_system && task.organization_id === userData?.organization?.id;
        
        if (!canEdit) {
          return (
            <div className="flex items-center justify-center h-7">
              <span className="text-xs text-muted-foreground">-</span>
            </div>
          );
        }
        
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(task)}
              className="h-7 w-7 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDuplicate(task)}
              className="h-7 w-7 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(task)}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        );
      }
    }
  ]

  // Seleccionar columnas según el tipo de agrupación y modo de vista
  const columns = useMemo(() => {
    let filteredColumns = baseColumns;
    
    // Para agrupación por rubros, filtrar la columna de rubro
    if (groupingType === 'rubros') {
      filteredColumns = filteredColumns.filter(column => column.key !== 'category');
    }
    
    // Para modo "Solo de la Organización", ocultar la columna TIPO
    if (viewMode === 'organization') {
      filteredColumns = filteredColumns.filter(column => column.key !== 'is_system');
    }
    
    return filteredColumns;
  }, [groupingType, viewMode]);

  const handleEdit = (task: any) => {
    openModal('task', { taskId: task.id })
  }

  const handleDuplicate = (task: any) => {
    // Create a duplicate object with "Copia" added to the name
    const duplicateTask = {
      ...task,
      id: undefined, // Remove ID so it creates a new task
      custom_name: `${task.custom_name} - Copia`,
      created_at: undefined, // Remove created_at
      updated_at: undefined  // Remove updated_at
    }
    openModal('task', { task: duplicateTask, isDuplicating: true })
  }

  const handleDelete = (task: any) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: "Eliminar tarea",
      description: `¿Estás seguro de que quieres eliminar "${task.custom_name || 'esta tarea'}"?`,
      itemName: task.custom_name || 'esta tarea',
      itemType: 'tarea',
      destructiveActionText: 'Eliminar Tarea',
      onConfirm: () => {
        deleteTaskMutation.mutate(task.id)
      },
      isLoading: deleteTaskMutation.isPending
    })
  }

  // Render grouping popover content
  const renderGroupingContent = () => {
    const groupingOptions = [
      { value: 'none', label: 'Sin agrupar' },
      { value: 'rubros', label: 'Agrupar por rubros' }
    ];

    return (
      <>
        <div className="text-xs font-medium mb-2 block">Agrupar por</div>
        <div className="space-y-1">
          {groupingOptions.map((option) => (
            <Button
              key={option.value}
              variant={groupingType === option.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setGroupingType(option.value as 'none' | 'rubros')}
              className={cn(
                "w-full justify-start text-xs font-normal h-8",
                groupingType === option.value ? "button-secondary-pressed hover:bg-secondary" : ""
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </>
    );
  };

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)]" />
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<TableIcon className="h-16 w-16" />}
        title="No hay tareas para analizar"
        description="Las tareas parametrizadas aparecerán aquí para análisis de costos."
      />
    )
  }

  return (
    <Table
      columns={columns}
      data={filteredTasks}
      groupBy={groupingType === 'none' ? undefined : 'groupKey'}
      renderCard={(task: any) => (
        <AnalysisTaskRow
          task={task}
          onClick={() => openModal('parametric-task', { taskId: task.id })}
        />
      )}
      topBar={{
        leftModeButtons: {
          options: [
            { key: 'all', label: 'Todas' },
            { key: 'organization', label: 'Solo de la Organización' }
          ],
          activeMode: viewMode,
          onModeChange: setViewMode
        },
        renderGroupingContent: renderGroupingContent,
        isGroupingActive: groupingType !== 'none'
      }}
      renderGroupHeader={groupingType === 'none' ? undefined : (groupKey: string, groupRows: any[]) => (
        <>
          <div className="col-span-full text-sm font-medium">
            {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Tarea' : 'Tareas'})
          </div>
        </>
      )}
      emptyState={
        <EmptyState
          icon={<TableIcon className="h-16 w-16" />}
          title="No hay tareas que coincidan"
          description="Intenta cambiar los filtros de agrupación para encontrar las tareas que buscas."
        />
      }
    />
  )
}