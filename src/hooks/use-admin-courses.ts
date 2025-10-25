import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Course } from '@shared/schema'

export function useAdminCourses() {
  return useQuery<Course[]>({
    queryKey: ['/api/admin/courses'],
    queryFn: async () => {
      if (!supabase) return []
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const res = await fetch('/api/admin/courses', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      })

      if (!res.ok) throw new Error('Failed to fetch courses')
      return res.json()
    },
    enabled: !!supabase
  })
}
