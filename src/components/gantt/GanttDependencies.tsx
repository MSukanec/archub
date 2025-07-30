import { useMemo, useEffect, useState } from 'react';
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
  containerRef: React.RefObject<HTMLDivElement>;
  leftPanelWidth: number;
  refreshTrigger?: number; // Trigger para forzar actualización durante drag
  onDependencyClick?: (dependency: any) => void; // Callback para manejar clicks en dependencias
}

interface TaskPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function GanttDependencies({
  data,
  dependencies,
  timelineStart,
  timelineEnd,
  timelineWidth,
  totalDays,
  containerRef,
  leftPanelWidth,
  refreshTrigger,
  onDependencyClick
}: GanttDependenciesProps) {
  
  const [arrowPaths, setArrowPaths] = useState<Array<{
    id: string;
    path: string;
    dependency: any;
  }>>([]);
  const [scrollLeft, setScrollLeft] = useState(0);

  //   dependenciesCount: dependencies.length,
  //   dataCount: data.length,
  //   timelineWidth,
  //   totalDays,
  //   arrowPathsCount: arrowPaths.length
  // });

  // Función para obtener las coordenadas de una tarea en el sistema de coordenadas del SVG
  const getTaskPosition = (taskId: string, connectorType: 'output' | 'input'): { x: number; y: number } | null => {
    const taskBarElement = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
    const timelineScrollContainer = document.getElementById('timeline-content-scroll');
    
    if (!taskBarElement || !timelineScrollContainer) {
      return null;
    }

    const taskRect = taskBarElement.getBoundingClientRect();
    const scrollContainerRect = timelineScrollContainer.getBoundingClientRect();
    const currentScrollLeft = timelineScrollContainer.scrollLeft;
    
    // Calcular posición Y - CENTRO VERTICAL de la barra para ambos tipos de conector
    const taskCenterY = taskRect.top + (taskRect.height / 2);
    const relativeY = taskCenterY - scrollContainerRect.top;
    
    // Calcular posición X en coordenadas del timeline completo (incluyendo parte scrolleada)
    let absoluteX: number;
    if (connectorType === 'output') {
      // Conector de salida: lado derecho + scroll offset
      absoluteX = (taskRect.right - scrollContainerRect.left) + currentScrollLeft;
    } else {
      // Conector de entrada: lado izquierdo + scroll offset  
      absoluteX = (taskRect.left - scrollContainerRect.left) + currentScrollLeft;
    }

    return { x: absoluteX, y: relativeY };
  };

  // Función para generar el path SVG con offsets en ambos extremos como en tu dibujo
  const generatePath = (from: { x: number; y: number }, to: { x: number; y: number }): string => {
    const offsetRight = 20; // Offset hacia la derecha desde la tarea origen
    const offsetLeft = 20;  // Offset hacia la izquierda hacia la tarea destino
    
    const yDifference = Math.abs(from.y - to.y);
    
    // Si las tareas están exactamente en la misma fila, usar path horizontal directo
    if (yDifference === 0) {
      return `M ${from.x} ${from.y} H ${from.x + offsetRight} H ${to.x - offsetLeft} H ${to.x}`;
    }
    
    // Para dependencias entre diferentes filas:
    // 1. Salir horizontalmente desde el centro de la barra origen
    // 2. Bajar/subir verticalmente hasta ENTRE las filas (punto medio)
    // 3. Ir horizontalmente hasta cerca de la barra destino
    // 4. Bajar/subir hasta el centro de la barra destino
    const midY = (from.y + to.y) / 2; // Punto medio entre las dos filas
    
    return `M ${from.x} ${from.y} H ${from.x + offsetRight} V ${midY} H ${to.x - offsetLeft} V ${to.y} H ${to.x}`;
  };

  // Efecto para escuchar scroll y forzar re-render
  useEffect(() => {
    const timelineElement = document.getElementById('timeline-content-scroll');
    if (!timelineElement) return;

    const handleScroll = () => {
      setScrollLeft(timelineElement.scrollLeft);
    };

    timelineElement.addEventListener('scroll', handleScroll);
    return () => timelineElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Calcular flechas con timing correcto y actualización por scroll
  useEffect(() => {
    if (!dependencies.length) {
      setArrowPaths([]);
      return;
    }

    const calculateArrows = () => {
      // Primero, obtener los IDs de las tareas que están realmente renderizadas
      const renderedTaskIds = new Set(
        data.filter(item => item.type === 'task').map(item => item.id)
      );
      
      // Filtrar dependencias para incluir solo las que tienen ambas tareas renderizadas
      const validDependencies = dependencies.filter(dep => {
        return renderedTaskIds.has(dep.predecessor_task_id) && 
               renderedTaskIds.has(dep.successor_task_id);
      });

      if (!validDependencies.length) {
        setArrowPaths([]);
        return;
      }
      
      // Verificar que todas las tareas válidas estén renderizadas en el DOM
      const allTasksRendered = validDependencies.every(dep => {
        const predecessorEl = document.querySelector(`[data-task-id="${dep.predecessor_task_id}"]`);
        const successorEl = document.querySelector(`[data-task-id="${dep.successor_task_id}"]`);
        return predecessorEl && successorEl;
      });

      if (!allTasksRendered) {
        return;
      }
      
      const paths = validDependencies.map(dep => {
        const fromCoords = getTaskPosition(dep.predecessor_task_id, 'output');
        const toCoords = getTaskPosition(dep.successor_task_id, 'input');

        if (!fromCoords || !toCoords) {
          return null;
        }

        const pathString = generatePath(fromCoords, toCoords);
        return {
          id: dep.id,
          path: pathString,
          dependency: dep
        };
      }).filter(Boolean);

      setArrowPaths(paths as any);
    };

    // Usar requestAnimationFrame para actualización instantánea y suave
    const frame = requestAnimationFrame(calculateArrows);
    
    return () => cancelAnimationFrame(frame);
  }, [dependencies, data, scrollLeft, refreshTrigger]); // Incluir refreshTrigger para recalcular durante drag

  if (!arrowPaths.length) {
    return null;
  }


  
  return (
    <div className="absolute top-0 left-0 h-full pointer-events-none" style={{ width: timelineWidth }}>
      
      <svg 
        className="absolute top-0 left-0 h-full pointer-events-none"
        width={timelineWidth}
        height="100%"
        style={{ 
          zIndex: 50 // Mayor z-index para estar encima de las barras
        }}
      >
      {/* Definir el marcador de flecha profesional */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 6 2, 0 4" fill="var(--table-row-fg)" />
        </marker>
      </defs>

      {/* Renderizar las flechas con doble layer para mejor visibilidad */}
      {arrowPaths.map((arrow) => {
        return (
          <g key={arrow.id}>
            {/* Línea de fondo blanca para contraste - hover: doble ancho */}
            <path
              d={arrow.path}
              stroke="white"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'stroke-width 0.2s ease'
              }}
              className="hover:[stroke-width:6px]"
            />
            {/* Línea principal de la flecha - hover: doble ancho */}
            <path
              d={arrow.path}
              stroke="var(--table-row-fg)"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'stroke-width 0.2s ease, stroke 0.2s ease'
              }}
              className="cursor-pointer pointer-events-auto hover:stroke-red-500 hover:[stroke-width:4px]"
              onClick={() => {
                if (onDependencyClick) {
                  onDependencyClick(arrow.dependency);
                }
              }}
            />
          </g>
        );
      })}
      </svg>
    </div>
  );
}