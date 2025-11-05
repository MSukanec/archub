import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { usePresenceStore } from '@/stores/presenceStore';
import { usePresenceTracker } from '@/hooks/use-presence-tracker';
import { supabase } from '@/lib/supabase';

/**
 * Componente que inicializa el sistema de presencia y analítica:
 * 1. Suscribe a cambios en tiempo real de user_presence
 * 2. Trackea automáticamente cambios de vista (con analytics)
 * 3. Limpia suscripciones y cierra sesiones al desloguearse
 */
export function PresenceInitializer() {
  const { data: userData } = useCurrentUser();
  const { subscribeToPresenceChanges, unsubscribe, isSubscribed } = usePresenceStore();
  
  // Auto-track de cambios de vista (hook personalizado)
  usePresenceTracker();

  useEffect(() => {
    // Solo inicializar si el usuario está autenticado
    if (userData?.user && !isSubscribed) {
      console.log('🟢 Inicializando sistema de presencia...');
      
      // Suscribirse a cambios en tiempo real
      subscribeToPresenceChanges();
    }

    // Cleanup: Cerrar sesión analytics y desuscribirse de presence
    return () => {
      console.log('🔴 Limpiando presencia y cerrando sesión analytics...');
      
      // FASE 1: Cerrar vista actual en analytics (fire-and-forget)
      supabase.rpc('analytics_exit_previous_view').catch(() => {
        // Silenciar error, es cleanup no crítico
      });
      
      // FASE 2: Desuscribirse de presence changes
      unsubscribe();
    };
  }, [userData?.user, isSubscribed, subscribeToPresenceChanges, unsubscribe]);

  // Este componente no renderiza nada
  return null;
}
