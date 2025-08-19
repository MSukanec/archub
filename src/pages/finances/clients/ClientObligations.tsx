import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import ClientSummaryCard from '@/components/cards/ClientSummaryCard'
import { Receipt } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ClientObligationsProps {
  projectId: string
  organizationId: string
}

export function ClientObligations({ projectId, organizationId }: ClientObligationsProps) {
  // Fetch installments (movements) data
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['client-obligations', organizationId, projectId],
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

  // Get organization currencies for read-only display
  const { data: allCurrencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      if (!supabase) return []
      
      const { data, error } = await supabase
        .from('currencies')
        .select('id, name, code, symbol')
        .order('code')

      if (error) throw error
      return data || []
    },
    enabled: !!supabase
  })

  // Create client summary based on installments
  const clientSummary = React.useMemo(() => {
    const clientsMap = new Map<string, any>()
    
    installments.forEach(installment => {
      installment.movement_clients?.forEach(movementClient => {
        const projectClient = movementClient.project_clients
        const contact = projectClient?.contacts
        const clientId = projectClient?.client_id || 'unknown'
        
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            contact_id: clientId,
            contact: contact,
            currencies: {},
            dollarizedTotal: 0,
            client: projectClient
          })
        }
        
        const clientData = clientsMap.get(clientId)
        const currencyCode = installment.currency?.code || 'N/A'
        const amount = movementClient.amount || 0
        
        // Add to currency breakdown
        if (!clientData.currencies[currencyCode]) {
          clientData.currencies[currencyCode] = {
            amount: 0,
            currency: {
              code: installment.currency?.code,
              symbol: installment.currency?.symbol,
              name: installment.currency?.name
            }
          }
        }
        clientData.currencies[currencyCode].amount += amount
        
        // Add to dollarized total
        if (currencyCode === 'USD') {
          clientData.dollarizedTotal += amount
        } else if (currencyCode === 'ARS' && installment.exchange_rate) {
          const convertedAmount = amount / installment.exchange_rate
          clientData.dollarizedTotal += convertedAmount
        }
      })
    })
    
    const summary = Array.from(clientsMap.values())
    
    // Sort by contact name (A-Z)
    return summary.sort((a, b) => {
      const nameA = a.contact?.company_name || `${a.contact?.first_name || ''} ${a.contact?.last_name || ''}`.trim()
      const nameB = b.contact?.company_name || `${b.contact?.first_name || ''} ${b.contact?.last_name || ''}`.trim()
      return nameA.localeCompare(nameB)
    })
  }, [installments])

  // Table columns for client summary
  const contactSummaryColumns = [
    {
      key: "contact",
      label: "Cliente",
      width: "40%",
      render: (item: any) => {
        if (!item.contact) {
          return <div className="text-sm text-muted-foreground">Sin contacto</div>
        }

        const displayName = item.contact.company_name || 
                           `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim()

        return (
          <div className="text-sm font-medium">{displayName}</div>
        )
      }
    },
    {
      key: "dollarized_total",
      label: "Total (USD)",
      width: "20%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => {
        const formattedAmount = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(item.dollarizedTotal || 0)
        
        return (
          <div className="text-sm font-medium">
            {formattedAmount}
          </div>
        )
      }
    },
    {
      key: "commitment",
      label: "Compromiso",
      width: "20%", 
      render: (item: any) => {
        const committedAmount = item.client?.committed_amount || 0
        const clientCurrency = allCurrencies.find(c => c.id === item.client?.currency_id)
        
        if (committedAmount === 0) {
          return <div className="text-sm text-muted-foreground">Sin compromiso</div>
        }
        
        return (
          <div className="text-sm">
            {clientCurrency?.symbol || '$'} {committedAmount.toLocaleString()}
          </div>
        )
      }
    },
    {
      key: "percentage",
      label: "% Completado",
      width: "20%",
      render: (item: any) => {
        const committedAmount = item.client?.committed_amount || 0
        const clientCurrency = allCurrencies.find(c => c.id === item.client?.currency_id)
        let committedAmountUSD = committedAmount
        
        if (clientCurrency?.code === 'ARS' && committedAmount > 0) {
          committedAmountUSD = committedAmount / 1200 // Convert ARS to USD
        }
        
        const percentage = committedAmountUSD > 0 ? ((item.dollarizedTotal || 0) / committedAmountUSD) * 100 : 0
        
        return (
          <div className="text-sm">
            {percentage.toFixed(1)}%
          </div>
        )
      }
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Cargando compromisos de pago...</div>
      </div>
    )
  }

  if (installments.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-8 w-8" />}
        title="Aún no hay compromisos registrados"
        description="Esta sección muestra los compromisos de pago registrados en el proyecto."
      />
    )
  }

  return (
    <div className="space-y-4">
      {clientSummary.length > 0 && (
        <Table
          data={clientSummary}
          columns={contactSummaryColumns}
          defaultSort={{ key: 'contact', direction: 'asc' }}
          getItemId={(item) => item.contact_id || 'unknown'}
          renderCard={(item) => (
            <ClientSummaryCard 
              item={item} 
              allCurrencies={allCurrencies}
            />
          )}
        />
      )}
    </div>
  )
}