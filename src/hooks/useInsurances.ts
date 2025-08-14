import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  listInsurances, 
  getInsurance, 
  createInsurance, 
  updateInsurance, 
  deleteInsurance, 
  renewInsurance,
  uploadCertificate,
  type InsuranceFilters,
  type Insurance 
} from '@/services/insurances'
import { useToast } from '@/hooks/use-toast'

export const useInsuranceList = (filters: InsuranceFilters = {}) => {
  return useQuery({
    queryKey: ['insurances', filters.project_id, filters],
    queryFn: () => listInsurances(filters),
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

export const useInsurance = (id?: string) => {
  return useQuery({
    queryKey: ['insurance', id],
    queryFn: () => getInsurance(id!),
    enabled: !!id
  })
}

export const useCreateInsurance = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createInsurance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurances'] })
      queryClient.invalidateQueries({ queryKey: ['project-personnel'] })
      toast({
        title: "Seguro creado",
        description: "El seguro se ha creado correctamente"
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el seguro",
        variant: "destructive"
      })
    }
  })
}

export const useUpdateInsurance = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Insurance> }) =>
      updateInsurance(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurances'] })
      queryClient.invalidateQueries({ queryKey: ['project-personnel'] })
      toast({
        title: "Seguro actualizado",
        description: "El seguro se ha actualizado correctamente"
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el seguro",
        variant: "destructive"
      })
    }
  })
}

export const useDeleteInsurance = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteInsurance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurances'] })
      queryClient.invalidateQueries({ queryKey: ['project-personnel'] })
      toast({
        title: "Seguro eliminado",
        description: "El seguro se ha eliminado correctamente"
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el seguro",
        variant: "destructive"
      })
    }
  })
}

export const useRenewInsurance = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ prevId, payload }: { 
      prevId: string; 
      payload: {
        coverage_start: string;
        coverage_end: string;
        policy_number?: string;
        provider?: string;
        certificate_attachment_id?: string | null;
        notes?: string;
      }
    }) => renewInsurance(prevId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurances'] })
      queryClient.invalidateQueries({ queryKey: ['project-personnel'] })
      toast({
        title: "Seguro renovado",
        description: "El seguro se ha renovado correctamente"
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo renovar el seguro",
        variant: "destructive"
      })
    }
  })
}

export const useUploadCertificate = () => {
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ contactId, file }: { contactId: string; file: File }) =>
      uploadCertificate(contactId, file),
    onError: (error) => {
      toast({
        title: "Error de carga",
        description: "No se pudo cargar el certificado",
        variant: "destructive"
      })
    }
  })
}