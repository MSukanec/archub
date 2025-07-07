import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { TemplateNameBuilder } from '@/components/ui-custom/misc/TemplateNameBuilder';

import { 
  useCreateTaskCategory, 
  useUpdateTaskCategory, 
  TaskCategoryAdmin 
} from '@/hooks/use-task-categories-admin';
import { 
  useCreateTaskTemplate, 
  useUpdateTaskTemplate, 
  TaskTemplate 
} from '@/hooks/use-task-templates-admin';

// Category schema
const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  parent_id: z.string().optional(),
  position: z.string().optional()
});

// Template schema
const templateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code_prefix: z.string()
    .min(2, 'El prefijo debe tener al menos 2 caracteres')
    .max(4, 'El prefijo debe tener máximo 4 caracteres')
    .regex(/^[A-Z]+$/, 'El prefijo debe contener solo letras mayúsculas'),
  name_template: z.string().min(1, 'La plantilla de nombre es requerida'),
  category_id: z.string().min(1, 'La categoría es requerida')
});

type CategoryFormData = z.infer<typeof categorySchema>;
type TemplateFormData = z.infer<typeof templateSchema>;

interface NewAdminCategoriesModalProps {
  open: boolean;
  onClose: () => void;
  category?: TaskCategoryAdmin;
  template?: TaskTemplate;
  allCategories: TaskCategoryAdmin[];
}

export function NewAdminCategoriesModal({
  open,
  onClose,
  category,
  template,
  allCategories
}: NewAdminCategoriesModalProps) {
  const [activeAccordion, setActiveAccordion] = useState<string>("category");
  const [createdCategoryId, setCreatedCategoryId] = useState<string | null>(null);

  // Category form
  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      code: '',
      parent_id: '',
      position: ''
    }
  });

  // Template form
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      code_prefix: '',
      name_template: '',
      category_id: ''
    }
  });

  // Mutations
  const createCategoryMutation = useCreateTaskCategory();
  const updateCategoryMutation = useUpdateTaskCategory();
  const createTemplateMutation = useCreateTaskTemplate();
  const updateTemplateMutation = useUpdateTaskTemplate();

  // Reset forms when modal opens/closes
  useEffect(() => {
    if (open) {
      // Reset category form
      if (category) {
        categoryForm.reset({
          name: category.name,
          code: category.code || '',
          parent_id: category.parent_id || '',
          position: category.position || ''
        });
      } else {
        categoryForm.reset({
          name: '',
          code: '',
          parent_id: '',
          position: ''
        });
      }

      // Reset template form
      if (template) {
        templateForm.reset({
          name: template.name,
          code_prefix: template.code_prefix,
          name_template: template.name_template,
          category_id: template.category_id
        });
        setActiveAccordion("template");
      } else {
        templateForm.reset({
          name: '',
          code_prefix: '',
          name_template: '',
          category_id: category?.id || createdCategoryId || ''
        });
      }

      setCreatedCategoryId(null);
    }
  }, [open, category, template, categoryForm, templateForm, createdCategoryId]);

  // Handle category save
  const handleCategorySubmit = async (data: CategoryFormData) => {
    try {
      if (category) {
        await updateCategoryMutation.mutateAsync({
          id: category.id,
          ...data
        });
        toast({
          title: "Categoría actualizada",
          description: "La categoría se ha actualizado correctamente"
        });
      } else {
        const newCategory = await createCategoryMutation.mutateAsync(data);
        setCreatedCategoryId(newCategory.id);
        toast({
          title: "Categoría creada",
          description: "La categoría se ha creado correctamente"
        });
        
        // Update template form with new category ID
        templateForm.setValue('category_id', newCategory.id);
        
        // Switch to template accordion
        setActiveAccordion("template");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la categoría",
        variant: "destructive"
      });
    }
  };

  // Handle template save
  const handleTemplateSubmit = async (data: TemplateFormData) => {
    try {
      const templateData = {
        ...data,
        category_id: data.category_id || createdCategoryId || category?.id
      };

      if (template) {
        await updateTemplateMutation.mutateAsync({
          id: template.id,
          ...templateData
        });
        toast({
          title: "Plantilla actualizada",
          description: "La plantilla se ha actualizado correctamente"
        });
      } else {
        await createTemplateMutation.mutateAsync(templateData);
        toast({
          title: "Plantilla creada",
          description: "La plantilla se ha creado correctamente"
        });
      }
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la plantilla",
        variant: "destructive"
      });
    }
  };

  // Build parent options (only allow valid parent categories)
  const buildParentOptions = (categories: TaskCategoryAdmin[], excludeId?: string): JSX.Element[] => {
    const options: JSX.Element[] = [];
    
    const addCategoryOptions = (cats: TaskCategoryAdmin[], level = 0) => {
      cats.forEach(cat => {
        if (cat.id !== excludeId) {
          const indent = "—".repeat(level);
          options.push(
            <SelectItem key={cat.id} value={cat.id}>
              {indent} {cat.name}
            </SelectItem>
          );
          
          if (cat.children && cat.children.length > 0) {
            addCategoryOptions(cat.children, level + 1);
          }
        }
      });
    };
    
    addCategoryOptions(categories);
    return options;
  };

  // Get flat list of all categories for template selection
  const getAllCategories = (categories: TaskCategoryAdmin[]): TaskCategoryAdmin[] => {
    const result: TaskCategoryAdmin[] = [];
    
    const flatten = (cats: TaskCategoryAdmin[]) => {
      cats.forEach(cat => {
        result.push(cat);
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children);
        }
      });
    };
    
    flatten(categories);
    return result;
  };

  const flatCategories = getAllCategories(allCategories);

  const isLoading = createCategoryMutation.isPending || 
                   updateCategoryMutation.isPending || 
                   createTemplateMutation.isPending || 
                   updateTemplateMutation.isPending;

  const modalTitle = category 
    ? "Editar Categoría" 
    : template 
    ? "Editar Plantilla" 
    : "Nueva Categoría";

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      <CustomModalHeader 
        title={modalTitle}
        onClose={onClose}
      />
      
      <CustomModalBody columns={1} className="space-y-6">
        <Accordion 
          type="single" 
          value={activeAccordion} 
          onValueChange={setActiveAccordion}
          className="w-full"
        >
          {/* Category Accordion */}
          <AccordionItem value="category" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-medium">
              Información de Categoría
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombre de la categoría" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={categoryForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Código de la categoría (opcional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={categoryForm.control}
                    name="parent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría Padre</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría padre (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Sin categoría padre</SelectItem>
                            {buildParentOptions(allCategories, category?.id)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={categoryForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posición</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Posición (opcional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {category ? 'Actualizar Categoría' : 'Crear Categoría'}
                  </Button>
                </form>
              </Form>
            </AccordionContent>
          </AccordionItem>

          {/* Template Accordion */}
          <AccordionItem value="template" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-medium">
              Plantilla de Tarea (Opcional)
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <Form {...templateForm}>
                <form onSubmit={templateForm.handleSubmit(handleTemplateSubmit)} className="space-y-4">
                  <FormField
                    control={templateForm.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {flatCategories.map(cat => (
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

                  <FormField
                    control={templateForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombre de la plantilla" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="code_prefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prefijo de Código *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Ej: MUR, PIN, etc."
                            className="uppercase"
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="name_template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plantilla de Nombre *</FormLabel>
                        <FormControl>
                          <TemplateNameBuilder
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Construcción de {{material}} en {{ubicacion}}"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {template ? 'Actualizar Plantilla' : 'Crear Plantilla'}
                  </Button>
                </form>
              </Form>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CustomModalBody>
      
      <CustomModalFooter>
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
      </CustomModalFooter>
    </CustomModalLayout>
  );
}