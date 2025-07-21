import { format, addDays, differenceInDays } from 'date-fns';
import { GanttRowProps, calculateResolvedEndDate } from './types';
import { useState, useRef, useCallback } from 'react';
import { useCreateConstructionDependency } from '@/hooks/use-construction-dependencies';
import { useUpdateConstructionTask } from '@/hooks/use-construction-tasks';
import { toast } from '@/hooks/use-toast';

interface GanttTimelineBarProps {
  item: GanttRowProps;
  timelineStart: Date;
  timelineEnd: Date;
  timelineWidth: number;
  totalDays: number; // Add this to sync with calendar
  onConnectionDrag?: (dragData: {
    fromTaskId: string;
    fromPoint: 'start' | 'end';
  } | null) => void;
  dragConnectionData?: {
    fromTaskId: string;
    fromPoint: 'start' | 'end';
  } | null;
  onTaskUpdate?: () => void; // Callback para refrescar después de actualizar
}

export function GanttTimelineBar({ 
  item, 
  timelineStart, 
  timelineEnd, 
  timelineWidth,
  totalDays,
  onConnectionDrag,
  dragConnectionData,
  onTaskUpdate
}: GanttTimelineBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<'start' | 'end' | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const createDependency = useCreateConstructionDependency();
  const updateTask = useUpdateConstructionTask();
  // Calculate resolved end date using the utility function
  const dateRange = calculateResolvedEndDate(item);

  // Validate dates - no mostrar barra si no hay fechas válidas
  if (!dateRange.isValid) {
    return null;
  }

  const { startDate, resolvedEndDate } = dateRange;

  // Normalize dates to avoid timezone issues - set to start of day
  const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const normalizedEnd = new Date(resolvedEndDate.getFullYear(), resolvedEndDate.getMonth(), resolvedEndDate.getDate());
  const normalizedTimelineStart = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), timelineStart.getDate());
  const normalizedTimelineEnd = new Date(timelineEnd.getFullYear(), timelineEnd.getMonth(), timelineEnd.getDate());

  // Calculate total timeline span in milliseconds
  const totalSpan = normalizedTimelineEnd.getTime() - normalizedTimelineStart.getTime();
  
  if (totalSpan <= 0) {
    return null;
  }

  // Calculate task position using day-based approach to match calendar
  const dayStartFromTimeline = Math.floor((normalizedStart.getTime() - normalizedTimelineStart.getTime()) / (24 * 60 * 60 * 1000));
  const dayEndFromTimeline = Math.floor((normalizedEnd.getTime() - normalizedTimelineStart.getTime()) / (24 * 60 * 60 * 1000));
  
  const dayWidth = timelineWidth / totalDays;
  
  // CORREGIDO: Cálculo de duración real
  // Si la tarea tiene duration_in_days, usar ese valor para el ancho de la barra
  let calculatedDuration = dayEndFromTimeline - dayStartFromTimeline + 1;
  
  if (item.taskData?.duration_in_days && item.taskData.duration_in_days > 0) {
    calculatedDuration = item.taskData.duration_in_days;
  }
  
  const startPixels = dayStartFromTimeline * dayWidth;
  const widthPixels = calculatedDuration * dayWidth;
  
  // Clean up debug logs - alignment is now working perfectly
  // console.log('BAR ALIGNED:', item.name.substring(0, 20), startPixels);



  if (widthPixels <= 0) {
    return null;
  }

  // Diferentes estilos según el tipo de elemento - BARRAS MÁS ALTAS
  const getBarStyle = () => {
    switch (item.type) {
      case 'phase':
        return "h-7 border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/30 rounded-md shadow-sm flex items-center justify-center text-xs text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors cursor-pointer";
      case 'task':
        return "h-7 border-2 border-[var(--table-row-fg)] bg-transparent rounded-sm shadow-sm text-xs text-[var(--table-row-fg)] font-medium hover:bg-muted/10 transition-colors cursor-pointer relative overflow-hidden";
      default:
        return "h-7 border-2 border-gray-400 bg-gray-100 dark:bg-gray-800 rounded-sm shadow-sm flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer";
    }
  };

  // Obtener porcentaje de progreso para barras de tarea
  const getProgressPercent = () => {
    if (item.type !== 'task' || !item.taskData) return 0;
    return item.taskData.progress_percent || 0;
  };

  // Handlers para drag & drop de conexiones
  const handleConnectionStart = (e: React.MouseEvent, point: 'start' | 'end') => {
    if (item.type !== 'task' || !item.taskData?.id) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    // Notificar al componente padre sobre el inicio del drag
    onConnectionDrag?.({
      fromTaskId: item.taskData.id,
      fromPoint: point
    });
    
    console.log('Starting connection from:', item.name, point);
  };

  const handleConnectionEnd = (e: React.MouseEvent) => {
    if (!dragConnectionData || item.type !== 'task' || !item.taskData?.id) return;
    
    e.stopPropagation();
    
    const fromTaskId = dragConnectionData.fromTaskId;
    const toTaskId = item.taskData.id;
    
    // Evitar conectar una tarea consigo misma
    if (fromTaskId === toTaskId) {
      onConnectionDrag?.(null);
      return;
    }
    
    // Determinar el tipo de dependencia basado en los puntos de conexión
    let dependencyType = 'finish-to-start'; // Por defecto
    if (dragConnectionData.fromPoint === 'end') {
      dependencyType = 'finish-to-start'; // Más común: termina A -> empieza B
    } else if (dragConnectionData.fromPoint === 'start') {
      dependencyType = 'start-to-start'; // Empiezan al mismo tiempo
    }
    
    // Crear la dependencia
    createDependency.mutate({
      predecessor_task_id: fromTaskId,
      successor_task_id: toTaskId,
      type: dependencyType,
      lag_days: 0
    });
    
    // Limpiar el estado de drag
    onConnectionDrag?.(null);
    
    console.log('Created dependency:', fromTaskId, '->', toTaskId, 'type:', dependencyType);
  };

  // Solo mostrar puntos de conexión en tareas (no fases) y cuando hay hover
  const shouldShowConnectionPoints = item.type === 'task' && isHovered;
  
  // Mostrar indicador visual cuando esta tarea puede recibir una conexión
  const canReceiveConnection = dragConnectionData && item.type === 'task' && 
                              item.taskData?.id !== dragConnectionData.fromTaskId;
  
  // Estilos adicionales cuando se está arrastrando una conexión o redimensionando
  const dragStyles = canReceiveConnection ? 'ring-2 ring-blue-400 ring-opacity-50' : '';
  const resizeStyles = isResizing ? 'ring-2 ring-orange-400 ring-opacity-70 shadow-lg' : '';

  // Funciones para drag & drop de redimensionamiento
  const calculateDayFromX = useCallback((clientX: number) => {
    if (!barRef.current) return 0;
    
    const containerRect = barRef.current.parentElement?.getBoundingClientRect();
    if (!containerRect) return 0;
    
    const relativeX = clientX - containerRect.left;
    const dayWidth = timelineWidth / totalDays;
    return Math.round(relativeX / dayWidth);
  }, [timelineWidth, totalDays]);

  const handleResizeStart = useCallback((e: React.MouseEvent, type: 'start' | 'end') => {
    if (item.type !== 'task' || !item.taskData?.id) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizeType(type);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!item.taskData) return;
      
      const newDay = calculateDayFromX(e.clientX);
      const dayWidth = timelineWidth / totalDays;
      
      // Calcular nueva fecha basada en la posición del mouse
      const newDate = addDays(timelineStart, newDay);
      
      // Mostrar feedback visual temporal (opcional)
      if (barRef.current) {
        const currentStartDay = Math.floor((normalizedStart.getTime() - normalizedTimelineStart.getTime()) / (24 * 60 * 60 * 1000));
        const currentEndDay = Math.floor((normalizedEnd.getTime() - normalizedTimelineStart.getTime()) / (24 * 60 * 60 * 1000));
        
        if (type === 'start') {
          const newWidth = (currentEndDay - newDay + 1) * dayWidth;
          const newLeft = newDay * dayWidth;
          barRef.current.style.width = `${Math.max(dayWidth, newWidth)}px`;
          barRef.current.style.marginLeft = `${newLeft}px`;
        } else {
          const newWidth = (newDay - currentStartDay + 1) * dayWidth;
          barRef.current.style.width = `${Math.max(dayWidth, newWidth)}px`;
        }
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!item.taskData) return;
      
      const newDay = calculateDayFromX(e.clientX);
      const newDate = addDays(timelineStart, newDay);
      
      // Actualizar la tarea en la base de datos
      if (type === 'start') {
        const currentEndDate = item.taskData.end_date ? new Date(item.taskData.end_date) : addDays(new Date(item.taskData.start_date!), item.taskData.duration_in_days || 1);
        const newDuration = Math.max(1, differenceInDays(currentEndDate, newDate) + 1);
        
        updateTask.mutate({
          id: item.taskData.id,
          start_date: format(newDate, 'yyyy-MM-dd'),
          duration_in_days: newDuration
        });
      } else {
        const startDate = new Date(item.taskData.start_date!);
        const newDuration = Math.max(1, differenceInDays(newDate, startDate) + 1);
        
        updateTask.mutate({
          id: item.taskData.id,
          end_date: format(newDate, 'yyyy-MM-dd'),
          duration_in_days: newDuration
        });
      }
      
      setIsResizing(false);
      setResizeType(null);
      
      // Refrescar los datos
      onTaskUpdate?.();
      
      // Limpiar eventos
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      toast({
        title: "Tarea actualizada",
        description: `Duración modificada desde el ${type === 'start' ? 'inicio' : 'final'} de la tarea`
      });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [item, timelineStart, timelineWidth, totalDays, calculateDayFromX, updateTask, onTaskUpdate, normalizedStart, normalizedEnd, normalizedTimelineStart]);

  // Solo mostrar controles de redimensionamiento en tareas (no fases) y cuando hay hover
  const shouldShowResizeHandles = item.type === 'task' && isHovered && !isResizing;

  return (
    <div 
      ref={barRef}
      className={`${getBarStyle()} ${dragStyles} ${resizeStyles} relative group`}
      style={{
        width: `${widthPixels}px`,
        marginLeft: `${startPixels}px`
      }}
      title={`${item.name} (${format(startDate, 'dd/MM/yyyy')} - ${format(resolvedEndDate, 'dd/MM/yyyy')})`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseUp={handleConnectionEnd}
    >
      {/* Relleno de progreso para tareas */}
      {item.type === 'task' && getProgressPercent() > 0 && (
        <div 
          className="absolute top-0 left-0 h-full rounded-sm transition-all duration-300"
          style={{ 
            width: `${getProgressPercent()}%`,
            backgroundColor: 'var(--accent)',
            opacity: 0.6
          }}
        />
      )}
      
      {/* Contenido de la barra centrado */}
      <span className="relative z-10 truncate text-[10px]" style={{ padding: '0 2px' }}>
        {format(startDate, 'dd/MM')} - {format(resolvedEndDate, 'dd/MM')}
      </span>
      
      {/* Controles de redimensionamiento que aparecen en hover */}
      {shouldShowResizeHandles && (
        <>
          {/* Handle de redimensionamiento izquierdo */}
          <div
            className="absolute left-0 top-0 w-2 h-full bg-orange-500 opacity-0 group-hover:opacity-80 cursor-ew-resize transition-opacity hover:bg-orange-600 rounded-l z-30"
            onMouseDown={(e) => handleResizeStart(e, 'start')}
            title="Arrastrar para cambiar fecha de inicio"
          />
          
          {/* Handle de redimensionamiento derecho */}
          <div
            className="absolute right-0 top-0 w-2 h-full bg-orange-500 opacity-0 group-hover:opacity-80 cursor-ew-resize transition-opacity hover:bg-orange-600 rounded-r z-30"
            onMouseDown={(e) => handleResizeStart(e, 'end')}
            title="Arrastrar para cambiar fecha final"
          />
        </>
      )}
      
      {/* Puntos de conexión que aparecen en hover - MÁS PROMINENTES Y FUERA DE LA BARRA */}
      {shouldShowConnectionPoints && !isResizing && (
        <>
          {/* Punto izquierdo (inicio de tarea) - MÁS FUERA DE LA BARRA */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-blue-600 hover:scale-110 z-20"
            onMouseDown={(e) => handleConnectionStart(e, 'start')}
            title="Conectar desde el inicio de esta tarea"
          />
          
          {/* Punto derecho (final de tarea) - MÁS FUERA DE LA BARRA */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-green-600 hover:scale-110 z-20"
            onMouseDown={(e) => handleConnectionStart(e, 'end')}
            title="Conectar desde el final de esta tarea"
          />
        </>
      )}
    </div>
  );
}