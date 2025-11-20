import { useQuery } from '@tanstack/react-query';
import { getOrganizationWallets } from '../services';
import { ORGANIZATION_QUERY_KEYS } from '../constants';

export function useOrganizationWallets(organizationId: string | undefined) {
  return useQuery({
    queryKey: ORGANIZATION_QUERY_KEYS.wallets(organizationId!),
    queryFn: () => getOrganizationWallets(organizationId!),
    enabled: !!organizationId,
  });
}
