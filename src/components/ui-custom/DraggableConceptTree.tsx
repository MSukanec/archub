import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  ChevronRight, 
  ChevronDown, 
  Edit, 
  Trash2, 
  Settings, 
  Users, 
  GripVertical 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface MovementConceptNode {
  id: string;
  name: string;
  parent_id: string | null;
  is_system: boolean;
  view_mode?: string;
  children?: MovementConceptNode[];
}

interface DraggableConceptItemProps {
  concept: MovementConceptNode;
  level: number;
  isExpanded: boolean;
  onToggleExpanded: (conceptId: string) => void;
  onEdit: (concept: MovementConceptNode) => void;
  onDelete: (conceptId: string) => void;
  isDragOverlay?: boolean;
}

function DraggableConceptItem({
  concept,
  level,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  isDragOverlay = false,
}: DraggableConceptItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: concept.id,
    data: {
      type: 'concept',
      concept,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = concept.children && concept.children.length > 0;
  const indentation = level * 24;

  const ItemContent = () => (
    <div
      ref={setNodeRef}
      style={{ 
        ...style,
        marginLeft: `${indentation}px`
      }}
      className={`
        group relative border rounded-lg p-3 transition-all duration-200
        ${isDragging ? 'opacity-50' : ''}
        ${isDragOverlay ? 'shadow-xl bg-background border-accent' : 'hover:border-accent/50 bg-card border-border'}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-6 w-6"
            onClick={() => onToggleExpanded(concept.id)}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </Button>

          {/* Concept Name and Info */}
          <div className="flex items-center gap-2 flex-1">
            <h4 className="font-medium text-foreground">{concept.name}</h4>
            
            {/* System/User Badge */}
            <Badge variant={concept.is_system ? "default" : "secondary"} className="text-xs">
              {concept.is_system ? (
                <><Settings className="h-3 w-3 mr-1" />Sistema</>
              ) : (
                <><Users className="h-3 w-3 mr-1" />Usuario</>
              )}
            </Badge>

            {/* Children count */}
            {hasChildren && (
              <Badge variant="outline" className="text-xs">
                {concept.children!.length} hijos
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(concept)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(concept.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <ItemContent />
    </div>
  );
}

interface DraggableConceptTreeProps {
  concepts: MovementConceptNode[];
  expandedConcepts: Set<string>;
  onToggleExpanded: (conceptId: string) => void;
  onEdit: (concept: MovementConceptNode) => void;
  onDelete: (conceptId: string) => void;
  onMoveToParent: (conceptId: string, newParentId: string | null) => void;
  level?: number;
}

export function DraggableConceptTree({
  concepts,
  expandedConcepts,
  onToggleExpanded,
  onEdit,
  onDelete,
  onMoveToParent,
  level = 0,
}: DraggableConceptTreeProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [draggedConcept, setDraggedConcept] = React.useState<MovementConceptNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the dragged concept
    const findConcept = (concepts: MovementConceptNode[], id: string): MovementConceptNode | null => {
      for (const concept of concepts) {
        if (concept.id === id) {
          return concept;
        }
        if (concept.children) {
          const found = findConcept(concept.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const concept = findConcept(concepts, active.id as string);
    setDraggedConcept(concept);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      setDraggedConcept(null);
      return;
    }

    // Check if we're dropping on a valid target
    const overId = over.id as string;
    const activeId = active.id as string;

    // Find the target concept to become new parent
    const findConcept = (concepts: MovementConceptNode[], id: string): MovementConceptNode | null => {
      for (const concept of concepts) {
        if (concept.id === id) {
          return concept;
        }
        if (concept.children) {
          const found = findConcept(concept.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const targetConcept = findConcept(concepts, overId);
    
    if (targetConcept) {
      // Don't allow dropping on self or children
      const isDescendant = (parentId: string, childId: string): boolean => {
        const parent = findConcept(concepts, parentId);
        if (!parent || !parent.children) return false;
        
        return parent.children.some(child => 
          child.id === childId || isDescendant(child.id, childId)
        );
      };

      if (activeId !== overId && !isDescendant(activeId, overId)) {
        onMoveToParent(activeId, targetConcept.id);
      }
    }

    setActiveId(null);
    setDraggedConcept(null);
  };

  const getAllConceptIds = (concepts: MovementConceptNode[]): string[] => {
    const ids: string[] = [];
    concepts.forEach(concept => {
      ids.push(concept.id);
      if (concept.children) {
        ids.push(...getAllConceptIds(concept.children));
      }
    });
    return ids;
  };

  const conceptIds = getAllConceptIds(concepts);

  const renderConcepts = (concepts: MovementConceptNode[], currentLevel: number) => {
    return concepts.map((concept) => (
      <div key={concept.id}>
        <DraggableConceptItem
          concept={concept}
          level={currentLevel}
          isExpanded={expandedConcepts.has(concept.id)}
          onToggleExpanded={onToggleExpanded}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        {/* Render children if expanded */}
        {concept.children && concept.children.length > 0 && expandedConcepts.has(concept.id) && (
          <Collapsible open={expandedConcepts.has(concept.id)}>
            <CollapsibleContent className="mt-2">
              <div className="space-y-2">
                {renderConcepts(concept.children, currentLevel + 1)}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    ));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={conceptIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {renderConcepts(concepts, level)}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId && draggedConcept ? (
          <DraggableConceptItem
            concept={draggedConcept}
            level={0}
            isExpanded={false}
            onToggleExpanded={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            isDragOverlay={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}