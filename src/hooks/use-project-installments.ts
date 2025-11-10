import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from './use-current-user'
import { supabase } from '@/lib/supabase'

export interface ProjectInstallment {
  id: string
  number: number
  date: string
  index_reference: number | null
  project_id: string
  organization_id: string
  created_at: string
  updated_at: string
  created_by: string | null
}

export function useProjectInstallments(projectId?: string, options?: { enabled?: boolean }) {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id

  return useQuery({
    queryKey: ['project-installments', projectId],
    queryFn: async (): Promise<ProjectInstallment[]> => {
      if (!supabase || !projectId || !organizationId) {
        console.log('useProjectInstallments - Missing parameters:', { supabase: !!supabase, projectId, organizationId })
        throw new Error('Missing required parameters')
      }
      
      console.log('useProjectInstallments - Fetching with:', { projectId, organizationId })
      
      const { data, error } = await supabase
        .from('project_installments')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('number', { ascending: true })

      console.log('useProjectInstallments - Query result:', { data, error, count: data?.length || 0 })
      
      if (error) {
        console.error('useProjectInstallments - Query error:', error)
        throw error
      }
      
      return data || []
    },
    enabled: options?.enabled !== false && !!projectId && !!organizationId && !!supabase
  })
}