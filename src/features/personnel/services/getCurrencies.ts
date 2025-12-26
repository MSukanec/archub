import { supabase } from '@/lib/supabase';

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

export async function getCurrencies(): Promise<Currency[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('currencies')
    .select('id, code, name, symbol')
    .order('code', { ascending: true });

  if (error) {
    console.error('Error fetching currencies:', error);
    throw error;
  }

  return (data as Currency[]) || [];
}
