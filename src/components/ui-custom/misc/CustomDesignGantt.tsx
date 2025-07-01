import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Edit, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState';
import { TaskBar } from '@/components/ui-custom/misc/TaskBar';
import { useDeleteDesignProjectPhase, useDesignPhaseTasks } from '@/hooks/use-design-phases';
import { useToast } from '@/hooks/use-toast';

interface DesignProjectPhase {
  id: string;
  design_phase_id: string;
  start_date: string | null;
  end_date: string | null;
  design_phases: {
    id: string;
    name: string;
  };
  tasks?: any[];
}

interface CustomDesignGanttProps {
  phases: DesignProjectPhase[];
  searchValue: string;
  projectId: string;
  onEditPhase: (phase: DesignProjectPhase) => void;
  onAddTask: (phaseId: string) => void;
  onCreatePhase: () => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function CustomDesignGantt({ 
  phases, 
  searchValue, 
  projectId, 
  onEditPhase, 
  onAddTask,
  onCreatePhase,
  onEditTask,
  onDeleteTask
}: CustomDesignGanttProps) {
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const { toast } = useToast();
  const deletePhase = useDeleteDesignProjectPhase();
  const { data: tasks = [] } = useDesignPhaseTasks(projectId);

  // Generate timeline header - current month with day numbers
  const generateTimelineHeader = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return { 
      monthName: monthNames[currentMonth], 
      days,
      today: today.getDate()
    };
  };

  const { monthName, days, today } = generateTimelineHeader();

  // Function to calculate bar position based on dates
  const calculateBarPosition = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Check if dates are in current month
    if (start.getMonth() !== currentMonth || start.getFullYear() !== currentYear) return null;
    
    const startDay = start.getDate();
    const endDay = end.getDate();
    const duration = endDay - startDay + 1;
    
    return {
      left: `${(startDay - 1) * 32}px`,
      width: `${duration * 32}px`
    };
  };

  // Get tasks for a specific phase
  const getTasksForPhase = (phaseId: string) => {
    return tasks.filter(task => task.project_phase_id === phaseId);
  };

  // Filter phases based on search
  const filteredPhases = phases.filter(phase =>
    phase.design_phases.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleDeletePhase = async (phaseId: string, phaseName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la fase "${phaseName}"?`)) {
      try {
        await deletePhase.mutateAsync({ id: phaseId, projectId });
        toast({
          title: "Fase eliminada",
          description: "La fase ha sido eliminada exitosamente.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar la fase. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleAccordion = (phaseId: string) => {
    setOpenAccordions(prev => 
      prev.includes(phaseId) 
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  if (filteredPhases.length === 0) {
    return (
      <CustomEmptyState
        title="No hay fases de diseño"
        description="Comienza creando una nueva fase de diseño para organizar las tareas del proyecto."
      />
    );
  }

  return (
    <div className="w-full">
      <Card className="overflow-hidden">
        {/* Main Container */}
        <div className="flex">
          {/* Left Panel - Elements */}
          <div className="w-64 border-r bg-muted/30">
            {/* Left Panel Header */}
            <div className="h-12 flex items-center px-4 border-b bg-muted/50">
              <h3 className="text-sm font-medium text-muted-foreground">Elementos</h3>
            </div>
            
            {/* Phase List */}
            <div className="p-2">
              {filteredPhases.map((phase) => {
                const isOpen = openAccordions.includes(phase.id);
                
                return (
                  <div key={phase.id} className="mb-1">
                    {/* Phase Header */}
                    <div className="flex items-center justify-between group hover:bg-muted/50 rounded p-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={() => toggleAccordion(phase.id)}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                        
                        <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-100 flex-shrink-0" />
                        
                        <span className="text-sm font-medium text-blue-700">
                          {phase.design_phases.name}
                        </span>
                      </div>

                      {/* Phase Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onAddTask(phase.id)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditPhase(phase)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeletePhase(phase.id, phase.design_phases.name)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Tasks (when accordion is open) - REAL Supabase data */}
                    {isOpen && (
                      <div className="ml-6 space-y-1">
                        {getTasksForPhase(phase.id).length > 0 ? (
                          getTasksForPhase(phase.id).map((task) => (
                            <div key={task.id} className="flex items-center gap-2 p-1 hover:bg-muted/30 rounded group">
                              <div className="w-4 h-4 flex-shrink-0">
                                <span className="text-xs">
                                  {task.status === 'completed' ? '✅' : 
                                   task.status === 'in_progress' ? '🔄' : 
                                   task.status === 'on_hold' ? '⏸️' : '📋'}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground flex-1 truncate">
                                {task.name}
                              </span>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                                      <MoreHorizontal className="h-2 w-2" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEditTask(task.id)}>
                                      <Edit className="mr-2 h-3 w-3" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => onDeleteTask(task.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-3 w-3" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-muted-foreground italic pl-6">
                            No hay tareas en esta fase
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Create Button */}
              <Button 
                variant="ghost" 
                className="w-full justify-start h-8 text-xs text-muted-foreground mt-2"
                onClick={onCreatePhase}
              >
                <Plus className="h-3 w-3 mr-2" />
                Crear
              </Button>
            </div>
          </div>

          {/* Right Panel - Timeline */}
          <div className="flex-1 overflow-x-auto">
            {/* Timeline Header */}
            <div className="h-12 flex">
              {/* Month columns */}
              <div className="flex border-b bg-muted/50">
                {/* Current month header spanning multiple days */}
                <div className="flex">
                  {days.map((day, index) => (
                    <div 
                      key={day} 
                      className={`w-8 h-12 flex flex-col items-center justify-center border-r text-xs ${
                        day === today ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                    >
                      {index === 0 && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {monthName.slice(0, 3)}
                        </span>
                      )}
                      <span className={`font-medium ${day === today ? 'text-blue-600' : 'text-muted-foreground'}`}>
                        {day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Content */}
            <div className="relative">
              {/* Calculate total height for lines */}
              {(() => {
                const totalPhaseRows = filteredPhases.length;
                const totalTaskRows = filteredPhases.reduce((acc, phase) => {
                  return acc + (openAccordions.includes(phase.id) ? getTasksForPhase(phase.id).length : 0);
                }, 0);
                const totalHeight = (totalPhaseRows * 40) + (totalTaskRows * 32);
                
                return (
                  <>
                    {/* Vertical grid lines extending full height */}
                    {days.map((day, index) => (
                      <div
                        key={`vline-${day}`}
                        className="absolute top-0 w-px bg-gray-200 z-0"
                        style={{ 
                          left: `${(index + 1) * 32}px`,
                          height: `${Math.max(totalHeight, 200)}px`
                        }}
                      />
                    ))}
                    
                    {/* Today indicator line extending full height */}
                    <div 
                      className="absolute top-0 w-0.5 bg-blue-400 z-10"
                      style={{ 
                        left: `${(today - 1) * 32 + 16}px`,
                        height: `${Math.max(totalHeight, 200)}px`
                      }}
                    />
                  </>
                );
              })()}
              
              {filteredPhases.map((phase, phaseIndex) => {
                const phaseTasks = getTasksForPhase(phase.id);
                return (
                  <div key={phase.id} className="relative">
                    {/* Phase timeline row - NO BARS for phases */}
                    <div className="h-10 flex items-center border-b relative">
                      {days.map((day) => (
                        <div key={day} className="w-8 h-10" />
                      ))}
                    </div>

                    {/* Task rows (when accordion is open) - using REAL Supabase data */}
                    {openAccordions.includes(phase.id) && phaseTasks.length > 0 && phaseTasks.map((task) => {
                      const barPosition = calculateBarPosition(task.start_date || null, task.end_date || null);
                      return (
                        <div key={task.id} className="h-8 flex items-center border-b bg-gray-50 relative">
                          {/* Day grid cells */}
                          {days.map((day) => (
                            <div key={day} className="w-8 h-8" />
                          ))}
                          
                          {/* TaskBar component with real data */}
                          <TaskBar 
                            task={task}
                            position={barPosition}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                          />
                        </div>
                      );
                    })}
                    
                    {/* Show empty state if no tasks in opened phase */}
                    {openAccordions.includes(phase.id) && phaseTasks.length === 0 && (
                      <div className="h-8 flex items-center border-b bg-gray-50 relative">
                        {days.map((day) => (
                          <div key={day} className="w-8 h-8" />
                        ))}
                        <div className="absolute left-4 top-1 text-xs text-muted-foreground">
                          No hay tareas en esta fase
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}