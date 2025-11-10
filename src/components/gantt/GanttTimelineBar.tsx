import { format, addDays, differenceInDays } from 'date-fns';
import { GanttRowProps, calculateResolvedEndDate } from './types';
import { useState, useRef, useCallback, useMemo } from 'react';
import { useCreateConstructionDependency, useConstructionDependencies, ConstructionDependencyWithTasks } from '@/hooks/use-construction-dependencies';
import { useUpdateConstructionTaskResize, useUpdateConstructionTaskDrag, ConstructionTask } from '@/hooks/use-construction-tasks';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { propagateDependencyChanges, applyOptimisticPropagation } from '@/utils/dependencyPropagation';

interface GanttTimelineBarProps {
  item: GanttRowProps;
  timelineStart: Date;
  timelineEnd: Date;
  timelineWidth: number;
  totalDays: number; // Add this to sync with calendar
  onConnectionDrag?: (dragData: {
    fromTaskId: string;
    fromPoint: 'start' | 'end';
  } | null, initialPosition?: { x: number; y: number }) => void;
  dragConnectionData?: {
    fromTaskId: string;
    fromPoint: 'start' | 'end';
  } | null;
  onTaskUpdate?: () => void; // Callback para refrescar después de actualizar
  onDragUpdate?: () => void; // Callback para actualizar flechas durante drag
  // Props necesarias para propagación de dependencias
  allTasks?: ConstructionTask[];
  dependencies?: ConstructionDependencyWithTasks[];
  projectId?: string;
}

export function GanttTimelineBar({ 
  item, 
  timelineStart, 
  timelineEnd, 
  timelineWidth,
  totalDays,
  onConnectionDrag,
  dragConnectionData,
  onTaskUpdate,
  onDragUpdate,
  allTasks,
  dependencies = [],
  projectId
}: GanttTimelineBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<'start' | 'end' | null>(null);
  const [isDraggingBar, setIsDraggingBar] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Estados para línea de conexión temporal
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{x: number, y: number, type: 'start' | 'end'} | null>(null);
  const [mousePosition, setMousePosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  const barRef = useRef<HTMLDivElement>(null);
  const createDependency = useCreateConstructionDependency();
  const updateTaskResize = useUpdateConstructionTaskResize();
  const updateTaskDrag = useUpdateConstructionTaskDrag();
  const queryClient = useQueryClient();
  
  // Hook para obtener dependencias para propagación si no se pasan por props
  const { data: hookDependencies = [] } = useConstructionDependencies(projectId || '');
  const allDependencies = dependencies.length > 0 ? dependencies : hookDependencies;
  
  // Throttled callback para optimizar actualizaciones de flechas
  const throttledDragUpdate = useMemo(() => {
    if (!onDragUpdate) return null;
    
    let lastCall = 0;
    const throttleMs = 16; // ~60fps
    
    return () => {
      const now = Date.now();
      if (now - lastCall >= throttleMs) {
        lastCall = now;
        onDragUpdate();
      }
    };
  }, [onDragUpdate]);

  // Throttled callback para optimizar propagación de dependencias en tiempo real
  const throttledPropagation = useMemo(() => {
    let lastCall = 0;
    const throttleMs = 16; // 60fps para propagación suave - igual que las flechas
    
    return (taskId: string, newEndDate: string, allTasks: ConstructionTask[], dependencies: any[]) => {
      const now = Date.now();
      if (now - lastCall >= throttleMs) {
        lastCall = now;
        
        const propagationUpdates = propagateDependencyChanges(taskId, newEndDate, allTasks, dependencies);
        
        if (propagationUpdates.length > 0) {
          queryClient.setQueryData(['construction-tasks', item.taskData?.project_id, item.taskData?.organization_id], (oldData: ConstructionTask[] | undefined) => {
            if (!oldData) return oldData;
            return applyOptimisticPropagation(oldData, propagationUpdates) || oldData;
          });
        }
      }
    };
  }, [queryClient, item.taskData?.project_id, item.taskData?.organization_id]);
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

  // Handlers para drag & drop de conexiones con línea temporal
  const handleConnectionStart = (e: React.MouseEvent, point: 'start' | 'end') => {
    if (item.type !== 'task' || !item.taskData?.id) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    // Debug logs removed
    
    // Obtener posición del punto de conexión
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const connectionX = point === 'start' ? rect.left - 30 : rect.right + 30;
    const connectionY = rect.top + rect.height / 2;
    
    // Establecer estado de conexión local
    setIsConnecting(true);
    setConnectionStart({
      x: connectionX,
      y: connectionY,
      type: point
    });
    setMousePosition({ x: e.clientX, y: e.clientY });
    
    // Notificar al componente padre sobre el inicio del drag con posición inicial
    onConnectionDrag?.({
      fromTaskId: item.taskData.id,
      fromPoint: point
    }, { x: connectionX, y: connectionY });
    
    // Agregar event listeners para seguir el mouse
    const handleMouseMove = (moveEvent: MouseEvent) => {
      setMousePosition({ x: moveEvent.clientX, y: moveEvent.clientY });
    };
    
    const handleMouseUp = (upEvent: MouseEvent) => {
      // Debug logs removed
      setIsConnecting(false);
      setConnectionStart(null);
      onConnectionDrag?.(null);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleConnectionEnd = (e: React.MouseEvent) => {
    if (!dragConnectionData || item.type !== 'task' || !item.taskData?.id) return;
    
    e.stopPropagation();
    
    const fromTaskId = dragConnectionData.fromTaskId;
    const toTaskId = item.taskData.id;
    
    // Evitar conectar una tarea consigo misma
    if (fromTaskId === toTaskId) {
      // Limpiar TODOS los estados de conexión
      setIsConnecting(false);
      setConnectionStart(null);
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
    
    // Limpiar TODOS los estados de conexión y drag
    setIsConnecting(false);
    setConnectionStart(null);
    onConnectionDrag?.(null);
    
    // Debug logs removed
  };

  // Solo mostrar puntos de conexión en tareas (no fases)
  const shouldShowConnectionPoints = item.type === 'task';
  
  // Mostrar indicador visual cuando esta tarea puede recibir una conexión
  const canReceiveConnection = dragConnectionData && item.type === 'task' && 
                              item.taskData?.id !== dragConnectionData.fromTaskId;
  
  // Estilos adicionales cuando se está arrastrando una conexión, redimensionando o moviendo barra
  const dragStyles = canReceiveConnection ? 'ring-2 ring-blue-400 ring-opacity-50' : '';
  const resizeStyles = isResizing ? 'ring-2 ring-orange-400 ring-opacity-70 shadow-lg' : '';
  const barDragStyles = isDraggingBar ? 'ring-2 ring-green-400 ring-opacity-70 shadow-xl opacity-80 z-50' : '';

  // Funciones para drag & drop de redimensionamiento
  const calculateDayFromX = useCallback((clientX: number) => {
    // Buscar el contenedor específico del timeline por ID
    const timelineContainer = document.getElementById('timeline-content-scroll') as HTMLElement;
    if (!timelineContainer) return 0;
    
    const containerRect = timelineContainer.getBoundingClientRect();
    const scrollLeft = timelineContainer.scrollLeft || 0;
    const relativeX = Math.max(0, clientX - containerRect.left);
    const adjustedX = relativeX + scrollLeft; // CRÍTICO: Ajustar por el scroll horizontal
    const dayWidth = timelineWidth / totalDays;
    return Math.round(adjustedX / dayWidth);
  }, [timelineWidth, totalDays]);

  // Funciones para drag & drop de barras completas
  const handleBarDragStart = useCallback((e: React.MouseEvent) => {
    if (item.type !== 'task' || !item.taskData?.id || isResizing) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    // Calcular offset desde el inicio de la barra para mantener posición relativa del mouse
    const barRect = barRef.current?.getBoundingClientRect();
    if (!barRect) return;
    
    setIsDraggingBar(true);
    setDragOffset(e.clientX - barRect.left);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!barRef.current || !item.taskData) return;
      
      // Calcular nueva posición manteniendo el offset
      const timelineContainer = document.getElementById('timeline-content-scroll') as HTMLElement;
      if (!timelineContainer) return;
      
      const containerRect = timelineContainer.getBoundingClientRect();
      const scrollLeft = timelineContainer.scrollLeft || 0;
      const relativeX = Math.max(0, e.clientX - containerRect.left - dragOffset);
      const adjustedX = relativeX + scrollLeft;
      
      // Calcular nuevo día y fechas para propagación visual
      const dayWidth = timelineWidth / totalDays;
      const newDay = Math.round(adjustedX / dayWidth);
      const newStartDate = addDays(timelineStart, newDay);
      
      // Mantener la duración original
      const originalDuration = item.taskData?.duration_in_days || 
        Math.ceil((resolvedEndDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const newEndDate = addDays(newStartDate, originalDuration - 1);
      
      // PROPAGACIÓN VISUAL SUAVE DE DEPENDENCIAS durante el drag (CSS transforms)
      if (allTasks && allDependencies.length > 0) {
        const propagationUpdates = propagateDependencyChanges(
          item.taskData.id,
          format(newEndDate, 'yyyy-MM-dd'),
          allTasks,
          allDependencies
        );
        
        // Aplicar transformaciones CSS suaves a las tareas dependientes
        propagationUpdates.forEach(update => {
          const dependentBarElement = document.querySelector(`[data-task-id="${update.id}"]`) as HTMLElement;
          if (dependentBarElement && update.id) {
            const dependentTask = allTasks.find(t => t.id === update.id);
            if (dependentTask && dependentTask.start_date) {
              // Calcular offset basado en días de diferencia
              const originalStartDay = Math.floor((new Date(dependentTask.start_date).getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000));
              const newStartDay = Math.floor((new Date(update.start_date).getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000));
              const offsetDays = newStartDay - originalStartDay;
              const dayWidth = timelineWidth / totalDays;
              const offsetPixels = offsetDays * dayWidth;
              
              // Aplicar transformación CSS suave sin snap
              dependentBarElement.style.transform = `translateX(${offsetPixels}px)`;
              dependentBarElement.style.opacity = '0.8';
              dependentBarElement.style.transition = 'none';
            }
          }
        });
      }
      
      // FEEDBACK VISUAL de la tarea principal
      barRef.current.style.transform = `translateX(${adjustedX - startPixels}px)`;
      barRef.current.style.zIndex = '50';
      
      // Actualizar flechas de dependencias durante el drag (throttled)
      throttledDragUpdate?.();
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      setIsDraggingBar(false);
      
      // Limpiar estilos temporales de la tarea principal
      if (barRef.current) {
        barRef.current.style.transform = '';
        barRef.current.style.zIndex = '';
      }
      
      // Limpiar transformaciones CSS de todas las tareas dependientes
      if (allTasks && allDependencies.length > 0) {
        allTasks.forEach(task => {
          const dependentBarElement = document.querySelector(`[data-task-id="${task.id}"]`) as HTMLElement;
          if (dependentBarElement) {
            dependentBarElement.style.transform = '';
            dependentBarElement.style.opacity = '';
            dependentBarElement.style.transition = '';
          }
        });
      }
      
      // Calcular nuevo día y actualizar en base de datos
      const newDay = calculateDayFromX(e.clientX - dragOffset);
      const newStartDate = addDays(timelineStart, newDay);
      
      // Mantener la duración original
      const originalDuration = item.taskData?.duration_in_days || 
        Math.ceil((resolvedEndDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const newEndDate = addDays(newStartDate, originalDuration - 1);
      
      // Propagación real de dependencias para la base de datos
      if (allTasks && allDependencies.length > 0) {
        throttledPropagation(
          item.taskData.id,
          format(newEndDate, 'yyyy-MM-dd'),
          allTasks,
          allDependencies
        );
      }
      
      // Debug logs removed
      
      if (item.taskData?.id) {
        // PROPAGACIÓN DE DEPENDENCIAS: Calcular tareas que deben moverse
        const propagationUpdates = allTasks && dependencies.length > 0 
          ? propagateDependencyChanges(
              item.taskData.id,
              format(newEndDate, 'yyyy-MM-dd'),
              allTasks,
              dependencies
            )
          : [];
        
        // OPTIMISTIC UPDATE: Actualizar caché inmediatamente con tarea principal + propagaciones
        queryClient.setQueryData(['construction-tasks', item.taskData.project_id, item.taskData.organization_id], (oldData: ConstructionTask[] | undefined) => {
          if (!oldData) return oldData;
          
          // Actualizar tarea principal
          let updatedData = oldData.map(task => {
            if (task.id === item.taskData?.id) {
              return {
                ...task,
                start_date: format(newStartDate, 'yyyy-MM-dd'),
                end_date: format(newEndDate, 'yyyy-MM-dd'),
                duration_in_days: originalDuration
              };
            }
            return task;
          });
          
          // Aplicar propagaciones de dependencias
          if (propagationUpdates.length > 0) {
            updatedData = applyOptimisticPropagation(updatedData, propagationUpdates) || updatedData;
          }
          
          return updatedData;
        });
        
        // Actualizar flechas inmediatamente con los nuevos datos
        onTaskUpdate?.();
        
        // Después enviar la actualización a la base de datos en background
        updateTaskDrag.mutateAsync({
          id: item.taskData.id,
          start_date: format(newStartDate, 'yyyy-MM-dd'),
          end_date: format(newEndDate, 'yyyy-MM-dd'),
          duration_in_days: originalDuration
        }).catch((error) => {
          // Debug logs removed
          
          // NO invalidar queries para evitar refresh - mantener cambio optimista
          // El usuario ve el cambio instantáneo, el background sync se intentará de nuevo
          
          toast({
            title: "Guardado en segundo plano",
            description: "El cambio se ve inmediatamente, guardado se completará automáticamente.",
          });
        });
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [item, isResizing, dragOffset, startPixels, calculateDayFromX, timelineStart, startDate, resolvedEndDate, updateTaskResize]);

  const handleResizeStart = useCallback((e: React.MouseEvent, type: 'start' | 'end') => {
    if (item.type !== 'task' || !item.taskData?.id) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizeType(type);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!item.taskData || !barRef.current) return;
      
      // Calcular posición exacta del mouse sin snapping a días
      const containerRect = barRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;
      
      const relativeX = Math.max(0, e.clientX - containerRect.left);
      const dayWidth = timelineWidth / totalDays;
      
      // Calcular días actuales para mantener las proporciones
      const currentStartDay = Math.floor((normalizedStart.getTime() - normalizedTimelineStart.getTime()) / (24 * 60 * 60 * 1000));
      const currentEndDay = Math.floor((normalizedEnd.getTime() - normalizedTimelineStart.getTime()) / (24 * 60 * 60 * 1000));
      
      // Feedback visual suave - seguir el mouse exactamente sin snap
      if (type === 'start') {
        const newLeft = relativeX;
        const newWidth = Math.max(dayWidth, (currentEndDay + 1) * dayWidth - newLeft);
        barRef.current.style.marginLeft = `${newLeft}px`;
        barRef.current.style.width = `${newWidth}px`;
      } else {
        const newWidth = Math.max(dayWidth, relativeX - currentStartDay * dayWidth);
        barRef.current.style.width = `${newWidth}px`;
      }
      
      // Actualizar flechas de dependencias durante el resize (throttled)
      throttledDragUpdate?.();
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!item.taskData) return;
      
      // Resetear estilos ANTES de calcular para obtener coordenadas correctas
      if (barRef.current) {
        barRef.current.style.width = '';
        barRef.current.style.marginLeft = '';
      }
      
      // CORRECCIÓN CRÍTICA: usar el contenedor correcto y ajustar por scroll
      const timelineContainer = document.getElementById('timeline-content-scroll') as HTMLElement;
      if (!timelineContainer) return;
      
      const containerRect = timelineContainer.getBoundingClientRect();
      const scrollLeft = timelineContainer.scrollLeft || 0;
      const adjustedX = e.clientX - containerRect.left + scrollLeft;
      
      const dayWidth = timelineWidth / totalDays;
      const newDay = Math.round(adjustedX / dayWidth);
      const newDate = addDays(timelineStart, newDay);
      
      // Debug logs removed
      
      // OPTIMISTIC UPDATE: Actualizar caché inmediatamente
      if (type === 'start') {
        const currentEndDate = item.taskData.end_date ? new Date(item.taskData.end_date) : addDays(new Date(item.taskData.start_date!), item.taskData.duration_in_days || 1);
        const newDuration = Math.max(1, differenceInDays(currentEndDate, newDate) + 1);
        
        // Update optimista inmediato
        queryClient.setQueryData(['construction-tasks', item.taskData.project_id, item.taskData.organization_id], (oldData: ConstructionTask[] | undefined) => {
          if (!oldData) return oldData;
          
          return oldData.map(task => {
            if (task.id === item.taskData?.id) {
              return {
                ...task,
                start_date: format(newDate, 'yyyy-MM-dd'),
                duration_in_days: newDuration
              };
            }
            return task;
          });
        });
        
        onTaskUpdate?.();
        
        // Usar updateTaskDrag para evitar invalidaciones inmediatas
        updateTaskDrag.mutateAsync({
          id: item.taskData.id,
          start_date: format(newDate, 'yyyy-MM-dd'),
          duration_in_days: newDuration
        }).catch((error) => {
          // Debug logs removed
        });
      } else {
        const startDate = new Date(item.taskData.start_date!);
        const newDuration = Math.max(1, differenceInDays(newDate, startDate) + 1);
        
        // PROPAGACIÓN DE DEPENDENCIAS: Cuando se extiende end_date, propagar a tareas dependientes
        const propagationUpdates = allTasks && allDependencies.length > 0 
          ? propagateDependencyChanges(
              item.taskData.id,
              format(newDate, 'yyyy-MM-dd'),
              allTasks,
              allDependencies
            )
          : [];
        
        // Update optimista inmediato con propagación
        queryClient.setQueryData(['construction-tasks', item.taskData.project_id, item.taskData.organization_id], (oldData: ConstructionTask[] | undefined) => {
          if (!oldData) return oldData;
          
          // Actualizar tarea principal
          let updatedData = oldData.map(task => {
            if (task.id === item.taskData?.id) {
              return {
                ...task,
                end_date: format(newDate, 'yyyy-MM-dd'),
                duration_in_days: newDuration
              };
            }
            return task;
          });
          
          // Aplicar propagaciones de dependencias
          if (propagationUpdates.length > 0) {
            updatedData = applyOptimisticPropagation(updatedData, propagationUpdates) || updatedData;
          }
          
          return updatedData;
        });
        
        onTaskUpdate?.();
        
        // Usar updateTaskDrag para evitar invalidaciones inmediatas  
        updateTaskDrag.mutateAsync({
          id: item.taskData.id,
          end_date: format(newDate, 'yyyy-MM-dd'),
          duration_in_days: newDuration
        }).catch((error) => {
          // Debug logs removed
        });
      }
      
      setIsResizing(false);
      setResizeType(null);
      
      // No necesitamos refrescar manualmente - React Query se actualiza automáticamente
      // onTaskUpdate?.();
      
      // Limpiar eventos
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Sin toast para evitar ruido en UX - el feedback visual es suficiente
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [item, timelineStart, timelineWidth, totalDays, calculateDayFromX, updateTaskResize, onTaskUpdate, normalizedStart, normalizedEnd, normalizedTimelineStart]);

  // Solo mostrar controles de redimensionamiento en tareas (no fases) y cuando hay hover
  const shouldShowResizeHandles = item.type === 'task' && isHovered && !isResizing;

  return (
    <div 
      ref={barRef}
      data-task-id={item.taskData?.id || item.id}
      className={`${getBarStyle()} ${dragStyles} ${resizeStyles} ${barDragStyles} relative group overflow-visible`}
      style={{
        width: `${widthPixels}px`,
        marginLeft: `${startPixels}px`
      }}
      title={`${item.name} (${format(startDate, 'dd/MM/yyyy')} - ${format(resolvedEndDate, 'dd/MM/yyyy')})`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={item.type === 'task' && !isResizing ? handleBarDragStart : undefined}
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
      
      {/* Contenido de la barra con nombre de la tarea */}
      <div 
        className="task-bar-content relative z-10 px-1 h-full flex items-center text-[var(--table-row-fg)]"
        style={{
          fontSize: '9px',
          lineHeight: '10px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textOverflow: 'ellipsis',
          wordBreak: 'break-word',
          hyphens: 'auto'
        }}
      >
        <span className="font-medium">
          {item.name}
        </span>
      </div>
      
      {/* Controles de redimensionamiento que aparecen en hover */}
      {shouldShowResizeHandles && (
        <>
          {/* Handle de redimensionamiento izquierdo - MITAD DE ANCHO y color accent */}
          <div
            className="absolute left-0 top-0 w-1.5 h-full opacity-0 group-hover:opacity-90 cursor-ew-resize transition-opacity rounded-l z-20"
            style={{ backgroundColor: 'var(--accent)' }}
            onMouseDown={(e) => handleResizeStart(e, 'start')}
            title="Arrastrar para cambiar fecha de inicio"
          />
          
          {/* Handle de redimensionamiento derecho - MITAD DE ANCHO y color accent */}
          <div
            className="absolute right-0 top-0 w-1.5 h-full opacity-0 group-hover:opacity-90 cursor-ew-resize transition-opacity rounded-r z-20"
            style={{ backgroundColor: 'var(--accent)' }}
            onMouseDown={(e) => handleResizeStart(e, 'end')}
            title="Arrastrar para cambiar fecha final"
          />
        </>
      )}
      
      {/* PUNTOS DE CONEXIÓN - COMPLETAMENTE AFUERA COMO DHTMLX */}
      {shouldShowConnectionPoints && (
        <>
          {/* Punto izquierdo - SIEMPRE color accent - hover: 1.5x más grande */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white rounded-full cursor-crosshair shadow-lg z-50 opacity-0 group-hover:opacity-100 hover:w-6 hover:h-6 transition-all duration-200"
            style={{ 
              left: '-30px',
              backgroundColor: 'var(--accent)'
            }}
            onMouseDown={(e) => handleConnectionStart(e, 'start')}
            title="Conectar desde inicio"
          />
          
          {/* Punto derecho - SIEMPRE color accent - hover: 1.5x más grande */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white rounded-full cursor-crosshair shadow-lg z-50 opacity-0 group-hover:opacity-100 hover:w-6 hover:h-6 transition-all duration-200"
            style={{ 
              right: '-30px',
              backgroundColor: 'var(--accent)'
            }}
            onMouseDown={(e) => handleConnectionStart(e, 'end')}
            title="Conectar desde final"
          />
        </>
      )}
      

    </div>
  );
}