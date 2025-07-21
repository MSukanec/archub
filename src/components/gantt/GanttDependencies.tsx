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

  // console.log('GanttDependencies rendering with:', {
  //   dependenciesCount: dependencies.length,
  //   dataCount: data.length,
  //   timelineWidth,
  //   totalDays
  // });

  // Función para obtener las coordenadas de una tarea basándose en la barra de tarea específica
  const getTaskPosition = (taskId: string, connectorType: 'output' | 'input'): { x: number; y: number } | null => {
    // Buscar la barra de tarea específica directamente por data-task-id
    const taskBarElement = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
    const timelineElement = containerRef.current;
    
    // console.log('getTaskPosition called:', {
    //   taskId,
    //   connectorType,
    //   taskBarElement: !!taskBarElement,
    //   timelineElement: !!timelineElement
    // });
    
    if (!taskBarElement || !timelineElement) {
      // console.log('Missing elements for task:', taskId);
      return null;
    }

    const taskRect = taskBarElement.getBoundingClientRect();
    const timelineRect = timelineElement.getBoundingClientRect();
    
    // Calcular posición relativa al contenedor del timeline
    const relativeY = taskRect.top - timelineRect.top + (taskRect.height / 2);
    
    let relativeX: number;
    if (connectorType === 'output') {
      // Conector de salida: lado derecho de la barra de tarea
      relativeX = taskRect.right - timelineRect.left;
    } else {
      // Conector de entrada: lado izquierdo de la barra de tarea  
      relativeX = taskRect.left - timelineRect.left;
    }

    // console.log('Task position calculated:', {
    //   taskId,
    //   connectorType,
    //   relativeX,
    //   relativeY,
    //   taskRect: { left: taskRect.left, right: taskRect.right, top: taskRect.top, height: taskRect.height },
    //   timelineRect: { left: timelineRect.left, top: timelineRect.top }
    // });

    return { x: relativeX, y: relativeY };
  };

  // Función para generar el path SVG según las especificaciones del prompt
  const generatePath = (from: { x: number; y: number }, to: { x: number; y: number }): string => {
    const startX = from.x;
    const startY = from.y;
    const endX = to.x;
    const endY = to.y;

    // Según el prompt: línea horizontal → vertical → horizontal
    // 1. Línea horizontal desde el conector de salida hacia la derecha 8-16px
    const midX1 = startX + 12; // 12px hacia la derecha
    
    // 2. Línea vertical hasta alinearse con el conector de entrada
    const midY = endY;
    
    // 3. Línea horizontal hasta el conector de entrada
    const midX2 = endX;

    // Path con solo líneas rectas y pequeña curva en los giros
    return `M ${startX} ${startY} H ${midX1} V ${midY} H ${midX2}`;
  };

  // Calcular las flechas cuando las tareas estén disponibles
  useEffect(() => {
    if (!dependencies.length || !containerRef.current) {
      setArrowPaths([]);
      return;
    }

    const calculateArrows = () => {
      // Verificar que todas las barras de tareas estén renderizadas antes de calcular
      const allTasksRendered = dependencies.every(dep => {
        const predTask = document.querySelector(`[data-task-id="${dep.predecessor_task_id}"]`);
        const succTask = document.querySelector(`[data-task-id="${dep.successor_task_id}"]`);
        return predTask && succTask;
      });

      if (!allTasksRendered) {
        // console.log('Not all tasks rendered yet, waiting...');
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
      
      setArrowPaths(paths);
      // console.log('Arrows calculated successfully:', paths.length);
    };

    // Calcular con múltiples intentos para manejar el auto-scroll al día actual
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryCalculateArrows = () => {
      attempts++;
      calculateArrows();
      
      // Si no se calcularon las flechas y aún hay intentos, intentar de nuevo
      if (arrowPaths.length === 0 && attempts < maxAttempts) {
        setTimeout(tryCalculateArrows, 300);
      }
    };

    const timeoutId = setTimeout(tryCalculateArrows, 500);

    // Agregar listener para scroll horizontal al contenedor específico del timeline
    const scrollableElement = document.getElementById('timeline-content-scroll');
    if (scrollableElement) {
      const handleScroll = () => {
        // Usar un pequeño delay para evitar recálculos excesivos durante scroll continuo
        setTimeout(calculateArrows, 50);
      };
      
      scrollableElement.addEventListener('scroll', handleScroll);
      
      return () => {
        clearTimeout(timeoutId);
        scrollableElement.removeEventListener('scroll', handleScroll);
      };
    }

    return () => clearTimeout(timeoutId);
  }, [dependencies, data, timelineWidth, totalDays]);

  if (!arrowPaths.length) {
    return null;
  }

  // console.log('Rendering SVG with arrowPaths:', arrowPaths.length);
  
  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 100 }}
    >
      {/* Definir el marcador de flecha */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0,0 0,6 8,3"
            fill="var(--table-row-fg)"
          />
        </marker>
      </defs>

      {/* Renderizar cada flecha */}
      {arrowPaths.map(arrow => {
        if (!arrow) return null;
        
        // console.log('Rendering path:', arrow.id, arrow.path);
        
        return (
          <g key={arrow.id}>
            {/* Línea de fondo blanca para contraste */}
            <path
              d={arrow.path}
              stroke="white"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Línea principal con color del borde de barras */}
            <path
              d={arrow.path}
              stroke="var(--table-row-fg)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd="url(#arrowhead)"
              className="pointer-events-auto hover:opacity-80 cursor-pointer transition-opacity duration-200"
              onClick={() => {
                // console.log('Dependency clicked:', arrow.dependency);
                // Aquí se puede agregar modal de edición de dependencia
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}