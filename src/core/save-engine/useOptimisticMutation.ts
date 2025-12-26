import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
export interface OptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: QueryKey;
  optimisticUpdate: (oldData: any, variables: TVariables) => any;
  onSuccessMessage?: string;
  onErrorMessage?: string;
  invalidateOnSuccess?: boolean;
  additionalQueryKeys?: QueryKey[];
}
export interface OptimisticMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}
export function useOptimisticMutation<TData = unknown, TVariables = unknown>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  onSuccessMessage,
  onErrorMessage = "No se pudieron guardar los cambios",
  invalidateOnSuccess = true,
  additionalQueryKeys = [],
}: OptimisticMutationOptions<TData, TVariables>): OptimisticMutationReturn<TData, TVariables> {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (oldData: any) => 
        optimisticUpdate(oldData, variables)
      );
      return { previousData };
    },
    onError: (error: Error, _variables: TVariables, context: any) => {
      console.error('Optimistic mutation error:', error);
      
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast({
        title: "Error",
        description: onErrorMessage,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      if (onSuccessMessage) {
        toast({
          title: "Guardado",
          description: onSuccessMessage,
        });
      }
      if (invalidateOnSuccess) {
        queryClient.invalidateQueries({ queryKey });
        additionalQueryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
