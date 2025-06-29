import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

import { useCreateTaskCategory, useUpdateTaskCategory, TaskCategoryAdmin } from '@/hooks/use-task-categories-admin';

const taskCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  parent_id: z.string().optional(),
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
      parent_id: '',
    },
  });

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (category && open) {
      form.reset({
        name: category.name,
        code: category.code || '',
        parent_id: category.parent_id || '',
      });
    } else if (!category && open) {
      form.reset({
        name: '',
        code: '',
        parent_id: '',
      });
    }
  }, [category, open, form]);

  // Flatten categories for parent selection dropdown
  const flattenCategories = (categories: TaskCategoryAdmin[], level = 0): Array<{id: string, name: string, level: number}> => {
    const result: Array<{id: string, name: string, level: number}> = [];
    
    categories.forEach(cat => {
      // Don't include the current category being edited as a potential parent
      if (!category || cat.id !== category.id) {
        result.push({
          id: cat.id,
          name: cat.name,
          level
        });
        
        if (cat.children && cat.children.length > 0) {
          result.push(...flattenCategories(cat.children, level + 1));
        }
      }
    });
    
    return result;
  };

  const flatCategories = flattenCategories(allCategories);

  const onSubmit = async (data: TaskCategoryFormData) => {
    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...data,
        parent_id: data.parent_id === '' || data.parent_id === 'none' ? null : data.parent_id,
      };

      if (category) {
        await updateMutation.mutateAsync({
          id: category.id,
          ...submitData,
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={category ? 'Editar Categoría' : 'Nueva Categoría'}
            description={category ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría de tarea'}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Nombre</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: Estructuras, Fundaciones..."
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: E, F, A..."
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría Padre</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría padre (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin categoría padre</SelectItem>
                          {flatCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {'—'.repeat(cat.level)} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
            onCancel={handleClose}
            onSave={form.handleSubmit(onSubmit)}
            saveText={isSubmitting ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
            saveDisabled={isSubmitting}
          />
        ),
      }}
    </CustomModalLayout>
  );
}