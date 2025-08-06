import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import type { SubcontractBid, InsertSubcontractBid } from '../../shared/schema'

// Hook para obtener ofertas de un subcontrato específico
export function useSubcontractBids(subcontractId: string | null) {
  return useQuery<SubcontractBid[]>({
    queryKey: ['/api/subcontract-bids', subcontractId],
    enabled: !!subcontractId,
  })
}

// Hook para obtener todas las ofertas de una organización
export function useAllSubcontractBids(organizationId: string | null) {
  return useQuery<SubcontractBid[]>({
    queryKey: ['/api/subcontract-bids/organization', organizationId],
    enabled: !!organizationId,
  })
}

// Hook para obtener una oferta específica
export function useSubcontractBid(bidId: string | null) {
  return useQuery<SubcontractBid>({
    queryKey: ['/api/subcontract-bids/bid', bidId],
    enabled: !!bidId,
  })
}

// Hook para crear una nueva oferta
export function useCreateSubcontractBid() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: InsertSubcontractBid) =>
      apiRequest('/api/subcontract-bids', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      // Invalidar las consultas relacionadas
      queryClient.invalidateQueries({
        queryKey: ['/api/subcontract-bids', variables.subcontract_id]
      })
      queryClient.invalidateQueries({
        queryKey: ['/api/subcontract-bids/organization']
      })
    },
  })
}

// Hook para actualizar una oferta
export function useUpdateSubcontractBid() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { id: string } & Partial<InsertSubcontractBid>) =>
      apiRequest(`/api/subcontract-bids/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      // Invalidar las consultas relacionadas
      queryClient.invalidateQueries({
        queryKey: ['/api/subcontract-bids']
      })
      if (variables.subcontract_id) {
        queryClient.invalidateQueries({
          queryKey: ['/api/subcontract-bids', variables.subcontract_id]
        })
      }
    },
  })
}

// Hook para eliminar una oferta
export function useDeleteSubcontractBid() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (bidId: string) =>
      apiRequest(`/api/subcontract-bids/${bidId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      // Invalidar todas las consultas de ofertas
      queryClient.invalidateQueries({
        queryKey: ['/api/subcontract-bids']
      })
    },
  })
}