import { useState, useMemo, useEffect } from 'react'
import { Table } from '@/components/ui-custom/Table'
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

export default function AnalysisTasks() {
  const { data: tasks = [], isLoading: tasksLoading } = useGeneratedTasks()
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { data: userData } = useCurrentUser()
  
  // Search state
  const [searchValue, setSearchValue] = useState("")
  
  // Mobile action bar
  const { 
    setActions, 
    setShowActionBar, 
    clearActions, 
    setFilterConfig,
    searchValue: mobileSearchValue,
    setSearchValue: setMobileSearchValue
  } = useActionBarMobile()
  const isMobile = useMobile()
  
  // Estado para agrupación - por defecto "Por Rubros"
  const [groupingType, setGroupingType] = useState('rubros')

  // Sync search values between mobile and desktop
  useEffect(() => {
    if (isMobile && mobileSearchValue !== searchValue) {
      setSearchValue(mobileSearchValue)
    }
  }, [mobileSearchValue, isMobile])

  // Configure mobile action bar
  useEffect(() => {
    if (isMobile) {
      setActions({
        home: {
          id: 'home',
          icon: <Home className="h-6 w-6 text-gray-600 dark:text-gray-400" />,
          label: 'Inicio',
          onClick: () => {
            // Navigate to dashboard - handled by Layout
          },
        },
        search: {
          id: 'search',
          icon: <Search className="h-5 w-5" />,
          label: 'Buscar',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
        create: {
          id: 'create',
          icon: <Plus className="h-6 w-6" />,
          label: 'Nueva Tarea',
          onClick: () => openModal('parametric-task'),
          variant: 'primary'
        },
        filter: {
          id: 'filter',
          icon: <Filter className="h-5 w-5" />,
          label: 'Filtros',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
        notification: {
          id: 'notification',
          icon: <Bell className="h-5 w-5" />,
          label: 'Notificaciones',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
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

  // Filtrar tareas y agregar groupKey con búsqueda
  const filteredTasks = useMemo(() => {
    let filtered = tasks
    
    // Aplicar filtro de búsqueda
    if (searchValue.trim()) {
      const searchTerm = searchValue.toLowerCase()
      filtered = filtered.filter(task => 
        task.unit_name?.toLowerCase().includes(searchTerm) ||
        task.element_category_name?.toLowerCase().includes(searchTerm) ||
        task.labor_cost?.toString().includes(searchTerm) ||
        task.material_cost?.toString().includes(searchTerm)
      )
    }
    
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
  }, [tasks, groupingType, searchValue]);

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
      isLoading={tasksLoading}
      groupBy={groupingType === 'none' ? undefined : 'groupKey'}
      renderCard={(task: any) => (
        <AnalysisTaskRow
          task={task}
          onClick={() => openModal('parametric-task', { taskId: task.id })}
        />
      )}
      topBar={{
        tabs: ['Sin Agrupar', 'Por Rubros'],
        activeTab: groupingType === 'none' ? 'Sin Agrupar' : 'Por Rubros',
        onTabChange: (tab: string) => {
          if (tab === 'Sin Agrupar') setGroupingType('none')
          else if (tab === 'Por Rubros') setGroupingType('rubros')
        }
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