import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderPlus, Pencil } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateCategory, useUpdateCategory, type ForumCategory } from '../services';
import { useToast } from '@/hooks/use-toast';
const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  allowed_roles: z.array(z.string()).default(['public']),
});
type CategoryFormData = z.infer<typeof categorySchema>;
interface ForumCategoryFormProps {
  modalData?: {
    category?: ForumCategory;
    mode?: 'create'| 'edit';
  };
  onClose: () => void;
}
const ROLE_OPTIONS = [
  { value: 'public', label: 'Público'},
  { value: 'founder', label: 'Fundadores'},
  { value: 'admin', label: 'Administradores'},
];
export default function ForumCategoryForm({ modalData, onClose }: ForumCategoryFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const category = modalData?.category;
  const mode = modalData?.mode || (category ? 'edit': 'create');
  const isEditing = mode === 'edit'&& !!category;
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      icon: '',
      color: '#3b82f6',
      allowed_roles: ['public'],
    },
  });
  useEffect(() => {
    if (isEditing && category) {
      form.reset({
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#3b82f6',
        allowed_roles: category.allowed_roles?.length > 0 ? category.allowed_roles : ['public'],
      });
    }
  }, [category, isEditing, form]);
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditing && category) {
        await updateMutation.mutateAsync({
          categoryId: category.id,
          data: {
            name: data.name,
            description: data.description || undefined,
            icon: data.icon || undefined,
            color: data.color || undefined,
            allowed_roles: data.allowed_roles.length > 0 ? data.allowed_roles : ['public'],
          },
        });
        toast({
          title: 'Categoría actualizada',
          description: 'La categoría ha sido actualizada exitosamente',
        });
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          description: data.description || undefined,
          icon: data.icon || undefined,
          color: data.color || undefined,
          allowed_roles: data.allowed_roles.length > 0 ? data.allowed_roles : ['public'],
        });
        toast({
          title: 'Categoría creada',
          description: 'La categoría ha sido creada exitosamente',
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `No se pudo ${isEditing ? 'actualizar': 'crear'} la categoría`,
        variant: 'destructive',
      });
    }
  };
  const isPending = createMutation.isPending || updateMutation.isPending;
  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title={isEditing ? 'Editar Categoría': 'Nueva Categoría'}
        description={isEditing ? 'Modifica los datos de la categoría': 'Crea una nueva categoría para el foro'}
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
              name="allowed_roles"
              render={() => (
                <FormItem>
                  <FormLabel>Roles permitidos</FormLabel>
                  <div className="space-y-2">
                    {ROLE_OPTIONS.map((option) => (
                      <FormField
                        key={option.value}
                        control={form.control}
                        name="allowed_roles"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(option.value)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, option.value]);
                                  } else {
                                    field.onChange(current.filter((v) => v !== option.value));
                                  }
                                }}
                                data-testid={`checkbox-role-${option.value}`}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {option.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ModalBody>
      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={onClose}
        submitText={isEditing ? 'Guardar Cambios': 'Crear Categoría'}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={isPending}
      />
    </ModalLayout>
  );
}
