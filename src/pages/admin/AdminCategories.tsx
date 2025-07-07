import { useState } from 'react';
import { Plus, Package2, Settings, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

import { Layout } from '@/components/layout/desktop/Layout';
import { HierarchicalCategoryTree } from '@/components/ui-custom/misc/HierarchicalCategoryTree';

import { useTaskCategoriesAdmin, useAllTaskCategories, useDeleteTaskCategory, TaskCategoryAdmin } from '@/hooks/use-task-categories-admin';
import { NewAdminTaskCategoryModal } from '@/modals/admin/NewAdminTaskCategoryModal';

export default function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [templateFilter, setTemplateFilter] = useState<'all' | 'with-template' | 'without-template'>('all');
  
  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaskCategoryAdmin | null>(null);
  
  // Delete confirmation state
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useTaskCategoriesAdmin();
  const { data: allCategories = [] } = useAllTaskCategories();
  const deleteCategoryMutation = useDeleteTaskCategory();

  // Calculate statistics
  const calculateStats = (categories: TaskCategoryAdmin[]) => {
    let totalCategories = 0;
    let categoriesWithTemplates = 0;
    let categoriesWithoutTemplates = 0;
    let totalTemplates = 0;

    const countRecursive = (cats: TaskCategoryAdmin[]) => {
      cats.forEach(cat => {
        totalCategories++;
        if (cat.template) {
          categoriesWithTemplates++;
          totalTemplates++;
        } else {
          categoriesWithoutTemplates++;
        }
        if (cat.children && cat.children.length > 0) {
          countRecursive(cat.children);
        }
      });
    };

    countRecursive(categories);
    return { totalCategories, categoriesWithTemplates, categoriesWithoutTemplates, totalTemplates };
  };

  const stats = calculateStats(categories);

  // Filter categories based on search and template filter
  const filterCategories = (categories: TaskCategoryAdmin[], term: string, templateFilter: string): TaskCategoryAdmin[] => {
    return categories.filter(category => {
      // Search filter
      const matchesSearch = !term || 
        category.name.toLowerCase().includes(term.toLowerCase()) ||
        category.code?.toLowerCase().includes(term.toLowerCase());
      
      // Template filter (only apply to leaf/NIETO categories - level 2)
      const hasChildrenLevel0 = category.children && category.children.length > 0;
      const hasChildrenLevel1 = category.children?.some(child => child.children && child.children.length > 0);
      const isLeafCategory = !hasChildrenLevel0 || (hasChildrenLevel0 && !hasChildrenLevel1);
      
      let matchesTemplate = true;
      if (templateFilter !== 'all' && isLeafCategory) {
        // Only apply template filter to leaf categories
        if (templateFilter === 'with-template') {
          matchesTemplate = !!category.template;
        } else if (templateFilter === 'without-template') {
          matchesTemplate = !category.template;
        }
      }
      
      // Check if children match filters
      const hasMatchingChildren = category.children && 
                                 filterCategories(category.children, term, templateFilter).length > 0;
      
      return (matchesSearch && matchesTemplate) || hasMatchingChildren;
    }).map(category => ({
      ...category,
      children: category.children ? filterCategories(category.children, term, templateFilter) : undefined
    }));
  };

  const filteredCategories = filterCategories(categories, searchTerm, templateFilter);

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Handle edit category
  const handleEditCategory = (category: TaskCategoryAdmin) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!deleteCategoryId) return;
    
    try {
      await deleteCategoryMutation.mutateAsync(deleteCategoryId);
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setDeleteCategoryId(null);
    }
  };

  // Handle template action (placeholder)
  const handleTemplateAction = (category: TaskCategoryAdmin) => {
    console.log('Template action for category:', category.name);
    // TODO: Implementar funcionalidad de plantilla
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setTemplateFilter('all');
  };

  // Header props
  const headerProps = {
    title: "Gestión de Categorías",
    showSearch: true,
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    showFilters: true,
    filters: [
      { 
        label: "Todas", 
        onClick: () => setTemplateFilter('all'),
        isActive: templateFilter === 'all'
      },
      { 
        label: "Con Plantilla", 
        onClick: () => setTemplateFilter('with-template'),
        isActive: templateFilter === 'with-template'
      },
      { 
        label: "Sin Plantilla", 
        onClick: () => setTemplateFilter('without-template'),
        isActive: templateFilter === 'without-template'
      }
    ],
    onClearFilters: clearFilters,
    actions: (
      <Button 
        onClick={() => setIsCategoryModalOpen(true)}
        className="h-8 px-3 text-sm font-medium"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nueva Categoría
      </Button>
    )
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando categorías...</div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout headerProps={headerProps}>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
              <p className="text-xs text-muted-foreground">
                Categorías creadas en total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Plantillas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categoriesWithTemplates}</div>
              <p className="text-xs text-muted-foreground">
                Categorías con plantillas asignadas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Plantillas</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categoriesWithoutTemplates}</div>
              <p className="text-xs text-muted-foreground">
                Categorías sin plantillas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plantillas</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTemplates}</div>
              <p className="text-xs text-muted-foreground">
                Total de plantillas creadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Categories Tree */}
        <div className="space-y-2">
          {filteredCategories.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                {searchTerm ? 'No se encontraron categorías que coincidan con la búsqueda' : 'No hay categorías creadas'}
              </div>
            </Card>
          ) : (
            <HierarchicalCategoryTree
              categories={filteredCategories}
              expandedCategories={expandedCategories}
              onToggleExpanded={toggleCategoryExpansion}
              onEdit={handleEditCategory}
              onDelete={setDeleteCategoryId}
              onTemplate={handleTemplateAction}
            />
          )}
        </div>
      </Layout>

      {/* Category Modal */}
      <NewAdminTaskCategoryModal
        open={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory || undefined}
        allCategories={allCategories}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La categoría y todas sus subcategorías serán eliminadas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}