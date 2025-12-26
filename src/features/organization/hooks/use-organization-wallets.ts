import { useQuery } from '@tanstack/react-query';
import { getOrganizationWallets } from '../services';
import { organizationKeys } from '@/core/query-keys';
export function useOrganizationWallets(organizationId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.wallets(organizationId),
    queryFn: () => getOrganizationWallets(organizationId!),
    enabled: !!organizationId,
  });
}
