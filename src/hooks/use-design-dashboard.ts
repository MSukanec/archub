import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useDesignSummary(organizationId?: string, projectId?: string) {
  return useQuery({
    queryKey: ['designSummary', organizationId, projectId],
    queryFn: async () => {
      if (!organizationId || !projectId) {
        throw new Error('Organization ID and Project ID are required')
      }

      // Get design documents count
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('id, status')
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)

      if (docsError) {
        throw docsError
      }

      // Get design phases count (simplified - not using tasks for now)
      const { data: phases, error: phasesError } = await supabase
        .from('design_phases')
        .select('id, name')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)

      if (phasesError) {
        // Don't throw error, just continue without phases
      }

      const totalDocuments = documents?.length || 0
      const approvedDocuments = documents?.filter(doc => doc.status === 'aprobado').length || 0
      const pendingDocuments = documents?.filter(doc => doc.status === 'pendiente').length || 0
      const inReviewDocuments = documents?.filter(doc => doc.status === 'en_revision').length || 0

      const totalPhases = phases?.length || 0
      
      // Calculate basic progress based on approved vs total documents
      const progress = totalDocuments > 0 ? Math.round((approvedDocuments / totalDocuments) * 100) : 0

      return {
        totalDocuments,
        approvedDocuments,
        pendingDocuments,
        inReviewDocuments,
        totalPhases,
        totalTasks: 0, // Will be updated when task system is available
        completedTasks: 0, // Will be updated when task system is available
        progress
      }
    },
    enabled: !!organizationId && !!projectId,
  })
}

export function useRecentDesignDocuments(organizationId?: string, projectId?: string, limit: number = 5) {
  return useQuery({
    queryKey: ['recentDesignDocuments', organizationId, projectId, limit],
    queryFn: async () => {
      if (!organizationId || !projectId) {
        throw new Error('Organization ID and Project ID are required')
      }

      const { data, error } = await supabase
        .from('design_documents')
        .select(`
          *,
          creator:users!created_by(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    },
    enabled: !!organizationId && !!projectId,
  })
}

export function useDesignPhasesWithTasks(organizationId?: string, projectId?: string) {
  return useQuery({
    queryKey: ['designPhasesWithTasks', organizationId, projectId],
    queryFn: async () => {
      if (!organizationId || !projectId) {
        return []
      }

      // For now, return basic phases without tasks until task system is available
      const { data: phases, error: phasesError } = await supabase
        .from('design_phases')
        .select('id, name, organization_id')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .order('name', { ascending: true })

      if (phasesError) {
        return []
      }

      // Return phases with mock progress for now
      const phasesWithProgress = phases?.map(phase => ({
        id: phase.id,
        design_phases: { name: phase.name },
        progress: 0,
        status: 'pendiente',
        totalTasks: 0,
        completedTasks: 0
      })) || []

      return phasesWithProgress
    },
    enabled: !!organizationId && !!projectId,
  })
}

export function useUpcomingDesignTasks(organizationId?: string, projectId?: string, limit: number = 5) {
  return useQuery({
    queryKey: ['upcomingDesignTasks', organizationId, projectId, limit],
    queryFn: async () => {
      // Return empty array for now until task system is available
      return []
    },
    enabled: !!organizationId && !!projectId,
  })
}