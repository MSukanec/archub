import { useQuery } from '@tanstack/react-query';
import { getContactsByType } from '../services';
import { contactsKeys } from '@/core/query-keys';
/**
 * Hook para obtener recuento de contactos agrupados por tipo.
 * Usa la vista contacts_by_type_view.
 */
export function useContactsByType(organizationId: string | undefined) {
  return useQuery({
    queryKey: [...contactsKeys.all, 'by-type', organizationId],
    queryFn: () => getContactsByType(organizationId!),
    enabled: !!organizationId,
    staleTime: 30000,
    gcTime: 600000,
  });
}
