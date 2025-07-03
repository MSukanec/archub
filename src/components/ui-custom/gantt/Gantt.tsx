import React, { useMemo, useRef, useState } from 'react';
import { GanttGrid } from './GanttGrid';
import { GanttRow } from './GanttRow';
import { useGanttStore, ViewMode } from './store';
import { getTimelineRange, getDateArray, getColumnWidth } from './utils';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface GanttProps {
  phasesWithTasks: any[];
}

export const Gantt = ({ phasesWithTasks }: GanttProps) => {
  console.log('Gantt phasesWithTasks:', phasesWithTasks);
  
  const { viewMode, setViewMode } = useGanttStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Estados para fechas manuales del timeline
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Validar que phasesWithTasks sea un array
  const validPhasesWithTasks = Array.isArray(phasesWithTasks) ? phasesWithTasks : [];
  
  // Calculate timeline range based on real phases data or manual dates
  const timelineRange = useMemo(() => {
    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }
    
    if (!validPhasesWithTasks || validPhasesWithTasks.length === 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      const end = new Date(today);
      end.setDate(today.getDate() + 30);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      };
    }
    
    return getTimelineRange(validPhasesWithTasks);
  }, [validPhasesWithTasks, startDate, endDate]);

  const columnWidth = getColumnWidth(viewMode);

  // Función para ir al día de hoy
  const scrollToToday = () => {
    if (timelineRef.current) {
      const today = new Date().toISOString().split('T')[0];
      const todayElement = timelineRef.current.querySelector(`[data-date="${today}"]`);
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }
  };

  // Configurar fechas por defecto basadas en los datos
  React.useEffect(() => {
    if (!startDate && !endDate && validPhasesWithTasks.length > 0) {
      const range = getTimelineRange(validPhasesWithTasks);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  }, [validPhasesWithTasks, startDate, endDate]);

  const viewModeOptions: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
    { value: 'days', label: 'Días', icon: <CalendarDays className="w-4 h-4" /> },
    { value: 'weeks', label: 'Semanas', icon: <Clock className="w-4 h-4" /> },
    { value: 'months', label: 'Meses', icon: <Calendar className="w-4 h-4" /> }
  ];

  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header con controles */}
      <div className="h-16 border-b border-gray-200 bg-gray-50 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Selector de vista */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Vista:</span>
            <div className="flex bg-white border border-gray-300 rounded-md p-1">
              {viewModeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setViewMode(option.value)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center space-x-1 ${
                    viewMode === option.value
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Controles de fechas */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Label htmlFor="start-date" className="text-xs text-gray-600">Desde:</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
            <div className="flex items-center space-x-1">
              <Label htmlFor="end-date" className="text-xs text-gray-600">Hasta:</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
          </div>
        </div>
        
        {/* Botón ir a hoy */}
        <Button
          onClick={scrollToToday}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Ir a HOY
        </Button>
      </div>

      {/* Contenedor principal del Gantt */}
      <div className="flex h-full">
        {/* Columna izquierda fija para nombres */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0 sticky left-0 z-10">
          {/* Header de la columna izquierda */}
          <div className="h-20 border-b border-gray-200 bg-white flex items-center px-4">
            <span className="text-sm font-semibold text-gray-700">Elementos</span>
          </div>
          
          {/* Lista de fases y tareas */}
          <div className="overflow-y-auto">
            {validPhasesWithTasks.map((phase) => (
              <div key={phase.id}>
                {/* Fase */}
                <div 
                  className="h-10 border-b border-gray-100 px-4 flex items-center hover:bg-gray-100 cursor-pointer"
                  data-id={`phase-${phase.id}`}
                >
                  <span className="text-sm font-medium text-gray-900">
                    {phase.design_phases?.name || 'Sin nombre'}
                  </span>
                </div>
                
                {/* Tareas de la fase */}
                {phase.tasks?.map((task: any) => (
                  <div 
                    key={task.id}
                    className="h-10 border-b border-gray-100 px-8 flex items-center hover:bg-gray-100 cursor-pointer"
                    data-id={`task-${task.id}`}
                  >
                    <span className="text-sm text-gray-700">
                      {task.name}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Area del timeline con scroll horizontal */}
        <div className="flex-1 overflow-x-auto" ref={timelineRef}>
          <div className="min-w-fit">
            {/* Header del timeline */}
            <GanttGrid timelineRange={timelineRange} />
            
            {/* Filas del timeline */}
            <div>
              {validPhasesWithTasks.map((phase) => (
                <div key={phase.id}>
                  {/* Fila de la fase */}
                  <GanttRow
                    type="phase"
                    title={phase.design_phases?.name || 'Sin nombre'}
                    startDate={phase.start_date}
                    endDate={phase.end_date}
                    level={0}
                    timelineRange={timelineRange}
                    dataId={`phase-${phase.id}`}
                  />
                  
                  {/* Filas de las tareas */}
                  {phase.tasks?.map((task: any) => (
                    <GanttRow
                      key={task.id}
                      type="task"
                      title={task.name}
                      startDate={task.start_date}
                      endDate={task.end_date}
                      assignee={task.assigned_to}
                      level={1}
                      timelineRange={timelineRange}
                      dataId={`task-${task.id}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};