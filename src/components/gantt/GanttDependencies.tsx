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

  // Generar path SVG exactamente como DHTMLX con líneas rectas y esquinas de 90 grados
  const generateDHTMLXArrowPath = (fromX: number, fromY: number, toX: number, toY: number) => {
    // Configuración DHTMLX exacta
    const HORIZONTAL_OFFSET = 15; // Distancia horizontal desde el borde de la tarea
    
    // Puntos de conexión DHTMLX
    const x1 = fromX; // Borde derecho de tarea predecesora
    const y1 = fromY; // Centro vertical de tarea predecesora
    const x4 = toX;   // Borde izquierdo de tarea sucesora  
    const y4 = toY;   // Centro vertical de tarea sucesora
    
    // Si las tareas están en la misma fila
    if (Math.abs(y1 - y4) < 3) {
      // Línea horizontal directa
      return `M ${x1} ${y1} L ${x4} ${y4}`;
    }
    
    // Para tareas en diferentes filas: escalón con ángulos de 90 grados
    const x2 = x1 + HORIZONTAL_OFFSET;     // Primera esquina horizontal
    const x3 = x4 - HORIZONTAL_OFFSET;     // Segunda esquina horizontal
    const y2 = y1;                         // Misma altura que origen
    const y3 = y4;                         // Misma altura que destino
    
    // Path DHTMLX: horizontal → vertical → horizontal → punta
    return `M ${x1} ${y1} 
            L ${x2} ${y2} 
            L ${x2} ${y3} 
            L ${x3} ${y3} 
            L ${x4} ${y4}`;
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
              d={generateDHTMLXArrowPath(path.fromX, path.fromY, path.toX, path.toY)}
              stroke="white"
              strokeWidth="3"
              fill="none"
              opacity="1"
            />
            
            {/* Línea principal DHTMLX - vectorial limpia */}
            <path
              d={generateDHTMLXArrowPath(path.fromX, path.fromY, path.toX, path.toY)}
              stroke="#4285f4"
              strokeWidth="2" 
              fill="none"
              markerEnd="url(#dhtmlx-arrow)"
              opacity="1"
            />
            
            {/* Círculo de conexión pequeño */}
            <circle
              cx={path.fromX}
              cy={path.fromY}
              r="2"
              fill="#4285f4"
              stroke="white"
              strokeWidth="1"
            />
          </g>
        ))}
        
        {/* Definiciones DHTMLX exactas */}
        <defs>
          {/* Flecha DHTMLX vectorial limpia */}
          <marker
            id="dhtmlx-arrow"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L8,3 z"
              fill="#4285f4"
              stroke="none"
            />
          </marker>
        </defs>
      </svg>
    </div>
  );
}