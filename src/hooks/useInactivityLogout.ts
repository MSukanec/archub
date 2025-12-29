import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// 60 minutos en milisegundos
const INACTIVITY_LIMIT = 60 * 60 * 1000;

/**
 * Hook global para logout automático por inactividad
 * 
 * Detecta actividad del usuario (mouse, teclado, scroll, touch)
 * Si el usuario está inactivo por más de INACTIVITY_LIMIT, se desloguea automáticamente
 * 
 * Uso:
 * ```
 * const { data: userData } = useCurrentUser();
 * useInactivityLogout(!!userData?.user); // Solo activar si está autenticado
 * ```
 */
export function useInactivityLogout(enabled = true) {
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      // El cambio de auth state se maneja automáticamente
      // y redirige al usuario a login
    } catch (error) {
      console.error('Error durante logout por inactividad:', error);
    }
  }, []);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Limpiar si se deshabilita
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Eventos que resetean el contador de inactividad
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    
    // Agregar listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Verificar inactividad cada 5 segundos
    timerRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceLastActivity > INACTIVITY_LIMIT) {
        handleLogout();
        // El interval se limpiará en el cleanup del useEffect
      }
    }, 5000);

    // Cleanup: Remover listeners e intervals
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, updateActivity, handleLogout]);
}
