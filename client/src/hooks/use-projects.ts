import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Project {
  id: string
  name: string
  status: string
  created_at: string
  created_by: string
  organization_id: string
  is_active: boolean
  project_data?: {
    project_type_id?: string
    modality_id?: string
    project_type?: {
      id: string
      name: string
    }
    modality?: {
      id: string
      name: string
    }
  }
  creator?: {
    id: string
    full_name?: string
    first_name?: string
    last_name?: string
    email: string
    avatar_url?: string
  }
}

export function useProjects(organizationId: string | undefined) {
  return useQuery<Project[]>({
    queryKey: ['projects', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) {
        throw new Error('Organization ID required')
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_data (
            project_type_id,
            modality_id,
            project_types (
              id,
              name
            ),
            project_modalities (
              id,
              name
            )
          ),
          organization_members!created_by (
            id,
            users (
              id,
              full_name,
              email,
              avatar_url,
              user_data (
                first_name,
                last_name
              )
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase error fetching projects:', error)
        throw error
      }
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(project => ({
        ...project,
        project_data: project.project_data?.[0] ? {
          project_type_id: project.project_data[0].project_type_id,
          modality_id: project.project_data[0].modality_id,
          project_type: project.project_data[0].project_types,
          modality: project.project_data[0].project_modalities
        } : undefined,
        creator: project.organization_members?.users ? {
          id: project.organization_members.users.id,
          full_name: project.organization_members.users.full_name,
          email: project.organization_members.users.email,
          avatar_url: project.organization_members.users.avatar_url,
          first_name: project.organization_members.users.user_data?.[0]?.first_name,
          last_name: project.organization_members.users.user_data?.[0]?.last_name
        } : undefined
      }))

      return transformedData
    },
    enabled: !!organizationId && !!supabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}