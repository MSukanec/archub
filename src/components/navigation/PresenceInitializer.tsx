import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { usePresenceStore } from '@/stores/presenceStore';
import { usePresenceTracker } from '@/hooks/use-presence-tracker';

/**
 * Componente que inicializa el sistema de presencia:
 * 1. Suscribe a cambios en tiempo real de user_presence
 * 2. Trackea automáticamente cambios de vista
 * 3. Limpia suscripciones al desloguearse
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

    // Cleanup: desuscribirse cuando el usuario se desloguee
    return () => {
      if (isSubscribed) {
        console.log('🔴 Limpiando suscripción de presencia...');
        unsubscribe();
      }
    };
  }, [userData?.user, isSubscribed, subscribeToPresenceChanges, unsubscribe]);

  // Este componente no renderiza nada
  return null;
}
