import { GanttBar } from './GanttBar';
import { useGanttStore } from './store';
import { getColumnWidth, getDateArray, isToday } from './utils';

interface GanttRowProps {
  type: 'phase' | 'task';
  title: string;
  level: number;
  startDate?: string | null;
  endDate?: string | null;
  assignee?: string;
  timelineRange: { start: string; end: string };
  dataId?: string;
}

export const GanttRow = ({ 
  type, 
  title, 
  level, 
  startDate, 
  endDate, 
  assignee,
  timelineRange,
  dataId
}: GanttRowProps) => {
  const { viewMode } = useGanttStore();
  const columnWidth = getColumnWidth(viewMode);
  
  // Generate array of dates for the timeline
  const dates = getDateArray(timelineRange.start, timelineRange.end);

  return (
    <div 
      className="h-10 border-b border-gray-100 hover:bg-gray-50 relative"
      data-id={dataId}
    >
      {/* Timeline area - only the timeline part scrolls */}
      <div className="flex min-w-fit relative">
        {dates.map((date) => {
          const today = isToday(date);
          
          return (
            <div
              key={date}
              className={`border-r border-gray-100 h-10 relative ${
                today ? 'bg-blue-50' : ''
              }`}
              style={{ width: `${columnWidth}px` }}
            >
              {/* Today indicator line */}
              {today && (
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500 z-5 pointer-events-none -translate-x-0.5" />
              )}
            </div>
          );
        })}
        
        {/* Render bar only for tasks with dates */}
        {type === 'task' && startDate && endDate && assignee && (
          <GanttBar
            startDate={startDate}
            endDate={endDate}
            title={title}
            assignee={assignee}
            timelineStart={timelineRange.start}
          />
        )}
      </div>
    </div>
  );
};