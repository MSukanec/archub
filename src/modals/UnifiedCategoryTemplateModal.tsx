import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package2, FileText, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { TemplateNameBuilder } from '@/components/ui-custom/misc/TemplateNameBuilder';

import { useTaskCategoriesAdmin, useCreateTaskCategory, useUpdateTaskCategory, TaskCategoryAdmin } from '@/hooks/use-task-categories-admin';
import { useTaskTemplatesAdmin, useCreateTaskTemplate, useUpdateTaskTemplate, TaskTemplate } from '@/hooks/use-task-templates-admin';

// Schema para categoría
const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  parent_id: z.string().optional(),
  position: z.string().optional(),
});

// Schema para plantilla
const templateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code_prefix: z.string()
    .min(2, 'El prefijo debe tener al menos 2 caracteres')
    .max(4, 'El prefijo debe tener máximo 4 caracteres')
    .regex(/^[A-Z]+$/, 'El prefijo debe contener solo letras mayúsculas'),
  name_template: z.string().min(1, 'La plantilla de nombre es requerida'),
  category_id: z.string().min(1, 'La categoría es requerida'),
});

type CategoryFormData = z.infer<typeof categorySchema>;
type TemplateFormData = z.infer<typeof templateSchema>;

interface UnifiedCategoryTemplateModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  editingCategory?: TaskCategoryAdmin | null;
  editingTemplate?: TaskTemplate | null;
  preselectedCategoryId?: string;
}

export function UnifiedCategoryTemplateModal({
  open,
  onClose,
  mode,
  editingCategory = null,
  editingTemplate = null,
  preselectedCategoryId = ''
}: UnifiedCategoryTemplateModalProps) {
  const [activeTab, setActiveTab] = useState<'category' | 'template'>('category');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [] } = useTaskCategoriesAdmin();
  const { data: templates = [] } = useTaskTemplatesAdmin();
  
  const createCategoryMutation = useCreateTaskCategory();
  const updateCategoryMutation = useUpdateTaskCategory();
  const createTemplateMutation = useCreateTaskTemplate();
  const updateTemplateMutation = useUpdateTaskTemplate();

  // Form para categoría
  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      code: '',
      parent_id: '',
      position: ''
    }
  });

  // Form para plantilla
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      code_prefix: '',
      name_template: '',
      category_id: preselectedCategoryId
    }
  });

  // Reset forms cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editingCategory) {
        categoryForm.reset({
          name: editingCategory.name,
          code: editingCategory.code || '',
          parent_id: editingCategory.parent_id || '',
          position: editingCategory.position || ''
        });
        setActiveTab('category');
      } else if (mode === 'edit' && editingTemplate) {
        templateForm.reset({
          name: editingTemplate.name,
          code_prefix: editingTemplate.code_prefix,
          name_template: editingTemplate.name_template,
          category_id: editingTemplate.category_id
        });
        setActiveTab('template');
      } else {
        // Modo crear
        categoryForm.reset({
          name: '',
          code: '',
          parent_id: '',
          position: ''
        });
        templateForm.reset({
          name: '',
          code_prefix: '',
          name_template: '',
          category_id: preselectedCategoryId
        });
        setActiveTab('category');
      }
    }
  }, [open, mode, editingCategory, editingTemplate, preselectedCategoryId, categoryForm, templateForm]);

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      if (activeTab === 'category') {
        const formData = categoryForm.getValues();
        
        if (mode === 'edit' && editingCategory) {
          await updateCategoryMutation.mutateAsync({
            id: editingCategory.id,
            ...formData
          });
        } else {
          await createCategoryMutation.mutateAsync(formData);
        }
      } else {
        const formData = templateForm.getValues();
        
        if (mode === 'edit' && editingTemplate) {
          await updateTemplateMutation.mutateAsync({
            id: editingTemplate.id,
            ...formData
          });
        } else {
          await createTemplateMutation.mutateAsync(formData);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTopLevelCategories = () => {
    return categories.filter(cat => !cat.parent_id);
  };

  const getModalTitle = () => {
    if (mode === 'edit') {
      if (editingCategory) return 'Editar Categoría';
      if (editingTemplate) return 'Editar Plantilla';
    }
    return 'Gestión de Categorías y Plantillas';
  };

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={getModalTitle()}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'category' | 'template')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="category" className="flex items-center gap-2">
                  <Package2 className="w-4 h-4" />
                  Categoría
                </TabsTrigger>
                <TabsTrigger value="template" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Plantilla
                </TabsTrigger>
              </TabsList>

              <TabsContent value="category" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {mode === 'edit' && editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                    </CardTitle>
                    <CardDescription>
                      Gestiona las categorías de tareas del sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name">Nombre de la Categoría</Label>
                      <Input
                        id="category-name"
                        placeholder="Ej: Estructuras, Instalaciones..."
                        {...categoryForm.register('name')}
                      />
                      {categoryForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {categoryForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category-code">Código (Opcional)</Label>
                      <Input
                        id="category-code"
                        placeholder="Ej: E, I, C..."
                        {...categoryForm.register('code')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category-parent">Categoría Padre (Opcional)</Label>
                      <Select
                        value={categoryForm.watch('parent_id') || ''}
                        onValueChange={(value) => categoryForm.setValue('parent_id', value || '')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría padre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin categoría padre</SelectItem>
                          {getTopLevelCategories().map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.code ? `${category.code} - ${category.name}` : category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category-position">Posición (Opcional)</Label>
                      <Input
                        id="category-position"
                        placeholder="Ej: 1, 2, 3..."
                        {...categoryForm.register('position')}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="template" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {mode === 'edit' && editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                    </CardTitle>
                    <CardDescription>
                      Crea plantillas de nombres para generación automática de tareas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                      <Input
                        id="template-name"
                        placeholder="Ej: Excavación de Fundaciones"
                        {...templateForm.register('name')}
                      />
                      {templateForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {templateForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-prefix">Prefijo de Código</Label>
                      <Input
                        id="template-prefix"
                        placeholder="Ej: EXC, INS, EST"
                        maxLength={4}
                        {...templateForm.register('code_prefix')}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          templateForm.setValue('code_prefix', value);
                        }}
                      />
                      {templateForm.formState.errors.code_prefix && (
                        <p className="text-sm text-destructive">
                          {templateForm.formState.errors.code_prefix.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-category">Categoría</Label>
                      <Select
                        value={templateForm.watch('category_id')}
                        onValueChange={(value) => templateForm.setValue('category_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {getTopLevelCategories().map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.code ? `${category.code} - ${category.name}` : category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {templateForm.formState.errors.category_id && (
                        <p className="text-sm text-destructive">
                          {templateForm.formState.errors.category_id.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Constructor Visual de Plantilla</Label>
                      <TemplateNameBuilder
                        value={templateForm.watch('name_template')}
                        onChange={(value) => templateForm.setValue('name_template', value)}
                        availableParameters={[
                          { name: 'material', label: 'Material' },
                          { name: 'dimension', label: 'Dimensión' },
                          { name: 'ubicacion', label: 'Ubicación' },
                          { name: 'tipo', label: 'Tipo' },
                          { name: 'nivel', label: 'Nivel' }
                        ]}
                      />
                      {templateForm.formState.errors.name_template && (
                        <p className="text-sm text-destructive">
                          {templateForm.formState.errors.name_template.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            onSave={handleSave}
            saveText={mode === 'edit' ? 'Actualizar' : 'Crear'}
            saveDisabled={isSubmitting}
            saveLoading={isSubmitting}
          />
        )
      }}
    </CustomModalLayout>
  );
}