import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
// AlertDialog removido - ahora usamos modal de confirmación centralizado
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useState, useEffect, Fragment, useMemo } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Calculator, Plus, Trash2, Building2, Edit, FileText, Settings } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigationStore'
// Using Table component for budget tasks display
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { useBudgets, useDeleteBudget } from '@/hooks/use-budgets'
import { useBudgetTasks } from '@/hooks/use-budget-tasks'

import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
// Removed direct Supabase import - now using server endpoints
import { BudgetTaskCard } from '@/components/cards/BudgetTaskCard'
import { useUnits } from '@/hooks/use-units'
import { TaskMaterialDetailPopover } from '@/components/popovers/TaskMaterialDetailPopover'

import { Input } from '@/components/ui/input'

// Eliminado sistema de logs de seguridad de base de datos


// Hook para obtener valores de parámetros con expression_template
const useTaskParameterValues = () => {
  return useQuery({
    queryKey: ['task-parameter-values'],
    queryFn: async () => {
      // Use server endpoint instead of direct Supabase access
      const response = await fetch('/api/task-parameter-values', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data || []
    }
  });
};

// Función para procesar el display_name con expression_templates (igual que en el modal)
async function processDisplayName(displayName: string, paramValues: any): Promise<string> {
  if (!displayName || !paramValues || !supabase) return displayName;
  
  let processed = displayName;
  
  // Obtener los valores reales de los parámetros
  const paramValueIds = Object.values(paramValues);
  if (paramValueIds.length === 0) return displayName;
  
  const { data: parameterValues, error } = await supabase
    .from('task_parameter_values')
    .select(`
      name, 
      label,
      parameter_id,
      task_parameters!inner(expression_template)
    `)
    .in('name', paramValueIds);
  
  if (error) {
    return displayName;
  }
  
  // Reemplazar placeholders usando expression_template o label
  Object.keys(paramValues).forEach(key => {
    const placeholder = `{{${key}}}`;
    const paramValueId = paramValues[key];
    
    // Buscar el valor correspondiente
    const paramValue = parameterValues?.find(pv => pv.name === paramValueId);
    
    if (paramValue) {
      // Usar expression_template si existe, sino usar label
      let replacement = paramValue.task_parameters?.expression_template || paramValue.label || '';
      
      // Si el replacement contiene {value}, reemplazarlo con el label
      if (replacement && replacement.includes('{value}')) {
        replacement = replacement.replace(/{value}/g, paramValue.label || '');
      }
      
      processed = processed.replace(new RegExp(placeholder, 'g'), replacement);
    }
  });
  
  // Clean up multiple spaces and trim the final result
  return processed.replace(/\s+/g, ' ').trim();
}

// Función para generar el nombre completo de la tarea usando los datos ya procesados
function generateTaskDisplayName(task: any, parameterValues: any[] = []): string {
  if (!task) return 'Sin nombre';
  
  // Usar name_rendered que viene de construction_tasks_view
  return task.name_rendered || task.name || 'Sin nombre';
}

interface Budget {
  id: string
  name: string
  description?: string
  project_id: string
  organization_id: string
  status: string
  created_at: string
  created_by: string
  group_tasks_by_rubro?: boolean
}

interface BudgetTask {
  id: string
  budget_id: string
  task_id: string
  quantity: number
  start_date: string | null
  end_date: string | null
  organization_id: string
  task: {
    id: string
    code: string
    name: string
    template_id: string | null
    param_values: any
    is_public: boolean
    organization_id: string
    unit_id: string | null
  }
}



export default function ConstructionBudgets() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('created_at')

  // Estado de eliminación removido - ahora usamos modal de confirmación
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('')

  const { data: userData, isLoading } = useCurrentUser()
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets(userData?.preferences?.last_project_id)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [])


  
  // Hook para obtener unidades
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        return [];
      }

      return data || [];
    },
  });

  // Función para obtener el nombre de la unidad por ID
  const getUnitName = (unitId: string | null) => {
    if (!unitId) return '-';
    const unit = units.find(u => u.id === unitId);
    return unit?.name || '-';
  };

  // Obtener parámetros para generar nombres de tareas
  const { data: parameterValues = [] } = useQuery({
    queryKey: ['task-parameter-values', userData?.organization?.id],
    queryFn: async () => {
      if (!supabase || !userData?.organization?.id) return [];
      
      const { data, error } = await supabase
        .from('task_parameter_values')
        .select('*')
        .eq('organization_id', userData.organization.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.organization?.id
  });



  // Ya no necesitamos guardar last_budget_id ya que esa columna fue removida

  // Inicializar selectedBudgetId con el primer presupuesto disponible
  useEffect(() => {
    if (budgets.length > 0 && !selectedBudgetId) {
      setSelectedBudgetId(budgets[0].id);
    } else if (budgets.length === 0 && selectedBudgetId) {
      setSelectedBudgetId('');
    }
  }, [budgets.length, selectedBudgetId]);

  // Filter and sort budgets
  const filteredBudgets = budgets
    .filter((budget: Budget) =>
      budget.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      budget.description?.toLowerCase().includes(searchValue.toLowerCase())
    )
    .sort((a: Budget, b: Budget) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Only reset budget selection when there are no budgets available
  useEffect(() => {
    if (filteredBudgets.length === 0 && selectedBudgetId !== '') {
      setSelectedBudgetId('');
    }
  }, [filteredBudgets.length, selectedBudgetId]);

  // Get selected budget - with fallback to first budget if selected doesn't exist
  const selectedBudget = filteredBudgets.find(budget => budget.id === selectedBudgetId) || filteredBudgets[0];



  // Use the migrated delete budget hook
  const deleteBudgetMutation = useDeleteBudget()



  const handleDeleteBudget = (budget: Budget) => {
    openModal('delete-confirmation', {
      title: 'Eliminar presupuesto',
      message: `¿Estás seguro de que quieres eliminar el presupuesto "${budget.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      onConfirm: () => deleteBudgetMutation.mutate(budget.id),
      isDangerous: true
    });
  }

  const handleEditBudget = () => {
    if (selectedBudget) {
      openModal('budget', { 
        budget: selectedBudget,
        isEditing: true 
      })
    }
  }

  const handleDeleteSelectedBudget = () => {
    if (selectedBudget) {
      handleDeleteBudget(selectedBudget)
    }
  }

  const handleBudgetChange = (budgetId: string) => {
    setSelectedBudgetId(budgetId)
    // Ya no guardamos en user_preferences porque la columna last_budget_id fue removida
  }

  // Handle add task to budget
  const handleAddTask = (budgetId: string) => {
    openModal('budget-task-bulk-add', { 
      budgetId,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['budget-tasks'] });
      }
    });
  }

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!supabase) throw new Error('Supabase client not available')
      
      const { error } = await supabase
        .from('budget_tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-tasks'] })
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada del presupuesto",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      })
    }
  })

  // Handle delete task
  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId)
  }



  const headerProps = {
    icon: Calculator,
    title: "Presupuestos",
    actionButton: {
      label: 'Nuevo Presupuesto',
      icon: Plus,
      onClick: () => openModal('budget', {})
    }
  }

  if (isLoading || budgetsLoading) {
    return (
      <Layout wide={true} headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          Cargando presupuestos...
        </div>
      </Layout>
    )
  }

  // REMOVING EARLY RETURN - This was causing the problem!

  // Budget Task Table Component using reusable Table
  function BudgetTaskTable({ budgetId }: { budgetId: string }) {
    const { budgetTasks, isLoading, updateBudgetTask, createBudgetTask, deleteBudgetTask } = useBudgetTasks(budgetId);
    const { data: parameterValues = [] } = useTaskParameterValues();
    const { data: units = [] } = useUnits();
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    
    // Local grouping state for budget tasks (default to 'rubros')
    const [groupingType, setGroupingType] = useState<string>('rubros');

    // Add grouping logic for budget tasks
    const groupedBudgetTasks = useMemo(() => {
      if (!budgetTasks) return [];
      
      return budgetTasks.map(task => {
        let groupKey = 'Sin grupo';
        
        switch (groupingType) {
          case 'rubros':
            groupKey = task.category_name || 'Sin rubro';
            break;
          case 'phases':
            groupKey = task.phase_name || 'Sin fase';
            break;
          case 'rubros-phases':
            groupKey = `${task.category_name || 'Sin rubro'} - ${task.phase_name || 'Sin fase'}`;
            break;
          case 'phases-rubros':
            groupKey = `${task.phase_name || 'Sin fase'} - ${task.category_name || 'Sin rubro'}`;
            break;
          case 'tasks':
            groupKey = task.name_rendered || 'Sin nombre';
            break;
          default:
            groupKey = 'Todas las tareas';
        }

        return {
          ...task,
          groupKey
        };
      });
    }, [budgetTasks, groupingType]);

    // Helper functions
    const handleUpdateQuantity = async (taskId: string, newQuantity: number) => {
      try {
        const task = budgetTasks?.find(t => t.id === taskId);
        if (!task) return;

        await updateBudgetTask.mutateAsync({
          id: taskId,
          budget_id: budgetId,
          task_id: task.task_id,
          quantity: newQuantity,
          start_date: task.start_date,
          end_date: task.end_date,
          priority: task.priority,
          dependencies: task.dependencies,
          organization_id: task.organization_id,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar la cantidad",
          variant: "destructive",
        });
      }
    };

    const handleDeleteTask = async (taskId: string) => {
      try {
        if (!supabase) throw new Error('Supabase client not available');
        
        const { error } = await supabase
          .from('budget_tasks')
          .delete()
          .eq('id', taskId);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['budget-tasks', budgetId] });
        
        toast({
          title: "Tarea eliminada",
          description: "La tarea se eliminó del presupuesto correctamente",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar la tarea",
          variant: "destructive",
        });
      }
    };

    const handleAddTask = (budgetId: string) => {
      // TODO: Abrir modal de agregar tareas
    };

    const getUnitName = (unitId: string | null): string => {
      if (!unitId) return '-';
      const unit = units.find(u => u.id === unitId);
      return unit?.name || '-';
    };

    // Definir columnas para el componente Table - ocultar columna Rubro cuando agrupamos por rubros
    const columns = [
      ...(groupingType !== 'rubros' ? [{
        key: 'category_name',
        label: 'Rubro',
        width: '12%',
        render: (item: any) => (
          <span className="text-xs">{item.category_name || '-'}</span>
        )
      }] : []),
      {
        key: 'display_name',
        label: 'Tarea',
        width: '1fr',
        render: (item: any) => (
          <span className="text-xs">
            {item.name_rendered || '-'}
          </span>
        )
      },
      {
        key: 'unit',
        label: 'Unidad',
        width: '8%',
        render: (item: any) => (
          <span className="text-xs">{getUnitName(item.task?.unit_id)}</span>
        )
      },
      {
        key: 'quantity',
        label: 'Cantidad',
        width: '8%',
        render: (item: any) => (
          <Input
            type="number"
            value={item.quantity || 0}
            onChange={(e) => handleUpdateQuantity(item.id, parseFloat(e.target.value) || 0)}
            className="h-7 text-xs"
            step="0.01"
            min="0"
          />
        )
      },
      {
        key: 'task_type',
        label: 'Tipo',
        width: '8%',
        render: (item: any) => (
          <span className="text-xs">{item.task?.task_type || 'Estándar'}</span>
        )
      },
      {
        key: 'unit_cost',
        label: 'Costo',
        width: '8%',
        render: (item: any) => (
          <div className="flex items-center justify-center">
            <TaskMaterialDetailPopover task={{ task_id: item.task_id }} showCost={true} />
          </div>
        ),
        sortable: false
      },
      {
        key: 'margin',
        label: 'Margen',
        width: '8%',
        render: (item: any) => (
          <span className="text-xs">{item.task?.margin_percent || 0}%</span>
        )
      },
      {
        key: 'total_cost',
        label: 'Subtotal',
        width: '10%',
        render: (item: any) => (
          <span className="text-xs font-medium">
            ${((item.quantity || 0) * (item.task?.unit_cost || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        )
      },
      {
        key: 'actions',
        label: 'Acciones',
        width: '8%',
        sortable: false,
        render: (item: any) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openModal('budget-task-form', { 
                budgetTask: item,
                mode: 'edit'
              })}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDeleteTask(item.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )
      }
    ];

    // Función para renderizar la fila de totales
    const renderFooterRow = () => {
      const totalTasks = budgetTasks?.length || 0;
      const totalCost = budgetTasks?.reduce((sum, task) => 
        sum + ((task.quantity || 0) * (task.task?.unit_cost || 0)), 0
      ) || 0;

      // Ajustar el número de columnas según si se muestra la columna Rubro
      const rubroColumn = groupingType !== 'rubros' ? [<div key="rubro" className="text-xs font-medium">TOTAL</div>] : [];
      const emptyColumns = groupingType !== 'rubros' ? 6 : 5; // Ajustar columnas vacías

      return (
        <>
          {rubroColumn}
          <div className="text-xs font-medium">{groupingType === 'rubros' ? 'TOTAL' : `${totalTasks} tareas`}</div>
          {Array.from({ length: emptyColumns }, (_, i) => <div key={i}></div>)}
          <div className="text-xs font-medium text-green-600">
            ${totalCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div></div>
        </>
      );
    };

    // Función para renderizar header de grupo
    const renderGroupHeader = (groupKey: string, groupRows: any[]) => {
      const groupTotal = groupRows.reduce((sum, task) => 
        sum + ((task.quantity || 0) * (task.task?.unit_cost || 0)), 0
      );

      // Ajustar el número de columnas según si se muestra la columna Rubro
      const rubroColumn = groupingType !== 'rubros' ? [<div key="rubro" className="text-xs font-medium">{groupKey}</div>] : [];
      const emptyColumns = groupingType !== 'rubros' ? 6 : 5; // Ajustar columnas vacías

      return (
        <>
          {rubroColumn}
          <div className="text-xs font-medium">{groupingType === 'rubros' ? groupKey : `${groupRows.length} tareas`}</div>
          {Array.from({ length: emptyColumns }, (_, i) => <div key={i}></div>)}
          <div className="text-xs font-medium">
            ${groupTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div></div>
        </>
      );
    };

    return (
      <Table
        columns={columns}
        data={groupedBudgetTasks || []}
        isLoading={isLoading}
        mode="budget"
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
          }
        }}
        renderGroupHeader={groupingType === 'none' ? undefined : (groupKey: string, groupRows: any[]) => {
          const groupTotal = groupRows.reduce((sum, task) => 
            sum + ((task.quantity || 0) * (task.task?.unit_cost || 0)), 0
          );
          
          return (
            <>
              <div className="col-span-full text-sm font-medium">
                {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Tarea' : 'Tareas'}) - ${groupTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
            </>
          );
        }}
        renderFooterRow={renderFooterRow}
        selectable={true}
        selectedItems={groupedBudgetTasks?.filter(task => selectedTasks.includes(task.id)) || []}
        onSelectionChange={(selected) => setSelectedTasks(selected.map(task => task.id))}
        getItemId={(item) => item.id}
        renderCard={(item) => (
          <BudgetTaskCard
            task={item}
            processedName={item.name_rendered || '-'}
            unitName={getUnitName(item.unit_id)}
            onEdit={() => openModal('budget-task-form', { 
              budgetTask: item,
              mode: 'edit'
            })}
            onDelete={() => handleDeleteTask(item.id)}
          />
        )}
      />
    );
  }



  return (
    <Layout wide={true} headerProps={headerProps}>

      {/* Budget Selector Card */}
      {budgets.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Seleccionar Presupuesto</label>
                <Select value={selectedBudgetId || ''} onValueChange={handleBudgetChange}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Selecciona un presupuesto" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets.map((budget) => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {selectedBudget && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditBudget()}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleDeleteSelectedBudget}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        openModal('budget-task-bulk-add', { 
                          budgetId: selectedBudget.id,
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: ['budget-tasks', selectedBudget.id] });
                          }
                        })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Nueva Tarea
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {budgets.length === 0 ? (
        <EmptyState
          icon={<Calculator className="w-12 h-12 text-muted-foreground" />}
          title="No hay presupuestos creados"
          description="Comienza creando tu primer presupuesto para gestionar los costos del proyecto"
        />
      ) : (
        <>
          {/* Budget Task Table */}
          {selectedBudget && (
            <BudgetTaskTable budgetId={selectedBudget.id} />
          )}
        </>
      )}
    </Layout>
  )
}