import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertLessonNote } from '../services';
import { learningKeys } from '@/core/query-keys';
import type { UpsertLessonNotePayload } from '../types';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para crear o actualizar una nota de lección.
 * 
 * Permite crear notas generales, resúmenes o marcadores de tiempo.
 * Si la nota ya existe (mismo lessonId + note_type), la actualiza.
 * 
 * Invalida cache:
 * - lessonNotes del lesson específico
 */
export function useUpsertLessonNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: UpsertLessonNotePayload) => upsertLessonNote(payload),
    onSuccess: (data, variables) => {
      // Invalidar cache de notas de la lección
      queryClient.invalidateQueries({
        queryKey: learningKeys.lessonNotes(variables.lessonId),
      });

      toast({
        title: "Nota guardada",
        description: "La nota ha sido guardada correctamente",
      });
    },
    onError: (error: any) => {
      console.error('Error upserting lesson note:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la nota",
        variant: "destructive",
      });
    },
  });
}
