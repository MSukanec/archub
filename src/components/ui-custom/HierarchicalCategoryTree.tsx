import { useState } from 'react';
import { ChevronRight, ChevronDown, Edit, Trash2, FileText, Plus, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
// Remove the import since TaskGroupAdmin doesn't exist
// import { TaskGroupAdmin } from '@/hooks/use-task-categories-admin';

interface CategoryTreeNode {
  id: string;
  name: string;
  code?: string;
  children?: CategoryTreeNode[];
  taskGroups?: any[];
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
  onAddTaskGroup?: (category: CategoryTreeNode) => void;
  onEditTaskGroup?: (taskGroup: any, category: CategoryTreeNode) => void;
  onDeleteTaskGroup?: (taskGroupId: string) => void;
  onCreateChild?: (category: CategoryTreeNode) => void;

  level?: number;
}

export function HierarchicalCategoryTree({
  categories,
  expandedCategories,
  onToggleExpanded,
  onEdit,
  onDelete,
  onTemplate,
  onAddTaskGroup,
  onEditTaskGroup,
  onDeleteTaskGroup,
  onCreateChild,

  level = 0
}: HierarchicalCategoryTreeProps) {
  const hasChildren = (category: CategoryTreeNode) => category.children && category.children.length > 0;
  
  const renderCategory = (category: CategoryTreeNode, currentLevel: number) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildCategories = hasChildren(category);
    
    // Calculate indentation based on level
    const indentation = currentLevel * 24; // 24px per level for better hierarchy
    
    // Calculate template completion based on task groups (NEW LOGIC)
    const getTemplateCompletion = (cat: CategoryTreeNode): { completed: number; total: number } => {
      // Si es categoría final (3 letras) y tiene task groups, contar sus plantillas
      if (cat.code && cat.code.length === 3 && cat.taskGroups && cat.taskGroups.length > 0) {
        const completed = cat.taskGroups.filter(tg => {
          const hasTemplate = tg.template_id !== null && tg.template_id !== undefined && tg.template_id !== '';
          return hasTemplate;
        }).length;
        const total = cat.taskGroups.length;
        return { completed, total };
      }
      
      // Si tiene hijos, agregar completions de sus hijos
      if (cat.children && cat.children.length > 0) {
        let completed = 0;
        let total = 0;
        cat.children.forEach(child => {
          const childCompletion = getTemplateCompletion(child);
          completed += childCompletion.completed;
          total += childCompletion.total;
        });
        return { completed, total };
      }
      
      return { completed: 0, total: 0 };
    };
    
    const templateCompletion = getTemplateCompletion(category);
    const hasIncompleteTemplates = templateCompletion.total > 0 && templateCompletion.completed < templateCompletion.total;
    
    return (
      <div key={category.id} className="w-full">
        {/* Category Item */}
        <div 
          className={`group flex items-center justify-between rounded-md p-2 mb-1 hover:bg-accent/50 transition-colors cursor-pointer ${
            hasIncompleteTemplates ? 'bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-800' : 'bg-card border border-border'
          }`}
          style={{ marginLeft: `${indentation}px` }}
          onClick={() => hasChildCategories && onToggleExpanded(category.id)}
        >
          {/* Left side: Chevron + Category info */}
          <div className="flex items-center space-x-2 flex-1">
            {/* Chevron or placeholder */}
            {hasChildCategories ? (
              <div className="h-5 w-5 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </div>
            ) : (
              <div className="w-5 flex justify-center">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              </div>
            )}
            
            {/* Category name and badges */}
            <div className="flex items-center space-x-2 flex-1">
              <span className="text-sm font-medium text-foreground">{category.name}</span>
              {category.code && (
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    {category.code}
                  </Badge>
                  {templateCompletion.total > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({templateCompletion.completed}/{templateCompletion.total})
                    </span>
                  )}
                </div>
              )}

            </div>
          </div>
          
          {/* Right side: Action buttons - +, EDITAR, BORRAR */}
          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
            {/* Botón + para crear categoría hija (siempre visible) */}
            {onCreateChild && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateChild(category)}
                className=" hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Crear categoría hija"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            
            {/* Botón + para Agregar Grupo de Tareas (solo en categorías finales de 3 letras) */}
            {category.code && category.code.length === 3 && onAddTaskGroup && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddTaskGroup(category)}
                className=" hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Agregar Grupo de Tareas"
              >
                <Layers className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
              className=" hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Editar"
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category.id)}
              className=" hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
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
              onAddTaskGroup={onAddTaskGroup}
              onEditTaskGroup={onEditTaskGroup}
              onDeleteTaskGroup={onDeleteTaskGroup}
              onCreateChild={onCreateChild}

              level={currentLevel + 1}
            />
          </div>
        )}

        {/* Task Groups - 4th level (show for 3rd level categories with 3-letter codes) */}
        {category.code && category.code.length === 3 && category.taskGroups && category.taskGroups.length > 0 && isExpanded && (
          <div className="mt-1">
            {category.taskGroups.map(taskGroup => (
              <div 
                key={taskGroup.id}
                className="flex items-center justify-between rounded-md p-2 mb-1 hover:bg-accent/30 transition-colors border-l-2 border-accent bg-accent/10"
                style={{ marginLeft: `${(currentLevel + 1) * 24}px` }}
              >
                {/* Left side: Task group info */}
                <div className="flex items-center space-x-2 flex-1">
                  <div className="w-5 flex justify-center">
                    <Layers className="w-3 h-3 text-accent" />
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-sm font-medium text-accent">{taskGroup.name}</span>

                  </div>
                </div>
                
                {/* Right side: Task group actions - SAME AS CATEGORIES */}
                <div className="flex items-center space-x-1">


                  {onEditTaskGroup && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditTaskGroup(taskGroup, category)}
                      className=" hover:bg-accent text-muted-foreground hover:text-foreground"
                      title="Editar"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {onDeleteTaskGroup && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteTaskGroup(taskGroup.id)}
                      className=" hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
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