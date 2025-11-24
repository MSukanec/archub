import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Re-export from feature hooks to avoid duplication and use backend API
export { useProjects } from '@/features/projects/hooks/use-projects'

interface Project {
  id: string
  name: string
  status: string
  created_at: string
  created_by: string
  organization_id: string
  is_active: boolean
  color?: string
  is_deleted: boolean
  deleted_at?: string | null
  project_data?: {
    project_type_id?: string
    project_modality_id?: string
    image_bucket?: string | null
    image_path?: string | null
    project_type?: {
      id: string
      name: string
    }
    project_modality?: {
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
        .select(`*`)
        .eq('id', projectId)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .single()
      
      if (error) {
        throw error
      }

      return data
    },
    enabled: !!projectId && !!supabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook para obtener un mapa de proyectos con colores (usado en la tabla de movimientos en modo GENERAL)
export function useProjectsMap(organizationId: string | undefined) {
  return useQuery<Record<string, { id: string; name: string; color: string | null }>>({
    queryKey: ['projects-map', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) {
        throw new Error('Organization ID required')
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, color')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('is_deleted', false)
      
      if (error) {
        throw error
      }
      
      // Transform to a map for easy lookup
      const projectsMap: Record<string, { id: string; name: string; color: string | null }> = {}
      
      data?.forEach((project: any) => {
        projectsMap[project.id] = {
          id: project.id,
          name: project.name,
          color: project.color
        }
      })
      
      return projectsMap
    },
    enabled: !!organizationId && !!supabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
