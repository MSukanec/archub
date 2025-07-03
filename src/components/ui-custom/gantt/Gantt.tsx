import { Button } from '@/components/ui/button';
import { GanttGrid } from './GanttGrid';
import { GanttRow } from './GanttRow';
import { useGanttStore, ViewMode } from './store';
import { getTimelineRange } from './utils';
import { useGanttPhasesWithTasks } from '@/hooks/use-design-phases';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMemo, useRef } from 'react';

export const Gantt = () => {
  const { viewMode, setViewMode } = useGanttStore();
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  const timelineRef = useRef<HTMLDivElement>(null);

  // Cargar datos reales de Supabase
  const { data: phasesWithTasks = [], isLoading } = useGanttPhasesWithTasks(projectId || '');

  // Calculate timeline range based on real phases data
  const timelineRange = useMemo(() => {
    if (!phasesWithTasks.length) {
      // Default range if no data
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 15);
      const end = new Date(today);
      end.setDate(today.getDate() + 30);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      };
    }
    return getTimelineRange(phasesWithTasks);
  }, [phasesWithTasks]);

  // Function to scroll to today
  const scrollToToday = () => {
    if (timelineRef.current) {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const startDate = new Date(timelineRange.start);
      const targetDate = new Date(todayString);
      const daysDiff = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let columnWidth = 40; // days
      if (viewMode === 'weeks') columnWidth = 100;
      if (viewMode === 'months') columnWidth = 160;
      
      const scrollPosition = daysDiff * columnWidth - (timelineRef.current.offsetWidth / 2);
      timelineRef.current.scrollLeft = Math.max(0, scrollPosition);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Cargando cronograma...
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header with view controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Vista:</span>
          <div className="flex rounded-md border border-gray-200">
            {(['days', 'weeks', 'months'] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none first:rounded-l-md last:rounded-r-md px-3 h-8"
                onClick={() => setViewMode(mode)}
              >
                {mode === 'days' && 'Días'}
                {mode === 'weeks' && 'Semanas'}
                {mode === 'months' && 'Meses'}
              </Button>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={scrollToToday}
          className="h-8 px-3"
        >
          Ir a HOY
        </Button>
      </div>

      {/* Gantt chart content */}
      <div className="flex h-96">
        {/* Fixed left column - elementos */}
        <div className="min-w-[250px] bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Header - altura fija h-20 para sincronizar */}
          <div className="h-20 flex items-center px-4 border-b border-gray-200 bg-gray-100">
            <span className="text-sm font-medium text-gray-700">Elementos</span>
          </div>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            {phasesWithTasks.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay fases de diseño configuradas
              </div>
            ) : (
              phasesWithTasks.map((phase: any) => (
                <div key={phase.id}>
                  {/* Fase row - altura fija h-10 */}
                  <div 
                    className="h-10 flex items-center px-4 border-b border-gray-100 hover:bg-gray-50"
                    data-id={`phase-${phase.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-100 flex-shrink-0" />
                      <span className="text-sm font-medium text-blue-700">
                        {phase.design_phases?.name || 'Sin nombre'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Tareas rows - altura fija h-10 cada una */}
                  {phase.tasks?.map((task: any) => (
                    <div 
                      key={task.id} 
                      className="h-10 flex items-center px-4 border-b border-gray-100 hover:bg-gray-50"
                      data-id={`task-${task.id}`}
                    >
                      <div className="flex items-center gap-2 pl-4">
                        <div className="w-3 h-3 rounded border border-gray-400 bg-gray-100 flex-shrink-0" />
                        <span className="text-sm text-gray-600 truncate">
                          {task.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scrollable timeline area */}
        <div className="flex-1 flex flex-col">
          {/* Timeline grid header - altura fija h-20 para sincronizar */}
          <div className="h-20 border-b border-gray-200">
            <GanttGrid timelineRange={timelineRange} />
          </div>
          
          {/* Scrollable timeline content */}
          <div 
            ref={timelineRef}
            className="flex-1 overflow-x-auto overflow-y-auto"
            style={{ paddingBottom: '16px' }} // Espacio para separar scroll de contenido
          >
            {phasesWithTasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                No hay datos para mostrar
              </div>
            ) : (
              phasesWithTasks.map((phase: any) => (
                <div key={phase.id}>
                  {/* Fase timeline row - altura fija h-10 */}
                  <GanttRow 
                    type="phase" 
                    title={phase.design_phases?.name || 'Sin nombre'}
                    startDate={phase.start_date}
                    endDate={phase.end_date}
                    level={0}
                    timelineRange={timelineRange}
                    dataId={`phase-${phase.id}`}
                  />
                  
                  {/* Tareas timeline rows - altura fija h-10 cada una */}
                  {phase.tasks?.map((task: any) => (
                    <GanttRow
                      key={task.id}
                      type="task"
                      title={task.name}
                      startDate={task.start_date}
                      endDate={task.end_date}
                      assignee={task.assigned_to || 'Sin asignar'}
                      level={1}
                      timelineRange={timelineRange}
                      dataId={`task-${task.id}`}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};