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

  console.log('GanttDependencies rendering with:', {
    dependenciesCount: dependencies.length,
    dataCount: data.length,
    timelineWidth,
    totalDays
  });

  // Función para obtener las coordenadas de una tarea
  const getTaskPosition = (taskId: string, connectorType: 'output' | 'input'): { x: number; y: number } | null => {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
    const timelineElement = containerRef.current;
    
    console.log('getTaskPosition called:', {
      taskId,
      connectorType,
      taskElement: !!taskElement,
      timelineElement: !!timelineElement
    });
    
    if (!taskElement || !timelineElement) {
      console.log('Missing elements for task:', taskId);
      return null;
    }

    const taskRect = taskElement.getBoundingClientRect();
    const timelineRect = timelineElement.getBoundingClientRect();
    
    // Calcular posición relativa al SVG (que está absolute dentro del timeline)
    const relativeY = taskRect.top - timelineRect.top + (taskRect.height / 2);
    
    let relativeX: number;
    if (connectorType === 'output') {
      // Conector de salida: lado derecho de la tarea + 8px hacia afuera
      relativeX = taskRect.right - timelineRect.left + 8;
    } else {
      // Conector de entrada: lado izquierdo de la tarea - 8px hacia afuera
      relativeX = taskRect.left - timelineRect.left - 8;
    }

    const result = { x: relativeX, y: relativeY };
    console.log('getTaskPosition result:', result);
    return result;
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

    // Esperar un poco para que las tareas se rendericen
    const timeoutId = setTimeout(() => {
      console.log('useEffect calculating paths...');
      
      const paths = dependencies.map(dep => {
        console.log('Processing dependency:', dep.id, 'from:', dep.predecessor_task_id, 'to:', dep.successor_task_id);
        
        const fromCoords = getTaskPosition(dep.predecessor_task_id, 'output');
        const toCoords = getTaskPosition(dep.successor_task_id, 'input');

        if (!fromCoords || !toCoords) {
          console.log('Missing coordinates for dependency:', dep.id);
          return null;
        }

        const pathString = generatePath(fromCoords, toCoords);
        console.log('Generated path for dependency:', dep.id, pathString);

        return {
          id: dep.id,
          path: pathString,
          dependency: dep
        };
      }).filter(Boolean);
      
      console.log('Final arrowPaths count:', paths.length);
      setArrowPaths(paths);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [dependencies, data, timelineWidth, totalDays]);

  if (!arrowPaths.length) {
    console.log('No arrowPaths, returning null');
    return null;
  }

  console.log('Rendering SVG with arrowPaths:', arrowPaths.length);

  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 50 }}
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
            fill="#ff0000"
            stroke="white"
            strokeWidth="1"
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
            {/* Línea principal roja */}
            <path
              d={arrow.path}
              stroke="#ef4444"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd="url(#arrowhead)"
              className="pointer-events-auto hover:stroke-red-600 cursor-pointer transition-colors duration-200"
              onClick={() => {
                console.log('Dependency clicked:', arrow.dependency);
                // Aquí se puede agregar modal de edición de dependencia
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}