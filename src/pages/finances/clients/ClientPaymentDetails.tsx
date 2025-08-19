import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import InstallmentDetailCard from '@/components/cards/InstallmentDetailCard'
import { Receipt } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ClientPaymentDetailsProps {
  projectId: string
  organizationId: string
}

export function ClientPaymentDetails({ projectId, organizationId }: ClientPaymentDetailsProps) {
  // Fetch installments (movements) data
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['client-payment-details', organizationId, projectId],
    queryFn: async () => {
      if (!supabase) return []
      
      const projectClientsSubcategoryId = 'f3b96eda-15d5-4c96-ade7-6f53685115d3'
      
      const { data: movements, error } = await supabase
        .from('movements')
        .select(`
          id,
          movement_date,
          amount,
          description,
          currency_id,
          wallet_id,
          project_id,
          created_by,
          subcategory_id,
          exchange_rate,
          created_at,

          movement_clients!inner(
            id,
            project_client_id,
            amount,
            project_clients(
              id,
              client_id,
              committed_amount,
              currency_id,
              contacts!inner(
                id,
                first_name,
                last_name,
                company_name,
                full_name
              )
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .eq('subcategory_id', projectClientsSubcategoryId)
        .order('movement_date', { ascending: false })

      if (error) {
        console.error('Error fetching installments:', error)
        throw error
      }

      // Manually fetch currencies, wallets, and users
      if (movements && movements.length > 0) {
        const currencyIds = [...new Set(movements.map(m => m.currency_id).filter(Boolean))]
        const walletIds = [...new Set(movements.map(m => m.wallet_id).filter(Boolean))]
        const userIds = [...new Set(movements.map(m => m.created_by).filter(Boolean))]

        const [currenciesData, walletsData, usersData] = await Promise.all([
          supabase.from('currencies').select('id, name, code, symbol').in('id', currencyIds),
          supabase.from('wallets').select('id, name').in('id', walletIds),
          supabase.from('users').select('id, full_name, email').in('id', userIds)
        ])

        // Add related data to movements
        movements.forEach(movement => {
          movement.currency = currenciesData.data?.find(c => c.id === movement.currency_id)
          movement.wallet = walletsData.data?.find(w => w.id === movement.wallet_id)
          movement.creator = usersData.data?.find(u => u.id === movement.created_by)
        })
      }

      return movements || []
    },
    enabled: !!organizationId && !!projectId && !!supabase
  })

  // Detailed table columns (Fecha, Contacto, Tipo, Billetera, Monto, Cotización)
  const detailColumns = [
    {
      key: "movement_date",
      label: "Fecha",
      width: "16.7%",
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
      key: "contact",
      label: "Contacto",
      width: "16.7%",
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
      key: "subcategory",
      label: "Tipo",
      width: "16.7%",
      render: (item: any) => {
        return (
          <div className="text-sm">
            Aportes de Terceros
          </div>
        )
      }
    },
    {
      key: "wallet",
      label: "Billetera",
      width: "16.7%",
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
      width: "16.65%",
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
      width: "16.65%",
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