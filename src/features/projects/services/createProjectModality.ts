import { supabase } from '@/lib/supabase';
export interface CreateProjectModalityData {
  name: string;
  organizationId: string;
  createdBy: string;
}
/**
 * Crea una nueva modalidad de proyecto personalizada para una organización.
 * 
 * @param data - Datos de la modalidad de proyecto a crear
 * @throws {Error} Si falla la creación o faltan parámetros requeridos
 */
export async function createProjectModality(data: CreateProjectModalityData) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  if (!data.name || !data.organizationId || !data.createdBy) {
    throw new Error('Missing required parameters: name, organizationId, and createdBy are required');
  }
  const { error } = await supabase
    .from('project_modalities')
    .insert({
      name: data.name,
      organization_id: data.organizationId,
      created_by: data.createdBy,
      is_default: false,
    });
  if (error) {
    console.error('Error creating project modality:', error);
    throw error;
  }
}
