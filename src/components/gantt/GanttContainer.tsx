import { useMemo, useState, useCallback } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2 } from 'lucide-react';
import { GanttRow } from './GanttRow';
import { GanttTimelineBar } from './GanttTimelineBar';
import { GanttContainerProps, GanttRowProps, calculateResolvedEndDate } from './types';

export function GanttContainer({ 
  data, 
  onItemClick,
  onEdit,
  onDelete
}: GanttContainerProps & {
  onEdit?: (item: GanttRowProps) => void;
  onDelete?: (item: GanttRowProps) => void;
}) {
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
        timelineStart: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days antes
        timelineEnd: new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000) // 120 days después
      };
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Add substantial padding to ensure scroll is visible
    const paddingDays = 30; // 30 days before and after
    const paddingMillis = paddingDays * 24 * 60 * 60 * 1000;
    
    return {
      timelineStart: new Date(minDate.getTime() - paddingMillis),
      timelineEnd: new Date(maxDate.getTime() + paddingMillis)
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

  const dayWidth = 40; // Ancho más amplio por día para garantizar scroll
  const timelineWidth = Math.max(calendarStructure.allDays.length * dayWidth, 1200); // Ancho mínimo para garantizar scroll

  if (data.length === 0) {
    return (
      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
        No hay fases o tareas para mostrar
      </div>
    );
  }

  return (
    <div className="relative border border-border rounded-lg overflow-hidden bg-card">
      {/* Handle de redimensionamiento unificado (de punta a punta vertical desde encabezado) */}
      <div 
        className="absolute w-3 cursor-col-resize bg-transparent hover:bg-[var(--accent)] hover:opacity-40 transition-colors z-50 hover:border-l-2 hover:border-[var(--accent)]"
        style={{ 
          left: leftPanelWidth - 2,
          top: 0,
          height: '100%'
        }}
        onMouseDown={startResize}
      />
      
      {/* Encabezado unificado */}
      <div className="flex border-b border-border bg-muted/50">
        {/* Encabezado del panel izquierdo - FIJO */}
        <div 
          className="border-r border-border flex-shrink-0 h-14 flex items-center bg-muted/50"
          style={{ width: leftPanelWidth }}
        >
          <div className="px-3 font-medium text-sm">
            Rubro / Tarea
          </div>
        </div>

        {/* Encabezado de fechas doble fila - CON SCROLL HORIZONTAL */}
        <div 
          className="flex-1 overflow-x-scroll gantt-timeline-scroll" 
          id="timeline-header-scroll"
          onScroll={(e) => {
            // Sincronizar scroll con el contenido
            const contentScroll = document.getElementById('timeline-content-scroll');
            if (contentScroll) {
              contentScroll.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
        >
          <div style={{ width: timelineWidth }}>
            {/* Fila de meses */}
            <div className="flex border-b border-border/50 h-6">
              {calendarStructure.months.map((month) => (
                <div 
                  key={month.label}
                  className="flex items-center justify-center text-xs font-medium text-muted-foreground border-r border-border/30 last:border-r-0"
                  style={{ width: month.days.length * dayWidth }}
                >
                  {month.label}
                </div>
              ))}
            </div>
            
            {/* Fila de días */}
            <div className="flex h-6">
              {calendarStructure.allDays.map((day) => (
                <div 
                  key={day.date}
                  className="flex items-center justify-center text-xs text-muted-foreground border-r border-border/30 last:border-r-0"
                  style={{ width: dayWidth }}
                >
                  {day.day}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative flex">
        {/* Panel Izquierdo - FIJO (sin scroll horizontal) */}
        <div 
          className="bg-card border-r border-border flex-shrink-0 overflow-hidden"
          style={{ width: leftPanelWidth }}
        >
          {/* Contenido del panel izquierdo */}
          <div className="max-h-96 overflow-y-auto overflow-x-hidden">
            {data.map((item) => (
              <div key={`left-${item.id}`} className="border-b border-border h-9 flex items-center">
                {item.isHeader ? (
                  <div className="bg-muted/30 w-full h-full flex items-center px-3">
                    <span className="truncate text-sm text-muted-foreground font-medium uppercase" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                ) : (
                  <div 
                    className="group w-full h-full flex items-center cursor-pointer hover:bg-muted/20 transition-colors"
                    style={{ paddingLeft: `${12 + item.level * 24}px`, paddingRight: '12px' }}
                    onClick={() => onItemClick?.(item)}
                  >
                    <div className="flex items-center w-full">
                      {/* Text that contracts on hover to make space for buttons */}
                      <span 
                        className={`
                          truncate text-sm text-foreground transition-all duration-200
                          ${(onEdit || onDelete) ? 'group-hover:pr-[68px]' : ''}
                        `}
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      
                      {/* Action Buttons - appear in the space freed by text contraction */}
                      {(onEdit || onDelete) && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          {onEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                              }}
                              className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-[var(--button-ghost-hover-bg)] transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item);
                              }}
                              className="h-8 w-8 p-0 flex items-center justify-center rounded text-red-600 hover:text-red-700 hover:bg-[var(--button-ghost-hover-bg)] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

        {/* Timeline - CON SCROLL HORIZONTAL SINCRONIZADO */}
        <div 
          className="flex-1 overflow-x-scroll gantt-timeline-scroll" 
          id="timeline-content-scroll"
          onScroll={(e) => {
            // Sincronizar scroll con el header
            const headerScroll = document.getElementById('timeline-header-scroll');
            if (headerScroll) {
              headerScroll.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
        >
          {/* Contenido del timeline */}
          <div className="max-h-96 overflow-y-auto" style={{ width: timelineWidth }}>
            {data.map((item) => (
              <div key={`timeline-${item.id}`} className="border-b border-border h-9 flex items-center">
                {item.isHeader ? (
                  <div 
                    className="bg-muted/30 h-full w-full"
                    style={{ width: timelineWidth }}
                  />
                ) : (
                  <div 
                    className="relative h-full w-full"
                    style={{ width: timelineWidth }}
                  >
                    {/* Grilla de días de fondo */}
                    <div className="absolute inset-0 flex">
                      {calendarStructure.allDays.map((day) => (
                        <div 
                          key={day.date}
                          className="border-r border-border/10 last:border-r-0 h-full"
                          style={{ width: dayWidth }}
                        />
                      ))}
                    </div>
                    
                    {/* Barra de tarea */}
                    <div className="absolute inset-0 flex items-center px-1">
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