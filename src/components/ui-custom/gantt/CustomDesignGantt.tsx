import { useMemo } from 'react';
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface DesignTask {
  id: string;
  design_phase_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to: string | null;
  design_phase?: {
    id: string;
    name: string;
  };
}

interface PhaseWithTasks {
  id: string;
  name: string;
  description: string | null;
  tasks: DesignTask[];
}

interface CustomDesignGanttProps {
  phases: PhaseWithTasks[];
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

export function CustomDesignGantt({ phases, getStatusColor, getStatusLabel }: CustomDesignGanttProps) {
  // Calculate date range for the timeline
  const dateRange = useMemo(() => {
    const allTasks = phases.flatMap(phase => phase.tasks);
    const datesWithData = allTasks.filter(task => task.start_date || task.end_date);
    
    if (datesWithData.length === 0) {
      // Default to current month if no dates
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        startDate: startOfMonth,
        endDate: endOfMonth,
        totalDays: endOfMonth.getDate()
      };
    }

    const startDates = datesWithData
      .filter(task => task.start_date)
      .map(task => new Date(task.start_date!));
    const endDates = datesWithData
      .filter(task => task.end_date)
      .map(task => new Date(task.end_date!));
    
    const allDates = [...startDates, ...endDates];
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Add some padding
    const startDate = new Date(minDate);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(maxDate);
    endDate.setDate(endDate.getDate() + 7);
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return { startDate, endDate, totalDays };
  }, [phases]);

  const generateDaysArray = () => {
    const days = [];
    const currentDate = new Date(dateRange.startDate);
    
    while (currentDate <= dateRange.endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const days = generateDaysArray();
  const dayWidth = 32; // Width of each day column in pixels
  const totalWidth = days.length * dayWidth;

  const getTaskPosition = (task: DesignTask) => {
    if (!task.start_date || !task.end_date) return null;
    
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);
    
    const startDayIndex = Math.max(0, Math.floor((taskStart.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const endDayIndex = Math.min(days.length - 1, Math.floor((taskEnd.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const left = startDayIndex * dayWidth;
    const width = Math.max(dayWidth, (endDayIndex - startDayIndex + 1) * dayWidth);
    
    return { left, width };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (phases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay tareas para mostrar en el cronograma</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="sticky top-0 bg-background z-10 border-b">
        <div className="flex">
          {/* Phase column header */}
          <div className="w-64 flex-shrink-0 p-3 border-r bg-muted/30">
            <div className="text-sm font-medium">Fases y Tareas</div>
          </div>
          
          {/* Timeline header */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex" style={{ width: totalWidth }}>
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 p-2 text-center border-l text-xs ${
                    isToday(day) 
                      ? 'bg-accent text-accent-foreground font-medium' 
                      : 'text-muted-foreground'
                  }`}
                  style={{ width: dayWidth }}
                >
                  <div className="font-medium">{day.getDate()}</div>
                  <div className="text-xs opacity-70">
                    {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Body */}
      <div className="space-y-1">
        {phases.map((phase) => (
          <div key={phase.id} className="border border-border rounded-lg overflow-hidden">
            {/* Phase Header */}
            <div className="flex">
              <div className="w-64 flex-shrink-0 p-3 border-r bg-muted/20">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{phase.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {phase.tasks.length} tareas
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-x-auto bg-muted/10">
                <div className="relative h-12" style={{ width: totalWidth }}>
                  {/* Phase background */}
                  <div className="absolute inset-0 bg-muted/5"></div>
                </div>
              </div>
            </div>

            {/* Tasks */}
            {phase.tasks.map((task) => (
              <div key={task.id} className="flex border-t">
                <div className="w-64 flex-shrink-0 p-3 border-r bg-background">
                  <div className="flex items-center gap-2">
                    <div className="w-4"></div> {/* Indent for task */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm truncate">{task.name}</div>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            color: getStatusColor(task.status),
                            borderColor: getStatusColor(task.status)
                          }}
                        >
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-x-auto">
                  <div className="relative h-16" style={{ width: totalWidth }}>
                    {/* Task bar */}
                    {(() => {
                      const position = getTaskPosition(task);
                      if (!position) return null;
                      
                      return (
                        <div
                          className="absolute top-4 h-8 rounded-md border shadow-sm flex items-center px-2"
                          style={{
                            left: position.left,
                            width: position.width,
                            backgroundColor: getStatusColor(task.status) + '20',
                            borderColor: getStatusColor(task.status),
                            minWidth: dayWidth
                          }}
                        >
                          <div className="text-xs font-medium truncate" style={{ color: getStatusColor(task.status) }}>
                            {task.name}
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Today indicator line */}
                    {(() => {
                      const today = new Date();
                      const todayIndex = Math.floor((today.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
                      if (todayIndex >= 0 && todayIndex < days.length) {
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-accent opacity-70"
                            style={{ left: todayIndex * dayWidth + dayWidth / 2 }}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center gap-6">
          <div className="text-sm font-medium">Estado de las tareas:</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: getStatusColor('pending') + '20', borderColor: getStatusColor('pending') }}
              />
              <span className="text-sm">Por hacer</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: getStatusColor('in_progress') + '20', borderColor: getStatusColor('in_progress') }}
              />
              <span className="text-sm">En progreso</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: getStatusColor('completed') + '20', borderColor: getStatusColor('completed') }}
              />
              <span className="text-sm">Completado</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}