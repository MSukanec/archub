import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDate } from '@/lib/date-utils'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import InstallmentDetailCard from '@/components/ui/cards/InstallmentDetailCard'
import { Receipt, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ClientPaymentsProps {
  projectId: string
  organizationId: string
}

export function ClientPayments({ projectId, organizationId }: ClientPaymentsProps) {
  const { openModal } = useGlobalModalStore()
  
  // Fetch installments (movements) data
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['client-payment-details', organizationId, projectId],
    queryFn: async () => {
      if (!supabase) return []
      
      const projectClientsSubcategoryId = 'f3b96eda-15d5-4c96-ade7-6f53685115d3'
      
      const { data: paymentsData, error } = await supabase
        .from('movement_payments_view')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .order('movement_date', { ascending: false })

      if (error) {
        throw error
      }

      // Transform payments data to match expected format
      const movements = (paymentsData || []).map(payment => ({
        id: payment.movement_id,
        movement_date: payment.movement_date,
        amount: payment.amount,
        description: `${payment.client_name} - ${payment.unit}${payment.installment_number ? ` - Cuota ${payment.installment_number.toString().padStart(2, '0')}` : ''}`,
        currency_id: payment.currency_id,
        wallet_id: payment.wallet_id,
        project_id: payment.project_id,
        created_by: payment.movement_id, // Temporal
        subcategory_id: 'f3b96eda-15d5-4c96-ade7-6f53685115d3',
        exchange_rate: payment.exchange_rate,
        created_at: payment.movement_date,
        
        // Add related data directly from the view
        currency: {
          id: payment.currency_id,
          name: payment.currency_name,
          symbol: '$' // Temporal hasta que esté en la vista
        },
        wallet: {
          id: payment.wallet_id,
          name: payment.wallet_name
        },
        creator: {
          id: payment.movement_id, // Temporal
          full_name: 'Usuario', // Temporal
          email: ''
        },
        movement_clients: [{
          id: payment.movement_client_id,
          project_client_id: payment.project_client_id,
          project_clients: {
            id: payment.project_client_id,
            client_id: payment.client_id,
            unit: payment.unit,
            committed_amount: 0, // No disponible en la vista
            currency_id: payment.currency_id,
            contacts: {
              id: payment.client_id,
              first_name: payment.client_name?.split(' ')[0] || '',
              last_name: payment.client_name?.split(' ').slice(1).join(' ') || '',
              company_name: '',
              full_name: payment.client_name
            }
          }
        }]
      }))

      return movements
    },
    enabled: !!organizationId && !!projectId && !!supabase
  })

  // Detailed table columns (Fecha, Contacto, Billetera, Monto, Cotización)
  const detailColumns = [
    {
      key: "movement_date",
      label: "Fecha",
      width: "20%",
      sortable: true,
      sortType: "date" as const,
      render: (item: any) => {
        const date = new Date(item.movement_date + 'T00:00:00')
        return (
          <div className="text-sm truncate">
            {formatDate(date)}
          </div>
        )
      }
    },
    {
      key: "contact",
      label: "Contacto",
      width: "20%",
      render: (item: any) => {
        // Get all contacts and units from movement_clients
        const contactsData = item.movement_clients?.map((mc: any) => {
          const contact = mc.project_clients?.contacts
          const unit = mc.project_clients?.unit
          const contactName = contact?.company_name || contact?.full_name || `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim()
          return { name: contactName, unit }
        }).filter((c: any) => c.name) || []

        if (contactsData.length === 0) {
          return <div className="text-sm text-muted-foreground">Sin contacto</div>
        }

        const firstContact = contactsData[0]
        
        return (
          <div className="min-w-0">
            <div className="text-sm truncate">
              {firstContact.name}
            </div>
            {firstContact.unit && (
              <div className="text-xs text-muted-foreground truncate">
                U.F. {firstContact.unit}
              </div>
            )}
            {contactsData.length > 1 && (
              <div className="text-xs text-muted-foreground truncate">
                +{contactsData.length - 1} más
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: "wallet",
      label: "Billetera",
      width: "20%",
      render: (item: any) => {
        if (!item.wallet?.name) {
          return <div className="text-sm text-muted-foreground">Sin billetera</div>
        }
        
        return (
          <div className="text-sm truncate">
            {item.wallet.name}
          </div>
        )
      }
    },
    {
      key: "amount",
      label: "Monto",
      width: "20%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => {
        const amount = item.amount || 0
        const currencySymbol = item.currency?.symbol || '$'
        
        return (
          <div className="text-sm font-medium truncate">
            {currencySymbol} {amount.toLocaleString('es-AR')}
          </div>
        )
      }
    },
    {
      key: "exchange_rate",
      label: "Cotización",
      width: "20%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => {
        if (!item.exchange_rate) {
          return <div className="text-sm text-muted-foreground">-</div>
        }
        
        // Siempre mostrar cotización en pesos argentinos
        return (
          <div className="text-sm truncate">
            $ {item.exchange_rate.toLocaleString('es-AR')}
          </div>
        )
      }
    }
  ]

  const handleEdit = (item: any) => {
    // TODO: Implement edit functionality
  }

  const handleDelete = (item: any) => {
    // TODO: Implement delete functionality
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Cargando detalle de pagos...</div>
      </div>
    )
  }

  if (installments.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-8 w-8" />}
        title="Aún no hay compromisos registrados"
        description="Esta sección muestra el detalle de todos los pagos registrados."
        action={
          <div className="flex justify-center">
            <Button 
              onClick={() => openModal('installment', {
                projectId,
                organizationId,
                subcategoryId: 'f3b96eda-15d5-4c96-ade7-6f53685115d3' // Subcategoría para Aportes de Terceros
              })}
              variant="default"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Aporte
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
        columns={detailColumns}
        defaultSort={{ key: 'movement_date', direction: 'desc' }}
        getItemId={(item) => item.id || 'unknown'}
        renderCard={(item) => (
          <InstallmentDetailCard 
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      />
    </div>
  )
}