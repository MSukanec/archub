import { useState, useMemo, useEffect } from 'react'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { useGeneratedTasks } from '@/hooks/use-generated-tasks'
import { TableIcon, Edit, Trash2, Search, Filter, Plus, Home, Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useCurrentUser } from '@/hooks/use-current-user'
import { AnalysisTaskRow } from '@/components/data-row/rows'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'

export default function TaskList() {
  const { data: tasks = [], isLoading: tasksLoading } = useGeneratedTasks()
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()
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


  // Configure mobile action bar - only set what's needed
  useEffect(() => {
    if (isMobile) {
      setActions({
        home: { id: 'home', label: 'Inicio', onClick: () => {} },
        search: { id: 'search', label: 'Buscar', onClick: () => {} },
        create: {
          id: 'create',
          icon: <Plus className="h-6 w-6" />,
          label: 'Nueva Tarea',
          onClick: () => openModal('parametric-task'),
          variant: 'primary'
        },
        filter: { id: 'filter', label: 'Filtros', onClick: () => {} },
        notifications: { id: 'notifications', label: 'Notificaciones', onClick: () => {} },
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

  // Filtrar tareas y agregar groupKey (sin búsqueda, solo agrupación)
  const filteredTasks = useMemo(() => {
    let filtered = tasks
    
    return filtered.map(task => {
      let groupKey = '';
      
      switch (groupingType) {
        case 'rubros':
          groupKey = task.element_category_name || 'Sin rubro';
          break;
        default:
          groupKey = '';
      }
      
      return {
        ...task,
        groupKey
      };
    });
  }, [tasks, groupingType]);

  // Columnas base para la tabla
  const baseColumns = [
    {
      key: 'element_category_name',
      label: 'Rubro',
      width: '20%',
      render: (task: any) => (
        <Badge variant="outline" className="text-xs">
          {task.element_category_name || 'Sin rubro'}
        </Badge>
      )
    },
    {
      key: 'name_rendered',
      label: 'Tarea',
      width: '60%',
      render: (task: any) => (
        <span className="text-sm font-medium">{task.name_rendered}</span>
      )
    },
    {
      key: 'unit_name',
      label: 'Unidad',
      width: '10%',
      render: (task: any) => (
        <Badge variant="secondary" className="text-xs">
          {task.unit_name || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (task: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal('parametric-task', { taskId: task.id })}
            className="h-7 w-7 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          {/* Solo mostrar botón eliminar si NO es del sistema y pertenece a la organización */}
          {!task.is_system && task.organization_id === userData?.organization?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                showDeleteConfirmation({
                  title: "Eliminar tarea",
                  description: `¿Estás seguro de que quieres eliminar "${task.name_rendered || 'esta tarea'}"?`,
                  itemName: task.name_rendered || 'esta tarea',
                  onConfirm: () => {
                    // TODO: Implementar eliminación de tarea
                    console.log('Eliminar tarea:', task.id)
                  }
                })
              }}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )
    }
  ]

  // Seleccionar columnas según el tipo de agrupación
  const columns = useMemo(() => {
    // Para sin agrupar, usar todas las columnas base
    if (groupingType === 'none') {
      return baseColumns;
    }
    
    // Para agrupación por rubros, filtrar la columna de rubro
    return baseColumns.filter(column => {
      if (groupingType === 'rubros' && column.key === 'element_category_name') return false;
      return true;
    });
  }, [groupingType]);

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
        renderGroupingContent: () => (
          <>
            <div className="text-xs font-medium mb-2 block">Agrupar por</div>
            <div className="space-y-1">
              <Button
                variant={groupingType === 'none' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setGroupingType('none')}
                className="w-full justify-start text-xs font-normal h-8"
              >
                Sin agrupar
              </Button>
              <Button
                variant={groupingType === 'rubros' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setGroupingType('rubros')}
                className="w-full justify-start text-xs font-normal h-8"
              >
                Por rubros
              </Button>
            </div>
          </>
        ),
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