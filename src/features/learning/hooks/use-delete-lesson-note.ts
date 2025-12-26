import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLessonNote } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';
import { useToast } from '@/hooks/use-toast';
/**
 * Hook para eliminar una nota de lección.
 * 
 * Endpoint genérico que funciona tanto para notas como para marcadores.
 * Valida que la nota pertenezca al usuario actual antes de eliminarla.
 * 
 * Invalida cache:
 * - lessonNotes del lesson al que pertenecía la nota
 */
export function useDeleteLessonNote(lessonId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (noteId: string) => deleteLessonNote(noteId),
    onSuccess: () => {
      // Invalidar cache de notas de la lección
      queryClient.invalidateQueries({
        queryKey: LEARNING_QUERY_KEYS.lessonNotes(lessonId),
      });
      toast({
        title: "Nota eliminada",
        description: "La nota ha sido eliminada correctamente",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting lesson note:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la nota",
        variant: "destructive",
      });
    },
  });
}
