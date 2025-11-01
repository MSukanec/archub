import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface UseLessonFavoriteProps {
  lessonId: string;
  courseId: string;
  currentlyFavorite: boolean;
}

export function useLessonFavorite({ lessonId, courseId, currentlyFavorite }: UseLessonFavoriteProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (isFavorite: boolean) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(`/api/lessons/${lessonId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_favorite: isFavorite }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al marcar favorito');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache de progreso del curso
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'progress'] });
      
      toast({
        title: currentlyFavorite ? "Quitado de favoritos" : "Agregado a favoritos",
        description: currentlyFavorite 
          ? "La lección fue quitada de tus favoritos" 
          : "La lección fue agregada a tus favoritos",
      });
    },
    onError: (error: any) => {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo marcar como favorito",
        variant: "destructive",
      });
    },
  });

  const toggleFavorite = () => {
    toggleFavoriteMutation.mutate(!currentlyFavorite);
  };

  return {
    toggleFavorite,
    isLoading: toggleFavoriteMutation.isPending,
  };
}
