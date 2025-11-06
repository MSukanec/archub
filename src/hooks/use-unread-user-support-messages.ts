import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Hook para contar mensajes de soporte sin leer para el usuario normal
 * Cuenta mensajes del admin que el usuario no ha leído
 * 🔥 CON SUPABASE REALTIME - El componente padre debe suscribirse
 */
export function useUnreadUserSupportMessages(userId: string | undefined) {
  return useQuery({
    queryKey: ['unread-user-support-messages-count', userId],
    queryFn: async () => {
      if (!supabase || !userId) return 0;

      // Primero obtener el user_id de la tabla users usando el auth_id
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (!userData) return 0;

      // Contar mensajes del admin (sender='admin') que no han sido leídos por el usuario
      const { count, error } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.id)
        .eq('sender', 'admin')
        .eq('read_by_user', false);

      if (error) {
        console.error('Error fetching unread user support messages:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!userId,
    // Ya NO necesitamos polling - Realtime lo maneja desde el componente
    // Pero permitimos refetch al montar
    staleTime: 30000, // 30 segundos
  });
}
