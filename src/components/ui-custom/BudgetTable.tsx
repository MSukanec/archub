import { Fragment, useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, ChevronDown, Edit, Filter, Search } from 'lucide-react';
import { Calculator } from 'lucide-react';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BudgetTask {
  id: string;
  budget_id: string;
  task_id: string;
  organization_id: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  task: {
    task_instance_id: string;
    project_id: string;
    task_id: string;
    task_code: string;
    start_date: string | null;
    end_date: string | null;
    duration_in_days: number | null;
    quantity: number;
    phase_instance_id: string;
    phase_name: string;
    phase_position: number;
    progress_percent: number;
    unit_id: string;
    unit_name: string;
    unit_symbol: string;
    display_name: string;
    subcategory_id: string;
    subcategory_name: string;
    category_id: string;
    category_name: string;
    rubro_id: string;
    rubro_name: string;
    task_group_id: string;
    task_group_name: string;
  } | null;
}

interface BudgetTableProps {
  budgetId: string;
  budgetTasks: BudgetTask[] | undefined;
  isLoading: boolean;
  groupingType: string; // 'none', 'rubros', 'phases'
  selectedTasks: string[];
  setSelectedTasks: (tasks: string[]) => void;
  generateTaskDisplayName: (task: any, parameterValues: any[]) => string;
  parameterValues: any[];
  getUnitName: (unitId: string | null) => string;

  handleDeleteTask: (taskId: string) => void;
  handleAddTask: (budgetId: string) => void;
  onGroupingChange?: (value: string) => void;
  onAddTasks?: () => void;
  // New props for budget selector row
  budgets?: any[];
  selectedBudgetId?: string;
  onBudgetChange?: (budgetId: string) => void;
  onEditBudget?: () => void;
  onDeleteBudget?: () => void;
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
  onDeleteBudget
}: BudgetTableProps) {
  // Local state for search functionality
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  // Local state for search functionality only
  
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
    
    // Nested grouping for compound types
    const nestedGrouped = budgetTasks.reduce((acc, task) => {
      if (!task.task) return acc;
      
      let primaryKey, secondaryKey;
      
      if (groupingType === 'rubros-phases') {
        primaryKey = task.task.rubro_name || 'Sin rubro';
        secondaryKey = task.task.phase_name || 'Sin fase';
      } else if (groupingType === 'phases-rubros') {
        primaryKey = task.task.phase_name || 'Sin fase';
        secondaryKey = task.task.rubro_name || 'Sin rubro';
      }
      
      const combinedKey = `${primaryKey} > ${secondaryKey}`;
      
      if (!acc[combinedKey]) {
        acc[combinedKey] = [];
      }
      acc[combinedKey].push(task);
      return acc;
    }, {} as Record<string, BudgetTask[]>);
    
    return nestedGrouped;
  }, [budgetTasks, groupingType]);
  
  // No longer needed - quantity is now read-only
  
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

  // Calculate totals for TOTAL row
  const totalQuantity = budgetTasks?.reduce((total, task) => {
    return total + (task.task?.quantity || 0);
  }, 0) || 0;

  // Total budget amount (placeholder since we don't have real pricing yet)
  const totalBudgetAmount = 0;

  // Mobile card component for individual tasks - removed Card import
  const BudgetTaskCard = ({ task, processedName, unitName, onEdit, onDelete }: any) => (
    <div className="p-3 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] space-y-2">
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
          <span className="font-medium">{task.task?.quantity || '0'}</span>
          <span className="text-muted-foreground">{unitName}</span>
        </div>
        <div className="text-right">
          <div className="font-medium">$0</div>
          <div className="text-muted-foreground">0.0%</div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Budget Selector Row - Desktop only */}
      {budgets && selectedBudgetId && onBudgetChange && (
        <div className="hidden lg:block mb-2">
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--card-bg)] text-xs font-medium text-[var(--card-fg)] border border-[var(--card-border)] rounded-lg">
            {/* Budget Selector - Left side */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Presupuesto:
              </span>
              <div className="w-64">
                <Select value={selectedBudgetId} onValueChange={onBudgetChange}>
                  <SelectTrigger className="w-full h-7 text-xs">
                    <SelectValue placeholder="Selecciona un presupuesto" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets.map((budget: any) => (
                      <SelectItem key={budget.id} value={budget.id}>
                        <span className="text-left">{budget.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Budget Action Buttons - Right side */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onEditBudget}
              >
                <Edit className="w-3 h-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={onDeleteBudget}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table Action Bar - Desktop only */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--table-header-bg)] text-xs font-medium text-[var(--table-header-fg)] border border-[var(--table-header-border)] rounded-lg"
             style={{ marginBottom: '3px' }}>
          {/* Empty left side */}
          <div></div>
          
          {/* Right side - Search Field + Search Button + Filter Button + Add Tasks Button */}
          <div className="flex items-center gap-2">
            {showSearch && (
              <input
                type="text"
                placeholder="Buscar tareas..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-6 px-2 text-xs border border-gray-300 rounded bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[var(--accent)] w-48"
                autoFocus
                onBlur={() => {
                  if (!searchValue) {
                    setShowSearch(false);
                  }
                }}
              />
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 bg-transparent hover:bg-transparent text-white hover:text-[var(--accent)]"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-4 h-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 bg-transparent hover:bg-transparent text-white hover:text-[var(--accent)]"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-0 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="py-1">
                  <button
                    onClick={() => onGroupingChange?.('none')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Sin agrupar
                  </button>
                  <button
                    onClick={() => onGroupingChange?.('rubros')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Agrupar por Rubros
                  </button>
                  <button
                    onClick={() => onGroupingChange?.('phases')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Agrupar por Fases
                  </button>
                  <button
                    onClick={() => onGroupingChange?.('rubros-phases')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Rubros y Fases
                  </button>
                  <button
                    onClick={() => onGroupingChange?.('phases-rubros')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Fases y Rubros
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button
              variant="default"
              size="sm"
              className="h-7 px-3 text-xs bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white"
              onClick={() => onAddTasks?.()}
            >
              <Plus className="w-3 h-3 mr-1" />
              AGREGAR TAREAS
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Table View - Using Table.tsx structure */}
      <div className="hidden lg:block overflow-hidden rounded-t-lg border border-[var(--table-header-border)]">
        {/* Column Headers - Identical to Table.tsx */}
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

        {/* Table Rows - Using div structure like Table.tsx */}
        <div>
            {Object.entries(groupedTasks).map(([rubroName, tasks], rubroIndex) => {
              const rubroSubtotal = tasks.reduce((sum, task) => sum + 0, 0);
              const rubroPercentage = totalBudgetAmount > 0 ? (rubroSubtotal / totalBudgetAmount) * 100 : 0;
              const rubroNumber = rubroIndex + 1;
              
              return (
                <Fragment key={rubroName}>
                  {/* Group Header Row */}
                  {groupingType !== 'none' && (
                    <div className="grid gap-4 px-4 py-3 bg-[var(--accent)] text-xs font-medium text-white border-b border-[var(--table-row-border)]"
                         style={{ gridTemplateColumns: `5% 5% ${groupingType === 'none' ? '10% ' : ''}1fr 5% 5% 5% 5% 5% 5% 5%` }}>
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
                           style={{ gridTemplateColumns: `5% 5% ${groupingType === 'none' ? '10% ' : ''}1fr 5% 5% 5% 5% 5% 5% 5%` }}>
                        
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
                        
                        <div className="text-xs flex items-center justify-start font-medium">
                          {taskId}
                        </div>
                        
                        {groupingType === 'none' && (
                          <div className="text-xs flex items-center justify-start">
                            <div className="font-medium">{task.task?.rubro_name || 'Sin rubro'}</div>
                          </div>
                        )}
                        
                        <div className="text-xs flex items-center justify-start">
                          {generateTaskDisplayName(task.task, parameterValues)}
                        </div>
                        
                        <div className="text-xs flex items-center justify-start">
                          {task.task?.unit_name || '-'}
                        </div>
                        
                        <div className="text-xs flex items-center justify-start">
                          {task.task?.quantity || '0'}
                        </div>
                        
                        <div className="text-xs flex items-center justify-start">$0</div>
                        <div className="text-xs flex items-center justify-start">$0</div>
                        <div className="text-xs flex items-center justify-start font-medium">$0</div>
                        <div className="text-xs flex items-center justify-start text-muted-foreground">{percentage.toFixed(1)}%</div>
                        
                        <div className="flex items-center justify-start">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
            
            {/* TOTAL Row - Same styling as header */}
            <div className="grid gap-4 px-4 py-3 bg-[var(--table-header-bg)] text-xs font-medium text-[var(--table-header-fg)] border-b border-[var(--table-header-border)]"
                 style={{ gridTemplateColumns: `5% 5% ${groupingType === 'none' ? '10% ' : ''}1fr 5% 5% 5% 5% 5% 5% 5%` }}>
              <div></div>
              <div className="text-xs font-semibold">TOTAL</div>
              {groupingType === 'none' && <div></div>}
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div className="text-xs font-semibold">$0</div>
              <div className="text-xs font-semibold">100.0%</div>
              <div></div>
            </div>
        </div>
      </div>

      {/* Mobile Cards View - Following Table.tsx structure */}
      <div className="lg:hidden space-y-2">
        {budgetTasks?.map((task: any) => {
          const processedName = generateTaskDisplayName(task.task, parameterValues);
          const unitName = getUnitName(task.task?.unit_id);
          return (
            <BudgetTaskCard
              key={task.id}
              task={task}
              processedName={processedName}
              unitName={unitName}
              onEdit={(taskToEdit: any) => {
                console.log('Edit task mobile:', taskToEdit);
                // TODO: Implement edit functionality
              }}
              onDelete={handleDeleteTask}
            />
          );
        })}
        
        {/* Mobile Total Card - without Card component */}
        <div className="border-2 border-accent bg-accent/5 rounded-lg">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">TOTAL</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">$0</span>
                <span className="text-xs text-muted-foreground">100.0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}