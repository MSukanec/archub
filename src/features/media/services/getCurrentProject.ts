import { supabase } from '@/lib/supabase';
/**
 * Obtiene el proyecto actual verificando que pertenece a la organización.
 * 
 * Valida que el proyecto almacenado en las preferencias del usuario
 * pertenezca a la organización actual del usuario.
 * 
 * @param projectId - ID del proyecto a verificar
 * @param organizationId - ID de la organización
 * @returns El proyecto si existe y pertenece a la organización, null en caso contrario
 * @throws {Error} Si falla la query de Supabase
 */
export async function getCurrentProject(
  projectId: string | undefined,
  organizationId: string | undefined
) {
  if (!projectId || !organizationId || !supabase) {
    return null;
  }
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, organization_id')
    .eq('id', projectId)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false)
    .single();
  if (error) {
    console.log('Project not found in current organization:', error);
    return null;
  }
  return data;
}
