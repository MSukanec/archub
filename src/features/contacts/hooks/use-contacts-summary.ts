import { useQuery } from '@tanstack/react-query';
import { getContactsSummary } from '../services';
import { contactsKeys } from '@/core/query-keys';

/**
 * Hook para obtener el resumen de contactos de una organización.
 * Usa la vista contacts_summary_view.
 */
export function useContactsSummary(organizationId: string | undefined) {
  return useQuery({
    queryKey: [...contactsKeys.all, 'summary', organizationId],
    queryFn: () => getContactsSummary(organizationId!),
    enabled: !!organizationId,
    staleTime: 30000,
    gcTime: 600000,
  });
}
