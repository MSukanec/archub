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
      subscribeToPresenceChanges();
    }

    // Cleanup: SOLO se ejecuta al desmontar o cuando userData.user cambia (login/logout)
    // NO incluimos isSubscribed en deps para evitar cleanup prematuro cuando el canal se conecta
    return () => {
      // Solo hacer cleanup si hay un usuario (evitar cleanup en mount inicial)
      if (userData?.user) {
        // FASE 1: Cerrar vista actual en analytics (fire-and-forget, async)
        (async () => {
          try {
            await supabase.rpc('analytics_exit_previous_view');
          } catch {
            // Silenciar error, es cleanup no crítico
          }
        })();
        
        // FASE 2: Desuscribirse de presence changes
        unsubscribe();
      }
    };
    // ⚠️ IMPORTANTE: NO incluir isSubscribed en dependencies para evitar cleanup prematuro
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.user]);

  // Este componente no renderiza nada
  return null;
}
