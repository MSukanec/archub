import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessagesSquare } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/shared/fields/RichTextEditor';
import { FileUploader } from '@/components/shared/fields/FileUploader';
import { useForumCategories, useCreateThread, useUpdateThread, ForumThreadWithAuthor } from '../services';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/storage';
import { useAuthStore } from '@/stores/authStore';
import { useProjectContext } from '@/stores/projectContext';
const threadSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  category_id: z.string().min(1, 'Selecciona una categoría'),
  content: z.string().optional(),
});
type ThreadFormData = z.infer<typeof threadSchema>;
interface FileToUpload {
  file: File;
  title: string;
  description: string;
  category: string;
  uploadProgress: number;
}
interface ForumThreadFormProps {
  modalData?: {
    categoryId?: string;
    categorySlug?: string;
    thread?: ForumThreadWithAuthor;
    mode?: 'create'| 'edit';
  };
  onClose: () => void;
}
function parseContentText(content: { text?: string } | null | undefined): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  return content.text || '';
}
export default function ForumThreadForm({ modalData, onClose }: ForumThreadFormProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { currentOrganizationId } = useProjectContext();
  const { data: categories, isLoading: categoriesLoading } = useForumCategories();
  const createMutation = useCreateThread();
  const updateMutation = useUpdateThread();
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const thread = modalData?.thread;
  const mode = modalData?.mode || (thread ? 'edit': 'create');
  const preselectedCategoryId = modalData?.categoryId || thread?.category_id;
  const form = useForm<ThreadFormData>({
    resolver: zodResolver(threadSchema),
    defaultValues: {
      title: thread?.title || '',
      category_id: preselectedCategoryId || '',
      content: parseContentText(thread?.content),
    },
  });
  const uploadAttachments = async (threadId: string) => {
    if (filesToUpload.length === 0) return;
    
    setIsUploadingFiles(true);
    
    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const fileItem = filesToUpload[i];
        
        setFilesToUpload(prev => 
          prev.map((f, idx) => idx === i ? { ...f, uploadProgress: 10 } : f)
        );
        
        await uploadFile(fileItem.file, {
          entity: 'forum_thread_attachment',
          organization_id: currentOrganizationId || undefined,
          user_id: user?.id,
          link_to: {
            forum_thread_id: threadId,
          },
          category: 'forum_attachment',
          description: fileItem.title || fileItem.file.name,
        });
        
        setFilesToUpload(prev => 
          prev.map((f, idx) => idx === i ? { ...f, uploadProgress: 100 } : f)
        );
      }
    } catch (error: any) {
      console.error('Error uploading attachments:', error);
      toast({
        title: 'Error al subir imágenes',
        description: error.message || 'Algunas imágenes no pudieron ser subidas',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingFiles(false);
    }
  };
  const onSubmit = async (data: ThreadFormData) => {
    try {
      if (mode === 'edit'&& thread) {
        await updateMutation.mutateAsync({
          threadId: thread.id,
          data: {
            title: data.title,
            content: data.content || '',
          },
        });
        
        if (filesToUpload.length > 0) {
          await uploadAttachments(thread.id);
        }
        
        toast({
          title: 'Tema actualizado',
          description: 'Los cambios han sido guardados exitosamente',
        });
      } else {
        const result = await createMutation.mutateAsync({
          category_id: data.category_id,
          title: data.title,
          content: data.content || '',
        });
        
        if (filesToUpload.length > 0 && result?.id) {
          await uploadAttachments(result.id);
        }
        
        toast({
          title: 'Tema creado',
          description: 'Tu tema ha sido publicado exitosamente',
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `No se pudo ${mode === 'edit'? 'actualizar': 'crear'} el tema`,
        variant: 'destructive',
      });
    }
  };
  const isPending = createMutation.isPending || updateMutation.isPending || isUploadingFiles;
  const showCategorySelect = !preselectedCategoryId && mode === 'create';
  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title={mode === 'edit'? 'Editar Tema': 'Nuevo Tema'}
        description={mode === 'edit'? 'Actualiza los detalles del tema': 'Crea un nuevo tema de discusión en el foro'}
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
                          <SelectValue placeholder={categoriesLoading ? 'Cargando...': 'Selecciona una categoría'} />
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
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Describe tu tema o pregunta..."
                      minHeight="150px"
                      data-testid="input-thread-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Imágenes (opcional)</FormLabel>
              <FileUploader
                mode="multiple"
                accept="images"
                filesToUpload={filesToUpload}
                onFilesChange={setFilesToUpload}
                compressOnDrop={true}
                compressionPreset="sitelog-photo"
                maxSize={5 * 1024 * 1024}
                emptyStateDescription="Arrastra imágenes o haz clic para seleccionar"
                maxSizeLabel="Máximo 5 MB por imagen • Solo imágenes"
                disabled={isPending}
              />
            </div>
          </form>
        </Form>
      </ModalBody>
      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={onClose}
        submitText={
          isUploadingFiles 
            ? 'Subiendo imágenes...'
            : mode === 'edit'
              ? 'Guardar Cambios'
              : 'Crear Tema'
        }
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={isPending}
      />
    </ModalLayout>
  );
}
