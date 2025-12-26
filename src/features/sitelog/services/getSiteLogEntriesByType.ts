import { supabase } from '@/lib/supabase';

/**
 * Cuenta cuántas entradas de bitácora usan un tipo específico.
 * 
 * @param typeId - ID del tipo de bitácora
 * @returns Número de entradas que usan este tipo
 * @throws {Error} Si falla la query
 */
export async function getSiteLogEntriesByType(typeId: string): Promise<number> {
  if (!supabase || !typeId) {
    return 0;
  }

  const { count, error } = await supabase
    .from('site_logs')
    .select('*', { count: 'exact', head: true })
    .eq('entry_type_id', typeId);

  if (error) {
    console.error('Error counting site log entries:', error);
    throw error;
  }

  return count || 0;
}
