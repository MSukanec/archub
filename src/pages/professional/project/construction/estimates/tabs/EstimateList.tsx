import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { CheckSquare, Edit, Trash2, Plus, Eye, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { exportToExcel, createExportColumns } from '@/lib/export-utils'
import ConstructionTaskCard from '@/components/ui/cards/ConstructionTaskCard'
import { TaskCostPopover } from '@/components/popovers/TaskCostPopover'
import TaskMaterialsSubtotal from '@/components/construction/TaskMaterialsSubtotal'
import TaskMaterialsUnitCost from '@/components/construction/TaskMaterialsUnitCost'
import TaskLaborCost from '@/components/construction/TaskLaborCost'
import TaskLaborSubtotal from '@/components/construction/TaskLaborSubtotal'
import TaskTotalSubtotal from '@/components/construction/TaskTotalSubtotal'
import GroupSubtotal from '@/components/construction/GroupSubtotal'
import TaskRow from '@/components/ui/data-row/rows/TaskRow'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { cn } from '@/lib/utils'

interface EstimateListProps {
  tasks: any[]
  isLoading: boolean
  onEditTask: (task: any) => void
  onDeleteTask: (taskId: string) => void
}

export function EstimateList({ 
  tasks, 
  isLoading, 
  onEditTask, 
  onDeleteTask 
}: EstimateListProps) {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [groupingType, setGroupingType] = useState('rubros-phases')
  const [filterType, setFilterType] = useState('all')
  const [isExporting, setIsExporting] = useState(false)
  const { openModal } = useGlobalModalStore()

  // Filtrar tareas según búsqueda
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    // Aplicar filtro de búsqueda si existe
    if (searchValue.trim()) {
      const searchTerm = searchValue.toLowerCase();
      filtered = filtered.filter(task => {
        const displayName = task.custom_name || task.task?.display_name || '';
        const divisionName = task.division_name || '';
        const phaseName = task.phase_name || '';
        
        return (
          displayName.toLowerCase().includes(searchTerm) ||
          divisionName.toLowerCase().includes(searchTerm) ||
          phaseName.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Aplicar filtros por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(task => {
        switch (filterType) {
          case 'phase':
            return task.phase_name && task.phase_name.trim() !== '';
          case 'rubro':
            return task.division_name && task.division_name.trim() !== '';
          default:
            return true;
        }
      });
    }
    
    return filtered.map(task => {
      let groupKey = '';
      
      switch (groupingType) {
        case 'phases':
          groupKey = task.phase_name || 'Sin fase';
          break;
        case 'rubros':
          groupKey = task.division_name || 'Sin rubro';
          break;
        case 'tasks':
          const customName = task.custom_name || task.task?.display_name;
          // Solo mostrar si existe custom_name y no es un UUID
          if (customName && !customName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            groupKey = customName;
          } else {
            groupKey = task.task?.display_name || 'Sin nombre';
          }
          break;
        case 'rubros-phases':
          groupKey = `${task.division_name || 'Sin rubro'} - ${task.phase_name || 'Sin fase'}`;
          break;
        case 'phases-rubros':
          groupKey = `${task.phase_name || 'Sin fase'} - ${task.division_name || 'Sin rubro'}`;
          break;
        default:
          groupKey = '';
      }
      
      return {
        ...task,
        groupKey
      };
    });
  }, [tasks, searchValue, groupingType, filterType]);

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

  // Handle PDF export
  const handleExportToPDF = () => {
    if (finalTasks.length === 0) return

    const pdfConfig = [
      { 
        type: "header", 
        enabled: true, 
        data: { title: "Presupuesto de Tareas de Construcción" } 
      },
      { 
        type: "budgetTable", 
        enabled: true, 
        data: { tasks: finalTasks } 
      },
      { 
        type: "footer", 
        enabled: true, 
        data: { text: "Generado con Archub" } 
      },
    ]

    openModal('pdf-exporter', {
      blocks: pdfConfig,
      filename: `tareas-construccion-${format(new Date(), 'yyyy-MM-dd')}.pdf`
    })
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
      key: 'division_name',
      label: 'Rubro',
      render: (task: any) => task.division_name || 'Sin rubro',
      width: '10%'
    },
    {
      key: 'display_name',
      label: 'Tarea',
      render: (task: any) => {
        const customName = task.custom_name || task.task?.display_name;
        const taskName = (customName && !customName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) 
          ? customName 
          : (task.task?.display_name || 'Sin nombre');
        
        return (
          <div className="space-y-1">
            <div className="font-bold">{taskName}</div>
            {task.description && (
              <div className="text-xs text-muted-foreground">{task.description}</div>
            )}
          </div>
        );
      },
      width: 'auto'
    },
    {
      key: 'unit',
      label: 'Unidad',
      render: (task: any) => task.unit || '-',
      width: '8%'
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      render: (task: any) => {
        const quantity = task.quantity || 0;
        return quantity.toFixed(2);
      },
      width: '8%'
    },
    {
      key: 'unit_cost',
      label: 'Costo por Unidad',
      render: (task: any) => (
        <div className="flex items-center justify-center gap-2">
          <TaskMaterialsUnitCost task={task} />
          <TaskCostPopover task={task} showCost={false} />
        </div>
      ),
      width: '10%',
      sortable: false
    },
    {
      key: 'total_subtotal',
      label: 'Subtotal',
      render: (task: any) => {
        const quantity = task.quantity || 0;
        // Obtener el costo por unidad del componente TaskMaterialsSubtotal
        // Por ahora usamos TaskTotalSubtotal que debería ser cantidad * costo unitario
        return (
          <div className="text-center">
            <TaskTotalSubtotal task={task} />
          </div>
        );
      },
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
            size="sm"
            onClick={() => onEditTask(task)}
            className=""
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
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
      if (groupingType === 'rubros' && column.key === 'division_name') return false;
      if (groupingType === 'phases' && column.key === 'phase') return false;
      if (groupingType === 'rubros-phases' && (column.key === 'division_name' || column.key === 'phase')) return false;
      if (groupingType === 'phases-rubros' && (column.key === 'division_name' || column.key === 'phase')) return false;
      return true;
    });
  }, [groupingType]);

  if (tasks.length === 0) {
    return (
      <EmptyState
        image="/Estimates.png"
        title="No hay tareas en el proyecto"
        description="Comienza creando la primera fase y sus tareas de construcción para organizar el trabajo del proyecto."
        action={
          <Button onClick={() => openModal('construction-single-task', {})}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Tarea
          </Button>
        }
      />
    )
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchValue('')
    setSortBy('created_at')
    setGroupingType('rubros-phases')
  }

  // Render filter popover content
  const renderFilterContent = () => {
    const filterOptions = [
      { value: 'all', label: 'Todas las tareas' },
      { value: 'phase', label: 'Solo con fase' },
      { value: 'rubro', label: 'Solo con rubro' }
    ];

    return (
      <>
        <div className="text-xs font-medium mb-2 block">Filtrar por</div>
        <div className="space-y-1">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filterType === option.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterType(option.value)}
              className={cn(
                "w-full justify-start text-xs font-normal h-8",
                filterType === option.value ? "button-secondary-pressed hover:bg-secondary" : ""
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </>
    );
  };

  // Render grouping popover content
  const renderGroupingContent = () => {
    const groupingOptions = [
      { value: 'none', label: 'Sin agrupar' },
      { value: 'phases', label: 'Agrupar por fases' },
      { value: 'rubros', label: 'Agrupar por rubros' },
      { value: 'tasks', label: 'Agrupar por tareas' },
      { value: 'rubros-phases', label: 'Agrupar por fases y rubros' },
      { value: 'phases-rubros', label: 'Agrupar por rubros y tareas' }
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
              onClick={() => setGroupingType(option.value)}
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

  return (
    <Table
      columns={columns}
      data={finalTasks}
      isLoading={isLoading}
      mode="construction"
      groupBy={groupingType === 'none' ? undefined : 'groupKey'}
      topBar={{
        showSearch: true,
        searchValue: searchValue,
        onSearchChange: setSearchValue,
        renderFilterContent: renderFilterContent,
        isFilterActive: filterType !== 'all',
        renderGroupingContent: renderGroupingContent,
        isGroupingActive: groupingType !== 'none',
        onExport: handleExportToExcel,
        onExportPDF: handleExportToPDF,
        isExporting: isExporting
      }}
      renderCard={(task: any) => (
        <TaskRow
          key={task.id}
          task={task}
        />
      )}
      renderGroupHeader={groupingType === 'none' ? undefined : (groupKey: string, groupRows: any[]) => {
        if (groupingType === 'tasks') {
          const totalQuantity = groupRows.reduce((sum, row) => sum + (row.quantity || 0), 0);
          const unitSymbol = groupRows[0]?.task?.unit_symbol || '';
          const rubroName = groupRows[0]?.task?.division_name || '';
          
          return (
            <>
              <div className="col-span-1 truncate text-white">
                {rubroName} - {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'fase' : 'fases'})
              </div>
              <div className="col-span-1 text-white">{unitSymbol}</div>
              <div className="col-span-1 text-white">{totalQuantity.toFixed(2)}</div>
            </>
          );
        } else if (groupingType === 'rubros-phases') {
          // Para "Por Fases y Rubros" - mostrar subtotal usando un componente especial
          const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(amount);
          };
          
          return (
            <>
              <div className="truncate text-sm font-medium text-white">
                {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Tarea' : 'Tareas'})
              </div>
              <div></div>
              <div></div>
              <div></div>
              <div className="text-left font-medium">
                <GroupSubtotal tasks={groupRows} />
              </div>
              <div></div>
            </>
          );
        } else {
          return (
            <>
              <div className="col-span-full text-sm font-medium text-white">
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