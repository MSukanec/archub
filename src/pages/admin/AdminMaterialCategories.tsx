import React, { useState } from 'react';
import { Plus, Tag, Layers } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { Layout } from '@/components/layout/desktop/Layout';
import { HierarchicalCategoryTree } from '@/components/ui-custom/HierarchicalCategoryTree';

import { useMaterialCategories, useDeleteMaterialCategory, MaterialCategory } from '@/hooks/use-material-categories';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { ModalFactory } from '@/components/modal/form/ModalFactory';

export default function AdminMaterialCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // New modal system
  const { openModal } = useGlobalModalStore();

  const { data: categories = [], isLoading, error, isError } = useMaterialCategories();

  // Debug query state (only log errors)
  if (isError) {
    console.error('❌ AdminMaterialCategories error:', error);
  }

  // Auto-expand categories that have children (only on initial load)
  React.useEffect(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      const categoriesToExpand = new Set<string>();
      
      const checkForChildren = (cats: MaterialCategory[]) => {
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

  const deleteMaterialCategoryMutation = useDeleteMaterialCategory();

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
      title: "Eliminar categoría de material",
      itemName: categoryName,
      warningMessage: "Esta acción eliminará permanentemente la categoría y todas sus subcategorías.",
      onConfirm: async () => {
        try {
          await deleteMaterialCategoryMutation.mutateAsync(categoryId);
        } catch (error) {
          console.error('Error deleting material category:', error);
        }
      },
      isLoading: deleteMaterialCategoryMutation.isPending,
      destructiveActionText: 'Eliminar Categoría',
      mode: 'dangerous'
    });
  };

  const handleEditCategory = (category: MaterialCategory) => {
    openModal('material-category-form', { 
      editingMaterialCategory: category 
    });
  };

  const handleCreateCategory = () => {
    openModal('material-category-form', {
      editingMaterialCategory: null
    });
  };

  const findCategoryInTree = (cats: MaterialCategory[], id: string): MaterialCategory | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.children) {
        const found = findCategoryInTree(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleCreateChildCategory = (parentCategory: MaterialCategory) => {
    openModal('material-category-form', {
      editingMaterialCategory: null,
      parentCategory: {
        id: parentCategory.id,
        name: parentCategory.name
      }
    });
  };

  // Filter categories based on search term
  const filteredCategories = React.useMemo(() => {
    if (!searchTerm) return categories;

    const filterCategories = (cats: MaterialCategory[]): MaterialCategory[] => {
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



  const headerProps = {
    title: 'Categorías de Materiales',
    icon: Layers,
    showSearch: true,
    searchValue: searchTerm,
    onSearchChange: handleSearch,
    actionButton: {
      label: "Nueva Categoría",
      icon: Plus,
      onClick: handleCreateCategory
    }
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* Hierarchical Category Tree */}
        <Card>
          <CardContent className="p-6">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {searchTerm ? 'No se encontraron categorías' : 'No hay categorías creadas'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comienza creando tu primera categoría de materiales'
                  }
                </p>
              </div>
            ) : (
              <HierarchicalCategoryTree
                categories={filteredCategories}
                expandedCategories={expandedCategories}
                onToggleExpanded={toggleCategoryExpansion}
                onEdit={(category) => {
                  // Convert CategoryTreeNode to MaterialCategory for the edit handler
                  const materialCategory = categories.find(cat => cat.id === category.id) || 
                    findCategoryInTree(categories, category.id);
                  if (materialCategory) {
                    handleEditCategory(materialCategory);
                  }
                }}
                onDelete={(categoryId: string) => {
                  // Find category name for confirmation
                  const findCategoryName = (cats: MaterialCategory[], id: string): string => {
                    for (const cat of cats) {
                      if (cat.id === id) return cat.name;
                      if (cat.children) {
                        const found = findCategoryName(cat.children, id);
                        if (found) return found;
                      }
                    }
                    return 'Categoría';
                  };
                  
                  const categoryName = findCategoryName(categories, categoryId);
                  handleDeleteCategory(categoryId, categoryName);
                }}
                onTemplate={() => {}} // Not used for material categories
                onAddTaskGroup={() => {}} // Not used for material categories
                onCreateChild={(category) => {
                  // Convert CategoryTreeNode to MaterialCategory for the child creation handler
                  const materialCategory = categories.find(cat => cat.id === category.id) || 
                    findCategoryInTree(categories, category.id);
                  if (materialCategory) {
                    handleCreateChildCategory(materialCategory);
                  }
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Global Modal Factory */}
      <ModalFactory />
    </Layout>
  );
}