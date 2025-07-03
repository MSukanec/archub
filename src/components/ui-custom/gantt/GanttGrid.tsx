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

  return (
    <div className="min-w-fit h-20 flex">
      {dates.map((date, index) => {
        const dateObj = new Date(date);
        const today = isToday(date);
        const isFirstOfMonth = dateObj.getDate() === 1 || index === 0;
        const monthName = dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
        
        return (
          <div
            key={date}
            className={`border-r border-gray-200 h-20 flex flex-col relative ${
              today ? 'bg-blue-50' : 'bg-gray-50'
            }`}
            style={{ width: `${columnWidth}px` }}
          >
            {/* Mes (solo se muestra en el primer día del mes) */}
            {isFirstOfMonth && (
              <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center bg-gray-100 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-600">{monthName}</span>
              </div>
            )}
            
            {/* Día y día de la semana - ocupan la parte inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-12 flex flex-col items-center justify-center">
              <span className={`text-xs font-medium ${today ? 'text-blue-600' : 'text-gray-600'}`}>
                {getWeekday(date)}
              </span>
              <span className={`text-xs ${today ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                {dateObj.getDate()}
              </span>
            </div>
            
            {/* Indicador vertical de hoy */}
            {today && (
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500 z-10 pointer-events-none -translate-x-0.5" />
            )}
          </div>
        );
      })}
    </div>
  );
};