import { supabase } from '@/lib/supabase';

/**
 * Obtiene el personal asignado a un proyecto específico.
 * 
 * CRÍTICO: Filtra por project_id Y organization_id para seguridad multi-tenant.
 * Incluye información del contacto (first_name, last_name).
 * 
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Array de personal del proyecto con datos del contacto, o array vacío
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getProjectPersonnel(projectId: string, organizationId: string) {
  if (!supabase || !projectId || !organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_personnel')
    .select(`
      id,
      contact_id,
      contacts (
        id,
        first_name,
        last_name
      )
    `)
    .eq('project_id', projectId)
    .eq('organization_id', organizationId);

  if (error) throw error;
  
  return data || [];
}
