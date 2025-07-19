import { useMemo, useState, useCallback } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { GanttRow } from './GanttRow';
import { GanttTimelineBar } from './GanttTimelineBar';
import { GanttContainerProps, GanttRowProps, calculateResolvedEndDate } from './types';

export function GanttContainer({ 
  data, 
  onItemClick 
}: GanttContainerProps) {
  // Estado para el ancho del panel izquierdo
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem('gantt-left-panel-width');
    return saved ? parseInt(saved, 10) : 320;
  });

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

  // Calcular estructura de calendario (meses y días)
  const calendarStructure = useMemo(() => {
    const allDays = eachDayOfInterval({
      start: timelineStart,
      end: timelineEnd
    });

    const months: Array<{
      label: string;
      days: Array<{ date: string; day: number }>;
    }> = [];

    let currentMonth: typeof months[0] | null = null;

    allDays.forEach((day) => {
      const monthLabel = format(day, "MMMM ''yy", { locale: es });
      const dayNumber = day.getDate();

      if (!currentMonth || currentMonth.label !== monthLabel) {
        currentMonth = {
          label: monthLabel,
          days: []
        };
        months.push(currentMonth);
      }

      currentMonth.days.push({
        date: format(day, 'yyyy-MM-dd'),
        day: dayNumber
      });
    });

    return { months, allDays: allDays.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      day: day.getDate()
    })) };
  }, [timelineStart, timelineEnd]);

  // Función para iniciar el redimensionamiento
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      const clampedWidth = Math.max(200, Math.min(600, newWidth));
      setLeftPanelWidth(clampedWidth);
      localStorage.setItem('gantt-left-panel-width', clampedWidth.toString());
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [leftPanelWidth]);

  const dayWidth = 32; // Ancho fijo por día
  const timelineWidth = calendarStructure.allDays.length * dayWidth;

  if (data.length === 0) {
    return (
      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
        No hay fases o tareas para mostrar
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex">
        {/* Panel Izquierdo */}
        <div 
          className="relative bg-card border-r border-border flex-shrink-0"
          style={{ width: leftPanelWidth }}
        >
          {/* Encabezado del panel izquierdo */}
          <div className="border-b border-border bg-muted/50">
            <div className="px-3 py-2 font-medium text-sm">
              Rubro / Tarea
            </div>
          </div>

          {/* Contenido del panel izquierdo */}
          <div className="max-h-96 overflow-y-auto">
            {data.map((item) => (
              <div key={`left-${item.id}`} className="border-b border-border">
                {item.isHeader ? (
                  <div className="bg-muted/30 px-3 py-2 text-sm text-muted-foreground font-medium uppercase">
                    <span className="truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                ) : (
                  <div 
                    className="flex items-center h-9 px-3 cursor-pointer hover:bg-muted/20 transition-colors"
                    style={{ paddingLeft: `${12 + item.level * 24}px` }}
                    onClick={() => onItemClick?.(item)}
                  >
                    <span className="truncate text-sm text-foreground" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Handle de redimensionamiento */}
          <div 
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize bg-transparent hover:bg-accent/20 transition-colors z-10"
            onMouseDown={startResize}
          />
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-x-auto">
          {/* Encabezado de fechas doble fila */}
          <div className="border-b border-border bg-muted/50 min-w-max">
            {/* Fila de meses */}
            <div className="flex border-b border-border/50">
              {calendarStructure.months.map((month) => (
                <div 
                  key={month.label}
                  className="flex items-center justify-center py-1 px-2 text-xs font-medium text-muted-foreground border-r border-border/30 last:border-r-0"
                  style={{ width: month.days.length * dayWidth }}
                >
                  {month.label}
                </div>
              ))}
            </div>
            
            {/* Fila de días */}
            <div className="flex">
              {calendarStructure.allDays.map((day) => (
                <div 
                  key={day.date}
                  className="flex items-center justify-center py-1 text-xs text-muted-foreground border-r border-border/30 last:border-r-0"
                  style={{ width: dayWidth }}
                >
                  {day.day}
                </div>
              ))}
            </div>
          </div>

          {/* Contenido del timeline */}
          <div className="max-h-96 overflow-y-auto min-w-max">
            {data.map((item) => (
              <div key={`timeline-${item.id}`} className="border-b border-border">
                {item.isHeader ? (
                  <div 
                    className="bg-muted/30 h-9"
                    style={{ width: timelineWidth }}
                  />
                ) : (
                  <div 
                    className="relative h-9"
                    style={{ width: timelineWidth }}
                  >
                    {/* Grilla de días de fondo */}
                    <div className="absolute inset-0 flex">
                      {calendarStructure.allDays.map((day, index) => (
                        <div 
                          key={day.date}
                          className="border-r border-border/10 last:border-r-0"
                          style={{ width: dayWidth }}
                        />
                      ))}
                    </div>
                    
                    {/* Barra de tarea */}
                    <div className="absolute inset-y-1 flex items-center">
                      <GanttTimelineBar 
                        item={item}
                        timelineStart={timelineStart}
                        timelineEnd={timelineEnd}
                        timelineWidth={timelineWidth}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}