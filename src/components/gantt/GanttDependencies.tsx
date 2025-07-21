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
      
      const dayWidth = timelineWidth / totalDays;
      const timelineStartTime = timelineStart.getTime();
      
      // Calcular posición X de fin de la tarea predecesora (borde derecho)
      const fromEndDate = fromTaskData.endDate ? new Date(fromTaskData.endDate) : new Date(fromTaskData.startDate);
      const fromDayIndex = Math.floor((fromEndDate.getTime() - timelineStartTime) / (1000 * 60 * 60 * 24));
      const fromX = (fromDayIndex * dayWidth) + dayWidth; // Final de la barra + ancho completo del día
      
      // Calcular posición X de inicio de la tarea sucesora (borde izquierdo)  
      const startDate = new Date(toTaskData.startDate);
      const toDayIndex = Math.floor((startDate.getTime() - timelineStartTime) / (1000 * 60 * 60 * 24));
      const toX = toDayIndex * dayWidth; // Inicio exacto de la barra
      
      // Posiciones Y (centro de las filas + offset del header)
      const rowHeight = 44; // h-11 = 44px
      const headerHeight = 100; // Altura del header del timeline
      const fromY = headerHeight + (fromTask.rowIndex * rowHeight) + (rowHeight / 2);
      const toY = headerHeight + (toTask.rowIndex * rowHeight) + (rowHeight / 2);
      
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

  // Sistema vectorial profesional de flechas estilo MS Project/DHTMLX optimizado
  const generateProfessionalArrowPath = (fromX: number, fromY: number, toX: number, toY: number, type: string = 'finish-to-start') => {
    const horizontalDistance = toX - fromX;
    const verticalDistance = Math.abs(toY - fromY);
    const ARROW_OFFSET = 20; // Distancia desde bordes de tareas
    
    // Algoritmo vectorial para múltiples conexiones como en la imagen de referencia
    if (type === 'finish-to-start') {
      // Si las tareas están muy cerca horizontalmente, usar curvas suaves
      if (horizontalDistance < 40 && verticalDistance < 30) {
        const cp1X = fromX + Math.max(25, horizontalDistance * 0.7);
        const cp1Y = fromY;
        const cp2X = toX - Math.max(25, horizontalDistance * 0.7);
        const cp2Y = toY;
        return `M${fromX},${fromY} C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${toX},${toY}`;
      }
      
      // Para conexiones largas: sistema escalonado como DHTMLX pero con esquinas redondeadas
      const midX = fromX + ARROW_OFFSET + (horizontalDistance - 2 * ARROW_OFFSET) / 2;
      
      if (Math.abs(fromY - toY) < 5) {
        // Línea directa para misma fila
        return `M${fromX},${fromY} L${toX},${toY}`;
      } else {
        // Conexión escalonada profesional con micro-curvas en esquinas
        const stepX1 = fromX + ARROW_OFFSET;
        const stepX2 = toX - ARROW_OFFSET;
        
        return `M${fromX},${fromY} 
                L${stepX1},${fromY} 
                Q${stepX1 + 3},${fromY} ${stepX1 + 3},${fromY + (toY > fromY ? 3 : -3)}
                L${stepX1 + 3},${toY - (toY > fromY ? 3 : -3)}
                Q${stepX1 + 3},${toY} ${stepX2},${toY}
                L${toX},${toY}`;
      }
    }
    
    // Otros tipos de dependencia con paths especializados
    const cp1X = fromX + Math.max(30, Math.abs(horizontalDistance) * 0.5);
    const cp1Y = fromY;
    const cp2X = toX - Math.max(30, Math.abs(horizontalDistance) * 0.5);  
    const cp2Y = toY;
    
    return `M${fromX},${fromY} C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${toX},${toY}`;
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

  console.log('Dependencies rendering:', dependencies.length, 'paths:', dependencyPaths.length);
  console.log('Dependency data:', dependencies);
  console.log('Data items:', data.map(d => ({ id: d.id, type: d.type, taskDataId: d.taskData?.id })));
  console.log('Task map keys:', Array.from(taskMap.keys()));
  console.log('Looking for dependency IDs:', dependencies.map(d => ({ pred: d.predecessor_task_id, succ: d.successor_task_id })));
  console.log('Dependency paths details:', dependencyPaths.map(p => p ? { id: p.id, fromX: p.fromX, fromY: p.fromY, toX: p.toX, toY: p.toY } : null));
  
  // SIEMPRE mostrar SVG de debug para verificar posición
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ 
          position: 'absolute',
          top: 0,
          left: `${320}px`, // Offset por el panel izquierdo
          width: `calc(100% - 320px)`,
          height: '100%'
        }}
        viewBox={`0 0 ${timelineWidth} 500`}
        preserveAspectRatio="none"
      >
        {/* Líneas de dependencia exactamente como DHTMLX */}
        {dependencyPaths.map((path) => path && (
          <g key={path.id} className="dhtmlx-dependency">
            {/* Línea de fondo blanca para contraste */}
            <path
              d={generateProfessionalArrowPath(path.fromX, path.fromY, path.toX, path.toY, path.type)}
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="1"
            />
            
            {/* Línea principal profesional - vectorial optimizada */}
            <path
              d={generateProfessionalArrowPath(path.fromX, path.fromY, path.toX, path.toY, path.type)}
              stroke="#2563EB"
              strokeWidth="2.5" 
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd="url(#arrowhead-professional)"
              opacity="0.9"
            />
            
            {/* Círculo de conexión pequeño */}
            <circle
              cx={path.fromX}
              cy={path.fromY}
              r="2.5"
              fill="#2563EB"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="1.5"
            />
            <circle
              cx={path.toX}
              cy={path.toY}
              r="1.5"
              fill="#10B981"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="1"
            />
          </g>
        ))}
        
        {/* Definiciones DHTMLX exactas */}
        <defs>
          {/* Flecha DHTMLX vectorial limpia */}
          <marker
            id="arrowhead-professional"
            markerWidth="12"
            markerHeight="8" 
            refX="11"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0 0, 12 4, 0 8, 2 4"
              fill="#2563EB"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="0.8"
            />
          </marker>
        </defs>
      </svg>
    </div>
  );
}