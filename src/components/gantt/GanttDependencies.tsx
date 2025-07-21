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
  leftPanelWidth
}: GanttDependenciesProps) {
  
  const [arrowPaths, setArrowPaths] = useState<Array<{
    id: string;
    path: string;
    dependency: any;
  }>>([]);
  const [scrollLeft, setScrollLeft] = useState(0);

  // console.log('GanttDependencies rendering with:', {
  //   dependenciesCount: dependencies.length,
  //   dataCount: data.length,
  //   timelineWidth,
  //   totalDays
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
    
    // Calcular posición Y relativa al contenedor interno
    const relativeY = taskRect.top - scrollContainerRect.top + (taskRect.height / 2);
    
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

  // Función para generar el path SVG con líneas rectas estilo profesional
  const generatePath = (from: { x: number; y: number }, to: { x: number; y: number }): string => {
    const offsetX = 40; // Distancia horizontal antes del giro
    
    // Línea horizontal → vertical → horizontal (estilo "L invertida")
    return `M ${from.x} ${from.y} H ${from.x + offsetX} V ${to.y} H ${to.x}`;
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
      // Verificar que todas las tareas estén renderizadas
      const allTasksRendered = dependencies.every(dep => {
        const predecessorEl = document.querySelector(`[data-task-id="${dep.predecessor_task_id}"]`);
        const successorEl = document.querySelector(`[data-task-id="${dep.successor_task_id}"]`);
        return predecessorEl && successorEl;
      });

      if (!allTasksRendered) {
        return;
      }

      const paths = dependencies.map(dep => {
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

    // Delay inicial para asegurar que el DOM esté completamente renderizado
    const timer = setTimeout(calculateArrows, 200);
    
    return () => clearTimeout(timer);
  }, [dependencies, data, scrollLeft]); // Incluir scrollLeft para recalcular en scroll

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
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="var(--table-row-fg)" />
        </marker>
      </defs>

      {/* Renderizar las flechas con doble layer para mejor visibilidad */}
      {arrowPaths.map((arrow) => {
        return (
          <g key={arrow.id}>
            {/* Línea de fondo blanca para contraste */}
            <path
              d={arrow.path}
              stroke="white"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Línea principal de la flecha */}
            <path
              d={arrow.path}
              stroke="var(--table-row-fg)"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="cursor-pointer pointer-events-auto"
              onClick={() => {
                // TODO: Implementar modal de edición de dependencia
              }}
            />
          </g>
        );
      })}
      </svg>
    </div>
  );
}