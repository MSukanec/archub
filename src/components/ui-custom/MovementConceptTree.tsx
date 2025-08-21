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
    <div className="space-y-1">
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
        className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg border border-transparent hover:border-border transition-colors"
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className=""
            onClick={() => hasChildren && onToggleExpand(concept.id)}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {/* Concept Name */}
          <span className="font-medium text-foreground">{concept.name}</span>
          
          {/* System/User Badge */}
          <Badge variant={concept.is_system ? "default" : "secondary"} className="text-xs">
            {concept.is_system ? (
              <>
                <Settings className="h-3 w-3 mr-1" />
                Sistema
              </>
            ) : (
              <>
                <User className="h-3 w-3 mr-1" />
                Usuario
              </>
            )}
          </Badge>

          {/* View Mode Badge */}
          {concept.view_mode && (
            <Badge variant="outline" className="text-xs">
              {concept.view_mode === 'types' && 'Tipos'}
              {concept.view_mode === 'categories' && 'Categorías'} 
              {concept.view_mode === 'subcategories' && 'Subcategorías'}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(concept)}
            className=" text-muted-foreground hover:text-foreground"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(concept.id)}
            className=" text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
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