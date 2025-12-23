import { useOptimisticMutation } from '@/core/save-engine';
import { replaceContactType } from '../services';
import { CONTACT_TYPE_QUERY_KEYS, CONTACT_QUERY_KEYS } from '../constants';

interface ReplaceContactTypeParams {
  oldTypeId: string;
  newTypeId: string;
  organizationId: string;
}

export function useReplaceContactType() {
  return useOptimisticMutation({
    mutationFn: ({ oldTypeId, newTypeId, organizationId }: ReplaceContactTypeParams) => 
      replaceContactType(oldTypeId, newTypeId, organizationId),
    queryKey: CONTACT_TYPE_QUERY_KEYS.lists(),
    optimisticUpdate: (oldData, { oldTypeId }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((t: any) => t.id !== oldTypeId);
    },
    additionalQueryKeys: [CONTACT_QUERY_KEYS.lists()],
    onSuccessMessage: 'Tipo de contacto reemplazado',
    onErrorMessage: 'No se pudo reemplazar el tipo de contacto',
  });
}
