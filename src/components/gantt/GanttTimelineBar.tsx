import { format } from 'date-fns';
import { GanttRowProps, calculateResolvedEndDate } from './types';

interface GanttTimelineBarProps {
  item: GanttRowProps;
  timelineStart: Date;
  timelineEnd: Date;
  timelineWidth: number;
}

export function GanttTimelineBar({ 
  item, 
  timelineStart, 
  timelineEnd, 
  timelineWidth 
}: GanttTimelineBarProps) {
  // Calculate resolved end date using the utility function
  const dateRange = calculateResolvedEndDate(item.startDate, item.endDate, item.durationInDays);

  // Validate dates
  if (!dateRange.isValid) {
    return (
      <div className="flex items-center justify-center h-6 bg-[var(--accent)] border border-[var(--accent)] rounded text-xs text-white font-medium">
        Fechas inválidas
      </div>
    );
  }

  const { startDate, resolvedEndDate } = dateRange;

  // Calculate total timeline span in milliseconds
  const totalSpan = timelineEnd.getTime() - timelineStart.getTime();
  
  if (totalSpan <= 0) {
    return null;
  }

  // Calculate task position and width in pixels
  const taskStartMs = Math.max(0, startDate.getTime() - timelineStart.getTime());
  const taskEndMs = Math.min(totalSpan, resolvedEndDate.getTime() - timelineStart.getTime());
  
  const startPixels = (taskStartMs / totalSpan) * timelineWidth;
  const widthPixels = ((taskEndMs - taskStartMs) / totalSpan) * timelineWidth;

  if (widthPixels <= 0) {
    return null;
  }

  return (
    <div 
      className="h-5 bg-accent rounded-sm shadow-sm flex items-center justify-center text-xs text-white font-medium hover:bg-accent/90 transition-colors cursor-pointer"
      style={{
        width: `${widthPixels}px`,
        marginLeft: `${startPixels}px`
      }}
      title={`${item.name} (${format(startDate, 'dd/MM/yyyy')} - ${format(resolvedEndDate, 'dd/MM/yyyy')})`}
    >
      <span className="truncate px-2">
        {item.name}
      </span>
    </div>
  );
}