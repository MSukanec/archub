import { Clock } from 'lucide-react';
import { GanttRowProps } from './types';

interface GanttLeftPanelProps {
  item: GanttRowProps;
  onClick?: (item: GanttRowProps) => void;
}

export function GanttLeftPanel({ 
  item, 
  onClick 
}: GanttLeftPanelProps) {
  const indentationLevel = item.level * 24; // 24px per level

  const handleClick = () => {
    if (onClick) {
      onClick(item);
    }
  };

  return (
    <div 
      className="flex items-center h-9 px-3 bg-card border-r border-border cursor-pointer"
      style={{ paddingLeft: `${12 + indentationLevel}px` }}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className="mr-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Name */}
      <span className="flex-1 text-sm truncate text-foreground">
        {item.name}
      </span>
    </div>
  );
}