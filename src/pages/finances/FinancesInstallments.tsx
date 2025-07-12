import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Receipt, Edit, Trash2 } from 'lucide-react'

import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { CustomTable } from '@/components/ui-custom/CustomTable'
import { CustomEmptyState } from '@/components/ui-custom/CustomEmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { NewInstallmentModal } from '@/modals/finances/NewInstallmentModal'
import { EditClientCommitmentModal } from '@/modals/finances/EditClientCommitmentModal'
import { useToast } from '@/hooks/use-toast'
import ClientSummaryCard from "@/components/cards/ClientSummaryCard";
import CurrencyDetailCard from "@/components/cards/CurrencyDetailCard";
import InstallmentDetailCard from "@/components/cards/InstallmentDetailCard";

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
  const [showEditCommitmentModal, setShowEditCommitmentModal] = useState(false)
  const [editingClientCommitment, setEditingClientCommitment] = useState<any>(null)
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
    
    // Create summary for ALL project clients (including those without installments)
    const summary = projectClients
      .map(client => {
        // Calculate dollarized total from installments for this client
        let dollarizedTotal = 0
        const clientInstallments = installments.filter(installment => installment.contact_id === client.client_id)
        
        // Don't skip clients with no installments - show them with 0 amounts
        
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
      const contributionPercentage = totalDollarizedAmount > 0 ? ((item.dollarizedTotal || 0) / totalDollarizedAmount) * 100 : 0
      
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
    
    // Add totals row
    const totalsRow = {
      isTotal: true,
      contact_id: 'total',
      contact: null,
      currencies: {},
      dollarizedTotal: 0,
      client: null,
      commitmentPercentage: 100,
      contributionPercentage: 100,
      totalCommittedAmount: totalCommittedAmountUSD,
      totalDollarizedAmount: totalDollarizedAmount,
      totalRemainingAmount: totalRemainingAmount
    }
    
    const currencies = Array.from(currenciesSet).sort()
    
    return { clientSummary: [...sortedSummary, totalsRow], availableCurrencies: currencies }
  }, [projectClients, installments, allCurrencies])

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

  const handleCloseEditCommitmentModal = () => {
    setShowEditCommitmentModal(false)
    setEditingClientCommitment(null)
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
                {symbol}{committedAmount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
          return <div className="text-sm font-bold">100%</div>
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
          const clientCurrency = currencies.find(c => c.id === item.client.currency_id)
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
                setEditingClientCommitment(item)
                setShowEditCommitmentModal(true)
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
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

  // Detailed table columns (Fecha, Contacto, Moneda, Billetera, Monto, Cotización, Acciones)
  const detailColumns = [
    {
      key: "movement_date",
      label: "Fecha",
      width: "14.3%",
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
      width: "14.3%",
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
      width: "14.3%",
      render: (item: Installment) => (
        <Badge variant="outline" className="text-xs">
          {item.currency?.code || 'N/A'}
        </Badge>
      )
    },
    {
      key: "wallet",
      label: "Billetera",
      width: "14.3%",
      render: (item: Installment) => (
        <div className="text-sm">{item.wallet?.name || 'Sin billetera'}</div>
      )
    },
    {
      key: "amount",
      label: "Monto",
      width: "14.3%",
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
      width: "14.3%",
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
      width: "14.3%",
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
    title: "Compromisos de Pago",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    actions: [(
      <Button 
        key="add-installment"
        className="h-8 px-3 text-sm"
        onClick={() => setShowModal(true)}
      >
        Agregar Compromiso
      </Button>
    )]
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
      <div className="space-y-6">
        {/* Feature Introduction */}
        <FeatureIntroduction
          icon={<Receipt className="h-6 w-6" />}
          title="Gestión de Compromisos de Pago"
          features={[
            { icon: <Receipt className="h-4 w-4" />, title: "Compromisos Detallados", description: "Registro detallado de compromisos financieros de clientes e inversores" },
            { icon: <Receipt className="h-4 w-4" />, title: "Multi-moneda", description: "Seguimiento de aportes y pagos con múltiples monedas y cotizaciones" },
            { icon: <Receipt className="h-4 w-4" />, title: "Análisis USD", description: "Cálculo automático de equivalencias en USD para análisis financiero" },
            { icon: <Receipt className="h-4 w-4" />, title: "Resúmenes", description: "Resúmenes por cliente con porcentajes de cumplimiento y montos restantes" }
          ]}
        />

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
              defaultSort={{ key: 'contacto', direction: 'asc' }}
              renderCard={(item) => (
                <ClientSummaryCard 
                  item={item} 
                  allCurrencies={allCurrencies}
                />
              )}
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
              defaultSort={{ key: 'contacto', direction: 'asc' }}
              renderCard={(item) => (
                <CurrencyDetailCard item={item} />
              )}
            />
          </div>
        )}

        {/* Detailed Table */}
        {filteredInstallments.length > 0 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Detalle de Compromisos</h3>
              <p className="text-sm text-muted-foreground">Todos los compromisos de pago registrados en el proyecto</p>
            </div>
            <CustomTable
              data={filteredInstallments}
              columns={detailColumns}
              defaultSort={{ key: 'movement_date', direction: 'desc' }}
              renderCard={(item) => (
                <InstallmentDetailCard 
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            />
          </div>
        ) : installments.length === 0 ? (
          <CustomEmptyState
            title="Aún no hay compromisos registrados"
            description="Comienza registrando el primer compromiso de pago de un cliente al proyecto"
            action={
              <Button onClick={() => setShowModal(true)} className="mt-4">
                Agregar Primer Compromiso
              </Button>
            }
          />
        ) : (
          <CustomEmptyState
            title="No se encontraron compromisos"
            description="Intenta con otros términos de búsqueda"
          />
        )}

      </div>

      {/* Modals */}
      <NewInstallmentModal
        open={showModal}
        onClose={handleCloseModal}
        editingInstallment={editingInstallment}
        organizationId={organizationId || ''}
        projectId={projectId || ''}
      />

      <EditClientCommitmentModal
        open={showEditCommitmentModal}
        onClose={handleCloseEditCommitmentModal}
        clientData={editingClientCommitment}
        organizationId={organizationId || ''}
        projectId={projectId || ''}
      />
    </Layout>
  )
}