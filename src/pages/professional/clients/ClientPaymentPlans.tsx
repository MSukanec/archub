import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import IndexedInstallmentPlan from '@/components/charts/clients/IndexedInstallmentPlan'

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

  // Fetch existing payment plan for the project
  const { data: existingPaymentPlan, isLoading: paymentPlanLoading } = useQuery({
    queryKey: ['project-payment-plan', projectId],
    queryFn: async () => {
      if (!supabase || !projectId) return null
      
      const { data, error } = await supabase
        .from('project_payment_plans')
        .select(`
          id,
          project_id,
          organization_id,
          payment_plan_id,
          installments_count,
          frequency,
          start_date,
          created_at,
          payment_plans(
            id,
            name,
            description
          )
        `)
        .eq('project_id', projectId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - no payment plan exists
          return null
        }
        console.error('Error fetching payment plan:', error)
        return null
      }

      return data
    },
    enabled: !!projectId
  })

  if (isLoading || paymentPlanLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Cargando cuotas...</div>
      </div>
    )
  }

  if (!existingPaymentPlan) {
    return (
      <EmptyState
        icon={<Calendar className="w-12 h-12 text-muted-foreground" />}
        title="No hay plan de pagos"
        description="Crea un plan de pagos para generar automáticamente todas las cuotas del proyecto con la frecuencia y fechas configuradas."
        action={
          <div className="flex gap-2 relative z-30">
            <Button 
              onClick={() => openModal('client-payment-plans', { projectId, organizationId })}
              variant="default"
              className="flex items-center gap-2 relative z-30"
            >
              <Plus className="h-4 w-4" />
              Nuevo Plan de Pagos
            </Button>

          </div>
        }
      />
    )
  }

  return (
    <IndexedInstallmentPlan 
      projectId={projectId} 
      organizationId={organizationId}
      onEditInstallment={handleEditInstallment}
      onDeleteInstallment={handleDeleteInstallment}
      paymentPlan={existingPaymentPlan}
    />
  )
}