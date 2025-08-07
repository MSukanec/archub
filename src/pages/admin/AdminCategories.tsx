import React, { useState } from 'react';
import { Plus, Tag, Filter, X, TreePine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Layout } from '@/components/layout/desktop/Layout';
import { HierarchicalCategoryTree } from '@/components/ui-custom/HierarchicalCategoryTree';

import { useTaskCategoriesAdmin, useAllTaskCategories, useDeleteTaskCategory, TaskCategoryAdmin } from '@/hooks/use-task-categories-admin';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

export default function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // New modal system
  const { openModal } = useGlobalModalStore();

  const { data: categories = [], isLoading, error, isError, refetch } = useTaskCategoriesAdmin();
  const { data: allCategories = [] } = useAllTaskCategories();

  // Debug query state (only log errors)
  if (isError) {
    console.error('❌ AdminCategories error:', error);
  }

  // Auto-expand categories that have children (only on initial load)
  React.useEffect(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      const categoriesToExpand = new Set<string>();
      
      const checkForChildren = (cats: TaskCategoryAdmin[]) => {
        cats.forEach(cat => {          
          // Expand parent categories if they have children
          if (cat.children && cat.children.length > 0) {
            categoriesToExpand.add(cat.id);
            checkForChildren(cat.children);
          }
        });
      };
      
      checkForChildren(categories);
      
      if (categoriesToExpand.size > 0) {
        setExpandedCategories(categoriesToExpand);
      }
    }
  }, [categories, expandedCategories.size]);

  const deleteTaskCategoryMutation = useDeleteTaskCategory();

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    openModal('delete-confirmation', {
      title: "Eliminar categoría",
      itemName: categoryName,
      warningMessage: "Esta acción eliminará permanentemente la categoría y todas sus subcategorías.",
      onConfirm: async () => {
        try {
          await deleteTaskCategoryMutation.mutateAsync(categoryId);
        } catch (error) {
          console.error('Error deleting category:', error);
          throw error;
        }
      }
    });
  };

  const handleEditCategory = (categoryId: string) => {
    openModal('task-category', { isEditing: true, categoryId });
  };

  const handleCreateCategory = () => {
    openModal('task-category', { isEditing: true });
  };

  // Filter categories based on search term
  const filteredCategories = React.useMemo(() => {
    if (!searchTerm) return categories;

    const filterCategories = (cats: TaskCategoryAdmin[]): TaskCategoryAdmin[] => {
      return cats.filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
        const hasMatchingChildren = cat.children && filterCategories(cat.children).length > 0;
        
        if (matchesSearch || hasMatchingChildren) {
          return {
            ...cat,
            children: cat.children ? filterCategories(cat.children) : []
          };
        }
        
        return false;
      }).map(cat => ({
        ...cat,
        children: cat.children ? filterCategories(cat.children) : []
      }));
    };

    return filterCategories(categories);
  }, [categories, searchTerm]);

  // Create header props for Layout
  const headerProps = {
    title: "Gestión de Categorías de Tareas",
    icon: TreePine,
    actionButton: {
      label: "Nueva Categoría",
      icon: Plus,
      onClick: handleCreateCategory
    }
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>

        <Card>
            {filteredCategories.length === 0 ? (
                  {searchTerm ? 'No se encontraron categorías' : 'No hay categorías creadas'}
                </h3>
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comienza creando tu primera categoría de tareas'
                  }
                </p>
              </div>
            ) : (
              <HierarchicalCategoryTree
                categories={filteredCategories}
                expandedCategories={expandedCategories}
                onToggleExpanded={toggleCategoryExpansion}
                onEdit={(category) => handleEditCategory(category.id)}
                onDelete={(categoryId) => {
                  // Find category name for confirmation - simplified version
                  const categoryName = filteredCategories.find(cat => cat.id === categoryId)?.name || 'Categoría';
                  handleDeleteCategory(categoryId, categoryName);
                }}
                onTemplate={() => {}} // Not implemented yet
                onAddTaskGroup={() => {}} // Not implemented yet  
                onCreateChild={(category) => {
                  // Create child category with parent selected
                  openModal('task-category', { 
                    isEditing: true,
                    parentCategoryId: category.id
                  });
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}