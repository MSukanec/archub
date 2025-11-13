import { useQuery } from '@tanstack/react-query'
import { useProjectContext } from '@/stores/projectContext'

export function useContacts() {
  const { currentOrganizationId } = useProjectContext()

  return useQuery({
    queryKey: [`/api/contacts?organization_id=${currentOrganizationId}`],
    enabled: !!currentOrganizationId,
    retry: 0,
    staleTime: 30000,
    gcTime: 600000
  })
}