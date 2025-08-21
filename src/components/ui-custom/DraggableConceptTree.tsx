import React from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Edit, 
  Trash2, 
  Settings, 
  Users,
  Plus,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

export interface MovementConceptNode {
  id: string;
  name: string;
  description?: string;
  parent_id: string | null;
  is_system: boolean;
  view_mode?: string;
  children?: MovementConceptNode[];
}

interface ConceptItemProps {
  concept: MovementConceptNode;
  level: number;
  isExpanded: boolean;
  onToggleExpanded: (conceptId: string) => void;
  onEdit: (concept: MovementConceptNode) => void;
  onDelete: (conceptId: string) => void;
  onCreateChild: (parentConcept: MovementConceptNode) => void;
}

function ConceptItem({
  concept,
  level,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  onCreateChild,
}: ConceptItemProps) {
  const hasChildren = concept.children && concept.children.length > 0;

  return (
    <div
      style={{ marginLeft: `${level * 24}px` }}
      className="group relative border rounded-lg p-3 transition-all duration-200 hover:border-accent/50 bg-[var(--card-bg)] border-[var(--card-border)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="icon-sm"
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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground">{concept.name}</h4>
              
              {/* System/User Badge */}
              <Badge 
                variant={concept.is_system ? "default" : "secondary"} 
                className={`text-xs ${concept.is_system ? 'bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]' : ''}`}
              >
                {concept.is_system ? (
                  'Sistema'
                ) : (
                  <><Building2 className="h-3 w-3 mr-1" />Organización</>
                )}
              </Badge>

              {/* Children count */}
              {hasChildren && (
                <Badge variant="outline" className="text-xs">
                  {concept.children!.length} elementos
                </Badge>
              )}
            </div>
            
            {/* Description - small text below name */}
            {concept.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-tight">
                {concept.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-sm"
            className=""
            onClick={() => onCreateChild(concept)}
            title="Crear concepto hijo"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className=""
            onClick={() => onEdit(concept)}
            title="Editar concepto"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className=" text-destructive hover:text-destructive"
            onClick={() => onDelete(concept.id)}
            title="Eliminar concepto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DraggableConceptTreeProps {
  concepts: MovementConceptNode[];
  expandedConcepts: Set<string>;
  onToggleExpanded: (conceptId: string) => void;
  onEdit: (concept: MovementConceptNode) => void;
  onDelete: (conceptId: string) => void;
  onCreateChild: (parentConcept: MovementConceptNode) => void;
  onMoveToParent: (conceptId: string, newParentId: string | null) => void;
  level?: number;
}

export function DraggableConceptTree({
  concepts,
  expandedConcepts,
  onToggleExpanded,
  onEdit,
  onDelete,
  onCreateChild,
  onMoveToParent,
  level = 0,
}: DraggableConceptTreeProps) {
  
  // Render concepts recursively
  const renderConcepts = (concepts: MovementConceptNode[], currentLevel: number): React.ReactNode => {
    return concepts.map((concept) => (
      <div key={concept.id}>
        <ConceptItem
          concept={concept}
          level={currentLevel}
          isExpanded={expandedConcepts.has(concept.id)}
          onToggleExpanded={onToggleExpanded}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreateChild={onCreateChild}
        />
        {/* Render children if expanded */}
        {concept.children && concept.children.length > 0 && expandedConcepts.has(concept.id) && (
          <Collapsible open={true}>
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
    <div className="space-y-2">
      {renderConcepts(concepts, level)}
    </div>
  );
}