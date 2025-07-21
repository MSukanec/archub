import React, { useState, useMemo, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Calculator, Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { cn } from '@/lib/utils'

export interface BudgetTask {
  id: string
  budget_id: string
  task_id: string
  organization_id: string
  project_id: string
  created_at: string
  updated_at: string
  task: {
    task_instance_id?: string
    project_id?: string
    task_id?: string
    task_code?: string
    start_date?: string
    end_date?: string
    duration_in_days?: number
    quantity: number
    phase_instance_id?: string
    phase_name?: string
    phase_position?: number
    progress_percent?: number
    unit_id?: string
    unit_name?: string
    unit_symbol?: string
    display_name?: string
    subcategory_id?: string
    subcategory_name?: string
    category_id?: string
    category_name?: string
    rubro_id?: string
    rubro_name?: string
    task_group_id?: string
    task_group_name?: string
    processed_display_name?: string
  }
}

export interface BudgetTableProps {
  budgetId?: string
  budgetTasks: BudgetTask[] | null
  isLoading: boolean
  groupingType: string
  selectedTasks: string[]
  setSelectedTasks: (tasks: string[]) => void
  generateTaskDisplayName: (task: any, parameterValues: any[]) => string
  parameterValues: any[]
  getUnitName: (unitId: string | null) => string
  handleDeleteTask?: (taskId: string) => void
  handleAddTask?: (budgetId: string) => void
  onGroupingChange?: (grouping: string) => void
  onAddTasks?: () => void
  budgets?: any[]
  selectedBudgetId?: string
  onBudgetChange?: (budgetId: string) => void
  onEditBudget?: (budgetId: string) => void
  onDeleteBudget?: (budgetId: string) => void
  mode?: 'budget' | 'construction'
  handleEditTask?: (task: BudgetTask) => void
}

export function BudgetTable({
  budgetId,
  budgetTasks,
  isLoading,
  groupingType,
  selectedTasks,
  setSelectedTasks,
  generateTaskDisplayName,
  parameterValues,
  getUnitName,
  handleDeleteTask,
  handleAddTask,
  onGroupingChange,
  onAddTasks,
  budgets,
  selectedBudgetId,
  onBudgetChange,
  onEditBudget,
  onDeleteBudget,
  mode = 'budget',
  handleEditTask
}: BudgetTableProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Group tasks based on groupingType
  const groupedTasks = useMemo(() => {
    if (!budgetTasks) return { ungrouped: [] };
    
    if (groupingType === 'none') {
      return { 'Todas las tareas': budgetTasks };
    }
    
    // Simple grouping for single-level types
    if (groupingType === 'rubros' || groupingType === 'phases') {
      const grouped = budgetTasks.reduce((acc, task) => {
        if (!task.task) return acc;
        
        let groupKey = 'Sin grupo';
        
        if (groupingType === 'rubros') {
          groupKey = task.task.rubro_name || 'Sin rubro';
        } else if (groupingType === 'phases') {
          groupKey = task.task.phase_name || 'Sin fase';
        }
        
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(task);
        return acc;
      }, {} as Record<string, BudgetTask[]>);

      return grouped;
    }
    
    return { 'Todas las tareas': budgetTasks };
  }, [budgetTasks, groupingType]);

  // Calculate total quantity for construction mode
  const totalQuantity = useMemo(() => {
    if (!budgetTasks || mode !== 'construction') return 0;
    return budgetTasks.reduce((sum, task) => {
      return sum + (task.task?.quantity || 0);
    }, 0);
  }, [budgetTasks, mode]);

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Cargando tareas...</div>;
  }

  if (!budgetTasks || budgetTasks.length === 0) {
    return (
      <EmptyState
        icon={<Calculator className="w-8 h-8 text-muted-foreground" />}
        title="No hay tareas en este presupuesto"
        description="Comienza agregando la primera tarea para gestionar los costos y materiales"
        action={
          <Button 
            size="sm" 
            onClick={() => handleAddTask?.(budgetId || '')}
            className="h-8 px-3 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Agregar Tarea
          </Button>
        }
      />
    );
  }

  // Total budget amount (placeholder since we don't have real pricing yet)
  const totalBudgetAmount = 0;

  // Mobile card component for individual tasks
  const BudgetTaskCard = ({ task, processedName, unitName, onEdit, onDelete }: any) => (
    <div className="p-3 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm text-[var(--card-fg)]">{processedName}</div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-6 w-6 p-0">
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="h-6 w-6 p-0">
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Unidad:</span> {unitName}
        </div>
        <div>
          <span className="text-muted-foreground">Cantidad:</span> {task.task?.quantity || '0'}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={showSearch ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="h-8"
          >
            <Search className="w-4 h-4 mr-1" />
            Buscar
          </Button>
          
          {onGroupingChange && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={groupingType} onValueChange={onGroupingChange}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin agrupar</SelectItem>
                  <SelectItem value="rubros">Por rubros</SelectItem>
                  <SelectItem value="phases">Por fases</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onAddTasks && (
            <Button onClick={onAddTasks} size="sm" className="h-8 px-3 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              AGREGAR TAREAS
            </Button>
          )}
        </div>
      </div>

      {/* Search Input */}
      {showSearch && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tareas por nombre, código o rubro..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(false)}
            className="h-8"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-hidden rounded-t-lg border border-[var(--table-header-border)]">
        {/* Column Headers - Different layouts for budget vs construction mode */}
        {mode === 'construction' ? (
          // Construction mode columns: Fase (10%), Rubro (10%), Tarea (resto), Unidad (5%), Cantidad (5%), Fechas (5%), Progreso (10%)
          <div className="grid gap-4 px-4 py-3 bg-[var(--table-header-bg)] text-xs font-medium text-[var(--table-header-fg)] border-b border-[var(--table-header-border)]"
               style={{ gridTemplateColumns: `10% 10% 1fr 5% 5% 5% 10%` }}>
            <div className="text-left">Fase</div>
            <div className="text-left">Rubro</div>
            <div className="text-left">Tarea</div>
            <div className="text-left">Unidad</div>
            <div className="text-left">Cantidad</div>
            <div className="text-left">Fechas</div>
            <div className="text-left">Progreso</div>
          </div>
        ) : (
          // Budget mode columns (original)
          <div className="grid gap-4 px-4 py-3 bg-[var(--table-header-bg)] text-xs font-medium text-[var(--table-header-fg)] border-b border-[var(--table-header-border)]"
               style={{ gridTemplateColumns: `5% 5% ${groupingType === 'none' ? '10% ' : ''}1fr 5% 5% 5% 5% 5% 5% 5%` }}>
            <div className="flex items-center justify-center">
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
                className="h-3 w-3 rounded accent-[hsl(var(--accent))]"
              />
            </div>
            <div className="text-left">ID</div>
            {groupingType === 'none' && (
              <div className="text-left">Rubro</div>
            )}
            <div className="text-left">Tarea</div>
            <div className="text-left">Unid.</div>
            <div className="text-left">Cant.</div>
            <div className="text-left">M.O.</div>
            <div className="text-left">Mat.</div>
            <div className="text-left">Subtotal</div>
            <div className="text-left">% Inc.</div>
            <div className="text-left">Acc.</div>
          </div>
        )}

        {/* Table Rows */}
        <div>
          {Object.entries(groupedTasks).map(([rubroName, tasks], rubroIndex) => {
            const rubroSubtotal = tasks.reduce((sum, task) => sum + 0, 0);
            const rubroPercentage = totalBudgetAmount > 0 ? (rubroSubtotal / totalBudgetAmount) * 100 : 0;
            const rubroNumber = rubroIndex + 1;
            
            return (
              <Fragment key={rubroName}>
                {/* Group Header Row */}
                {groupingType !== 'none' && (
                  <div className={cn(
                    "grid gap-4 px-4 py-3 bg-[var(--accent)] text-xs font-medium text-white border-b border-[var(--table-row-border)]"
                  )} style={{ 
                    gridTemplateColumns: mode === 'construction' 
                      ? `10% 10% 1fr 5% 5% 5% 10%` 
                      : `5% 5% ${groupingType === 'none' ? '10% ' : ''}1fr 5% 5% 5% 5% 5% 5% 5%`
                  }}>
                    {mode === 'construction' ? (
                      <>
                        <div></div>
                        <div className="font-semibold text-xs capitalize">{rubroName.toLowerCase()}</div>
                        <div className="font-semibold text-xs">{tasks.length} tareas</div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                      </>
                    ) : (
                      <>
                        <div></div>
                        <div className="font-semibold text-xs">{rubroNumber}</div>
                        <div className="font-semibold text-xs capitalize">{rubroName.toLowerCase()}</div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div className="text-xs font-semibold">${rubroSubtotal.toLocaleString()}</div>
                        <div className="text-xs font-semibold">{rubroPercentage.toFixed(1)}%</div>
                        <div></div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Task Rows */}
                {tasks.map((task: any, taskIndex) => {
                  const percentage = totalBudgetAmount > 0 ? (1 / totalBudgetAmount) * 100 : 0;
                  
                  let taskId: string;
                  if (groupingType !== 'none') {
                    taskId = `${rubroNumber}.${taskIndex + 1}`;
                  } else {
                    let globalIndex = 0;
                    const rubroEntries = Object.entries(groupedTasks);
                    for (let i = 0; i < rubroIndex; i++) {
                      globalIndex += rubroEntries[i][1].length;
                    }
                    globalIndex += taskIndex + 1;
                    taskId = globalIndex.toString().padStart(3, '0');
                  }

                  return (
                    <div key={task.id} 
                         className={cn(
                           "group relative grid gap-4 px-4 py-3 bg-[var(--table-row-bg)] text-[var(--table-row-fg)] text-xs hover:bg-[var(--table-row-hover-bg)] transition-colors",
                           taskIndex < tasks.length - 1 ? "border-b border-[var(--table-row-border)]" : ""
                         )}
                         style={{ 
                           gridTemplateColumns: mode === 'construction' 
                             ? `10% 10% 1fr 5% 5% 5% 10%` 
                             : `5% 5% ${groupingType === 'none' ? '10% ' : ''}1fr 5% 5% 5% 5% 5% 5% 5%`
                         }}>
                      
                      {mode === 'construction' ? (
                        <>
                          {/* Fase */}
                          <div className="text-xs flex items-center justify-start">
                            <div className="font-medium">{task.task?.phase_name || 'Sin fase'}</div>
                          </div>
                          
                          {/* Rubro */}
                          <div className="text-xs flex items-center justify-start">
                            <div className="font-medium">{task.task?.rubro_name || 'Sin rubro'}</div>
                          </div>
                          
                          {/* Tarea */}
                          <div className="text-xs flex items-center justify-start">
                            {generateTaskDisplayName(task.task, parameterValues)}
                          </div>
                          
                          {/* Unidad */}
                          <div className="text-xs flex items-center justify-start">
                            {task.task?.unit_name || '-'}
                          </div>
                          
                          {/* Cantidad */}
                          <div className="text-xs flex items-center justify-start">
                            {task.task?.quantity || '0'}
                          </div>
                          
                          {/* Fechas */}
                          <div className="text-xs flex items-center justify-start">
                            {task.task?.start_date ? new Date(task.task.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '--'}
                            {task.task?.end_date && ` - ${new Date(task.task.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`}
                          </div>
                          
                          {/* Progreso */}
                          <div className="text-xs flex items-center justify-start">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${task.task?.progress_percent || 0}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs font-medium">{task.task?.progress_percent || 0}%</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={selectedTasks.includes(task.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTasks([...selectedTasks, task.id]);
                                } else {
                                  setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                                }
                              }}
                              className="h-3 w-3 rounded accent-[hsl(var(--accent))]"
                            />
                          </div>
                          
                          {/* ID */}
                          <div className="text-xs font-medium text-muted-foreground">
                            {taskId}
                          </div>
                          
                          {/* Rubro (solo si groupingType es 'none') */}
                          {groupingType === 'none' && (
                            <div className="text-xs">
                              {task.task?.rubro_name || task.task?.category_name || '-'}
                            </div>
                          )}
                          
                          {/* Tarea */}
                          <div className="text-xs text-left">
                            <div className="font-medium leading-tight">
                              {generateTaskDisplayName(task.task, parameterValues)}
                            </div>
                          </div>
                          
                          {/* Unidad */}
                          <div className="text-xs text-center">
                            {getUnitName(task.task?.unit_id)}
                          </div>
                          
                          {/* Cantidad */}
                          <div className="text-xs text-center font-medium">
                            {task.task?.quantity || '0'}
                          </div>
                          
                          {/* M.O., Mat., Subtotal, % Inc. - placeholders */}
                          <div className="text-xs text-right">$0</div>
                          <div className="text-xs text-right">$0</div>
                          <div className="text-xs text-right font-medium">$0</div>
                          <div className="text-xs text-center">0%</div>
                          
                          {/* Acciones */}
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {handleEditTask && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTask(task);
                                }}
                                className="p-1 rounded hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                                title="Editar tarea"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                            )}
                            {handleDeleteTask && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id);
                                }}
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                title="Eliminar tarea"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
        </div>

        {/* TOTAL Row */}
        <div className={cn(
          "grid gap-4 px-4 py-3 bg-[var(--table-header-bg)] text-xs font-bold text-[var(--table-header-fg)] border-t-2 border-[var(--table-header-border)]"
        )} style={{ 
          gridTemplateColumns: mode === 'construction' 
            ? `10% 10% 1fr 5% 5% 5% 10%` 
            : `5% 5% ${groupingType === 'none' ? '10% ' : ''}1fr 5% 5% 5% 5% 5% 5% 5%`
        }}>
          {mode === 'construction' ? (
            <>
              <div></div>
              <div className="font-bold text-xs">TOTAL</div>
              <div></div>
              <div></div>
              <div className="text-xs font-bold text-center">{totalQuantity}</div>
              <div></div>
              <div></div>
            </>
          ) : (
            <>
              <div></div>
              <div className="font-bold text-xs">TOTAL</div>
              {groupingType === 'none' && <div></div>}
              <div></div>
              <div></div>
              <div className="text-xs font-bold text-center">{totalQuantity || 0}</div>
              <div className="text-xs font-bold text-right">$0</div>
              <div className="text-xs font-bold text-right">$0</div>
              <div className="text-xs font-bold text-right">${totalBudgetAmount.toLocaleString()}</div>
              <div></div>
              <div></div>
            </>
          )}
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-3">
        {Object.entries(groupedTasks).map(([rubroName, tasks]) => (
          <div key={rubroName} className="space-y-2">
            {/* Group Header for Mobile */}
            {groupingType !== 'none' && (
              <div className="bg-[var(--accent)] text-white p-3 rounded-lg">
                <div className="font-semibold text-sm capitalize">{rubroName.toLowerCase()}</div>
                <div className="text-xs opacity-90">{tasks.length} tareas</div>
              </div>
            )}
            
            {/* Task Cards */}
            {tasks.map((task: any) => (
              <BudgetTaskCard
                key={task.id}
                task={task}
                processedName={generateTaskDisplayName(task.task, parameterValues)}
                unitName={getUnitName(task.task?.unit_id)}
                onEdit={handleEditTask ? () => handleEditTask(task) : undefined}
                onDelete={handleDeleteTask ? () => handleDeleteTask(task.id) : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}