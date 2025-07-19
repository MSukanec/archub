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
  const dateRange = calculateResolvedEndDate(item);

  // Validate dates - no mostrar barra si no hay fechas válidas
  if (!dateRange.isValid) {
    return null;
  }

  const { startDate, resolvedEndDate } = dateRange;

  // Normalize dates to avoid timezone issues - set to start of day
  const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const normalizedEnd = new Date(resolvedEndDate.getFullYear(), resolvedEndDate.getMonth(), resolvedEndDate.getDate());
  const normalizedTimelineStart = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), timelineStart.getDate());
  const normalizedTimelineEnd = new Date(timelineEnd.getFullYear(), timelineEnd.getMonth(), timelineEnd.getDate());

  // Calculate total timeline span in milliseconds
  const totalSpan = normalizedTimelineEnd.getTime() - normalizedTimelineStart.getTime();
  
  if (totalSpan <= 0) {
    return null;
  }

  // Calculate task position and width in pixels
  const taskStartMs = Math.max(0, normalizedStart.getTime() - normalizedTimelineStart.getTime());
  const taskEndMs = Math.min(totalSpan, normalizedEnd.getTime() - normalizedTimelineStart.getTime());
  
  const startPixels = (taskStartMs / totalSpan) * timelineWidth;
  const widthPixels = ((taskEndMs - taskStartMs) / totalSpan) * timelineWidth;

  if (widthPixels <= 0) {
    return null;
  }

  return (
    <div 
      className="h-5 border-2 border-[var(--accent)] bg-transparent rounded-sm shadow-sm flex items-center justify-center text-xs text-[var(--accent)] font-medium hover:bg-[var(--accent)]/10 transition-colors cursor-pointer"
      style={{
        width: `${widthPixels}px`,
        marginLeft: `${startPixels}px`
      }}
      title={`${item.name} (${format(startDate, 'dd/MM/yyyy')} - ${format(resolvedEndDate, 'dd/MM/yyyy')})`}
    >
      <span className="truncate text-[10px]" style={{ padding: '0 2px' }}>
        {format(startDate, 'dd/MM')} - {format(resolvedEndDate, 'dd/MM')}
      </span>
    </div>
  );
}