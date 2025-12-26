import { useOptimisticMutation } from '@/core/save-engine';
import { generalCostsKeys } from '@/core/query-keys';
import { replaceGeneralCostCategory } from '../services/generalCostCategories';
import type { GeneralCostCategory } from '../types';
interface ReplaceParams {
  oldCategoryId: string;
  newCategoryId: string;
}
export function useReplaceGeneralCostCategory(organizationId: string | null) {
  return useOptimisticMutation({
    mutationFn: ({ oldCategoryId, newCategoryId }: ReplaceParams) =>
      replaceGeneralCostCategory(oldCategoryId, newCategoryId, organizationId!),
    queryKey: generalCostsKeys.categoryList(organizationId),
    optimisticUpdate: (oldData: GeneralCostCategory[] | undefined, { oldCategoryId }: ReplaceParams) => {
      if (!oldData) return oldData;
      return oldData.filter((cat) => cat.id !== oldCategoryId);
    },
    additionalQueryKeys: [
      generalCostsKeys.list(organizationId),
      generalCostsKeys.paymentList(organizationId),
      generalCostsKeys.monthlySummaryList(organizationId),
      generalCostsKeys.byCategoryList(organizationId),
    ],
    onSuccessMessage: 'Categoría reemplazada',
    onErrorMessage: 'No se pudo reemplazar la categoría',
  });
}
