import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { InsertMovementSubcontract, MovementSubcontract } from '@shared/schema'
import { apiRequest } from '@/lib/queryClient'

export function useCreateMovementSubcontract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: InsertMovementSubcontract) => {
      return apiRequest(`/api/movement-subcontracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/movement-subcontracts'] })
    },
  })
}

export function useDeleteMovementSubcontract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/movement-subcontracts/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/movement-subcontracts'] })
    },
  })
}

export function useMovementSubcontractsByMovement(movementId: string | null) {
  return useQuery<MovementSubcontract[]>({
    queryKey: ['/api/movement-subcontracts', { movement_id: movementId }],
    enabled: !!movementId,
  })
}

export function useDeleteMovementSubcontractsByMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (movementId: string) => {
      return apiRequest(`/api/movement-subcontracts/by-movement/${movementId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/movement-subcontracts'] })
    },
  })
}