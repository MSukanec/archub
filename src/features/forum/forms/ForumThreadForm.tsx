import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessagesSquare } from 'lucide-react';

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForumCategories, useCreateThread, useUpdateThread, ForumThreadWithAuthor } from '../services';
import { useToast } from '@/hooks/use-toast';

const threadSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  category_id: z.string().min(1, 'Selecciona una categoría'),
  content: z.string().optional(),
});

type ThreadFormData = z.infer<typeof threadSchema>;

interface ForumThreadFormProps {
  modalData?: {
    categoryId?: string;
    categorySlug?: string;
    thread?: ForumThreadWithAuthor;
    mode?: 'create' | 'edit';
  };
  onClose: () => void;
}

function parseContentText(content: { text?: string } | null | undefined): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  return content.text || '';
}

function formatContentToJson(text: string): { type: string; content: { type: string; content: { type: string; text: string }[] }[] } {
  return {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{
        type: 'text',
        text: text,
      }],
    }],
  };
}

export default function ForumThreadForm({ modalData, onClose }: ForumThreadFormProps) {
  const { toast } = useToast();
  const { data: categories, isLoading: categoriesLoading } = useForumCategories();
  const createMutation = useCreateThread();
  const updateMutation = useUpdateThread();

  const thread = modalData?.thread;
  const mode = modalData?.mode || (thread ? 'edit' : 'create');
  const preselectedCategoryId = modalData?.categoryId || thread?.category_id;

  const form = useForm<ThreadFormData>({
    resolver: zodResolver(threadSchema),
    defaultValues: {
      title: thread?.title || '',
      category_id: preselectedCategoryId || '',
      content: parseContentText(thread?.content),
    },
  });

  const onSubmit = async (data: ThreadFormData) => {
    try {
      if (mode === 'edit' && thread) {
        await updateMutation.mutateAsync({
          threadId: thread.id,
          data: {
            title: data.title,
            content: data.content || '',
          },
        });
        toast({
          title: 'Tema actualizado',
          description: 'Los cambios han sido guardados exitosamente',
        });
      } else {
        await createMutation.mutateAsync({
          category_id: data.category_id,
          title: data.title,
          content: data.content || '',
        });
        toast({
          title: 'Tema creado',
          description: 'Tu tema ha sido publicado exitosamente',
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `No se pudo ${mode === 'edit' ? 'actualizar' : 'crear'} el tema`,
        variant: 'destructive',
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const showCategorySelect = !preselectedCategoryId && mode === 'create';

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title={mode === 'edit' ? 'Editar Tema' : 'Nuevo Tema'}
        description={mode === 'edit' ? 'Actualiza los detalles del tema' : 'Crea un nuevo tema de discusión en el foro'}
        icon={MessagesSquare}
      />

      <ModalBody>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Título del tema"
                      {...field}
                      data-testid="input-thread-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCategorySelect && (
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={categoriesLoading}>
                      <FormControl>
                        <SelectTrigger data-testid="select-thread-category">
                          <SelectValue placeholder={categoriesLoading ? 'Cargando...' : 'Selecciona una categoría'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.filter(c => c.is_active).map((cat) => (
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
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe tu tema o pregunta..."
                      rows={6}
                      {...field}
                      data-testid="input-thread-content"
                    />
                  </FormControl>
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
        submitText={mode === 'edit' ? 'Guardar Cambios' : 'Crear Tema'}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={isPending}
      />
    </ModalLayout>
  );
}
