import { useState, useMemo } from 'react';
import { GanttRow } from './GanttRow';
import { GanttContainerProps, GanttRowProps, calculateResolvedEndDate } from './types';

export function GanttContainer({ 
  data, 
  onItemClick, 
  onAddChild 
}: GanttContainerProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Calculate timeline bounds from all items and their children
  const { timelineStart, timelineEnd } = useMemo(() => {
    const getAllDates = (items: GanttRowProps[]): Date[] => {
      const dates: Date[] = [];
      
      items.forEach(item => {
        // Use the centralized date calculation utility
        const dateRange = calculateResolvedEndDate(item);
        
        // Only add valid dates to prevent timeline calculation issues
        if (dateRange.isValid) {
          dates.push(dateRange.startDate);
          dates.push(dateRange.resolvedEndDate);
        }
        
        if (item.children) {
          dates.push(...getAllDates(item.children));
        }
      });
      
      return dates;
    };

    const allDates = getAllDates(data);
    if (allDates.length === 0) {
      const today = new Date();
      return {
        timelineStart: today,
        timelineEnd: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Add some padding
    const padding = (maxDate.getTime() - minDate.getTime()) * 0.1;
    
    return {
      timelineStart: new Date(minDate.getTime() - padding),
      timelineEnd: new Date(maxDate.getTime() + padding)
    };
  }, [data]);

  const handleToggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const timelineWidth = 800; // Fixed width for timeline area

  if (data.length === 0) {
    return (
      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
        No hay fases o tareas para mostrar
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex border-b border-border bg-muted/50">
        <div className="w-80 flex-shrink-0 px-3 py-2 font-medium text-sm">
          Fase / Tarea
        </div>
        <div className="flex-1 px-3 py-2 font-medium text-sm">
          Cronograma
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {data.map((item) => (
          <GanttRow
            key={item.id}
            item={item}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            timelineWidth={timelineWidth}
            expandedItems={expandedItems}
            onToggleExpand={handleToggleExpand}
            onItemClick={onItemClick}
            onAddChild={onAddChild}
          />
        ))}
      </div>
    </div>
  );
}