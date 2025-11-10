import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ProjectSubcontract {
  id: string
  project_id: string
  contact_id: string
  title: string
  description?: string
  status: string
  budget?: number
  contact: {
    id: string
    first_name: string
    last_name: string
    full_name?: string
    company_name?: string
    email?: string
    organization_id: string
  }
}

export function useProjectSubcontracts(projectId?: string) {
  return useQuery({
    queryKey: ['subcontracts', projectId],
    queryFn: async () => {
      if (!supabase || !projectId) {
        return []
      }

      const { data, error } = await supabase
        .from('subcontracts')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, full_name, company_name, email)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    },
    enabled: !!projectId,
  })
}