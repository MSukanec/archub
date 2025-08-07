import { useState } from 'react';
import { ChevronRight, ChevronDown, Edit, Trash2, Settings, User, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MovementConceptAdmin } from '@/hooks/use-movement-concepts-admin';

interface MovementConceptTreeProps {
  concepts: MovementConceptAdmin[];
  expandedConcepts: Set<string>;
  onToggleExpand: (conceptId: string) => void;
  onEdit: (concept: MovementConceptAdmin) => void;
  onDelete: (conceptId: string) => void;
}

export function MovementConceptTree({
  concepts,
  expandedConcepts,
  onToggleExpand,
  onEdit,
  onDelete
}: MovementConceptTreeProps) {
  return (
      {concepts.map((concept) => (
        <ConceptRow
          key={concept.id}
          concept={concept}
          level={0}
          expandedConcepts={expandedConcepts}
          onToggleExpand={onToggleExpand}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface ConceptRowProps {
  concept: MovementConceptAdmin;
  level: number;
  expandedConcepts: Set<string>;
  onToggleExpand: (conceptId: string) => void;
  onEdit: (concept: MovementConceptAdmin) => void;
  onDelete: (conceptId: string) => void;
}

function ConceptRow({
  concept,
  level,
  expandedConcepts,
  onToggleExpand,
  onEdit,
  onDelete
}: ConceptRowProps) {
  const hasChildren = concept.children && concept.children.length > 0;
  const isExpanded = expandedConcepts.has(concept.id);
  
  return (
    <>
      {/* Main row */}
      <div 
        style={{ marginLeft: `${level * 24}px` }}
      >
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => hasChildren && onToggleExpand(concept.id)}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
              ) : (
              )
            ) : (
            )}
          </Button>

          {/* Concept Name */}
          
          {/* System/User Badge */}
            {concept.is_system ? (
              <>
                Sistema
              </>
            ) : (
              <>
                Usuario
              </>
            )}
          </Badge>

          {/* View Mode Badge */}
          {concept.view_mode && (
              {concept.view_mode === 'types' && 'Tipos'}
              {concept.view_mode === 'categories' && 'Categorías'} 
              {concept.view_mode === 'subcategories' && 'Subcategorías'}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
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

      {/* Children rows */}
      {hasChildren && isExpanded && concept.children?.map((child) => (
        <ConceptRow
          key={child.id}
          concept={child}
          level={level + 1}
          expandedConcepts={expandedConcepts}
          onToggleExpand={onToggleExpand}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}