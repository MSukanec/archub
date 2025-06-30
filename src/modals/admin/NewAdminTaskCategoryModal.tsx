import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

import { useCreateTaskCategory, useUpdateTaskCategory, TaskCategoryAdmin } from '@/hooks/use-task-categories-admin';
import { useTopLevelCategories, useSubcategories, useElementCategories } from '@/hooks/use-task-categories';

const taskCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  element_category_id: z.string().optional(),
});

type TaskCategoryFormData = z.infer<typeof taskCategorySchema>;

interface NewAdminTaskCategoryModalProps {
  open: boolean;
  onClose: () => void;
  category?: TaskCategoryAdmin;
  allCategories: TaskCategoryAdmin[];
}

export function NewAdminTaskCategoryModal({ 
  open, 
  onClose, 
  category,
  allCategories 
}: NewAdminTaskCategoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  
  const createMutation = useCreateTaskCategory();
  const updateMutation = useUpdateTaskCategory();

  // Data hooks for hierarchical selection
  const { data: topLevelCategories } = useTopLevelCategories();
  const { data: subcategories } = useSubcategories(selectedCategoryId || null);
  const { data: elementCategories } = useElementCategories(selectedSubcategoryId || null);

  const form = useForm<TaskCategoryFormData>({
    resolver: zodResolver(taskCategorySchema),
    defaultValues: {
      name: '',
      code: '',
      category_id: undefined,
      subcategory_id: undefined,
      element_category_id: undefined,
    },
  });

  // Helper function to determine parent_id based on hierarchy level
  const determineParentId = (formData: TaskCategoryFormData) => {
    if (formData.element_category_id) return formData.subcategory_id;
    if (formData.subcategory_id) return formData.category_id;
    return null; // Top level category
  };

  // Helper function to find category in hierarchy and set parent values
  const findCategoryHierarchy = (categoryId: string) => {
    // Search through the flat categories to find hierarchy
    for (const topCat of allCategories) {
      if (topCat.id === categoryId) {
        return { level: 0, categoryId: '', subcategoryId: '', elementCategoryId: '' };
      }
      if (topCat.children) {
        for (const subCat of topCat.children) {
          if (subCat.id === categoryId) {
            return { level: 1, categoryId: topCat.id, subcategoryId: '', elementCategoryId: '' };
          }
          if (subCat.children) {
            for (const elemCat of subCat.children) {
              if (elemCat.id === categoryId) {
                return { level: 2, categoryId: topCat.id, subcategoryId: subCat.id, elementCategoryId: categoryId };
              }
            }
          }
        }
      }
    }
    return { level: 0, categoryId: '', subcategoryId: '', elementCategoryId: '' };
  };

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (category && open) {
      // For editing, we need to find the parent_id from the category
      const parentId = category.parent_id;
      
      // Find the parent category to determine hierarchy
      let parentCategoryId = '';
      let parentSubcategoryId = '';
      
      if (parentId) {
        // Find which level the parent belongs to
        const parentCategory = allCategories.find(cat => 
          cat.id === parentId || 
          cat.children?.some(child => child.id === parentId) ||
          cat.children?.some(child => child.children?.some(grandchild => grandchild.id === parentId))
        );
        
        if (parentCategory) {
          // Check if parent is a top-level category
          if (parentCategory.id === parentId) {
            parentCategoryId = parentId;
          } else {
            // Check if parent is a subcategory
            const subCategory = parentCategory.children?.find(child => child.id === parentId);
            if (subCategory) {
              parentCategoryId = parentCategory.id;
              parentSubcategoryId = parentId;
            }
          }
        }
      }
      
      setSelectedCategoryId(parentCategoryId);
      setSelectedSubcategoryId(parentSubcategoryId);
      
      form.reset({
        name: category.name,
        code: category.code || '',
        category_id: parentCategoryId || undefined,
        subcategory_id: parentSubcategoryId || undefined,
        element_category_id: undefined,
      });
    } else if (!category && open) {
      setSelectedCategoryId('');
      setSelectedSubcategoryId('');
      
      form.reset({
        name: '',
        code: '',
        category_id: undefined,
        subcategory_id: undefined,
        element_category_id: undefined,
      });
    }
  }, [category, open, form, allCategories]);

  const onSubmit = async (data: TaskCategoryFormData) => {
    setIsSubmitting(true);
    
    try {
      const parentId = determineParentId(data);
      
      const submitData = {
        name: data.name,
        code: data.code || undefined,
        parent_id: parentId,
      };

      if (category) {
        await updateMutation.mutateAsync({ 
          id: category.id, 
          ...submitData 
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle category selection changes
  const handleCategoryChange = (value: string) => {
    const actualValue = value === 'none' ? '' : value;
    setSelectedCategoryId(actualValue);
    setSelectedSubcategoryId(''); // Reset subcategory when category changes
    form.setValue('category_id', actualValue || undefined);
    form.setValue('subcategory_id', undefined);
    form.setValue('element_category_id', undefined);
  };

  const handleSubcategoryChange = (value: string) => {
    const actualValue = value === 'none' ? '' : value;
    setSelectedSubcategoryId(actualValue);
    form.setValue('subcategory_id', actualValue || undefined);
    form.setValue('element_category_id', undefined); // Reset element category when subcategory changes
  };

  const handleElementCategoryChange = (value: string) => {
    form.setValue('element_category_id', value);
  };

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={category ? 'Editar Categoría' : 'Nueva Categoría'}
            description="Modifica los datos de la categoría"
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Simplified form without accordion - only essential category fields */}
                
                {/* Show hierarchical selection only for new categories */}
                {!category && (
                  <>
                    {/* Categoría Principal */}
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría Principal *</FormLabel>
                          <Select onValueChange={handleCategoryChange} value={selectedCategoryId}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar categoría principal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {topLevelCategories?.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Subcategoría */}
                    {selectedCategoryId && (
                      <FormField
                        control={form.control}
                        name="subcategory_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subcategoría *</FormLabel>
                            <Select onValueChange={handleSubcategoryChange} value={selectedSubcategoryId}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar subcategoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {subcategories?.map((subcat) => (
                                  <SelectItem key={subcat.id} value={subcat.id}>
                                    {subcat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Categoría Final */}
                    {selectedSubcategoryId && (
                      <FormField
                        control={form.control}
                        name="element_category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría Final *</FormLabel>
                            <Select onValueChange={handleElementCategoryChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona primero una subcategoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {elementCategories?.map((elemcat) => (
                                  <SelectItem key={elemcat.id} value={elemcat.id}>
                                    {elemcat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}

                {/* For editing, show hierarchical selection to change parent */}
                {category && (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      Editando categoría: <strong>{category.name}</strong>
                    </div>
                    
                    {/* Parent Category Selector for editing */}
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría Padre</FormLabel>
                          <Select onValueChange={handleCategoryChange} value={selectedCategoryId}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar categoría padre (opcional para nivel superior)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin padre (Categoría de nivel superior)</SelectItem>
                              {topLevelCategories?.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Subcategory selection for editing if parent selected */}
                    {selectedCategoryId && selectedCategoryId !== 'none' && (
                      <FormField
                        control={form.control}
                        name="subcategory_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subcategoría Padre</FormLabel>
                            <Select onValueChange={handleSubcategoryChange} value={selectedSubcategoryId}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar subcategoría padre (opcional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Sin subcategoría padre</SelectItem>
                                {subcategories?.map((subcat) => (
                                  <SelectItem key={subcat.id} value={subcat.id}>
                                    {subcat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {/* Prefijo de Código - Always editable */}
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prefijo de Código</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Código de la categoría (ej: ABC)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nombre - Always editable */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre de la categoría"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onSave={form.handleSubmit(onSubmit)}
            onCancel={onClose}
            saveText="Guardar"
            cancelText="Cancelar"
            saveDisabled={isSubmitting}
          />
        ),
      }}
    </CustomModalLayout>
  );
}