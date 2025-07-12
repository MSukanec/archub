import { useState, useRef } from 'react';
import { useGanttStore } from './store';
import { getBarPosition, getColumnWidth } from './utils';

interface GanttBarProps {
  startDate: string;
  endDate: string;
  title: string;
  assignee: string;
  timelineStart: string;
  timelineEnd: string;
  taskId?: string;
  onDateChange?: (startDate: string, endDate: string) => void;
  onTaskClick?: (taskId: string) => void;
}

export const GanttBar = ({ 
  startDate, 
  endDate, 
  title, 
  assignee,
  timelineStart, 
  timelineEnd,
  taskId,
  onDateChange,
  onTaskClick
}: GanttBarProps) => {
  const { viewMode } = useGanttStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-left' | 'resize-right' | null>(null);
  const [dragTooltip, setDragTooltip] = useState<{ x: number; y: number; startDate: string; endDate: string; days: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const position = getBarPosition(startDate, endDate, timelineStart, timelineEnd, viewMode);
  
  if (!position) return null;

  const columnWidth = getColumnWidth(viewMode);

  const handleBarClick = (e: React.MouseEvent) => {
    // Solo abrir modal si no estamos arrastrando
    if (!isDragging && taskId && onTaskClick) {
      e.stopPropagation();
      onTaskClick(taskId);
    }
  };

  const calculateDateFromPosition = (x: number, baseDate: string, isEnd: boolean = false): string => {
    const daysDiff = Math.round(x / columnWidth);
    const date = new Date(baseDate);
    date.setDate(date.getDate() + daysDiff);
    return date.toISOString().split('T')[0];
  };

  const calculateDaysBetween = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    
    const startX = e.clientX;
    const initialStartDate = startDate;
    const initialEndDate = endDate;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const daysDelta = Math.round(deltaX / columnWidth);
      
      let newStartDate = initialStartDate;
      let newEndDate = initialEndDate;

      if (type === 'move') {
        const startDateObj = new Date(initialStartDate);
        const endDateObj = new Date(initialEndDate);
        startDateObj.setDate(startDateObj.getDate() + daysDelta);
        endDateObj.setDate(endDateObj.getDate() + daysDelta);
        newStartDate = startDateObj.toISOString().split('T')[0];
        newEndDate = endDateObj.toISOString().split('T')[0];
      } else if (type === 'resize-left') {
        const startDateObj = new Date(initialStartDate);
        startDateObj.setDate(startDateObj.getDate() + daysDelta);
        newStartDate = startDateObj.toISOString().split('T')[0];
        // Asegurar que la fecha de inicio no sea posterior a la fecha de fin
        if (new Date(newStartDate) >= new Date(initialEndDate)) {
          const endDateObj = new Date(initialEndDate);
          endDateObj.setDate(endDateObj.getDate() - 1);
          newStartDate = endDateObj.toISOString().split('T')[0];
        }
      } else if (type === 'resize-right') {
        const endDateObj = new Date(initialEndDate);
        endDateObj.setDate(endDateObj.getDate() + daysDelta);
        newEndDate = endDateObj.toISOString().split('T')[0];
        // Asegurar que la fecha de fin no sea anterior a la fecha de inicio
        if (new Date(newEndDate) <= new Date(initialStartDate)) {
          const startDateObj = new Date(initialStartDate);
          startDateObj.setDate(startDateObj.getDate() + 1);
          newEndDate = startDateObj.toISOString().split('T')[0];
        }
      }

      const days = calculateDaysBetween(newStartDate, newEndDate);
      
      setDragTooltip({
        x: moveEvent.clientX,
        y: moveEvent.clientY - 60,
        startDate: newStartDate,
        endDate: newEndDate,
        days: days
      });

      // Actualizar visualmente las fechas durante el arrastre
      if (onDateChange) {
        onDateChange(newStartDate, newEndDate);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setDragTooltip(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      <div
        ref={barRef}
        className={`absolute top-2 h-5 bg-gray-700 rounded-sm flex items-center px-2 cursor-pointer hover:bg-gray-800 transition-colors group ${
          isDragging ? 'opacity-75' : ''
        }`}
        style={{ 
          left: `${position.left}px`, 
          width: `${position.width}px` 
        }}
        title={`${title} (${assignee})\n${startDate} - ${endDate}`}
        onClick={handleBarClick}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/50 hover:bg-white/80"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, 'resize-left');
        }}
      />
      
      {/* Bar content */}
      <span className="text-xs text-white font-medium truncate mr-2 pointer-events-none">
        {title}
      </span>
      <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center flex-shrink-0 pointer-events-none">
        <span className="text-[10px] text-gray-700 font-medium">
          {assignee.charAt(0)}
        </span>
      </div>
      
      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/50 hover:bg-white/80"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, 'resize-right');
        }}
      />
    </div>
    
    {/* Drag tooltip */}
    {dragTooltip && (
      <div
        className="fixed bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg z-50 pointer-events-none"
        style={{
          left: `${dragTooltip.x}px`,
          top: `${dragTooltip.y}px`,
          transform: 'translate(-50%, 0)'
        }}
      >
        <div className="text-xs">
          <div className="font-medium">{dragTooltip.startDate}</div>
          <div className="font-medium">{dragTooltip.endDate}</div>
          <div className="text-blue-200">({dragTooltip.days} días)</div>
        </div>
      </div>
    )}
    </>
  );
};