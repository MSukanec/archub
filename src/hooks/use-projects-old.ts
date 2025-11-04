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
    project_image_url?: string
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
            project_types!project_type_id (
              id,
              name
            ),
            modalities!modality_id (
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
        throw error
      }
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(project => {
        // Handle project_data which can be an array or object
        let projectData = null
        if (project.project_data) {
          const pd = Array.isArray(project.project_data) ? project.project_data[0] : project.project_data
          if (pd) {
            projectData = {
              project_type_id: pd.project_type_id,
              modality_id: pd.modality_id,
              project_image_url: pd.project_image_url,
              project_type: pd.project_types,
              modality: pd.modalities
            }
          }
        }
        
        const transformedProject = {
          ...project,
          project_data: projectData,
          creator: project.organization_members?.users ? {
            id: project.organization_members.users.id,
            full_name: project.organization_members.users.full_name,
            email: project.organization_members.users.email,
            avatar_url: project.organization_members.users.avatar_url,
            first_name: project.organization_members.users.user_data?.[0]?.first_name,
            last_name: project.organization_members.users.user_data?.[0]?.last_name
          } : undefined
        }
        
        // Check if this project is the currently selected one
        transformedProject.is_active = false
        
        return transformedProject
      })

      return transformedData
    },
    enabled: !!organizationId && !!supabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook para obtener un proyecto específico
export function useProject(projectId: string | undefined) {
  return useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!supabase || !projectId) {
        throw new Error('Project ID required')
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_data (
            project_type_id,
            modality_id,
            project_types!project_type_id (
              id,
              name
            ),
            modalities!modality_id (
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
        .eq('id', projectId)
        .eq('is_active', true)
        .single()
      
      if (error) {
        throw error
      }
      
      // Transform the data to match our interface
      let projectData = null
      if (data.project_data) {
        const pd = Array.isArray(data.project_data) ? data.project_data[0] : data.project_data
        if (pd) {
          projectData = {
            project_type_id: pd.project_type_id,
            modality_id: pd.modality_id,
            project_type: pd.project_types,
            modality: pd.modalities
          }
        }
      }
      
      const transformedProject = {
        ...data,
        project_data: projectData,
        creator: data.organization_members?.users ? {
          id: data.organization_members.users.id,
          full_name: data.organization_members.users.full_name,
          email: data.organization_members.users.email,
          avatar_url: data.organization_members.users.avatar_url,
          first_name: data.organization_members.users.user_data?.[0]?.first_name,
          last_name: data.organization_members.users.user_data?.[0]?.last_name
        } : undefined
      }

      return transformedProject
    },
    enabled: !!projectId && !!supabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

