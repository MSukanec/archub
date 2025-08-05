import React, { useState } from 'react';
import { Plus, Tag, Filter, X, TreePine } from 'lucide-react';

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

  // Statistics calculations
  const countCategoriesRecursive = (cats: MaterialCategory[]): number => {
    return cats.reduce((count, cat) => {
      let childCount = 0;
      if (cat.children && cat.children.length > 0) {
        childCount = countCategoriesRecursive(cat.children);
      }
      return count + 1 + childCount;
    }, 0);
  };

  const totalCategories = countCategoriesRecursive(categories);
  const rootCategories = categories.length;

  const getRecentCategoriesCount = (cats: MaterialCategory[]): number => {
    let count = 0;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const checkRecursive = (categories: MaterialCategory[]) => {
      categories.forEach(cat => {
        const createdDate = new Date(cat.created_at);
        if (createdDate > weekAgo) {
          count++;
        }
        if (cat.children && cat.children.length > 0) {
          checkRecursive(cat.children);
        }
      });
    };
    
    checkRecursive(cats);
    return count;
  };

  const recentCategories = getRecentCategoriesCount(categories);

  const headerProps = {
    title: 'Categorías de Materiales',
    showSearch: true,
    searchValue: searchTerm,
    onSearchChange: handleSearch,
    actions: [
      <Button 
        key="new-category"
        onClick={handleCreateCategory}
        size="sm"
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Nueva Categoría
      </Button>
    ]
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total</span>
                <Tag className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">{totalCategories}</div>
              <p className="text-xs text-muted-foreground">categorías</p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Principales</span>
                <TreePine className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">{rootCategories}</div>
              <p className="text-xs text-muted-foreground">principales</p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Recientes</span>
                <Plus className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">{recentCategories}</div>
              <p className="text-xs text-muted-foreground">últimos 7 días</p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Filtrados</span>
                <Filter className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">{countCategoriesRecursive(filteredCategories)}</div>
              <p className="text-xs text-muted-foreground">coincidencias</p>
            </div>
          </Card>
        </div>

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
                onEdit={handleEditCategory}
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
                onAddTaskGroup={handleCreateChildCategory} // Repurpose as "add subcategory"
                searchTerm={searchTerm}
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