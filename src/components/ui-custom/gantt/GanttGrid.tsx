import React, { useMemo } from 'react';
import { useGanttStore } from './store';
import { getDateArray, getColumnWidth, isToday, getWeekday } from './utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GanttGridProps {
  timelineRange: { start: string; end: string };
}

export const GanttGrid = ({ timelineRange }: GanttGridProps) => {
  const { viewMode } = useGanttStore();
  const columnWidth = getColumnWidth(viewMode);
  
  // Generate dates array based on view mode
  const dates = useMemo(() => {
    return getDateArray(timelineRange.start, timelineRange.end);
  }, [timelineRange, viewMode]);

  // Group dates by month for header
  const datesByMonth = useMemo(() => {
    const monthsMap = new Map<string, string[]>();
    
    dates.forEach(date => {
      const monthKey = format(new Date(date), 'yyyy-MM');
      const monthLabel = format(new Date(date), 'MMM yyyy', { locale: es }).toUpperCase();
      
      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, []);
      }
      monthsMap.get(monthKey)?.push(date);
    });
    
    return Array.from(monthsMap.entries()).map(([monthKey, monthDates]) => ({
      key: monthKey,
      label: format(new Date(monthDates[0]), 'MMM yyyy', { locale: es }).toUpperCase(),
      dates: monthDates,
      width: monthDates.length * columnWidth
    }));
  }, [dates, columnWidth]);

  return (
    <div className="h-20 border-b border-gray-200 bg-white sticky top-0 z-20">
      {/* Fila de meses */}
      <div className="h-10 border-b border-gray-100 flex">
        {datesByMonth.map((month) => (
          <div
            key={month.key}
            className="border-r border-gray-100 flex items-center justify-center bg-gray-50"
            style={{ width: `${month.width}px` }}
          >
            <span className="text-xs font-semibold text-gray-700">
              {month.label}
            </span>
          </div>
        ))}
      </div>

      {/* Fila de días */}
      <div className="h-10 flex">
        {dates.map((date) => {
          const today = isToday(date);
          const dayNumber = format(new Date(date), 'd');
          const weekday = getWeekday(date);
          
          return (
            <div
              key={date}
              data-date={date}
              className={`border-r border-gray-100 flex flex-col items-center justify-center relative ${
                today ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              style={{ width: `${columnWidth}px` }}
            >
              <span className={`text-xs font-medium ${
                today ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {dayNumber}
              </span>
              <span className={`text-xs ${
                today ? 'text-blue-500' : 'text-gray-500'
              }`}>
                {weekday}
              </span>
              
              {/* Indicador de hoy */}
              {today && (
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500 z-5 pointer-events-none -translate-x-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};