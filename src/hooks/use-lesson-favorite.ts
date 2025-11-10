import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface UseLessonFavoriteProps {
  lessonId: string;
  courseId: string;
  currentlyFavorite: boolean;
}

export function useLessonFavorite({ lessonId, courseId, currentlyFavorite }: UseLessonFavoriteProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (isFavorite: boolean) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get session with error handling
      let session = null;
      try {
        const { data } = await supabase.auth.getSession();
        session = data?.session;
      } catch (error) {
        // Silently handle auth errors - no session available
        throw new Error('No hay sesión activa');
      }
      
      if (!session?.access_token) {
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
    onMutate: async (isFavorite: boolean) => {
      // ⚡ OPTIMISTIC UPDATE - Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: ['/api/courses', courseId, 'progress'] });

      // Guardar snapshot anterior para rollback
      const previousProgress = queryClient.getQueryData(['/api/courses', courseId, 'progress']);

      // Actualizar cache optimistamente
      queryClient.setQueryData(['/api/courses', courseId, 'progress'], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        
        return old.map((item: any) => 
          item.lesson_id === lessonId 
            ? { ...item, is_favorite: isFavorite }
            : item
        );
      });

      return { previousProgress };
    },
    onSuccess: (data, isFavorite) => {
      // Mostrar toast de éxito
      toast({
        title: isFavorite ? "Agregado a favoritos" : "Quitado de favoritos",
        description: isFavorite 
          ? "La lección fue agregada a tus favoritos" 
          : "La lección fue quitada de tus favoritos",
      });
      
      // Limpiar estado optimista
      setOptimisticFavorite(null);
    },
    onError: (error: any, _isFavorite, context) => {
      // Revertir cache al estado anterior
      if (context?.previousProgress) {
        queryClient.setQueryData(['/api/courses', courseId, 'progress'], context.previousProgress);
      }
      
      toast({
        title: "Error",
        description: error.message || "No se pudo marcar como favorito",
        variant: "destructive",
      });
      
      // Revertir estado optimista
      setOptimisticFavorite(null);
    },
  });

  const toggleFavorite = () => {
    const newValue = !currentlyFavorite;
    
    // ⚡ UPDATE UI INSTANTÁNEO
    setOptimisticFavorite(newValue);
    
    // Ejecutar mutación con optimistic update
    toggleFavoriteMutation.mutate(newValue);
  };

  return {
    toggleFavorite,
    isLoading: toggleFavoriteMutation.isPending,
    optimisticFavorite,
  };
}
