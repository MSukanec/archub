import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
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
      console.log('Setting form values for edit:', {
        name: category.name,
        code: category.code || '',
        parent_id: category.parent_id,
      });
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
                  render={({ field }) => {
                    const [open, setOpen] = useState(false);
                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>Categoría Padre</FormLabel>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {(() => {
                                  console.log('Combobox display - field.value:', field.value);
                                  console.log('Combobox display - allCategories length:', allCategories?.length);
                                  console.log('Combobox display - searching for category with ID:', field.value);
                                  const foundCategory = allCategories?.find((cat) => cat.id === field.value);
                                  console.log('Combobox display - found category:', foundCategory);
                                  
                                  if (field.value) {
                                    return foundCategory?.name || "Cargando categoría...";
                                  }
                                  return "Seleccionar categoría padre (opcional)";
                                })()}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 z-[9999]">
                            <Command>
                              <CommandInput placeholder="Buscar categoría..." />
                              <CommandEmpty>No se encontraron categorías.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-y-auto">
                                <CommandItem
                                  value="none"
                                  onSelect={() => {
                                    field.onChange(null);
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      !field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  Sin padre (Categoría de nivel superior)
                                </CommandItem>
                                {allCategories?.map((cat) => (
                                  <CommandItem
                                    key={cat.id}
                                    value={cat.name}
                                    onSelect={() => {
                                      field.onChange(cat.id);
                                      setOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        cat.id === field.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {cat.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />



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