import { supabase } from '@/lib/supabase';

export interface CreateSiteLogTypeData {
  name: string;
  description?: string | null;
  organizationId: string;
  createdBy: string;
}

/**
 * Crea un nuevo tipo de bitácora personalizado para una organización.
 * 
 * @param data - Datos del nuevo tipo de bitácora
 * @returns El tipo de bitácora creado
 * @throws {Error} Si falla la creación o si faltan parámetros requeridos
 */
export async function createSiteLogType(data: CreateSiteLogTypeData) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  if (!data.name || !data.organizationId || !data.createdBy) {
    throw new Error('Missing required parameters: name, organizationId, and createdBy are required');
  }

  const { data: newType, error } = await supabase
    .from('site_log_types')
    .insert({
      name: data.name,
      description: data.description || null,
      is_default: false,
      organization_id: data.organizationId,
      created_by: data.createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating site log type:', error);
    throw error;
  }

  return newType;
}
