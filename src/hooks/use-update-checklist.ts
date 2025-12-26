import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateHomeChecklist } from '@/features/users/services/onboardingChecklist';
import { usersKeys } from '@/core/query-keys';

interface UpdateChecklistParams {
  key: string;
  value: boolean;
}

/**
 * Hook para actualizar el checklist de inicio del usuario.
 * 
 * Permite marcar tareas completadas en el onboarding/checklist inicial.
 * Invalida la cache del usuario actual tras actualizar.
 * 
 * @returns Mutation de TanStack Query con la función mutateAsync
 * 
 * @example
 * const updateChecklist = useUpdateChecklist();
 * 
 * // Marcar que el usuario creó su primer proyecto
 * await updateChecklist.mutateAsync({ 
 *   key: 'create_project', 
 *   value: true 
 * });
 */
export function useUpdateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: UpdateChecklistParams) => {
      await updateHomeChecklist(key, value);
    },
    onSuccess: () => {
      // Invalidar cache del usuario para reflejar el checklist actualizado
      queryClient.invalidateQueries({ queryKey: usersKeys.current() });
    },
    onError: (error) => {
      console.error('Error in useUpdateChecklist:', error);
    }
  });
}
