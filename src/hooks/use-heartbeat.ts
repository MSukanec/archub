import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para enviar heartbeat periódico a la base de datos
 * Actualiza la tabla user_presence para tracking de actividad en tiempo real
 * @param orgId - ID de la organización actual
 */
export function useHeartbeat(orgId: string | null | undefined) {
  useEffect(() => {
    console.log('🔥 useHeartbeat: Hook montado con orgId:', orgId);
    
    // Función para enviar el heartbeat
    const sendHeartbeat = async () => {
      // Validar que orgId sea válido
      if (!orgId) {
        console.warn('Heartbeat no enviado porque orgId es inválido:', orgId);
        return;
      }

      try {
        console.log('Enviando heartbeat...', { 
          orgId, 
          timestamp: new Date().toISOString() 
        });

        const { error } = await supabase.rpc('heartbeat', { 
          p_org_id: orgId 
        });

        if (error) {
          console.error('❌ Error enviando heartbeat:', error);
        } else {
          console.log('✅ Heartbeat enviado exitosamente');
        }
      } catch (err) {
        console.error('❌ Error en heartbeat:', err);
      }
    };

    // Enviar heartbeat inmediatamente al montar
    sendHeartbeat();

    // Configurar intervalo para enviar cada 30 segundos
    const interval = setInterval(sendHeartbeat, 30_000);

    console.log('🔥 useHeartbeat: Intervalo configurado (cada 30s)');

    // Cleanup al desmontar
    return () => {
      console.log('🔥 useHeartbeat: Limpiando intervalo');
      clearInterval(interval);
    };
  }, [orgId]);
}
