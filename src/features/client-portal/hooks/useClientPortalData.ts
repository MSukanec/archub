import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ClientPortalData } from '../types';

interface UseClientPortalDataOptions {
  projectId: string;
  clientId?: string;
}

export function useClientPortalData({ projectId, clientId }: UseClientPortalDataOptions) {
  return useQuery<ClientPortalData>({
    queryKey: ['/api/client-portal', projectId, clientId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (clientId) {
        params.set('clientId', clientId);
      }
      
      const url = `/api/client-portal/${projectId}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          headers['Authorization'] = `Bearer ${data.session.access_token}`;
        }
      } catch {
      }
      
      const response = await fetch(url, {
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.error || 'Error al cargar datos del portal');
      }
      
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    placeholderData: keepPreviousData,
  });
}
