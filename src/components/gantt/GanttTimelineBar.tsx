import { format } from 'date-fns';
import { GanttRowProps, calculateResolvedEndDate } from './types';

interface GanttTimelineBarProps {
  item: GanttRowProps;
  timelineStart: Date;
  timelineEnd: Date;
  timelineWidth: number;
  totalDays: number; // Add this to sync with calendar
}

export function GanttTimelineBar({ 
  item, 
  timelineStart, 
  timelineEnd, 
  timelineWidth,
  totalDays
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

  // Calculate task position using day-based approach to match calendar
  const dayStartFromTimeline = Math.floor((normalizedStart.getTime() - normalizedTimelineStart.getTime()) / (24 * 60 * 60 * 1000));
  const dayEndFromTimeline = Math.floor((normalizedEnd.getTime() - normalizedTimelineStart.getTime()) / (24 * 60 * 60 * 1000));
  
  const dayWidth = timelineWidth / totalDays;
  const startPixels = dayStartFromTimeline * dayWidth;
  const widthPixels = (dayEndFromTimeline - dayStartFromTimeline + 1) * dayWidth;
  
  // EXTREME DEBUG - DAY-BASED CALCULATION
  console.log('DAY-BASED CALCULATION:', {
    taskName: item.name.substring(0, 20),
    normalizedStart: normalizedStart.toDateString(),
    normalizedTimelineStart: normalizedTimelineStart.toDateString(),
    dayStartFromTimeline,
    dayEndFromTimeline,
    totalDays,
    dayWidth,
    startPixels,
    calculation: `day ${dayStartFromTimeline} * ${dayWidth} = ${startPixels}`
  });



  if (widthPixels <= 0) {
    return null;
  }

  return (
    <div 
      className="h-5 border-2 border-[var(--table-row-fg)] bg-transparent rounded-sm shadow-sm flex items-center justify-center text-xs text-[var(--table-row-fg)] font-medium hover:bg-muted/10 transition-colors cursor-pointer"
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