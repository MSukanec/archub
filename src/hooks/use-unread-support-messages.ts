import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useUnreadSupportMessages() {
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
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
}
