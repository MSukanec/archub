import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface UseLessonFavoriteProps {
  lessonId: string;
  courseId: string;
  currentlyFavorite: boolean;
}

export function useLessonFavorite({ lessonId, courseId, currentlyFavorite }: UseLessonFavoriteProps) {
  const queryClient = useQueryClient();
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null);

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
      // Invalidar solo el cache de progreso específico
      queryClient.invalidateQueries({ 
        queryKey: ['/api/courses', courseId, 'progress'],
        exact: false 
      });
      
      // Limpiar estado optimista después de éxito
      setOptimisticFavorite(null);
    },
    onError: (error: any) => {
      console.error('Error toggling favorite:', error);
      // Revertir estado optimista en caso de error
      setOptimisticFavorite(null);
    },
  });

  const toggleFavorite = () => {
    const newValue = !currentlyFavorite;
    
    // ⚡ UPDATE OPTIMISTA INSTANTÁNEO
    setOptimisticFavorite(newValue);
    
    // Ejecutar mutación en background
    toggleFavoriteMutation.mutate(newValue);
  };

  return {
    toggleFavorite,
    isLoading: toggleFavoriteMutation.isPending,
    optimisticFavorite, // Exponer estado optimista para UI
  };
}
