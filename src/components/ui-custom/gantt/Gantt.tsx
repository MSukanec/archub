import { Button } from '@/components/ui/button';
import { GanttGrid } from './GanttGrid';
import { GanttRow } from './GanttRow';
import { mockPhases } from './mockData';
import { useGanttStore, ViewMode } from './store';

export const Gantt = () => {
  const { viewMode, setViewMode } = useGanttStore();

  const viewModeButtons: { mode: ViewMode; label: string }[] = [
    { mode: 'day', label: 'Días' },
    { mode: 'week', label: 'Semanas' },
    { mode: 'month', label: 'Meses' },
  ];

  return (
    <div className="border border-gray-200 rounded text-sm overflow-hidden bg-white">
      {/* Header with view switcher */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">Cronograma del Proyecto</h3>
        
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
      <div className="relative overflow-hidden">
        <GanttGrid />
        <div className="max-h-96 overflow-y-auto">
          {mockPhases.map(phase => (
            <div key={phase.id}>
              <GanttRow type="phase" title={phase.title} level={0} />
              {phase.tasks.map(task => (
                <GanttRow
                  key={task.id}
                  type="task"
                  title={task.title}
                  startDate={task.startDate}
                  endDate={task.endDate}
                  assignee={task.assignee}
                  level={1}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};