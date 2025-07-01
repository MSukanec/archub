import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { ChevronDown, ChevronRight, Calendar, Trash2, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { DesignProjectPhase, useUpdateDesignProjectPhasePosition, useDeleteDesignProjectPhase } from '@/hooks/use-design-phases';
import { CustomEmptyState } from './CustomEmptyState';

interface CustomDesignGanttProps {
  phases: DesignProjectPhase[];
  searchValue: string;
  projectId: string;
}

export function CustomDesignGantt({ phases, searchValue, projectId }: CustomDesignGanttProps) {
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);
  
  const updatePositionMutation = useUpdateDesignProjectPhasePosition();
  const deletePhaseMutation = useDeleteDesignProjectPhase();

  // Filter phases based on search
  const filteredPhases = phases.filter(phase =>
    phase.design_phases.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev =>
      prev.includes(phaseId)
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Reorder phases array
    const reorderedPhases = Array.from(filteredPhases);
    const [removed] = reorderedPhases.splice(sourceIndex, 1);
    reorderedPhases.splice(destinationIndex, 0, removed);

    // Update positions in database
    const updates = reorderedPhases.map((phase, index) => ({
      id: phase.id,
      position: index,
      projectId: projectId
    }));

    for (const update of updates) {
      try {
        await updatePositionMutation.mutateAsync(update);
      } catch (error) {
        console.error('Error updating phase position:', error);
      }
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    try {
      await deletePhaseMutation.mutateAsync({ id: phaseId, projectId });
    } catch (error) {
      console.error('Error deleting phase:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin fecha';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (filteredPhases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay fases de diseño</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Comienza agregando una nueva fase de diseño al cronograma del proyecto.
        </p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cronograma de Fases de Diseño</h3>
          <Badge variant="secondary">
            {filteredPhases.length} fase{filteredPhases.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="phases-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {filteredPhases.map((phase, index) => (
                  <Draggable
                    key={phase.id}
                    draggableId={phase.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`
                          border rounded-lg bg-card transition-all duration-200
                          ${snapshot.isDragging ? 'shadow-lg rotate-1' : 'shadow-sm'}
                        `}
                      >
                        <Accordion
                          type="single"
                          collapsible
                          value={expandedPhases.includes(phase.id) ? phase.id : ''}
                          onValueChange={(value) => {
                            if (value) {
                              setExpandedPhases(prev => [...prev.filter(id => id !== phase.id), value]);
                            } else {
                              setExpandedPhases(prev => prev.filter(id => id !== phase.id));
                            }
                          }}
                        >
                          <AccordionItem value={phase.id} className="border-0">
                            <div className="flex items-center gap-2 p-4">
                              {/* Drag handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>

                              {/* Phase info */}
                              <AccordionTrigger className="flex-1 hover:no-underline p-0">
                                <div className="flex items-center justify-between w-full pr-2">
                                  <div className="flex items-center gap-3">
                                    <div className="text-left">
                                      <div className="font-medium text-sm">
                                        {phase.design_phases.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {formatDate(phase.start_date)} - {formatDate(phase.end_date)}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      Fase de Diseño
                                    </Badge>
                                  </div>
                                </div>
                              </AccordionTrigger>

                              {/* Delete button */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar fase?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará permanentemente la fase "{phase.design_phases.name}" del cronograma.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeletePhase(phase.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>

                            <AccordionContent className="px-4 pb-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Información de la Fase</h4>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <div>
                                      <span className="font-medium">Nombre:</span> {phase.design_phases.name}
                                    </div>
                                    <div>
                                      <span className="font-medium">Tipo:</span> Fase de Diseño
                                    </div>
                                    <div>
                                      <span className="font-medium">Creado:</span> {formatDate(phase.created_at)}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Cronograma</h4>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <div>
                                      <span className="font-medium">Inicio:</span> {formatDate(phase.start_date)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Fin:</span> {formatDate(phase.end_date)}
                                    </div>
                                    {phase.start_date && phase.end_date && (
                                      <div>
                                        <span className="font-medium">Duración:</span> Calculando...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Future: Tasks will be added here */}
                              <div className="mt-4 p-3 bg-muted/50 rounded border-dashed border">
                                <div className="text-center text-xs text-muted-foreground">
                                  Las tareas de diseño se agregarán aquí próximamente
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}