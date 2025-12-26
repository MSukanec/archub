/**
 * Use AI Chat Hook
 * 
 * React Query mutation hook para enviar mensajes al asistente de IA.
 * Incluye invalidación del historial y manejo de errores con toast.
 * 
 * @returns Mutation para enviar mensajes
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendAIChatMessage } from '../services/sendAIChatMessage';
import { AI_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';

export function useAIChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) => sendAIChatMessage(message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.history() });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || 'No se pudo enviar el mensaje',
        variant: "destructive",
      });
    },
  });
}
