import React, { useState } from 'react';
import { Plus, Tag, Filter, X, TreePine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { HierarchicalTree } from '@/components/ui-custom/tables-and-trees/HierarchicalTree';

interface CategoryTreeNode {
  id: string;
  name: string;
  code?: string;
  children?: CategoryTreeNode[];
  taskGroups?: any[];
  template?: any;
  parent_id?: string | null;
  order?: number;
}

import { useTaskDivisionsAdmin, useAllTaskDivisions, useDeleteTaskDivision, useUpdateTaskDivisionsOrder, useUpdateTaskDivision, TaskDivisionAdmin } from '@/hooks/use-task-divisions-admin';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { toast } from '@/hooks/use-toast';

const AdminTaskDivisions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // New modal system
  const { openModal } = useGlobalModalStore();

  const { data: divisions = [], isLoading, error, isError, refetch } = useTaskDivisionsAdmin();
  const { data: allDivisions = [] } = useAllTaskDivisions();
  const updateDivisionsOrderMutation = useUpdateTaskDivisionsOrder();
  const updateTaskDivisionMutation = useUpdateTaskDivision();
  const deleteTaskDivisionMutation = useDeleteTaskDivision();

  // Debug query state (only log errors)
  if (isError) {
  }

  // Auto-expand divisions that have children (only on initial load)
  // Note: task_divisions are flat, so this won't do much but kept for compatibility
  React.useEffect(() => {
    if (divisions.length > 0 && expandedCategories.size === 0) {
      const divisionsToExpand = new Set<string>();
      
      const checkForChildren = (divs: TaskDivisionAdmin[]) => {
        divs.forEach(div => {          
          // Expand parent divisions if they have children
          if (div.children && div.children.length > 0) {
            divisionsToExpand.add(div.id);
            checkForChildren(div.children);
          }
        });
      };
      
      checkForChildren(divisions);
      
      if (divisionsToExpand.size > 0) {
        setExpandedCategories(divisionsToExpand);
      }
    }
  }, [divisions, expandedCategories.size]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const toggleCategoryExpansion = (divisionId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(divisionId)) {
        newSet.delete(divisionId);
      } else {
        newSet.add(divisionId);
      }
      return newSet;
    });
  };

  const handleDeleteDivision = (divisionId: string, divisionName: string) => {
    openModal('delete-confirmation', {
      title: "Eliminar división",
      itemName: divisionName,
      warningMessage: "Esta acción eliminará permanentemente la división.",
      onConfirm: async () => {
        try {
          await deleteTaskDivisionMutation.mutateAsync(divisionId);
          // Force immediate UI refresh
          await refetch();
        } catch (error) {
          throw error;
        }
      }
    });
  };

  const handleEditDivision = (division: CategoryTreeNode) => {
    openModal('task-division', { 
      isEditing: true, 
      divisionId: division.id,
      editingDivision: division 
    });
  };

  const handleCreateDivision = () => {
    openModal('task-division', { isEditing: false });
  };

  const handleReorderDivisions = async (reorderedDivisions: CategoryTreeNode[]) => {
    try {
      // Prepare the data for the API call
      const divisionsWithOrder = reorderedDivisions.map((division, index) => ({
        id: division.id,
        order: index + 1
      }));

      await updateDivisionsOrderMutation.mutateAsync(divisionsWithOrder);
    } catch (error) {
    }
  };

  const handleParentChange = async (childId: string, newParentId: string | null) => {
    try {
      await updateTaskDivisionMutation.mutateAsync({
        id: childId,
        parent_id: newParentId,
        // Keep existing data - we only want to update parent_id
        name: divisions.find(d => d.id === childId)?.name || '',
        description: divisions.find(d => d.id === childId)?.description,
        code: divisions.find(d => d.id === childId)?.code,
        is_system: true,
        organization_id: null,
      });
      
      toast({
        title: newParentId ? "Elemento convertido en hijo" : "Elemento movido al nivel principal",
        description: "La relación padre-hijo se ha actualizado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la relación padre-hijo.",
        variant: "destructive",
      });
    }
  };

  // Filter divisions based on search term
  const filteredDivisions = React.useMemo(() => {
    if (!searchTerm) return divisions;

    const filterDivisions = (divs: TaskDivisionAdmin[]): TaskDivisionAdmin[] => {
      return divs.filter(div => {
        const matchesSearch = div.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (div.name_en && div.name_en.toLowerCase().includes(searchTerm.toLowerCase()));
        const hasMatchingChildren = div.children && filterDivisions(div.children).length > 0;
        
        if (matchesSearch || hasMatchingChildren) {
          return {
            ...div,
            children: div.children ? filterDivisions(div.children) : []
          };
        }
        
        return false;
      }).map(div => ({
        ...div,
        children: div.children ? filterDivisions(div.children) : []
      }));
    };

    return filterDivisions(divisions);
  }, [divisions, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando divisiones...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardContent className="p-6">
          {filteredDivisions.length === 0 ? (
            <div className="text-center py-12">
              <TreePine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm ? 'No se encontraron divisiones' : 'No hay divisiones creadas'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza creando tu primera división de tareas'
                }
              </p>
            </div>
          ) : (
            <HierarchicalTree
              categories={filteredDivisions}
              expandedCategories={expandedCategories}
              onToggleExpanded={toggleCategoryExpansion}
              onEdit={(division) => handleEditDivision(division)}
              onDelete={(divisionId) => {
                // Find division name for confirmation
                const divisionName = filteredDivisions.find(div => div.id === divisionId)?.name || 'División';
                handleDeleteDivision(divisionId, divisionName);
              }}
              onTemplate={() => {}} // Not implemented yet
              onAddTaskGroup={() => {}} // Not implemented yet  
              onCreateChild={(division) => {
                // Note: task_divisions are flat, so this creates a new division instead of child
                handleCreateDivision();
              }}
              // Enable drag and drop for divisions
              enableDragAndDrop={true}
              onReorder={handleReorderDivisions}
              onParentChange={handleParentChange}
              // Show order numbers for divisions
              showOrderNumber={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminTaskDivisions;