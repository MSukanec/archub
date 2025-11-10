import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Obtiene información de actividad en tiempo real de la organización.
 * Incluye miembros online, última actividad y estadísticas de uso.
 * 
 * @param organizationId - ID de la organización
 * @param supabase - Cliente autenticado de Supabase
 * @returns Información formateada de actividad o error descriptivo
 */
export async function getOrganizationActivity(
  organizationId: string,
  supabase: SupabaseClient
): Promise<string> {
  
  try {
    // Obtener presencia en tiempo real de usuarios de la organización
    const { data: presenceData, error: presenceError } = await supabase
      .from('user_presence')
      .select(`
        user_id,
        status,
        current_view,
        updated_at,
        user:users(
          id,
          full_name,
          email
        )
      `)
      .eq('organization_id', organizationId);

    if (presenceError) {
      return `Error al obtener actividad de usuarios: ${presenceError.message}`;
    }

    // Calcular cuántos usuarios están online (actualizados en los últimos 5 minutos)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const onlineUsers = (presenceData || []).filter(presence => {
      if (!presence.updated_at) return false;
      const lastUpdate = new Date(presence.updated_at);
      return lastUpdate > fiveMinutesAgo && presence.status === 'online';
    });

    const recentlyActiveUsers = (presenceData || []).filter(presence => {
      if (!presence.updated_at) return false;
      const lastUpdate = new Date(presence.updated_at);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      return lastUpdate > oneHourAgo && lastUpdate <= fiveMinutesAgo;
    });

    // Obtener total de miembros para contexto
    const { count: totalMembers } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // Formatear respuesta
    let response = `📊 Actividad de la organización:\n\n`;
    
    // Estadísticas de presencia
    response += `👤 Estado de miembros:\n`;
    response += `   • Total de miembros: ${totalMembers || 0}\n`;
    response += `   • 🟢 Online ahora: ${onlineUsers.length} ${onlineUsers.length === 1 ? 'miembro' : 'miembros'}\n`;
    response += `   • 🟡 Activos en la última hora: ${recentlyActiveUsers.length}\n`;
    
    const percentageOnline = totalMembers ? Math.round((onlineUsers.length / totalMembers) * 100) : 0;
    response += `   • Porcentaje online: ${percentageOnline}%\n`;
    
    response += '\n';

    // Mostrar usuarios online si hay
    if (onlineUsers.length > 0) {
      response += `🟢 Miembros online (${onlineUsers.length}):\n`;
      
      onlineUsers.forEach((presence, index) => {
        const user = Array.isArray(presence.user) ? presence.user[0] : presence.user;
        const name = user?.full_name || user?.email || 'Usuario sin nombre';
        
        response += `   ${index + 1}. ${name}`;
        
        if (presence.current_view) {
          // Formatear el nombre de la vista de forma más amigable
          const viewName = presence.current_view
            .replace(/\//g, ' > ')
            .replace(/-/g, ' ')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          response += `\n      📍 Viendo: ${viewName}`;
        }
        
        if (presence.updated_at) {
          const lastUpdate = new Date(presence.updated_at);
          const minutesAgo = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
          
          if (minutesAgo < 1) {
            response += `\n      ⏱️ Actualizado: Ahora mismo`;
          } else {
            response += `\n      ⏱️ Actualizado: Hace ${minutesAgo} min`;
          }
        }
        
        response += '\n';
      });
      
      response += '\n';
    }

    // Mostrar usuarios recientemente activos
    if (recentlyActiveUsers.length > 0) {
      response += `🟡 Activos recientemente (${recentlyActiveUsers.length}):\n`;
      
      recentlyActiveUsers.slice(0, 5).forEach((presence, index) => {
        const user = Array.isArray(presence.user) ? presence.user[0] : presence.user;
        const name = user?.full_name || user?.email || 'Usuario sin nombre';
        
        response += `   ${index + 1}. ${name}`;
        
        if (presence.updated_at) {
          const lastUpdate = new Date(presence.updated_at);
          const minutesAgo = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
          
          response += ` - Hace ${minutesAgo} min`;
        }
        
        response += '\n';
      });
      
      if (recentlyActiveUsers.length > 5) {
        response += `   ... y ${recentlyActiveUsers.length - 5} más\n`;
      }
    }

    // Si no hay actividad reciente
    if (onlineUsers.length === 0 && recentlyActiveUsers.length === 0) {
      response += `\nℹ️ No hay miembros activos en este momento.\n`;
    }

    return response.trim();

  } catch (err) {
    return 'Error inesperado al obtener actividad de la organización. Por favor intenta nuevamente.';
  }
}
