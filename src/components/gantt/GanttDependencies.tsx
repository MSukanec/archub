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

  // Generar path SVG estilo DHTMLX con líneas rectas y esquinas
  const generateDHtmlxArrowPath = (fromX: number, fromY: number, toX: number, toY: number) => {
    // Estilo DHTMLX: línea horizontal desde la tarea, luego vertical, luego horizontal hacia destino
    const horizontalOffset = 10; // Distancia horizontal desde la tarea
    const midX = fromX + horizontalOffset;
    
    // Si las tareas están en la misma altura
    if (Math.abs(fromY - toY) < 5) {
      return `M ${fromX} ${fromY} L ${midX} ${fromY} L ${toX - horizontalOffset} ${toY} L ${toX} ${toY}`;
    }
    
    // Si las tareas están en diferentes alturas
    const verticalMidY = fromY + (toY - fromY) / 2;
    return `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${verticalMidY} L ${toX - horizontalOffset} ${verticalMidY} L ${toX - horizontalOffset} ${toY} L ${toX} ${toY}`;
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
        {/* Línea de prueba SIEMPRE visible */}
        <line
          x1="50"
          y1="20"
          x2="250"
          y2="60"
          stroke="#ff0000"
          strokeWidth="3"
          opacity="0.8"
        />
        <text x="100" y="45" fill="#ff0000" fontSize="12" fontWeight="bold">DEPS: {dependencies.length}</text>
        
        {/* Flechas de dependencia estilo DHTMLX profesional */}
        {dependencyPaths.map((path) => path && (
          <g key={path.id}>
            {/* Línea principal estilo DHTMLX con múltiples segmentos */}
            <path
              d={generateDHtmlxArrowPath(path.fromX, path.fromY, path.toX, path.toY)}
              stroke="#2563eb"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#dhtmlx-arrowhead)"
              opacity="0.8"
            />
            
            {/* Círculo pequeño en el punto de conexión de salida */}
            <circle
              cx={path.fromX}
              cy={path.fromY}
              r="2"
              fill="#2563eb"
              stroke="white"
              strokeWidth="1"
            />
          </g>
        ))}
        
        {/* Marcador de flecha estilo DHTMLX */}
        <defs>
          <marker
            id="dhtmlx-arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L8,3 z"
              fill="#2563eb"
              stroke="none"
            />
          </marker>
        </defs>
      </svg>
    </div>
  );
}