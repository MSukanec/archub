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

  // Función para obtener las coordenadas de una tarea ajustadas por scroll
  const getTaskPosition = (taskId: string, connectorType: 'output' | 'input'): { x: number; y: number } | null => {
    const taskBarElement = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
    const timelineScrollContainer = document.getElementById('timeline-content-scroll');
    
    if (!taskBarElement || !timelineScrollContainer) {
      return null;
    }

    const taskRect = taskBarElement.getBoundingClientRect();
    const scrollContainerRect = timelineScrollContainer.getBoundingClientRect();
    const currentScrollLeft = timelineScrollContainer.scrollLeft;
    
    // Calcular posición Y relativa al contenedor
    const relativeY = taskRect.top - scrollContainerRect.top + (taskRect.height / 2);
    
    // Calcular posición X ajustada por scroll para coordenadas SVG
    let relativeX: number;
    if (connectorType === 'output') {
      // Conector de salida: lado derecho + scroll offset
      relativeX = (taskRect.right - scrollContainerRect.left) + currentScrollLeft;
    } else {
      // Conector de entrada: lado izquierdo + scroll offset
      relativeX = (taskRect.left - scrollContainerRect.left) + currentScrollLeft;
    }

    return { x: relativeX, y: relativeY };
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
      console.log('Arrows calculated successfully:', paths.length, paths);
    };

    // Delay inicial para asegurar que el DOM esté completamente renderizado
    const timer = setTimeout(calculateArrows, 200);
    
    return () => clearTimeout(timer);
  }, [dependencies, data, scrollLeft]); // Incluir scrollLeft para recalcular en scroll

  if (!arrowPaths.length) {
    return null;
  }

  console.log('Rendering SVG with arrowPaths:', arrowPaths.length);
  
  // DEBUG: Botón para ir a las tareas
  const scrollToTasks = () => {
    const timelineScrollContainer = document.getElementById('timeline-content-scroll');
    if (timelineScrollContainer) {
      timelineScrollContainer.scrollLeft = 2000; // Scroll a donde están las tareas
    }
  };
  
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* DEBUG: Botón temporal para ir a las tareas */}
      <button 
        onClick={scrollToTasks}
        className="absolute top-2 right-2 z-50 bg-red-500 text-white px-3 py-1 rounded text-sm pointer-events-auto"
      >
        IR A TAREAS
      </button>
      
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ 
          zIndex: 10
        }}
      >
      {/* Definir el marcador de flecha profesional */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
        </marker>
      </defs>

      {/* Renderizar las flechas */}
      {arrowPaths.map((arrow) => {
        return (
          <path
            key={arrow.id}
            d={arrow.path}
            stroke="#6b7280"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            className="cursor-pointer hover:stroke-red-400 pointer-events-auto"
            onClick={() => {
              console.log('Dependency clicked:', arrow.dependency);
              // Aquí se puede abrir el modal de dependencias
            }}
          />
        );
      })}
      </svg>
    </div>
  );
}