import { useMemo, useRef, useEffect, useState } from 'react';
import { GanttRowProps } from './types';

interface GanttDependenciesAdvancedProps {
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
  containerRef: React.RefObject<HTMLDivElement>;
  leftPanelWidth: number;
}

interface DependencyPath {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: string;
  fromTaskId: string;
  toTaskId: string;
}

export function GanttDependenciesAdvanced({
  data,
  dependencies,
  timelineStart,
  timelineEnd,
  timelineWidth,
  totalDays,
  containerRef,
  leftPanelWidth
}: GanttDependenciesAdvancedProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

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
      
      const fromTaskData = fromTask.item;
      const toTaskData = toTask.item;
      
      if (!fromTaskData.startDate || !toTaskData.startDate) return null;
      
      const dayWidth = timelineWidth / totalDays;
      const timelineStartTime = timelineStart.getTime();
      
      // Calcular posición X de fin de la tarea predecesora (borde derecho)
      const fromEndDate = fromTaskData.endDate ? new Date(fromTaskData.endDate) : new Date(fromTaskData.startDate);
      const fromDayIndex = Math.floor((fromEndDate.getTime() - timelineStartTime) / (1000 * 60 * 60 * 24));
      const fromX = (fromDayIndex * dayWidth) + dayWidth;
      
      // Calcular posición X de inicio de la tarea sucesora (borde izquierdo)  
      const startDate = new Date(toTaskData.startDate);
      const toDayIndex = Math.floor((startDate.getTime() - timelineStartTime) / (1000 * 60 * 60 * 24));
      const toX = toDayIndex * dayWidth;
      
      // Posiciones Y (centro de las filas + offset del header)
      const rowHeight = 44;
      const headerHeight = 100;
      const fromY = headerHeight + (fromTask.rowIndex * rowHeight) + (rowHeight / 2);
      const toY = headerHeight + (toTask.rowIndex * rowHeight) + (rowHeight / 2);
      
      return {
        id: dep.id,
        fromX,
        fromY,
        toX,
        toY,
        type: dep.type,
        fromTaskId: dep.predecessor_task_id,
        toTaskId: dep.successor_task_id
      };
    }).filter(Boolean) as DependencyPath[];
  }, [dependencies, taskMap, timelineWidth, totalDays, timelineStart]);

  // Generar path SVG profesional estilo DHTMLX
  const generateDHTMLXPath = (path: DependencyPath): string => {
    const { fromX, fromY, toX, toY } = path;
    const OFFSET = 15; // Offset desde los bordes de las tareas
    
    // Punto de salida: derecha de la tarea origen
    const startX = fromX + OFFSET;
    const startY = fromY;
    
    // Punto de llegada: izquierda de la tarea destino  
    const endX = toX - OFFSET;
    const endY = toY;
    
    // Calcular puntos intermedios para líneas escalonadas
    const midX = startX + (endX - startX) / 2;
    
    if (Math.abs(startY - endY) < 5) {
      // Línea horizontal directa para tareas en la misma fila
      return `M ${fromX} ${fromY} L ${startX} ${startY} L ${endX} ${endY} L ${toX} ${toY}`;
    } else {
      // Línea escalonada para tareas en diferentes filas
      return `M ${fromX} ${fromY} L ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY} L ${toX} ${toY}`;
    }
  };

  // Crear marcador de flecha
  const createArrowMarker = (id: string, color: string) => (
    <defs key={`marker-${id}`}>
      <marker
        id={`arrow-${id}`}
        viewBox="0 0 10 10"
        refX="8"
        refY="3"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L9,3 z" fill={color} stroke={color} strokeWidth="1"/>
      </marker>
    </defs>
  );

  // Agrupar dependencias por punto de origen para múltiples conexiones
  const groupedPaths = useMemo(() => {
    const groups = new Map<string, DependencyPath[]>();
    
    dependencyPaths.forEach(path => {
      const key = `${path.fromTaskId}-${Math.round(path.fromX)}-${Math.round(path.fromY)}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(path);
    });
    
    console.log('GanttDependenciesAdvanced: Processing', dependencyPaths.length, 'dependency paths');
    console.log('GanttDependenciesAdvanced: Grouped into', groups.size, 'groups');
    console.log('GanttDependenciesAdvanced: Groups details:', Array.from(groups.entries()).map(([key, paths]) => ({ key, count: paths.length })));
    
    return groups;
  }, [dependencyPaths]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25 }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ 
          position: 'absolute',
          top: 0,
          left: `${leftPanelWidth}px`,
          width: `calc(100% - ${leftPanelWidth}px)`,
          height: '100%'
        }}
        viewBox={`0 0 ${timelineWidth} 800`}
        preserveAspectRatio="none"
      >
        {/* Definir marcadores de flecha */}
        {createArrowMarker('default', '#6366f1')}
        {createArrowMarker('hover', '#4f46e5')}
        
        {/* Renderizar dependencias agrupadas */}
        {Array.from(groupedPaths.entries()).map(([groupKey, paths]) => (
          <g key={groupKey} className="dependency-group">
            {paths.map((path) => {
              const isHovered = hoveredPath === path.id;
              const strokeColor = isHovered ? '#4f46e5' : '#6366f1';
              const strokeWidth = isHovered ? 3 : 2;
              const markerUrl = `url(#arrow-${isHovered ? 'hover' : 'default'})`;
              
              return (
                <g key={path.id} className="dependency-path">
                  {/* Línea de fondo blanca para contraste */}
                  <path
                    d={generateDHTMLXPath(path)}
                    stroke="white"
                    strokeWidth={strokeWidth + 2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Línea principal de dependencia */}
                  <path
                    d={generateDHTMLXPath(path)}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerEnd={markerUrl}
                    style={{ 
                      pointerEvents: 'stroke',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={() => setHoveredPath(path.id)}
                    onMouseLeave={() => setHoveredPath(null)}
                  />
                  
                  {/* Puntos de conexión en los extremos */}
                  <circle
                    cx={path.fromX}
                    cy={path.fromY}
                    r={isHovered ? 4 : 3}
                    fill={strokeColor}
                    stroke="white"
                    strokeWidth="1"
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  
                  <circle
                    cx={path.toX}
                    cy={path.toY}
                    r={isHovered ? 4 : 3}
                    fill={strokeColor}
                    stroke="white"
                    strokeWidth="1"
                    style={{ transition: 'all 0.2s ease' }}
                  />
                </g>
              );
            })}
          </g>
        ))}
        
        {/* Indicador de múltiples conexiones cuando hay más de una desde un punto */}
        {Array.from(groupedPaths.entries()).map(([groupKey, paths]) => {
          if (paths.length <= 1) return null;
          
          const firstPath = paths[0];
          return (
            <circle
              key={`multi-${groupKey}`}
              cx={firstPath.fromX}
              cy={firstPath.fromY}
              r={6}
              fill="#f59e0b"
              stroke="white"
              strokeWidth="2"
              style={{ pointerEvents: 'none' }}
            />
          );
        })}
      </svg>
    </div>
  );
}