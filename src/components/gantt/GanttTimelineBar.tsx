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
  
  // Use the SAME calculation as the TODAY line for consistency
  const startPixels = dayStartFromTimeline * dayWidth;
  const widthPixels = (dayEndFromTimeline - dayStartFromTimeline + 1) * dayWidth;
  
  // Clean up debug logs - alignment is now working perfectly
  // console.log('BAR ALIGNED:', item.name.substring(0, 20), startPixels);



  if (widthPixels <= 0) {
    return null;
  }

  // Diferentes estilos según el tipo de elemento
  const getBarStyle = () => {
    switch (item.type) {
      case 'phase':
        return "h-6 border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/30 rounded-md shadow-sm flex items-center justify-center text-xs text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors cursor-pointer";
      case 'task':
        return "h-5 border-2 border-[var(--table-row-fg)] bg-transparent rounded-sm shadow-sm flex items-center justify-center text-xs text-[var(--table-row-fg)] font-medium hover:bg-muted/10 transition-colors cursor-pointer";
      default:
        return "h-5 border-2 border-gray-400 bg-gray-100 dark:bg-gray-800 rounded-sm shadow-sm flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer";
    }
  };

  return (
    <div 
      className={getBarStyle()}
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