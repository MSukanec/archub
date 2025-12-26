import { useOptimisticMutation } from '@/core/save-engine';
import { softDeleteContactType } from '../services';
import { contactTypesKeys } from '@/core/query-keys';

export function useDeleteContactType(organizationId: string) {
  return useOptimisticMutation({
    mutationFn: (typeId: string) => softDeleteContactType(typeId, organizationId),
    queryKey: contactTypesKeys.list(organizationId),
    optimisticUpdate: (oldData, typeId) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((t: any) => t.id !== typeId);
    },
    onSuccessMessage: 'Tipo de contacto eliminado',
    onErrorMessage: 'No se pudo eliminar el tipo de contacto',
  });
}
