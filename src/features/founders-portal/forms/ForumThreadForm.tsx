import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessagesSquare } from 'lucide-react';

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateThread } from '../services';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'recursos', label: 'Recursos' },
  { value: 'networking', label: 'Networking' },
  { value: 'oportunidades', label: 'Oportunidades' },
  { value: 'preguntas', label: 'Preguntas' },
];

const threadSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  category: z.string().min(1, 'Selecciona una categoría'),
  content: z.string().optional(),
});

type ThreadFormData = z.infer<typeof threadSchema>;

interface ForumThreadFormProps {
  modalData?: any;
  onClose: () => void;
  mode?: 'create' | 'edit';
}

export default function ForumThreadForm({ modalData, onClose, mode = 'create' }: ForumThreadFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateThread();

  const form = useForm<ThreadFormData>({
    resolver: zodResolver(threadSchema),
    defaultValues: {
      title: '',
      category: 'general',
      content: '',
    },
  });

  const onSubmit = async (data: ThreadFormData) => {
    try {
      await createMutation.mutateAsync({
        title: data.title,
        content: data.content || '',
        category: data.category,
      });
      toast({
        title: 'Tema creado',
        description: 'Tu tema ha sido publicado exitosamente',
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el tema',
        variant: 'destructive',
      });
    }
  };

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title={mode === 'edit' ? 'Editar Tema' : 'Nuevo Tema'}
        description={mode === 'edit' ? 'Actualiza los detalles del tema' : 'Crea un nuevo tema de discusión en el foro de fundadores'}
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

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-thread-category">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe tu tema o pregunta..."
                      rows={4}
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
        isSubmitting={createMutation.isPending}
      />
    </ModalLayout>
  );
}
