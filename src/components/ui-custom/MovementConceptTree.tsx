import { useState } from 'react';
import { ChevronRight, ChevronDown, Edit, Trash2, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
    <div className="space-y-2">
      {concepts.map((concept) => (
        <ConceptNode
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

interface ConceptNodeProps {
  concept: MovementConceptAdmin;
  level: number;
  expandedConcepts: Set<string>;
  onToggleExpand: (conceptId: string) => void;
  onEdit: (concept: MovementConceptAdmin) => void;
  onDelete: (conceptId: string) => void;
}

function ConceptNode({
  concept,
  level,
  expandedConcepts,
  onToggleExpand,
  onEdit,
  onDelete
}: ConceptNodeProps) {
  const hasChildren = concept.children && concept.children.length > 0;
  const isExpanded = expandedConcepts.has(concept.id);
  
  const marginLeft = level * 24; // 24px per level

  return (
    <div style={{ marginLeft: `${marginLeft}px` }}>
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Expand/Collapse Button */}
              {hasChildren ? (
                <Collapsible open={isExpanded} onOpenChange={() => onToggleExpand(concept.id)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              ) : (
                <div className="w-6" /> // Spacer for alignment
              )}

              {/* Concept Info */}
              <div className="flex items-center space-x-2">
                <span className="font-medium">{concept.name}</span>
                
                {/* System/User Badge */}
                <Badge variant={concept.is_system ? "default" : "secondary"}>
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
                <Badge variant="outline">
                  {concept.view_mode === 'types' && 'Tipos'}
                  {concept.view_mode === 'categories' && 'Categorías'}
                  {concept.view_mode === 'subcategories' && 'Subcategorías'}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(concept)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(concept.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Children */}
      {hasChildren && (
        <Collapsible open={isExpanded}>
          <CollapsibleContent className="space-y-2">
            {concept.children?.map((child) => (
              <ConceptNode
                key={child.id}
                concept={child}
                level={level + 1}
                expandedConcepts={expandedConcepts}
                onToggleExpand={onToggleExpand}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}