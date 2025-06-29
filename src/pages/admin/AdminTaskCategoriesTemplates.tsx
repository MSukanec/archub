import { useState } from 'react';
import { Search, Plus, ChevronRight, ChevronDown, Edit, Trash2, FileText, Package2, Settings, CheckCircle, XCircle, MoreHorizontal, Filter, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { Layout } from '@/components/layout/Layout';

import { useTaskCategoriesAdmin, useDeleteTaskCategory, TaskCategoryAdmin } from '@/hooks/use-task-categories-admin';
import { useDeleteTaskTemplate } from '@/hooks/use-task-templates-admin';
import { NewTaskTemplateModal } from '@/modals/tasks/NewTaskTemplateModal';
import { NewAdminTaskCategoryModal } from '@/modals/admin/NewAdminTaskCategoryModal';

export default function AdminTaskCategoriesTemplates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [templateFilter, setTemplateFilter] = useState<'all' | 'with-template' | 'without-template'>('all');
  
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
      children: category.children ? filterCategories(category.children, term, templateFilter) : []
    }));
  };

  const filteredCategories = filterCategories(categories, searchTerm, templateFilter);

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
      <div key={category.id} className={`
        border rounded-md overflow-hidden
        ${level === 0 ? 'border-blue-300 bg-blue-50/30' : ''}
        ${level === 1 ? 'border-green-300 bg-green-50/30' : ''}
        ${level === 2 ? 'border-orange-300 bg-orange-50/30' : ''}
      `}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleCategoryExpansion(category.id)}>
          <div 
            className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors cursor-pointer" 
            style={{ paddingLeft: `${12 + level * 16}px` }}
            onClick={() => hasChildren && toggleCategoryExpansion(category.id)}
          >
            <div className="flex items-center space-x-3 flex-1">
              {hasChildren && (
                <div className="h-5 w-5 flex items-center justify-center">
                  {isExpanded ? 
                    <ChevronDown className="h-3 w-3" /> : 
                    <ChevronRight className="h-3 w-3" />
                  }
                </div>
              )}
              
              <div className="flex items-center space-x-2 flex-1">
                {/* Iconos diferentes según el nivel jerárquico */}
                {level === 0 && <Package2 className="h-5 w-5 text-blue-600" />}
                {level === 1 && <Package2 className="h-4 w-4 text-green-600" />}
                {level === 2 && <Package2 className="h-3 w-3 text-orange-600" />}
                
                <div className="flex items-center space-x-2">
                  {/* Texto con tamaños diferentes según nivel */}
                  {level === 0 && <span className="font-semibold text-base text-blue-900">{category.name}</span>}
                  {level === 1 && <span className="font-medium text-sm text-green-800">{category.name}</span>}
                  {level === 2 && <span className="font-normal text-xs text-orange-800">{category.name}</span>}
                  
                  {/* Badge de código con colores según nivel */}
                  {category.code && (
                    <>
                      {level === 0 && <Badge variant="outline" className="text-xs h-5 border-blue-300 text-blue-700">{category.code}</Badge>}
                      {level === 1 && <Badge variant="outline" className="text-xs h-5 border-green-300 text-green-700">{category.code}</Badge>}
                      {level === 2 && <Badge variant="outline" className="text-xs h-5 border-orange-300 text-orange-700">{category.code}</Badge>}
                    </>
                  )}

                  {/* Solo mostrar estado de plantilla en categorías NIETO */}
                  {level === 2 && (
                    <div className="flex items-center">
                      {category.template ? (
                        <Badge variant="default" className="text-xs h-5 bg-green-100 text-green-700 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Con plantilla
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs h-5 bg-red-100 text-red-600 border-red-300">
                          <XCircle className="h-3 w-3 mr-1" />
                          Sin plantilla
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
              {/* Solo mostrar botones de plantilla en categorías NIETO */}
              {level === 2 && (
                <>
                  {category.template ? (
                    <Button
                      variant="ghost"
                      size="sm" 
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTemplate(category.template);
                      }}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      <span className="text-xs">Editar</span>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTemplate(category.id);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span className="text-xs">Plantilla</span>
                    </Button>
                  )}
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Categoría
                  </DropdownMenuItem>
                  {level === 2 && category.template && (
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
            <CollapsibleContent className={`
              border-t
              ${level === 0 ? 'border-blue-200 bg-blue-50/20' : ''}
              ${level === 1 ? 'border-green-200 bg-green-50/20' : ''}
            `}>
              <div className="p-2 space-y-1">
                {category.children?.map(child => renderCategory(child, level + 1))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  const hasFiltersApplied = searchTerm || templateFilter !== 'all';

  const customFilters = (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Plantillas</Label>
        <Select value={templateFilter} onValueChange={(value: 'all' | 'with-template' | 'without-template') => setTemplateFilter(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por plantillas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="with-template">Solo con plantilla</SelectItem>
            <SelectItem value="without-template">Solo sin plantilla</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const clearFilters = () => {
    setSearchTerm('');
    setTemplateFilter('all');
  };

  const headerProps = {
    icon: Package2,
    title: "Categorías de Tareas",
    showSearch: true,
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    customFilters,
    onClearFilters: clearFilters,
    actions: [
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