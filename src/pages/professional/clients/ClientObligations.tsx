import React, { useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ClientSummaryCard from '@/components/ui/cards/ClientSummaryCard'
import CurrencyDetailCard from '@/components/ui/cards/CurrencyDetailCard'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Receipt, Edit2, Trash2, Users, DollarSign, CreditCard, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useClientAnalysis } from '@/hooks/use-client-analysis'
import { useMobile } from '@/hooks/use-mobile'
import { ClientObligationRow } from '@/components/ui/data-row/rows'
import { useNavigationStore } from '@/stores/navigationStore'

interface ClientObligationsProps {
  projectId: string
  organizationId: string
}

export function ClientObligations({ projectId, organizationId }: ClientObligationsProps) {
  const { openModal } = useGlobalModalStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isMobile = useMobile()
  const { setSidebarContext } = useNavigationStore()

  // Establecer contexto del sidebar al montar el componente
  useEffect(() => {
    setSidebarContext('finances')
  }, [])

  // Fetch client analysis for KPIs
  const { data: clientAnalysis, isLoading: isLoadingAnalysis } = useClientAnalysis(projectId)

  // Fetch project clients (commitments) data
  const { data: projectClients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['project-clients', organizationId, projectId],
    queryFn: async () => {
      if (!supabase) return []
      
      const { data, error } = await supabase
        .from('project_clients')
        .select(`
          id,
          client_id,
          unit,
          committed_amount,
          currency_id,
          exchange_rate,
          created_at,
          contacts!inner(
            id,
            first_name,
            last_name,
            company_name,
            full_name
          )
        `)
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching project clients:', error)
        throw error
      }

      return data || []
    },
    enabled: !!organizationId && !!projectId && !!supabase
  })

  // Fetch installments (movements) data
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['client-obligations', organizationId, projectId],
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
        description: `${payment.client_name} - ${payment.unit}`,
        currency_id: payment.currency_id,
        wallet_id: payment.wallet_id,
        project_id: payment.project_id,
        created_by: payment.movement_id, // Temporal, se puede mejorar
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

  // Create client summary based on installments and available currencies
  const { clientSummary, availableCurrencies } = React.useMemo(() => {
    const clientsMap = new Map<string, any>()
    const currenciesSet = new Set<string>()
    
    installments.forEach((installment: any) => {
      installment.movement_clients?.forEach((movementClient: any) => {
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
        const amount = installment.amount || 0
        
        // Add currency to available currencies set
        if (installment.currency?.code) {
          currenciesSet.add(installment.currency.code)
        }
        
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
    const sortedSummary = summary.sort((a, b) => {
      const nameA = a.contact?.company_name || `${a.contact?.first_name || ''} ${a.contact?.last_name || ''}`.trim()
      const nameB = b.contact?.company_name || `${b.contact?.first_name || ''} ${b.contact?.last_name || ''}`.trim()
      return nameA.localeCompare(nameB)
    })
    
    const currencies = Array.from(currenciesSet).sort()
    
    return { clientSummary: sortedSummary, availableCurrencies: currencies }
  }, [installments])

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { error } = await supabase
        .from('project_clients')
        .delete()
        .eq('id', clientId)

      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Compromiso eliminado",
        description: "El compromiso de pago ha sido eliminado exitosamente",
      })
      queryClient.invalidateQueries({ queryKey: ['project-clients', organizationId, projectId] })
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message || "Hubo un problema al eliminar el compromiso",
        variant: "destructive",
      })
    }
  })

  // Create commitment summary with payment totals
  const commitmentSummary = React.useMemo(() => {
    return projectClients.map((client: any) => {
      // Find total payments for this specific commitment (not all commitments from this client)
      const clientPayments = installments.filter((installment: any) => 
        installment.movement_clients?.some((mc: any) => mc.project_client_id === client.id)
      )
      
      let totalPaid = 0
      const currency = allCurrencies.find(c => c.id === client.currency_id)
      
      clientPayments.forEach((payment: any) => {
        payment.movement_clients?.forEach((mc: any) => {
          if (mc.project_client_id === client.id) {
            // Determinar la moneda del pago y del compromiso
            const paymentCurrency = allCurrencies.find(c => c.id === payment.currency_id)
            const commitmentCurrency = allCurrencies.find(c => c.id === client.currency_id)
            
            const paymentCurrencyCode = paymentCurrency?.code || 'USD'
            const commitmentCurrencyCode = commitmentCurrency?.code || 'USD'
            
            const amount = payment.amount || 0
            const exchangeRate = payment.exchange_rate || 1
            
            // REGLA CRÍTICA: Convertir todo a la moneda del compromiso
            if (paymentCurrencyCode === commitmentCurrencyCode) {
              // Misma moneda - agregar directamente
              totalPaid += amount
            } else if (paymentCurrencyCode === 'USD' && commitmentCurrencyCode === 'ARS') {
              // Pago en USD, compromiso en ARS - convertir a ARS multiplicando
              totalPaid += amount * exchangeRate
            } else if (paymentCurrencyCode === 'ARS' && commitmentCurrencyCode === 'USD') {
              // Pago en ARS, compromiso en USD - convertir a USD dividiendo
              totalPaid += amount / exchangeRate
            } else {
              // Otras monedas - usar monto original como fallback
              totalPaid += amount
            }
          }
        })
      })

      const remainingAmount = (client.committed_amount || 0) - totalPaid

      return {
        ...client,
        totalPaid,
        remainingAmount,
        currency
      }
    })
  }, [projectClients, installments, allCurrencies])

  // Sort data by unit first, then by client name
  const sortedCommitmentSummary = useMemo(() => {
    return [...commitmentSummary].sort((a, b) => {
      // First sort by unit (if available)
      const unitA = a.unit?.trim() || ''
      const unitB = b.unit?.trim() || ''
      
      // If both have units, sort by unit
      if (unitA && unitB) {
        return unitA.localeCompare(unitB)
      }
      
      // If only one has unit, prioritize the one with unit
      if (unitA && !unitB) return -1
      if (!unitA && unitB) return 1
      
      // If neither has unit, sort by contact name
      const nameA = (a.contacts?.company_name || 
                    `${a.contacts?.first_name || ''} ${a.contacts?.last_name || ''}`.trim()).toLowerCase()
      const nameB = (b.contacts?.company_name || 
                    `${b.contacts?.first_name || ''} ${b.contacts?.last_name || ''}`.trim()).toLowerCase()
      
      return nameA.localeCompare(nameB)
    })
  }, [commitmentSummary])

  // Table columns for commitments
  const contactSummaryColumns = [
    {
      key: "contact",
      label: "Nombre Completo",
      width: "14.29%",
      sortable: true,
      sortType: "string" as const,
      render: (item: any) => {
        if (!item.contacts) {
          return <div className="text-sm text-muted-foreground">Sin contacto</div>
        }

        const displayName = item.contacts.company_name || 
                           `${item.contacts.first_name || ''} ${item.contacts.last_name || ''}`.trim()
        const unit = item.unit?.trim()

        return (
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{displayName}</div>
            {unit && (
              <div className="text-xs text-muted-foreground truncate">
                U.F. {unit}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: "commitment",
      label: "Compromiso Inicial",
      width: "14.29%", 
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => {
        const committedAmount = item.committed_amount || 0
        
        if (committedAmount === 0) {
          return <div className="text-sm text-muted-foreground">Sin compromiso</div>
        }
        
        return (
          <div className="text-sm font-medium truncate">
            {item.currency?.symbol || '$'} {Math.floor(committedAmount).toLocaleString()}
          </div>
        )
      }
    },
    {
      key: "totalPaid",
      label: "Pago a la Fecha",
      width: "14.29%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => {
        return (
          <div className="text-sm truncate">
            {item.currency?.symbol || '$'} {Math.floor(item.totalPaid || 0).toLocaleString()}
          </div>
        )
      }
    },
    {
      key: "remainingAmount",
      label: "Monto Restante",
      width: "14.29%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => {
        const remaining = item.remainingAmount || 0
        const isNegative = remaining < 0
        
        return (
          <div className={`text-sm font-medium truncate ${isNegative ? 'text-green-600' : 'text-muted-foreground'}`}>
            {item.currency?.symbol || '$'} {Math.floor(Math.abs(remaining)).toLocaleString()}
            {isNegative && ' (excedente)'}
          </div>
        )
      }
    },
    {
      key: "paymentPercentage",
      label: "% de Pago",
      width: "14.29%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => {
        const committedAmount = item.committed_amount || 0
        const totalPaid = item.totalPaid || 0
        
        if (committedAmount === 0) {
          return <div className="text-sm text-muted-foreground">-</div>
        }
        
        const percentage = (totalPaid / committedAmount) * 100
        const isComplete = percentage >= 100
        
        return (
          <div className={`text-sm font-medium ${isComplete ? 'text-green-600' : 'text-muted-foreground'}`}>
            {percentage.toFixed(1)}%
          </div>
        )
      }
    },
    {
      key: "totalPercentage",
      label: "% del Total",
      width: "14.29%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => {
        const committedAmount = item.committed_amount || 0
        
        // Calculate total of all commitments
        const totalCommitments = commitmentSummary.reduce((sum, client) => 
          sum + (client.committed_amount || 0), 0
        )
        
        if (totalCommitments === 0) {
          return <div className="text-sm text-muted-foreground">-</div>
        }
        
        const percentage = (committedAmount / totalCommitments) * 100
        
        return (
          <div className="text-sm font-medium">
            {percentage.toFixed(1)}%
          </div>
        )
      }
    }
  ]

  // Create dynamic columns based on available currencies for detail view
  const currencyDetailColumns = React.useMemo(() => {
    if (!availableCurrencies || availableCurrencies.length === 0) return []
    
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
    const currencyColumns = availableCurrencies.map((currencyCode: string) => ({
      key: `currency_${currencyCode}`,
      label: currencyCode,
      width: `${Math.max(50 / availableCurrencies.length, 12)}%`,
      sortable: true,
      sortType: 'number' as const,
      render: (item: any) => {
        const currencyData = item.currencies && item.currencies[currencyCode]
        if (!currencyData || currencyData.amount === 0) {
          return <div className="text-sm text-muted-foreground">-</div>
        }

        const formattedAmount = Math.floor(currencyData.amount).toLocaleString()
        return (
          <div className="text-sm font-medium">
            {currencyData.currency?.symbol || currencyCode} {formattedAmount}
          </div>
        )
      }
    }))

    return [...baseColumns, ...currencyColumns]
  }, [availableCurrencies])

  if (clientsLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Cargando compromisos de pago...</div>
      </div>
    )
  }

  if (projectClients.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-8 w-8" />}
        title="Aún no hay compromisos registrados"
        description="Esta sección muestra los compromisos de pago registrados en el proyecto."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {clientAnalysis && !isLoadingAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {/* Total de compromisos */}
          <Card>
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Total de compromisos</p>
                  <Users className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Mini gráfico de barras - muestra distribución real de compromisos */}
                <div className={`flex items-end gap-1 ${isMobile ? 'h-6' : 'h-8'}`}>
                  {(() => {
                    // Calcular la distribución de compromisos por cliente
                    const clientCommitments = projectClients
                      .filter(pc => pc.committed_amount && pc.committed_amount > 0)
                      .map(pc => pc.committed_amount)
                      .sort((a, b) => b - a) // Ordenar de mayor a menor
                      .slice(0, 6) // Mostrar solo los 6 clientes principales
                    
                    const maxAmount = Math.max(...clientCommitments, 1)
                    
                    // Si no hay datos reales, mostrar un estado vacío
                    if (clientCommitments.length === 0) {
                      return Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-sm flex-1 bg-muted"
                          style={{ height: '20%', opacity: 0.3 }}
                        />
                      ))
                    }
                    
                    // Rellenar con barras vacías si hay menos de 6 clientes
                    const paddedCommitments = [...clientCommitments]
                    while (paddedCommitments.length < 6) {
                      paddedCommitments.push(0)
                    }
                    
                    return paddedCommitments.map((amount, i) => (
                      <div
                        key={i}
                        className="rounded-sm flex-1"
                        style={{
                          backgroundColor: amount > 0 ? 'var(--accent)' : 'var(--muted)',
                          height: amount > 0 ? `${Math.max(20, (amount / maxAmount) * 100)}%` : '10%',
                          opacity: amount > 0 ? 1 : 0.2
                        }}
                      />
                    ))
                  })()}
                </div>
                
                <div>
                  {clientAnalysis.currencyMetrics && clientAnalysis.currencyMetrics.length > 0 ? (
                    <div className="space-y-1">
                      {clientAnalysis.currencyMetrics.map((metric: any, index: number) => {
                        const currency = allCurrencies.find(c => c.id === metric.currencyId)
                        return (
                          <p key={metric.currencyId} className={`${index === 0 ? (isMobile ? 'text-lg' : 'text-2xl') : (isMobile ? 'text-sm' : 'text-lg')} font-bold`}>
                            {currency?.symbol || '$'} {Math.floor(metric.totalCommitted).toLocaleString('es-AR')}
                          </p>
                        )
                      })}
                    </div>
                  ) : (
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                      ${Math.floor(clientAnalysis.totalCommittedAmount).toLocaleString('es-AR')}
                    </p>
                  )}
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {clientAnalysis.totalCommitments} compromisos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pago a la fecha */}
          <Card>
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Pago a la fecha</p>
                  <DollarSign className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Gráfico de línea de tendencia - altura fija */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} relative`}>
                  <svg className="w-full h-full" viewBox="0 0 100 32">
                    <path
                      d="M 0,24 Q 25,20 50,12 T 100,8"
                      stroke="var(--accent)"
                      strokeWidth="2"
                      fill="none"
                      className="opacity-80"
                    />
                    <circle cx="100" cy="8" r="2" fill="var(--accent)" />
                  </svg>
                </div>
                
                <div>
                  {clientAnalysis.currencyMetrics && clientAnalysis.currencyMetrics.length > 0 ? (
                    <div className="space-y-1">
                      {clientAnalysis.currencyMetrics.map((metric: any, index: number) => {
                        const currency = allCurrencies.find(c => c.id === metric.currencyId)
                        return (
                          <p key={metric.currencyId} className={`${index === 0 ? (isMobile ? 'text-lg' : 'text-2xl') : (isMobile ? 'text-sm' : 'text-lg')} font-bold`}>
                            {currency?.symbol || '$'} {Math.floor(metric.totalPaid).toLocaleString('es-AR')}
                          </p>
                        )
                      })}
                    </div>
                  ) : (
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                      ${Math.floor(clientAnalysis.totalPaidAmount).toLocaleString('es-AR')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {clientAnalysis.paymentPercentage.toFixed(1)}% del total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saldo restante */}
          <Card>
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Saldo restante</p>
                  <CreditCard className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Barra de progreso de pagos - altura fija */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center`}>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(clientAnalysis.paymentPercentage, 100)}%`,
                        background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, var(--accent) 100%)'
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  {clientAnalysis.currencyMetrics && clientAnalysis.currencyMetrics.length > 0 ? (
                    <div className="space-y-1">
                      {clientAnalysis.currencyMetrics.map((metric: any, index: number) => {
                        const currency = allCurrencies.find(c => c.id === metric.currencyId)
                        return (
                          <p key={metric.currencyId} className={`${index === 0 ? (isMobile ? 'text-lg' : 'text-2xl') : (isMobile ? 'text-sm' : 'text-lg')} font-bold`}>
                            {currency?.symbol || '$'} {Math.floor(metric.remainingBalance).toLocaleString('es-AR')}
                          </p>
                        )
                      })}
                    </div>
                  ) : (
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                      ${Math.floor(clientAnalysis.remainingBalance).toLocaleString('es-AR')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Pendiente de pago
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* % de pago restante */}
          <Card>
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>% de pago restante</p>
                  <TrendingUp className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Gráfico de área llena - altura fija */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} relative`}>
                  <svg className="w-full h-full" viewBox="0 0 100 32">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2"/>
                      </linearGradient>
                    </defs>
                    <path
                      d={`M 0,32 L 0,${32 - (clientAnalysis.remainingPercentage * 0.3)} Q 25,${20 - (clientAnalysis.remainingPercentage * 0.2)} 50,${16 - (clientAnalysis.remainingPercentage * 0.25)} T 100,${12 - (clientAnalysis.remainingPercentage * 0.2)} L 100,32 Z`}
                      fill="url(#areaGradient)"
                    />
                  </svg>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{clientAnalysis.remainingPercentage.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">
                    Pendiente de cobro
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Desktop: Table View */}
      {commitmentSummary.length > 0 && !isMobile && (
        <div className="space-y-4">
          <Table
            data={sortedCommitmentSummary}
            columns={contactSummaryColumns}
            defaultSort={{ key: 'unit', direction: 'asc' }}
            getItemId={(item) => item.id || 'unknown'}
            rowActions={(item) => [
              {
                icon: Edit2,
                label: 'Editar',
                onClick: () => {
                  openModal('project-client', {
                    projectId,
                    organizationId,
                    editingClient: item,
                    isEditing: true
                  })
                }
              },
              {
                icon: Trash2,
                label: 'Eliminar',
                onClick: () => {
                  openModal('delete-confirmation', {
                    mode: 'dangerous',
                    title: 'Eliminar Compromiso de Pago',
                    description: `Esta acción eliminará permanentemente el compromiso de pago de ${item.contacts?.company_name || item.contacts?.full_name || 'este cliente'}. Esta acción no se puede deshacer.`,
                    itemName: item.contacts?.company_name || item.contacts?.full_name || 'Sin nombre',
                    itemType: 'compromiso',
                    destructiveActionText: 'Eliminar Compromiso',
                    onConfirm: () => deleteClientMutation.mutate(item.id)
                  })
                },
                variant: 'destructive' as const
              }
            ]}
          />
        </div>
      )}

      {/* Mobile: Row/Card View */}
      {commitmentSummary.length > 0 && isMobile && (
        <div className="space-y-3">
          <div className="space-y-3">
            {sortedCommitmentSummary.map((commitment) => (
              <ClientObligationRow
                key={commitment.id}
                obligation={commitment}
                onClick={() => {
                  openModal('project-client', {
                    projectId,
                    organizationId,
                    editingClient: commitment,
                    isEditing: true
                  })
                }}
                density="compact"
              />
            ))}
          </div>
        </div>
      )}


    </div>
  )
}