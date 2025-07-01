import { useGanttStore } from './store';
import { getColumnWidth, formatDateForMode } from './utils';

export const GanttGrid = () => {
  const { viewMode } = useGanttStore();
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayDate = today.getDate();
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
  const todayOffset = (todayDate - 1) * (viewMode === 'day' ? columnWidth : columnWidth / 7);

  return (
    <div className="flex border-b border-gray-200 bg-gray-50">
      {/* Left panel - title column */}
      <div className="w-64 h-10 flex items-center px-4 border-r border-gray-200 bg-gray-100 flex-shrink-0">
        <span className="text-sm font-medium text-gray-700">Elementos</span>
      </div>
      
      {/* Timeline header with scroll */}
      <div className="overflow-x-auto min-w-fit relative">
        <div className="flex min-w-fit">
          {periods.map((period, index) => (
            <div
              key={period}
              className={`h-10 flex items-center justify-center border-r border-gray-200 text-xs font-medium ${
                viewMode === 'day' && period === todayDate 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'text-gray-600'
              }`}
              style={{ width: `${columnWidth}px` }}
            >
              {viewMode === 'day' 
                ? period 
                : viewMode === 'week' 
                  ? `Sem ${period}`
                  : formatDateForMode(today, viewMode)
              }
            </div>
          ))}
        </div>
        
        {/* Today indicator line - only for day view */}
        {viewMode === 'day' && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10 pointer-events-none"
            style={{ 
              left: `${todayOffset + columnWidth / 2}px`
            }}
          />
        )}
      </div>
    </div>
  );
};