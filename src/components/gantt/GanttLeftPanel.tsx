import { Clock, Edit, Trash2, Layers, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GanttRowProps } from './types';

interface GanttLeftPanelProps {
  item: GanttRowProps;
  onClick?: (item: GanttRowProps) => void;
  onEdit?: (item: GanttRowProps) => void;
  onDelete?: (item: GanttRowProps) => void;
}

export function GanttLeftPanel({ 
  item, 
  onClick,
  onEdit,
  onDelete
}: GanttLeftPanelProps) {
  const indentationLevel = item.level * 24; // 24px per level

  const handleClick = () => {
    if (onClick) {
      onClick(item);
    }
  };

  return (
    <div 
      className="group flex items-center h-9 px-3 bg-card border-r border-border cursor-pointer hover:bg-muted/20 transition-colors"
      style={{ paddingLeft: `${12 + indentationLevel}px` }}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className="mr-2">
        {item.type === 'phase' ? (
          <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ) : item.type === 'task' ? (
          <CheckSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Name */}
      <span className="flex-1 text-sm truncate text-foreground">
        {item.name}
      </span>

      {/* Action Buttons - Only show for individual tasks, not group headers */}
      {!item.isHeader && (onEdit || onDelete) && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className=" hover:bg-[var(--button-ghost-hover-bg)]"
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              className=" text-red-600 hover:text-red-700 hover:bg-[var(--button-ghost-hover-bg)]"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}