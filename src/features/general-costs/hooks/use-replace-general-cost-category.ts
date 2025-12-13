import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';
import { replaceGeneralCostCategory } from '../services/generalCostCategories';

export function useReplaceGeneralCostCategory(organizationId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      oldCategoryId,
      newCategoryId,
    }: {
      oldCategoryId: string;
      newCategoryId: string;
    }) => replaceGeneralCostCategory(oldCategoryId, newCategoryId, organizationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: GENERAL_COSTS_QUERY_KEYS.categoriesList(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: GENERAL_COSTS_QUERY_KEYS.list(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: GENERAL_COSTS_QUERY_KEYS.paymentsList(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: GENERAL_COSTS_QUERY_KEYS.monthlySummaryList(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: GENERAL_COSTS_QUERY_KEYS.byCategoryList(organizationId),
      });
      toast({
        title: 'Categoría reemplazada',
        description: 'Los gastos se reasignaron y la categoría se eliminó correctamente',
      });
    },
    onError: (error) => {
      console.error('Error replacing category:', error);
      toast({
        title: 'Error',
        description: 'No se pudo reemplazar la categoría',
        variant: 'destructive',
      });
    },
  });
}
