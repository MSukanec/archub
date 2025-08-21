import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { CheckSquare, Edit, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { exportToExcel, createExportColumns } from '@/lib/export-utils'
import ConstructionTaskCard from '@/components/cards/ConstructionTaskCard'
import { TaskMaterialDetailPopover } from '@/components/popovers/TaskMaterialDetailPopover'
import TaskMaterialsSubtotal from '@/components/construction/TaskMaterialsSubtotal'
import TaskLaborCost from '@/components/construction/TaskLaborCost'
import TaskLaborSubtotal from '@/components/construction/TaskLaborSubtotal'
import TaskTotalSubtotal from '@/components/construction/TaskTotalSubtotal'

interface TaskListViewProps {
  tasks: any[]
  isLoading: boolean
  onEditTask: (task: any) => void
  onDeleteTask: (taskId: string) => void
}

export function TaskListView({ 
  tasks, 
  isLoading, 
  onEditTask, 
  onDeleteTask 
}: TaskListViewProps) {
  const [groupingType, setGroupingType] = useState('phases')
  const [isExporting, setIsExporting] = useState(false)

  // Filtrar tareas según búsqueda y agregar groupKey
  const filteredTasks = useMemo(() => {
    return tasks.map(task => {
      let groupKey = '';
      
      switch (groupingType) {
        case 'phases':
          groupKey = task.phase_name || 'Sin fase';
          break;
        case 'rubros':
          groupKey = task.task?.rubro_name || 'Sin rubro';
          break;
        case 'tasks':
          groupKey = task.task?.display_name || task.task?.code || 'Sin nombre';
          break;
        case 'rubros-phases':
          groupKey = `${task.task?.rubro_name || 'Sin rubro'} - ${task.phase_name || 'Sin fase'}`;
          break;
        case 'phases-rubros':
          groupKey = `${task.phase_name || 'Sin fase'} - ${task.task?.rubro_name || 'Sin rubro'}`;
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

  // Para agrupación por tarea, simplemente usar filteredTasks con groupKey
  const finalTasks = useMemo(() => {
    return filteredTasks;
  }, [filteredTasks]);

  // Handle Excel export
  const handleExportToExcel = async () => {
    if (finalTasks.length === 0) return

    setIsExporting(true)
    try {
      const exportColumns = createExportColumns(columns)
      await exportToExcel({
        filename: `tareas-construccion-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        sheetName: 'Tareas de Construcción',
        columns: exportColumns,
        data: finalTasks
      })
    } catch (error) {
      console.error('Error exportando a Excel:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Definir columnas base para la tabla
  const baseColumns = [
    {
      key: 'phase',
      label: 'Fase',
      render: (task: any) => task.phase_name || 'Sin fase',
      width: '15%'
    },
    {
      key: 'rubro_name',
      label: 'Rubro',
      render: (task: any) => task.task?.rubro_name || 'Sin rubro',
      width: '10%'
    },
    {
      key: 'display_name',
      label: 'Tarea',
      render: (task: any) => task.task?.display_name || task.task?.code || 'Sin nombre',
      width: 'auto'
    },
    {
      key: 'quantity_with_unit',
      label: 'Cantidad',
      render: (task: any) => {
        const quantity = task.quantity || 0;
        const unit = task.task?.unit_symbol || '';
        return unit ? `${quantity} ${unit}` : quantity.toString();
      },
      width: '8%'
    },
    {
      key: 'labor_cost',
      label: 'Costo Mo.',
      render: (task: any) => (
        <div className="text-center">
          <TaskLaborCost task={task} />
        </div>
      ),
      width: '8%',
      sortable: false
    },
    {
      key: 'labor_subtotal',
      label: 'Subt. Mo.',
      render: (task: any) => (
        <div className="text-center">
          <TaskLaborSubtotal task={task} />
        </div>
      ),
      width: '8%',
      sortable: false
    },
    {
      key: 'material_details',
      label: 'Costo Mat.',
      render: (task: any) => (
        <div className="flex items-center justify-center gap-2">
          <TaskMaterialDetailPopover task={task} showCost={true} />
        </div>
      ),
      width: '8%',
      sortable: false
    },
    {
      key: 'material_subtotal',
      label: 'Subt. Mat.',
      render: (task: any) => (
        <div className="text-center">
          <TaskMaterialsSubtotal task={task} />
        </div>
      ),
      width: '8%',
      sortable: false
    },
    {
      key: 'total_subtotal',
      label: 'Subtotal',
      render: (task: any) => (
        <div className="text-center">
          <TaskTotalSubtotal task={task} />
        </div>
      ),
      width: '10%',
      sortable: false
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (task: any) => (
        <div className="flex gap-1 justify-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEditTask(task)}
            className=""
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDeleteTask(task.id)}
            className=""
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: '10%',
      sortable: false
    }
  ]

  // Definir columnas específicas para agrupación por rubros y tareas (sin columna RUBRO)
  const taskGroupingColumns = [
    {
      key: 'phase',
      label: 'Fase',
      render: (task: any) => task.phase_name || 'Sin fase',
      width: 'auto'
    },
    {
      key: 'unit',
      label: 'Unidad',
      render: (task: any) => task.task?.unit_symbol || 'Sin unidad',
      width: '10%'
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      render: (task: any) => task.quantity || 0,
      width: '10%'
    }
  ]

  // Seleccionar columnas según el tipo de agrupación  
  const columns = useMemo(() => {
    // Para sin agrupar, usar todas las columnas base
    if (groupingType === 'none') {
      return baseColumns;
    }
    
    // Para agrupación por tareas, usar columnas específicas sin acciones y reordenadas
    if (groupingType === 'tasks') {
      return taskGroupingColumns;
    }
    
    // Filtrar columnas base para otros tipos de agrupación
    return baseColumns.filter(column => {
      if (groupingType === 'rubros' && column.key === 'rubro_name') return false;
      if (groupingType === 'phases' && column.key === 'phase') return false;
      if (groupingType === 'rubros-phases' && (column.key === 'rubro_name' || column.key === 'phase')) return false;
      if (groupingType === 'phases-rubros' && (column.key === 'rubro_name' || column.key === 'phase')) return false;
      return true;
    });
  }, [groupingType]);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-8 w-8" />}
        title="No hay tareas en el proyecto"
        description="Comienza creando la primera fase y sus tareas de construcción para organizar el trabajo del proyecto."
      />
    )
  }

  return (
    <Table
      columns={columns}
      data={finalTasks}
      isLoading={isLoading}
      mode="construction"
      groupBy={groupingType === 'none' ? undefined : 'groupKey'}
      topBar={{
        tabs: ['Sin Agrupar', 'Por Fases', 'Por Rubros', 'Por Tareas', 'Por Fases y Rubros', 'Por Rubros y Tareas'],
        activeTab: groupingType === 'none' ? 'Sin Agrupar' : 
                  groupingType === 'phases' ? 'Por Fases' :
                  groupingType === 'rubros' ? 'Por Rubros' :
                  groupingType === 'tasks' ? 'Por Tareas' :
                  groupingType === 'rubros-phases' ? 'Por Fases y Rubros' : 'Por Rubros y Tareas',
        onTabChange: (tab: string) => {
          if (tab === 'Sin Agrupar') setGroupingType('none')
          else if (tab === 'Por Fases') setGroupingType('phases')
          else if (tab === 'Por Rubros') setGroupingType('rubros')
          else if (tab === 'Por Tareas') setGroupingType('tasks')
          else if (tab === 'Por Fases y Rubros') setGroupingType('rubros-phases')
          else setGroupingType('phases-rubros')
        },
        showExport: true,
        onExport: handleExportToExcel,
        isExporting: isExporting
      }}
      renderCard={(task: any) => (
        <ConstructionTaskCard
          key={task.id}
          task={task}
          onEdit={onEditTask}
          onDelete={(taskToDelete) => onDeleteTask(taskToDelete.id)}
        />
      )}
      renderGroupHeader={groupingType === 'none' ? undefined : (groupKey: string, groupRows: any[]) => {
        if (groupingType === 'tasks') {
          // Para agrupación por rubros y tareas, calcular suma de cantidades
          const totalQuantity = groupRows.reduce((sum, row) => sum + (row.quantity || 0), 0);
          const unitSymbol = groupRows[0]?.task?.unit_symbol || '';
          const rubroName = groupRows[0]?.task?.rubro_name || '';
          
          return (
            <>
              <div className="col-span-1 truncate">
                {rubroName} - {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'fase' : 'fases'})
              </div>
              <div className="col-span-1">{unitSymbol}</div>
              <div className="col-span-1">{totalQuantity.toFixed(2)}</div>
            </>
          );
        } else {
          return (
            <>
              <div className="col-span-full text-sm font-medium">
                {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Tarea' : 'Tareas'})
              </div>
            </>
          );
        }
      }}
      emptyState={
        <EmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="No hay tareas que coincidan"
          description="Intenta cambiar los filtros de búsqueda para encontrar las tareas que buscas."
        />
      }
    />
  )
}