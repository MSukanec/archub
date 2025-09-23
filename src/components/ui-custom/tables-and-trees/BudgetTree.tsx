import { useState, useMemo } from 'react';
import { GripVertical, Calculator, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  onEditTask?: (task: BudgetTask) => void;
}

// Sortable Item component for drag and drop
const SortableTaskItem = ({ task }: { task: BudgetTask }) => {
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
      <div className="group grid gap-4 px-4 py-3 bg-[var(--table-row-bg)] text-[var(--table-row-fg)] text-sm hover:bg-[var(--table-row-hover-bg)] transition-colors border-b border-[var(--table-row-border)]" 
           style={{ gridTemplateColumns: "auto 1fr auto auto auto auto" }}>
        
        {/* Drag handle */}
        <div 
          {...listeners} 
          className="cursor-grab hover:cursor-grabbing p-1 hover:bg-accent/20 rounded flex items-center"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {/* Task content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Task name and description */}
          <div className="space-y-1">
            <div className="font-medium text-foreground truncate text-sm">
              {getTaskName(task)}
            </div>
            {task.description && (
              <div className="text-muted-foreground truncate text-sm">
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
        
        {/* Unit column */}
        <div className="text-right">
          <div className="text-sm">
            {task.unit || '-'}
          </div>
        </div>
        
        {/* Quantity column */}
        <div className="text-right">
          <div className="text-sm">
            {task.quantity?.toFixed(2) || '0.00'}
          </div>
        </div>
        
        {/* Unit cost column */}
        <div className="text-right">
          <div className="text-sm">
            <TaskMaterialsUnitCost task={task} />
          </div>
        </div>
        
        {/* Subtotal column */}
        <div className="text-right">
          <div className="text-sm font-medium">
            <TaskTotalSubtotal task={task} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Group Header component
const GroupHeader = ({ groupName, tasksCount, groupTasks }: { groupName: string; tasksCount: number; groupTasks: BudgetTask[] }) => {
  // Calculate total subtotal for this group
  const calculateGroupSubtotal = () => {
    return groupTasks.reduce((total, task) => {
      const quantity = task.quantity || 0;
      // This is a simplified calculation - in reality we'd need to access the actual cost calculation
      // For now, we'll return a placeholder that matches the visual expectation
      return total;
    }, 0);
  };

  return (
    <div 
      style={{ 
        backgroundColor: "var(--table-group-header-bg)",
        color: "white"
      }}
    >
      {/* First row: Group name and total */}
      <div 
        className="grid gap-4 px-4 py-2 text-sm font-medium"
        style={{ gridTemplateColumns: "auto 1fr auto auto auto auto" }}
      >
        <div></div> {/* Empty space for drag handle column */}
        <div className="col-span-4">
          {groupName} ({tasksCount} {tasksCount === 1 ? 'tarea' : 'tareas'})
        </div>
        <div className="text-right">
          {/* Group total - placeholder for now */}
          <span className="font-medium">Total: --</span>
        </div>
      </div>
      
      {/* Second row: Column headers */}
      <div 
        className="grid gap-4 px-4 py-2 text-xs font-medium opacity-90"
        style={{ gridTemplateColumns: "auto 1fr auto auto auto auto" }}
      >
        <div></div> {/* Empty space for drag handle column */}
        <div>Descripción</div>
        <div className="text-right">Unidad</div>
        <div className="text-right">Cantidad</div>
        <div className="text-right">Costo Unit.</div>
        <div className="text-right">Subtotal</div>
      </div>
    </div>
  );
};

export function BudgetTree({ 
  tasks, 
  onReorder, 
  onEditTask 
}: BudgetTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
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
      <div className="space-y-0">
        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <div key={groupName}>
            {/* Group Header */}
            <GroupHeader groupName={groupName} tasksCount={groupTasks.length} groupTasks={groupTasks} />
            
            {/* Group Tasks */}
            <SortableContext items={groupTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0">
                {groupTasks.map((task) => (
                  <SortableTaskItem key={task.id} task={task} />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  );
}