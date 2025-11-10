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
  organization_id: string
  project_id: string
  client_id: string
  unit: string | null
  committed_amount: number | null
  currency_id: string | null
  created_at: string
  contact: any // Supabase returns joined data structure
}

export function useProjectClients(projectId?: string, options?: { enabled?: boolean }) {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id

  return useQuery({
    queryKey: ['project-clients', projectId],
    queryFn: async (): Promise<ProjectClient[]> => {
      if (!supabase || !projectId || !organizationId) {
        throw new Error('Missing required parameters')
      }
      
      
      const { data, error } = await supabase
        .from('project_clients')
        .select(`
          id,
          organization_id,
          project_id,
          client_id,
          unit,
          committed_amount,
          currency_id,
          created_at,
          contact:client_id (
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone,
            full_name
          )
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      
      if (error) {
        throw error
      }
      
      return data || []
    },
    enabled: options?.enabled !== false && !!projectId && !!organizationId && !!supabase
  })
}