import { supabase } from '@/lib/supabase';

export interface LaborType {
  id: string;
  name: string;
}

export async function getLaborTypes(): Promise<LaborType[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('labor_types')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching labor types:', error);
    throw error;
  }

  return (data as LaborType[]) || [];
}
