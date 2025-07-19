import { ChevronRight, ChevronDown, Plus, Folder, FolderOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GanttRowProps } from './types';

interface GanttLeftPanelProps {
  item: GanttRowProps;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onAddChild?: (parentId: string) => void;
}

export function GanttLeftPanel({ 
  item, 
  isExpanded, 
  onToggleExpand,
  onAddChild 
}: GanttLeftPanelProps) {
  const hasChildren = item.children && item.children.length > 0;
  const indentationLevel = item.level * 24; // 24px per level

  return (
    <div 
      className="flex items-center h-9 px-3 bg-card border-r border-border hover:bg-muted/50 transition-colors"
      style={{ paddingLeft: `${12 + indentationLevel}px` }}
    >
      {/* Expand/Collapse Button */}
      {hasChildren ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 mr-2"
          onClick={() => onToggleExpand(item.id)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ) : (
        <div className="w-6 mr-2" />
      )}

      {/* Icon */}
      <div className="mr-2">
        {item.type === 'phase' ? (
          hasChildren && isExpanded ? (
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Name */}
      <span 
        className={`flex-1 text-sm truncate ${
          item.type === 'phase' 
            ? 'font-medium text-foreground' 
            : 'text-muted-foreground'
        }`}
      >
        {item.name}
      </span>

      {/* Add Child Button */}
      {item.type === 'phase' && onAddChild && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(item.id);
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}