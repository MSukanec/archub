import { useQuery } from '@tanstack/react-query';
import { getMovementSubcontracts, type MovementSubcontractData } from '../services';
import { SUBCONTRACT_QUERY_KEYS } from '../constants';
export function useMovementSubcontracts(movementId?: string) {
  return useQuery<MovementSubcontractData[]>({
    queryKey: SUBCONTRACT_QUERY_KEYS.movementSubcontracts(movementId || ''),
    queryFn: () => getMovementSubcontracts(movementId!),
    enabled: !!movementId,
  });
}
