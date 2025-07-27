import React, { useState } from 'react';
import { Plus, Tag, Filter, X, TreePine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Layout } from '@/components/layout/desktop/Layout';
import { HierarchicalCategoryTree } from '@/components/ui-custom/HierarchicalCategoryTree';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';

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

  // Calculate statistics - simplified without templates and groups
  const calculateStats = () => {
    const flattenCategories = (cats: TaskCategoryAdmin[]): TaskCategoryAdmin[] => {
      return cats.reduce((acc, cat) => {
        acc.push(cat);
        if (cat.children) {
          acc.push(...flattenCategories(cat.children));
        }
        return acc;
      }, [] as TaskCategoryAdmin[]);
    };

    const allFlatCategories = flattenCategories(categories);
    
    return {
      totalCategorias: allFlatCategories.length,
      categoriasPadre: categories.length,
    };
  };

  const stats = calculateStats();

  const features = [
    {
      icon: TreePine,
      title: "Organización Jerárquica",
      description: "Estructura las categorías en múltiples niveles para una clasificación detallada de tareas."
    },
    {
      icon: Tag,
      title: "Clasificación Avanzada", 
      description: "Sistema de categorización que permite organizar tipos de trabajo por especialidad y complejidad."
    },
    {
      icon: Filter,
      title: "Búsqueda Inteligente",
      description: "Encuentra categorías específicas mediante filtros de texto que buscan en toda la jerarquía."
    },
    {
      icon: Plus,
      title: "Gestión Completa",
      description: "Crea, edita y elimina categorías con validación automática de dependencias y estructura."
    }
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando categorías...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <ActionBarDesktop
          title="Gestión de Categorías de Tareas"
          icon={TreePine}
          onSearch={handleSearch}
          features={features}
          primaryActionLabel="Nueva Categoría"
          onPrimaryActionClick={handleCreateCategory}
        />

        {/* KPI Cards - Simplified */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.totalCategorias}</div>
              <p className="text-xs text-muted-foreground">
                Incluyendo subcategorías
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías Principales</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.categoriasPadre}</div>
              <p className="text-xs text-muted-foreground">
                Categorías de primer nivel
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Categories Tree */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TreePine className="w-5 h-5" />
              Categorías de Tareas
            </CardTitle>
            <CardDescription>
              Administra la estructura jerárquica de categorías para organizar tipos de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <TreePine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {searchTerm ? 'No se encontraron categorías' : 'No hay categorías creadas'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
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
                onToggleExpansion={toggleCategoryExpansion}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                searchTerm={searchTerm}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}