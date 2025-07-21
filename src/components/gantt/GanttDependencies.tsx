import { useMemo, useRef, useEffect } from 'react';
import { GanttRowProps } from './types';

interface GanttDependenciesProps {
  data: GanttRowProps[];
  dependencies: Array<{
    id: string;
    predecessor_task_id: string;
    successor_task_id: string;
    type: string;
  }>;
  timelineStart: Date;
  timelineEnd: Date;
  timelineWidth: number;
  totalDays: number;
  dragConnectionData?: {
    fromTaskId: string;
    fromPoint: 'start' | 'end';
  } | null;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function GanttDependencies({
  data,
  dependencies,
  timelineStart,
  timelineEnd,
  timelineWidth,
  totalDays,
  dragConnectionData,
  containerRef
}: GanttDependenciesProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Crear un mapa de tareas para fácil lookup
  const taskMap = useMemo(() => {
    const map = new Map<string, { item: GanttRowProps; rowIndex: number }>();
    let rowIndex = 0;
    
    data.forEach((item) => {
      if (item.type === 'task' && item.taskData?.id) {
        map.set(item.taskData.id, { item, rowIndex });
      }
      rowIndex++;
    });
    
    return map;
  }, [data]);

  // Calcular posiciones de las flechas de dependencias
  const dependencyPaths = useMemo(() => {
    return dependencies.map(dep => {
      const fromTask = taskMap.get(dep.predecessor_task_id);
      const toTask = taskMap.get(dep.successor_task_id);
      
      if (!fromTask || !toTask) return null;
      
      // Calcular posiciones X basadas en fechas
      const fromTaskData = fromTask.item;
      const toTaskData = toTask.item;
      
      if (!fromTaskData.startDate || !toTaskData.startDate) return null;
      
      const dayWidth = timelineWidth / totalDays; // timelineWidth ya viene duplicado
      const timelineStartTime = timelineStart.getTime();
      
      // Posición de fin de la tarea predecesora
      const fromEndDate = fromTaskData.endDate ? new Date(fromTaskData.endDate) : new Date(fromTaskData.startDate);
      const fromDayIndex = Math.floor((fromEndDate.getTime() - timelineStartTime) / (1000 * 60 * 60 * 24));
      const fromX = fromDayIndex * dayWidth + dayWidth; // Fin de la barra
      
      // Posición de inicio de la tarea sucesora
      const startDate = new Date(toTaskData.startDate);
      const toDayIndex = Math.floor((startDate.getTime() - timelineStartTime) / (1000 * 60 * 60 * 24));
      const toX = toDayIndex * dayWidth; // Inicio de la barra
      
      // Posiciones Y (centro de las filas)
      const rowHeight = 44; // h-11 = 44px
      const fromY = fromTask.rowIndex * rowHeight + rowHeight / 2;
      const toY = toTask.rowIndex * rowHeight + rowHeight / 2;
      
      return {
        id: dep.id,
        fromX,
        fromY,
        toX,
        toY,
        type: dep.type
      };
    }).filter(Boolean);
  }, [dependencies, taskMap, timelineWidth, totalDays, timelineStart]);

  // Generar path SVG para flechas
  const generateArrowPath = (fromX: number, fromY: number, toX: number, toY: number) => {
    // Crear línea con curva suave estilo DHTMLX
    const midX = fromX + (toX - fromX) * 0.5;
    const controlY = fromY === toY ? fromY : fromY + (toY - fromY) * 0.3;
    
    return `M ${fromX} ${fromY} Q ${midX} ${controlY} ${toX} ${toY}`;
  };

  // Línea punteada durante drag
  const dragLine = useMemo(() => {
    if (!dragConnectionData || !containerRef.current) return null;
    
    const fromTask = taskMap.get(dragConnectionData.fromTaskId);
    if (!fromTask) return null;
    
    // Obtener posición del mouse desde el evento (necesitaríamos pasar mousePos)
    // Por ahora, usar una línea simple desde el punto de conexión
    const rowHeight = 44;
    const fromY = fromTask.rowIndex * rowHeight + rowHeight / 2;
    
    return {
      fromX: 100, // Placeholder - necesitaríamos posición real
      fromY,
      toX: 200, // Placeholder - posición del mouse
      toY: fromY
    };
  }, [dragConnectionData, taskMap, containerRef]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: timelineWidth, height: '100%' }}
      viewBox={`0 0 ${timelineWidth} 1000`}
    >
      <defs>
        {/* Definir marcador de flecha */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="var(--accent)"
            stroke="var(--accent)"
          />
        </marker>
      </defs>

      {/* Flechas de dependencias existentes */}
      {dependencyPaths.map((dep) => dep && (
        <g key={dep.id}>
          <path
            d={generateArrowPath(dep.fromX, dep.fromY, dep.toX, dep.toY)}
            stroke="var(--accent)"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            opacity="0.8"
          />
        </g>
      ))}

      {/* Línea punteada durante drag */}
      {dragLine && (
        <line
          x1={dragLine.fromX}
          y1={dragLine.fromY}
          x2={dragLine.toX}
          y2={dragLine.toY}
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.7"
        />
      )}
    </svg>
  );
}