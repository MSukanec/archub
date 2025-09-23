import { useState, useMemo, useCallback, useEffect } from 'react';
import { useUpdateConstructionTask } from '@/hooks/use-construction-tasks';
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave';
import { useCurrentUser } from '@/hooks/use-current-user';
import { GripVertical, Calculator, FileText, Copy, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TaskMaterialsUnitCost from '@/components/construction/TaskMaterialsUnitCost';
import TaskTotalSubtotal from '@/components/construction/TaskTotalSubtotal';

// Drag and Drop imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface BudgetTask {
  id: string;
  custom_name?: string;
  task?: {
    display_name?: string;
  };
  phase_name?: string;
  division_name?: string;
  unit?: string;
  quantity?: number;
  description?: string;
  [key: string]: any;
}

interface BudgetTreeProps {
  tasks: BudgetTask[];
  onReorder?: (reorderedTasks: BudgetTask[]) => void;
  onDuplicateTask?: (task: BudgetTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onQuantityChange?: (taskId: string, quantity: number) => void;
}

// Sortable Item component for drag and drop
const SortableTaskItem = ({ 
  task, 
  onSubtotalChange,
  groupSubtotal,
  totalSubtotal,
  taskSubtotals,
  itemNumber,
  onDuplicateTask,
  onDeleteTask,
  handleLocalQuantityChange,
  localQuantities,
  isLastInGroup
}: { 
  task: BudgetTask;
  onSubtotalChange: (taskId: string, subtotal: number) => void;
  groupSubtotal: number;
  totalSubtotal: number;
  taskSubtotals: { [taskId: string]: number };
  itemNumber: string;
  onDuplicateTask?: (task: BudgetTask) => void;
  onDeleteTask?: (taskId: string) => void;
  handleLocalQuantityChange: (taskId: string, quantity: number) => void;
  localQuantities: { [taskId: string]: number };
  isLastInGroup?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get task display name
  const getTaskName = (task: BudgetTask) => {
    const customName = task.custom_name || task.task?.display_name;
    return (customName && !customName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) 
      ? customName 
      : (task.task?.display_name || 'Sin nombre');
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={`group grid gap-4 px-4 py-3 bg-[var(--table-row-bg)] text-[var(--table-row-fg)] text-xs hover:bg-[var(--table-row-hover-bg)] transition-colors ${!isLastInGroup ? 'border-b border-[var(--table-row-border)]' : ''}`} 
           style={{ gridTemplateColumns: "32px 60px 1fr 150px 100px 80px 120px 120px 110px 80px" }}>
        
        {/* Drag handle */}
        <div 
          {...listeners} 
          className="cursor-grab hover:cursor-grabbing p-1 hover:bg-accent/20 rounded flex items-center"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {/* Item number */}
        <div className="text-xs font-medium text-muted-foreground flex items-center">
          {itemNumber}
        </div>
        
        {/* Task content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center text-xs">
          {/* Task name and description */}
          <div className="space-y-1">
            <div className="font-medium text-foreground truncate text-xs">
              {getTaskName(task)}
            </div>
            {task.description && (
              <div className="text-muted-foreground truncate text-xs">
                {task.description}
              </div>
            )}
          </div>
          
          {/* Phase badge only */}
          {task.phase_name && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                {task.phase_name}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Tipo column */}
        <div className="flex items-center text-xs">
          <Select defaultValue="mo-mat">
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mo-mat">M.O. + MAT.</SelectItem>
              <SelectItem value="mo">M.O.</SelectItem>
              <SelectItem value="mat">MAT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Quantity column - Editable input */}
        <div className="text-right text-xs flex items-center justify-end">
          <Input
            type="number"
            value={localQuantities[task.id] ?? task.quantity ?? 0}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = value === '' ? 0 : parseFloat(value);
              if (!isNaN(numValue)) {
                handleLocalQuantityChange(task.id, numValue);
              }
            }}
            className="h-8 w-20 text-xs text-right"
            step="0.01"
            min="0"
          />
        </div>
        
        {/* Unit column */}
        <div className="text-right text-xs flex items-center justify-end">
          <div className="text-xs">
            {task.unit || '-'}
          </div>
        </div>
        
        {/* Unit cost column */}
        <div className="text-right text-xs flex items-center justify-end">
          <div className="text-xs [&>span]:!text-xs">
            <TaskMaterialsUnitCost task={task} />
          </div>
        </div>
        
        {/* Subtotal column */}
        <div className="text-right text-xs flex items-center justify-end">
          <div className="text-xs font-medium [&>span]:!text-xs">
            <TaskTotalSubtotal task={task} onSubtotalChange={onSubtotalChange} />
          </div>
        </div>
        
        {/* % de Incidencia column */}
        <div className="text-right text-xs flex items-center justify-end">
          <div className="text-xs text-muted-foreground">
            {(() => {
              const currentTaskSubtotal = taskSubtotals[task.id] || 0;
              if (groupSubtotal > 0 && currentTaskSubtotal > 0) {
                const percentage = (currentTaskSubtotal / groupSubtotal) * 100;
                return `${percentage.toFixed(1)}%`;
              }
              return '–';
            })()}
          </div>
        </div>
        
        {/* Actions column */}
        <div className="flex items-center justify-center gap-2">
          {onDuplicateTask && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicateTask(task)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {onDeleteTask && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteTask(task.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Group Header component  
const GroupHeader = ({ 
  groupName, 
  tasksCount, 
  groupTasks, 
  groupSubtotal, 
  totalSubtotal,
  groupIndex 
}: { 
  groupName: string; 
  tasksCount: number; 
  groupTasks: BudgetTask[];
  groupSubtotal: number;
  totalSubtotal: number;
  groupIndex: number;
}) => {
  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const groupPercentage = totalSubtotal > 0 ? ((groupSubtotal / totalSubtotal) * 100).toFixed(1) : '0.0';

  return (
    <div 
      className="grid gap-4 px-4 py-3 text-xs font-medium"
      style={{ 
        gridTemplateColumns: "32px 60px 1fr 150px 100px 80px 120px 120px 110px 80px",
        backgroundColor: "var(--table-group-header-bg)",
        color: "white"
      }}
    >
      {/* Drag handle for group */}
      <div className="flex items-center justify-center">
        <GripVertical className="h-4 w-4 text-white/70" />
      </div>
      {/* Item number for group */}
      <div className="font-bold text-xs">
        {groupIndex}
      </div>
      <div className="col-span-5">
        {groupName} ({tasksCount} {tasksCount === 1 ? 'tarea' : 'tareas'})
      </div>
      {/* Subtotal column */}
      <div className="text-right">
        <span className="font-medium">{formatCost(groupSubtotal)}</span>
      </div>
      {/* % de Incidencia column */}
      <div className="text-right">
        <span className="font-medium">{groupPercentage}%</span>
      </div>
      {/* Empty space for actions column */}
      <div></div>
    </div>
  );
};

export function BudgetTree({ 
  tasks, 
  onReorder, 
  onDuplicateTask,
  onDeleteTask,
  onQuantityChange 
}: BudgetTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [taskSubtotals, setTaskSubtotals] = useState<{ [taskId: string]: number }>({});
  const [localQuantities, setLocalQuantities] = useState<{ [taskId: string]: number }>({});
  const { data: userData } = useCurrentUser();
  const updateTaskMutation = useUpdateConstructionTask();
  
  // Initialize local quantities from tasks
  useEffect(() => {
    const initialQuantities: { [taskId: string]: number } = {};
    tasks.forEach(task => {
      initialQuantities[task.id] = task.quantity || 0;
    });
    setLocalQuantities(initialQuantities);
  }, [tasks]);

  // Create save function for auto-save
  const saveQuantityChanges = useCallback(async (quantities: { [taskId: string]: number }) => {
    if (!userData?.preferences?.last_project_id || !userData?.preferences?.last_organization_id) {
      console.warn('No project or organization selected');
      return;
    }

    // Find changes that need to be saved
    const changedTasks = Object.entries(quantities).filter(([taskId, quantity]) => {
      const originalTask = tasks.find(task => task.id === taskId);
      return originalTask && originalTask.quantity !== quantity;
    });

    // Save each changed task
    for (const [taskId, quantity] of changedTasks) {
      try {
        await updateTaskMutation.mutateAsync({
          id: taskId,
          quantity: quantity,
          project_id: userData.preferences.last_project_id,
          organization_id: userData.preferences.last_organization_id,
        });
        console.log('Quantity saved successfully for task:', taskId, 'quantity:', quantity);
      } catch (error) {
        console.error(`Error saving quantity for task ${taskId}:`, error);
        throw error; // Re-throw to let the auto-save hook handle it
      }
    }
  }, [tasks, userData, updateTaskMutation]);

  // Use auto-save for quantity changes
  const { isSaving } = useDebouncedAutoSave({
    data: localQuantities,
    saveFn: saveQuantityChanges,
    delay: 1000, // Wait 1 second after user stops typing
    enabled: true
  });

  // Handle local quantity changes
  const handleLocalQuantityChange = (taskId: string, quantity: number) => {
    console.log('Quantity change:', taskId, quantity);
    setLocalQuantities(prev => ({
      ...prev,
      [taskId]: quantity
    }));
    // Also call the external callback if provided
    onQuantityChange?.(taskId, quantity);
  };
  
  // Handle subtotal changes from individual tasks
  const handleSubtotalChange = useCallback((taskId: string, subtotal: number) => {
    setTaskSubtotals(prev => {
      // Only update if the value actually changed to prevent unnecessary re-renders
      if (prev[taskId] === subtotal) {
        return prev;
      }
      return {
        ...prev,
        [taskId]: subtotal
      };
    });
  }, []);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by division_name
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: BudgetTask[] } = {};
    
    tasks.forEach(task => {
      const groupKey = task.division_name || 'Sin categoría';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });
    
    return groups;
  }, [tasks]);
  
  // Calculate group subtotals and total
  const { groupSubtotals, totalSubtotal } = useMemo(() => {
    const groupSums: { [groupName: string]: number } = {};
    let total = 0;
    
    Object.entries(groupedTasks).forEach(([groupName, groupTasks]) => {
      const groupSum = groupTasks.reduce((sum, task) => {
        const taskSubtotal = taskSubtotals[task.id] || 0;
        return sum + taskSubtotal;
      }, 0);
      groupSums[groupName] = groupSum;
      total += groupSum;
    });
    
    return {
      groupSubtotals: groupSums,
      totalSubtotal: total
    };
  }, [groupedTasks, taskSubtotals]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Find which group the dragged and target tasks belong to
    const draggedTask = tasks.find(task => task.id === active.id);
    const targetTask = tasks.find(task => task.id === over.id);
    
    if (!draggedTask || !targetTask) return;
    
    // Only allow reordering within the same group
    if ((draggedTask.division_name || 'Sin categoría') !== (targetTask.division_name || 'Sin categoría')) {
      return;
    }

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);

    if (oldIndex !== newIndex && onReorder) {
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
      onReorder(reorderedTasks);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <div className="text-center">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No hay tareas para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-lg">
        <div className="space-y-0">
          {/* Main Header - Column titles */}
        <div 
          className="grid gap-4 px-4 py-3 text-xs font-medium opacity-90 sticky top-0"
          style={{ 
            gridTemplateColumns: "32px 60px 1fr 150px 100px 80px 120px 120px 110px 80px",
            backgroundColor: "var(--background)",
            borderBottom: "1px solid var(--border)",
            zIndex: 10
          }}
        >
          <div></div> {/* Empty space for drag handle column */}
          <div>Ítem</div>
          <div>Descripción</div>
          <div>Tipo</div>
          <div className="text-right">Cantidad</div>
          <div className="text-right">Unidad</div>
          <div className="text-right">Costo Unit.</div>
          <div className="text-right">Subtotal</div>
          <div className="text-right">% de Incidencia</div>
          <div className="text-center">Acciones</div>
        </div>

        {/* Groups */}
        {Object.entries(groupedTasks).map(([groupName, groupTasks], groupIndex) => (
          <div key={groupName}>
            {/* Group Header */}
            <GroupHeader 
              groupName={groupName} 
              tasksCount={groupTasks.length} 
              groupTasks={groupTasks}
              groupSubtotal={groupSubtotals[groupName] || 0}
              totalSubtotal={totalSubtotal}
              groupIndex={groupIndex + 1}
            />
            
            {/* Group Tasks */}
            <SortableContext items={groupTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0">
                {groupTasks.map((task, taskIndex) => (
                  <SortableTaskItem 
                    key={task.id} 
                    task={task} 
                    onSubtotalChange={handleSubtotalChange}
                    groupSubtotal={groupSubtotals[groupName] || 0}
                    totalSubtotal={totalSubtotal}
                    taskSubtotals={taskSubtotals}
                    itemNumber={`${groupIndex + 1}.${taskIndex + 1}`}
                    onDuplicateTask={onDuplicateTask}
                    onDeleteTask={onDeleteTask}
                    handleLocalQuantityChange={handleLocalQuantityChange}
                    localQuantities={localQuantities}
                    isLastInGroup={taskIndex === groupTasks.length - 1}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
        </div>
      </div>
    </DndContext>
  );
}