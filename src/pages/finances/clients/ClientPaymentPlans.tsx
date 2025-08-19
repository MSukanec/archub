import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import InstallmentHeatmapChart from '@/components/charts/clients/InstallmentHeatmapChart'

interface ClientPaymentPlansProps {
  projectId: string
  organizationId: string
}

export function ClientPaymentPlans({ projectId, organizationId }: ClientPaymentPlansProps) {
  const { openModal } = useGlobalModalStore()

  const handleEditInstallment = (installment: any) => {
    openModal('client-installment', { 
      projectId, 
      organizationId,
      installmentId: installment.id,
      isEditing: true,
      editingInstallment: installment
    })
  }

  const handleDeleteInstallment = (installment: any) => {
    // Could open a confirmation modal or handle deletion directly
    console.log('Delete installment:', installment)
  }

  // Fetch installments to check if any exist
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['project-installments', projectId],
    queryFn: async () => {
      if (!supabase || !projectId) return []
      
      const { data, error } = await supabase
        .from('project_installments')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('number', { ascending: true })

      if (error) {
        console.error('Error fetching installments:', error)
        throw error
      }

      return data || []
    },
    enabled: !!projectId && !!organizationId && !!supabase
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Cargando cuotas...</div>
      </div>
    )
  }

  if (installments.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-12 h-12 text-muted-foreground" />}
        title="No hay cuotas definidas"
        description="Crea una cuota individual o genera un plan completo para gestionar los pagos mensuales del proyecto."
        action={
          <div className="flex gap-2 relative z-30">
            <Button 
              onClick={() => openModal('client-payment-plans', { projectId, organizationId })}
              variant="secondary"
              className="flex items-center gap-2 relative z-30"
            >
              <Plus className="h-4 w-4" />
              Crear Plan de Cuotas
            </Button>

          </div>
        }
      />
    )
  }

  return (
    <InstallmentHeatmapChart 
      projectId={projectId} 
      organizationId={organizationId}
      onEditInstallment={handleEditInstallment}
      onDeleteInstallment={handleDeleteInstallment}
    />
  )
}