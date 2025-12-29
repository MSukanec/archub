import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLessonNote } from '../services';
import { learningKeys } from '@/core/query-keys';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para eliminar un marcador de lección.
 * 
 * Los marcadores se eliminan usando el mismo endpoint que las notas (deleteLessonNote).
 * Valida que el marcador pertenezca al usuario actual antes de eliminarlo.
 * 
 * Invalida cache:
 * - lessonMarkers del lesson al que pertenecía el marcador
 */
export function useDeleteLessonMarker(lessonId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (markerId: string) => deleteLessonNote(markerId),
    onSuccess: () => {
      // Invalidar cache de marcadores de la lección
      queryClient.invalidateQueries({
        queryKey: learningKeys.lessonMarkers(lessonId),
      });

      toast({
        title: "Marcador eliminado",
        description: "El marcador ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting lesson marker:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el marcador",
        variant: "destructive",
      });
    },
  });
}
