import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HandCoins } from 'lucide-react'

import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { CustomTable } from '@/components/ui-custom/misc/CustomTable'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface ProjectClient {
  id: string
  project_id: string
  client_id: string
  committed_amount: number
  currency_id: string
  role: string
  is_active: boolean
  notes: string
  created_at: string
  updated_at: string
  contact: {
    id: string
    first_name: string
    last_name: string
    company_name?: string
    email: string
    full_name?: string
  }
}

interface Currency {
  id: string
  name: string
  code: string
  symbol: string
}

export default function FinancesCommited() {
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState("")

  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.organization?.id

  // Get project clients
  const { data: projectClients, isLoading: loadingClients } = useQuery({
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
            email,
            full_name
          )
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!projectId && !!supabase
  })

  // Get organization currencies
  const { data: organizationCurrencies } = useQuery({
    queryKey: ['organization-currencies', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []
      
      const { data, error } = await supabase
        .from('organization_currencies')
        .select(`
          id,
          is_default,
          currency_id,
          currency:currencies(
            id,
            name,
            code,
            symbol
          )
        `)
        .eq('organization_id', organizationId)
        .order('is_default', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Mutation to update committed amount
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
      toast({
        title: "Monto actualizado",
        description: "El monto comprometido se ha actualizado exitosamente",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar monto",
        description: error.message || "Hubo un problema al actualizar el monto comprometido",
        variant: "destructive",
      })
    }
  })

  // Mutation to update currency
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
      toast({
        title: "Moneda actualizada",
        description: "La moneda se ha actualizado exitosamente",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar moneda",
        description: error.message || "Hubo un problema al actualizar la moneda",
        variant: "destructive",
      })
    }
  })

  // Filter and sort clients based on search
  const filteredClients = React.useMemo(() => {
    if (!projectClients) return []
    
    let filtered = projectClients
    
    if (searchValue) {
      filtered = projectClients.filter(client => {
        const contact = client.contact
        const displayName = contact?.company_name || 
                           `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim()
        return displayName.toLowerCase().includes(searchValue.toLowerCase())
      })
    }
    
    // Sort alphabetically by client name
    return filtered.sort((a, b) => {
      const nameA = a.contact?.company_name || 
                   `${a.contact?.first_name || ''} ${a.contact?.last_name || ''}`.trim()
      const nameB = b.contact?.company_name || 
                   `${b.contact?.first_name || ''} ${b.contact?.last_name || ''}`.trim()
      return nameA.toLowerCase().localeCompare(nameB.toLowerCase())
    })
  }, [projectClients, searchValue])

  // Table columns definition
  const columns = [
    {
      key: "client",
      label: "Cliente",
      width: "40%",
      sortable: true,
      render: (item: ProjectClient) => {
        const contact = item.contact
        const displayName = contact?.company_name || 
                           `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim()
        const initials = contact?.company_name 
          ? contact.company_name.charAt(0).toUpperCase()
          : `${contact?.first_name?.charAt(0) || ''}${contact?.last_name?.charAt(0) || ''}`.toUpperCase()

        return (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{displayName}</div>
              {contact?.company_name && (
                <div className="text-xs text-muted-foreground">
                  {contact.first_name} {contact.last_name}
                </div>
              )}
              <div className="text-xs text-muted-foreground">{contact?.email}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: "currency",
      label: "Moneda",
      width: "25%",
      render: (item: ProjectClient) => {
        const currentCurrency = organizationCurrencies?.find(oc => oc.currency_id === item.currency_id)
        
        return (
          <div className="text-sm">
            <Select 
              value={item.currency_id || ''} 
              onValueChange={(value) => {
                if (value !== item.currency_id) {
                  updateCurrencyMutation.mutate({ 
                    clientId: item.id, 
                    currencyId: value 
                  })
                }
              }}
            >
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="Seleccionar moneda">
                  {currentCurrency?.currency ? (
                    `${currentCurrency.currency.code} - ${currentCurrency.currency.name}`
                  ) : (
                    'Seleccionar moneda'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {organizationCurrencies?.map((orgCurrency, index) => (
                  <SelectItem 
                    key={`currency-${orgCurrency.currency?.id || index}`} 
                    value={orgCurrency.currency_id || ''}
                  >
                    {orgCurrency.currency?.code || 'N/A'} - {orgCurrency.currency?.name || 'Sin nombre'}
                    {orgCurrency.is_default && ' (Por defecto)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }
    },
    {
      key: "committed_amount",
      label: "Monto Comprometido",
      width: "35%",
      sortable: true,
      sortType: "number" as const,
      render: (item: ProjectClient) => {
        const currency = organizationCurrencies?.find(oc => oc.currency_id === item.currency_id)?.currency
        const symbol = currency?.symbol || '$'
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{symbol}</span>
            <input
              type="number"
              className="flex-1 px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={item.committed_amount || ''}
              onChange={(e) => {
                const newAmount = parseFloat(e.target.value) || 0
                updateCommittedAmountMutation.mutate({ 
                  clientId: item.id, 
                  amount: newAmount 
                })
              }}
              onBlur={(e) => {
                const newAmount = parseFloat(e.target.value) || 0
                if (newAmount !== item.committed_amount) {
                  updateCommittedAmountMutation.mutate({ 
                    clientId: item.id, 
                    amount: newAmount 
                  })
                }
              }}
            />
          </div>
        )
      }
    }
  ]

  const headerProps = {
    title: "Compromisos",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    actions: []
  }

  if (isLoading || loadingClients) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando compromisos...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Summary Card */}
        {filteredClients.length > 0 && (
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                <HandCoins className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Compromisos del Proyecto</h3>
                <p className="text-sm text-muted-foreground">
                  {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} con compromisos financieros
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Clients Table */}
        {filteredClients.length > 0 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Gestión de Compromisos</h3>
              <p className="text-sm text-muted-foreground">Configure la moneda y monto comprometido para cada cliente del proyecto</p>
            </div>
            <CustomTable
              data={filteredClients}
              columns={columns}
              defaultSort={{ key: 'client', direction: 'asc' }}
            />
          </div>
        ) : projectClients?.length === 0 ? (
          <CustomEmptyState
            title="No hay clientes en el proyecto"
            description="Primero debe agregar clientes al proyecto desde la sección Clientes"
            action={
              <Button onClick={() => window.location.href = '/project/clients'} className="mt-4">
                Ir a Gestión de Clientes
              </Button>
            }
          />
        ) : (
          <CustomEmptyState
            title="No se encontraron clientes"
            description="Intenta con otros términos de búsqueda"
          />
        )}
      </div>
    </Layout>
  )
}