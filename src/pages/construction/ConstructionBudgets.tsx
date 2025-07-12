import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useState, useEffect, Fragment } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Calculator, Plus, Trash2, Building2, Edit, FileText, BarChart3, Settings } from 'lucide-react'
// Removed CustomTable import as we now use BudgetTable
import { CustomEmptyState } from '@/components/ui-custom/CustomEmptyState'
import { BudgetTable } from '@/components/ui-custom/misc/BudgetTable'
import { NewBudgetModal } from '@/modals/budget/NewBudgetModal'
import NewBudgetTaskModal from '@/modals/budget/NewBudgetTaskModal'
import { useBudgets } from '@/hooks/use-budgets'
import { useBudgetTasks } from '@/hooks/use-budget-tasks'
import { useTaskSearch, useTaskSearchFilterOptions, TaskSearchFilters } from '@/hooks/use-task-search'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BudgetTaskCard } from '@/components/cards/BudgetTaskCard'
import { useUnits } from '@/hooks/use-units'
import { TaskSearchCombo } from '@/components/ui-custom/misc/TaskSearchCombo'
import { Input } from '@/components/ui/input'
import { CreateGeneratedTaskUserModal } from '@/modals/user/CreateGeneratedTaskUserModal'


// Hook para obtener valores de parámetros con expression_template
const useTaskParameterValues = () => {
  return useQuery({
    queryKey: ['task-parameter-values'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameter_values')
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
  const [newBudgetModalOpen, setNewBudgetModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null)
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('')
  const [budgetTaskModalOpen, setBudgetTaskModalOpen] = useState(false)
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false)
  const [customTaskModalOpen, setCustomTaskModalOpen] = useState(false)
  const [currentBudgetId, setCurrentBudgetId] = useState<string>('')
  
  // Quick Add Task states
  const [quickTaskId, setQuickTaskId] = useState<string>('')
  const [quickQuantity, setQuickQuantity] = useState<number>(1)
  const [quickSearchQuery, setQuickSearchQuery] = useState('')
  const [taskFilters, setTaskFilters] = useState<any>({})
  const [isAddingQuickTask, setIsAddingQuickTask] = useState(false)

  const { data: userData, isLoading } = useCurrentUser()
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets(userData?.preferences?.last_project_id)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Quick task search hook con filtros
  const { data: quickTasks = [], isLoading: quickTasksLoading } = useTaskSearch(
    quickSearchQuery, 
    userData?.organization?.id || '', 
    taskFilters,
    true
  );
  
  // Hook para opciones de filtros
  const { data: filterOptions, isLoading: filterOptionsLoading } = useTaskSearchFilterOptions(
    userData?.organization?.id || ''
  );
  
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

  // Generar opciones para el TaskSearchCombo
  const quickTaskOptions = quickTasks.map(task => ({
    value: task.id,
    label: task.display_name || task.name || 'Sin nombre',
    description: `${task.category_name || ''} • ${task.subcategory_name || ''}`.trim()
  }));

  // Hook para crear tareas en presupuesto (debe estar aquí para usar en handleQuickAddTask)
  const createBudgetTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await supabase
        .from("budget_tasks")
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error("Error creating budget task:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-tasks", selectedBudgetId] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    }
  });

  // Quick add task function
  const handleQuickAddTask = async () => {
    if (!quickTaskId || !selectedBudgetId || !userData?.organization?.id) return;
    
    setIsAddingQuickTask(true);
    try {
      await createBudgetTaskMutation.mutateAsync({
        budget_id: selectedBudgetId,
        task_id: quickTaskId,
        quantity: quickQuantity,
        organization_id: userData.organization.id
      });
      
      // Reset form
      setQuickTaskId('');
      setQuickQuantity(1);
      setQuickSearchQuery('');
      
      toast({
        title: "Tarea agregada",
        description: "La tarea se agregó al presupuesto correctamente"
      });
    } catch (error) {
      console.error('Error adding quick task:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la tarea al presupuesto",
        variant: "destructive"
      });
    } finally {
      setIsAddingQuickTask(false);
    }
  };



  // Mutación para actualizar last_budget_id en user_preferences
  const updateBudgetPreferenceMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      if (!userData?.preferences?.id) {
        throw new Error('No user preferences ID available');
      }
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_budget_id: budgetId })
        .eq('id', userData.preferences.id);
      
      if (error) throw error;
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
    if (budgets.length > 0 && userData?.preferences && !selectedBudgetId) {
      if (userData.preferences.last_budget_id) {
        const lastBudgetExists = budgets.some(budget => budget.id === userData.preferences.last_budget_id);
        if (lastBudgetExists) {
          setSelectedBudgetId(userData.preferences.last_budget_id);
          console.log('Budget selector initialized with last_budget_id:', userData.preferences.last_budget_id);
        } else {
          // Si el último presupuesto no existe, seleccionar el primero
          setSelectedBudgetId(budgets[0].id);
          updateBudgetPreferenceMutation.mutate(budgets[0].id);
        }
      } else {
        // Si no hay last_budget_id, seleccionar el primero
        setSelectedBudgetId(budgets[0].id);
        updateBudgetPreferenceMutation.mutate(budgets[0].id);
      }
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

  // Reset budget selection when project changes
  useEffect(() => {
    if (filteredBudgets.length === 0) {
      setSelectedBudgetId('');
    }
  }, [userData?.preferences?.last_project_id, filteredBudgets.length]);

  // Get selected budget
  const selectedBudget = filteredBudgets.find(budget => budget.id === selectedBudgetId);

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

  // Update budget grouping mutation
  const updateBudgetGroupingMutation = useMutation({
    mutationFn: async ({ budgetId, groupByRubro }: { budgetId: string, groupByRubro: boolean }) => {
      if (!supabase) throw new Error('Supabase client not available')
      
      const { error } = await supabase
        .from('budgets')
        .update({ group_tasks_by_rubro: groupByRubro })
        .eq('id', budgetId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast({
        title: "Configuración actualizada",
        description: "La vista del presupuesto ha sido actualizada",
      })
    },
    onError: (error) => {
      console.error('Error updating budget grouping:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      })
    }
  })

  const handleDeleteBudget = (budget: Budget) => {
    setDeletingBudget(budget)
  }

  // Handle add task to budget
  const handleAddTask = (budgetId: string) => {
    setCurrentBudgetId(budgetId)
    setBudgetTaskModalOpen(true)
  }

  // Close task modal
  const handleCloseTaskModal = () => {
    setBudgetTaskModalOpen(false)
    setCurrentBudgetId('')
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



  // Custom filters for the header
  const customFilters = (
    <div className="flex gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Fecha</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="status">Estado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('created_at')
  }

  const actions = [
    <Button 
      key="new-budget"
      className="h-8 px-3 text-sm"
      onClick={() => setNewBudgetModalOpen(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Nuevo Presupuesto
    </Button>
  ]

  const headerProps = {
    icon: Calculator,
    title: "Presupuestos",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    customFilters,
    onClearFilters: clearFilters,
    actions
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

  // Budget Task Table Component using reusable BudgetTable
  function BudgetTaskTable({ budgetId }: { budgetId: string }) {
    const { budgetTasks, isLoading, updateBudgetTask, createBudgetTask, deleteBudgetTask } = useBudgetTasks(budgetId);
    const { data: parameterValues = [] } = useTaskParameterValues();
    const { data: units = [] } = useUnits();
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    
    // Group tasks by rubro if grouping is enabled
    const groupTasksByRubro = selectedBudget?.group_tasks_by_rubro || false;

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
      setCurrentBudgetId(budgetId);
      setBudgetTaskModalOpen(true);
    };

    const getUnitName = (unitId: string | null): string => {
      if (!unitId) return '-';
      const unit = units.find(u => u.id === unitId);
      return unit?.name || '-';
    };

    return (
      <BudgetTable
        budgetId={budgetId}
        budgetTasks={budgetTasks}
        isLoading={isLoading}
        groupTasksByRubro={groupTasksByRubro}
        selectedTasks={selectedTasks}
        setSelectedTasks={setSelectedTasks}
        generateTaskDisplayName={generateTaskDisplayName}
        parameterValues={parameterValues}
        getUnitName={getUnitName}
        handleUpdateQuantity={handleUpdateQuantity}
        handleDeleteTask={handleDeleteTask}
        handleAddTask={handleAddTask}
      />
    );
  }

  return (
    <Layout wide={true} headerProps={headerProps}>
      <div className="space-y-6">
        {filteredBudgets.length === 0 ? (
          <CustomEmptyState
            icon={<Calculator className="w-12 h-12 text-muted-foreground" />}
            title={searchValue ? "No se encontraron presupuestos" : "No hay presupuestos creados"}
            description={searchValue 
              ? 'Prueba ajustando los filtros de búsqueda' 
              : 'Comienza creando tu primer presupuesto para gestionar los costos del proyecto'
            }
            action={
              !searchValue && (
                <Button onClick={() => setNewBudgetModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Presupuesto
                </Button>
              )
            }
          />
        ) : (
          <>


            {/* Quick Add Task Section - Consolidated */}
            {selectedBudget && (
              <Card className="mb-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                <CardContent className="p-4">
                {/* First row: Budget Controls */}
                <div className="flex items-center justify-between w-full mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Budget Selector */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Presupuesto:
                      </span>
                      <div className="min-w-[400px]">
                        <Select value={selectedBudgetId} onValueChange={(value) => {
                          console.log('Budget selector changed to:', value);
                          console.log('User data available:', !!userData?.user?.id);
                          console.log('Preferences ID available:', !!userData?.preferences?.id);
                          
                          setSelectedBudgetId(value);
                          if (userData?.user?.id) {
                            console.log('Executing budget preference mutation...');
                            updateBudgetPreferenceMutation.mutate(value);
                          }
                        }}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona un presupuesto" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredBudgets.map((budget: Budget) => (
                              <SelectItem key={budget.id} value={budget.id}>
                                <span className="text-left">{budget.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Group by Rubro Switch */}
                    <div className="flex items-center gap-2">
                      <Switch
                        id="group-by-rubro-budget"
                        checked={selectedBudget?.group_tasks_by_rubro || false}
                        onCheckedChange={(checked) => {
                          updateBudgetGroupingMutation.mutate({ 
                            budgetId: selectedBudget.id, 
                            groupByRubro: checked 
                          });
                        }}
                      />
                      <Label htmlFor="group-by-rubro-budget" className="text-xs text-muted-foreground">
                        Agrupar por rubro
                      </Label>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        if (selectedBudget) {
                          setEditingBudget(selectedBudget)
                          setNewBudgetModalOpen(true)
                        }
                      }}
                      disabled={!selectedBudget}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => selectedBudget && handleDeleteBudget(selectedBudget)}
                      disabled={!selectedBudget}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-b border-border mb-4"></div>

                {/* Second row: Task Search and Add */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <TaskSearchCombo
                      value={quickTaskId}
                      onValueChange={setQuickTaskId}
                      searchQuery={quickSearchQuery}
                      onSearchChange={setQuickSearchQuery}
                      options={quickTaskOptions}
                      placeholder="Buscar tipo de tarea..."
                      isLoading={quickTasksLoading}
                      filters={taskFilters}
                      onFiltersChange={setTaskFilters}
                      filterOptions={filterOptions}
                      showCreateButton={true}
                      onCreateTask={() => setCustomTaskModalOpen(true)}
                    />
                  </div>
                  <div className="w-32">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={quickQuantity}
                        onChange={(e) => setQuickQuantity(Number(e.target.value) || 1)}
                        placeholder="Cantidad"
                        min="1"
                        step="0.01"
                        className="text-center"
                        style={{
                          MozAppearance: 'textfield', // Firefox
                          WebkitAppearance: 'none', // Chrome/Safari
                        }}
                        onWheel={(e) => e.preventDefault()} // Disable mouse wheel
                      />
                      {quickTaskId && getUnitName(quickTasks.find(t => t.id === quickTaskId)?.unit_id) && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {getUnitName(quickTasks.find(t => t.id === quickTaskId)?.unit_id)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleQuickAddTask}
                    disabled={!quickTaskId || isAddingQuickTask}
                    className="px-4"
                  >
                    {isAddingQuickTask ? "Agregando..." : "Agregar Tarea"}
                  </Button>
                </div>
                </CardContent>
              </Card>
            )}

            {/* Budget Table Card - Clean without extra controls */}
            <Card className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden">
              {/* Budget Tasks Table */}
              <div className="p-4">
                {selectedBudget ? (
                  <BudgetTaskTable budgetId={selectedBudget.id} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Selecciona un presupuesto para ver sus tareas
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* New Budget Modal */}
      {newBudgetModalOpen && (
        <NewBudgetModal
          open={newBudgetModalOpen}
          onClose={() => {
            setNewBudgetModalOpen(false)
            setEditingBudget(null)
          }}
          editingBudget={editingBudget}
          onSuccess={(budgetId) => setSelectedBudgetId(budgetId)}
        />
      )}

      {/* Budget Task Modal */}
      {budgetTaskModalOpen && (
        <NewBudgetTaskModal
          open={budgetTaskModalOpen}
          onClose={handleCloseTaskModal}
          budgetId={currentBudgetId}
          organizationId={userData?.organization?.id || ''}
        />
      )}

      {/* New Task Modal from TaskSearchCombo */}
      {newTaskModalOpen && (
        <NewBudgetTaskModal
          open={newTaskModalOpen}
          onClose={() => setNewTaskModalOpen(false)}
          budgetId={selectedBudget?.id || ''}
          organizationId={userData?.organization?.id || ''}
        />
      )}

      {/* Custom Task Modal from TaskSearchCombo */}
      {customTaskModalOpen && (
        <CreateGeneratedTaskUserModal
          open={customTaskModalOpen}
          onClose={() => setCustomTaskModalOpen(false)}
          onTaskCreated={(taskId) => {
            // Auto-select the created task and set quantity to 1
            setQuickTaskId(taskId)
            setQuickQuantity(1)
            setCustomTaskModalOpen(false)
            
            // Automatically add the created task to the budget
            if (selectedBudget && userData?.preferences?.last_organization_id) {
              createBudgetTaskMutation.mutate({
                budget_id: selectedBudget.id,
                task_id: taskId,
                quantity: 1,
                organization_id: userData.preferences.last_organization_id
              });
            }
          }}
        />
      )}

      {/* Delete Budget Dialog */}
      <AlertDialog open={!!deletingBudget} onOpenChange={() => setDeletingBudget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el presupuesto "{deletingBudget?.name}" y todas sus tareas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingBudget && deleteBudgetMutation.mutate(deletingBudget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}