import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'
import { Table } from '@/components/ui-custom/Table'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/ui-custom/EmptyState'

interface ClientMonthlyInstallmentsProps {
  projectId: string
  organizationId: string
}

export function ClientMonthlyInstallments({ projectId, organizationId }: ClientMonthlyInstallmentsProps) {
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

  const handleCreateInstallments = () => {
    openModal('client-payment-plans', {
      projectId,
      organizationId
    })
  }

  const handleEdit = (item: any) => {
    // TODO: Implement edit functionality
    console.log('Edit installment:', item)
  }

  const handleDelete = (item: any) => {
    // TODO: Implement delete functionality  
    console.log('Delete installment:', item)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Cargando cuotas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Plan de Cuotas Mensuales</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona las cuotas mensuales del proyecto
          </p>
        </div>
        <Button
          onClick={handleCreateInstallments}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Crear Plan de Cuotas
        </Button>
      </div>

      {/* Installments table */}
      {installments.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="No hay cuotas definidas"
          description="Crea un plan de cuotas para comenzar a gestionar los pagos mensuales del proyecto."
          action={
            <Button onClick={handleCreateInstallments} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Plan de Cuotas
            </Button>
          }
        />
      ) : (
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
      )}
    </div>
  )
}