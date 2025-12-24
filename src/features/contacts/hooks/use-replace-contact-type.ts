import { useOptimisticMutation } from '@/core/save-engine';
import { replaceContactType } from '../services';
import { contactsKeys, contactTypesKeys } from '@/core/query-keys';

interface ReplaceContactTypeParams {
  oldTypeId: string;
  newTypeId: string;
  organizationId: string;
}

export function useReplaceContactType(organizationId: string) {
  return useOptimisticMutation({
    mutationFn: ({ oldTypeId, newTypeId, organizationId }: ReplaceContactTypeParams) => 
      replaceContactType(oldTypeId, newTypeId, organizationId),
    queryKey: contactTypesKeys.list(organizationId),
    optimisticUpdate: (oldData, { oldTypeId }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((t: any) => t.id !== oldTypeId);
    },
    additionalQueryKeys: [contactsKeys.list(organizationId)],
    onSuccessMessage: 'Tipo de contacto reemplazado',
    onErrorMessage: 'No se pudo reemplazar el tipo de contacto',
  });
}
