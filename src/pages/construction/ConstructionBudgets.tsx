import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Calculator, Plus, Trash2, Building2, Edit } from 'lucide-react'
// Removed CustomTable import as we now use BudgetTable
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
import { BudgetTable } from '@/components/ui-custom/misc/BudgetTable'
import { NewBudgetModal } from '@/modals/budget/NewBudgetModal'
import NewBudgetTaskModal from '@/modals/budget/NewBudgetTaskModal'
import { useBudgets } from '@/hooks/use-budgets'
import { useBudgetTasks } from '@/hooks/use-budget-tasks'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

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

// Función para generar el nombre completo de la tarea con parámetros procesados
function generateTaskDisplayName(task: any, parameterValues: any[] = []): string {
  if (!task?.display_name || !task?.param_values) {
    return task?.display_name || 'Sin nombre';
  }

  let displayName = task.display_name;
  const paramValues = task.param_values;

  // Reemplazar placeholders del tipo {{parameter-name}} con expression_template
  Object.entries(paramValues).forEach(([paramName, paramValue]) => {
    const placeholder = `{{${paramName}}}`;
    
    // Buscar el parameter value correspondiente para obtener su expression_template
    const parameterValue = parameterValues.find(pv => pv.name === paramValue);
    
    if (parameterValue?.expression_template) {
      // Reemplazar {value} en expression_template con el valor actual
      const processedValue = parameterValue.expression_template.replace('{value}', parameterValue.label || paramValue as string);
      displayName = displayName.replace(placeholder, processedValue);
    } else if (parameterValue?.label) {
      // Fallback al label si no hay expression_template
      displayName = displayName.replace(placeholder, parameterValue.label);
    } else {
      // Fallback al valor directo si no hay ningún dato
      displayName = displayName.replace(placeholder, paramValue as string);
    }
  });

  // Limpiar cualquier placeholder que no se haya procesado y espacios extras
  displayName = displayName.replace(/\{\{[^}]+\}\}/g, '').replace(/\s+/g, ' ').trim();

  // Remover el punto final si existe (para evitar doble punto)
  if (displayName.endsWith('.')) {
    displayName = displayName.slice(0, -1);
  }

  return displayName;
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
  const [currentBudgetId, setCurrentBudgetId] = useState<string>('')
  const [editingBudgetTask, setEditingBudgetTask] = useState<any>(null)

  const { data: userData, isLoading } = useCurrentUser()
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets(userData?.preferences?.last_project_id)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mutación para actualizar last_budget_id en user_preferences
  const updateBudgetPreferenceMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_budget_id: budgetId })
        .eq('user_id', userData?.user?.id);
      
      if (error) throw error;
    },
    onError: (error) => {
      console.error('Error updating budget preference:', error);
    }
  });

  // Inicializar selectedBudgetId con last_budget_id de preferences
  useEffect(() => {
    if (userData?.preferences?.last_budget_id && budgets.length > 0 && !selectedBudgetId) {
      const lastBudgetExists = budgets.some(budget => budget.id === userData.preferences.last_budget_id);
      if (lastBudgetExists) {
        setSelectedBudgetId(userData.preferences.last_budget_id);
      } else if (budgets.length > 0) {
        // Si el último presupuesto no existe, seleccionar el primero
        setSelectedBudgetId(budgets[0].id);
        if (userData?.user?.id) {
          updateBudgetPreferenceMutation.mutate(budgets[0].id);
        }
      }
    } else if (budgets.length > 0 && !selectedBudgetId && !userData?.preferences?.last_budget_id) {
      // Si no hay last_budget_id, seleccionar el primero
      setSelectedBudgetId(budgets[0].id);
      if (userData?.user?.id) {
        updateBudgetPreferenceMutation.mutate(budgets[0].id);
      }
    }
  }, [userData?.preferences?.last_budget_id, budgets, selectedBudgetId, userData?.user?.id]);

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

  // Auto-select first budget when budgets load or project changes
  useEffect(() => {
    if (filteredBudgets.length > 0) {
      setSelectedBudgetId(filteredBudgets[0].id);
    } else {
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

  const handleDeleteBudget = (budget: Budget) => {
    setDeletingBudget(budget)
  }

  // Handle add task to budget
  const handleAddTask = (budgetId: string) => {
    setCurrentBudgetId(budgetId)
    setEditingBudgetTask(null)
    setBudgetTaskModalOpen(true)
  }

  // Handle edit task
  const handleEditTask = (budgetId: string, task: any) => {
    setCurrentBudgetId(budgetId)
    setEditingBudgetTask(task)
    setBudgetTaskModalOpen(true)
  }

  // Close task modal
  const handleCloseTaskModal = () => {
    setBudgetTaskModalOpen(false)
    setCurrentBudgetId('')
    setEditingBudgetTask(null)
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

  // Budget Task Table Component
  function BudgetTaskTable({ budgetId }: { budgetId: string }) {
    const { budgetTasks, isLoading } = useBudgetTasks(budgetId);
    const { data: parameterValues = [] } = useTaskParameterValues();
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

    // Calculate totals for percentage calculations (simplified for task_tasks)
    const totalBudgetAmount = budgetTasks?.length || 0;

    if (isLoading) {
      return <div className="p-4 text-center text-sm text-muted-foreground">Cargando tareas...</div>;
    }

    if (!budgetTasks || budgetTasks.length === 0) {
      return (
        <CustomEmptyState
          icon={<Calculator className="w-8 h-8 text-muted-foreground" />}
          title="No hay tareas en este presupuesto"
          description="Comienza agregando la primera tarea para gestionar los costos y materiales"
          action={
            <Button 
              size="sm" 
              onClick={() => handleAddTask(budgetId)}
              className="h-8 px-3 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Agregar Tarea
            </Button>
          }
        />
      );
    }

    // Calculate totals for TOTAL row (simplified since task_tasks doesn't have price fields)
    const totalQuantity = budgetTasks?.reduce((total, task) => {
      return total + (task.quantity || 0);
    }, 0) || 0;

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-8 p-2 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === (budgetTasks?.length || 0) && (budgetTasks?.length || 0) > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasks(budgetTasks?.map(task => task.id) || []);
                      } else {
                        setSelectedTasks([]);
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="p-2 text-left text-xs font-medium">Rubro</th>
                <th className="p-2 text-left text-xs font-medium">Tarea</th>
                <th className="p-2 text-left text-xs font-medium">Cantidad</th>
                <th className="p-2 text-left text-xs font-medium">Costo de Mano de Obra</th>
                <th className="p-2 text-left text-xs font-medium">Costo de Materiales</th>
                <th className="p-2 text-left text-xs font-medium">Subtotal</th>
                <th className="p-2 text-left text-xs font-medium">% de Incidencia</th>
                <th className="p-2 text-left text-xs font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {budgetTasks?.map((task: any) => {
                // Simplified calculations since task_tasks doesn't have price fields
                const percentage = totalBudgetAmount > 0 ? (1 / totalBudgetAmount) * 100 : 0;

                return (
                  <tr key={task.id} className="border-b hover:bg-muted/20">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks(prev => [...prev, task.id]);
                          } else {
                            setSelectedTasks(prev => prev.filter(id => id !== task.id));
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="p-2">
                      <div className="font-medium text-sm">{task.task?.rubro_name || 'Sin rubro'}</div>
                    </td>
                    <td className="p-2 text-sm">
                      {generateTaskDisplayName(task.task, parameterValues)}
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={task.quantity || 0}
                        onChange={(e) => {
                          console.log('Editing quantity:', e.target.value);
                        }}
                        className="w-20 px-2 py-1 text-sm border rounded"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="p-2 text-sm">$0</td>
                    <td className="p-2 text-sm">$0</td>
                    <td className="p-2 text-sm font-medium">$0</td>
                    <td className="p-2 text-sm text-muted-foreground">{percentage.toFixed(1)}%</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTask(budgetId, task)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* TOTAL Row */}
              <tr className="border-b-2 bg-accent/10 font-medium">
                <td className="p-2"></td>
                <td className="p-2 text-sm font-semibold">TOTAL</td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2 text-sm font-semibold">$0</td>
                <td className="p-2 text-sm font-semibold">100.0%</td>
                <td className="p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Presupuestos</p>
                      <p className="text-2xl font-semibold">{filteredBudgets.length}</p>
                    </div>
                    <Calculator className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total General</p>
                      <p className="text-2xl font-semibold">$0</p>
                    </div>
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Single Budget Card with Selector */}
            <Card className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between w-full p-4 border-b">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Presupuesto:
                  </span>
                  
                  {/* Budget Selector */}
                  <div className="flex-1">
                    <Select value={selectedBudgetId} onValueChange={(value) => {
                      setSelectedBudgetId(value);
                      if (userData?.user?.id) {
                        updateBudgetPreferenceMutation.mutate(value);
                      }
                    }}>
                      <SelectTrigger className="w-full max-w-sm">
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
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => selectedBudget && handleAddTask(selectedBudget.id)}
                    disabled={!selectedBudget}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Agregar Tarea
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      if (selectedBudget) {
                        setEditingBudget(selectedBudget)
                        setNewBudgetModalOpen(true)
                      }
                    }}
                    disabled={!selectedBudget}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => selectedBudget && handleDeleteBudget(selectedBudget)}
                    disabled={!selectedBudget}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
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
          editingTask={editingBudgetTask}
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