import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from './use-current-user'
import { supabase } from '@/lib/supabase'

interface Contact {
  id: string
  first_name: string
  last_name: string
  company_name: string
  email: string
  phone: string
  full_name: string
}

export interface ProjectClient {
  id: string
  project_id: string
  client_id: string
  committed_amount: number
  currency_id: string
  role: string
  is_active: boolean
  notes: string
  created_at: string
  updated_at: string
  contact: Contact
}

export function useProjectClients(projectId?: string, options?: { enabled?: boolean }) {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id

  return useQuery({
    queryKey: ['project-clients', projectId],
    queryFn: async (): Promise<ProjectClient[]> => {
      if (!supabase || !projectId || !organizationId) {
        console.log('useProjectClients - Missing parameters:', { supabase: !!supabase, projectId, organizationId })
        throw new Error('Missing required parameters')
      }
      
      console.log('useProjectClients - Fetching with:', { projectId, organizationId })
      
      const { data, error } = await supabase
        .from('project_clients')
        .select(`
          *,
          contact:contacts!inner(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone,
            full_name,
            organization_id
          )
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      console.log('useProjectClients - Query result:', { data, error, count: data?.length || 0 })
      
      if (error) {
        console.error('useProjectClients - Query error:', error)
        throw error
      }
      
      return data || []
    },
    enabled: options?.enabled !== false && !!projectId && !!organizationId && !!supabase,
    onError: (error) => {
      console.error('useProjectClients - Hook error:', error)
    },
    onSuccess: (data) => {
      console.log('useProjectClients - Hook success:', data?.length || 0, 'clients loaded')
    }
  })
}