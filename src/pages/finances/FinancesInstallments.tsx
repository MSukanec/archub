import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Receipt, Edit, Trash2 } from 'lucide-react'

import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { CustomTable } from '@/components/ui-custom/misc/CustomTable'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { NewInstallmentModal } from '@/modals/finances/NewInstallmentModal'
import { useToast } from '@/hooks/use-toast'

interface Installment {
  id: string
  movement_date: string
  amount: number
  description: string
  contact_id: string
  currency_id: string
  wallet_id: string
  project_id: string
  created_by: string
  exchange_rate?: number
  contact?: {
    id: string
    first_name: string
    last_name: string
    company_name?: string
    avatar_url?: string
  }
  currency?: {
    id: string
    name: string
    code: string
    symbol: string
  }
  wallet?: {
    id: string
    name: string
  }
  creator?: {
    id: string
    full_name: string
    email: string
  }
}

interface InstallmentSummary {
  contact_id: string
  contact?: {
    id: string
    first_name: string
    last_name: string
    company_name?: string
    avatar_url?: string
  }
  currency_id: string
  currency?: {
    id: string
    name: string
    code: string
    symbol: string
  }
  wallet_id: string
  wallet?: {
    id: string
    name: string
  }
  total_amount: number
}

export default function FinancesInstallments() {
  const { data: userData } = useCurrentUser()
  const [searchValue, setSearchValue] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const organizationId = userData?.organization?.id
  const projectId = userData?.preferences?.last_project_id

  // Get project clients
  const { data: projectClients = [] } = useQuery({
    queryKey: ['project-clients', projectId],
    queryFn: async () => {
      if (!supabase || !projectId) return []
      
      const { data, error } = await supabase
        .from('project_clients')
        .select(`
          *,
          contact:contacts!inner(
            id,
            first_name,
            last_name,
            company_name,
            full_name
          )
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)

      if (error) throw error
      return data || []
    },
    enabled: !!projectId && !!supabase
  })

  // Get organization currencies
  const { data: currencies = [] } = useQuery({
    queryKey: ['organization-currencies', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []
      
      const { data, error } = await supabase
        .from('organization_currencies')
        .select(`
          currencies!inner(
            id,
            name,
            code,
            symbol
          )
        `)
        .eq('organization_id', organizationId)

      if (error) throw error
      return data?.map(item => item.currencies) || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Get cuotas concept ID from movement concepts
  const { data: cuotasConcept } = useQuery({
    queryKey: ['cuotas-concept', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return null
      
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('name', 'Cuotas')

      if (error) {
        console.error('Error fetching cuotas concept:', error)
        return null
      }

      if (!data || data.length === 0) {
        console.log('No Cuotas concept found, looking for existing movements with subcategory_id e675eb59-3717-4451-89eb-0d838388238f')
        // Return the hardcoded ID that we know exists
        return { id: 'e675eb59-3717-4451-89eb-0d838388238f', name: 'Cuotas' }
      }

      console.log('Found Cuotas concept:', data[0])
      return data[0]
    },
    enabled: !!organizationId && !!supabase
  })

  // Get installments (movements filtered by cuotas concept)
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['installments', organizationId, projectId, cuotasConcept?.id],
    queryFn: async () => {
      if (!supabase || !organizationId || !projectId || !cuotasConcept) return []

      console.log('Found concepts:', {
        ingresos: '8862eee7-dd00-4f01-9335-5ea0070d3403',
        cuotas: cuotasConcept.id
      })

      // Get movements filtered by cuotas concept and project
      const { data: movements, error } = await supabase
        .from('movements')
        .select(`
          id,
          movement_date,
          amount,
          description,
          contact_id,
          currency_id,
          wallet_id,
          project_id,
          created_by,
          exchange_rate
        `)
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .eq('subcategory_id', cuotasConcept.id)
        .order('movement_date', { ascending: false })

      if (error) {
        console.error('Error fetching installments:', error)
        throw error
      }

      if (!movements || movements.length === 0) {
        return []
      }

      // Get related data
      const contactIds = Array.from(new Set(movements.map(m => m.contact_id).filter(Boolean)))
      const currencyIds = Array.from(new Set(movements.map(m => m.currency_id).filter(Boolean)))
      const walletIds = Array.from(new Set(movements.map(m => m.wallet_id).filter(Boolean)))
      const creatorIds = Array.from(new Set(movements.map(m => m.created_by).filter(Boolean)))

      const promises = []
      
      // Only fetch contacts if there are contact IDs
      if (contactIds.length > 0) {
        promises.push(
          supabase
            .from('contacts')
            .select('id, first_name, last_name, company_name')
            .eq('organization_id', organizationId)
            .in('id', contactIds)
        )
      } else {
        promises.push(Promise.resolve({ data: [] }))
      }
      
      promises.push(
        supabase
          .from('currencies')
          .select('id, name, code, symbol')
          .in('id', currencyIds),
        
        supabase
          .from('organization_wallets')
          .select(`
            wallets!inner (
              id,
              name
            )
          `)
          .eq('organization_id', organizationId)
          .in('wallet_id', walletIds),
          
        // Get users data separately
        creatorIds.length > 0 
          ? supabase
              .from('users')
              .select('id, full_name, email')
              .in('id', creatorIds)
          : Promise.resolve({ data: [] })
      )

      const [contactsResult, currenciesResult, walletsResult, usersResult] = await Promise.all(promises)

      console.log('Contacts result:', contactsResult)
      console.log('Contact IDs to fetch:', contactIds)
      console.log('Currencies result:', currenciesResult)
      console.log('Wallets result:', walletsResult)
      console.log('Users result:', usersResult)

      // Create lookup maps
      const contactsMap = new Map()
      contactsResult.data?.forEach((contact: any) => {
        contactsMap.set(contact.id, contact)
      })

      const currenciesMap = new Map()
      currenciesResult.data?.forEach((currency: any) => {
        currenciesMap.set(currency.id, currency)
      })

      const walletsMap = new Map()
      walletsResult.data?.forEach((item: any) => {
        if (item.wallets) {
          walletsMap.set(item.wallets.id, item.wallets)
        }
      })

      const usersMap = new Map()
      usersResult.data?.forEach((user: any) => {
        usersMap.set(user.id, user)
      })

      // Transform data with related information
      const result = movements.map(movement => ({
        ...movement,
        contact: contactsMap.get(movement.contact_id),
        currency: currenciesMap.get(movement.currency_id),
        wallet: walletsMap.get(movement.wallet_id),
        creator: usersMap.get(movement.created_by)
      })) as Installment[]

      console.log('Installments result:', result)
      console.log('Contacts map:', contactsMap)
      console.log('Users map:', usersMap)
      
      return result
    },
    enabled: !!organizationId && !!projectId && !!cuotasConcept?.id
  })

  // Mutation to update project client committed amount
  const updateCommittedAmountMutation = useMutation({
    mutationFn: async ({ clientId, amount }: { clientId: string; amount: number }) => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabase
        .from('project_clients')
        .update({ 
          committed_amount: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-clients', projectId] })
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar monto",
        description: error.message || "Hubo un problema al actualizar el monto comprometido",
        variant: "destructive",
      })
    }
  })

  // Mutation to update project client currency
  const updateCurrencyMutation = useMutation({
    mutationFn: async ({ clientId, currencyId }: { clientId: string; currencyId: string }) => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabase
        .from('project_clients')
        .update({ 
          currency_id: currencyId,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-clients', projectId] })
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar moneda",
        description: error.message || "Hubo un problema al actualizar la moneda",
        variant: "destructive",
      })
    }
  })

  // Calculate total contributed (dollarized)
  const totalContributedDollarized = installments.reduce((sum, installment) => {
    const amount = installment.amount || 0
    const currencyCode = installment.currency?.code || 'N/A'
    
    if (currencyCode === 'USD') {
      return sum + amount
    } else if (currencyCode !== 'USD' && installment.exchange_rate) {
      return sum + (amount / installment.exchange_rate)
    }
    
    return sum
  }, 0)

  // Create client summary based on project_clients and installments
  const { clientSummary, availableCurrencies } = React.useMemo(() => {
    const currenciesSet = new Set<string>()
    
    // Track currencies from installments
    installments.forEach(installment => {
      if (installment.currency?.code) {
        currenciesSet.add(installment.currency.code)
      }
    })
    
    // Create summary for each project client
    const summary = projectClients.map(client => {
      // Calculate dollarized total from installments for this client
      let dollarizedTotal = 0
      const clientInstallments = installments.filter(installment => installment.contact_id === client.client_id)
      
      clientInstallments.forEach(installment => {
        const amount = installment.amount || 0
        const currencyCode = installment.currency?.code || 'N/A'
        
        if (currencyCode === 'USD') {
          dollarizedTotal += amount
        } else if (currencyCode !== 'USD' && installment.exchange_rate) {
          dollarizedTotal += amount / installment.exchange_rate
        }
      })
      
      // Group installments by currency
      const currencies: { [key: string]: { amount: number; currency: any } } = {}
      clientInstallments.forEach(installment => {
        const currencyCode = installment.currency?.code || 'N/A'
        if (!currencies[currencyCode]) {
          currencies[currencyCode] = {
            amount: 0,
            currency: installment.currency
          }
        }
        currencies[currencyCode].amount += installment.amount || 0
      })
      
      return {
        contact_id: client.client_id,
        contact: client.contact,
        currencies,
        dollarizedTotal,
        client // Include full client data for committed_amount and currency_id
      }
    })
    
    const currencies = Array.from(currenciesSet).sort()
    const sortedSummary = summary.sort((a, b) => b.dollarizedTotal - a.dollarizedTotal)
    
    return { clientSummary: sortedSummary, availableCurrencies: currencies }
  }, [projectClients, installments])

  // Filter installments based on search
  const filteredInstallments = installments.filter(installment => {
    const searchLower = searchValue.toLowerCase()
    const contactName = installment.contact?.company_name || 
                       `${installment.contact?.first_name || ''} ${installment.contact?.last_name || ''}`.trim()
    
    return contactName.toLowerCase().includes(searchLower) ||
           installment.description?.toLowerCase().includes(searchLower)
  })

  const handleEdit = (installment: Installment) => {
    setEditingInstallment(installment)
    setShowModal(true)
  }

  const handleDelete = (installment: Installment) => {
    // TODO: Implement delete functionality
    console.log('Delete installment:', installment.id)
  }

  const handleCardClick = (installment: Installment) => {
    handleEdit(installment)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingInstallment(null)
  }

  // Create contact summary table (simplified)
  const contactSummaryColumns = [
    {
      key: "contact",
      label: "Contacto",
      width: "25%",
      render: (item: any) => {
        if (!item.contact) {
          return <div className="text-sm text-muted-foreground">Sin contacto</div>
        }

        const displayName = item.contact.company_name || 
                           `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim()
        const initials = item.contact.company_name 
          ? item.contact.company_name.charAt(0).toUpperCase()
          : `${item.contact.first_name?.charAt(0) || ''}${item.contact.last_name?.charAt(0) || ''}`.toUpperCase()

        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{displayName}</div>
              {item.contact.company_name && (
                <div className="text-xs text-muted-foreground">
                  {item.contact.first_name} {item.contact.last_name}
                </div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: "moneda",
      label: "Moneda",
      width: "15%",
      render: (item: any) => {
        const currentCurrency = item.client?.currency_id || ''
        
        return (
          <div className="text-sm">
            <Select 
              value={currentCurrency} 
              onValueChange={(value) => {
                if (item.client) {
                  updateCurrencyMutation.mutate({ 
                    clientId: item.client.id, 
                    currencyId: value 
                  })
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Moneda" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(currency => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }
    },
    {
      key: "monto_total",
      label: "Monto Total",
      width: "20%",
      render: (item: any) => {
        const currentAmount = item.client?.committed_amount || 0
        
        return (
          <div className="text-sm">
            <input
              type="number"
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="0"
              value={currentAmount}
              onChange={(e) => {
                const newAmount = parseFloat(e.target.value) || 0
                if (item.client) {
                  updateCommittedAmountMutation.mutate({ 
                    clientId: item.client.id, 
                    amount: newAmount 
                  })
                }
              }}
            />
          </div>
        )
      }
    },
    {
      key: "aporte_dolarizado",
      label: "Aporte Dolarizado",
      width: "20%",
      sortable: true,
      sortType: 'number' as const,
      render: (item: any) => {
        if (!item.dollarizedTotal || item.dollarizedTotal === 0) {
          return <div className="text-sm text-muted-foreground">-</div>
        }

        const formattedAmount = new Intl.NumberFormat('es-AR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(item.dollarizedTotal)
        return (
          <div className="text-sm font-medium text-green-600">
            US$ {formattedAmount}
          </div>
        )
      }
    },
    {
      key: "monto_restante",
      label: "Monto Restante",
      width: "20%",
      render: (item: any) => {
        const committedAmount = item.client?.committed_amount || 0
        const dollarizedTotal = item.dollarizedTotal || 0
        
        // Convert committed amount to USD if necessary
        let committedAmountUSD = committedAmount
        if (item.client?.currency_id) {
          const clientCurrency = currencies.find(c => c.id === item.client.currency_id)
          if (clientCurrency?.code !== 'USD') {
            // For now, we'll need an exchange rate to convert
            // In a real scenario, you might want to get this from the exchange rates table
            // For now, we'll assume ARS to USD conversion rate of 1200
            const exchangeRate = clientCurrency?.code === 'ARS' ? 1200 : 1
            committedAmountUSD = committedAmount / exchangeRate
          }
        }
        
        const remaining = dollarizedTotal - committedAmountUSD
        const formattedRemaining = new Intl.NumberFormat('es-AR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(Math.abs(remaining))
        
        return (
          <div className={`text-sm font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {remaining >= 0 ? '+' : '-'}US$ {formattedRemaining}
          </div>
        )
      }
    }
  ]

  // Create dynamic columns based on available currencies
  const summaryColumns = React.useMemo(() => {
    const baseColumns = [
      {
        key: "contact",
        label: "Contacto",
        width: "30%",
        render: (item: any) => {
          if (!item.contact) {
            return <div className="text-sm text-muted-foreground">Sin contacto</div>
          }

          const displayName = item.contact.company_name || 
                             `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim()
          const initials = item.contact.company_name 
            ? item.contact.company_name.charAt(0).toUpperCase()
            : `${item.contact.first_name?.charAt(0) || ''}${item.contact.last_name?.charAt(0) || ''}`.toUpperCase()

          return (
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">{displayName}</div>
                {item.contact.company_name && (
                  <div className="text-xs text-muted-foreground">
                    {item.contact.first_name} {item.contact.last_name}
                  </div>
                )}
              </div>
            </div>
          )
        }
      }
    ]

    // Add dynamic currency columns
    const currencyColumns = availableCurrencies.map(currencyCode => ({
      key: `currency_${currencyCode}`,
      label: currencyCode,
      width: `${Math.max(50 / availableCurrencies.length, 12)}%`,
      sortable: true,
      sortType: 'number' as const,
      render: (item: any) => {
        const currencyData = item.currencies[currencyCode]
        if (!currencyData || currencyData.amount === 0) {
          return <div className="text-sm text-muted-foreground">-</div>
        }

        const formattedAmount = new Intl.NumberFormat('es-AR').format(currencyData.amount)
        return (
          <div className="text-sm font-medium">
            {currencyData.currency?.symbol || currencyCode} {formattedAmount}
          </div>
        )
      }
    }))

    // Add dollarized total column
    const dollarizedColumn = {
      key: "dollarized_total",
      label: "APORTE DOLARIZADO",
      width: "20%",
      sortable: true,
      sortType: 'number' as const,
      render: (item: any) => {
        if (!item.dollarizedTotal || item.dollarizedTotal === 0) {
          return <div className="text-sm text-muted-foreground">-</div>
        }

        const formattedAmount = new Intl.NumberFormat('es-AR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(item.dollarizedTotal)
        return (
          <div className="text-sm font-medium text-green-600">
            US$ {formattedAmount}
          </div>
        )
      }
    }

    return [...baseColumns, ...currencyColumns, dollarizedColumn]
  }, [availableCurrencies])

  // Detailed table columns (Fecha, Contacto, Moneda, Billetera, Monto, Cotización, Acciones)
  const detailColumns = [
    {
      key: "movement_date",
      label: "Fecha",
      width: "10%",
      sortable: true,
      sortType: "date" as const,
      render: (item: Installment) => {
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
      width: "25%",
      render: (item: Installment) => {
        if (!item.contact) {
          return <div className="text-sm text-muted-foreground">Sin contacto</div>
        }

        const displayName = item.contact.company_name || 
                           `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim()
        const initials = item.contact.company_name 
          ? item.contact.company_name.charAt(0).toUpperCase()
          : `${item.contact.first_name?.charAt(0) || ''}${item.contact.last_name?.charAt(0) || ''}`.toUpperCase()

        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={item.contact.avatar_url || ''} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{displayName}</div>
              {item.contact.company_name && (
                <div className="text-xs text-muted-foreground">
                  {item.contact.first_name} {item.contact.last_name}
                </div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: "currency",
      label: "Moneda",
      width: "10%",
      render: (item: Installment) => (
        <Badge variant="outline" className="text-xs">
          {item.currency?.code || 'N/A'}
        </Badge>
      )
    },
    {
      key: "wallet",
      label: "Billetera",
      width: "15%",
      render: (item: Installment) => (
        <div className="text-sm">{item.wallet?.name || 'Sin billetera'}</div>
      )
    },
    {
      key: "amount",
      label: "Monto",
      width: "15%",
      sortable: true,
      sortType: "number" as const,
      render: (item: Installment) => {
        const symbol = item.currency?.symbol || '$'
        return (
          <div className="text-sm font-medium text-green-600">
            {symbol}{Math.abs(item.amount || 0).toLocaleString('es-AR')}
          </div>
        )
      }
    },
    {
      key: "exchange_rate",
      label: "Cotización",
      width: "12%",
      sortable: true,
      sortType: "number" as const,
      render: (item: Installment) => {
        if (!item.exchange_rate) {
          return <div className="text-sm text-muted-foreground">-</div>
        }
        
        const symbol = item.currency?.symbol || '$'
        return (
          <div className="text-sm">
            {symbol}{item.exchange_rate.toLocaleString('es-AR')}
          </div>
        )
      }
    },
    {
      key: "actions",
      label: "Acciones",
      width: "13%",
      render: (item: Installment) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const headerProps = {
    title: "Aportes",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    actions: [(
      <Button 
        key="add-installment"
        className="h-8 px-3 text-sm"
        onClick={() => setShowModal(true)}
      >
        Agregar Aporte
      </Button>
    )]
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando aportes...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Summary Card */}
        {installments.length > 0 && (
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Total Aportado</h3>
                <p className="text-2xl font-bold text-green-600">
                  US$ {Math.abs(totalContributedDollarized).toLocaleString('es-AR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {installments.length} aporte{installments.length !== 1 ? 's' : ''} registrado{installments.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Summary Table (New simplified table) */}
        {clientSummary.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Resumen por Cliente</h3>
              <p className="text-sm text-muted-foreground">Resumen general por cliente con monto total y aporte dolarizado</p>
            </div>
            <CustomTable
              data={clientSummary}
              columns={contactSummaryColumns}
              defaultSort={{ key: 'aporte_dolarizado', direction: 'desc' }}
            />
          </div>
        )}

        {/* Detailed Summary Table by Currency */}
        {clientSummary.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Detalle por Moneda</h3>
              <p className="text-sm text-muted-foreground">Totales detallados por cliente, moneda y billetera</p>
            </div>
            <CustomTable
              data={clientSummary}
              columns={summaryColumns}
              defaultSort={{ key: 'dollarized_total', direction: 'desc' }}
            />
          </div>
        )}

        {/* Detailed Table */}
        {filteredInstallments.length > 0 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Detalle de Aportes</h3>
              <p className="text-sm text-muted-foreground">Todos los aportes registrados en el proyecto</p>
            </div>
            <CustomTable
              data={filteredInstallments}
              columns={detailColumns}
              defaultSort={{ key: 'movement_date', direction: 'desc' }}
            />
          </div>
        ) : installments.length === 0 ? (
          <CustomEmptyState
            title="Aún no hay aportes registrados"
            description="Comienza registrando el primer aporte de un inversor al proyecto"
            action={
              <Button onClick={() => setShowModal(true)} className="mt-4">
                Agregar Primer Aporte
              </Button>
            }
          />
        ) : (
          <CustomEmptyState
            title="No se encontraron aportes"
            description="Intenta con otros términos de búsqueda"
          />
        )}

      </div>

      {/* Modal */}
      <NewInstallmentModal
        open={showModal}
        onClose={handleCloseModal}
        editingInstallment={editingInstallment}
        organizationId={organizationId || ''}
        projectId={projectId || ''}
      />
    </Layout>
  )
}