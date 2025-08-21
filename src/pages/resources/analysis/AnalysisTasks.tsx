import { useState, useMemo } from 'react'
import { Table } from '@/components/ui-custom/Table'
import { useGeneratedTasks } from '@/hooks/use-generated-tasks'
import { TableIcon, Edit, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useCurrentUser } from '@/hooks/use-current-user'
import { AnalysisTaskRow } from '@/components/data-row/rows'

export default function AnalysisTasks() {
  const { data: tasks = [], isLoading: tasksLoading } = useGeneratedTasks()
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { data: userData } = useCurrentUser()
  
  // Estado para agrupación - por defecto "Por Rubros"
  const [groupingType, setGroupingType] = useState('rubros')

  // Filtrar tareas y agregar groupKey
  const filteredTasks = useMemo(() => {
    return tasks.map(task => {
      let groupKey = '';
      
      switch (groupingType) {
        case 'rubros':
          groupKey = task.category_name || 'Sin rubro';
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
      key: 'category_name',
      label: 'Rubro',
      width: '20%',
      render: (task: any) => (
        <Badge variant="outline" className="text-xs">
          {task.category_name || 'Sin rubro'}
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
      if (groupingType === 'rubros' && column.key === 'category_name') return false;
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