import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Obtiene la lista de miembros de una organización con sus roles.
 * 
 * @param organizationId - ID de la organización
 * @param supabase - Cliente autenticado de Supabase
 * @param filters - Filtros opcionales (role)
 * @returns Lista formateada de miembros o error descriptivo
 */
export async function getOrganizationMembers(
  organizationId: string,
  supabase: SupabaseClient,
  filters?: { role?: string; includeInactive?: boolean }
): Promise<string> {
  
  try {
    // Construir query base
    let query = supabase
      .from('organization_members')
      .select(`
        id,
        user_id,
        organization_id,
        joined_at,
        last_active_at,
        is_active,
        role:roles(
          id,
          name,
          description
        ),
        user:users(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: true });

    // Aplicar filtro de activos/inactivos
    if (!filters?.includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: members, error } = await query;

    if (error) {
      console.error('Error fetching organization members:', error);
      return `Error al buscar miembros de la organización: ${error.message}`;
    }

    if (!members || members.length === 0) {
      return 'No hay miembros registrados en esta organización';
    }

    // Filtrar por rol si se especifica
    let filteredMembers = members;
    if (filters?.role) {
      filteredMembers = members.filter(member => {
        const role = Array.isArray(member.role) ? member.role[0] : member.role;
        return role?.name?.toLowerCase().includes(filters.role!.toLowerCase());
      });
      
      if (filteredMembers.length === 0) {
        const roleNames = members.map(m => {
          const role = Array.isArray(m.role) ? m.role[0] : m.role;
          return role?.name;
        }).filter(Boolean);
        const availableRoles = Array.from(new Set(roleNames));
        return `No se encontraron miembros con el rol "${filters.role}". Roles disponibles: ${availableRoles.join(', ')}`;
      }
    }

    // Formatear respuesta
    let response = `👥 Miembros de la organización (${filteredMembers.length})`;
    if (filters?.role) {
      response += ` - Rol: ${filters.role}`;
    }
    response += ':\n\n';

    // Agrupar por rol
    const membersByRole: Record<string, any[]> = {};
    
    filteredMembers.forEach(member => {
      const role = Array.isArray(member.role) ? member.role[0] : member.role;
      const roleName = role?.name || 'Sin rol';
      
      if (!membersByRole[roleName]) {
        membersByRole[roleName] = [];
      }
      membersByRole[roleName].push(member);
    });

    // Mostrar por rol
    const roleOrder = ['Admin', 'Member', 'Guest', 'Sin rol'];
    const sortedRoles = Object.keys(membersByRole).sort((a, b) => {
      const aIndex = roleOrder.indexOf(a);
      const bIndex = roleOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    sortedRoles.forEach(roleName => {
      const roleMembers = membersByRole[roleName];
      
      response += `\n📌 ${roleName} (${roleMembers.length}):\n`;
      
      roleMembers.forEach((member, index) => {
        const user = Array.isArray(member.user) ? member.user[0] : member.user;
        const name = user?.full_name || user?.email || 'Usuario sin nombre';
        
        response += `   ${index + 1}. ${name}`;
        
        if (user?.email && user?.email !== name) {
          response += ` (${user.email})`;
        }
        
        // Fecha de unión
        if (member.joined_at) {
          const joinedDate = new Date(member.joined_at).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          response += `\n      • Miembro desde: ${joinedDate}`;
        }
        
        // Última actividad
        if (member.last_active_at) {
          const lastActive = new Date(member.last_active_at);
          const now = new Date();
          const hoursDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60));
          
          let activityText;
          if (hoursDiff < 1) {
            activityText = 'Hace menos de 1 hora';
          } else if (hoursDiff < 24) {
            activityText = `Hace ${hoursDiff} horas`;
          } else {
            const daysDiff = Math.floor(hoursDiff / 24);
            activityText = `Hace ${daysDiff} día${daysDiff > 1 ? 's' : ''}`;
          }
          
          response += `\n      • Última actividad: ${activityText}`;
        }
        
        // Estado
        if (filters?.includeInactive) {
          response += `\n      • Estado: ${member.is_active ? 'Activo' : 'Inactivo'}`;
        }
        
        response += '\n';
      });
    });

    return response.trim();

  } catch (err) {
    console.error('Unexpected error in getOrganizationMembers:', err);
    return 'Error inesperado al buscar miembros. Por favor intenta nuevamente.';
  }
}
