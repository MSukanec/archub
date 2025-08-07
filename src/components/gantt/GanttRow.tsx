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
      </div>
    );
  }

  return (
      {/* Left Panel */}
      <GanttLeftPanel 
        item={item}
        onClick={onClick}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      
      {/* Timeline Bar */}
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