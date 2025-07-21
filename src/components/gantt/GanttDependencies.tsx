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
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255,0,0,0.1)' // Fondo rojo visible para debug
        }}
        viewBox={`0 0 ${Math.max(timelineWidth, 4000)} 500`}
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
        
        {/* Línea de prueba en las coordenadas reales de dependencia */}
        {dependencyPaths.length > 0 && dependencyPaths[0] && (
          <g>
            <line
              x1={dependencyPaths[0].fromX}
              y1={dependencyPaths[0].fromY}
              x2={dependencyPaths[0].toX}
              y2={dependencyPaths[0].toY}
              stroke="#00ff00"
              strokeWidth="4"
              opacity="1"
            />
            <text x={dependencyPaths[0].fromX} y={dependencyPaths[0].fromY - 10} fill="#00ff00" fontSize="10">
              FROM: {Math.round(dependencyPaths[0].fromX)}, {Math.round(dependencyPaths[0].fromY)}
            </text>
            <text x={dependencyPaths[0].toX} y={dependencyPaths[0].toY - 10} fill="#00ff00" fontSize="10">
              TO: {Math.round(dependencyPaths[0].toX)}, {Math.round(dependencyPaths[0].toY)}
            </text>
          </g>
        )}
        
        {/* Renderizar dependencias reales */}
        {dependencyPaths.map((path) => path && (
          <g key={path.id}>
            {/* Línea principal de dependencia */}
            <path
              d={generateArrowPath(path.fromX, path.fromY, path.toX, path.toY)}
              stroke="#84cc16"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
            
            {/* Círculo en el punto de inicio */}
            <circle
              cx={path.fromX}
              cy={path.fromY}
              r="3"
              fill="#84cc16"
            />
          </g>
        ))}
        
        {/* Definir marcador de flecha */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#84cc16"
            />
          </marker>
        </defs>
      </svg>
    </div>
  );
}