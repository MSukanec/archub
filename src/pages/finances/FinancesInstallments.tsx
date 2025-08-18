import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Receipt, Edit, Trash2 } from 'lucide-react'

import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { useToast } from '@/hooks/use-toast'
import ClientSummaryCard from "@/components/cards/ClientSummaryCard";
import CurrencyDetailCard from "@/components/cards/CurrencyDetailCard";
import InstallmentDetailCard from "@/components/cards/InstallmentDetailCard";

interface Installment {
  id: string
  movement_date: string
  amount: number
  description: string
  currency_id: string
  wallet_id: string
  project_id: string
  created_by: string
  subcategory_id: string
  exchange_rate?: number
  // Joined data from movement_clients table
  movement_clients?: Array<{
    id: string
    project_client_id: string
    amount: number
    project_client?: {
      id: string
      client_id: string
      contact?: {
        id: string
        first_name: string
        last_name: string
        company_name?: string
        full_name?: string
      }
    }
  }>
  // Joined currency data
  currency?: {
    id: string
    name: string
    code: string
    symbol: string
  }
  // Joined wallet data
  wallet?: {
    id: string
    name: string
  }
  // Creator data
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
  const [searchValue, setSearchValue] = useState("")
  const [activeTab, setActiveTab] = useState("clients")
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const organizationId = userData?.organization?.id
  const projectId = userData?.preferences?.last_project_id

  // Get project clients
  const { data: projectClients = [] } = useQuery({
    queryKey: ['project-clients', projectId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) return []
      
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
        .eq('contact.organization_id', organizationId)

      if (error) throw error
      return data || []
    },
    enabled: !!projectId && !!organizationId && !!supabase
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

  // Use the fixed subcategory ID for project clients (installments)
  const projectClientsSubcategoryId = 'f3b96eda-15d5-4c96-ade7-6f53685115d3'

  // Get installments (movements with project clients subcategory)
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['installments', organizationId, projectId, projectClientsSubcategoryId],
    queryFn: async () => {
      if (!supabase || !organizationId || !projectId) return []

      console.log('Fetching installments for:', { organizationId, projectId, projectClientsSubcategoryId })

      // Query movements with the project clients subcategory and manual joins for relations that exist
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
            project_clients!inner(
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

      // Manually fetch wallets, users, and currencies for the movements
      if (movements && movements.length > 0) {
        const walletIds = [...new Set(movements.map(m => m.wallet_id).filter(Boolean))]
        const userIds = [...new Set(movements.map(m => m.created_by).filter(Boolean))]
        const currencyIds = [...new Set(movements.map(m => m.currency_id).filter(Boolean))]

        // Fetch wallets
        const { data: walletsData } = await supabase
          .from('wallets')
          .select('id, name')
          .in('id', walletIds)

        // Fetch users
        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds)

        // Fetch currencies
        const { data: currenciesData } = await supabase
          .from('currencies')
          .select('id, name, code, symbol')
          .in('id', currencyIds)

        // Add wallet, creator, and currency data to movements
        movements.forEach(movement => {
          movement.wallet = walletsData?.find(w => w.id === movement.wallet_id)
          movement.creator = usersData?.find(u => u.id === movement.created_by)
          movement.currency = currenciesData?.find(c => c.id === movement.currency_id)
        })
      }

      if (error) {
        console.error('Error fetching installments:', error)
        throw error
      }

      console.log('Installments fetched:', movements?.length || 0)
      
      console.log('Installments loaded successfully:', movements?.length || 0, 'movements with currencies')
      
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

  // Calculate total contributed (dollarized)
  const totalContributedDollarized = installments.reduce((sum, installment) => {
    const amount = installment.amount || 0
    const currencyCode = installment.currency?.code || 'N/A'
    
    if (currencyCode === 'USD') {
      return sum + amount
    } else if (currencyCode === 'ARS' && installment.exchange_rate) {
      return sum + (amount / installment.exchange_rate)
    }
    
    return sum
  }, 0)

  // Create client summary based on installments (movements with movement_clients)
  const { clientSummary, availableCurrencies } = React.useMemo(() => {
    const currenciesSet = new Set<string>()
    const clientsMap = new Map<string, any>()
    
    // Process installments to create client summary
    
    // Process each installment to extract client data
    installments.forEach(installment => {
      if (installment.currency?.code) {
        currenciesSet.add(installment.currency.code)
      }
      
      // Process each movement_client within this installment
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
            client: projectClient // Include full project client data
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
    
    // Calculate totals for percentages and totals row
    const totalCommittedAmountUSD = summary.reduce((sum, item) => {
      const committedAmount = item.client?.committed_amount || 0
      const clientCurrency = allCurrencies.find(c => c.id === item.client?.currency_id)
      
      if (clientCurrency?.code === 'USD') {
        return sum + committedAmount
      } else if (clientCurrency?.code === 'ARS' && committedAmount > 0) {
        // Use a basic conversion rate for ARS to USD (you might want to use actual exchange rates)
        return sum + (committedAmount / 1200) // Assuming 1200 ARS = 1 USD
      }
      return sum + committedAmount // If no conversion available, add as-is
    }, 0)
    
    const totalDollarizedAmount = summary.reduce((sum, item) => sum + (item.dollarizedTotal || 0), 0)
    
    // Add percentages to each item
    const summaryWithPercentages = summary.map(item => {
      const committedAmount = item.client?.committed_amount || 0
      const clientCurrency = allCurrencies.find(c => c.id === item.client?.currency_id)
      let committedAmountUSD = committedAmount
      
      if (clientCurrency?.code === 'ARS' && committedAmount > 0) {
        committedAmountUSD = committedAmount / 1200 // Convert ARS to USD
      }
      
      const commitmentPercentage = totalCommittedAmountUSD > 0 ? (committedAmountUSD / totalCommittedAmountUSD) * 100 : 0
      // Calculate what percentage the client has paid of their own committed amount
      const contributionPercentage = committedAmountUSD > 0 ? ((item.dollarizedTotal || 0) / committedAmountUSD) * 100 : 0
      
      return {
        ...item,
        commitmentPercentage,
        contributionPercentage
      }
    })
    
    // Sort by contact name (A-Z)
    const sortedSummary = summaryWithPercentages.sort((a, b) => {
      const nameA = a.contact?.company_name || `${a.contact?.first_name || ''} ${a.contact?.last_name || ''}`.trim()
      const nameB = b.contact?.company_name || `${b.contact?.first_name || ''} ${b.contact?.last_name || ''}`.trim()
      return nameA.localeCompare(nameB)
    })
    
    // Calculate total remaining amount
    const totalRemainingAmount = totalCommittedAmountUSD - totalDollarizedAmount
    
    // Calculate overall completion percentage
    const overallCompletionPercentage = totalCommittedAmountUSD > 0 ? (totalDollarizedAmount / totalCommittedAmountUSD) * 100 : 0
    
    // Add totals row
    const totalsRow = {
      isTotal: true,
      contact_id: 'total',
      contact: undefined,
      currencies: {},
      dollarizedTotal: 0,
      client: undefined,
      commitmentPercentage: 100,
      contributionPercentage: overallCompletionPercentage,
      totalCommittedAmount: totalCommittedAmountUSD,
      totalDollarizedAmount: totalDollarizedAmount,
      totalRemainingAmount: totalRemainingAmount
    }
    
    const currencies = Array.from(currenciesSet).sort()
    

    
    return { clientSummary: [...sortedSummary, totalsRow], availableCurrencies: currencies }
  }, [installments, allCurrencies])

  // Apply search filter to installments
  const filteredInstallments = installments.filter(installment => {
    if (!searchValue) return true
    
    const searchLower = searchValue.toLowerCase()
    // Get contact names from movement_clients
    const contactNames = installment.movement_clients?.map(mc => {
      const contact = mc.project_client?.contact
      return contact?.company_name || contact?.full_name || `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim()
    }).join(' ') || ''
    
    const description = (installment.description || '').toLowerCase()
    
    return contactNames.toLowerCase().includes(searchLower) || description.includes(searchLower)
  })

  // Handler for adding installment
  const handleAddInstallment = () => {
    openModal('installment', {
      projectId: projectId || '',
      organizationId: organizationId || ''
    })
  }

  const handleEdit = (installment: any) => {
    openModal('installment', {
      projectId: projectId || '',
      organizationId: organizationId || '',
      editingInstallment: installment
    })
  }

  const handleDelete = (installment: any) => {
    // Get contact names from movement_clients
    const contactNames = installment.movement_clients?.map((mc: any) => {
      const contact = mc.project_client?.contact
      return contact?.company_name || contact?.full_name || `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim()
    }).join(', ') || 'Sin contacto'
    
    openModal('delete-confirmation', {
      title: 'Eliminar Compromiso',
      message: `¿Estás seguro de que deseas eliminar el compromiso de pago de ${contactNames}?`,
      itemName: `${contactNames} - ${installment.currency?.symbol || '$'}${installment.amount}`,
      onConfirm: async () => {
        try {
          const { error } = await supabase!
            .from('movements')
            .delete()
            .eq('id', installment.id)

          if (error) throw error

          toast({
            title: 'Compromiso eliminado',
            description: 'El compromiso de pago ha sido eliminado correctamente',
          })

          // Refrescar datos
          queryClient.invalidateQueries({ queryKey: ['installments'] })
          queryClient.invalidateQueries({ queryKey: ['movements'] })
          queryClient.invalidateQueries({ queryKey: ['movement-clients'] })
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: `Error al eliminar el compromiso: ${error.message}`,
          })
        }
      }
    })
  }

  const handleCardClick = (installment: any) => {
    handleEdit(installment)
  }



  // Create contact summary table (simplified)
  const contactSummaryColumns = [
    {
      key: "contact",
      label: "Contacto",
      width: "12.5%",
      render: (item: any) => {
        if (item.isTotal) {
          return (
            <div className="text-sm font-bold text-foreground">
              TOTAL
            </div>
          )
        }
        
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
      width: "12.5%",
      render: (item: any) => {
        if (item.isTotal) {
          return (
            <div className="text-sm font-bold text-muted-foreground">
              -
            </div>
          )
        }
        
        // Find currency data from project_clients (configured in Compromisos page)
        const clientCurrency = allCurrencies.find(c => c.id === item.client?.currency_id)
        
        return (
          <div className="text-sm">
            {clientCurrency ? (
              <Badge variant="outline" className="text-xs">
                {clientCurrency.code}
              </Badge>
            ) : (
              <div className="text-muted-foreground text-xs">
                Sin configurar
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: "monto_total",
      label: "Monto Comprometido",
      width: "12.5%",
      render: (item: any) => {
        if (item.isTotal) {
          const totalCommitted = item.totalCommittedAmount || 0
          return (
            <div className="text-sm font-bold text-blue-600">
              US$ {totalCommitted.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          )
        }
        
        const committedAmount = item.client?.committed_amount || 0
        const clientCurrency = allCurrencies.find(c => c.id === item.client?.currency_id)
        const symbol = clientCurrency?.symbol || '$'
        
        return (
          <div className="text-sm">
            {committedAmount > 0 ? (
              <div className="font-medium text-blue-600">
                {symbol} {committedAmount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">
                Sin monto comprometido
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: "porcentaje_compromiso",
      label: "% de Compromiso",
      width: "12.5%",
      render: (item: any) => {
        if (item.isTotal) {
          return <div className="text-sm font-bold">100%</div>
        }
        
        const committedAmount = item.client?.committed_amount || 0
        const percentage = item.commitmentPercentage || 0
        
        return (
          <div className="text-sm">
            {committedAmount > 0 ? (
              <div className="font-medium">
                {percentage.toFixed(1)}%
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">-</div>
            )}
          </div>
        )
      }
    },
    {
      key: "aporte_dolarizado",
      label: "Aporte Dolarizado",
      width: "12.5%",
      sortable: true,
      sortType: 'number' as const,
      render: (item: any) => {
        if (item.isTotal) {
          const totalDollarized = item.totalDollarizedAmount || 0
          const formattedTotal = new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(totalDollarized)
          return (
            <div className="text-sm font-bold text-green-600">
              US$ {formattedTotal}
            </div>
          )
        }
        
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
      key: "porcentaje_aporte",
      label: "% de Aporte",
      width: "12.5%",
      render: (item: any) => {
        if (item.isTotal) {
          const overallPercentage = item.contributionPercentage || 0
          return <div className="text-sm font-bold">{overallPercentage.toFixed(1)}%</div>
        }
        
        const dollarizedTotal = item.dollarizedTotal || 0
        const percentage = item.contributionPercentage || 0
        
        return (
          <div className="text-sm">
            {dollarizedTotal > 0 ? (
              <div className="font-medium">
                {percentage.toFixed(1)}%
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">-</div>
            )}
          </div>
        )
      }
    },
    {
      key: "monto_restante",
      label: "Monto Restante",
      width: "12.5%",
      render: (item: any) => {
        if (item.isTotal) {
          const totalRemaining = item.totalRemainingAmount || 0
          const isPositive = totalRemaining >= 0
          return (
            <div className="text-sm font-bold text-red-600">
              {isPositive ? '+' : '-'}US$ {Math.abs(totalRemaining).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          )
        }
        
        const committedAmount = item.client?.committed_amount || 0
        const dollarizedTotal = item.dollarizedTotal || 0
        
        // Convert committed amount to USD if necessary
        let committedAmountUSD = committedAmount
        if (item.client?.currency_id) {
          const clientCurrency = allCurrencies?.find(c => c?.id === item.client.currency_id)
          if (clientCurrency?.code !== 'USD') {
            // For now, we'll need an exchange rate to convert
            // In a real scenario, you might want to get this from the exchange rates table
            // For now, we'll assume ARS to USD conversion rate of 1200
            const exchangeRate = clientCurrency?.code === 'ARS' ? 1200 : 1
            committedAmountUSD = committedAmount / exchangeRate
          }
        }
        
        const remaining = committedAmountUSD - dollarizedTotal
        const formattedRemaining = new Intl.NumberFormat('es-AR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(Math.abs(remaining))
        
        return (
          <div className="text-sm font-medium text-red-600">
            {remaining >= 0 ? '+' : '-'}US$ {formattedRemaining}
          </div>
        )
      }
    },
    {
      key: "actions",
      label: "Acciones",
      width: "12.5%",
      render: (item: any) => {
        if (item.isTotal) {
          return <div className="text-sm text-muted-foreground">-</div>
        }
        
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Open edit commitment modal using the installment modal
                // We'll edit the first installment for this client as a way to edit the commitment
                const clientInstallments = installments.filter(installment => 
                  installment.movement_clients?.some(mc => mc.project_client?.client_id === item.contact_id)
                )
                if (clientInstallments.length > 0) {
                  const firstInstallment = clientInstallments[0]
                  openModal('installment', {
                    projectId: projectId || '',
                    organizationId: organizationId || '',
                    editingInstallment: firstInstallment
                  })
                }
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const contactName = item.contact 
                  ? (item.contact.company_name || `${item.contact.first_name} ${item.contact.last_name}`)
                  : 'Sin contacto'
                
                openModal('delete-confirmation', {
                  title: 'Eliminar Cliente del Proyecto',
                  message: `¿Estás seguro de que deseas eliminar a ${contactName} del proyecto? Esto también eliminará todos sus compromisos asociados.`,
                  itemName: contactName,
                  onConfirm: async () => {
                    try {
                      // First delete all installments for this client
                      const clientInstallments = installments.filter(installment => 
                        installment.movement_clients?.some(mc => mc.project_client?.client_id === item.contact_id)
                      )
                      
                      for (const installment of clientInstallments) {
                        await supabase!
                          .from('movements')
                          .delete()
                          .eq('id', installment.id)
                      }

                      // Then remove client from project
                      await supabase!
                        .from('project_clients')
                        .delete()
                        .eq('client_id', item.contact_id)
                        .eq('project_id', projectId)

                      toast({
                        title: 'Cliente eliminado',
                        description: 'El cliente y sus compromisos han sido eliminados del proyecto',
                      })

                      // Refrescar datos
                      queryClient.invalidateQueries({ queryKey: ['project-clients'] })
                      queryClient.invalidateQueries({ queryKey: ['installments'] })
                      queryClient.invalidateQueries({ queryKey: ['movements'] })
                    } catch (error: any) {
                      toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: `Error al eliminar el cliente: ${error.message}`,
                      })
                    }
                  }
                })
              }}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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

    return [...baseColumns, ...currencyColumns]
  }, [availableCurrencies])

  // Detailed table columns (Fecha, Contacto, Tipo, Billetera, Monto, Cotización)
  const detailColumns = [
    {
      key: "movement_date",
      label: "Fecha",
      width: "16.7%",
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
      width: "16.7%",
      render: (item: any) => {
        // Get all contacts from movement_clients
        const contacts = item.movement_clients?.map((mc: any) => {
          const contact = mc.project_client?.contact
          return contact?.company_name || contact?.full_name || `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim()
        }).filter(Boolean) || []

        if (contacts.length === 0) {
          return <div className="text-sm text-muted-foreground">Sin contacto</div>
        }

        const displayName = contacts.join(', ')
        const firstContact = item.movement_clients?.[0]?.project_client?.contact
        const initials = firstContact?.company_name 
          ? firstContact.company_name.charAt(0).toUpperCase()
          : `${firstContact?.first_name?.charAt(0) || ''}${firstContact?.last_name?.charAt(0) || ''}`.toUpperCase()

        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">{initials || 'SC'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{displayName}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: "subcategory",
      label: "Tipo",
      width: "16.7%",
      sortable: true,
      sortType: "string" as const,
      render: (item: any) => {
        // This is always "Aportes de Terceros" since we're filtering by that subcategory
        return (
          <div className="text-sm">
            <Badge variant="secondary" className="text-xs">
              Aportes de Terceros
            </Badge>
          </div>
        )
      }
    },
    {
      key: "wallet",
      label: "Billetera",
      width: "16.7%",
      render: (item: any) => (
        <div className="text-sm">{item.wallet?.name || 'Sin billetera'}</div>
      )
    },
    {
      key: "amount",
      label: "Monto",
      width: "16.65%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => {
        const symbol = item.currency?.symbol || '$'
        return (
          <div className="text-sm font-medium text-green-600">
            {symbol} {Math.abs(item.amount || 0).toLocaleString('es-AR')}
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
    },

  ]

  // Crear tabs para el header como en FinancesAnalysis
  const headerTabs = [
    {
      id: "clients",
      label: "Resumen por Cliente",
      isActive: activeTab === "clients"
    },
    {
      id: "currencies",
      label: "Detalle por Moneda", 
      isActive: activeTab === "currencies"
    },
    {
      id: "details",
      label: "Detalle de Compromisos",
      isActive: activeTab === "details"
    }
  ]

  const headerProps = {
    title: "Aportes de Terceros",
    tabs: headerTabs,
    onTabChange: setActiveTab,
    actionButton: {
      label: "Nuevo Aporte",
      onClick: handleAddInstallment
    }
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando aportes...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide={true}>

      {/* Conditional Content - EmptyState o Tabs */}
      {installments.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-8 w-8" />}
          title="Aún no hay compromisos registrados"
          description="Esta sección muestra los compromisos de pago registrados en el proyecto."
        />
      ) : (
        <div className="space-y-4">
          {activeTab === "clients" && clientSummary.length > 0 && (
            <Table
              data={clientSummary}
              columns={contactSummaryColumns}
              defaultSort={{ key: 'contacto', direction: 'asc' }}
              getItemId={(item) => item.contact_id || 'unknown'}
              renderCard={(item) => (
                <ClientSummaryCard 
                  item={item} 
                  allCurrencies={allCurrencies}
                />
              )}
            />
          )}

          {activeTab === "currencies" && clientSummary.length > 0 && (
            <Table
              data={clientSummary}
              columns={summaryColumns}
              defaultSort={{ key: 'contacto', direction: 'asc' }}
              getItemId={(item) => item.contact_id || 'unknown'}
              renderCard={(item) => (
                <CurrencyDetailCard item={item} />
              )}
            />
          )}

          {activeTab === "details" && (
            filteredInstallments.length > 0 ? (
              <Table
                data={filteredInstallments}
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
            ) : (
              <EmptyState
                title="No se encontraron compromisos"
                description="No hay compromisos que coincidan con los filtros aplicados"
              />
            )
          )}
        </div>
      )}

      {/* Modals handled by ModalFactory */}
    </Layout>
  )
}