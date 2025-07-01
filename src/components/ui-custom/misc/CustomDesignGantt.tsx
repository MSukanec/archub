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
import { useDeleteDesignProjectPhase } from '@/hooks/use-design-phases';
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
}

export function CustomDesignGantt({ 
  phases, 
  searchValue, 
  projectId, 
  onEditPhase, 
  onAddTask 
}: CustomDesignGanttProps) {
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const { toast } = useToast();
  const deletePhase = useDeleteDesignProjectPhase();

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

  // Filter phases based on search
  const filteredPhases = phases.filter(phase =>
    phase.design_phases.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleDeletePhase = async (phaseId: string, phaseName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la fase "${phaseName}"?`)) {
      try {
        await deletePhase.mutateAsync(phaseId);
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
        actionLabel="Nueva Fase de Diseño"
        onAction={() => {}}
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

                    {/* Tasks (when accordion is open) */}
                    {isOpen && (
                      <div className="ml-6 space-y-1">
                        {/* Example tasks - replace with real data */}
                        <div className="flex items-center gap-2 p-1 hover:bg-muted/30 rounded">
                          <div className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">📋 Tarea 1</span>
                        </div>
                        <div className="flex items-center gap-2 p-1 hover:bg-muted/30 rounded">
                          <div className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">📋 Tarea 2</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Create Button */}
              <Button 
                variant="ghost" 
                className="w-full justify-start h-8 text-xs text-muted-foreground mt-2"
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
              {/* Today indicator line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-10"
                style={{ left: `${(today - 1) * 32 + 16}px` }}
              />
              
              {filteredPhases.map((phase, phaseIndex) => (
                <div key={phase.id} className="relative">
                  {/* Phase timeline row */}
                  <div className="h-10 flex items-center border-b relative">
                    {days.map((day) => (
                      <div key={day} className="w-8 h-10 border-r" />
                    ))}
                    
                    {/* Phase bar (example positioning) */}
                    <div 
                      className="absolute top-2 h-6 bg-gray-400 rounded-sm flex items-center justify-end pr-2"
                      style={{ 
                        left: `${8 * 32}px`, // Starting at day 8
                        width: `${6 * 32}px`  // Spanning 6 days
                      }}
                    >
                      <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                        <span className="text-[10px] text-gray-600">👤</span>
                      </div>
                    </div>
                  </div>

                  {/* Task rows (when accordion is open) */}
                  {openAccordions.includes(phase.id) && (
                    <>
                      <div className="h-8 flex items-center border-b bg-gray-50">
                        {days.map((day) => (
                          <div key={day} className="w-8 h-8 border-r" />
                        ))}
                        
                        {/* Task bar 1 */}
                        <div 
                          className="absolute h-4 bg-gray-500 rounded-sm flex items-center justify-end pr-1"
                          style={{ 
                            left: `${10 * 32}px`,
                            width: `${4 * 32}px`,
                            top: '2px'
                          }}
                        >
                          <div className="w-3 h-3 bg-white rounded-sm flex items-center justify-center">
                            <span className="text-[8px] text-gray-600">👤</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-8 flex items-center border-b bg-gray-50">
                        {days.map((day) => (
                          <div key={day} className="w-8 h-8 border-r" />
                        ))}
                        
                        {/* Task bar 2 */}
                        <div 
                          className="absolute h-4 bg-gray-500 rounded-sm flex items-center justify-end pr-1"
                          style={{ 
                            left: `${12 * 32}px`,
                            width: `${3 * 32}px`,
                            top: '2px'
                          }}
                        >
                          <div className="w-3 h-3 bg-white rounded-sm flex items-center justify-center">
                            <span className="text-[8px] text-gray-600">👤</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}