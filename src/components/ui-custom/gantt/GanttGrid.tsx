import { useGanttStore } from './store';
import { getColumnWidth, getDateArray, getWeekday, isToday } from './utils';

interface GanttGridProps {
  timelineRange: { start: string; end: string };
}

export const GanttGrid = ({ timelineRange }: GanttGridProps) => {
  const { viewMode } = useGanttStore();
  const columnWidth = getColumnWidth(viewMode);
  
  // Generate array of dates for the timeline
  const dates = getDateArray(timelineRange.start, timelineRange.end);
  
  // Group dates by month for header
  const datesByMonth = dates.reduce((acc, date) => {
    const dateObj = new Date(date);
    const monthKey = dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(date);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="border-b border-gray-200 bg-gray-50 relative">
      {/* Month headers */}
      <div className="flex min-w-fit border-b border-gray-200">
        {Object.entries(datesByMonth).map(([month, monthDates]) => (
          <div
            key={month}
            className="flex items-center justify-center text-xs font-semibold text-gray-700 bg-gray-100 border-r border-gray-200 px-2 py-1"
            style={{ width: `${monthDates.length * columnWidth}px` }}
          >
            {month}
          </div>
        ))}
      </div>
      
      {/* Day headers */}
      <div className="flex min-w-fit relative">
        {dates.map((date) => {
          const dateObj = new Date(date);
          const dayNumber = dateObj.getDate();
          const weekday = getWeekday(date);
          const today = isToday(date);
          
          return (
            <div
              key={date}
              data-today={today}
              className={`h-10 flex flex-col items-center justify-center border-r border-gray-200 text-xs font-medium relative ${
                today 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'text-gray-600'
              }`}
              style={{ width: `${columnWidth}px` }}
            >
              {/* Today indicator line */}
              {today && (
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500 z-10 pointer-events-none -translate-x-0.5" />
              )}
              
              <div className="text-[9px] leading-tight">{weekday}</div>
              <div className="text-[11px] font-semibold leading-tight">{dayNumber}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};