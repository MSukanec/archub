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
    >
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpanded(concept.id)}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
              ) : (
              )
            ) : (
            )}
          </Button>

          {/* Concept Name and Info */}
              
              {/* System/User Badge */}
              <Badge 
                variant={concept.is_system ? "default" : "secondary"} 
                className={`text-xs ${concept.is_system ? 'bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]' : ''}`}
              >
                {concept.is_system ? (
                  'Sistema'
                ) : (
                )}
              </Badge>

              {/* Children count */}
              {hasChildren && (
                  {concept.children!.length} elementos
                </Badge>
              )}
            </div>
            
            {/* Description - small text below name */}
            {concept.description && (
                {concept.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateChild(concept)}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(concept)}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(concept.id)}
          >
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
                {renderConcepts(concept.children, currentLevel + 1)}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    ));
  };

  return (
      {renderConcepts(concepts, level)}
    </div>
  );
}