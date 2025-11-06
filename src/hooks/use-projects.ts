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
  color?: string
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
      console.log('=== useProjects DEBUG ===');
      console.log('organizationId:', organizationId);
      console.log('supabase:', !!supabase);
      
      if (!supabase || !organizationId) {
        console.error('Missing supabase or organizationId');
        throw new Error('Organization ID required')
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_data (
            project_type_id,
            modality_id,
            project_image_url,
            project_type:project_types(id, name),
            modality:modalities(id, name)
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      console.log('Supabase query result:', { data, error });
      
      if (error) {
        console.error('Supabase query error:', error);
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
              project_type: pd.project_type,
              modality: pd.modality
            }
          }
        }
        
        const transformedProject = {
          ...project,
          project_data: projectData
        }
        
        return transformedProject
      })

      console.log('Transformed projects with types:', transformedData);
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
            project_image_url,
            project_type:project_types(id, name),
            modality:modalities(id, name)
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
            project_image_url: pd.project_image_url,
            project_type: pd.project_type,
            modality: pd.modality
          }
        }
      }
      
      const transformedProject = {
        ...data,
        project_data: projectData
      }

      return transformedProject
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
      
      if (error) {
        throw error
      }
      
      // Transform to a map for easy lookup
      const projectsMap: Record<string, { id: string; name: string; color: string | null }> = {}
      
      data?.forEach(project => {
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