import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, MessageSquareQuote, Clock } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal';
import { TestimonialCard } from '@/components/shared/TestimonialCard';
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

  const handleDeleteTestimonial = (testimonial: Testimonial) => {
    openModal('delete-confirmation', {
      mode: 'delete',
      title: 'Eliminar Testimonio',
      description: 'Esta acción eliminará el testimonio de forma permanente.',
      itemName: testimonial.author_name,
      itemDetails: testimonial.content?.slice(0, 100) + (testimonial.content && testimonial.content.length > 100 ? '...' : ''),
      onDelete: () => deleteTestimonialMutation.mutate(testimonial.id)
    });
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
          className="relative group"
          data-testid={`testimonial-card-${testimonial.id}`}
        >
          <TestimonialCard
            authorName={testimonial.author_name}
            authorTitle={testimonial.author_title || undefined}
            authorAvatarUrl={testimonial.author_avatar_url || undefined}
            content={testimonial.content}
          />
          
          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!testimonial.is_active && (
              <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1 mr-2">
                <Clock className="w-3 h-3" />
                Pendiente
              </span>
            )}
            {testimonial.is_featured && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full mr-2">
                Destacado
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEditTestimonial(testimonial)}
              data-testid={`button-edit-testimonial-${testimonial.id}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleDeleteTestimonial(testimonial)}
              data-testid={`button-delete-testimonial-${testimonial.id}`}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
