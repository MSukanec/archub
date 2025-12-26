import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient, apiRequest } from '@/lib/queryClient'
export interface HeroSection {
  id: string
  organization_id: string
  section_type: string
  order_index: number
  title: string
  description: string
  media_url?: string
  media_type?: 'image'| 'video'
  primary_button_text?: string
  primary_button_action?: string
  primary_button_action_type?: 'url'| 'internal_route'| 'external'
  secondary_button_text?: string
  secondary_button_action?: string
  secondary_button_action_type?: 'url'| 'internal_route'| 'external'
  is_active: boolean
  created_at: string
  updated_at: string
}
export function useHeroSections(sectionType: string = 'learning_dashboard') {
  return useQuery({
    queryKey: ['/api/layout/hero-sections', sectionType],
    queryFn: async () => {
      const res = await fetch(`/api/layout/hero-sections?section_type=${sectionType}`, {
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Failed to fetch hero sections')
      return res.json() as Promise<HeroSection[]>
    }
  })
}
export function useCreateHeroSection() {
  return useMutation({
    mutationFn: async (data: Partial<HeroSection>): Promise<HeroSection> => {
      console.log('[useCreateHeroSection] Starting API request...')
      const res = await apiRequest('POST', '/api/layout/hero-sections', data)
      console.log('[useCreateHeroSection] API response received:', res.status)
      return res.json()
    },
    onSuccess: () => {
      console.log('[useCreateHeroSection] Success, invalidating queries')
      queryClient.invalidateQueries({ queryKey: ['/api/layout/hero-sections'] })
    }
  })
}
export function useUpdateHeroSection() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HeroSection> }) => {
      return apiRequest('PATCH', `/api/layout/hero-sections/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/layout/hero-sections'] })
    }
  })
}
export function useDeleteHeroSection() {
  return useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/layout/hero-sections/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/layout/hero-sections'] })
    }
  })
}
export function useReorderHeroSections() {
  return useMutation({
    mutationFn: async (sections: Array<{ id: string; order_index: number }>) => {
      return apiRequest('POST', '/api/layout/hero-sections/reorder', { sections })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/layout/hero-sections'] })
    }
  })
}
