import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPin, type CreatePinInput } from '../services/createPin';
import { QUERY_KEYS } from '../constants';
export function useCreatePin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreatePinInput) => createPin(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PINS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOARDS] });
    },
  });
}
