import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import InstallmentDetailCard from '@/components/cards/InstallmentDetailCard'
import { Receipt } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ClientPaymentsProps {
  projectId: string
  organizationId: string
}

export function ClientPayments({ projectId, organizationId }: ClientPaymentsProps) {
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
        console.error('Error fetching installments:', error)
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

  // Detailed table columns (Fecha, Unidad Funcional, Contacto, Billetera, Monto, Cotización)
  const detailColumns = [
    {
      key: "movement_date",
      label: "Fecha",
      width: "15%",
      sortable: true,
      sortType: "date" as const,
      render: (item: any) => {
        const date = new Date(item.movement_date + 'T00:00:00')
        return (
          <div className="text-sm">
            {format(date, 'dd/MM/yyyy', { locale: es })}
          </div>
        )
      }
    },
    {
      key: "functional_unit",
      label: "Unidad Funcional",
      width: "15%",
      render: (item: any) => {
        // Get all functional units from movement_clients
        const units = item.movement_clients?.map((mc: any) => 
          mc.project_clients?.unit
        ).filter(Boolean) || []

        if (units.length === 0) {
          return <div className="text-sm text-muted-foreground">Sin unidad</div>
        }

        // Show first unit, indicate if there are more
        return (
          <div className="text-sm">
            {units[0]}
            {units.length > 1 && (
              <div className="text-xs text-muted-foreground">
                +{units.length - 1} más
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: "contact",
      label: "Contacto",
      width: "20%",
      render: (item: any) => {
        // Get all contacts from movement_clients
        const contacts = item.movement_clients?.map((mc: any) => {
          const contact = mc.project_clients?.contacts
          return contact?.company_name || contact?.full_name || `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim()
        }).filter(Boolean) || []

        if (contacts.length === 0) {
          return <div className="text-sm text-muted-foreground">Sin contacto</div>
        }

        // Show first contact, indicate if there are more
        return (
          <div className="text-sm">
            {contacts[0]}
            {contacts.length > 1 && (
              <div className="text-xs text-muted-foreground">
                +{contacts.length - 1} más
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
          <div className="text-sm">
            {item.wallet.name}
          </div>
        )
      }
    },
    {
      key: "amount",
      label: "Monto",
      width: "15%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => {
        const amount = item.amount || 0
        const currencySymbol = item.currency?.symbol || '$'
        
        return (
          <div className="text-sm font-medium">
            {currencySymbol} {amount.toLocaleString('es-AR')}
          </div>
        )
      }
    },
    {
      key: "exchange_rate",
      label: "Cotización",
      width: "15%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => {
        if (!item.exchange_rate) {
          return <div className="text-sm text-muted-foreground">-</div>
        }
        
        // Siempre mostrar cotización en pesos argentinos
        return (
          <div className="text-sm">
            $ {item.exchange_rate.toLocaleString('es-AR')}
          </div>
        )
      }
    }
  ]

  const handleEdit = (item: any) => {
    // TODO: Implement edit functionality
    console.log('Edit item:', item)
  }

  const handleDelete = (item: any) => {
    // TODO: Implement delete functionality
    console.log('Delete item:', item)
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