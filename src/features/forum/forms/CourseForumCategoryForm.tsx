import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Pencil } from 'lucide-react';

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { ForumCategory } from '../services';

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  is_read_only: z.boolean().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CourseForumCategoryFormProps {
  modalData?: {
    courseId: string;
    category?: ForumCategory;
    mode?: 'create' | 'edit';
  };
  onClose: () => void;
}

export default function CourseForumCategoryForm({ modalData, onClose }: CourseForumCategoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const courseId = modalData?.courseId;
  const category = modalData?.category;
  const mode = modalData?.mode || (category ? 'edit' : 'create');
  const isEditing = mode === 'edit' && !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'MessageSquare',
      color: '#3b82f6',
      is_read_only: false,
    },
  });

  useEffect(() => {
    if (isEditing && category) {
      form.reset({
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || 'MessageSquare',
        color: category.color || '#3b82f6',
        is_read_only: category.is_read_only || false,
      });
    }
  }, [category, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const res = await apiRequest('POST', `/api/forum/courses/${courseId}/categories`, data);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Error al crear categoría');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/courses', courseId, 'categories'] });
      toast({ title: 'Categoría creada', description: 'La categoría se ha creado correctamente' });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const res = await apiRequest('PATCH', `/api/forum/categories/${category!.id}`, data);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Error al actualizar categoría');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/courses', courseId, 'categories'] });
      toast({ title: 'Categoría actualizada', description: 'Los cambios se han guardado' });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title={isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
        description={isEditing ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría para el foro del curso'}
        icon={isEditing ? Pencil : FolderPlus}
      />

      <ModalBody>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre de la categoría"
                      {...field}
                      data-testid="input-category-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción de la categoría..."
                      rows={3}
                      {...field}
                      data-testid="input-category-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícono</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MessageSquare"
                      {...field}
                      data-testid="input-category-icon"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input
                      type="color"
                      {...field}
                      data-testid="input-category-color"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_read_only"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Solo administradores</FormLabel>
                    <FormDescription className="text-xs">
                      Solo los administradores pueden crear hilos en esta categoría
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-read-only"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ModalBody>

      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={onClose}
        submitText={isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={isPending}
      />
    </ModalLayout>
  );
}
