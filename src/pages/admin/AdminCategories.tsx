import React, { useState } from 'react';
import { Plus, Package2, PackagePlus, Settings, CheckCircle, XCircle, Filter, X, Tag, TreePine, Eye, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// AlertDialog components replaced with unified DeleteConfirmationModal
import { Badge } from '@/components/ui/badge';

import { Layout } from '@/components/layout/desktop/Layout';
import { HierarchicalCategoryTree } from '@/components/ui-custom/HierarchicalCategoryTree';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';

import { useTaskCategoriesAdmin, useAllTaskCategories, useDeleteTaskCategory, TaskCategoryAdmin, TaskGroupAdmin } from '@/hooks/use-task-categories-admin';
import { useDeleteTaskGroup } from '@/hooks/use-task-groups';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
// Task modals replaced with FormModalLayout components in global modal system

// Import TaskGroup type since it's still used in handleEditTaskGroup
export interface TaskGroup {
  id: string;
  name: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

export default function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [templateFilter, setTemplateFilter] = useState<'all' | 'with-template' | 'without-template'>('all');
  
  // New modal system
  const { openModal } = useGlobalModalStore();
  
  // Template modal states migrated to global modal system
  
  // No need for delete confirmation states anymore - handled by global modal

  const { data: categories = [], isLoading, error, isError, refetch } = useTaskCategoriesAdmin();
  const { data: allCategories = [] } = useAllTaskCategories();

  // Debug query state (only log errors)
  if (isError) {
    console.error('❌ AdminCategories error:', error);
  }

  // Auto-expand categories that have task groups (only on initial load)
  React.useEffect(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      const categoriesToExpand = new Set<string>();
      
      const checkForTaskGroups = (cats: TaskCategoryAdmin[]) => {
        cats.forEach(cat => {
          // If category has task groups, expand it
          if (cat.taskGroups && cat.taskGroups.length > 0) {
            categoriesToExpand.add(cat.id);
          }
          
          // Also expand parent categories if they have children with task groups
          if (cat.children && cat.children.length > 0) {
            const hasChildrenWithTaskGroups = cat.children.some(child => 
              child.taskGroups && child.taskGroups.length > 0
            );
            if (hasChildrenWithTaskGroups) {
              categoriesToExpand.add(cat.id);
            }
            checkForTaskGroups(cat.children);
          }
        });
      };
      
      checkForTaskGroups(categories);
      
      if (categoriesToExpand.size > 0) {
        setExpandedCategories(categoriesToExpand);
      }
    }
  }, [categories.length]); // Only depend on categories.length, not the full categories array

  // Preserve expanded state after data updates
  React.useEffect(() => {
    if (categories.length > 0 && expandedCategories.size > 0) {
      // When categories update but we already have expanded state, 
      // ensure newly created task groups still keep their parent expanded
      const currentExpanded = new Set(expandedCategories);
      let hasChanges = false;
      
      const checkForNewTaskGroups = (cats: TaskCategoryAdmin[]) => {
        cats.forEach(cat => {
          if (cat.taskGroups && cat.taskGroups.length > 0 && !currentExpanded.has(cat.id)) {
            currentExpanded.add(cat.id);
            hasChanges = true;
          }
          if (cat.children && cat.children.length > 0) {
            checkForNewTaskGroups(cat.children);
          }
        });
      };
      
      checkForNewTaskGroups(categories);
      
      if (hasChanges) {
        setExpandedCategories(currentExpanded);
      }
    }
  }, [categories]); // Monitor full categories for new task groups
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
    openModal('task-category', {
      editingCategory: category,
      isEditing: true
    });
  };

  // Handle delete category
  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    openModal('delete-confirmation', {
      mode: 'simple',
      title: '¿Eliminar categoría?',
      description: 'Esta acción no se puede deshacer. La categoría y todas sus subcategorías serán eliminadas permanentemente.',
      onConfirm: async () => {
        try {
          await deleteCategoryMutation.mutateAsync(categoryId);
        } catch (error) {
          console.error('Error deleting category:', error);
        }
      }
    });
  };

  // Handle template action - DEPRECATED: solo para categorías finales (3 letras)
  const handleTemplateAction = (category: TaskCategoryAdmin) => {
    if (category.code && category.code.length === 3) {
      openModal('task-template', {
        categoryId: category.id,
        categoryCode: category.code || '',
        categoryName: category.name
      });
    }
  };



  // Handle add task group
  const handleAddTaskGroup = (category: TaskCategoryAdmin) => {
    openModal('task-group', {
      categoryId: category.id,
      categoryName: category.name,
      isEditing: false
    });
  };

  // Handle edit task group
  const handleEditTaskGroup = (taskGroup: TaskGroupAdmin, category: TaskCategoryAdmin) => {
    openModal('task-group', {
      categoryId: category.id,
      categoryName: category.name,
      taskGroup: taskGroup,
      isEditing: true
    });
  };

  // Handle delete task group
  const handleDeleteTaskGroup = (taskGroupId: string, taskGroupName: string) => {
    openModal('delete-confirmation', {
      mode: 'simple',
      title: '¿Eliminar grupo de tareas?',
      description: 'Esta acción no se puede deshacer. El grupo de tareas será eliminado permanentemente.',
      onConfirm: async () => {
        try {
          await deleteTaskGroupMutation.mutateAsync(taskGroupId);
        } catch (error) {
          console.error('Error deleting task group:', error);
        }
      }
    });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setTemplateFilter('all');
  };

  // Features for ActionBar expansion
  const features = [
    {
      icon: <TreePine className="w-5 h-5" />,
      title: "Estructura Jerárquica",
      description: "Organiza categorías en una estructura de árbol con niveles padre-hijo para mejor clasificación."
    },
    {
      icon: <Package2 className="w-5 h-5" />,
      title: "Gestión de Grupos",
      description: "Administra grupos de tareas dentro de cada categoría para organizar plantillas y elementos relacionados."
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "Vista Expandible",
      description: "Navega fácilmente por categorías y subcategorías con controles de expansión intuitivos."
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Operaciones Rápidas",
      description: "Crea, edita y elimina categorías y grupos con acciones rápidas desde la interfaz principal."
    }
  ];

  // Header props
  const headerProps = {
    title: "Gestión de Categorías",
    actions: []
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
        {/* Action Bar Desktop */}
        <ActionBarDesktop
          title="Categorías de Tareas"
          icon={<Tag className="w-5 h-5" />}
          features={features}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          showProjectSelector={false}
          primaryActionLabel="Nueva Categoría"
          onPrimaryActionClick={() => {
            openModal('task-category', {
              editingCategory: null,
              isEditing: false
            });
          }}
          customActions={[
            <Button 
              key="quick-group"
              variant="secondary"
              onClick={() => {
                openModal('task-group-creator', {});
              }}
            >
              <PackagePlus className="h-4 w-4 mr-2" />
              Crear Grupo Rápido
            </Button>
          ]}
        />

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
              onDelete={(categoryId) => {
                const category = filteredCategories.find(c => c.id === categoryId);
                handleDeleteCategory(categoryId, category?.name || '');
              }}
              onTemplate={handleTemplateAction}
              onAddTaskGroup={handleAddTaskGroup}
              onEditTaskGroup={handleEditTaskGroup}
              onDeleteTaskGroup={(taskGroupId) => {
                // Find task group name from categories
                let taskGroupName = '';
                filteredCategories.forEach(cat => {
                  if (cat.taskGroups) {
                    const tg = cat.taskGroups.find(tg => tg.id === taskGroupId);
                    if (tg) taskGroupName = tg.name;
                  }
                });
                handleDeleteTaskGroup(taskGroupId, taskGroupName);
              }}

            />
          )}
        </div>
      </Layout>



      {/* Template Modal now handled by global ModalFactory */}

      {/* Task Group Modal now handled by global ModalFactory */}

      {/* Delete confirmations are now handled by the global DeleteConfirmationModal through ModalFactory */}
    </>
  );
}