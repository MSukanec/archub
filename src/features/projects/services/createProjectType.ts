import { supabase } from '@/lib/supabase';

export interface CreateProjectTypeData {
  name: string;
  organizationId: string;
  createdBy: string;
}

/**
 * Crea un nuevo tipo de proyecto personalizado para una organización.
 * 
 * @param data - Datos del tipo de proyecto a crear
 * @throws {Error} Si falla la creación o faltan parámetros requeridos
 */
export async function createProjectType(data: CreateProjectTypeData) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  if (!data.name || !data.organizationId || !data.createdBy) {
    throw new Error('Missing required parameters: name, organizationId, and createdBy are required');
  }

  const { error } = await supabase
    .from('project_types')
    .insert({
      name: data.name,
      organization_id: data.organizationId,
      created_by: data.createdBy,
      is_default: false,
    });

  if (error) {
    console.error('Error creating project type:', error);
    throw error;
  }
}
