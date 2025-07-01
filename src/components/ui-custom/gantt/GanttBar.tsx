import { useState, useRef } from 'react';
import { useGanttStore } from './store';
import { getBarPosition } from './utils';

interface GanttBarProps {
  startDate: string;
  endDate: string;
  title: string;
  assignee: string;
  timelineStart: string;
  onDateChange?: (startDate: string, endDate: string) => void;
}

export const GanttBar = ({ 
  startDate, 
  endDate, 
  title, 
  assignee,
  timelineStart, 
  onDateChange 
}: GanttBarProps) => {
  const { viewMode } = useGanttStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-left' | 'resize-right' | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const position = getBarPosition(startDate, endDate, timelineStart, viewMode);
  
  if (!position) return null;

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Here you would implement the drag logic
      // For now, we'll just show the visual feedback
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
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
  );
};