import React, { useMemo } from 'react';
import { useGanttStore } from './store';
import { getTimelineColumns, getColumnWidth, TimelineColumn } from './utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GanttGridProps {
  timelineRange: { start: string; end: string };
}

export const GanttGrid = ({ timelineRange }: GanttGridProps) => {
  const { viewMode } = useGanttStore();
  const columnWidth = getColumnWidth(viewMode);
  
  // Generate timeline columns based on view mode
  const timelineColumns = useMemo(() => {
    return getTimelineColumns(timelineRange.start, timelineRange.end, viewMode);
  }, [timelineRange, viewMode]);

  // Group columns by higher level units for top header
  const groupedColumns = useMemo(() => {
    if (viewMode === 'weeks') {
      // Group by months for weeks view (showing individual days)
      const monthsMap = new Map<string, TimelineColumn[]>();
      
      timelineColumns.forEach(column => {
        const monthKey = format(column.date, 'yyyy-MM');
        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, []);
        }
        monthsMap.get(monthKey)?.push(column);
      });
      
      return Array.from(monthsMap.entries()).map(([monthKey, columns]) => ({
        key: monthKey,
        label: format(columns[0].date, 'MMM yyyy', { locale: es }).toUpperCase(),
        columns,
        width: columns.length * columnWidth
      }));
    } else if (viewMode === 'months') {
      // Group by years for months view
      const yearsMap = new Map<string, TimelineColumn[]>();
      
      timelineColumns.forEach(column => {
        const yearKey = column.date.getFullYear().toString();
        if (!yearsMap.has(yearKey)) {
          yearsMap.set(yearKey, []);
        }
        yearsMap.get(yearKey)?.push(column);
      });
      
      return Array.from(yearsMap.entries()).map(([yearKey, columns]) => ({
        key: yearKey,
        label: yearKey,
        columns,
        width: columns.length * columnWidth
      }));
    } else {
      // For quarters, no grouping needed
      return [{
        key: 'quarters',
        label: '',
        columns: timelineColumns,
        width: timelineColumns.length * columnWidth
      }];
    }
  }, [timelineColumns, columnWidth, viewMode]);

  return (
    <div className="h-20 border-b border-gray-200 bg-white sticky top-0 z-20">
      {/* Fila superior (meses/años/trimestres) */}
      {viewMode !== 'quarters' && (
        <div className="h-10 border-b border-gray-100 flex">
          {groupedColumns.map((group) => (
            <div
              key={group.key}
              className="border-r border-gray-100 flex items-center justify-center bg-gray-50"
              style={{ width: `${group.width}px` }}
            >
              <span className="text-xs font-semibold text-gray-700">
                {group.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Fila inferior (días/semanas/meses/trimestres) */}
      <div className={`${viewMode === 'quarters' ? 'h-20' : 'h-10'} flex`}>
        {timelineColumns.map((column) => {
          return (
            <div
              key={column.key}
              data-date={column.key}
              className={`border-r border-gray-100 flex flex-col items-center justify-center relative ${
                column.isToday ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              style={{ width: `${columnWidth}px` }}
            >
              <span className={`text-xs font-medium ${
                column.isToday ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {column.label}
              </span>
              
              {/* Indicador de hoy */}
              {column.isToday && (
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500 z-5 pointer-events-none -translate-x-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};