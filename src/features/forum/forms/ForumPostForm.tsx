import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageSquare } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RichTextEditor } from '@/components/shared/fields/RichTextEditor';
import { useCreatePost, useUpdatePost, ForumPostWithAuthor } from '../services';
import { useToast } from '@/hooks/use-toast';
const postSchema = z.object({
  content: z.string().min(1, 'El contenido es requerido'),
});
type PostFormData = z.infer<typeof postSchema>;
interface ForumPostFormProps {
  modalData?: {
    threadId: string;
    parentId?: string;
    post?: ForumPostWithAuthor;
  };
  onClose: () => void;
  mode?: 'create'| 'edit';
}
function parseContentText(content: { text?: string } | null | undefined): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  return content.text || '';
}
export default function ForumPostForm({ modalData, onClose, mode = 'create'}: ForumPostFormProps) {
  const { toast } = useToast();
  const createMutation = useCreatePost();
  const updateMutation = useUpdatePost();
  const post = modalData?.post;
  const threadId = modalData?.threadId || post?.thread_id || '';
  const parentId = modalData?.parentId;
  const isReply = !!parentId;
  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: parseContentText(post?.content),
    },
  });
  const onSubmit = async (data: PostFormData) => {
    try {
      if (mode === 'edit'&& post) {
        await updateMutation.mutateAsync({
          postId: post.id,
          content: data.content,
        });
        toast({
          title: 'Respuesta actualizada',
          description: 'Los cambios han sido guardados exitosamente',
        });
      } else {
        await createMutation.mutateAsync({
          thread_id: threadId,
          content: data.content,
          parent_id: parentId,
        });
        toast({
          title: isReply ? 'Respuesta enviada': 'Comentario publicado',
          description: 'Tu mensaje ha sido publicado exitosamente',
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `No se pudo ${mode === 'edit'? 'actualizar': 'publicar'} el mensaje`,
        variant: 'destructive',
      });
    }
  };
  const isPending = createMutation.isPending || updateMutation.isPending;
  const getTitle = () => {
    if (mode === 'edit') return 'Editar Respuesta';
    if (isReply) return 'Responder';
    return 'Nueva Respuesta';
  };
  const getDescription = () => {
    if (mode === 'edit') return 'Actualiza el contenido de tu respuesta';
    if (isReply) return 'Responde a este comentario';
    return 'Agrega una respuesta al tema';
  };
  const getSubmitText = () => {
    if (mode === 'edit') return 'Guardar Cambios';
    if (isReply) return 'Responder';
    return 'Publicar';
  };
  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title={getTitle()}
        description={getDescription()}
        icon={MessageSquare}
      />
      <ModalBody>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Escribe tu respuesta..."
                      minHeight="120px"
                      data-testid="input-post-content"
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
        submitText={getSubmitText()}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={isPending}
      />
    </ModalLayout>
  );
}
