import { useState } from 'react';
import { Search, Plus, ChevronRight, ChevronDown, Edit, Trash2, FileText, Package2, Settings, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { Layout } from '@/components/layout/Layout';

import { useTaskCategoriesAdmin, useDeleteTaskCategory, TaskCategoryAdmin } from '@/hooks/use-task-categories-admin';
import { useDeleteTaskTemplate } from '@/hooks/use-task-templates-admin';
import { NewTaskTemplateModal } from '@/modals/tasks/NewTaskTemplateModal';
import { NewAdminTaskCategoryModal } from '@/modals/admin/NewAdminTaskCategoryModal';

export default function AdminTaskCategoriesTemplates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaskCategoryAdmin | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateCategoryId, setTemplateCategoryId] = useState<string>('');
  
  // Delete confirmation states
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useTaskCategoriesAdmin();
  const deleteCategoryMutation = useDeleteTaskCategory();
  const deleteTemplateMutation = useDeleteTaskTemplate();

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

  // Filter categories based on search
  const filterCategories = (categories: TaskCategoryAdmin[], term: string): TaskCategoryAdmin[] => {
    if (!term) return categories;

    return categories.filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(term.toLowerCase()) ||
                           category.code?.toLowerCase().includes(term.toLowerCase());
      
      const hasMatchingChildren = category.children && 
                                 filterCategories(category.children, term).length > 0;
      
      return matchesSearch || hasMatchingChildren;
    }).map(category => ({
      ...category,
      children: category.children ? filterCategories(category.children, term) : []
    }));
  };

  const filteredCategories = filterCategories(categories, searchTerm);

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEditCategory = (category: TaskCategoryAdmin) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleCreateTemplate = (categoryId: string) => {
    setTemplateCategoryId(categoryId);
    setEditingTemplate(null);
    setIsTemplateModalOpen(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateCategoryId(template.category_id);
    setIsTemplateModalOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
      setDeleteCategoryId(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplateMutation.mutateAsync(templateId);
      setDeleteTemplateId(null);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const renderCategory = (category: TaskCategoryAdmin, level = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id} className="border border-border rounded-md overflow-hidden">
        <Collapsible open={isExpanded} onOpenChange={() => toggleCategoryExpansion(category.id)}>
          <div className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors" style={{ paddingLeft: `${12 + level * 16}px` }}>
            <div className="flex items-center space-x-3 flex-1">
              {hasChildren && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                    {isExpanded ? 
                      <ChevronDown className="h-3 w-3" /> : 
                      <ChevronRight className="h-3 w-3" />
                    }
                  </Button>
                </CollapsibleTrigger>
              )}
              
              <div className="flex items-center space-x-2 flex-1">
                <Package2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{category.name}</span>
                {category.code && (
                  <Badge variant="outline" className="text-xs h-5">
                    {category.code}
                  </Badge>
                )}

                {/* Solo mostrar estado de plantilla en categorías NIETO */}
                {!hasChildren && (
                  <div className="flex items-center">
                    {category.template ? (
                      <Badge variant="default" className="text-xs h-5 bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Con plantilla
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs h-5 bg-gray-100 text-gray-600">
                        <XCircle className="h-3 w-3 mr-1" />
                        Sin plantilla
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* Solo mostrar botones de plantilla en categorías NIETO */}
              {!hasChildren && (
                <>
                  {category.template ? (
                    <Button
                      variant="ghost"
                      size="sm" 
                      className="h-7 px-2"
                      onClick={() => handleEditTemplate(category.template)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      <span className="text-xs">Editar</span>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleCreateTemplate(category.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span className="text-xs">Plantilla</span>
                    </Button>
                  )}
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Categoría
                  </DropdownMenuItem>
                  {!hasChildren && category.template && (
                    <DropdownMenuItem onClick={() => setDeleteTemplateId(category.template!.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Plantilla
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => setDeleteCategoryId(category.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Categoría
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {hasChildren && (
            <CollapsibleContent className="border-t border-border bg-muted/10">
              <div className="space-y-0">
                {category.children?.map(child => renderCategory(child, level + 1))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  const headerProps = {
    title: "Categorías de Tareas",
    actions: [
      <div key="search" className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar categorías..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-64"
        />
      </div>,
      <Button
        key="nueva-categoria"
        onClick={() => {
          setEditingCategory(null);
          setIsCategoryModalOpen(true);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nueva Categoría
      </Button>
    ],
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-6">
          <div className="text-center">Cargando categorías...</div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout headerProps={headerProps}>
        <div className="p-6 space-y-6">
          {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center space-x-2">
                <Package2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Categorías</p>
                  <p className="text-lg font-semibold">{stats.totalCategories}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Con Plantilla</p>
                  <p className="text-lg font-semibold">{stats.categoriesWithTemplates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Sin Plantilla</p>
                  <p className="text-lg font-semibold">{stats.categoriesWithoutTemplates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Plantillas</p>
                  <p className="text-lg font-semibold">{stats.totalTemplates}</p>
                </div>
              </div>
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
            filteredCategories.map(category => renderCategory(category))
          )}
        </div>

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
        allCategories={categories}
      />

      {/* Template Modal */}
      <NewTaskTemplateModal
        open={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
          setTemplateCategoryId('');
        }}
        template={editingTemplate || undefined}
        preselectedCategoryId={templateCategoryId}
      />

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la categoría permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCategoryId && handleDeleteCategory(deleteCategoryId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Template Confirmation */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la plantilla permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplateId && handleDeleteTemplate(deleteTemplateId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}