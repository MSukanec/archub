import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Star, MessageSquareQuote, Trash2, Send, MoreHorizontal } from 'lucide-react';
import { useCurrentUser } from '@/features/users/hooks';
import { useGlobalModalStore } from '@/components/modal';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { StatCard, StatCardTitle, StatCardMeta } from '@/components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Testimonial } from '@shared/schema';

interface CourseFeedbackTabProps {
  courseId: string;
}

export default function CourseFeedbackTab({ courseId }: CourseFeedbackTabProps) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();
  
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [content, setContent] = useState<string>('');
  const [authorTitle, setAuthorTitle] = useState<string>('');

  const { data: testimonial, isLoading } = useQuery<Testimonial | null>({
    queryKey: [`/api/courses/${courseId}/my-feedback`],
    enabled: !!courseId && !!userData?.user?.id
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (data: { content: string; rating: number; author_name: string; author_title?: string }) => {
      const response = await apiRequest('POST', `/api/courses/${courseId}/feedback`, data);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al enviar valoración');
      }
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/my-feedback`] });
      toast({
        title: "¡Valoración enviada!",
        description: "Tu valoración será revisada por el equipo docente antes de publicarse.",
      });
      setRating(0);
      setContent('');
      setAuthorTitle('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo enviar la valoración",
        variant: "destructive",
      });
    }
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/courses/${courseId}/feedback`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al eliminar valoración');
      }
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/my-feedback`] });
      toast({
        title: "Valoración eliminada",
        description: "Tu valoración ha sido eliminada correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar la valoración",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!content.trim() || rating === 0) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, escribe tu valoración y selecciona una puntuación.",
        variant: "destructive",
      });
      return;
    }

    createFeedbackMutation.mutate({
      content: content.trim(),
      rating,
      author_name: userData?.user?.full_name || 'Usuario',
      author_title: authorTitle.trim() || undefined
    });
  };

  const handleDelete = () => {
    openModal('delete-confirmation', {
      mode: 'delete',
      title: 'Eliminar Valoración',
      description: '¿Estás seguro de que querés eliminar tu valoración? Esta acción no se puede deshacer.',
      itemName: 'Tu valoración del curso',
      onDelete: () => deleteFeedbackMutation.mutate()
    });
  };

  const renderStars = (currentRating: number, interactive: boolean = false, size: 'sm' | 'md' = 'md') => {
    const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex gap-0.5" data-testid="star-rating-container">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive 
            ? star <= (hoveredRating || rating)
            : star <= currentRating;
          
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && setRating(star)}
              onMouseEnter={() => interactive && setHoveredRating(star)}
              onMouseLeave={() => interactive && setHoveredRating(0)}
              className={`transition-colors ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
              data-testid={`star-${star}`}
            >
              <Star
                className={`${sizeClasses} ${
                  isFilled 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-muted-foreground/40'
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-32 bg-muted/20 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (testimonial) {
    return (
      <div data-testid="course-feedback-tab">
        <StatCard data-testid="card-existing-feedback" className="relative">
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  data-testid="button-feedback-actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={deleteFeedbackMutation.isPending}
                  className="flex items-center gap-2 text-sm cursor-pointer text-foreground hover:text-red-600 dark:hover:text-red-500 transition-colors"
                  data-testid="button-delete-feedback"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteFeedbackMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            <StatCardTitle showArrow={false} className="flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4" />
              Tu Valoración
            </StatCardTitle>
            {renderStars(testimonial.rating || 0, false, 'sm')}
            {!testimonial.is_active && (
              <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">
                Pendiente
              </span>
            )}
          </div>

          <div className="mt-3 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm whitespace-pre-wrap" data-testid="text-feedback-content">
              {testimonial.content}
            </p>
          </div>

          <StatCardMeta className="mt-2">
            Enviado el {format(new Date(testimonial.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </StatCardMeta>
        </StatCard>
      </div>
    );
  }

  return (
    <div data-testid="course-feedback-tab">
      <StatCard data-testid="card-create-feedback">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <StatCardTitle showArrow={false} className="flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4" />
            Deja tu Valoración
          </StatCardTitle>
          <div className="flex items-center gap-2">
            {renderStars(rating, true, 'md')}
            {rating > 0 && (
              <span className="text-xs text-muted-foreground">
                {rating === 1 && 'Muy malo'}
                {rating === 2 && 'Malo'}
                {rating === 3 && 'Regular'}
                {rating === 4 && 'Bueno'}
                {rating === 5 && 'Excelente'}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Input
            placeholder="¿Cuál es tu profesión? Ej: Arquitecto, Ingeniero Civil, Estudiante..."
            value={authorTitle}
            onChange={(e) => setAuthorTitle(e.target.value)}
            data-testid="input-feedback-author-title"
          />

          <Textarea
            placeholder="Comparte tu experiencia con el curso. ¿Qué te gustó? ¿Qué aprendiste? ¿Lo recomendarías?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="resize-none"
            data-testid="textarea-feedback-content"
          />

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {content.length} caracteres
            </p>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={createFeedbackMutation.isPending || !content.trim() || rating === 0}
              data-testid="button-submit-feedback"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {createFeedbackMutation.isPending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </StatCard>
    </div>
  );
}
