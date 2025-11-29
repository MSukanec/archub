import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

interface SortablePhaseItemProps {
  phase: Phase
  onEdit: (phase: Phase) => void
  onDelete: (phaseId: string) => void
  isUpdating: boolean
}

function SortablePhaseItem({ phase, onEdit, onDelete, isUpdating }: SortablePhaseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phase.id, disabled: isUpdating })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 transition-all duration-200 ${
        isDragging 
          ? 'shadow-lg rotate-1 scale-105 bg-background z-10' 
          : 'hover:shadow-md'
      } ${isUpdating ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
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
            size="sm"
            onClick={() => onEdit(phase)}
            disabled={isUpdating}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(phase.project_phase_id || phase.id)}
            disabled={isUpdating}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function PhaseOrderManager({ 
  phases, 
  onReorder, 
  onEdit, 
  onDelete,
  isUpdating = false 
}: PhaseOrderManagerProps) {
  
  const sortedPhases = [...phases].sort((a, b) => a.position - b.position)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) return
    
    const oldIndex = sortedPhases.findIndex(phase => phase.id === active.id)
    const newIndex = sortedPhases.findIndex(phase => phase.id === over.id)
    
    const items = arrayMove(sortedPhases, oldIndex, newIndex)
    
    const updatedPhases = items.map((phase, index) => ({
      ...phase,
      position: index + 1
    }))
    
    onReorder(updatedPhases)
  }

  return (
    <div className="space-y-4">
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedPhases.map(phase => phase.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            className="space-y-3 min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-colors border-muted-foreground/20"
          >
            {sortedPhases.map((phase) => (
              <SortablePhaseItem
                key={phase.id}
                phase={phase}
                onEdit={onEdit}
                onDelete={onDelete}
                isUpdating={isUpdating}
              />
            ))}
            
            {sortedPhases.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-sm">No hay fases en este proyecto</div>
                <div className="text-xs mt-1">Arrastra y suelta para reordenar las fases</div>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
      
      {isUpdating && (
        <div className="text-center text-sm text-muted-foreground">
          Actualizando orden de fases...
        </div>
      )}
    </div>
  )
}
