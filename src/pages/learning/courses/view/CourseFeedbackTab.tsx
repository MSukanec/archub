import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, MessageSquareQuote, Trash2, Send, Info, Clock } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { useGlobalModalStore } from '@/components/modal';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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

  const { data: testimonial, isLoading } = useQuery<Testimonial | null>({
    queryKey: [`/api/courses/${courseId}/my-feedback`],
    enabled: !!courseId && !!userData?.user?.id
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (data: { content: string; rating: number; author_name: string }) => {
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
      author_name: userData?.user?.full_name || 'Usuario'
    });
  };

  const handleDelete = () => {
    openModal('delete-confirmation', {
      mode: 'simple',
      title: 'Eliminar Valoración',
      description: '¿Estás seguro de que querés eliminar tu valoración? Esta acción no se puede deshacer.',
      itemName: 'Tu valoración del curso',
      onConfirm: () => deleteFeedbackMutation.mutate()
    });
  };

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1" data-testid="star-rating-container">
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
                className={`w-6 h-6 ${
                  isFilled 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-muted-foreground'
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
        <div className="h-48 bg-muted/20 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (testimonial) {
    return (
      <div className="space-y-6" data-testid="course-feedback-tab">
        <Card data-testid="card-existing-feedback">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquareQuote className="w-5 h-5" />
              Tu Valoración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {renderStars(testimonial.rating || 0)}
              <span className="text-sm text-muted-foreground ml-2">
                {testimonial.rating} de 5 estrellas
              </span>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm whitespace-pre-wrap" data-testid="text-feedback-content">
                {testimonial.content}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  Enviado el {format(new Date(testimonial.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
              </div>
              
              {!testimonial.is_active && (
                <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
                  Pendiente de revisión
                </span>
              )}
            </div>

            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription className="text-sm">
                Una vez enviada, la valoración no puede editarse. Si deseas modificarla, deberás eliminarla y crear una nueva.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteFeedbackMutation.isPending}
                data-testid="button-delete-feedback"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteFeedbackMutation.isPending ? 'Eliminando...' : 'Eliminar Valoración'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="course-feedback-tab">
      <Card data-testid="card-create-feedback">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquareQuote className="w-5 h-5" />
            Deja tu Valoración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="text-sm">
              Tu opinión es muy valiosa y será visible públicamente en la página del curso. 
              Esto ayuda a futuros estudiantes a tomar mejores decisiones. 
              Tu valoración será revisada por el equipo docente antes de publicarse.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label className="text-sm font-medium">Puntuación</label>
            {renderStars(rating, true)}
            {rating > 0 && (
              <p className="text-xs text-muted-foreground">
                {rating === 1 && 'Muy malo'}
                {rating === 2 && 'Malo'}
                {rating === 3 && 'Regular'}
                {rating === 4 && 'Bueno'}
                {rating === 5 && 'Excelente'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="feedback-content" className="text-sm font-medium">
              Tu opinión
            </label>
            <Textarea
              id="feedback-content"
              placeholder="Comparte tu experiencia con el curso. ¿Qué te gustó? ¿Qué aprendiste? ¿Lo recomendarías?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="resize-none"
              data-testid="textarea-feedback-content"
            />
            <p className="text-xs text-muted-foreground">
              {content.length} caracteres
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={createFeedbackMutation.isPending || !content.trim() || rating === 0}
              data-testid="button-submit-feedback"
            >
              <Send className="w-4 h-4 mr-2" />
              {createFeedbackMutation.isPending ? 'Enviando...' : 'Enviar Valoración'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
