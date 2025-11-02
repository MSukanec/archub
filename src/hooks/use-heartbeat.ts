import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para enviar heartbeat periódico a la base de datos
 * Actualiza la tabla user_presence para tracking de actividad en tiempo real
 * @param orgId - ID de la organización actual
 */
export function useHeartbeat(orgId: string | null | undefined) {
  useEffect(() => {
    // Función para enviar el heartbeat
    const sendHeartbeat = async () => {
      // Validar que orgId sea válido
      if (!orgId) {
        return;
      }

      try {
        // CRÍTICO: Verificar que el usuario esté autenticado antes de enviar heartbeat
        // Esto previene errores 401 durante el proceso de registro
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          // Usuario no autenticado, no enviar heartbeat
          return;
        }

        const { error } = await supabase.rpc('heartbeat', { 
          p_org_id: orgId 
        });

        if (error) {
          console.error('Error enviando heartbeat:', error);
        }
      } catch (err) {
        console.error('Error en heartbeat:', err);
      }
    };

    // Enviar heartbeat inmediatamente al montar
    sendHeartbeat();

    // Configurar intervalo para enviar cada 30 segundos
    const interval = setInterval(sendHeartbeat, 30_000);

    // Cleanup al desmontar
    return () => clearInterval(interval);
  }, [orgId]);
}
