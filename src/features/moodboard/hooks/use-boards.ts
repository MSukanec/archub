import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBoards } from '../services/getBoards';
import { createBoard, type CreateBoardInput } from '../services/createBoard';
import { QUERY_KEYS } from '../constants';
export function useBoards(projectId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.BOARDS, projectId],
    queryFn: () => getBoards(projectId),
    enabled: !!projectId,
    staleTime: 30 * 1000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in memory for 5 minutes
  });
}
export function useCreateBoard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateBoardInput) => createBoard(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOARDS, variables.project_id] });
    },
  });
}
