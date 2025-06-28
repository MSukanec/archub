import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useContactTypes() {
  return useQuery({
    queryKey: ['contact-types'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not available')
      
      const { data, error } = await supabase
        .from('contact_types')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data || []
    }
  })
}