import { GanttBar } from './GanttBar';
import { useGanttStore } from './store';
import { getColumnWidth, getTimelineColumns } from './utils';

interface GanttRowProps {
  type: 'phase' | 'task';
  title: string;
  level: number;
  startDate?: string | null;
  endDate?: string | null;
  assignee?: string;
  timelineRange: { start: string; end: string };
  dataId?: string;
  taskId?: string;
  onTaskClick?: (taskId: string) => void;
  onDateChange?: (taskId: string, startDate: string, endDate: string) => void;
}

export const GanttRow = ({ 
  type, 
  title, 
  level, 
  startDate, 
  endDate, 
  assignee,
  timelineRange,
  dataId,
  taskId,
  onTaskClick,
  onDateChange
}: GanttRowProps) => {
  const { viewMode } = useGanttStore();
  const columnWidth = getColumnWidth(viewMode);
  
  // Generate timeline columns based on view mode
  const timelineColumns = getTimelineColumns(timelineRange.start, timelineRange.end, viewMode);

  return (
    <div 
      className="h-10 border-b border-gray-100 hover:bg-gray-50 relative"
      data-id={dataId}
    >
      {/* Timeline area - only the timeline part scrolls */}
      <div className="flex relative">
        {timelineColumns.map((column) => {
          return (
            <div
              key={column.key}
              className={`border-r border-gray-100 h-10 relative ${
                column.isToday ? 'bg-blue-50' : ''
              }`}
              style={{ width: `${columnWidth}px` }}
            >
              {/* Today indicator line */}
              {column.isToday && (
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500 z-5 pointer-events-none -translate-x-0.5" />
              )}
            </div>
          );
        })}
        
        {/* Render bar for tasks with dates */}
        {type === 'task' && startDate && endDate && (
          <GanttBar
            startDate={startDate}
            endDate={endDate}
            title={title}
            assignee={assignee || 'Sin asignar'}
            timelineStart={timelineRange.start}
            timelineEnd={timelineRange.end}
            taskId={taskId}
            onTaskClick={onTaskClick}
            onDateChange={(newStartDate, newEndDate) => {
              if (taskId && onDateChange) {
                onDateChange(taskId, newStartDate, newEndDate);
              }
            }}
          />
        )}
        
        {/* Show placeholder for tasks without dates */}
        {type === 'task' && (!startDate || !endDate) && (
          <div className="absolute left-2 top-2 bottom-2 w-16 bg-gray-300 rounded text-xs flex items-center justify-center text-gray-600">
            Sin fechas
          </div>
        )}
      </div>
    </div>
  );
};