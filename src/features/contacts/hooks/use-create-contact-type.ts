import { useOptimisticMutation } from '@/core/save-engine';
import { createContactType } from '../services';
import { CONTACT_TYPE_QUERY_KEYS } from '../constants';
import type { ContactTypeInput } from '../types';

export function useCreateContactType(organizationId: string) {
  return useOptimisticMutation({
    mutationFn: (input: ContactTypeInput) => createContactType(organizationId, input),
    queryKey: CONTACT_TYPE_QUERY_KEYS.lists(),
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    onSuccessMessage: 'Tipo de contacto creado',
    onErrorMessage: 'No se pudo crear el tipo de contacto',
  });
}
