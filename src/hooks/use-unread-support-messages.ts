import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface UseUnreadSupportMessagesOptions {
  enabled?: boolean;
}

/**
 * Hook para contar mensajes sin leer para ADMIN
 * Cuenta mensajes de usuarios que el admin no ha leído
 * 🔥 CON SUPABASE REALTIME - El componente padre debe suscribirse
 */
export function useUnreadSupportMessages(options: UseUnreadSupportMessagesOptions = {}) {
  const { enabled = true } = options;
  
  return useQuery({
    queryKey: ['unread-support-messages-count'],
    queryFn: async () => {
      if (!supabase) return 0;

      // Contar mensajes de usuarios (sender='user') que no han sido leídos por el admin
      const { count, error } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender', 'user')
        .eq('read_by_admin', false);

      if (error) {
        console.error('Error fetching unread support messages:', error);
        return 0;
      }

      return count || 0;
    },
    enabled,
    // Ya NO necesitamos polling - Realtime lo maneja desde el componente
    // Pero permitimos refetch al montar
    staleTime: 30000, // 30 segundos
  });
}
