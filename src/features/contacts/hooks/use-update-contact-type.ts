import { useOptimisticMutation } from '@/core/save-engine';
import { updateContactType } from '../services';
import { contactTypesKeys } from '@/core/query-keys';
import type { ContactTypeInput } from '../types';
interface UpdateContactTypeParams {
  typeId: string;
  input: ContactTypeInput;
}
export function useUpdateContactType(organizationId: string) {
  return useOptimisticMutation({
    mutationFn: ({ typeId, input }: UpdateContactTypeParams) =>
      updateContactType(typeId, organizationId, input),
    queryKey: contactTypesKeys.list(organizationId),
    optimisticUpdate: (oldData, { typeId, input }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.map((t: any) => 
        t.id === typeId ? { ...t, ...input } : t
      );
    },
    onSuccessMessage: 'Tipo de contacto actualizado',
    onErrorMessage: 'No se pudo actualizar el tipo de contacto',
  });
}
