import { GanttLeftPanel } from './GanttLeftPanel';
import { GanttTimelineBar } from './GanttTimelineBar';
import { GanttRowProps } from './types';

export function GanttRow({ 
  item, 
  timelineStart, 
  timelineEnd, 
  timelineWidth,
  onClick,
  onEdit,
  onDelete
}: GanttRowProps & {
  timelineStart: Date;
  timelineEnd: Date;
  timelineWidth: number;
  onClick?: (item: GanttRowProps) => void;
  onEdit?: (item: GanttRowProps) => void;
  onDelete?: (item: GanttRowProps) => void;
}) {
  // Render group header differently
  if (item.isHeader) {
    return (
      <div className="flex bg-muted/30 px-3 py-2 text-sm text-muted-foreground font-medium uppercase border-b border-border">
        <div className="w-80">{item.name}</div>
        <div className="flex-1 border-b border-border/30" />
      </div>
    );
  }

  return (
    <div className="flex border-b border-border hover:bg-muted/20 transition-colors">
      {/* Left Panel */}
      <GanttLeftPanel 
        item={item}
        onClick={onClick}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      
      {/* Timeline Bar */}
      <div className="flex-1" style={{ width: `${timelineWidth}px` }}>
        <GanttTimelineBar 
          item={item}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          timelineWidth={timelineWidth}
        />
      </div>
    </div>
  );
}