import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageSquareQuote, Upload, X } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTestimonial, updateTestimonial } from '../services';
import { uploadFile } from '@/lib/storage';
import type { Testimonial } from '@shared/schema';

const testimonialSchema = z.object({
  author_name: z.string().min(1, 'El nombre es requerido'),
  author_title: z.string().optional(),
  author_avatar_url: z.string().optional(),
  content: z.string().min(10, 'El testimonio debe tener al menos 10 caracteres'),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_index: z.number().int().min(0).default(0),
});

type TestimonialFormData = z.infer<typeof testimonialSchema>;

interface TestimonialFormProps {
  modalData?: {
    courseId: string;
    testimonial?: Testimonial | null;
  };
  onClose: () => void;
  mode?: 'create' | 'edit';
}

export function TestimonialForm({ modalData, onClose, mode: propMode }: TestimonialFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const courseId = modalData?.courseId || '';
  const testimonial = modalData?.testimonial;
  const mode = propMode || (testimonial ? 'edit' : 'create');

  const form = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      author_name: '',
      author_title: '',
      author_avatar_url: '',
      content: '',
      is_featured: false,
      is_active: true,
      sort_index: 0,
    }
  });

  useEffect(() => {
    if (testimonial) {
      form.reset({
        author_name: testimonial.author_name || '',
        author_title: testimonial.author_title || '',
        author_avatar_url: testimonial.author_avatar_url || '',
        content: testimonial.content || '',
        is_featured: testimonial.is_featured || false,
        is_active: testimonial.is_active !== false,
        sort_index: testimonial.sort_index || 0,
      });
    } else {
      form.reset({
        author_name: '',
        author_title: '',
        author_avatar_url: '',
        content: '',
        is_featured: false,
        is_active: true,
        sort_index: 0,
      });
    }
  }, [testimonial, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const result = await uploadFile(file, {
        entity: 'testimonial_avatar',
        category: 'testimonial_avatar',
        description: `Avatar for testimonial`,
      });

      if (result.file_url) {
        form.setValue('author_avatar_url', result.file_url);
        toast({
          title: 'Imagen subida',
          description: 'El avatar se subió correctamente',
        });
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: TestimonialFormData) => createTestimonial({
      courseId,
      authorName: data.author_name,
      authorTitle: data.author_title,
      authorAvatarUrl: data.author_avatar_url,
      content: data.content,
      isFeatured: data.is_featured,
      isActive: data.is_active,
      sortIndex: data.sort_index,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-testimonials', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-landing'] });
      toast({
        title: 'Testimonio creado',
        description: 'El testimonio se agregó correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error creating testimonial:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el testimonio.',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: TestimonialFormData) => updateTestimonial(testimonial!.id, {
      authorName: data.author_name,
      authorTitle: data.author_title,
      authorAvatarUrl: data.author_avatar_url,
      content: data.content,
      isFeatured: data.is_featured,
      isActive: data.is_active,
      sortIndex: data.sort_index,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-testimonials', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-landing'] });
      toast({
        title: 'Testimonio actualizado',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error updating testimonial:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el testimonio.',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: TestimonialFormData) => {
    setIsLoading(true);
    try {
      if (mode === 'edit' && testimonial) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const avatarUrl = form.watch('author_avatar_url');
  const authorName = form.watch('author_name');

  const initials = authorName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'NN';

  return (
    <ModalLayout onClose={handleClose} size="md">
      <ModalHeader
        icon={MessageSquareQuote}
        title={mode === 'edit' ? 'Editar testimonio' : 'Nuevo testimonio'}
        description={mode === 'edit' 
          ? 'Actualiza el testimonio del estudiante' 
          : 'Agrega un testimonio de un estudiante para mostrar en la landing page'}
      />
      
      <ModalBody>
        <Form {...form}>
          <form id="testimonial-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="relative group">
                <Avatar className="w-16 h-16 border-2 border-accent/20">
                  <AvatarImage src={avatarUrl || undefined} alt={authorName} />
                  <AvatarFallback className="bg-accent/10 text-accent font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Upload className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                    data-testid="input-testimonial-avatar"
                  />
                </label>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name="author_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del autor *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Juan Pérez" 
                          data-testid="input-testimonial-author-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="author_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo / Profesión</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Arquitecto, Director de obra" 
                          data-testid="input-testimonial-author-title"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {avatarUrl && (
              <FormField
                control={form.control}
                name="author_avatar_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del avatar</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          placeholder="https://..." 
                          data-testid="input-testimonial-avatar-url"
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => form.setValue('author_avatar_url', '')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Testimonio *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="El curso me ayudó a mejorar mis habilidades..."
                      data-testid="textarea-testimonial-content"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sort_index"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="0"
                      data-testid="input-testimonial-sort-index"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-6 pt-2">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-testimonial-active"
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">Activo</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-testimonial-featured"
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">Destacado</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </ModalBody>

      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={handleClose}
        rightLabel={mode === 'edit' ? 'Actualizar' : 'Crear'}
        onRightClick={form.handleSubmit(onSubmit)}
        showLoadingSpinner={isLoading}
      />
    </ModalLayout>
  );
}
