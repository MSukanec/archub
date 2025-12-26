import { useOptimisticMutation } from '@/core/save-engine';
import { createGeneralCost } from '../services/createGeneralCost';
import { generalCostsKeys } from '@/core/query-keys';
import type { InsertGeneralCost, GeneralCost } from '../types';
export function useCreateGeneralCost(organizationId: string | null) {
  return useOptimisticMutation({
    mutationFn: (generalCost: InsertGeneralCost) => createGeneralCost(generalCost),
    queryKey: generalCostsKeys.list(organizationId),
    optimisticUpdate: (oldData: GeneralCost[] | undefined, newCost: InsertGeneralCost) => {
      if (!oldData) return oldData;
      const tempCost: GeneralCost = {
        id: `temp-${Date.now()}`,
        name: newCost.name,
        description: newCost.description || null,
        organization_id: newCost.organization_id,
        category_id: newCost.category_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return [...oldData, tempCost];
    },
    additionalQueryKeys: [
      generalCostsKeys.byCategoryList(organizationId),
    ],
    onSuccessMessage: 'Gasto general creado',
    onErrorMessage: 'No se pudo crear el gasto general',
  });
}
