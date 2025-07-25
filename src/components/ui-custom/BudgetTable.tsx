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
  // Construction mode props
  mode?: 'budget' | 'construction';
  handleEditTask?: (task: any) => void;
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
  mode = 'budget',
  handleEditTask
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

  // Calculate total quantity for construction mode
  const totalQuantity = useMemo(() => {
    if (!budgetTasks || mode !== 'construction') return 0;
    return budgetTasks.reduce((sum, task) => {
      return sum + (task.task?.quantity || 0);
    }, 0);
  }, [budgetTasks, mode]);
  
  // No longer needed - quantity is now read-only
  
  if (isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Cargando tareas...</div>;
  }

  // Calculate totals for TOTAL row (using the totalQuantity already calculated above)

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

      {/* Show EmptyState when no tasks, but keep selector visible */}
      {(!budgetTasks || budgetTasks.length === 0) ? (
        <EmptyState
          icon={<Calculator className="w-8 h-8 text-muted-foreground" />}
          title="No hay tareas en este presupuesto"
          description="Comienza agregando la primera tarea para gestionar los costos y materiales"
        />
      ) : (
        <>

          {/* Action Bar - Mobile specific with grouping and add button */}
          <div className="lg:hidden flex items-center justify-between mb-4 p-3 bg-[var(--table-header-bg)] rounded-lg border border-[var(--table-header-border)]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Agrupado por:</span>
              <span className="text-xs font-medium capitalize">{
                groupingType === 'rubros' ? 'Rubros' :
                groupingType === 'phases' ? 'Fases' :
                groupingType === 'rubros-phases' ? 'Rubros y Fases' :
                groupingType === 'phases-rubros' ? 'Fases y Rubros' :
                'Sin Agrupar'
              }</span>
            </div>
            
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

          {/* Desktop Table View - Using Table.tsx structure */}
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
                              {task.task?.start_date || task.task?.end_date ? (
                                <div className="space-y-0">
                                  {task.task?.start_date && (
                                    <div className="text-muted-foreground text-xs leading-tight">
                                      {new Date(task.task.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                    </div>
                                  )}
                                  {task.task?.end_date && (
                                    <div className="text-muted-foreground text-xs leading-tight">
                                      - {new Date(task.task.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                            
                            {/* Progreso */}
                            <div className="text-xs flex items-center justify-start gap-2">
                              <div className="flex items-center gap-2 min-w-[60px]">
                                <div className="flex-1 bg-gray-200 rounded-full h-1 overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-300 bg-green-500"
                                    style={{
                                      width: `${Math.min(Math.max(task.task?.progress_percent || 0, 0), 100)}%`
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium min-w-[25px]">
                                  {task.task?.progress_percent || 0}%
                                </span>
                              </div>
                              {/* Actions for construction mode */}
                              <div className="flex items-center gap-1 ml-2">
                                {handleEditTask && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditTask({
                                      id: task.id,
                                      name: generateTaskDisplayName(task.task, parameterValues),
                                      type: 'task',
                                      level: 0,
                                      taskData: task
                                    })}
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
            
            {/* TOTAL Row - Same styling as header */}
            <div className="grid gap-4 px-4 py-3 bg-[var(--table-header-bg)] text-xs font-medium text-[var(--table-header-fg)] border-b border-[var(--table-header-border)]"
                 style={{ 
                   gridTemplateColumns: mode === 'construction' 
                     ? `10% 10% 1fr 5% 5% 5% 10%` 
                     : `5% 5% ${groupingType === 'none' ? '10% ' : ''}1fr 5% 5% 5% 5% 5% 5% 5%`
                 }}>
              {mode === 'construction' ? (
                <>
                  <div></div>
                  <div className="text-xs font-semibold">TOTAL</div>
                  <div className="text-xs font-semibold">{budgetTasks?.length || 0} tareas</div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </>
              ) : (
                <>
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
                </>
              )}
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
        </>
      )}
    </div>
  );
}