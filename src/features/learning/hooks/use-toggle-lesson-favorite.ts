import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleLessonFavorite } from '../services';
import { learningKeys } from '@/core/query-keys';
import { useToast } from '@/hooks/use-toast';

interface UseToggleLessonFavoriteProps {
  lessonId: string;
  courseId: string;
  currentlyFavorite: boolean;
}

/**
 * Hook para marcar/desmarcar una lección como favorita.
 * 
 * Incluye optimistic updates para una UX instantánea:
 * - Actualiza la UI inmediatamente
 * - Revierte si falla la mutación
 * - Invalida cache del progreso del curso
 */
export function useToggleLessonFavorite({
  lessonId,
  courseId,
  currentlyFavorite,
}: UseToggleLessonFavoriteProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null);

  const toggleFavoriteMutation = useMutation({
    mutationFn: (isFavorite: boolean) => toggleLessonFavorite(lessonId, isFavorite),
    onMutate: async (isFavorite: boolean) => {
      // ⚡ OPTIMISTIC UPDATE - Cancelar queries en progreso
      await queryClient.cancelQueries({
        queryKey: learningKeys.courseProgress(courseId),
      });

      // Guardar snapshot anterior para rollback
      const previousProgress = queryClient.getQueryData(
        learningKeys.courseProgress(courseId)
      );

      // Actualizar cache optimistamente
      queryClient.setQueryData(
        learningKeys.courseProgress(courseId),
        (old: any) => {
          if (!old || !Array.isArray(old)) return old;

          return old.map((item: any) =>
            item.lesson_id === lessonId ? { ...item, is_favorite: isFavorite } : item
          );
        }
      );

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
        queryClient.setQueryData(
          learningKeys.courseProgress(courseId),
          context.previousProgress
        );
      }

      console.error('Error toggling favorite:', error);
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
