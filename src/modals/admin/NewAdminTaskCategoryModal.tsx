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

const taskCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  parent_id: z.string().nullable().optional(),
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
  
  const createMutation = useCreateTaskCategory();
  const updateMutation = useUpdateTaskCategory();

  const form = useForm<TaskCategoryFormData>({
    resolver: zodResolver(taskCategorySchema),
    defaultValues: {
      name: '',
      code: '',
      parent_id: null,
    },
  });

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (category && open) {
      form.reset({
        name: category.name,
        code: category.code || '',
        parent_id: category.parent_id,
      });
    } else if (!category && open) {
      form.reset({
        name: '',
        code: '',
        parent_id: null,
      });
    }
  }, [category, open, form]);

  const onSubmit = async (data: TaskCategoryFormData) => {
    setIsSubmitting(true);
    
    try {
      const submitData = {
        name: data.name,
        code: data.code || undefined,
        parent_id: data.parent_id,
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
                
                {/* Single parent selector for both create and edit */}
                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría Padre</FormLabel>
                      <Select onValueChange={(value) => {
                        const actualValue = value === 'none' ? null : value;
                        field.onChange(actualValue);
                      }} value={field.value || 'none'}>
                        <FormControl>
                          <SelectTrigger className="z-50">
                            <SelectValue placeholder="Seleccionar categoría padre (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[100]">
                          <SelectItem value="none">Sin padre (Categoría de nivel superior)</SelectItem>
                          {allCategories?.map((cat) => (
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

                {category && (
                  <div className="text-sm text-muted-foreground mb-4">
                    Editando categoría: <strong>{category.name}</strong>
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