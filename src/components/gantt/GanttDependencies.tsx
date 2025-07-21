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
      
      // Posición de fin de la tarea predecesora
      const fromEndDate = fromTaskData.endDate ? new Date(fromTaskData.endDate) : new Date(fromTaskData.startDate);
      const fromDayIndex = Math.floor((fromEndDate.getTime() - timelineStartTime) / (1000 * 60 * 60 * 24));
      const fromX = fromDayIndex * dayWidth + dayWidth; // Fin de la barra
      
      // Posición de inicio de la tarea sucesora
      const startDate = new Date(toTaskData.startDate);
      const toDayIndex = Math.floor((startDate.getTime() - timelineStartTime) / (1000 * 60 * 60 * 24));
      const toX = toDayIndex * dayWidth; // Inicio de la barra
      
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

  // Generar path SVG profesional estilo MS Project/DHTMLX
  const generateProfessionalArrowPath = (fromX: number, fromY: number, toX: number, toY: number) => {
    // Configuración profesional
    const CONNECTOR_LENGTH = 20; // Longitud de los conectores horizontales
    const MIN_VERTICAL_SPACE = 8; // Espacio mínimo para curvas verticales
    
    // Puntos de conexión: desde final de tarea origen hasta inicio de tarea destino
    const startX = fromX;
    const endX = toX;
    const startY = fromY;
    const endY = toY;
    
    // Si las tareas están en la misma fila (dependencia horizontal directa)
    if (Math.abs(startY - endY) <= 2) {
      // Línea horizontal directa con pequeña curva suave
      const midX = startX + (endX - startX) * 0.5;
      return `M ${startX} ${startY} 
              Q ${startX + 10} ${startY} ${midX} ${startY}
              Q ${endX - 10} ${endY} ${endX} ${endY}`;
    }
    
    // Para tareas en diferentes filas: línea en forma de escalón con curvas suaves
    const connector1X = startX + CONNECTOR_LENGTH;
    const connector2X = endX - CONNECTOR_LENGTH;
    const midX = connector1X + (connector2X - connector1X) * 0.5;
    const verticalOffset = Math.abs(endY - startY) > MIN_VERTICAL_SPACE ? 0 : MIN_VERTICAL_SPACE;
    
    // Path con curvas bezier suaves en las esquinas
    return `M ${startX} ${startY}
            L ${connector1X - 8} ${startY}
            Q ${connector1X} ${startY} ${connector1X} ${startY + (startY < endY ? 8 : -8)}
            L ${connector1X} ${endY + (startY < endY ? -8 : 8)}
            Q ${connector1X} ${endY} ${connector1X + 8} ${endY}
            L ${connector2X - 8} ${endY}
            Q ${connector2X} ${endY} ${connector2X} ${endY}
            L ${endX} ${endY}`;
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
        {/* Flechas de dependencia profesionales estilo MS Project */}
        {dependencyPaths.map((path) => path && (
          <g key={path.id} className="dependency-arrow">
            {/* Línea de fondo blanca para mejorar visibilidad */}
            <path
              d={generateProfessionalArrowPath(path.fromX, path.fromY, path.toX, path.toY)}
              stroke="white"
              strokeWidth="4"
              fill="none"
              opacity="0.8"
            />
            
            {/* Línea principal profesional */}
            <path
              d={generateProfessionalArrowPath(path.fromX, path.fromY, path.toX, path.toY)}
              stroke="#1e40af"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#professional-arrowhead)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Punto de conexión en el origen */}
            <circle
              cx={path.fromX}
              cy={path.fromY}
              r="3"
              fill="#1e40af"
              stroke="white"
              strokeWidth="1"
              opacity="0.9"
            />
          </g>
        ))}
        
        {/* Definiciones SVG profesionales */}
        <defs>
          {/* Marcador de flecha profesional estilo MS Project */}
          <marker
            id="professional-arrowhead"
            markerWidth="10"
            markerHeight="8"
            refX="9"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            {/* Flecha sólida con borde blanco para mejor visibilidad */}
            <path
              d="M0,0 L0,8 L10,4 z"
              fill="#1e40af"
              stroke="white"
              strokeWidth="0.5"
            />
          </marker>
          
          {/* Gradiente para mejorar la apariencia */}
          <linearGradient id="dependency-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e40af" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="1"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}