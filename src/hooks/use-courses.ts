import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Course } from '@shared/schema'

export function useCourses() {
  return useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      if (!supabase) return []
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching courses:', error)
        throw error
      }
      
      return data || []
    },
    enabled: !!supabase
  })
}
