import { useMemo } from 'react';
import { GanttRowProps } from './types';

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
    const startDate = new Date(item.startDate);
    
    // Calculate end date based on endDate or durationInDays
    let endDate: Date;
    if (item.endDate) {
      endDate = new Date(item.endDate);
    } else if (item.durationInDays) {
      endDate = new Date(startDate.getTime() + (item.durationInDays * 24 * 60 * 60 * 1000));
    } else {
      // Fallback: 1 day duration if neither is provided
      endDate = new Date(startDate.getTime() + (24 * 60 * 60 * 1000));
    }
    
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const itemStart = startDate.getTime() - timelineStart.getTime();
    const itemDuration = endDate.getTime() - startDate.getTime();
    
    const leftPercent = (itemStart / totalDuration) * 100;
    const widthPercent = (itemDuration / totalDuration) * 100;
    
    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.max(2, widthPercent)}%`,
      endDate
    };
  }, [item.startDate, item.endDate, item.durationInDays, timelineStart, timelineEnd]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  };

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
          {formatDate(item.startDate)} - {formatDate(barPosition.endDate.toISOString().split('T')[0])}
          {item.durationInDays && (
            <span className="ml-1 text-xs opacity-80">
              ({item.durationInDays}d)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}