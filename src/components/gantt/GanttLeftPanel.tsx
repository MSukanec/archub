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
      style={{ paddingLeft: `${12 + indentationLevel}px` }}
      onClick={handleClick}
    >
      {/* Icon */}
        {item.type === 'phase' ? (
        ) : item.type === 'task' ? (
        ) : (
        )}
      </div>

      {/* Name */}
        {item.name}
      </span>

      {/* Action Buttons - Only show for individual tasks, not group headers */}
      {!item.isHeader && (onEdit || onDelete) && (
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
            >
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
            >
            </Button>
          )}
        </div>
      )}
    </div>
  );
}