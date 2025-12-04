import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Star, MessageSquareQuote, User, Clock } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Testimonial } from '@shared/schema';

interface AdminCourseTestimonialsTabProps {
  courseId: string;
}

export default function AdminCourseTestimonialsTab({ courseId }: AdminCourseTestimonialsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useGlobalModalStore();

  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
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

  const handleEditTestimonial = (testimonial: Testimonial) => {
    openModal('testimonial', { courseId, testimonial });
  };

  const handleDeleteTestimonial = async (testimonialId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este testimonio?')) {
      await deleteTestimonialMutation.mutateAsync(testimonialId);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-4" data-testid="admin-course-testimonials-tab">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <div className="w-full" data-testid="admin-course-testimonials-tab">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquareQuote className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No hay testimonios
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Agrega testimonios de estudiantes para mostrar en la página del curso.
            Usa el botón "Agregar Testimonio" en la parte superior.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4" data-testid="admin-course-testimonials-tab">
      {testimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className="bg-card border rounded-lg p-6"
          data-testid={`testimonial-card-${testimonial.id}`}
        >
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage src={testimonial.author_avatar_url || undefined} alt={testimonial.author_name} />
              <AvatarFallback>
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{testimonial.author_name}</h4>
                    {testimonial.rating && testimonial.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < testimonial.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                    )}
                    {!testimonial.is_active && (
                      <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pendiente de revisión
                      </span>
                    )}
                    {testimonial.is_featured && (
                      <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                        Destacado
                      </span>
                    )}
                  </div>
                  {testimonial.author_title && (
                    <p className="text-sm text-muted-foreground mt-0.5">{testimonial.author_title}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditTestimonial(testimonial)}
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
              
              <p className="text-sm mt-3 leading-relaxed">{testimonial.content}</p>
              
              {testimonial.created_at && (
                <p className="text-xs text-muted-foreground mt-3">
                  Creado el {format(new Date(testimonial.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
