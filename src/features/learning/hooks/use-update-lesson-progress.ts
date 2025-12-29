import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLessonProgress } from '../services';
import { learningKeys } from '@/core/query-keys';
import type { UpdateLessonProgressPayload } from '../types';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para actualizar el progreso de una lección.
 * 
 * Permite actualizar:
 * - Porcentaje de progreso
 * - Última posición en segundos (para videos)
 * - Estado de completado
 * - Fecha de completado
 * 
 * Auto-completa la lección cuando el progreso >= 95%.
 * 
 * Invalida cache:
 * - lessonProgress del lesson específico
 * - courseProgress del curso completo (para actualizar listas)
 */
export function useUpdateLessonProgress(courseId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: UpdateLessonProgressPayload) => updateLessonProgress(payload),
    onSuccess: (data, variables) => {
      // Invalidar progreso de la lección específica
      queryClient.invalidateQueries({
        queryKey: learningKeys.lessonProgress(variables.lessonId),
      });

      // Invalidar progreso del curso si se proporciona courseId
      if (courseId) {
        queryClient.invalidateQueries({
          queryKey: learningKeys.courseProgress(courseId),
        });
      }

      // Mostrar toast si la lección se completó
      if (variables.is_completed || (variables.progress_pct && variables.progress_pct >= 95)) {
        toast({
          title: "¡Lección completada!",
          description: "Has completado esta lección correctamente",
        });
      }
    },
    onError: (error: any) => {
      console.error('Error updating lesson progress:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el progreso",
        variant: "destructive",
      });
    },
  });
}
