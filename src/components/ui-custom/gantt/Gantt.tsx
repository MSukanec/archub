import { GanttGrid } from './GanttGrid';
import { GanttRow } from './GanttRow';
import { mockPhases } from './mockData';

export const Gantt = () => {
  return (
    <div className="border border-gray-200 rounded text-sm overflow-hidden">
      <GanttGrid />
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
  );
};