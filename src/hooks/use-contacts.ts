import { useQuery } from '@tanstack/react-query'
import { useProjectContext } from '@/stores/projectContext'

export function useContacts() {
  const { currentOrganizationId } = useProjectContext()

  return useQuery({
    queryKey: ['/api/contacts', currentOrganizationId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts?organization_id=${currentOrganizationId}`)
      if (!response.ok) throw new Error('Failed to fetch contacts')
      return response.json()
    },
    enabled: !!currentOrganizationId,
    retry: 0,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 600000
  })
}