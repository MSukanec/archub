import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Obtiene información básica de la organización actual.
 * 
 * @param organizationId - ID de la organización
 * @param supabase - Cliente autenticado de Supabase
 * @returns Información formateada de la organización o error descriptivo
 */
export async function getOrganizationInfo(
  organizationId: string,
  supabase: SupabaseClient
): Promise<string> {
  
  try {
    // Obtener información de la organización con el plan
    const { data: organization, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        description,
        is_active,
        is_system,
        created_at,
        updated_at,
        logo_url,
        contact_email,
        contact_phone,
        website,
        address,
        city,
        country,
        plan:plans(
          id,
          name,
          features,
          price
        )
      `)
      .eq('id', organizationId)
      .single();

    if (error) {
      return `Error al obtener información de la organización: ${error.message}`;
    }

    if (!organization) {
      return 'No se encontró la organización';
    }

    // Obtener estadísticas adicionales
    const { count: memberCount } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const { count: projectCount } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // Formatear respuesta
    let response = `📊 Información de "${organization.name}":\n\n`;
    
    // Información básica
    response += `📋 Datos generales:\n`;
    response += `   • Nombre: ${organization.name}\n`;
    
    if (organization.description) {
      response += `   • Descripción: ${organization.description}\n`;
    }
    
    response += `   • Estado: ${organization.is_active ? 'Activa' : 'Inactiva'}\n`;
    
    // Plan
    const plan = Array.isArray(organization.plan) ? organization.plan[0] : organization.plan;
    if (plan) {
      response += `   • Plan: ${plan.name}`;
      if (plan.price > 0) {
        response += ` ($${plan.price}/mes)`;
      }
      response += '\n';
    }
    
    response += '\n';
    
    // Estadísticas
    response += `📈 Estadísticas:\n`;
    response += `   • Miembros: ${memberCount || 0} ${memberCount === 1 ? 'miembro' : 'miembros'}\n`;
    response += `   • Proyectos activos: ${projectCount || 0}\n`;
    
    response += '\n';
    
    // Información de contacto (si existe)
    if (organization.contact_email || organization.contact_phone || organization.website) {
      response += `📞 Contacto:\n`;
      
      if (organization.contact_email) {
        response += `   • Email: ${organization.contact_email}\n`;
      }
      
      if (organization.contact_phone) {
        response += `   • Teléfono: ${organization.contact_phone}\n`;
      }
      
      if (organization.website) {
        response += `   • Sitio web: ${organization.website}\n`;
      }
      
      response += '\n';
    }
    
    // Ubicación (si existe)
    if (organization.address || organization.city || organization.country) {
      response += `📍 Ubicación:\n`;
      
      if (organization.address) {
        response += `   • Dirección: ${organization.address}\n`;
      }
      
      if (organization.city) {
        response += `   • Ciudad: ${organization.city}\n`;
      }
      
      if (organization.country) {
        response += `   • País: ${organization.country}\n`;
      }
      
      response += '\n';
    }
    
    // Fecha de creación
    response += `ℹ️ Metadata:\n`;
    const createdDate = new Date(organization.created_at).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    response += `   • Fecha de creación: ${createdDate}\n`;
    
    if (organization.updated_at && organization.updated_at !== organization.created_at) {
      const updatedDate = new Date(organization.updated_at).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      response += `   • Última actualización: ${updatedDate}\n`;
    }

    return response;

  } catch (err) {
    return 'Error inesperado al obtener información de la organización. Por favor intenta nuevamente.';
  }
}
