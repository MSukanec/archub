import { useState } from 'react';
import { ChevronRight, ChevronDown, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CategoryTreeNode {
  id: string;
  name: string;
  code?: string;
  children?: CategoryTreeNode[];
  template?: any;
  parent_id?: string | null;
}

interface HierarchicalCategoryTreeProps {
  categories: CategoryTreeNode[];
  expandedCategories: Set<string>;
  onToggleExpanded: (categoryId: string) => void;
  onEdit: (category: CategoryTreeNode) => void;
  onDelete: (categoryId: string) => void;
  onTemplate: (category: CategoryTreeNode) => void;
  level?: number;
}

export function HierarchicalCategoryTree({
  categories,
  expandedCategories,
  onToggleExpanded,
  onEdit,
  onDelete,
  onTemplate,
  level = 0
}: HierarchicalCategoryTreeProps) {
  const hasChildren = (category: CategoryTreeNode) => category.children && category.children.length > 0;
  
  const renderCategory = (category: CategoryTreeNode, currentLevel: number) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildCategories = hasChildren(category);
    
    // Calculate indentation based on level
    const indentation = currentLevel * 24; // 24px per level for better hierarchy
    
    return (
      <div key={category.id} className="w-full">
        {/* Category Item */}
        <div 
          className="group flex items-center justify-between bg-card border border-border rounded-md p-2 mb-1 hover:bg-accent/50 transition-colors"
          style={{ marginLeft: `${indentation}px` }}
        >
          {/* Left side: Chevron + Category info */}
          <div className="flex items-center space-x-2 flex-1">
            {/* Chevron or placeholder */}
            {hasChildCategories ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 hover:bg-accent"
                onClick={() => onToggleExpanded(category.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            ) : (
              <div className="w-5 flex justify-center">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              </div>
            )}
            
            {/* Category name and badges */}
            <div className="flex items-center space-x-2 flex-1">
              <span className="text-sm font-medium text-foreground">{category.name}</span>
              {category.code && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {category.code}
                </Badge>
              )}
              {category.template && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  Con Plantilla
                </Badge>
              )}
            </div>
          </div>
          
          {/* Right side: Action buttons */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
              className="h-6 w-6 p-0 hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Editar"
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTemplate(category)}
              className="h-6 w-6 p-0 hover:bg-accent text-muted-foreground hover:text-foreground"
              disabled // Por ahora sin función
              title="Plantilla"
            >
              <FileText className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category.id)}
              className="h-6 w-6 p-0 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Children */}
        {hasChildCategories && isExpanded && (
          <div className="mt-1">
            <HierarchicalCategoryTree
              categories={category.children!}
              expandedCategories={expandedCategories}
              onToggleExpanded={onToggleExpanded}
              onEdit={onEdit}
              onDelete={onDelete}
              onTemplate={onTemplate}
              level={currentLevel + 1}
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-1">
      {categories.map(category => renderCategory(category, level))}
    </div>
  );
}