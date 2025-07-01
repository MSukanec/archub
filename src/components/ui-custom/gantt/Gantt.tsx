import { Button } from '@/components/ui/button';
import { GanttGrid } from './GanttGrid';
import { GanttRow } from './GanttRow';
import { useGanttStore, ViewMode } from './store';
import { useDesignPhases } from '@/hooks/use-design-phases';
import { useDesignTasks } from '@/hooks/use-design-tasks';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getTimelineRange, Phase } from './utils';
import { useMemo } from 'react';

export const Gantt = () => {
  const { viewMode, setViewMode } = useGanttStore();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;
  
  const { data: designPhases = [], isLoading: phasesLoading } = useDesignPhases(organizationId);
  const { data: designTasks = [], isLoading: tasksLoading } = useDesignTasks(organizationId);

  // Combine phases with their tasks
  const phasesWithTasks = useMemo((): Phase[] => {
    return designPhases.map(phase => ({
      ...phase,
      tasks: designTasks.filter(task => task.project_phase_id === phase.id)
    }));
  }, [designPhases, designTasks]);

  // Calculate timeline range
  const timelineRange = useMemo(() => getTimelineRange(phasesWithTasks), [phasesWithTasks]);

  const viewModeButtons: { mode: ViewMode; label: string }[] = [
    { mode: 'day', label: 'Días' },
    { mode: 'week', label: 'Semanas' },
    { mode: 'month', label: 'Meses' },
  ];

  if (phasesLoading || tasksLoading) {
    return (
      <div className="border border-gray-200 rounded text-sm overflow-hidden bg-white p-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Cargando cronograma...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded text-sm overflow-hidden bg-white">
      {/* Header with view switcher */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-800">Cronograma del Proyecto</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const todayElement = document.querySelector('[data-today="true"]');
              todayElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }}
            className="h-7 px-3 text-xs"
          >
            Ir a HOY
          </Button>
        </div>
        
        {/* View mode switcher */}
        <div className="flex gap-1 bg-white rounded-md border border-gray-200 p-1">
          {viewModeButtons.map(({ mode, label }) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-3 text-xs font-medium ${
                viewMode === mode 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setViewMode(mode)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Gantt content */}
      <div className="flex">
        {/* Fixed left column */}
        <div className="min-w-[250px] sticky left-0 z-10 bg-white border-r border-gray-200">
          <div className="h-10 flex items-center px-4 border-b border-gray-200 bg-gray-100">
            <span className="text-sm font-medium text-gray-700">Elementos</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {phasesWithTasks.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay fases de diseño configuradas
              </div>
            ) : (
              phasesWithTasks.map(phase => (
                <div key={phase.id}>
                  <div className="h-10 flex items-center px-4 border-b border-gray-100 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-100 flex-shrink-0" />
                      <span className="text-sm font-medium text-blue-700">{phase.design_phases.name}</span>
                    </div>
                  </div>
                  {phase.tasks?.map(task => (
                    <div key={task.id} className="h-10 flex items-center px-4 border-b border-gray-100 hover:bg-gray-50">
                      <div className="flex items-center gap-2 pl-4">
                        <div className="w-3 h-3 rounded border border-gray-400 bg-gray-100 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{task.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scrollable timeline */}
        <div className="flex-1 overflow-x-auto">
          <GanttGrid timelineRange={timelineRange} />
          <div className="max-h-96 overflow-y-auto">
            {phasesWithTasks.map(phase => (
              <div key={phase.id}>
                <GanttRow 
                  type="phase" 
                  title={phase.design_phases.name} 
                  level={0}
                  timelineRange={timelineRange}
                />
                {phase.tasks?.map(task => (
                  <GanttRow
                    key={task.id}
                    type="task"
                    title={task.name}
                    startDate={task.start_date}
                    endDate={task.end_date}
                    assignee={task.assigned_to || 'Sin asignar'}
                    level={1}
                    timelineRange={timelineRange}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};