import { GanttBar } from './GanttBar';
import { useGanttStore } from './store';
import { getColumnWidth } from './utils';

interface GanttRowProps {
  type: 'phase' | 'task';
  title: string;
  level: number;
  startDate?: string;
  endDate?: string;
  assignee?: string;
}

export const GanttRow = ({ 
  type, 
  title, 
  level, 
  startDate, 
  endDate, 
  assignee 
}: GanttRowProps) => {
  const { viewMode } = useGanttStore();
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const columnWidth = getColumnWidth(viewMode);
  
  // Generate periods based on view mode
  const generatePeriods = () => {
    switch (viewMode) {
      case 'day':
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
      case 'week':
        const weeks = Math.ceil(daysInMonth / 7);
        return Array.from({ length: weeks }, (_, i) => i + 1);
      case 'month':
        return [1]; // Current month only
      default:
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }
  };

  const periods = generatePeriods();

  return (
    <div className="flex border-b border-gray-100 h-10 hover:bg-gray-50">
      {/* Left panel - element info */}
      <div className="w-64 h-10 flex items-center px-4 border-r border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Indentation based on level */}
          <div style={{ paddingLeft: `${level * 16}px` }} className="flex items-center gap-2">
            {type === 'phase' ? (
              <>
                <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-100 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-700">{title}</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded border border-gray-400 bg-gray-100 flex-shrink-0" />
                <span className="text-sm text-gray-700">{title}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Timeline area with scroll sync */}
      <div className="overflow-x-auto min-w-fit relative">
        <div className="flex min-w-fit relative">
          {periods.map((period) => (
            <div
              key={period}
              className="border-r border-gray-100 h-10"
              style={{ width: `${columnWidth}px` }}
            />
          ))}
          
          {/* Render bar only for tasks with dates */}
          {type === 'task' && startDate && endDate && assignee && (
            <GanttBar
              startDate={startDate}
              endDate={endDate}
              title={title}
              assignee={assignee}
            />
          )}
        </div>
      </div>
    </div>
  );
};