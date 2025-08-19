import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'
import { Table } from '@/components/ui-custom/Table'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/ui-custom/EmptyState'

interface ClientPaymentPlansProps {
  projectId: string
  organizationId: string
}

export function ClientPaymentPlans({ projectId, organizationId }: ClientPaymentPlansProps) {
  const { openModal } = useGlobalModalStore()

  // Fetch installments data
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

  const columns = [
    {
      key: "number",
      label: "Número de Cuota",
      width: "25%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => (
        <div className="text-sm font-medium">
          Cuota #{item.number}
        </div>
      )
    },
    {
      key: "created_at", 
      label: "Fecha de Creación",
      width: "35%",
      sortable: true,
      sortType: "date" as const,
      render: (item: any) => {
        const date = new Date(item.created_at)
        return (
          <div className="text-sm">
            {date.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        )
      }
    },
    {
      key: "status",
      label: "Estado",
      width: "40%",
      render: (item: any) => (
        <div className="text-sm text-muted-foreground">
          Pendiente
        </div>
      )
    }
  ]

  const handleEdit = (item: any) => {
    // TODO: Implement edit functionality
    console.log('Edit installment:', item)
  }

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
            <Button 
              onClick={() => openModal('client-installment', { projectId, organizationId })}
              className="flex items-center gap-2 relative z-30"
            >
              <Plus className="h-4 w-4" />
              Nueva Cuota
            </Button>
          </div>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <Table
        data={installments}
        columns={columns}
        defaultSort={{ key: 'number', direction: 'asc' }}
        getItemId={(item) => item.id}
        onCardClick={handleEdit}
        renderCard={(item) => (
          <div className="p-4 border rounded-lg space-y-2 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="font-medium">Cuota #{item.number}</div>
            <div className="text-sm text-muted-foreground">
              Creada: {new Date(item.created_at).toLocaleDateString('es-ES')}
            </div>
            <div className="text-sm text-muted-foreground">Estado: Pendiente</div>
          </div>
        )}
      />
    </div>
  )
}