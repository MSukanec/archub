import { useMemo } from 'react';
import { GanttRowProps, calculateResolvedEndDate } from './types';

interface GanttTimelineBarProps {
  item: GanttRowProps;
  timelineStart: Date;
  timelineEnd: Date;
  timelineWidth: number;
}

export function GanttTimelineBar({ 
  item, 
  timelineStart, 
  timelineEnd, 
  timelineWidth 
}: GanttTimelineBarProps) {
  const barPosition = useMemo(() => {
    // Use the centralized date calculation utility
    const dateRange = calculateResolvedEndDate(item);
    
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const itemStart = dateRange.startDate.getTime() - timelineStart.getTime();
    const itemDuration = dateRange.resolvedEndDate.getTime() - dateRange.startDate.getTime();
    
    const leftPercent = (itemStart / totalDuration) * 100;
    const widthPercent = Math.max(0.5, (itemDuration / totalDuration) * 100); // Minimum 0.5% width
    
    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${widthPercent}%`,
      ...dateRange
    };
  }, [item, timelineStart, timelineEnd]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Don't render bar if invalid dates
  if (!barPosition.isValid) {
    return (
      <div className="relative h-9 flex items-center px-2 bg-background border-b border-border">
        <div className="text-xs text-destructive opacity-60">
          Fechas inválidas
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-9 flex items-center px-2 bg-background border-b border-border">
      {/* Timeline Bar */}
      <div
        className={`absolute h-5 rounded-md shadow-sm flex items-center justify-center text-xs text-white font-medium transition-all hover:shadow-md ${
          item.type === 'phase'
            ? 'bg-accent hover:bg-accent/90'
            : 'bg-muted-foreground hover:bg-muted-foreground/90'
        }`}
        style={barPosition}
      >
        <span className="px-2 truncate">
          {formatDate(item.startDate)} - {formatDate(barPosition.resolvedEndDate.toISOString().split('T')[0])}
          {barPosition.wasCalculated && item.durationInDays && (
            <span className="ml-1 text-xs opacity-80">
              ({item.durationInDays}d)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}