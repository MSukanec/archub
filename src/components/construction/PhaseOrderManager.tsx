import React from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, GripVertical } from 'lucide-react'

interface Phase {
  id: string
  name: string
  position: number
  project_phase_id?: string
  taskCount?: number
}

interface PhaseOrderManagerProps {
  phases: Phase[]
  onReorder: (phases: Phase[]) => void
  onEdit: (phase: Phase) => void
  onDelete: (phaseId: string) => void
  isUpdating?: boolean
}

export function PhaseOrderManager({ 
  phases, 
  onReorder, 
  onEdit, 
  onDelete,
  isUpdating = false 
}: PhaseOrderManagerProps) {
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    
    // Debug logs removed
    
    const items = Array.from(phases)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    // Actualizar posiciones secuencialmente
    const updatedPhases = items.map((phase, index) => ({
      ...phase,
      position: index + 1
    }))
    
    // Debug logs removed
    
    onReorder(updatedPhases)
  }

  // Ordenar fases por posición para mostrar
  const sortedPhases = [...phases].sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="phases">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-3 min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-colors ${
                snapshot.isDraggingOver 
                  ? 'border-accent bg-accent/5' 
                  : 'border-muted-foreground/20'
              }`}
            >
              {sortedPhases.map((phase, index) => (
                <Draggable
                  key={phase.id}
                  draggableId={phase.id}
                  index={index}
                  isDragDisabled={isUpdating}
                >
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`p-4 transition-all duration-200 ${
                        snapshot.isDragging 
                          ? 'shadow-lg rotate-1 scale-105 bg-background' 
                          : 'hover:shadow-md'
                      } ${isUpdating ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Drag Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="flex-shrink-0 p-2 -ml-2 rounded cursor-grab active:cursor-grabbing hover:bg-muted/50"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        
                        {/* Position Badge */}
                        <Badge variant="outline" className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium">
                          {phase.position}
                        </Badge>
                        
                        {/* Phase Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate">
                              {phase.name}
                            </h3>
                            {phase.taskCount !== undefined && (
                              <Badge variant="secondary" className="text-xs">
                                {phase.taskCount} tareas
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onEdit(phase)}
                            disabled={isUpdating}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onDelete(phase.project_phase_id || phase.id)}
                            disabled={isUpdating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {sortedPhases.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-sm">No hay fases en este proyecto</div>
                  <div className="text-xs mt-1">Arrastra y suelta para reordenar las fases</div>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {isUpdating && (
        <div className="text-center text-sm text-muted-foreground">
          Actualizando orden de fases...
        </div>
      )}
    </div>
  )
}