/**
 * Use AI History Hook
 * 
 * React Query hook para obtener el historial de conversación con la IA.
 * El historial se carga bajo demanda (no automáticamente) para ahorrar recursos.
 * 
 * @param enabled - Si debe ejecutar la query automáticamente (default: false)
 * @returns Query con el historial de mensajes
 */
import { useQuery } from '@tanstack/react-query';
import { getAIHistory } from '../services/getAIHistory';
import { AI_QUERY_KEYS } from '../constants';
export function useAIHistory(enabled: boolean = false) {
  return useQuery({
    queryKey: AI_QUERY_KEYS.history(),
    queryFn: () => getAIHistory(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
