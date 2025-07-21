import { useMemo } from 'react';
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

  // Función para obtener las coordenadas de una tarea
  const getTaskPosition = (taskId: string, connectorType: 'output' | 'input'): { x: number; y: number } | null => {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
    const timelineElement = containerRef.current;
    
    if (!taskElement || !timelineElement) {
      return null;
    }

    const taskRect = taskElement.getBoundingClientRect();
    const timelineRect = timelineElement.getBoundingClientRect();
    
    // Calcular posición relativa al timeline
    const relativeY = taskRect.top - timelineRect.top + timelineElement.scrollTop + (taskRect.height / 2);
    
    let relativeX: number;
    if (connectorType === 'output') {
      // Conector de salida: lado derecho de la tarea + 8px hacia afuera
      relativeX = taskRect.right - timelineRect.left + timelineElement.scrollLeft + 8;
    } else {
      // Conector de entrada: lado izquierdo de la tarea - 8px hacia afuera
      relativeX = taskRect.left - timelineRect.left + timelineElement.scrollLeft - 8;
    }

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

  // Memoizar las flechas para evitar recálculos innecesarios
  const arrowPaths = useMemo(() => {
    if (!dependencies.length || !containerRef.current) {
      return [];
    }

    return dependencies.map(dep => {
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
  }, [dependencies, data, timelineWidth, totalDays]);

  if (!arrowPaths.length) {
    return null;
  }

  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
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
            fill="#666"
            stroke="white"
            strokeWidth="0.5"
          />
        </marker>
      </defs>

      {/* Renderizar cada flecha */}
      {arrowPaths.map(arrow => {
        if (!arrow) return null;
        
        return (
          <path
            key={arrow.id}
            d={arrow.path}
            stroke="#666"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            className="pointer-events-auto hover:stroke-red-400 cursor-pointer transition-colors duration-200"
            onClick={() => {
              console.log('Dependency clicked:', arrow.dependency);
              // Aquí se puede agregar modal de edición de dependencia
            }}

          />
        );
      })}
    </svg>
  );
}