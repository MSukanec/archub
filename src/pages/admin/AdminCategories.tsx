import React, { useState } from 'react';
import { Plus, Package2, Settings, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

import { Layout } from '@/components/layout/desktop/Layout';
import { HierarchicalCategoryTree } from '@/components/ui-custom/misc/HierarchicalCategoryTree';

import { useTaskCategoriesAdmin, useAllTaskCategories, useDeleteTaskCategory, TaskCategoryAdmin, TaskGroupAdmin } from '@/hooks/use-task-categories-admin';
import { useDeleteTaskGroup } from '@/hooks/use-task-groups';
import { NewAdminTaskCategoryModal } from '@/modals/admin/NewAdminTaskCategoryModal';
import { NewTaskGroupModal, TaskGroup } from '@/modals/admin/NewTaskGroupModal';
import TaskTemplateEditorModal from '@/modals/admin/tasks/NewTaskTemplateEditorModal';

export default function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [templateFilter, setTemplateFilter] = useState<'all' | 'with-template' | 'without-template'>('all');
  
  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaskCategoryAdmin | null>(null);
  
  // Template modal states
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<TaskCategoryAdmin | null>(null);
  
  // Task Group modal states
  const [isTaskGroupModalOpen, setIsTaskGroupModalOpen] = useState(false);
  const [editingTaskGroup, setEditingTaskGroup] = useState<TaskGroup | null>(null);
  const [taskGroupCategory, setTaskGroupCategory] = useState<TaskCategoryAdmin | null>(null);
  
  // Template modal task group states - NEW: Para manejar plantillas de task groups
  const [templateTaskGroup, setTemplateTaskGroup] = useState<TaskGroupAdmin | null>(null);
  
  // Delete confirmation states
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteTaskGroupId, setDeleteTaskGroupId] = useState<string | null>(null);

  const { data: categories = [], isLoading, error, isError, refetch } = useTaskCategoriesAdmin();
  const { data: allCategories = [] } = useAllTaskCategories();

  // Debug query state
  console.log('🎯 AdminCategories render - Query state:', {
    isLoading,
    isError,
    error,
    categoriesLength: categories.length,
    hasData: !!categories
  });

  // Auto-expand categories that have task groups
  React.useEffect(() => {
    if (categories.length > 0) {
      const categoriesToExpand = new Set<string>();
      
      const checkForTaskGroups = (cats: TaskCategoryAdmin[]) => {
        cats.forEach(cat => {
          // If category has task groups, expand it
          if (cat.taskGroups && cat.taskGroups.length > 0) {
            categoriesToExpand.add(cat.id);
            console.log(`🔍 Auto-expanding category "${cat.name}" because it has ${cat.taskGroups.length} task groups:`, cat.taskGroups.map(tg => tg.name));
          }
          
          // Also expand parent categories if they have children with task groups
          if (cat.children && cat.children.length > 0) {
            const hasChildrenWithTaskGroups = cat.children.some(child => 
              child.taskGroups && child.taskGroups.length > 0
            );
            if (hasChildrenWithTaskGroups) {
              categoriesToExpand.add(cat.id);
              console.log(`🔍 Auto-expanding parent category "${cat.name}" because children have task groups`);
            }
            checkForTaskGroups(cat.children);
          }
        });
      };
      
      checkForTaskGroups(categories);
      
      if (categoriesToExpand.size > 0) {
        console.log('🎯 Categories to auto-expand:', Array.from(categoriesToExpand));
        setExpandedCategories(categoriesToExpand);
      }
    }
  }, [categories]);
  const deleteCategoryMutation = useDeleteTaskCategory();
  const deleteTaskGroupMutation = useDeleteTaskGroup();

  // Calculate statistics - NOW BASED ON TASK GROUPS INSTEAD OF CATEGORIES
  const calculateStats = (categories: TaskCategoryAdmin[]) => {
    let totalCategories = 0;
    let totalTaskGroups = 0;
    let taskGroupsWithTemplates = 0;
    let taskGroupsWithoutTemplates = 0;

    const countRecursive = (cats: TaskCategoryAdmin[]) => {
      cats.forEach(cat => {
        totalCategories++;
        
        // Contar task groups y sus plantillas with debugging
        if (cat.taskGroups && cat.taskGroups.length > 0) {
          totalTaskGroups += cat.taskGroups.length;
          cat.taskGroups.forEach(tg => {
            const hasTemplate = tg.template_id !== null && tg.template_id !== undefined && tg.template_id !== '';
            if (hasTemplate) {
              taskGroupsWithTemplates++;
            } else {
              taskGroupsWithoutTemplates++;
            }
          });
        }
        
        if (cat.children && cat.children.length > 0) {
          countRecursive(cat.children);
        }
      });
    };

    countRecursive(categories);
    return { 
      totalCategories, 
      totalTaskGroups,
      taskGroupsWithTemplates, 
      taskGroupsWithoutTemplates 
    };
  };

  const stats = calculateStats(categories);

  // Filter categories based on search and template filter
  const filterCategories = (categories: TaskCategoryAdmin[], term: string, templateFilter: string): TaskCategoryAdmin[] => {
    return categories.filter(category => {
      // Search filter
      const matchesSearch = !term || 
        category.name.toLowerCase().includes(term.toLowerCase()) ||
        category.code?.toLowerCase().includes(term.toLowerCase());
      
      // Template filter - NOW BASED ON TASK GROUPS
      let matchesTemplate = true;
      if (templateFilter !== 'all') {
        // Calculate if category has task groups with/without templates
        const hasTaskGroups = category.taskGroups && category.taskGroups.length > 0;
        const hasTaskGroupsWithTemplates = hasTaskGroups && category.taskGroups.some(tg => tg.template_id);
        const hasTaskGroupsWithoutTemplates = hasTaskGroups && category.taskGroups.some(tg => !tg.template_id);
        
        if (templateFilter === 'with-template') {
          matchesTemplate = hasTaskGroupsWithTemplates;
        } else if (templateFilter === 'without-template') {
          matchesTemplate = hasTaskGroupsWithoutTemplates;
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

  // Handle template action - DEPRECATED: solo para categorías finales (3 letras)
  const handleTemplateAction = (category: TaskCategoryAdmin) => {
    if (category.code && category.code.length === 3) {
      setTemplateCategory(category);
      setIsTemplateModalOpen(true);
    }
  };

  // Handle task group template action - NEW: plantillas ahora van a nivel de grupo
  const handleTaskGroupTemplate = (taskGroup: TaskGroupAdmin, category: TaskCategoryAdmin) => {
    console.log('🎯 Opening template modal for task group:', taskGroup.name, 'in category:', category.name);
    console.log('🎯 TaskGroup data:', taskGroup);
    console.log('🎯 Category data:', category);
    
    // Usar la estructura correcta para task groups
    setTemplateCategory(category); // Mantener la categoría padre
    setTemplateTaskGroup(taskGroup); // Guardar el task group específico
    setIsTemplateModalOpen(true);
  };

  // Handle add task group
  const handleAddTaskGroup = (category: TaskCategoryAdmin) => {
    setTaskGroupCategory(category);
    setEditingTaskGroup(null);
    setIsTaskGroupModalOpen(true);
  };

  // Handle edit task group
  const handleEditTaskGroup = (taskGroup: TaskGroupAdmin, category: TaskCategoryAdmin) => {
    setTaskGroupCategory(category);
    setEditingTaskGroup(taskGroup);
    setIsTaskGroupModalOpen(true);
  };

  // Handle delete task group
  const handleDeleteTaskGroup = async () => {
    if (!deleteTaskGroupId) return;
    
    try {
      await deleteTaskGroupMutation.mutateAsync(deleteTaskGroupId);
    } catch (error) {
      console.error('Error deleting task group:', error);
    } finally {
      setDeleteTaskGroupId(null);
    }
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
      <div className="flex gap-2">
        <Button 
          onClick={() => refetch()}
          variant="outline"
          className="h-8 px-3 text-sm font-medium"
        >
          🔄 REFETCH
        </Button>
        <Button 
          onClick={() => setIsCategoryModalOpen(true)}
          className="h-8 px-3 text-sm font-medium"
        >
          <Plus className="mr-2 h-4 w-4" />
          CREAR CATEGORÍAS
        </Button>
      </div>
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
              <CardTitle className="text-sm font-medium">Grupos de Tareas</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTaskGroups}</div>
              <p className="text-xs text-muted-foreground">
                Total de grupos de tareas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Plantillas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.taskGroupsWithTemplates}</div>
              <p className="text-xs text-muted-foreground">
                Grupos con plantillas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Plantillas</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.taskGroupsWithoutTemplates}</div>
              <p className="text-xs text-muted-foreground">
                Grupos sin plantillas
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
              onAddTaskGroup={handleAddTaskGroup}
              onEditTaskGroup={handleEditTaskGroup}
              onDeleteTaskGroup={setDeleteTaskGroupId}
              onTaskGroupTemplate={handleTaskGroupTemplate}
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

      {/* Template Modal */}
      {templateCategory && (
        <TaskTemplateEditorModal
          open={isTemplateModalOpen}
          onClose={() => {
            setIsTemplateModalOpen(false);
            setTemplateCategory(null);
            setTemplateTaskGroup(null);
          }}
          categoryId={templateCategory.id}
          categoryCode={templateCategory.code || ''}
          categoryName={templateCategory.name}
          taskGroupId={templateTaskGroup?.id}
          taskGroupName={templateTaskGroup?.name}
        />
      )}

      {/* Task Group Modal */}
      {taskGroupCategory && (
        <NewTaskGroupModal
          open={isTaskGroupModalOpen}
          onClose={() => {
            setIsTaskGroupModalOpen(false);
            setEditingTaskGroup(null);
            setTaskGroupCategory(null);
          }}
          categoryId={taskGroupCategory.id}
          categoryName={taskGroupCategory.name}
          taskGroup={editingTaskGroup || undefined}
        />
      )}

      {/* Delete Category Confirmation Dialog */}
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

      {/* Delete Task Group Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskGroupId} onOpenChange={() => setDeleteTaskGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo de tareas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El grupo de tareas será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTaskGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}