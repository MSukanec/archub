import { Fragment, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { Calculator } from 'lucide-react';
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState';

interface BudgetTask {
  id: string;
  budget_id: string;
  task_id: string;
  quantity: number;
  start_date: string | null;
  end_date: string | null;
  organization_id: string;
  task: {
    id: string;
    code: string;
    name: string;
    template_id: string | null;
    param_values: any;
    is_public: boolean;
    organization_id: string;
    unit_id: string | null;
    rubro_name?: string;
    display_name?: string;
    category_name?: string;
    subcategory_name?: string;
  };
}

interface BudgetTableProps {
  budgetId: string;
  budgetTasks: BudgetTask[] | undefined;
  isLoading: boolean;
  groupTasksByRubro: boolean;
  selectedTasks: string[];
  setSelectedTasks: (tasks: string[]) => void;
  generateTaskDisplayName: (task: any, parameterValues: any[]) => string;
  parameterValues: any[];
  getUnitName: (unitId: string | null) => string;
  handleUpdateQuantity: (taskId: string, quantity: number) => void;
  handleDeleteTask: (taskId: string) => void;
  handleAddTask: (budgetId: string) => void;
}

export function BudgetTable({
  budgetId,
  budgetTasks,
  isLoading,
  groupTasksByRubro,
  selectedTasks,
  setSelectedTasks,
  generateTaskDisplayName,
  parameterValues,
  getUnitName,
  handleUpdateQuantity,
  handleDeleteTask,
  handleAddTask
}: BudgetTableProps) {
  // Local state for input values to prevent interruption during typing
  const [localQuantities, setLocalQuantities] = useState<Record<string, string>>({});
  
  // Update local quantities when budget tasks change
  useEffect(() => {
    if (budgetTasks) {
      const quantities: Record<string, string> = {};
      budgetTasks.forEach(task => {
        quantities[task.id] = String(task.quantity || 0);
      });
      setLocalQuantities(quantities);
    }
  }, [budgetTasks]);
  
  // Handle quantity input change (local state only)
  const handleQuantityInputChange = (taskId: string, value: string) => {
    setLocalQuantities(prev => ({
      ...prev,
      [taskId]: value
    }));
  };
  
  // Handle quantity save (when user finishes typing)
  const handleQuantitySave = (taskId: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    handleUpdateQuantity(taskId, numericValue);
  };
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

  // Group tasks by rubro if enabled
  const groupedTasks = groupTasksByRubro 
    ? budgetTasks.reduce((acc, task) => {
        const rubroName = task.task?.rubro_name || 'Sin rubro';
        if (!acc[rubroName]) acc[rubroName] = [];
        acc[rubroName].push(task);
        return acc;
      }, {} as Record<string, BudgetTask[]>)
    : { 'Todas las tareas': budgetTasks };

  // Calculate totals for TOTAL row (simplified since task_tasks doesn't have price fields)
  const totalQuantity = budgetTasks?.reduce((total, task) => {
    return total + (task.quantity || 0);
  }, 0) || 0;

  // Total budget amount (placeholder since we don't have real pricing yet)
  const totalBudgetAmount = 0;

  // Mobile card component for individual tasks
  const BudgetTaskCard = ({ task, processedName, unitName, onEdit, onDelete }: any) => (
    <Card className="p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm leading-tight mb-1">
            {processedName}
          </div>
          <div className="text-xs text-muted-foreground">
            {task.task?.rubro_name || 'Sin rubro'} • {task.task?.category_name || 'Sin categoría'}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(task.id)}
          className="h-7 w-7 p-0 text-destructive hover:text-destructive ml-2"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Cantidad:</span>
          <input
            type="number"
            value={localQuantities[task.id] || '0'}
            onChange={(e) => handleQuantityInputChange(task.id, e.target.value)}
            onBlur={(e) => handleQuantitySave(task.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="w-16 px-1 py-0.5 text-xs border rounded"
            min="0"
            step="0.01"
          />
          <span className="text-muted-foreground">{unitName}</span>
        </div>
        <div className="text-right">
          <div className="font-medium">$0</div>
          <div className="text-muted-foreground">0.0%</div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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
              <th className="w-16 p-2 text-left text-xs font-medium">ID</th>
              {!groupTasksByRubro && (
                <th className="p-2 text-left text-xs font-medium">Rubro</th>
              )}
              <th className="p-2 text-left text-xs font-medium">Tarea</th>
              <th className="p-2 text-left text-xs font-medium">Unid.</th>
              <th className="p-2 text-left text-xs font-medium">Cant.</th>
              <th className="p-2 text-left text-xs font-medium">M.O.</th>
              <th className="p-2 text-left text-xs font-medium">Mat.</th>
              <th className="p-2 text-left text-xs font-medium">Subtotal</th>
              <th className="p-2 text-left text-xs font-medium">% Inc.</th>
              <th className="p-2 text-left text-xs font-medium">Acc.</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedTasks).map(([rubroName, tasks], rubroIndex) => {
              // Calculate rubro subtotal (all tasks in this rubro have subtotal $0 for now)
              const rubroSubtotal = tasks.reduce((sum, task) => sum + 0, 0); // Will be $0 until real pricing is implemented
              const rubroPercentage = totalBudgetAmount > 0 ? (rubroSubtotal / totalBudgetAmount) * 100 : 0;
              const rubroNumber = rubroIndex + 1;
              
              return (
                <Fragment key={rubroName}>
                  {/* Rubro Header Row (only show if grouping is enabled) */}
                  {groupTasksByRubro && (
                    <tr className="border-b" style={{ backgroundColor: 'var(--table-header-bg)' }}>
                      <td className="p-3"></td>
                      <td className="p-3">
                        <div className="font-semibold text-sm" style={{ color: 'var(--table-header-fg)' }}>
                          {rubroNumber}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-sm capitalize" style={{ color: 'var(--table-header-fg)' }}>
                          {rubroName.toLowerCase()}
                        </div>
                      </td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      <td className="p-3 text-sm font-semibold" style={{ color: 'var(--table-header-fg)' }}>${rubroSubtotal.toLocaleString()}</td>
                      <td className="p-3 text-sm font-semibold" style={{ color: 'var(--table-header-fg)' }}>{rubroPercentage.toFixed(1)}%</td>
                      <td className="p-3"></td>
                    </tr>
                  )}
                  
                  {/* Task Rows */}
                  {tasks.map((task: any, taskIndex) => {
                    const percentage = totalBudgetAmount > 0 ? (1 / totalBudgetAmount) * 100 : 0;
                    
                    // Generate ID based on grouping mode
                    let taskId: string;
                    if (groupTasksByRubro) {
                      // Hierarchical: 1.1, 1.2, 2.1, 2.2, etc.
                      taskId = `${rubroNumber}.${taskIndex + 1}`;
                    } else {
                      // Sequential: calculate global task index
                      let globalIndex = 0;
                      const rubroEntries = Object.entries(groupedTasks);
                      for (let i = 0; i < rubroIndex; i++) {
                        globalIndex += rubroEntries[i][1].length;
                      }
                      globalIndex += taskIndex + 1;
                      // Format as 001, 002, 003, etc.
                      taskId = globalIndex.toString().padStart(3, '0');
                    }

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
                        <td className="p-2 text-sm font-medium">
                          {taskId}
                        </td>
                        {!groupTasksByRubro && (
                          <td className="p-2">
                            <div className="font-medium text-sm">{task.task?.rubro_name || 'Sin rubro'}</div>
                          </td>
                        )}
                        <td className="p-2 text-sm">
                          {generateTaskDisplayName(task.task, parameterValues)}
                        </td>
                        <td className="p-2 text-sm">
                          {getUnitName(task.task?.unit_id)}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={localQuantities[task.id] || '0'}
                              onChange={(e) => handleQuantityInputChange(task.id, e.target.value)}
                              onBlur={(e) => handleQuantitySave(task.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              className="w-16 px-2 py-1 text-sm border rounded"
                              min="0"
                              step="0.01"
                            />
                            <span className="text-xs text-muted-foreground">
                              {getUnitName(task.task?.unit_id) || '-'}
                            </span>
                          </div>
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
                </Fragment>
              );
            })}
            {/* TOTAL Row */}
            <tr className="border-b-2 bg-accent/10 font-medium">
              <td className="p-2"></td>
              <td className="p-2 text-sm font-semibold">TOTAL</td>
              {!groupTasksByRubro && <td className="p-2"></td>}
              <td className="p-2"></td>
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

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {budgetTasks?.map((task: any) => {
          const processedName = generateTaskDisplayName(task.task, parameterValues);
          const unitName = getUnitName(task.task?.unit_id);
          return (
            <BudgetTaskCard
              key={task.id}
              task={task}
              processedName={processedName}
              unitName={unitName}
              onEdit={(task) => {
                console.log('Edit task mobile:', task);
                // TODO: Implement edit functionality
              }}
              onDelete={handleDeleteTask}
            />
          );
        })}
        
        {/* Mobile Total Card */}
        <Card className="border-2 border-accent bg-accent/5">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">TOTAL</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">$0</span>
                <span className="text-xs text-muted-foreground">100.0%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}