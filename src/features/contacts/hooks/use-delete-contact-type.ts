import { useOptimisticMutation } from '@/core/save-engine';
import { softDeleteContactType } from '../services';
import { CONTACT_TYPE_QUERY_KEYS } from '../constants';

export function useDeleteContactType(organizationId: string) {
  return useOptimisticMutation({
    mutationFn: (typeId: string) => softDeleteContactType(typeId, organizationId),
    queryKey: CONTACT_TYPE_QUERY_KEYS.lists(),
    optimisticUpdate: (oldData, typeId) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((t: any) => t.id !== typeId);
    },
    onSuccessMessage: 'Tipo de contacto eliminado',
    onErrorMessage: 'No se pudo eliminar el tipo de contacto',
  });
}
