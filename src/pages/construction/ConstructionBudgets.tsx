import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'


import { useState, useEffect, Fragment } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Calculator, Plus, Trash2, Building2, Edit, FileText, BarChart3, Settings, CheckSquare, Filter, Target } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigationStore'
// Using Table component for budget tasks display
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { Table } from '@/components/ui-custom/Table'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { useBudgets } from '@/hooks/use-budgets'
import { useBudgetTasks } from '@/hooks/use-budget-tasks'

import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BudgetTaskCard } from '@/components/cards/BudgetTaskCard'
import { useUnits } from '@/hooks/use-units'

import { Input } from '@/components/ui/input'

import { validateUserDataForDatabaseOperation, logDatabaseOperation } from '@/utils/databaseSafety'


// Hook para obtener valores de parámetros con expression_template
const useTaskParameterValues = () => {
  return useQuery({
    queryKey: ['task-parameter-values'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('task_parameter_options')
        .select(`
          name, 
          label,
          task_parameters!inner(expression_template)
        `);
      
      if (error) throw error;
      
      // Flatten the data structure to include expression_template directly
      return data?.map(item => ({
        name: item.name,
        label: item.label,
        expression_template: item.task_parameters?.expression_template || null
      })) || [];
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
    console.error("Error fetching parameter values:", error);
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
  
  // Usar display_name que ya fue procesado por el hook useBudgetTasks
  return task.display_name || task.name || 'Sin nombre';
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

  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null)
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
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching units:", error);
        throw error;
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



  // Mutación para actualizar last_budget_id en user_preferences
  const updateBudgetPreferenceMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      // ENHANCED SAFETY CHECK: Use central validation system
      const safetyCheck = validateUserDataForDatabaseOperation(userData);
      
      if (!safetyCheck.isValid) {
        console.error('🚨 DATABASE OPERATION BLOCKED:', safetyCheck.error);
        logDatabaseOperation('UPDATE_BLOCKED', 'user_preferences', userData?.user?.id, {
          reason: safetyCheck.error,
          attemptedBudgetId: budgetId,
          safetyDetails: safetyCheck.details
        });
        throw new Error(`Database operation blocked for safety: ${safetyCheck.error}`);
      }
      
      // Log the operation for audit trail
      logDatabaseOperation('UPDATE', 'user_preferences', userData.user.id, {
        field: 'last_budget_id',
        newValue: budgetId,
        preferencesId: userData.preferences.id
      });
      
      console.log('✅ Safely updating budget preference for user:', userData.user.id, 'with preferences ID:', userData.preferences.id);
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_budget_id: budgetId })
        .eq('id', userData.preferences.id)
        .eq('user_id', userData.user.id); // DOUBLE SAFETY: Also check user_id
      
      if (error) {
        console.error('❌ Database error updating budget preference:', error);
        logDatabaseOperation('UPDATE_ERROR', 'user_preferences', userData.user.id, {
          error: error.message,
          budgetId,
          preferencesId: userData.preferences.id
        });
        throw error;
      }
      
      console.log('✅ Budget preference update successful');
      return budgetId;
    },
    onSuccess: (budgetId) => {
      // Invalidar el caché del usuario para reflejar el cambio
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      console.log('Budget preference updated successfully:', budgetId);
    },
    onError: (error) => {
      console.error('Error updating budget preference:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la selección del presupuesto",
        variant: "destructive",
      });
    }
  });

  // Inicializar selectedBudgetId con last_budget_id de preferences
  useEffect(() => {
    if (budgets.length > 0 && userData?.preferences) {
      if (userData.preferences.last_budget_id) {
        const lastBudgetExists = budgets.some(budget => budget.id === userData.preferences.last_budget_id);
        if (lastBudgetExists) {
          // Solo cambiar si es diferente al actual
          if (selectedBudgetId !== userData.preferences.last_budget_id) {
            setSelectedBudgetId(userData.preferences.last_budget_id);
            console.log('Budget selector initialized with last_budget_id:', userData.preferences.last_budget_id);
          }
        } else {
          // Si el último presupuesto no existe, seleccionar el primero
          setSelectedBudgetId(budgets[0].id);
          updateBudgetPreferenceMutation.mutate(budgets[0].id);
          console.log('Last budget not found, selecting first budget:', budgets[0].id);
        }
      } else {
        // Si no hay last_budget_id, seleccionar el primero
        setSelectedBudgetId(budgets[0].id);
        updateBudgetPreferenceMutation.mutate(budgets[0].id);
        console.log('No last budget ID, selecting first budget:', budgets[0].id);
      }
    } else if (budgets.length === 0 && selectedBudgetId) {
      // Si no hay presupuestos, limpiar la selección
      setSelectedBudgetId('');
      console.log('No budgets available, clearing selection');
    }
  }, [budgets, userData?.preferences?.last_budget_id, userData?.preferences?.id]);

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

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      if (!supabase) throw new Error('Supabase client not available')
      
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto ha sido eliminado correctamente",
      })
      setDeletingBudget(null)
    },
    onError: (error) => {
      console.error('Error deleting budget:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el presupuesto",
        variant: "destructive",
      })
    }
  })

  // Local grouping state (no database persistence needed)
  const [groupingType, setGroupingType] = useState<string>('none')

  const handleDeleteBudget = (budget: Budget) => {
    setDeletingBudget(budget)
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
    updateBudgetPreferenceMutation.mutate(budgetId)
  }

  // Handle add task to budget
  const handleAddTask = (budgetId: string) => {
    console.log('Abrir modal de agregar tareas');
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
      console.error('Error deleting task:', error)
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

  return (
    <Layout wide={true} headerProps={headerProps}>

      {filteredBudgets.length === 0 ? (
        <EmptyState
          icon={<Calculator className="w-12 h-12 text-muted-foreground" />}
          title={searchValue ? "No se encontraron presupuestos" : "No hay presupuestos creados"}
          description={searchValue 
            ? 'Prueba ajustando los filtros de búsqueda' 
            : 'Comienza creando tu primer presupuesto para gestionar los costos del proyecto'
          }
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

  // Budget Task Table Component using reusable Table
  function BudgetTaskTable({ budgetId }: { budgetId: string }) {
    const { budgetTasks, isLoading, updateBudgetTask, createBudgetTask, deleteBudgetTask } = useBudgetTasks(budgetId);
    const { data: parameterValues = [] } = useTaskParameterValues();
    const { data: units = [] } = useUnits();
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    
    // Use local grouping state

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
        console.error('Error updating task quantity:', error);
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
        console.error('Error deleting task:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la tarea",
          variant: "destructive",
        });
      }
    };

    const handleAddTask = (budgetId: string) => {
      // TODO: Abrir modal de agregar tareas
      console.log('Abrir modal de agregar tareas para presupuesto:', budgetId);
    };

    const getUnitName = (unitId: string | null): string => {
      if (!unitId) return '-';
      const unit = units.find(u => u.id === unitId);
      return unit?.name || '-';
    };

    // Definir columnas para el componente Table
    const columns = [
      {
        key: 'rubro_name',
        label: 'Rubro',
        width: '10%',
        render: (item: any) => (
          <span className="text-xs">{item.task?.rubro_name || '-'}</span>
        )
      },
      {
        key: 'display_name',
        label: 'Tareas',
        width: '1fr',
        render: (item: any) => (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
            </span>
            <span className="text-xs">
              {item.task?.display_name || '-'}
            </span>
          </div>
        )
      },
      {
        key: 'unit',
        label: 'Unidad',
        width: '5%',
        render: (item: any) => (
          <span className="text-xs">{getUnitName(item.task?.unit_id)}</span>
        )
      },
      {
        key: 'quantity',
        label: 'Cantidad',
        width: '5%',
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
        key: 'unit_cost',
        label: 'P.U.',
        width: '5%',
        render: (item: any) => (
          <span className="text-xs">
            ${(item.task?.unit_cost || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        )
      },
      {
        key: 'total_cost',
        label: 'Subtotal',
        width: '5%',
        render: (item: any) => (
          <span className="text-xs text-xs">
            ${((item.quantity || 0) * (item.task?.unit_cost || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        )
      },
      {
        key: 'actions',
        label: 'Acciones',
        width: '5%',
        sortable: false,
        render: (item: any) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('budget-task-form', { 
                budgetTask: item,
                mode: 'edit'
              })}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteTask(item.id)}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
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

      return (
        <>
          <div className="text-xs font-medium">TOTAL</div>
          <div className="text-xs font-medium">{totalTasks} tareas</div>
          <div></div>
          <div></div>
          <div></div>
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

      return (
        <>
          <div className="text-xs font-medium">{groupKey}</div>
          <div className="text-xs">{groupRows.length} tareas</div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
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
        data={budgetTasks || []}
        isLoading={isLoading}
        mode="budget"
        groupBy={groupingType !== 'none' ? 'rubro_name' : undefined}
        renderGroupHeader={groupingType !== 'none' ? renderGroupHeader : undefined}
        renderFooterRow={renderFooterRow}
        selectable={true}
        selectedItems={budgetTasks?.filter(task => selectedTasks.includes(task.id)) || []}
        onSelectionChange={(selected) => setSelectedTasks(selected.map(task => task.id))}
        getItemId={(item) => item.id}
        renderCard={(item) => (
          <BudgetTaskCard
            task={item}
            processedName={item.task?.display_name || '-'}
            unitName={getUnitName(item.task?.unit_id)}
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
      {/* Feature Introduction - Mobile only */}
      <FeatureIntroduction
        title="Gestión de Presupuestos"
        icon={<Calculator className="w-6 h-6" />}
        features={[
          {
            icon: <CheckSquare className="w-4 h-4" />,
            title: "Presupuestos Detallados",
            description: "Crea y gestiona presupuestos con tareas específicas, cantidades y costos detallados por proyecto."
          },
          {
            icon: <Filter className="w-4 h-4" />,
            title: "Organización por Rubros",
            description: "Agrupa tareas por categorías para una mejor visualización y análisis de costos por área."
          },
          {
            icon: <Target className="w-4 h-4" />,
            title: "Búsqueda Inteligente",
            description: "Encuentra rápidamente tareas del catálogo o crea nuevas tareas personalizadas para tu presupuesto."
          },
          {
            icon: <BarChart3 className="w-4 h-4" />,
            title: "Control de Costos",
            description: "Monitorea el progreso y los totales de tu presupuesto en tiempo real con actualizaciones automáticas."
          }
        ]}
      />

      {/* DEBUG: Log budget info */}
      {(() => {
        console.log('🔍 PRESUPUESTOS DEBUG - budgets.length:', budgets.length);
        console.log('🔍 PRESUPUESTOS DEBUG - budgetsLoading:', budgetsLoading);
        if (budgets.length > 0) {
          console.log('🔍 PRESUPUESTOS DEBUG - budgets names:', budgets.map(b => b.name));
        }
        return null;
      })()}

      {/* ALWAYS SHOW TEST CARD */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="text-sm">
            🔍 TEST CARD - budgets.length: {budgets.length} | loading: {budgetsLoading ? 'true' : 'false'}
          </div>
        </CardContent>
      </Card>

      {/* Budget Selector Card - Always show if budgets exist */}
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
                      className="text-xs font-normal"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleDeleteSelectedBudget}
                      className="text-xs font-normal text-destructive hover:text-destructive"
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
                      className="text-xs font-normal"
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