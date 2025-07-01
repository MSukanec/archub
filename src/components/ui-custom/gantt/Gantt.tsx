import { Button } from '@/components/ui/button';
import { GanttGrid } from './GanttGrid';
import { GanttRow } from './GanttRow';
import { useGanttStore, ViewMode } from './store';
import { getTimelineRange, Phase } from './utils';
import { useMemo } from 'react';

export const Gantt = () => {
  const { viewMode, setViewMode } = useGanttStore();

  // Datos temporales para demostración
  const mockPhasesWithTasks = useMemo((): Phase[] => {
    const today = new Date();
    const getDateString = (daysOffset: number) => {
      const date = new Date(today);
      date.setDate(today.getDate() + daysOffset);
      return date.toISOString().split('T')[0];
    };

    return [
      {
        id: '1',
        design_phase_id: '1',
        start_date: getDateString(-5),
        end_date: getDateString(10),
        design_phases: {
          id: '1',
          name: 'Fase de Diseño Conceptual'
        },
        tasks: [
          {
            id: '1',
            project_phase_id: '1',
            name: 'Investigación de mercado',
            start_date: getDateString(-3),
            end_date: getDateString(2),
            assigned_to: 'Juan Pérez',
            status: 'en_progreso',
            priority: 'alta',
            position: 1,
            is_active: true,
            created_by: 'admin',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            project_phase_id: '1',
            name: 'Sketches iniciales',
            start_date: getDateString(3),
            end_date: getDateString(7),
            assigned_to: 'María González',
            status: 'pendiente',
            priority: 'media',
            position: 2,
            is_active: true,
            created_by: 'admin',
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: '2',
        design_phase_id: '2',
        start_date: getDateString(8),
        end_date: getDateString(20),
        design_phases: {
          id: '2',
          name: 'Desarrollo Técnico'
        },
        tasks: [
          {
            id: '3',
            project_phase_id: '2',
            name: 'Modelado 3D',
            start_date: getDateString(10),
            end_date: getDateString(15),
            assigned_to: 'Carlos Ruiz',
            status: 'pendiente',
            priority: 'alta',
            position: 1,
            is_active: true,
            created_by: 'admin',
            created_at: new Date().toISOString()
          }
        ]
      }
    ];
  }, []);

  // Calculate timeline range
  const timelineRange = useMemo(() => getTimelineRange(mockPhasesWithTasks), [mockPhasesWithTasks]);

  const viewModeButtons: { mode: ViewMode; label: string }[] = [
    { mode: 'day', label: 'Días' },
    { mode: 'week', label: 'Semanas' },
    { mode: 'month', label: 'Meses' },
  ];

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
            {mockPhasesWithTasks.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay fases de diseño configuradas
              </div>
            ) : (
              mockPhasesWithTasks.map((phase: Phase) => (
                <div key={phase.id}>
                  <div className="h-10 flex items-center px-4 border-b border-gray-100 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-100 flex-shrink-0" />
                      <span className="text-sm font-medium text-blue-700">{phase.design_phases.name}</span>
                    </div>
                  </div>
                  {phase.tasks?.map((task: any) => (
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
            {mockPhasesWithTasks.map((phase: Phase) => (
              <div key={phase.id}>
                <GanttRow 
                  type="phase" 
                  title={phase.design_phases.name} 
                  level={0}
                  timelineRange={timelineRange}
                />
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