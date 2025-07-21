import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, isSameMonth, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Edit3, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { GanttRow } from './GanttRow';
import { GanttTimelineBar } from './GanttTimelineBar';
import { GanttDependencies } from './GanttDependencies';
import { GanttContainerProps, GanttRowProps, calculateResolvedEndDate } from './types';
import { useConstructionDependencies } from '@/hooks/use-construction-dependencies';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

export function GanttContainer({ 
  data, 
  dependencies = [],
  onItemClick,
  onItemEdit,
  onItemDelete,
  allTasks,
  projectId
}: GanttContainerProps & {
  onItemEdit?: (item: GanttRowProps) => void;
  onItemDelete?: (item: GanttRowProps) => void;
}) {
  
  const { openModal } = useGlobalModalStore();
  
  console.log('GanttContainer received dependencies:', dependencies);
  // Estado para manejar conexiones drag & drop entre tareas
  const [dragConnectionData, setDragConnectionData] = useState<{
    fromTaskId: string;
    fromPoint: 'start' | 'end';
  } | null>(null);
  
  // Estados para línea punteada temporal
  const [connectionLineData, setConnectionLineData] = useState<{
    startX: number;
    startY: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);
  // Estado para el ancho del panel izquierdo
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem('gantt-left-panel-width');
    return saved ? parseInt(saved, 10) : 320;
  });

  // Estado para el hover sincronizado
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  
  // Estado para fases colapsadas
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());
  
  // Estado para forzar actualización de flechas durante drag
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Estado para forzar actualización completa después del drop
  const [dropRefreshTrigger, setDropRefreshTrigger] = useState(0);
  
  // Estado temporal para posiciones de arrastre de dependencias
  const [tempDragPositions, setTempDragPositions] = useState<Record<string, {
    startDate: string;
    endDate: string;
  }>>({});
  
  // Estado para preservar la posición del scroll
  const [preservedScrollLeft, setPreservedScrollLeft] = useState<number | null>(null);
  
  // Bandera para evitar scroll automático después del primer scroll
  const [autoScrolled, setAutoScrolled] = useState(false);
  
  // Función para alternar el colapso de una fase
  const togglePhaseCollapse = useCallback((phaseId: string) => {
    setCollapsedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  }, []);
  
  // Función para forzar actualización de flechas durante drag
  const refreshArrows = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Función para actualizar posiciones temporales durante drag
  const updateTempDragPositions = useCallback((positions: Record<string, { startDate: string; endDate: string }>) => {
    setTempDragPositions(positions);
  }, []);
  
  // Función para limpiar posiciones temporales
  const clearTempDragPositions = useCallback(() => {
    setTempDragPositions({});
  }, []);
  
  // Función para forzar actualización completa después del drop
  const forceDropRefresh = useCallback(() => {
    setDropRefreshTrigger(prev => prev + 1);
  }, []);

  // Función para manejar click en dependencias
  const handleDependencyClick = useCallback((dependency: any) => {
    openModal('dependency-connection', { dependency });
  }, [openModal]);
  
  // Ref para el contenedor del timeline para posicionamiento de dependencias
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Las dependencias vienen como prop, no necesitamos el hook aquí

  // Función para manejar el redimensionamiento del panel
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(200, Math.min(600, startWidth + deltaX));
      setLeftPanelWidth(newWidth);
      localStorage.setItem('gantt-left-panel-width', newWidth.toString());
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [leftPanelWidth]);

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
        
        // Note: GanttRowProps doesn't have children in current structure
        // This was likely from an older version
      });
      
      return dates;
    };

    const allDates = getAllDates(data);
    if (allDates.length === 0) {
      const today = new Date();
      const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const timelineStartRaw = new Date(normalizedToday.getTime() - 60 * 24 * 60 * 60 * 1000);
      const timelineEndRaw = new Date(normalizedToday.getTime() + 120 * 24 * 60 * 60 * 1000);
      
      return {
        timelineStart: new Date(timelineStartRaw.getFullYear(), timelineStartRaw.getMonth(), timelineStartRaw.getDate()),
        timelineEnd: new Date(timelineEndRaw.getFullYear(), timelineEndRaw.getMonth(), timelineEndRaw.getDate())
      };
    }

    // Normalize min and max dates to avoid UTC issues
    const normalizedDates = allDates.map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    const minDate = new Date(Math.min(...normalizedDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...normalizedDates.map(d => d.getTime())));
    
    // Add substantial padding to ensure scroll is visible
    const paddingDays = 30; // 30 days before and after
    const paddingMillis = paddingDays * 24 * 60 * 60 * 1000;
    
    // Normalize timeline boundaries
    const timelineStartRaw = new Date(minDate.getTime() - paddingMillis);
    const timelineEndRaw = new Date(maxDate.getTime() + paddingMillis);
    
    const finalTimelineStart = new Date(timelineStartRaw.getFullYear(), timelineStartRaw.getMonth(), timelineStartRaw.getDate());
    const finalTimelineEnd = new Date(timelineEndRaw.getFullYear(), timelineEndRaw.getMonth(), timelineEndRaw.getDate());
    
    console.log('Timeline calculation:', {
      minDateOriginal: minDate.toDateString(),
      timelineStartCalculated: finalTimelineStart.toDateString(),
      timelineEndCalculated: finalTimelineEnd.toDateString()
    });
    
    return {
      timelineStart: finalTimelineStart,
      timelineEnd: finalTimelineEnd
    };
  }, [data]);

  // FIXED: Calendar structure - Generate day by day to match timeline calculations exactly
  const calendarStructure = useMemo(() => {
    const allDays: Array<{ date: Date; dayNumber: string; dayName: string; isWeekend: boolean }> = [];
    
    // Generate ALL individual days first - EXACT same logic as GanttTimelineBar
    let currentDate = new Date(timelineStart);
    while (currentDate <= timelineEnd) {
      const normalizedDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      allDays.push({
        date: normalizedDay,
        dayNumber: format(normalizedDay, 'd'),
        dayName: format(normalizedDay, 'EEE', { locale: es }),
        isWeekend: isWeekend(normalizedDay)
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group days into weeks for display only (maintaining week structure for visual consistency)
    const weeks: any[] = [];
    let weekKey = 0;
    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7);
      if (weekDays.length > 0) {
        const week = {
          key: format(weekDays[0].date, 'yyyy-ww'),
          start: weekDays[0].date,
          end: weekDays[weekDays.length - 1].date,
          monthLabel: `${format(weekDays[0].date, 'MMM', { locale: es })} ${format(weekDays[0].date, 'yy')}`,
          days: weekDays
        };
        weeks.push(week);
        weekKey++;
      }
    }

    const totalDays = allDays.length;
    
    // Calendar structure generated correctly
    // console.log('Calendar:', totalDays, 'days from', timelineStart.toDateString(), 'to', timelineEnd.toDateString());
    
    return { weeks, totalDays };
  }, [timelineStart, timelineEnd]);

  // Función para manejar el seguimiento de la línea punteada
  useEffect(() => {
    if (!dragConnectionData) {
      setConnectionLineData(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (connectionLineData) {
        setConnectionLineData(prev => prev ? {
          ...prev,
          mouseX: e.clientX,
          mouseY: e.clientY
        } : null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [dragConnectionData, connectionLineData]);

  // Preservar posición del scroll cuando cambian los datos
  useEffect(() => {
    if (preservedScrollLeft !== null) {
      const timelineContainer = document.getElementById('timeline-content-scroll');
      const headerContainer = document.getElementById('timeline-header-scroll');
      
      if (timelineContainer && headerContainer) {
        timelineContainer.scrollLeft = preservedScrollLeft;
        headerContainer.scrollLeft = preservedScrollLeft;
        setPreservedScrollLeft(null); // Limpiar después de restaurar
      }
    }
  }, [calendarStructure, preservedScrollLeft]);

  // Función para manejar el inicio de conexión con posición inicial
  const handleConnectionDrag = useCallback((data: { fromTaskId: string; fromPoint: 'start' | 'end' } | null, initialPosition?: { x: number; y: number }) => {
    console.log('GanttContainer handleConnectionDrag:', data, initialPosition);
    setDragConnectionData(data);
    
    if (data && initialPosition) {
      // Crear la línea punteada inicial
      setConnectionLineData({
        startX: initialPosition.x,
        startY: initialPosition.y,
        mouseX: initialPosition.x,
        mouseY: initialPosition.y
      });
      console.log('Línea punteada creada:', initialPosition);
    } else {
      // Limpiar la línea cuando se cancela el drag
      setConnectionLineData(null);
      console.log('Línea punteada limpiada');
    }
  }, []);

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

  const weekWidth = 480; // DÍAS DOBLES: 240 * 2 = días más anchos
  const timelineWidth = Math.max(calendarStructure.weeks.length * weekWidth, 2400); // Ancho mínimo duplicado

  // Auto-scroll para posicionar el timeline en HOY - 7 días (solo la primera vez)
  useEffect(() => {
    if (autoScrolled) return;

    const scrollToToday = () => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Buscar el índice del día de hoy
      let todayDayIndex = -1;
      let currentDayIndex = 0;
      
      for (const week of calendarStructure.weeks) {
        for (const day of week.days) {
          if (day.date.getTime() === todayStart.getTime()) {
            todayDayIndex = currentDayIndex;
            break;
          }
          currentDayIndex++;
        }
        if (todayDayIndex !== -1) break;
      }
      
      if (todayDayIndex !== -1) {
        // Calcular posición de HOY - 3 días (solo 3 días antes)
        const targetDayIndex = Math.max(0, todayDayIndex - 3);
        const dayWidth = timelineWidth / calendarStructure.totalDays;
        const targetScrollPosition = targetDayIndex * dayWidth;
        
        // Aplicar scroll a ambos contenedores
        const headerScroll = document.getElementById('timeline-header-scroll');
        const contentScroll = document.getElementById('timeline-content-scroll');
        
        if (headerScroll) {
          headerScroll.scrollLeft = targetScrollPosition;
        }
        if (contentScroll) {
          contentScroll.scrollLeft = targetScrollPosition;
        }
        
        // Marcar que ya se hizo el auto-scroll inicial
        setAutoScrolled(true);
        
        // Auto-scroll to show current week
        // console.log('Auto-scroll to day', targetDayIndex);
      }
    };

    // Ejecutar scroll después de un breve delay para asegurar que el DOM esté listo
    const timeoutId = setTimeout(scrollToToday, 100);
    return () => clearTimeout(timeoutId);
  }, [calendarStructure.weeks, calendarStructure.totalDays, timelineWidth, autoScrolled]);

  if (data.length === 0) {
    return (
      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
        No hay fases o tareas para mostrar
      </div>
    );
  }

  // Filtrar datos para ocultar tareas de fases colapsadas
  const filteredData = useMemo(() => {
    const result: GanttRowProps[] = [];
    let currentPhaseId: string | null = null;
    
    for (const item of data) {
      if (item.type === 'phase') {
        currentPhaseId = item.id;
        result.push(item); // Siempre mostrar las fases
      } else if (item.type === 'task') {
        // Solo mostrar tareas si la fase no está colapsada
        if (!currentPhaseId || !collapsedPhases.has(currentPhaseId)) {
          result.push(item);
        }
      }
    }
    
    return result;
  }, [data, collapsedPhases]);

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
      <div className="flex border-b border-[var(--table-header-border)] bg-[var(--table-header-bg)]">
        {/* Encabezado del panel izquierdo - FIJO */}
        <div 
          className="border-r border-[var(--table-header-border)] flex-shrink-0 h-14 flex items-center bg-[var(--table-header-bg)]"
          style={{ width: leftPanelWidth }}
        >
          <div className="px-4 font-medium text-xs text-[var(--table-header-fg)]">
            Fase / Tarea
          </div>
        </div>

        {/* Encabezado de fechas POR SEMANAS - SCROLL INVISIBLE */}
        <div 
          className="flex-1 overflow-x-auto" 
          id="timeline-header-scroll"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          onScroll={(e) => {
            // Sincronizar scroll con el contenido
            const contentScroll = document.getElementById('timeline-content-scroll');
            if (contentScroll) {
              contentScroll.scrollLeft = e.currentTarget.scrollLeft;
            }
            // Preservar posición del scroll para evitar saltos
            setPreservedScrollLeft(e.currentTarget.scrollLeft);
          }}
        >
          <style>
            {`
              #timeline-header-scroll::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          <div style={{ width: timelineWidth }}>
            {/* Fila superior: Meses - GROUPED BY ACTUAL MONTHS */}
            <div className="flex h-6">
              {(() => {
                const monthGroups: Array<{ monthLabel: string; dayCount: number }> = [];
                let currentMonth = '';
                let dayCount = 0;
                
                calendarStructure.weeks.forEach(week => {
                  week.days.forEach((day: any) => {
                    const monthLabel = format(day.date, 'MMM yy', { locale: es }).toUpperCase();
                    if (monthLabel !== currentMonth) {
                      if (currentMonth) {
                        monthGroups.push({ monthLabel: currentMonth, dayCount });
                      }
                      currentMonth = monthLabel;
                      dayCount = 1;
                    } else {
                      dayCount++;
                    }
                  });
                });
                
                // Add the last month
                if (currentMonth) {
                  monthGroups.push({ monthLabel: currentMonth, dayCount });
                }
                
                const dayWidth = timelineWidth / calendarStructure.totalDays;
                
                return monthGroups.map((month, index) => (
                  <div 
                    key={`month-${index}`}
                    className="flex items-center justify-center text-xs font-medium text-[var(--table-header-fg)] border-r border-[var(--table-header-border)]/30 last:border-r-0"
                    style={{ width: month.dayCount * dayWidth }}
                  >
                    {month.monthLabel}
                  </div>
                ));
              })()}
            </div>
            
            {/* Fila inferior: Días de la semana + número - INDIVIDUAL DAYS TO MATCH BARS */}
            <div className="flex h-8 border-t border-[var(--table-header-border)]">
              {calendarStructure.weeks.map((week) => 
                week.days.map((day: any, dayIndex: number) => {
                  const today = new Date();
                  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const isToday = day.date.getTime() === todayStart.getTime();
                  const dayWidth = timelineWidth / calendarStructure.totalDays;
                  
                  return (
                    <div 
                      key={`${week.key}-${dayIndex}`}
                      className={`flex items-center justify-center text-xs font-medium border-r border-[var(--table-header-border)]/30 last:border-r-0 ${
                        day.isWeekend 
                          ? 'text-[var(--table-header-fg)]/60' 
                          : 'text-[var(--table-header-fg)]'
                      } ${isToday ? 'bg-[var(--accent)] text-white' : ''}`}
                      style={{ width: dayWidth, minWidth: dayWidth }}
                    >
                      {format(day.date, 'EEE d', { locale: es })}
                    </div>
                  );
                })
              ).flat()}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative flex">
        {/* Panel Izquierdo - FIJO (sin scroll horizontal) */}
        <div 
          className="border-r border-border flex-shrink-0 overflow-hidden"
          style={{ 
            width: leftPanelWidth,
            backgroundColor: 'var(--table-header-bg)'
          }}
        >
          {/* Contenido del panel izquierdo */}
          <div className="max-h-96 overflow-y-auto overflow-x-hidden">
            {filteredData.map((item) => (
              <div 
                key={`left-${item.id}`} 
                className={`border-b border-[var(--table-row-border)] h-11 flex items-center transition-colors ${
                  hoveredRowId === item.id ? 'bg-[var(--table-row-hover-bg)]' : 'bg-[var(--table-row-bg)]'
                }`}
                onMouseEnter={() => setHoveredRowId(item.id)}
                onMouseLeave={() => setHoveredRowId(null)}
              >
                {item.isHeader ? (
                  <div className="bg-muted/30 w-full h-full flex items-center px-4 relative">
                    {/* Icono de colapso para fases header */}
                    {item.type === 'phase' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePhaseCollapse(item.id);
                        }}
                        className="mr-2 p-0.5 rounded hover:bg-[var(--button-ghost-hover-bg)] transition-colors flex-shrink-0"
                      >
                        {collapsedPhases.has(item.id) ? (
                          <ChevronRight className="w-3 h-3 text-foreground" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-foreground" />
                        )}
                      </button>
                    )}
                    <span className="truncate text-xs text-foreground font-medium uppercase" title={item.name}>
                      {item.name}
                    </span>
                    
                    {/* Botones de acción flotantes para fases header */}
                    {item.type === 'phase' && (onItemEdit || onItemDelete) && hoveredRowId === item.id && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded shadow-md px-1 py-1 opacity-100 transition-opacity z-50">
                        {onItemEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemEdit(item);
                            }}
                            className="h-6 w-6 p-0 flex items-center justify-center rounded hover:bg-[var(--button-ghost-hover-bg)] transition-colors"
                            title="Editar fase"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        )}
                        {onItemDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemDelete(item);
                            }}
                            className="h-6 w-6 p-0 flex items-center justify-center rounded text-red-600 hover:text-red-700 hover:bg-[var(--button-ghost-hover-bg)] transition-colors"
                            title="Eliminar fase"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className="group w-full h-full flex items-center cursor-pointer transition-colors relative"
                    style={{ paddingLeft: `${4 + item.level * 16}px`, paddingRight: '16px' }}
                    onClick={() => onItemClick?.(item)}
                  >
                    {/* Icono de colapso para fases */}
                    {item.type === 'phase' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePhaseCollapse(item.id);
                        }}
                        className="mr-2 p-0.5 rounded hover:bg-[var(--button-ghost-hover-bg)] transition-colors flex-shrink-0"
                      >
                        {collapsedPhases.has(item.id) ? (
                          <ChevronRight className="w-3 h-3 text-[var(--table-row-fg)]" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-[var(--table-row-fg)]" />
                        )}
                      </button>
                    )}
                    
                    {/* Text - ocupando todo el ancho disponible */}
                    <span 
                      className="truncate text-xs text-[var(--table-row-fg)] w-full"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    
                    {/* Floating Action buttons - aparecer SOBRE el texto */}
                    {(onItemEdit || onItemDelete) && hoveredRowId === item.id && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded shadow-md px-1 py-1 opacity-100 transition-opacity z-50">
                        {onItemEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemEdit(item);
                            }}
                            className="h-6 w-6 p-0 flex items-center justify-center rounded hover:bg-[var(--button-ghost-hover-bg)] transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        )}
                        {onItemDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemDelete(item);
                            }}
                            className="h-6 w-6 p-0 flex items-center justify-center rounded text-red-600 hover:text-red-700 hover:bg-[var(--button-ghost-hover-bg)] transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Filas vacías adicionales para sincronizar con timeline */}
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`empty-left-${index}`} className="border-b border-[var(--table-row-border)] h-11 flex items-center bg-[var(--table-row-bg)]">
                {/* Fila vacía para mantener altura sincronizada */}
              </div>
            ))}
          </div>

        </div>

        {/* Timeline - CON SCROLL HORIZONTAL SINCRONIZADO */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-x-scroll gantt-timeline-scroll relative" 
          id="timeline-content-scroll"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--accent) var(--table-header-bg)'
          }}
          onScroll={(e) => {
            // Sincronizar scroll con el header
            const headerScroll = document.getElementById('timeline-header-scroll');
            if (headerScroll) {
              headerScroll.scrollLeft = e.currentTarget.scrollLeft;
            }
            // Preservar posición del scroll para evitar saltos
            setPreservedScrollLeft(e.currentTarget.scrollLeft);
          }}
        >
          {/* Contenido del timeline */}
          <div className="max-h-96 overflow-y-auto" style={{ width: timelineWidth }}>
            {filteredData.map((item, index) => (
              <div 
                key={`timeline-${item.id}`} 
                className={`border-b border-[var(--table-row-border)] h-11 flex items-center transition-colors ${
                  hoveredRowId === item.id ? 'bg-[var(--table-row-hover-bg)]' : 'bg-[var(--table-row-bg)]'
                }`}
                onMouseEnter={() => setHoveredRowId(item.id)}
                onMouseLeave={() => setHoveredRowId(null)}
              >
                {item.isHeader ? (
                  <div 
                    className="bg-muted/30 h-full w-full relative"
                    style={{ width: timelineWidth }}
                  >
                    {/* Línea del día de hoy también en headers */}
                    {(() => {
                      const today = new Date();
                      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      
                      // Buscar el día exacto en la estructura del calendario
                      let todayDayIndex = -1;
                      let currentDayIndex = 0;
                      
                      for (const week of calendarStructure.weeks) {
                        for (const day of week.days) {
                          if (day.date.getTime() === todayStart.getTime()) {
                            todayDayIndex = currentDayIndex;
                            break;
                          }
                          currentDayIndex++;
                        }
                        if (todayDayIndex !== -1) break;
                      }
                      
                      if (todayDayIndex !== -1) {
                        const dayWidth = timelineWidth / calendarStructure.totalDays;
                        const todayPosition = todayDayIndex * dayWidth + (dayWidth / 2) - 1; // -1px para centrar mejor
                        
                        // Today line positioned correctly
                        // console.log('Today line at day', todayDayIndex, 'position', todayPosition);
                        
                        return (
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent)] z-10"
                            style={{ left: `${todayPosition}px` }}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                ) : (
                  <div 
                    className="relative h-full w-full"
                    style={{ width: timelineWidth }}
                  >
                    {/* Grilla de semanas SIN LÍNEAS VERTICALES */}
                    <div className="absolute inset-0 flex">
                      {calendarStructure.weeks.map((week) => (
                        <div 
                          key={`week-grid-${week.key}`}
                          className="h-full"
                          style={{ width: weekWidth }}
                        />
                      ))}
                    </div>
                    
                    {/* Línea del día de hoy */}
                    <div className="absolute inset-0">
                      {(() => {
                        const today = new Date();
                        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        
                        // Buscar el día exacto en la estructura del calendario
                        let todayDayIndex = -1;
                        let currentDayIndex = 0;
                        
                        for (const week of calendarStructure.weeks) {
                          for (const day of week.days) {
                            if (day.date.getTime() === todayStart.getTime()) {
                              todayDayIndex = currentDayIndex;
                              break;
                            }
                            currentDayIndex++;
                          }
                          if (todayDayIndex !== -1) break;
                        }
                        
                        if (todayDayIndex !== -1) {
                          const dayWidth = timelineWidth / calendarStructure.totalDays;
                          const todayPosition = todayDayIndex * dayWidth + (dayWidth / 2) - 1; // -1px para centrar mejor
                          
                          return (
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent)] z-10"
                              style={{ left: `${todayPosition}px` }}
                              title={`Hoy: ${todayStart.toLocaleDateString()}`}
                            />
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Barra de tarea */}
                    <div className="absolute inset-0 flex items-center px-1">
                      <GanttTimelineBar 
                        item={item}
                        timelineStart={timelineStart}
                        timelineEnd={timelineEnd}
                        timelineWidth={timelineWidth}
                        totalDays={calendarStructure.totalDays}
                        onConnectionDrag={handleConnectionDrag}
                        dragConnectionData={dragConnectionData}
                        onTaskUpdate={() => {
                          // Actualización inmediata sin delay
                          setDropRefreshTrigger(prev => prev + 1);
                        }}
                        onDragUpdate={refreshArrows}
                        allTasks={allTasks}
                        dependencies={dependencies}
                        projectId={projectId}
                      />
                    </div>


                  </div>
                )}
              </div>
            ))}
            
            {/* Filas vacías adicionales para más espacio */}
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`empty-timeline-${index}`} className="border-b border-[var(--table-row-border)] h-11 flex items-center bg-[var(--table-row-bg)]">
                <div 
                  className="relative h-full w-full"
                  style={{ width: timelineWidth }}
                >
                  {/* Grilla de semanas SIN LÍNEAS VERTICALES */}
                  <div className="absolute inset-0 flex">
                    {calendarStructure.weeks.map((week) => (
                      <div 
                        key={`empty-${index}-${week.key}`}
                        className="h-full"
                        style={{ width: weekWidth }}
                      />
                    ))}
                  </div>
                  
                  {/* Línea del día de hoy en filas vacías */}
                  {(() => {
                    const today = new Date();
                    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    
                    // Buscar el día exacto en la estructura del calendario
                    let todayDayIndex = -1;
                    let currentDayIndex = 0;
                    
                    for (const week of calendarStructure.weeks) {
                      for (const day of week.days) {
                        if (day.date.getTime() === todayStart.getTime()) {
                          todayDayIndex = currentDayIndex;
                          break;
                        }
                        currentDayIndex++;
                      }
                      if (todayDayIndex !== -1) break;
                    }
                    
                    if (todayDayIndex !== -1) {
                      const dayWidth = timelineWidth / calendarStructure.totalDays;
                      const todayPosition = todayDayIndex * dayWidth + (dayWidth / 2) - 1; // -1px para centrar mejor
                      
                      return (
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent)] z-10"
                          style={{ left: `${todayPosition}px` }}
                        />
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ))}
          </div>
          
          {/* Dependencias overlay vectoriales profesionales estilo DHTMLX */}
          <GanttDependencies
            key={`dependencies-${dropRefreshTrigger}`}
            data={filteredData}
            dependencies={dependencies}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            timelineWidth={timelineWidth}
            totalDays={calendarStructure.totalDays}
            containerRef={timelineRef}
            leftPanelWidth={leftPanelWidth}
            refreshTrigger={refreshTrigger}
            onDependencyClick={handleDependencyClick}
          />
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="w-1 bg-[var(--accent)] cursor-col-resize hover:bg-[var(--accent)]/80 transition-colors flex-shrink-0"
        onMouseDown={handleMouseDown}
      />
      
      {/* LÍNEA PUNTEADA TEMPORAL DURANTE CONEXIÓN */}
      {connectionLineData && (
        <svg
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 9999 }}
          width="100vw"
          height="100vh"
        >
          <defs>
            <marker
              id="central-connection-arrow"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon
                points="0,0 0,6 8,3"
                fill="var(--accent)"
                stroke="white"
                strokeWidth="0.5"
              />
            </marker>
          </defs>
          <line
            x1={connectionLineData.startX}
            y1={connectionLineData.startY}
            x2={connectionLineData.mouseX}
            y2={connectionLineData.mouseY}
            stroke="var(--accent)"
            strokeWidth="2"
            strokeDasharray="8,4"
            markerEnd="url(#central-connection-arrow)"
            opacity="0.8"
          />
        </svg>
      )}
    </div>
  );
}