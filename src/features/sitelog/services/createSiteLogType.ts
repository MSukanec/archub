import { supabase } from '@/lib/supabase';

export interface CreateSiteLogTypeData {
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  organizationId: string;
}

/**
 * Crea un nuevo tipo de bitácora personalizado para una organización.
 * 
 * @param data - Datos del nuevo tipo de bitácora
 * @returns El tipo de bitácora creado
 * @throws {Error} Si falla la creación
 */
export async function createSiteLogType(data: CreateSiteLogTypeData) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data: newType, error } = await supabase
    .from('site_log_types')
    .insert({
      name: data.name,
      code: data.code,
      description: data.description || null,
      icon: data.icon || null,
      color: data.color || null,
      is_default: false, // Los tipos personalizados nunca son default
      organization_id: data.organizationId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating site log type:', error);
    throw error;
  }

  return newType;
}
