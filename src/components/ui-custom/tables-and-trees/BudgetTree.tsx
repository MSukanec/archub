import { useState } from 'react';
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
      <div className="group flex items-center justify-between rounded-md p-3 mb-2 bg-card border border-border hover:bg-accent/50 transition-colors">
        {/* Left side: Drag handle + Task info */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Drag handle */}
          <div 
            {...listeners} 
            className="cursor-grab hover:cursor-grabbing p-1 hover:bg-accent/20 rounded"
            title="Arrastrar para reordenar"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Task icon */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-primary" />
            </div>
          </div>
          
          {/* Task content */}
          <div className="flex-1 min-w-0">
            {/* Task name and description */}
            <div className="space-y-1">
              <div className="font-medium text-foreground truncate">
                {getTaskName(task)}
              </div>
              {task.description && (
                <div className="text-xs text-muted-foreground truncate">
                  {task.description}
                </div>
              )}
            </div>
            
            {/* Task metadata badges */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {task.phase_name && (
                <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                  {task.phase_name}
                </Badge>
              )}
              {task.division_name && (
                <Badge variant="outline" className="text-xs px-2 py-1 bg-green-50 text-green-700 border-green-200">
                  {task.division_name}
                </Badge>
              )}
              {task.unit && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  {task.quantity?.toFixed(2) || '0.00'} {task.unit}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Right side: Cost info */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          {/* Unit cost */}
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">Costo Unit.</div>
            <div className="text-sm">
              <TaskMaterialsUnitCost task={task} />
            </div>
          </div>
          
          {/* Total subtotal */}
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">Subtotal</div>
            <div className="text-sm font-medium">
              <TaskTotalSubtotal task={task} />
            </div>
          </div>
        </div>
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

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
      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground mb-4">
            Arrastra las tareas para cambiar el orden de presentación en el presupuesto
          </div>
          {tasks.map((task) => (
            <SortableTaskItem key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}