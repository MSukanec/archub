import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';

const courseSchema = z.object({
  slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  title: z.string().min(1, 'El título es requerido'),
  short_description: z.string().optional(),
  long_description: z.string().optional(),
  cover_url: z.string().optional(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Debe ser un número válido mayor o igual a 0'
  }),
  visibility: z.enum(['public', 'private', 'draft'], {
    required_error: 'La visibilidad es requerida'
  }),
  is_active: z.boolean().default(true),
  // 🎓 Instructor fields
  instructor_name: z.string().optional(),
  instructor_title: z.string().optional(),
  instructor_bio: z.string().optional(),
  instructor_photo_url: z.string().optional(),
  // 🎨 Marketing fields
  badge_text: z.string().optional(),
  highlights: z.string().optional(), // Comma-separated, will be converted to array
  preview_video_id: z.string().optional(),
  // 🔍 SEO fields
  seo_keywords: z.string().optional(), // Comma-separated, will be converted to array
  og_image_url: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface Course {
  id: string;
  slug: string;
  title: string;
  short_description?: string;
  long_description?: string;
  cover_url?: string;
  price?: number;
  visibility: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  // 🎓 Instructor fields
  instructor_name?: string;
  instructor_title?: string;
  instructor_bio?: string;
  instructor_photo_url?: string;
  // 🎨 Marketing fields
  badge_text?: string;
  highlights?: string[];
  preview_video_id?: string;
  // 🔍 SEO fields
  seo_keywords?: string[];
  og_image_url?: string;
}

interface CourseFormModalProps {
  modalData?: {
    course?: Course;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function CourseFormModal({ modalData, onClose }: CourseFormModalProps) {
  const { course, isEditing = false } = modalData || {};
  const { setPanel } = useModalPanelStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const { data: userData } = useCurrentUser();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      slug: '',
      title: '',
      short_description: '',
      long_description: '',
      cover_url: '',
      price: '0',
      visibility: 'draft',
      is_active: true,
      instructor_name: '',
      instructor_title: '',
      instructor_bio: '',
      instructor_photo_url: '',
      badge_text: '',
      highlights: '',
      preview_video_id: '',
      seo_keywords: '',
      og_image_url: '',
    }
  });

  useEffect(() => {
    if (isEditing) {
      setPanel('edit');
    }
  }, [isEditing, setPanel]);

  useEffect(() => {
    if (course) {
      form.reset({
        slug: course.slug || '',
        title: course.title || '',
        short_description: course.short_description || '',
        long_description: course.long_description || '',
        cover_url: course.cover_url || '',
        price: course.price?.toString() || '0',
        visibility: (course.visibility as any) || 'draft',
        is_active: course.is_active ?? true,
        instructor_name: course.instructor_name || '',
        instructor_title: course.instructor_title || '',
        instructor_bio: course.instructor_bio || '',
        instructor_photo_url: course.instructor_photo_url || '',
        badge_text: course.badge_text || '',
        highlights: course.highlights?.join(', ') || '',
        preview_video_id: course.preview_video_id || '',
        seo_keywords: course.seo_keywords?.join(', ') || '',
        og_image_url: course.og_image_url || '',
      });
    } else {
      form.reset({
        slug: '',
        title: '',
        short_description: '',
        long_description: '',
        cover_url: '',
        price: '0',
        visibility: 'draft',
        is_active: true,
        instructor_name: '',
        instructor_title: '',
        instructor_bio: '',
        instructor_photo_url: '',
        badge_text: '',
        highlights: '',
        preview_video_id: '',
        seo_keywords: '',
        og_image_url: '',
      });
    }
  }, [course, form]);

  const mutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      if (!userData) throw new Error('No user data');

      const courseData: any = {
        slug: data.slug,
        title: data.title,
        short_description: data.short_description || null,
        long_description: data.long_description || null,
        cover_url: data.cover_url || null,
        price: parseFloat(data.price),
        visibility: data.visibility,
        is_active: data.is_active,
        instructor_name: data.instructor_name || null,
        instructor_title: data.instructor_title || null,
        instructor_bio: data.instructor_bio || null,
        instructor_photo_url: data.instructor_photo_url || null,
        badge_text: data.badge_text || null,
        highlights: data.highlights 
          ? data.highlights.split(',').map(h => h.trim()).filter(Boolean)
          : null,
        preview_video_id: data.preview_video_id || null,
        seo_keywords: data.seo_keywords
          ? data.seo_keywords.split(',').map(k => k.trim()).filter(Boolean)
          : null,
        og_image_url: data.og_image_url || null,
      };

      if (isEditing && course) {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', course.id);

        if (error) throw error;
      } else {
        courseData.created_by = userData.user?.id;
        const { error } = await supabase
          .from('courses')
          .insert(courseData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      
      toast({
        title: isEditing ? 'Curso actualizado' : 'Curso creado',
        description: isEditing ? 'El curso se actualizó correctamente.' : 'El curso se creó correctamente.',
      });

      onClose();
    },
    onError: (error: any) => {
      console.error('Error en mutation:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el curso.',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = async (data: CourseFormData) => {
    setIsLoading(true);
    try {
      await mutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Información Básica</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="curso-ejemplo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nombre del curso" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="short_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción Corta</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descripción breve" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="long_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción Larga</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descripción detallada" rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cover_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de la Portada</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio (USD)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" placeholder="99.99" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibilidad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar visibilidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Público</SelectItem>
                          <SelectItem value="private">Privado</SelectItem>
                          <SelectItem value="draft">Borrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Curso Activo</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Instructor Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">🎓 Instructor</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="instructor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Instructor</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Juan Pérez" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructor_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Instructor</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Arquitecto Senior" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="instructor_bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografía del Instructor</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Breve biografía del instructor" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructor_photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de Foto del Instructor</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Marketing Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">🎨 Marketing</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="badge_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto de Badge</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nuevo, Bestseller, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preview_video_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID de Video de Vista Previa (Vimeo)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123456789" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="highlights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puntos Destacados</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Aprende ArchiCAD, Domina el modelado BIM, Crea renders profesionales (separar con comas)" 
                        rows={3} 
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Separar múltiples puntos con comas
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* SEO Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">🔍 SEO</h3>
              
              <FormField
                control={form.control}
                name="seo_keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Palabras Clave SEO</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="archicad, bim, modelado 3d, arquitectura (separar con comas)" 
                        rows={2} 
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Separar múltiples palabras clave con comas
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="og_image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de Imagen Open Graph</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Imagen para compartir en redes sociales (1200x630px recomendado)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormModalFooter
            cancelText="Cancelar"
            submitText={isEditing ? 'Actualizar Curso' : 'Crear Curso'}
            onSubmit={form.handleSubmit(onSubmit)}
            submitDisabled={isLoading}
            showLoadingSpinner={isLoading}
            onLeftClick={onClose}
          />
        </form>
      </Form>
  );

  return (
    <FormModalLayout 
      onClose={onClose} 
      wide
      editPanel={formContent}
      headerContent={
        <FormModalHeader
          icon={BookOpen}
          title={isEditing ? 'Editar Curso' : 'Nuevo Curso'}
          description={isEditing ? 'Modifica los datos del curso' : 'Crea un nuevo curso en la plataforma'}
        />
      }
    />
  );
}
