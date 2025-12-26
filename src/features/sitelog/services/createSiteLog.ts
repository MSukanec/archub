import { supabase } from '@/lib/supabase';
export interface CreateSiteLogData {
  log_date: string;
  created_by: string;
  entry_type_id: string;
  weather: string | null;
  severity: string;
  status: string;
  comments?: string;
  is_public: boolean;
  is_favorite: boolean;
  project_id: string;
  organization_id: string;
}
/**
 * Crea una nueva bitácora en un proyecto.
 * 
 * @param data - Datos de la bitácora a crear
 * @returns La bitácora creada con su ID
 * @throws {Error} Si falla la creación en Supabase
 */
export async function createSiteLog(data: CreateSiteLogData) {
  if (!supabase) {
    throw new Error('Error de conexión con la base de datos');
  }
  const { data: result, error } = await supabase
    .from('site_logs')
    .insert([data])
    .select()
    .single();
  if (error) throw new Error(error.message);
  
  return result;
}
