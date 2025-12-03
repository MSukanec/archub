import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Plus, Pencil, Trash2, Star, MessageSquareQuote, Save } from 'lucide-react';
import { TestimonialsSection, TestimonialFormModal } from '@/features/learning';
import type { LandingSection, Testimonial } from '@shared/schema';

interface AdminCourseTestimonialsTabProps {
  courseId: string;
}

interface TestimonialsSectionData {
  title?: string;
  subtitle?: string;
  description?: string;
}

export default function AdminCourseTestimonialsTab({ courseId }: AdminCourseTestimonialsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isHydrated, setIsHydrated] = useState(false);

  const [testimonialsSection, setTestimonialsSection] = useState<TestimonialsSectionData>({
    title: 'OPINIONES DE ESTUDIANTES',
    subtitle: 'TESTIMONIOS',
    description: 'Lo que dicen nuestros estudiantes sobre el curso'
  });

  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);

  const { data: courseData } = useQuery({
    queryKey: ['/api/admin/courses', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch course');
      return res.json();
    },
    enabled: !!courseId && !!supabase
  });

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ['course-testimonials', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];

      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_deleted', false)
        .order('sort_index', { ascending: true });

      if (error) {
        console.error('Error fetching testimonials:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!courseId && !!supabase
  });

  useEffect(() => {
    if (courseData) {
      const sections = courseData.landing_sections;
      if (sections?.testimonials) {
        setTestimonialsSection({
          title: sections.testimonials.title || 'OPINIONES DE ESTUDIANTES',
          subtitle: sections.testimonials.subtitle || 'TESTIMONIOS',
          description: sections.testimonials.description || 'Lo que dicen nuestros estudiantes sobre el curso'
        });
      }
      setIsHydrated(true);
    }
  }, [courseData]);

  const saveSectionMutation = useMutation({
    mutationFn: async (dataToSave: { landing_sections: any }) => {
      if (!courseId || !supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...dataToSave,
          updated_at: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error('Failed to update course');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: "Cambios guardados",
        description: "La sección de testimonios se ha guardado automáticamente"
      });
    },
    onError: (error: any) => {
      console.error('Error saving testimonials section:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios de la sección",
        variant: "destructive"
      });
    }
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: async (testimonialId: string) => {
      const { deleteTestimonial } = await import('@/features/learning');
      return deleteTestimonial(testimonialId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-testimonials', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-landing'] });
      toast({
        title: "Testimonio eliminado",
        description: "El testimonio se eliminó correctamente"
      });
    },
    onError: (error: any) => {
      console.error('Error deleting testimonial:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el testimonio",
        variant: "destructive"
      });
    }
  });

  const updateTestimonialsSection = (field: keyof LandingSection, value: string) => {
    setTestimonialsSection(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpenTestimonialModal = (testimonial?: Testimonial) => {
    setSelectedTestimonial(testimonial || null);
    setIsTestimonialModalOpen(true);
  };

  const handleCloseTestimonialModal = () => {
    setSelectedTestimonial(null);
    setIsTestimonialModalOpen(false);
  };

  const handleDeleteTestimonial = async (testimonialId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este testimonio?')) {
      await deleteTestimonialMutation.mutateAsync(testimonialId);
    }
  };

  const { isSaving } = useAutoSave({
    data: {
      landing_sections: {
        ...(courseData?.landing_sections || {}),
        testimonials: testimonialsSection
      }
    },
    saveFn: async (dataToSave) => {
      return new Promise<void>((resolve, reject) => {
        saveSectionMutation.mutate(dataToSave, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        });
      });
    },
    delay: 1000,
    enabled: !!courseData && isHydrated
  });

  return (
    <div className="w-full space-y-8" data-testid="admin-course-testimonials-tab">
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Save className="h-4 w-4 animate-pulse" />
          <span>Guardando cambios...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="w-5 h-5 text-accent flex-shrink-0" />
              <h3 className="text-lg font-semibold">Sección de Testimonios</h3>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Personaliza el título y descripción de la sección de testimonios
              </p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="testimonials-section-title">Título de Sección</Label>
                <Input
                  id="testimonials-section-title"
                  value={testimonialsSection.title || ''}
                  onChange={(e) => updateTestimonialsSection('title', e.target.value)}
                  placeholder="Ej: OPINIONES DE ESTUDIANTES"
                  data-testid="input-testimonials-section-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testimonials-section-subtitle">Subtítulo de Sección</Label>
                <Input
                  id="testimonials-section-subtitle"
                  value={testimonialsSection.subtitle || ''}
                  onChange={(e) => updateTestimonialsSection('subtitle', e.target.value)}
                  placeholder="Ej: TESTIMONIOS"
                  data-testid="input-testimonials-section-subtitle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testimonials-section-description">Descripción de Sección</Label>
                <Textarea
                  id="testimonials-section-description"
                  value={testimonialsSection.description || ''}
                  onChange={(e) => updateTestimonialsSection('description', e.target.value)}
                  placeholder="Ej: Lo que dicen nuestros estudiantes sobre el curso"
                  rows={2}
                  data-testid="textarea-testimonials-section-description"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-4 mt-6">
            <div className="flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="text-lg font-semibold">Testimonios del Curso</h3>
              </div>
              <Button
                onClick={() => handleOpenTestimonialModal()}
                size="sm"
                data-testid="button-add-testimonial"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>

            <div className="space-y-2">
              {testimonials.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay testimonios creados. Haz clic en "Agregar" para crear uno.
                </p>
              ) : (
                <div className="space-y-2">
                  {testimonials.map((testimonial) => (
                    <div
                      key={testimonial.id}
                      className="flex items-start justify-between gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`testimonial-item-${testimonial.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{testimonial.author_name}</p>
                          {testimonial.rating && testimonial.rating > 0 && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: testimonial.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              ))}
                            </div>
                          )}
                          {!testimonial.is_active && (
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Inactivo</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {testimonial.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenTestimonialModal(testimonial)}
                          data-testid={`button-edit-testimonial-${testimonial.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                          data-testid={`button-delete-testimonial-${testimonial.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky top-24 bg-muted/20 border rounded-lg overflow-hidden lg:col-span-2">
          <TestimonialsSection
            testimonials={testimonials}
            title={testimonialsSection.title}
            subtitle={testimonialsSection.subtitle}
            description={testimonialsSection.description}
          />
        </div>
      </div>

      <TestimonialFormModal
        isOpen={isTestimonialModalOpen}
        onClose={handleCloseTestimonialModal}
        courseId={courseId}
        testimonial={selectedTestimonial}
      />
    </div>
  );
}
