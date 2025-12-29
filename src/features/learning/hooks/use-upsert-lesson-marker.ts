import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertLessonMarker } from '../services';
import { learningKeys } from '@/core/query-keys';
import type { UpsertMarkerPayload } from '../types';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para crear o actualizar un marcador de lección.
 * 
 * Los marcadores son bookmarks en videos con timestamp obligatorio.
 * Útil para marcar momentos importantes o conceptos clave.
 * 
 * Invalida cache:
 * - lessonMarkers del lesson específico
 */
export function useUpsertLessonMarker() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: UpsertMarkerPayload) => upsertLessonMarker(payload),
    onSuccess: (data, variables) => {
      // Invalidar cache de marcadores de la lección
      queryClient.invalidateQueries({
        queryKey: learningKeys.lessonMarkers(variables.lessonId),
      });

      toast({
        title: "Marcador guardado",
        description: "El marcador ha sido guardado correctamente",
      });
    },
    onError: (error: any) => {
      console.error('Error upserting lesson marker:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el marcador",
        variant: "destructive",
      });
    },
  });
}
